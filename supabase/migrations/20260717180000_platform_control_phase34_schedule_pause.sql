-- =============================================================================
-- WF-02 STEP-3 Fase 3.4 — Schedule pause flag + supports_schedule mutate guard
-- =============================================================================
BEGIN;

INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key
) VALUES
    (
        'feature.platform.schedules_paused',
        'platform',
        'Programmazioni in pausa',
        'boolean',
        'false'::jsonb,
        false,
        false,
        NULL,
        NULL
    )
ON CONFLICT (key) DO NOTHING;

-- Reject schedule patches when the flag does not support scheduling
CREATE OR REPLACE FUNCTION public.mutate_platform_feature_flag(
    p_key text,
    p_patch jsonb,
    p_reason text DEFAULT NULL
)
RETURNS public.platform_feature_flags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.platform_feature_flags%ROWTYPE;
    v_before jsonb;
    v_after jsonb;
    v_new_manual jsonb;
    v_new_schedules jsonb;
    v_new_audience text[];
    v_new_blocked text[];
    v_patch_key text;
    v_manual_type text;
    v_sched jsonb;
    v_sched_start timestamptz;
    v_sched_end timestamptz;
BEGIN
    IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
        RAISE EXCEPTION 'Only platform admins can mutate feature flags'
            USING ERRCODE = '42501';
    END IF;

    IF p_key IS NULL OR btrim(p_key) = '' THEN
        RAISE EXCEPTION 'Feature flag key is required' USING ERRCODE = 'P0001';
    END IF;

    IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
        RAISE EXCEPTION 'Patch must be a JSON object' USING ERRCODE = 'P0001';
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
        IF NOT v_row.supports_schedule THEN
            RAISE EXCEPTION 'Flag % does not support schedules', p_key USING ERRCODE = 'P0001';
        END IF;

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

COMMIT;
