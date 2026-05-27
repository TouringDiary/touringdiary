-- ==========================================
-- FASE 1 — Security & Governance Hardening (pre-go-live)
-- Date: 2026-05-30
-- Closes: wallet spoof, quota enumeration, analytics RPC leak, guest rotate abuse vectors
-- Does NOT alter business logic paths (wallet-first, emergency stop, FOR UPDATE).
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helpers (idempotent — is_td_admin may already exist on remote SSOT)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_td_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_uid
          AND role IN ('admin_all', 'admin_limited')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'role') = 'service_role',
        false
    );
$$;

-- ---------------------------------------------------------------------------
-- TASK 1: consume_ai_credits — bind p_user_id to auth.uid(); block guest bypass
-- ---------------------------------------------------------------------------
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

    -- Registered users cannot use guest path to bypass wallet (service_role exempt)
    IF p_user_id IS NULL
       AND auth.uid() IS NOT NULL
       AND NOT public.is_service_role() THEN
        RETURN json_build_object('allowed', false, 'reason', 'FORBIDDEN');
    END IF;

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
    -- Registered user path — auth binding (service_role exempt for edge/admin tooling)
    -- -------------------------------------------------------------------------
    IF NOT public.is_service_role() THEN
        IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
            RETURN json_build_object('allowed', false, 'reason', 'FORBIDDEN');
        END IF;
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

-- ---------------------------------------------------------------------------
-- TASK 2: get_current_ai_quota — owner or admin only
-- ---------------------------------------------------------------------------
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
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN: authentication required'
                USING ERRCODE = '42501';
        END IF;
        IF p_user_id IS DISTINCT FROM v_caller AND NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: cannot read another user wallet'
                USING ERRCODE = '42501';
        END IF;
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
    INTO v_bonus_flash, v_bonus_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND source = 'bonus'::public.ai_credit_source;

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

