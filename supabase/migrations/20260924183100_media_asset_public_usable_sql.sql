-- Allineato a PUBLIC_USABLE_IMAGE_ASSET_STATUSES (governance.ts): active, restored

CREATE OR REPLACE FUNCTION public.is_media_asset_publicly_usable(p_asset_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.media_assets ma
    WHERE ma.id = p_asset_id
      AND ma.asset_status IN ('active'::public.image_asset_status, 'restored'::public.image_asset_status)
      AND NULLIF(trim(ma.storage_bucket), '') IS NOT NULL
      AND NULLIF(trim(ma.storage_path), '') IS NOT NULL
      AND ma.archived_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_media_asset_publicly_usable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_media_asset_publicly_usable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_media_asset_publicly_usable(uuid) TO service_role;
