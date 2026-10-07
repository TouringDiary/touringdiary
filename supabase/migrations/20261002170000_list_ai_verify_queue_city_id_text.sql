-- list_ai_verify_queue: p_city_id e la colonna restituita city_id sono text,
-- come public.cities.id e public.entity_image_assignments.city_id.
-- La firma precedente (uuid) non è sostituibile con CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.list_ai_verify_queue(text, text, text, uuid, integer, integer);

CREATE FUNCTION public.list_ai_verify_queue(
  p_entity_type text DEFAULT NULL,
  p_continent text DEFAULT NULL,
  p_nation text DEFAULT NULL,
  p_city_id text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  media_asset_id uuid,
  storage_bucket text,
  storage_path text,
  origin_type text,
  generated_by_ai boolean,
  is_placeholder boolean,
  asset_status public.image_asset_status,
  license_code text,
  source_url text,
  entity_type text,
  entity_id text,
  city_id text,
  city_name text,
  continent text,
  nation text,
  admin_region text,
  zone text,
  entity_label text,
  latest_run_id uuid,
  latest_ai_summary text,
  blocking_step_code text,
  current_assignments jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  RETURN QUERY
  WITH matching AS (
    SELECT
      ma.id AS media_asset_id,
      ma.storage_bucket,
      ma.storage_path,
      ma.origin_type,
      ma.generated_by_ai,
      ma.is_placeholder,
      ma.asset_status,
      ma.license_code,
      ma.source_url,
      eia.id AS assignment_id,
      eia.entity_type,
      eia.entity_id,
      eia.city_id,
      eia.updated_at AS assignment_updated_at,
      c.name AS city_name,
      c.continent,
      c.nation,
      c.admin_region,
      c.zone,
      CASE
        WHEN eia.entity_type = 'city_person' THEN cp.name
        WHEN eia.entity_type = 'poi' THEN p.name
        WHEN eia.entity_type = 'patron' THEN COALESCE(c.patron_details->>'name', 'Santo Patrono')
        ELSE eia.entity_type
      END AS entity_label
    FROM public.media_assets ma
    JOIN public.entity_image_assignments eia ON eia.media_asset_id = ma.id
    JOIN public.cities c ON c.id = eia.city_id
    LEFT JOIN public.city_people cp ON eia.entity_type = 'city_person' AND cp.id::text = eia.entity_id
    LEFT JOIN public.pois p ON eia.entity_type = 'poi' AND p.id = eia.entity_id
    WHERE ma.asset_status = 'verify_ai_image'
      AND eia.is_current = true
      AND (p_entity_type IS NULL OR eia.entity_type = p_entity_type)
      AND (p_continent IS NULL OR c.continent = p_continent)
      AND (p_nation IS NULL OR c.nation = p_nation)
      AND (p_city_id IS NULL OR c.id = p_city_id)
  ),
  assignment_agg AS (
    SELECT
      m.media_asset_id,
      jsonb_agg(
        jsonb_build_object(
          'assignment_id', m.assignment_id,
          'entity_type', m.entity_type,
          'entity_id', m.entity_id,
          'city_id', m.city_id,
          'city_name', m.city_name,
          'entity_label', m.entity_label,
          'continent', m.continent,
          'nation', m.nation
        )
        ORDER BY m.assignment_updated_at DESC
      ) AS current_assignments
    FROM matching m
    GROUP BY m.media_asset_id
  ),
  ranked_assignments AS (
    SELECT DISTINCT ON (m.media_asset_id)
      m.media_asset_id,
      m.storage_bucket,
      m.storage_path,
      m.origin_type,
      m.generated_by_ai,
      m.is_placeholder,
      m.asset_status,
      m.license_code,
      m.source_url,
      m.entity_type,
      m.entity_id,
      m.city_id,
      m.city_name,
      m.continent,
      m.nation,
      m.admin_region,
      m.zone,
      m.entity_label
    FROM matching m
    ORDER BY m.media_asset_id, m.assignment_updated_at DESC
  ),
  latest_runs AS (
    SELECT DISTINCT ON (ivr.media_asset_id)
      ivr.media_asset_id,
      ivr.id AS latest_run_id,
      ivr.ai_summary AS latest_ai_summary,
      ivr.blocking_step_code
    FROM public.image_verification_runs ivr
    ORDER BY ivr.media_asset_id, ivr.created_at DESC, ivr.id DESC
  )
  SELECT
    ra.media_asset_id,
    ra.storage_bucket,
    ra.storage_path,
    ra.origin_type,
    ra.generated_by_ai,
    ra.is_placeholder,
    ra.asset_status,
    ra.license_code,
    ra.source_url,
    ra.entity_type,
    ra.entity_id,
    ra.city_id,
    ra.city_name,
    ra.continent,
    ra.nation,
    ra.admin_region,
    ra.zone,
    ra.entity_label,
    lr.latest_run_id,
    lr.latest_ai_summary,
    lr.blocking_step_code,
    COALESCE(aa.current_assignments, '[]'::jsonb) AS current_assignments
  FROM ranked_assignments ra
  LEFT JOIN latest_runs lr ON lr.media_asset_id = ra.media_asset_id
  LEFT JOIN assignment_agg aa ON aa.media_asset_id = ra.media_asset_id
  ORDER BY ra.city_name NULLS LAST, ra.entity_label NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.list_ai_verify_queue(text, text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_ai_verify_queue(text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_ai_verify_queue(text, text, text, text, integer, integer) TO service_role;