-- ---------------------------------------------------------------------------
-- TASK 4: Admin analytics RPC hardening
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ai_economics_stats_v4()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_revenue_30d numeric := 0;
    v_total_costs_30d numeric := 0;
    v_feature_stats json;
    v_model_stats json;
    v_user_type_stats json;
    v_daily_trends json;
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT COALESCE(sum(price_paid), 0) INTO v_revenue_30d
    FROM public.subscriptions
    WHERE status = 'active' AND current_period_start >= now() - interval '30 days';

    v_revenue_30d := v_revenue_30d + (
        SELECT COALESCE(sum(amount_eur), 0)
        FROM public.credit_transactions
        WHERE status = 'completed' AND created_at >= now() - interval '30 days'
    );

    SELECT json_agg(t) INTO v_feature_stats
    FROM (
        SELECT
            feature_name,
            count(*) as request_count,
            round(avg(total_tokens)) as avg_tokens,
            round(sum(estimated_cost_eur), 4) as total_cost,
            round(avg(estimated_cost_eur), 4) as avg_cost
        FROM public.ai_usage_logs
        WHERE created_at >= now() - interval '30 days'
        GROUP BY feature_name
    ) t;

    SELECT json_agg(t) INTO v_model_stats
    FROM (
        SELECT
            model_name,
            sum(total_tokens) as total_tokens,
            round(sum(estimated_cost_eur), 4) as total_cost,
            count(*) as request_count
        FROM public.ai_usage_logs
        WHERE created_at >= now() - interval '30 days'
        GROUP BY model_name
    ) t;

    SELECT json_agg(t) INTO v_user_type_stats
    FROM (
        SELECT
            COALESCE(p.role, 'guest') as user_role,
            count(*) as request_count,
            round(sum(l.estimated_cost_eur), 4) as total_cost
        FROM public.ai_usage_logs l
        LEFT JOIN public.profiles p ON l.user_id = p.id
        WHERE l.created_at >= now() - interval '30 days'
        GROUP BY COALESCE(p.role, 'guest')
    ) t;

    SELECT json_agg(t) INTO v_daily_trends
    FROM (
        SELECT
            created_at::date as date,
            count(*) as requests,
            round(sum(estimated_cost_eur), 4) as cost
        FROM public.ai_usage_logs
        WHERE created_at >= now() - interval '14 days'
        GROUP BY created_at::date
        ORDER BY created_at::date ASC
    ) t;

    SELECT COALESCE(sum(estimated_cost_eur), 0) INTO v_total_costs_30d
    FROM public.ai_usage_logs
    WHERE created_at >= now() - interval '30 days';

    RETURN json_build_object(
        'revenue_30d', v_revenue_30d,
        'costs_30d', v_total_costs_30d,
        'margin_30d', v_revenue_30d - v_total_costs_30d,
        'feature_stats', v_feature_stats,
        'model_stats', v_model_stats,
        'user_type_stats', v_user_type_stats,
        'daily_trends', v_daily_trends,
        'updated_at', now()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_control_tower_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result json;
    v_today date := current_date;
    v_seven_days_ago date := current_date - interval '7 days';
    v_thirty_days_ago date := current_date - interval '30 days';
    v_first_day_this_month date := date_trunc('month', current_date)::date;
    v_first_day_last_month date := (date_trunc('month', current_date) - interval '1 month')::date;
    v_last_day_last_month date := (date_trunc('month', current_date) - interval '1 day')::date;
    v_sponsor_active integer;
    v_sponsor_pending integer;
    v_sponsor_expired_no_reactivation integer;
    v_revenue_active_current numeric;
    v_revenue_last_30_days numeric;
    v_target_margin numeric;
    v_churn_rate numeric;
    v_recovery_rate numeric;
    v_monthly_budget_cap numeric;
    v_costs_30d json;
    v_trends json;
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT (value::json->>'target_margin')::numeric INTO v_target_margin FROM public.global_settings WHERE key = 'economics_target_margin_percent';
    SELECT (value::json->>'churn_rate')::numeric INTO v_churn_rate FROM public.global_settings WHERE key = 'economics_churn_rate_estimate';
    SELECT (value::json->>'recovery_rate')::numeric INTO v_recovery_rate FROM public.global_settings WHERE key = 'economics_recovery_rate_estimate';
    SELECT (value::json->>'budget_cap')::numeric INTO v_monthly_budget_cap FROM public.global_settings WHERE key = 'economics_monthly_budget_cap';

    v_target_margin := COALESCE(v_target_margin, 0.60);
    v_churn_rate := COALESCE(v_churn_rate, 0.05);
    v_recovery_rate := COALESCE(v_recovery_rate, 0.15);
    v_monthly_budget_cap := COALESCE(v_monthly_budget_cap, 500.00);

    SELECT count(*) INTO v_sponsor_active FROM public.subscriptions WHERE status = 'active';
    SELECT count(*) INTO v_sponsor_pending FROM public.subscriptions WHERE status = 'pending';

    SELECT count(DISTINCT s1.user_id) INTO v_sponsor_expired_no_reactivation
    FROM public.subscriptions s1
    WHERE s1.status IN ('expired', 'cancelled')
    AND NOT EXISTS (
        SELECT 1
        FROM public.subscriptions s2
        WHERE s2.user_id = s1.user_id
        AND s2.status = 'active'
        AND s2.start_date > s1.end_date
    );

    SELECT COALESCE(sum(price_paid), 0) INTO v_revenue_active_current FROM public.subscriptions WHERE status = 'active';
    SELECT COALESCE(sum(price_paid), 0) INTO v_revenue_last_30_days FROM public.subscriptions WHERE status = 'active' AND start_date >= v_thirty_days_ago;

    WITH cost_map AS (
        SELECT model, cost_per_request FROM public.ai_model_prices
    ),
    active_subs AS (
        SELECT user_id FROM public.subscriptions WHERE status = 'active'
    ),
    usage_breakdown AS (
        SELECT
            u.date,
            u.request_count,
            u.model_type,
            (u.request_count * c.cost_per_request) as cost,
            CASE
                WHEN u.user_id IS NULL THEN 'guest'
                WHEN p.role IN ('admin_all', 'admin_limited') THEN 'admin'
                WHEN p.role = 'business' OR ash.user_id IS NOT NULL THEN 'sponsor'
                ELSE 'free'
            END as category
        FROM public.ai_global_usage u
        LEFT JOIN public.profiles p ON u.user_id = p.id
        LEFT JOIN active_subs ash ON u.user_id = ash.user_id
        JOIN cost_map c ON u.model_type = c.model
    )
    SELECT json_build_object(
        'total', COALESCE(sum(cost), 0),
        'guest', COALESCE(sum(cost) FILTER (WHERE category = 'guest'), 0),
        'free', COALESCE(sum(cost) FILTER (WHERE category = 'free'), 0),
        'sponsor', COALESCE(sum(cost) FILTER (WHERE category = 'sponsor'), 0),
        'admin', COALESCE(sum(cost) FILTER (WHERE category = 'admin'), 0),
        'requests', COALESCE(sum(request_count) FILTER (WHERE category = 'sponsor'), 0)
    ) INTO v_costs_30d
    FROM usage_breakdown
    WHERE date >= v_thirty_days_ago;

    WITH monthly_costs AS (
        SELECT
            to_char(date, 'YYYY-MM') as month,
            sum(u.request_count * c.cost_per_request) as cost
        FROM public.ai_global_usage u
        JOIN public.ai_model_prices c ON u.model_type = c.model
        GROUP BY 1
    )
    SELECT json_object_agg(month, cost) INTO v_trends FROM monthly_costs;

    v_result := json_build_object(
        'sponsor_stats', json_build_object(
            'active_count', v_sponsor_active,
            'pending_count', v_sponsor_pending,
            'expired_no_reactivation', v_sponsor_expired_no_reactivation,
            'recoverable_estimate', (v_sponsor_expired_no_reactivation * v_recovery_rate)
        ),
        'financial_kpis', json_build_object(
            'revenue_mrr', v_revenue_active_current,
            'revenue_30d', v_revenue_last_30_days,
            'costs_30d', v_costs_30d,
            'margin_total', (v_revenue_active_current - (v_costs_30d->>'total')::numeric),
            'margin_percent', CASE
                WHEN v_revenue_active_current > 0 THEN (v_revenue_active_current - (v_costs_30d->>'total')::numeric) / v_revenue_active_current
                ELSE 0
            END,
            'unit_profitability', CASE
                WHEN (v_costs_30d->>'requests')::numeric > 0
                THEN (v_revenue_active_current - (v_costs_30d->>'sponsor')::numeric) / (v_costs_30d->>'requests')::numeric
                ELSE 0
            END
        ),
        'settings', json_build_object(
            'target_margin', v_target_margin,
            'churn_rate', v_churn_rate,
            'recovery_rate', v_recovery_rate,
            'budget_cap', v_monthly_budget_cap
        ),
        'trends', v_trends
    );

    RETURN v_result;
END;
$$;

-- log_ai_usage_tokens: edge-only logging with auth binding (guest p_user_id NULL allowed)
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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
BEGIN
    IF p_user_id IS NOT NULL AND NOT public.is_service_role() THEN
        IF v_caller IS NULL OR p_user_id IS DISTINCT FROM v_caller THEN
            RAISE EXCEPTION 'FORBIDDEN: cannot log tokens for another user'
                USING ERRCODE = '42501';
        END IF;
    END IF;

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

-- increment_global_usage: internal helper only (called from consume_ai_credits)
CREATE OR REPLACE FUNCTION public.increment_global_usage(
    p_user_id uuid,
    p_guest_id text,
    p_model_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
-- TASK 3: REVOKE / GRANT EXECUTE
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.consume_ai_credits(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_credits(uuid, text, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_current_ai_quota(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_ai_quota(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_global_usage(uuid, text, text) FROM PUBLIC;
-- No client GRANT: SECURITY DEFINER consume calls internally as function owner

REVOKE ALL ON FUNCTION public.log_ai_usage_tokens(uuid, text, text, integer, integer, integer, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_ai_usage_tokens(uuid, text, text, integer, integer, integer, numeric, uuid) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_ai_economics_stats_v4() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_economics_stats_v4() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_ai_control_tower_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_control_tower_stats() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_admin_ai_credits(uuid, integer, integer, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_ai_credits(uuid, integer, integer, timestamptz, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- TASK 5: Minimal RLS / triggers on critical tables
-- ---------------------------------------------------------------------------

-- profiles.role: only admins may change role (service_role bypass for backend)
CREATE OR REPLACE FUNCTION public.profiles_guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND NOT public.is_service_role()
       AND NOT public.is_td_admin(auth.uid()) THEN
        RAISE EXCEPTION 'FORBIDDEN: cannot change profile role'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_role_change ON public.profiles;
CREATE TRIGGER trg_profiles_guard_role_change
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.profiles_guard_role_change();

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_settings_public_read ON public.global_settings;
CREATE POLICY global_settings_public_read ON public.global_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS global_settings_admin_write ON public.global_settings;
CREATE POLICY global_settings_admin_write ON public.global_settings
    FOR ALL
    TO authenticated
    USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
    WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_ai_credits_select_owner_admin ON public.user_ai_credits;
CREATE POLICY user_ai_credits_select_owner_admin ON public.user_ai_credits
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_td_admin(auth.uid())
        OR public.is_service_role()
    );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_credit_grants'
    ) THEN
        EXECUTE 'ALTER TABLE public.admin_credit_grants ENABLE ROW LEVEL SECURITY';

        EXECUTE 'DROP POLICY IF EXISTS admin_credit_grants_admin_select ON public.admin_credit_grants';
        EXECUTE $pol$
            CREATE POLICY admin_credit_grants_admin_select ON public.admin_credit_grants
                FOR SELECT
                TO authenticated
                USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
        $pol$;
    END IF;
END $$;

COMMIT;
