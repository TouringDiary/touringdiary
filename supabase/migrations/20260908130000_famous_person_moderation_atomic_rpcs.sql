-- =============================================================================
-- Atomic PostgreSQL RPCs for Famous Person Suggestions & Photo Suggestions
-- Schema verified: famous_person_suggestions, famous_person_photo_suggestions, city_people
-- Ensures absolute server-side consistency, concurrency locking, and no orphan rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. accept_famous_person_suggestion
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_famous_person_suggestion(
  p_suggestion_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_suggestion public.famous_person_suggestions%ROWTYPE;
  v_person_id uuid;
  v_notes text;
  v_rows int;
  v_order_index integer;
BEGIN
  -- Controllo del service role e dell'autenticazione admin (coerente con il pattern reale del progetto)
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  -- Lock suggestion row
  SELECT * INTO v_suggestion
  FROM public.famous_person_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione non trovata.';
  END IF;

  IF v_suggestion.status NOT IN ('pending', 'in_review') THEN
    RAISE EXCEPTION 'Questa segnalazione è già stata conclusa.';
  END IF;

  IF v_suggestion.accepted_person_id IS NOT NULL THEN
    RAISE EXCEPTION 'Questa segnalazione ha già un personaggio ufficiale collegato.';
  END IF;

  -- Acquisisce un row lock sulla città per serializzare la generazione dell'order_index concorrente
  PERFORM 1
  FROM public.cities
  WHERE id = v_suggestion.city_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Città associata (%) non trovata.', v_suggestion.city_id;
  END IF;

  -- Calculate next order_index atomically for this city (protected by cities lock)
  SELECT COALESCE(MAX(order_index), 0) + 1 INTO v_order_index
  FROM public.city_people
  WHERE city_id = v_suggestion.city_id;

  -- Insert new draft famous person into city_people
  INSERT INTO public.city_people (
    city_id,
    name,
    status,
    is_living,
    birth_year,
    birth_date,
    death_year,
    death_date,
    bio,
    order_index
  )
  VALUES (
    v_suggestion.city_id,
    trim(v_suggestion.suggested_name),
    'draft',
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_order_index
  )
  RETURNING id INTO v_person_id;

  -- Update suggestion status and accepted_person_id
  IF p_admin_notes IS NULL THEN
    v_notes := v_suggestion.admin_notes;
  ELSE
    v_notes := NULLIF(trim(p_admin_notes), '');
  END IF;

  UPDATE public.famous_person_suggestions
  SET
    status = 'accepted',
    accepted_person_id = v_person_id,
    admin_notes = v_notes,
    updated_at = now()
  WHERE id = p_suggestion_id
    AND status = v_suggestion.status
    AND accepted_person_id IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Conflitto di moderazione: la segnalazione è già in elaborazione o moderata.';
  END IF;

  RETURN v_person_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_famous_person_suggestion(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_suggestion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_suggestion(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. accept_famous_person_photo_suggestion
-- ---------------------------------------------------------------------------
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
BEGIN
  -- Controllo del service role e dell'autenticazione admin (coerente con il pattern reale del progetto)
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  -- Lock suggestion row
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

  -- Lock person row to prevent concurrent updates for the same person
  SELECT * INTO v_person
  FROM public.city_people
  WHERE id = v_suggestion.person_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Il personaggio famoso associato non è stato trovato.';
  END IF;

  -- Strict verification of city coherence between suggestion and person
  IF v_person.city_id <> v_suggestion.city_id THEN
    RAISE EXCEPTION 'Incoerenza: la città del personaggio famoso (%) non corrisponde a quella della segnalazione (%).', v_person.city_id, v_suggestion.city_id;
  END IF;

  v_previous_image_url := v_person.image_url;
  v_previous_storage_path := v_person.image_storage_path;

  -- Update suggestion status
  IF p_admin_notes IS NULL THEN
    v_notes := v_suggestion.admin_notes;
  ELSE
    v_notes := NULLIF(trim(p_admin_notes), '');
  END IF;

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

  -- Update official photo on city_people
  UPDATE public.city_people
  SET
    image_url = v_suggestion.image_url,
    image_storage_path = v_suggestion.storage_path,
    image_is_placeholder = false
  WHERE id = v_suggestion.person_id;

  RETURN jsonb_build_object(
    'ok', true,
    'previous_image_url', v_previous_image_url,
    'previous_storage_path', v_previous_storage_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_famous_person_photo_suggestion(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. set_famous_person_editorial_status
-- ---------------------------------------------------------------------------
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
BEGIN
  -- Controllo del service role e dell'autenticazione admin (coerente con il pattern reale del progetto)
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

  -- Lock person row
  SELECT * INTO v_person
  FROM public.city_people
  WHERE id = p_person_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaggio non trovato.';
  END IF;

  IF p_status = 'published' THEN
    -- 1. Check required string fields
    IF v_person.name IS NULL OR trim(v_person.name) = '' THEN
      RAISE EXCEPTION 'Nome personaggio obbligatorio per la pubblicazione.';
    END IF;
    IF v_person.bio IS NULL OR trim(v_person.bio) = '' THEN
      RAISE EXCEPTION 'Biografia obbligatoria per la pubblicazione.';
    END IF;
    IF v_person.image_url IS NULL OR trim(v_person.image_url) = '' THEN
      RAISE EXCEPTION 'Fotografia obbligatoria per la pubblicazione.';
    END IF;

    -- 2. Check at least one active and non-deleted category link
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

    -- 3. Check dates and living status consistency (respecting real constraints)
    IF v_person.birth_year IS NULL THEN
      RAISE EXCEPTION 'Anno di nascita obbligatorio.';
    END IF;

    IF v_person.birth_date IS NOT NULL THEN
      -- Type-safe extracted year comparison (avoids regex and cast hacks)
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
        -- Type-safe extracted year comparison
        IF EXTRACT(YEAR FROM v_person.death_date)::integer <> v_person.death_year THEN
          RAISE EXCEPTION 'Anno di morte non coerente con la data di morte.';
        END IF;
      END IF;

      -- Check death year is greater or equal to birth year
      IF v_person.death_year < v_person.birth_year THEN
        RAISE EXCEPTION 'La morte non può precedere la nascita.';
      END IF;

      -- Check dates if both present
      IF v_person.birth_date IS NOT NULL AND v_person.death_date IS NOT NULL THEN
        IF v_person.death_date < v_person.birth_date THEN
          RAISE EXCEPTION 'La morte non può precedere la nascita.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- Perform update
  UPDATE public.city_people
  SET status = p_status
  WHERE id = p_person_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_famous_person_editorial_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_famous_person_editorial_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_famous_person_editorial_status(uuid, text) TO service_role;
