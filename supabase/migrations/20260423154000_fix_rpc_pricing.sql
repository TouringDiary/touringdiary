-- Fix RPC get_active_pricing_version
-- Rimozione riferimenti a colonne inesistenti (stripe_price_id_test/prod)

CREATE OR REPLACE FUNCTION public.get_active_pricing_version()
 RETURNS SETOF pricing_versions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    plan_id,
    price,
    currency,
    duration_days,
    ai_limits,
    campaign_id,
    is_active,
    valid_from,
    valid_until,
    created_at,
    updated_at,
    activated_at
  FROM pricing_versions
  WHERE is_active = true
  AND (valid_until IS NULL OR valid_until > now())
  ORDER BY created_at DESC
  LIMIT 1;
END;
$function$;
