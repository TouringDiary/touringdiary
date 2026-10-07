-- Validazione Wikimedia sull'asset.
-- Non cambia asset_status, non accende il toggle pubblico, non usa suspended_admin.
-- Una Wikimedia nuova nasce false. true solo da set_wikimedia_validation, su un run completo.

CREATE OR REPLACE FUNCTION public.canonical_image_verification_step_codes()
RETURNS SETOF text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT unnest(ARRAY[
    'file_identity',
    'source_provenance',
    'source_trust',
    'license_declared',
    'license_version',
    'license_url',
    'attribution_complete',
    'copyright_notice',
    'usage_rights_td',
    'personality_rights',
    'privacy_content',
    'trademark_logo',
    'third_party_works',
    'cultural_heritage',
    'contradictions',
    'platform_history'
  ]::text[]);
$$;

REVOKE ALL ON FUNCTION public.canonical_image_verification_step_codes() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.latest_complete_image_verification_run(p_media_asset_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT r.id
  FROM public.image_verification_runs r
  WHERE r.media_asset_id = p_media_asset_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.canonical_image_verification_step_codes() AS required(step_code)
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.image_verification_steps s
        WHERE s.run_id = r.id
          AND s.step_code = required.step_code
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.image_verification_steps extra
      WHERE extra.run_id = r.id
        AND NOT EXISTS (
          SELECT 1
          FROM public.canonical_image_verification_step_codes() AS required(step_code)
          WHERE required.step_code = extra.step_code
        )
    )
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.latest_complete_image_verification_run(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.is_canonical_image_verification_step_code(p_code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(trim(p_code), '') IN (
    SELECT public.canonical_image_verification_step_codes()
  );
$$;

CREATE OR REPLACE FUNCTION public.guard_wikimedia_validated_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.origin_type IS DISTINCT FROM 'wikimedia' THEN
    IF NEW.wikimedia_validated IS NOT NULL THEN
      RAISE EXCEPTION 'wikimedia_validated è ammesso solo su un asset di origine wikimedia.';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.wikimedia_validated IS TRUE THEN
      RAISE EXCEPTION 'Una nuova Wikimedia non può nascere VALIDATA.';
    END IF;
    NEW.wikimedia_validated := false;
    RETURN NEW;
  END IF;

  IF OLD.origin_type IS DISTINCT FROM 'wikimedia' THEN
    IF NEW.wikimedia_validated IS TRUE THEN
      RAISE EXCEPTION 'Un asset che diventa Wikimedia non può nascere VALIDATA.';
    END IF;
    NEW.wikimedia_validated := false;
    RETURN NEW;
  END IF;

  IF NEW.wikimedia_validated IS NOT DISTINCT FROM OLD.wikimedia_validated THEN
    RETURN NEW;
  END IF;

  IF current_setting('td.wikimedia_validation_write', true) = '1'
     AND NEW.wikimedia_validated IS TRUE
     AND OLD.wikimedia_validated IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF current_setting('td.wikimedia_validation_write', true) = '1'
     AND NEW.wikimedia_validated IS FALSE
     AND OLD.wikimedia_validated IS NULL THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'validazione_wikimedia modificabile solo dalla RPC di validazione Admin.';
END;
$$;

DROP TRIGGER IF EXISTS media_assets_guard_wikimedia_validated ON public.media_assets;
CREATE TRIGGER media_assets_guard_wikimedia_validated
  BEFORE INSERT OR UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_wikimedia_validated_write();

CREATE OR REPLACE FUNCTION public.save_wikimedia_validation_notes(
  p_media_asset_id uuid,
  p_notes jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_origin text;
  v_run_id uuid;
  v_note jsonb;
  v_step text;
  v_text text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  SELECT origin_type INTO v_origin
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND OR v_origin IS DISTINCT FROM 'wikimedia' THEN
    RAISE EXCEPTION 'Note di validazione consentite solo su asset Wikimedia.';
  END IF;

  v_run_id := public.latest_complete_image_verification_run(p_media_asset_id);

  IF v_run_id IS NULL THEN
    RAISE EXCEPTION 'Nessun run completo dei 16 controlli da aggiornare.';
  END IF;

  FOR v_note IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_notes, '[]'::jsonb))
  LOOP
    v_step := NULLIF(trim(v_note->>'step_code'), '');
    v_text := NULLIF(trim(v_note->>'admin_rationale'), '');
    IF v_step IS NULL THEN
      RAISE EXCEPTION 'step_code mancante.';
    END IF;
    IF NOT public.is_canonical_image_verification_step_code(v_step) THEN
      RAISE EXCEPTION 'step_code non canonico: %', v_step;
    END IF;
    UPDATE public.image_verification_steps
    SET admin_rationale = v_text, updated_at = now()
    WHERE run_id = v_run_id AND step_code = v_step;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Step non presente nel run: %', v_step;
    END IF;
  END LOOP;

  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_wikimedia_validation_notes(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_wikimedia_validation_notes(uuid, jsonb) TO authenticated;

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

  SELECT origin_type, wikimedia_validated
  INTO v_origin, v_current_flag
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

  RETURN p_validated;
END;
$$;

REVOKE ALL ON FUNCTION public.set_wikimedia_validation(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_wikimedia_validation(uuid, boolean, text) TO authenticated;
