-- ==========================================
-- RPC: consume_ai_credits (v4)
-- Date: 2026-04-23
-- Description: Centralizzazione logica consumo AI
-- ==========================================

CREATE OR REPLACE FUNCTION public.consume_ai_credits(
    p_user_id uuid,
    p_model_type text, -- 'flash', 'pro'
    p_feature text     -- 'planner', 'roadbook', 'chat', 'vision'
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
    v_daily_free_limit integer := 10; -- Default fallback
    v_used_today integer;
    v_credit_record_id uuid;
    v_is_admin boolean := false;
    v_pricing_version_id uuid;
BEGIN
    -- 0. Check se Admin (Illimitato per ora)
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND role IN ('admin_all', 'admin_limited')
    ) INTO v_is_admin;

    IF v_is_admin THEN
        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'admin');
    END IF;

    -- 1. Verifica Subscription (Monthly Quota)
    -- Cerchiamo la subscription attiva e la versione di pricing associata
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
        -- Conta utilizzi nel periodo corrente (SSOT)
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

    -- 2. Verifica user_ai_credits (Extra / Burst)
    -- Cerchiamo il pacchetto non scaduto che scade prima
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

    -- 3. Verifica Free Tier Quota (Daily Cap)
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

    -- 4. Fallimento
    RETURN json_build_object('allowed', false, 'reason', 'CREDITS_EXHAUSTED');
END;
$$;

-- Helper function per incrementare usage globale (SSOT)
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
    INSERT INTO public.ai_global_usage (user_id, guest_id, date, model_type, request_count)
    VALUES (p_user_id, p_guest_id, current_date, p_model_type, 1)
    ON CONFLICT (user_id, guest_id, date, model_type) 
    DO UPDATE SET request_count = public.ai_global_usage.request_count + 1;
END;
$$;
