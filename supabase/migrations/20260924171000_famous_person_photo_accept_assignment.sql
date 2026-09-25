-- POST-MF5 — accettazione foto personaggio: SoT media_assets + entity_image_assignments (no legacy city_people image columns)
-- Publish gate: public.is_media_asset_publicly_usable definita in 20260924183100_media_asset_public_usable_sql.sql

CREATE OR REPLACE FUNCTION public.accept_famous_person_photo_suggestion(
  p_suggestion_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_suggestion public.famous_person_photo_suggestions%ROWTYPE;
  v_person public.city_people%ROWTYPE;
  v_notes text;
  v_rows int;
  v_previous_image_url text;
  v_previous_storage_path text;
  v_prev_assignment public.entity_image_assignments%ROWTYPE;
  v_active_primary_count integer;
  v_bucket text;
  v_assignment_id uuid;
BEGIN
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  SELECT * INTO v_suggestion
  FROM public.famous_person_photo_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione foto non trovata.';
  END IF;

  IF v_suggestion.status NOT IN ('pending', 'in_review') THEN
    RAISE EXCEPTION 'Questa segnalazione foto è già stata conclusa.';
  END IF;

  SELECT * INTO v_person
  FROM public.city_people
  WHERE id = v_suggestion.person_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Il personaggio famoso associato non è stato trovato.';
  END IF;

  IF v_person.city_id <> v_suggestion.city_id THEN
    RAISE EXCEPTION 'Incoerenza: la città del personaggio famoso (%) non corrisponde a quella della segnalazione (%).', v_person.city_id, v_suggestion.city_id;
  END IF;

  IF NOT v_suggestion.rights_confirmed THEN
    RAISE EXCEPTION 'Accettazione non consentita: diritti sulla fotografia non confermati.';
  END IF;

  IF NULLIF(trim(v_suggestion.storage_path), '') IS NULL OR NULLIF(trim(v_suggestion.image_url), '') IS NULL THEN
    RAISE EXCEPTION 'Segnalazione foto priva di URL o storage path validi.';
  END IF;

  v_previous_image_url := NULL;
  v_previous_storage_path := NULL;

  SELECT count(*)
  INTO v_active_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'city_person'
    AND eia.entity_id = v_suggestion.person_id::text
    AND eia.city_id = v_suggestion.city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF v_active_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo per city_person (person_id=%).',
      v_suggestion.person_id;
  END IF;

  SELECT * INTO v_prev_assignment
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'city_person'
    AND eia.entity_id = v_suggestion.person_id::text
    AND eia.city_id = v_suggestion.city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF FOUND THEN
    v_previous_image_url := v_prev_assignment.source_image_url;
    v_previous_storage_path := v_prev_assignment.source_storage_path;
  END IF;

  IF p_admin_notes IS NULL THEN
    v_notes := v_suggestion.admin_notes;
  ELSE
    v_notes := NULLIF(trim(p_admin_notes), '');
  END IF;

  -- Upload client: uploadPublicMediaDetailed → bucket public-media (famous_person_photo_suggestions/…)
  v_bucket := 'public-media';

  v_assignment_id := public.upsert_entity_primary_image_assignment(
    v_suggestion.person_id,
    v_suggestion.city_id,
    v_suggestion.image_url,
    v_bucket,
    v_suggestion.storage_path,
    'community'
  );

  UPDATE public.famous_person_photo_suggestions
  SET
    status = 'accepted',
    admin_notes = v_notes,
    updated_at = now()
  WHERE id = p_suggestion_id
    AND status = v_suggestion.status;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Conflitto di moderazione: la segnalazione foto è già in elaborazione o moderata.';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'assignment_id', v_assignment_id,
    'previous_image_url', v_previous_image_url,
    'previous_storage_path', v_previous_storage_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) TO service_role;

-- Publish gate: primary assignment attivo + media_asset pubblicabile (POST-MF5 read).
-- city_people.status (MF1): solo transizioni editoriali draft/published; suspended/canceled fuori scope.

