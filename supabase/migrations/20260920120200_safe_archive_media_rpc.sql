-- MF4 — Safe archive asset (soft archive; archived_at in 20260920120000)
-- archived_at ≠ asset_status: l'archivio catalogo non transiziona il lifecycle MF3.

CREATE INDEX IF NOT EXISTS media_assets_archived_at_idx
  ON public.media_assets (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.safe_archive_media_asset(
  p_media_asset_id uuid,
  p_admin_rationale text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_asset public.media_assets%ROWTYPE;
  v_active_assignments integer;
  v_open_reports integer;
  v_status public.image_asset_status;
  v_archived_at timestamptz;
BEGIN
  IF public.is_service_role() THEN
    NULL;
  ELSE
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato.';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_media_asset_id::text, 0));

  SELECT * INTO v_asset
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'media_asset non trovato: %', p_media_asset_id;
  END IF;

  IF v_asset.archived_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_archived', true,
      'media_asset_id', p_media_asset_id,
      'archived_at', v_asset.archived_at,
      'asset_status', v_asset.asset_status
    );
  END IF;

  SELECT count(*)::integer INTO v_active_assignments
  FROM public.entity_image_assignments eia
  WHERE eia.media_asset_id = p_media_asset_id
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF v_active_assignments > 0 THEN
    RAISE EXCEPTION
      'Archivio bloccato: % assignment attivi correnti referenziano l''asset.',
      v_active_assignments;
  END IF;

  SELECT count(*)::integer INTO v_open_reports
  FROM public.content_reports cr
  WHERE cr.status IN ('nuovo', 'in_verifica')
    AND (
      cr.assignment_id IN (
        SELECT eia.id
        FROM public.entity_image_assignments eia
        WHERE eia.media_asset_id = p_media_asset_id
      )
      OR (
        cr.snapshot_storage_bucket IS NOT NULL
        AND cr.snapshot_storage_path IS NOT NULL
        AND cr.snapshot_storage_bucket = v_asset.storage_bucket
        AND cr.snapshot_storage_path = v_asset.storage_path
      )
    );

  IF v_open_reports > 0 THEN
    RAISE EXCEPTION
      'Archivio bloccato: % segnalazioni aperte collegate all''asset.',
      v_open_reports;
  END IF;

  v_status := v_asset.asset_status;

  UPDATE public.media_assets
  SET
    archived_at = now(),
    updated_at = now()
  WHERE id = p_media_asset_id
  RETURNING archived_at INTO v_archived_at;

  PERFORM public.append_entity_image_history_trusted(
    'asset_archived',
    p_media_asset_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_status,
    v_status,
    NULL,
    NULL,
    NULLIF(trim(p_admin_rationale), ''),
    false,
    jsonb_build_object(
      'active_assignments_at_archive', v_active_assignments,
      'archived_at', v_archived_at,
      'source', 'safe_archive_media_asset'
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'already_archived', false,
    'media_asset_id', p_media_asset_id,
    'archived_at', v_archived_at,
    'asset_status', v_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.safe_archive_media_asset(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_archive_media_asset(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_archive_media_asset(uuid, text) TO service_role;
