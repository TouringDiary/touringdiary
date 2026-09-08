-- =============================================================================
-- Atomic block of Famous Person photo abuse report + clear matching official photo
-- Schema verified: famous_person_photo_reports + city_people (image_url/storage_path)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.block_famous_person_photo_report_and_clear(
  p_report_id uuid,
  p_person_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_report public.famous_person_photo_reports%ROWTYPE;
  v_cleared_path text;
  v_rows int;
  v_notes text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  IF NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  SELECT * INTO v_report
  FROM public.famous_person_photo_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione abuso non trovata.';
  END IF;

  IF v_report.status NOT IN ('pending', 'in_review') THEN
    RAISE EXCEPTION 'Questa segnalazione abuso è già conclusa.';
  END IF;

  IF v_report.person_id IS DISTINCT FROM p_person_id THEN
    RAISE EXCEPTION 'Il personaggio indicato non corrisponde a questa segnalazione.';
  END IF;

  -- Lock person row; clear ONLY if current official photo still matches the reported one
  PERFORM 1 FROM public.city_people WHERE id = p_person_id FOR UPDATE;

  UPDATE public.city_people
  SET
    image_url = NULL,
    image_storage_path = NULL
  WHERE id = p_person_id
    AND image_url IS NOT DISTINCT FROM v_report.person_image_url
    AND image_storage_path IS NOT DISTINCT FROM v_report.person_image_storage_path;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RAISE EXCEPTION
      'Conflitto di moderazione: la foto ufficiale non coincide più con quella segnalata.';
  END IF;

  v_cleared_path := v_report.person_image_storage_path;

  IF p_admin_notes IS NULL THEN
    v_notes := v_report.admin_notes;
  ELSE
    v_notes := NULLIF(trim(p_admin_notes), '');
  END IF;

  UPDATE public.famous_person_photo_reports
  SET
    status = 'photo_blocked',
    admin_notes = v_notes
  WHERE id = p_report_id
    AND status = v_report.status;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION
      'Conflitto di moderazione: la segnalazione abuso non è più nello stato previsto.';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cleared_storage_path', v_cleared_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text)
  TO authenticated;

COMMENT ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text) IS
  'Atomically blocks a photo abuse report and clears city_people official photo only if it still matches the reported image.';
