-- Una Wikimedia validata dall'Admin esce dalla sospensione di quarantena.
-- Il file resta sospeso solo finché non è validato. Il toggle e gli assignment non cambiano.

CREATE OR REPLACE FUNCTION public.set_wikimedia_validation(
  p_media_asset_id uuid,
  p_validated boolean,
  p_admin_rationale text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_origin text;
  v_current_flag boolean;
  v_asset_status public.image_asset_status;
  v_run_id uuid;
  v_missing text;
  v_absent text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  IF char_length(trim(COALESCE(p_admin_rationale, ''))) = 0 THEN
    RAISE EXCEPTION 'Motivazione obbligatoria.';
  END IF;

  SELECT origin_type, wikimedia_validated, asset_status
  INTO v_origin, v_current_flag, v_asset_status
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND OR v_origin IS DISTINCT FROM 'wikimedia' THEN
    RAISE EXCEPTION 'Validazione Wikimedia consentita solo su asset Wikimedia.';
  END IF;

  IF p_validated IS NOT TRUE AND v_current_flag IS TRUE THEN
    RAISE EXCEPTION 'Una Wikimedia VALIDATA non viene riportata a DA VALIDARE da questa RPC.';
  END IF;

  IF p_validated THEN
    v_run_id := public.latest_complete_image_verification_run(p_media_asset_id);

    IF v_run_id IS NULL THEN
      RAISE EXCEPTION 'VALIDA richiede il run dei 16 controlli.';
    END IF;

    SELECT string_agg(required.step_code, ', ' ORDER BY required.step_code)
    INTO v_absent
    FROM public.canonical_image_verification_step_codes() AS required(step_code)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.image_verification_steps ivs
      WHERE ivs.run_id = v_run_id
        AND ivs.step_code = required.step_code
    );

    IF v_absent IS NOT NULL THEN
      RAISE EXCEPTION 'VALIDA richiede tutti i controlli canonici. Assenti: %', v_absent;
    END IF;

    SELECT string_agg(ivs.step_code, ', ' ORDER BY ivs.step_order)
    INTO v_missing
    FROM public.image_verification_steps ivs
    WHERE ivs.run_id = v_run_id
      AND ivs.outcome IN ('blocked', 'doubt', 'unverified')
      AND char_length(trim(COALESCE(ivs.admin_rationale, ''))) = 0;

    IF v_missing IS NOT NULL THEN
      RAISE EXCEPTION 'Nota Admin obbligatoria sui controlli: %', v_missing;
    END IF;
  END IF;

  PERFORM set_config('td.wikimedia_validation_write', '1', true);

  UPDATE public.media_assets
  SET wikimedia_validated = p_validated, updated_at = now()
  WHERE id = p_media_asset_id;

  PERFORM public.append_entity_image_history(
    'admin_note',
    p_media_asset_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    trim(p_admin_rationale),
    false,
    jsonb_build_object(
      'source', 'set_wikimedia_validation',
      'wikimedia_validated', p_validated
    )
  );

  IF p_validated IS TRUE AND v_asset_status = 'suspended' THEN
    PERFORM public.transition_media_asset_status(
      p_media_asset_id,
      'active'::public.image_asset_status,
      'Validazione Wikimedia: il file esce dalla sospensione di quarantena.'
    );
  END IF;

  RETURN p_validated;
END;
$$;

REVOKE ALL ON FUNCTION public.set_wikimedia_validation(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_wikimedia_validation(uuid, boolean, text) TO authenticated;

-- Foto già validate e ancora sospese: stesso effetto, senza richiedere un secondo click.
DO $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT ma.id
    FROM public.media_assets ma
    WHERE ma.origin_type = 'wikimedia'
      AND ma.wikimedia_validated IS TRUE
      AND ma.asset_status = 'suspended'
      AND ma.admin_blocked IS NOT TRUE
  LOOP
    UPDATE public.media_assets
    SET asset_status = 'active', updated_at = now()
    WHERE id = v_id
      AND asset_status = 'suspended';

    PERFORM public.append_entity_image_history_trusted(
      'asset_status_changed',
      v_id,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'suspended'::public.image_asset_status,
      'active'::public.image_asset_status,
      NULL,
      NULL,
      'Validazione Wikimedia già concessa: il file esce dalla sospensione di quarantena.',
      false,
      jsonb_build_object('source', 'wikimedia_validated_lifts_quarantine_suspension')
    );
  END LOOP;
END $$;
