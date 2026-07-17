-- ==========================================
-- WF-02 STEP-3 Fase 3.1 — Configuration Source + audit (DOC 30)
-- Date: 2026-07-17
-- Closes: Feature Flag Engine infra; platform_control_audit; seed catalog v1
-- Out of scope: macro-sezioni UI operative (Fase 3.2+); consumer wiring completo
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. platform_feature_flags — Configuration Source (logical keys)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_feature_flags (
    key text PRIMARY KEY,
    category text NOT NULL,
    label text NOT NULL,
    value_type text NOT NULL CHECK (value_type IN ('boolean', 'number')),
    default_value jsonb NOT NULL,
    supports_schedule boolean NOT NULL DEFAULT false,
    supports_audience boolean NOT NULL DEFAULT false,
    manual_override jsonb,
    schedules jsonb NOT NULL DEFAULT '[]'::jsonb,
    audience text[] NOT NULL DEFAULT '{}'::text[],
    blocked_audiences text[] NOT NULL DEFAULT '{}'::text[],
    message_key text,
    audit_required boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    CONSTRAINT platform_feature_flags_key_not_blank CHECK (char_length(btrim(key)) > 0),
    CONSTRAINT platform_feature_flags_label_not_blank CHECK (char_length(btrim(label)) > 0)
);

CREATE INDEX IF NOT EXISTS platform_feature_flags_category_idx
    ON public.platform_feature_flags (category);

COMMENT ON TABLE public.platform_feature_flags IS
    'Configuration Source — Feature Flag Engine (DOC 30). Chiavi logiche indipendenti da global_settings legacy.';

ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_feature_flags_read ON public.platform_feature_flags;
CREATE POLICY platform_feature_flags_read
    ON public.platform_feature_flags
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Mutations only via SECURITY DEFINER RPC (no direct client writes).

-- ---------------------------------------------------------------------------
-- 2. platform_control_audit — audit stream (DL-P05)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_control_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    config_key text NOT NULL,
    action text NOT NULL,
    value_before jsonb,
    value_after jsonb,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT platform_control_audit_config_key_not_blank
        CHECK (char_length(btrim(config_key)) > 0),
    CONSTRAINT platform_control_audit_action_not_blank
        CHECK (char_length(btrim(action)) > 0)
);

CREATE INDEX IF NOT EXISTS platform_control_audit_created_idx
    ON public.platform_control_audit (created_at DESC);

CREATE INDEX IF NOT EXISTS platform_control_audit_config_key_idx
    ON public.platform_control_audit (config_key, created_at DESC);

ALTER TABLE public.platform_control_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_control_audit_admin_read ON public.platform_control_audit;
CREATE POLICY platform_control_audit_admin_read
    ON public.platform_control_audit
    FOR SELECT
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

COMMENT ON TABLE public.platform_control_audit IS
    'Audit obbligatorio mutazioni Centro di Controllo (DL-P05).';