CREATE OR REPLACE FUNCTION public.set_famous_person_editorial_status(
  p_person_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_person public.city_people%ROWTYPE;
  v_has_category boolean;
  v_active_primary_count integer;
  v_primary_asset_id uuid;
BEGIN
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF p_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Stato editoriale non valido: %', p_status;
  END IF;

  SELECT * INTO v_person
  FROM public.city_people
  WHERE id = p_person_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaggio non trovato.';
  END IF;

  IF v_person.status IN ('suspended', 'canceled') THEN
    RAISE EXCEPTION
      'Transizione editoriale non consentita dallo stato % (suspended/canceled fuori scope da set_famous_person_editorial_status).',
      v_person.status;
  END IF;

  IF p_status = 'published' THEN
    IF v_person.name IS NULL OR trim(v_person.name) = '' THEN
      RAISE EXCEPTION 'Nome personaggio obbligatorio per la pubblicazione.';
    END IF;
    IF v_person.bio IS NULL OR trim(v_person.bio) = '' THEN
      RAISE EXCEPTION 'Biografia obbligatoria per la pubblicazione.';
    END IF;

    SELECT count(*)
    INTO v_active_primary_count
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'city_person'
      AND eia.entity_id = p_person_id::text
      AND eia.city_id = v_person.city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active';

    IF v_active_primary_count = 0 THEN
      RAISE EXCEPTION
        'Fotografia obbligatoria per la pubblicazione (assignment primary corrente attivo mancante).';
    END IF;

    IF v_active_primary_count > 1 THEN
      RAISE EXCEPTION
        'Incoerenza dati: più di un assignment primary corrente attivo per city_person (person_id=%).',
        p_person_id;
    END IF;

    SELECT eia.media_asset_id
    INTO v_primary_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'city_person'
      AND eia.entity_id = p_person_id::text
      AND eia.city_id = v_person.city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active';

    IF NOT public.is_media_asset_publicly_usable(v_primary_asset_id) THEN
      RAISE EXCEPTION
        'Fotografia obbligatoria per la pubblicazione (media_asset non pubblicamente utilizzabile).';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.city_person_category_links l
      JOIN public.famous_person_specific_categories c ON l.specific_category_id = c.id
      WHERE l.person_id = p_person_id
        AND c.is_active = true
        AND c.deleted_at IS NULL
    ) INTO v_has_category;

    IF NOT v_has_category THEN
      RAISE EXCEPTION 'Almeno una categoria attiva è richiesta per la pubblicazione.';
    END IF;

    IF v_person.birth_year IS NULL THEN
      RAISE EXCEPTION 'Anno di nascita obbligatorio.';
    END IF;

    IF v_person.birth_date IS NOT NULL THEN
      IF EXTRACT(YEAR FROM v_person.birth_date)::integer <> v_person.birth_year THEN
        RAISE EXCEPTION 'Anno di nascita non coerente con la data di nascita.';
      END IF;
    END IF;

    IF v_person.is_living = true THEN
      IF v_person.death_year IS NOT NULL OR v_person.death_date IS NOT NULL THEN
        RAISE EXCEPTION 'Un personaggio vivente non può avere data o anno di morte.';
      END IF;
    ELSE
      IF v_person.death_year IS NULL THEN
        RAISE EXCEPTION 'Anno di morte obbligatorio per un personaggio non vivente.';
      END IF;
      IF v_person.death_date IS NOT NULL THEN
        IF EXTRACT(YEAR FROM v_person.death_date)::integer <> v_person.death_year THEN
          RAISE EXCEPTION 'Anno di morte non coerente con la data di morte.';
        END IF;
      END IF;

      IF v_person.death_year < v_person.birth_year THEN
        RAISE EXCEPTION 'La morte non può precedere la nascita.';
      END IF;

      IF v_person.birth_date IS NOT NULL AND v_person.death_date IS NOT NULL THEN
        IF v_person.death_date < v_person.birth_date THEN
          RAISE EXCEPTION 'La morte non può precedere la nascita.';
        END IF;
      END IF;
    END IF;
  END IF;

  UPDATE public.city_people
  SET status = p_status, updated_at = now()
  WHERE id = p_person_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_famous_person_editorial_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_famous_person_editorial_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_famous_person_editorial_status(uuid, text) TO service_role;
