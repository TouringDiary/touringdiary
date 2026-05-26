-- ==========================================
-- RPC AI RUNTIME CONSOLIDATION
-- Date: 2026-05-26
-- Purpose: Align local migrations with verified remote runtime SSOT.
-- Audit: remote DB (iyncirtysrjrmqwfmkbm) introspected via `supabase db query --linked`.
-- Does NOT drop legacy functions (check_and_increment_ai_usage, log_universal_usage).
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- increment_global_usage (ACTIVE helper — called by consume_ai_credits)
-- Remote was broken (usage_count + invalid ON CONFLICT). Align to request_count
-- and partial unique indexes ai_usage_user_unique / ai_usage_guest_unique.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_global_usage(
    p_user_id uuid,
    p_guest_id text,
    p_model_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        INSERT INTO public.ai_global_usage (user_id, date, model_type, request_count)
        VALUES (p_user_id, current_date, p_model_type, 1)
        ON CONFLICT (user_id, date, model_type) WHERE (user_id IS NOT NULL)
        DO UPDATE SET request_count = public.ai_global_usage.request_count + 1;
    ELSIF p_guest_id IS NOT NULL AND btrim(p_guest_id) <> '' THEN
        INSERT INTO public.ai_global_usage (guest_id, date, model_type, request_count)
        VALUES (p_guest_id::uuid, current_date, p_model_type, 1)
        ON CONFLICT (guest_id, date, model_type) WHERE (guest_id IS NOT NULL)
        DO UPDATE SET request_count = public.ai_global_usage.request_count + 1;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- consume_ai_credits (ACTIVE — edge functions + aiUsageService)
-- Matches verified remote runtime body (2026-04-23 v4 logic).
-- Emergency stop: global_settings.ai_emergency_stop checked BEFORE admin bypass.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_ai_credits(
    p_user_id uuid,
    p_model_type text,
    p_feature text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed boolean := false;
    v_reason text := '';
    v_source text := 'none';
    v_today date := current_date;
    v_start_date date;
    v_monthly_limit integer;
    v_used_this_month integer;
    v_daily_free_limit integer := 10;
    v_used_today integer;
    v_credit_record_id uuid;
    v_is_admin boolean := false;
    v_pricing_version_id uuid;
    v_emergency_stop_text text;
BEGIN
    -- Platform kill switch (blocks ALL callers, including admins)
    SELECT lower(trim(both '"' from coalesce(value::text, '')))
    INTO v_emergency_stop_text
    FROM public.global_settings
    WHERE key = 'ai_emergency_stop'
    LIMIT 1;

    IF v_emergency_stop_text IN ('true', 't', '1', 'yes') THEN
        RETURN json_build_object('allowed', false, 'reason', 'EMERGENCY_STOP');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND role IN ('admin_all', 'admin_limited')
    ) INTO v_is_admin;

    IF v_is_admin THEN
        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'admin');
    END IF;

    SELECT
        s.current_period_start::date,
        (pv.ai_limits->'models'->>p_model_type)::integer,
        pv.id
    INTO v_start_date, v_monthly_limit, v_pricing_version_id
    FROM public.subscriptions s
    JOIN public.pricing_versions pv ON s.pricing_version_id = pv.id
    WHERE s.user_id = p_user_id AND s.status = 'active'
    ORDER BY s.end_date DESC LIMIT 1;

    IF v_monthly_limit IS NOT NULL AND v_monthly_limit > 0 THEN
        SELECT COALESCE(sum(request_count), 0) INTO v_used_this_month
        FROM public.ai_global_usage
        WHERE user_id = p_user_id
          AND model_type = p_model_type
          AND date >= v_start_date;

        IF v_used_this_month < v_monthly_limit THEN
            PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
            RETURN json_build_object(
                'allowed', true,
                'source', 'subscription',
                'pricing_version_id', v_pricing_version_id,
                'remaining', v_monthly_limit - v_used_this_month - 1
            );
        END IF;
    END IF;

    SELECT id INTO v_credit_record_id
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND (CASE WHEN p_model_type = 'flash' THEN flash_remaining ELSE pro_remaining END) > 0
      AND expires_at > now()
    ORDER BY expires_at ASC LIMIT 1;

    IF v_credit_record_id IS NOT NULL THEN
        IF p_model_type = 'flash' THEN
            UPDATE public.user_ai_credits SET flash_remaining = flash_remaining - 1 WHERE id = v_credit_record_id;
        ELSE
            UPDATE public.user_ai_credits SET pro_remaining = pro_remaining - 1 WHERE id = v_credit_record_id;
        END IF;

        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'extra_credits', 'record_id', v_credit_record_id);
    END IF;

    SELECT (value->>'daily_free_cap')::integer INTO v_daily_free_limit
    FROM public.global_settings WHERE key = 'ai_limits_global' LIMIT 1;

    v_daily_free_limit := COALESCE(v_daily_free_limit, 10);

    SELECT COALESCE(sum(request_count), 0) INTO v_used_today
    FROM public.ai_global_usage
    WHERE user_id = p_user_id AND date = v_today;

    IF v_used_today < v_daily_free_limit THEN
        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'free_tier', 'remaining', v_daily_free_limit - v_used_today - 1);
    END IF;

    RETURN json_build_object('allowed', false, 'reason', 'CREDITS_EXHAUSTED');
