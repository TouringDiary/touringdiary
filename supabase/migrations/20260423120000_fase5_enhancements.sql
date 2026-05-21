-- ==========================================
-- FASE 5: Schema Enhancements & Helpers
-- ==========================================

-- 1. Aggiunta colonna "Consigliato" ai pacchetti crediti
ALTER TABLE public.extra_credit_packages 
ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT false;

-- 2. Helper per risolvere il pricing attivo (Single Source of Truth)
CREATE OR REPLACE FUNCTION public.get_active_pricing_version()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'id', v.id,
        'plan_id', v.plan_id,
        'price', v.price,
        'currency', v.currency,
        'ai_limits', v.ai_limits,
        'stripe_price_id_test', v.stripe_price_id_test,
        'stripe_price_id_prod', v.stripe_price_id_prod,
        'is_active', v.is_active,
        'created_at', v.created_at,
        'plan_name', p.name
    ) INTO v_result
    FROM public.pricing_versions v
    JOIN public.plans p ON v.plan_id = p.id
    WHERE v.is_active = true
    LIMIT 1;

    RETURN v_result;
END;
$$;
