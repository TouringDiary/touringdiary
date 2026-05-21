-- ==========================================
-- RPC: log_ai_usage_tokens
-- Date: 2026-04-23
-- Description: Logging dettagliato token per analytics
-- ==========================================

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
