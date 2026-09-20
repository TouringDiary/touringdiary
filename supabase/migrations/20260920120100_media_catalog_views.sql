-- MF4 — Vista catalogo Media Library (D77: gestione asset Admin; §42.6)
-- Richiede media_assets.archived_at (20260920120000).

CREATE OR REPLACE VIEW public.media_assets_with_usage_count
WITH (security_invoker = true) AS
SELECT
  ma.id,
  ma.storage_bucket,
  ma.storage_path,
  ma.origin_type,
  ma.is_placeholder,
  ma.generated_by_ai,
  ma.asset_status,
  ma.source_ref,
  ma.content_hash,
  ma.license_code,
  ma.license_url,
  ma.source_url,
  ma.attribution_text,
  ma.copyright_notice,
  ma.author_name,
  ma.rights_holder,
  ma.retrieved_at,
  ma.license_verified_at,
  ma.metadata,
  ma.archived_at,
  ma.created_at,
  ma.updated_at,
  COALESCE(u.active_usage_count, 0)::integer AS active_usage_count,
  COALESCE(u.total_assignment_count, 0)::integer AS total_assignment_count
FROM public.media_assets ma
LEFT JOIN (
  SELECT
    eia.media_asset_id,
    count(*) FILTER (
      WHERE eia.is_current = true AND eia.assignment_status = 'active'
    )::integer AS active_usage_count,
    count(*)::integer AS total_assignment_count
  FROM public.entity_image_assignments eia
  GROUP BY eia.media_asset_id
) u ON u.media_asset_id = ma.id;

COMMENT ON VIEW public.media_assets_with_usage_count IS
  'MF4 Media Library catalogo Admin (D77). security_invoker=true: le righe visibili dipendono dalle policy RLS '
  'già definite su media_assets (MF1 media_assets_admin_manage) e entity_image_assignments nel subquery; '
  'GRANT SELECT a authenticated non bypassa RLS. Non è il resolver public delle immagini pubblicate (MF2). '
  'active_usage_count: is_current=true AND assignment_status=active. total_assignment_count: count(*) per media_asset_id.';

REVOKE ALL ON public.media_assets_with_usage_count FROM PUBLIC;
GRANT SELECT ON public.media_assets_with_usage_count TO authenticated;
GRANT SELECT ON public.media_assets_with_usage_count TO service_role;
