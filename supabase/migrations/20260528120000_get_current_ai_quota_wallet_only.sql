-- ==========================================
-- WALLET-ONLY: get_current_ai_quota bucket split
-- Date: 2026-05-28
-- Purpose: BONUS/EXTRA from user_ai_credits by source; remove profiles.extra_quota branch.
-- Does NOT alter consume_ai_credits, grant_admin_ai_credits, Stripe, or analytics RPCs.
-- ==========================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_current_ai_quota(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    v_bonus_flash integer := 0;
    v_bonus_pro integer := 0;
    v_subscription_flash_remaining integer := 0;
    v_subscription_pro_remaining integer := 0;
BEGIN
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

    -- BONUS bucket: admin grants (source = bonus)
    SELECT
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_bonus_flash, v_bonus_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND source = 'bonus'::public.ai_credit_source;

    -- EXTRA bucket: purchase, promo, referral, etc. (everything except bonus)
    SELECT
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_extra_flash, v_extra_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND (source IS NULL OR source <> 'bonus'::public.ai_credit_source);

    v_flash_total := v_flash_total + v_extra_flash + v_bonus_flash;
    v_pro_total := v_pro_total + v_extra_pro + v_bonus_pro;

    RETURN json_build_object(
        'flash_remaining', v_flash_total,
        'pro_remaining', v_pro_total,
        'flash_limit', COALESCE(v_flash_limit, 0),
        'pro_limit', COALESCE(v_pro_limit, 0),
        'has_active_subscription', (v_start_date IS NOT NULL),
        'admin_extra_quota', 0,
        'subscription_flash_remaining', v_subscription_flash_remaining,
        'subscription_pro_remaining', v_subscription_pro_remaining,
        'extra_credit_packs_flash_remaining', v_extra_flash,
        'extra_credit_packs_pro_remaining', v_extra_pro,
        'admin_bonus_flash_remaining', v_bonus_flash,
        'admin_bonus_pro_remaining', v_bonus_pro,
        'total_remaining', v_flash_total + v_pro_total
    );
END;
$$;

COMMIT;