-- ---------------------------------------------------------------------------
-- 3. record_platform_control_audit — helper SECURITY DEFINER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_platform_control_audit(
    p_config_key text,
    p_action text,
    p_value_before jsonb DEFAULT NULL,
    p_value_after jsonb DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF p_config_key IS NULL OR btrim(p_config_key) = '' THEN
        RAISE EXCEPTION 'config_key is required' USING ERRCODE = 'P0001';
    END IF;

    IF p_action IS NULL OR btrim(p_action) = '' THEN
        RAISE EXCEPTION 'action is required' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.platform_control_audit (
        actor_id,
        config_key,
        action,
        value_before,
        value_after,
        reason
    )
    VALUES (
        auth.uid(),
        btrim(p_config_key),
        btrim(p_action),
        p_value_before,
        p_value_after,
        NULLIF(btrim(COALESCE(p_reason, '')), '')
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_platform_control_audit(text, text, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_platform_control_audit(text, text, jsonb, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_platform_control_audit(text, text, jsonb, jsonb, text)
    TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. mutate_platform_feature_flag — admin_all write + mandatory audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mutate_platform_feature_flag(
    p_key text,
    p_patch jsonb,
    p_reason text DEFAULT NULL
)
RETURNS public.platform_feature_flags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.platform_feature_flags;
    v_before jsonb;
    v_after jsonb;
    v_new_manual jsonb;
    v_new_schedules jsonb;
    v_new_audience text[];
    v_new_blocked text[];
    v_patch_key text;
    v_sched jsonb;
    v_sched_start timestamptz;
    v_sched_end timestamptz;
    v_manual_type text;
BEGIN
    IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
        RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_caller AND p.role = 'admin_all'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN: admin_all write required for Centro di Controllo' USING ERRCODE = '42501';
    END IF;

    IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
        RAISE EXCEPTION 'p_patch must be a JSON object' USING ERRCODE = 'P0001';
    END IF;

    FOR v_patch_key IN SELECT jsonb_object_keys(p_patch)
    LOOP
        IF v_patch_key NOT IN ('manual_override', 'schedules', 'audience', 'blocked_audiences') THEN
            RAISE EXCEPTION 'Unsupported patch key: %', v_patch_key USING ERRCODE = 'P0001';
        END IF;
    END LOOP;

    SELECT * INTO v_row FROM public.platform_feature_flags WHERE key = p_key FOR UPDATE;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Unknown feature flag key: %', p_key USING ERRCODE = 'P0002';
    END IF;

    v_before := to_jsonb(v_row);

    v_new_manual := v_row.manual_override;
    IF p_patch ? 'manual_override' THEN
        IF p_patch->'manual_override' IS NULL
           OR p_patch->>'manual_override' IS NULL
           OR jsonb_typeof(p_patch->'manual_override') = 'null' THEN
            v_new_manual := NULL;
        ELSE
            v_manual_type := jsonb_typeof(p_patch->'manual_override');
            IF v_row.value_type = 'boolean' THEN
                IF v_manual_type <> 'boolean' THEN
                    RAISE EXCEPTION 'manual_override must be boolean for key %', p_key
                        USING ERRCODE = 'P0001';
                END IF;
            ELSIF v_row.value_type = 'number' THEN
                IF v_manual_type <> 'number' THEN
                    RAISE EXCEPTION 'manual_override must be number for key %', p_key
                        USING ERRCODE = 'P0001';
                END IF;
            ELSE
                RAISE EXCEPTION 'Unknown value_type for key %', p_key USING ERRCODE = 'P0001';
            END IF;
            v_new_manual := p_patch->'manual_override';
        END IF;
    END IF;

    v_new_schedules := v_row.schedules;
    IF p_patch ? 'schedules' THEN
        IF jsonb_typeof(COALESCE(p_patch->'schedules', 'null'::jsonb)) <> 'array' THEN
            RAISE EXCEPTION 'schedules must be a JSON array' USING ERRCODE = 'P0001';
        END IF;

        v_new_schedules := COALESCE(p_patch->'schedules', '[]'::jsonb);

        FOR v_sched IN SELECT value FROM jsonb_array_elements(v_new_schedules)
        LOOP
            IF jsonb_typeof(v_sched) <> 'object' THEN
                RAISE EXCEPTION 'Each schedule entry must be a JSON object' USING ERRCODE = 'P0001';
            END IF;

            IF NOT (v_sched ? 'id')
               OR NOT (v_sched ? 'startsAt')
               OR NOT (v_sched ? 'endsAt')
               OR NOT (v_sched ? 'value') THEN
                RAISE EXCEPTION 'Schedule entry missing required fields (id, startsAt, endsAt, value)'
                    USING ERRCODE = 'P0001';
            END IF;

            IF jsonb_typeof(v_sched->'id') <> 'string'
               OR btrim(v_sched->>'id') = '' THEN
                RAISE EXCEPTION 'Schedule id must be a non-empty string' USING ERRCODE = 'P0001';
            END IF;

            BEGIN
                v_sched_start := (v_sched->>'startsAt')::timestamptz;
                v_sched_end := (v_sched->>'endsAt')::timestamptz;
            EXCEPTION
                WHEN others THEN
                    RAISE EXCEPTION 'Schedule dates must be valid timestamptz (startsAt, endsAt)'
                        USING ERRCODE = 'P0001';
            END;

            IF v_sched_start IS NULL OR v_sched_end IS NULL THEN
                RAISE EXCEPTION 'Schedule dates must be valid timestamptz (startsAt, endsAt)'
                    USING ERRCODE = 'P0001';
            END IF;

            IF NOT (v_sched_start < v_sched_end) THEN
                RAISE EXCEPTION 'Schedule startsAt must be earlier than endsAt'
                    USING ERRCODE = 'P0001';
            END IF;

            IF v_row.value_type = 'boolean' AND jsonb_typeof(v_sched->'value') <> 'boolean' THEN
                RAISE EXCEPTION 'Schedule value must be boolean for key %', p_key
                    USING ERRCODE = 'P0001';
            END IF;

            IF v_row.value_type = 'number' AND jsonb_typeof(v_sched->'value') <> 'number' THEN
                RAISE EXCEPTION 'Schedule value must be number for key %', p_key
                    USING ERRCODE = 'P0001';
            END IF;
        END LOOP;
    END IF;

    v_new_audience := v_row.audience;
    IF p_patch ? 'audience' THEN
        IF jsonb_typeof(COALESCE(p_patch->'audience', 'null'::jsonb)) <> 'array' THEN
            RAISE EXCEPTION 'audience must be a JSON array' USING ERRCODE = 'P0001';
        END IF;
        SELECT COALESCE(array_agg(elem), '{}'::text[])
        INTO v_new_audience
        FROM jsonb_array_elements_text(COALESCE(p_patch->'audience', '[]'::jsonb)) AS elem;
    END IF;

    v_new_blocked := v_row.blocked_audiences;
    IF p_patch ? 'blocked_audiences' THEN
        IF jsonb_typeof(COALESCE(p_patch->'blocked_audiences', 'null'::jsonb)) <> 'array' THEN
            RAISE EXCEPTION 'blocked_audiences must be a JSON array' USING ERRCODE = 'P0001';
        END IF;
        SELECT COALESCE(array_agg(elem), '{}'::text[])
        INTO v_new_blocked
        FROM jsonb_array_elements_text(COALESCE(p_patch->'blocked_audiences', '[]'::jsonb)) AS elem;
    END IF;

    UPDATE public.platform_feature_flags
    SET
        manual_override = v_new_manual,
        schedules = v_new_schedules,
        audience = v_new_audience,
        blocked_audiences = v_new_blocked,
        updated_at = now(),
        updated_by = v_caller
    WHERE key = p_key
    RETURNING * INTO v_row;

    v_after := to_jsonb(v_row);

    IF v_row.audit_required THEN
        PERFORM public.record_platform_control_audit(
            p_key,
            'mutate',
            v_before,
            v_after,
            p_reason
        );
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.mutate_platform_feature_flag(text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mutate_platform_feature_flag(text, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mutate_platform_feature_flag(text, jsonb, text)
    TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Seed — catalogo Feature Flags v1 (DOC 30 DL-P11)
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key
) VALUES
    ('feature.ai.users', 'ai', 'AI Utente', 'boolean', 'true'::jsonb, true, true, NULL, 'ai_disabled_user'),
    ('feature.ai.admin_all', 'ai', 'AI Admin All', 'boolean', 'true'::jsonb, true, true, NULL, 'ai_disabled_admin'),
    ('feature.ai.admin_limited', 'ai', 'AI Admin Limited', 'boolean', 'true'::jsonb, true, true, NULL, 'ai_disabled_admin_limited'),
    ('feature.ai.emergency', 'ai', 'Stop emergenza AI', 'boolean', 'false'::jsonb, true, false, NULL, 'ai_emergency_notice'),
    ('feature.economy.credit_purchase', 'economy', 'Acquisto crediti AI', 'boolean', 'true'::jsonb, true, true, NULL, 'credits_purchase_paused'),
    ('feature.economy.subscriptions', 'economy', 'Abbonamenti premium', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.comms.admin_partner', 'comms', 'Chat Admin↔Partner', 'boolean', 'true'::jsonb, true, true, NULL, 'comms_partner_chat_disabled'),
    ('feature.comms.user_sponsor', 'comms', 'Chat Utente↔Sponsor', 'boolean', 'false'::jsonb, true, true, NULL, 'comms_user_sponsor_disabled'),
    ('feature.comms.notifications', 'comms', 'Notifiche in-app', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.sponsor.applications', 'sponsor', 'Nuove candidature Sponsor', 'boolean', 'true'::jsonb, true, true, NULL, 'sponsor_applications_paused'),
    ('feature.sponsor.shop_public', 'sponsor', 'Shop partner pubblici', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('threshold.sponsor_rating_alert_stars', 'sponsor', 'Soglia rating alert (stelle)', 'number', '3'::jsonb, false, false, NULL, NULL),
    ('feature.moderation.reviews', 'moderation', 'Recensioni utenti', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.moderation.photos', 'moderation', 'Upload foto', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.moderation.suggestions', 'moderation', 'Segnalazioni utenti', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.moderation.community_posts', 'moderation', 'Post community', 'boolean', 'true'::jsonb, true, true, NULL, NULL),
    ('feature.platform.maintenance', 'platform', 'Modalità manutenzione', 'boolean', 'false'::jsonb, true, false, NULL, 'maintenance_ticker_message'),
    ('feature.platform.registration', 'platform', 'Registrazione nuovi utenti', 'boolean', 'true'::jsonb, true, true, NULL, 'registration_closed'),
    ('feature.platform.onboarding', 'platform', 'Onboarding guidato', 'boolean', 'true'::jsonb, false, true, NULL, NULL),
    ('feature.platform.collaboration_live', 'platform', 'Collaborazione live', 'boolean', 'true'::jsonb, true, true, NULL, NULL)
ON CONFLICT (key) DO NOTHING;

COMMIT;
