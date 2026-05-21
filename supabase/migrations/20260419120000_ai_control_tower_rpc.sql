-- Description: RPC avanzata per la AI Economic Control Tower (Torre di Controllo Strategica)
-- Aggrega ricavi, costi (per categoria utenti), margini e proiezioni.

CREATE OR REPLACE FUNCTION get_ai_control_tower_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_today date := current_date;
    v_seven_days_ago date := current_date - interval '7 days';
    v_thirty_days_ago date := current_date - interval '30 days';
    v_first_day_this_month date := date_trunc('month', current_date)::date;
    v_first_day_last_month date := (date_trunc('month', current_date) - interval '1 month')::date;
    v_last_day_last_month date := (date_trunc('month', current_date) - interval '1 day')::date;
    
    -- Sponsor Metrics
    v_sponsor_active integer;
    v_sponsor_pending integer;
    v_sponsor_expired_no_reactivation integer;
    v_revenue_active_current numeric;
    v_revenue_last_30_days numeric;
    
    -- Economics Settings (from global_settings)
    v_target_margin numeric;
    v_churn_rate numeric;
    v_recovery_rate numeric;
    v_monthly_budget_cap numeric;
    
    -- Analytics & Indicators
    v_costs_30d json;
    v_trends json;
BEGIN
    -- 1. Recupero Parametri Economici (Seed)
    SELECT (value::json->>'target_margin')::numeric INTO v_target_margin FROM public.global_settings WHERE key = 'economics_target_margin_percent';
    SELECT (value::json->>'churn_rate')::numeric INTO v_churn_rate FROM public.global_settings WHERE key = 'economics_churn_rate_estimate';
    SELECT (value::json->>'recovery_rate')::numeric INTO v_recovery_rate FROM public.global_settings WHERE key = 'economics_recovery_rate_estimate';
    SELECT (value::json->>'budget_cap')::numeric INTO v_monthly_budget_cap FROM public.global_settings WHERE key = 'economics_monthly_budget_cap';

    -- Defaults se non presenti
    v_target_margin := COALESCE(v_target_margin, 0.60);
    v_churn_rate := COALESCE(v_churn_rate, 0.05);
    v_recovery_rate := COALESCE(v_recovery_rate, 0.15);
    v_monthly_budget_cap := COALESCE(v_monthly_budget_cap, 500.00);

    -- 2. Sponsor Revenue Breakdown
    SELECT count(*) INTO v_sponsor_active FROM public.subscriptions WHERE status = 'active';
    SELECT count(*) INTO v_sponsor_pending FROM public.subscriptions WHERE status = 'pending';
    
    -- Logic: Expired without reactivation (CORRETTA)
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

    -- 3. Sponsor Usage Breakdown & Profitability (aggregazione costi)
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

    -- 4. Trends (Monthly)
    WITH monthly_costs AS (
        SELECT 
            to_char(date, 'YYYY-MM') as month,
            sum(u.request_count * c.cost_per_request) as cost
        FROM public.ai_global_usage u
        JOIN public.ai_model_prices c ON u.model_type = c.model
        GROUP BY 1
    )
    SELECT json_object_agg(month, cost) INTO v_trends FROM monthly_costs;

    -- 5. Final Result
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
