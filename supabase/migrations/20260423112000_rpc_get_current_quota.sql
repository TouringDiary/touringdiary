-- ==========================================
-- RPC: get_current_ai_quota
-- Date: 2026-04-23
-- Description: Recupero saldi crediti totali (Sub + Extra)
-- ==========================================

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
BEGIN
    -- 1. Quota da Subscription
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
        -- Calcolo rimanente subscription
        SELECT COALESCE(sum(request_count), 0) INTO v_flash_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'flash' AND date >= v_start_date;

        SELECT COALESCE(sum(request_count), 0) INTO v_pro_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'pro' AND date >= v_start_date;

        v_flash_total := GREATEST(0, v_flash_limit - v_flash_used_sub);
        v_pro_total := GREATEST(0, v_pro_limit - v_pro_used_sub);
    END IF;

    -- 2. Quota da Extra Credits (Non scaduti)
    SELECT 
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_extra_flash, v_extra_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id AND expires_at > now();

    v_flash_total := v_flash_total + v_extra_flash;
    v_pro_total := v_pro_total + v_extra_pro;

    RETURN json_build_object(
        'flash_remaining', v_flash_total,
        'pro_remaining', v_pro_total,
        'flash_limit', COALESCE(v_flash_limit, 0),
        'pro_limit', COALESCE(v_pro_limit, 0),
        'has_active_subscription', (v_start_date IS NOT NULL)
    );
END;
$$;
