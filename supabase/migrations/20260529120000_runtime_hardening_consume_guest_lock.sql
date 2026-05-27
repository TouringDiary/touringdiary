-- ==========================================
-- RUNTIME HARDENING: guest governance + wallet row lock
-- Date: 2026-05-29
-- C2: p_guest_id + free tier for anonymous (ai_global_usage.guest_id)
-- C4: SELECT ... FOR UPDATE on user_ai_credits debit
-- Does NOT drop legacy RPCs or alter Stripe / grant flows.
-- ==========================================

BEGIN;

CREATE OR REPLACE FUNCTION public.consume_ai_credits(
    p_user_id uuid,
    p_model_type text,
    p_feature text,
    p_guest_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_reason text := '';
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
    v_guest_uuid uuid;
    v_guest_id_trim text;
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

    v_guest_id_trim := NULLIF(btrim(coalesce(p_guest_id, '')), '');

    -- -------------------------------------------------------------------------
    -- Guest-only path (no registered user): wallet/subscription N/A, free tier only
    -- -------------------------------------------------------------------------
    IF p_user_id IS NULL THEN
        IF v_guest_id_trim IS NULL THEN
            RETURN json_build_object('allowed', false, 'reason', 'GUEST_ID_REQUIRED');
        END IF;

        BEGIN
            v_guest_uuid := v_guest_id_trim::uuid;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RETURN json_build_object('allowed', false, 'reason', 'INVALID_GUEST_ID');
        END;

        SELECT (value->>'daily_free_cap')::integer INTO v_daily_free_limit
        FROM public.global_settings WHERE key = 'ai_limits_global' LIMIT 1;

        v_daily_free_limit := COALESCE(v_daily_free_limit, 10);

        SELECT COALESCE(sum(request_count), 0) INTO v_used_today
        FROM public.ai_global_usage
        WHERE guest_id = v_guest_uuid AND date = v_today;

        IF v_used_today < v_daily_free_limit THEN
            PERFORM public.increment_global_usage(NULL, v_guest_id_trim, p_model_type);
            RETURN json_build_object(
                'allowed', true,
                'source', 'free_tier_guest',
                'remaining', v_daily_free_limit - v_used_today - 1
            );
        END IF;

        RETURN json_build_object('allowed', false, 'reason', 'CREDITS_EXHAUSTED');
    END IF;

    -- -------------------------------------------------------------------------
    -- Registered user path
    -- -------------------------------------------------------------------------
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

    -- C4: row lock before wallet debit (parallel admin / Promise.all safe)
    SELECT id INTO v_credit_record_id
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND (CASE WHEN p_model_type = 'flash' THEN flash_remaining ELSE pro_remaining END) > 0
      AND expires_at > now()
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE;

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

COMMIT;