END;
$$;

-- ---------------------------------------------------------------------------
-- log_ai_usage_tokens (ACTIVE — edge functions + aiUsageService)
-- Matches verified remote runtime body.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_ai_usage_tokens(
    p_user_id uuid,
    p_feature_name text,
    p_model_name text,
    p_prompt_tokens integer,
    p_completion_tokens integer,
    p_total_tokens integer,
    p_estimated_cost_eur numeric,
    p_pricing_version_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ai_usage_logs (
        user_id,
        feature_name,
        model_name,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_eur,
        pricing_version_id
    )
    VALUES (
        p_user_id,
        p_feature_name,
        p_model_name,
        p_prompt_tokens,
        p_completion_tokens,
        p_total_tokens,
        p_estimated_cost_eur,
        p_pricing_version_id
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- get_current_ai_quota (ACTIVE — HeaderCreditsIndicator)
-- Remote SSOT includes profiles.extra_quota (columns still present on remote).
-- Local file 20260423112000 was stale vs production.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_ai_quota(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_flash_total integer := 0;
    v_pro_total integer := 0;
    v_flash_limit integer := 0;
    v_pro_limit integer := 0;
    v_start_date date;
    v_flash_used_sub integer := 0;
    v_pro_used_sub integer := 0;
    v_extra_flash integer := 0;
    v_extra_pro integer := 0;
    v_admin_extra_quota integer := 0;
    v_subscription_flash_remaining integer := 0;
    v_subscription_pro_remaining integer := 0;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'extra_quota'
    ) THEN
        SELECT COALESCE(extra_quota, 0)
        INTO v_admin_extra_quota
        FROM public.profiles
        WHERE id = p_user_id
          AND (extra_quota_expires_at IS NULL OR extra_quota_expires_at > now());
    END IF;

    SELECT
        s.current_period_start::date,
        (pv.ai_limits->'models'->>'flash')::integer,
        (pv.ai_limits->'models'->>'pro')::integer
    INTO v_start_date, v_flash_limit, v_pro_limit
    FROM public.subscriptions s
    JOIN public.pricing_versions pv ON s.pricing_version_id = pv.id
    WHERE s.user_id = p_user_id AND s.status = 'active'
    ORDER BY s.end_date DESC LIMIT 1;

    IF v_start_date IS NOT NULL THEN
        SELECT COALESCE(sum(request_count), 0) INTO v_flash_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'flash' AND date >= v_start_date;

        SELECT COALESCE(sum(request_count), 0) INTO v_pro_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'pro' AND date >= v_start_date;

        v_subscription_flash_remaining := GREATEST(0, v_flash_limit - v_flash_used_sub);
        v_subscription_pro_remaining := GREATEST(0, v_pro_limit - v_pro_used_sub);
        v_flash_total := v_subscription_flash_remaining;
        v_pro_total := v_subscription_pro_remaining;
    END IF;

    SELECT
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_extra_flash, v_extra_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id AND expires_at > now();

    v_flash_total := v_flash_total + v_extra_flash + v_admin_extra_quota;
    v_pro_total := v_pro_total + v_extra_pro;

    RETURN json_build_object(
        'flash_remaining', v_flash_total,
        'pro_remaining', v_pro_total,
        'flash_limit', COALESCE(v_flash_limit, 0),
        'pro_limit', COALESCE(v_pro_limit, 0),
        'has_active_subscription', (v_start_date IS NOT NULL),
        'admin_extra_quota', v_admin_extra_quota,
        'subscription_flash_remaining', v_subscription_flash_remaining,
        'subscription_pro_remaining', v_subscription_pro_remaining,
        'extra_credit_packs_flash_remaining', v_extra_flash,
        'extra_credit_packs_pro_remaining', v_extra_pro,
        'admin_bonus_flash_remaining', v_admin_extra_quota,
        'admin_bonus_pro_remaining', 0,
        'total_remaining', v_flash_total + v_pro_total
    );
END;
$$;

-- Default emergency stop off (idempotent; never overwrites an existing row)
INSERT INTO public.global_settings (key, value)
VALUES ('ai_emergency_stop', 'false')
ON CONFLICT (key) DO NOTHING;

COMMIT;
