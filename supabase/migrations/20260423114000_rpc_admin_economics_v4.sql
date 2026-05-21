-- ==========================================
-- RPC: get_ai_economics_stats_v4
-- Date: 2026-04-23
-- Description: Aggregazione dati per Dashboard Admin v4
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_ai_economics_stats_v4()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_revenue_30d numeric := 0;
    v_total_costs_30d numeric := 0;
    v_feature_stats json;
    v_model_stats json;
    v_user_type_stats json;
    v_daily_trends json;
BEGIN
    -- 1. Ricavi ultimi 30gg (Subscription + Extra Credits)
    SELECT COALESCE(sum(price_paid), 0) INTO v_revenue_30d
    FROM public.subscriptions
    WHERE status = 'active' AND current_period_start >= now() - interval '30 days';

    -- Aggiungiamo acquisti extra credits
    v_revenue_30d := v_revenue_30d + (
        SELECT COALESCE(sum(amount_eur), 0)
        FROM public.credit_transactions
        WHERE status = 'completed' AND created_at >= now() - interval '30 days'
    );

    -- 2. Statistiche per Feature (Planner, Roadbook, Chat)
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

    -- 3. Statistiche per Modello (Flash vs Pro)
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

    -- 4. Statistiche per Tipologia Utente
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

    -- 5. Trend Giornaliero (Ultimi 14 giorni)
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

    -- Calcolo costi totali 30gg per margine
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
