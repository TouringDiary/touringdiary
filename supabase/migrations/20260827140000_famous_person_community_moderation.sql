-- =============================================================================
-- Famous Person — Community suggestion + photo suggestion + abuse (DEDICATED)
-- Pattern comportamentale Patron; tabelle/RPC separate (non riusa SoT Patron).
-- Prerequisito: 20260827120000_famous_person_categories_and_dates.sql
--
-- D1: una sola foto ufficiale (city_people.image_url [+ image_storage_path])
-- D2: suggestion personaggio ≠ da city_people; accept → draft ufficiale
-- D3: abuse solo su foto ufficiale già pubblicata (person status=published + image)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Tracciamento storage foto ufficiale (replace / block sicuri)
-- ---------------------------------------------------------------------------
ALTER TABLE public.city_people
  ADD COLUMN IF NOT EXISTS image_storage_path text NULL;

COMMENT ON COLUMN public.city_people.image_storage_path IS
  'Path Storage della foto ufficiale corrente (singola). NULL se URL esterno o sconosciuto.';

-- ---------------------------------------------------------------------------
-- 1. Suggerimenti personaggio (coda community)
-- ---------------------------------------------------------------------------
CREATE TABLE public.famous_person_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_name text NOT NULL,
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  city_name text NOT NULL,
  suggested_name text NOT NULL,
  notes text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'accepted', 'rejected')),
  admin_notes text,
  accepted_person_id uuid REFERENCES public.city_people (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT famous_person_suggestions_name_chk CHECK (char_length(trim(suggested_name)) > 0),
  CONSTRAINT famous_person_suggestions_notes_required_chk CHECK (
    char_length(trim(notes)) > 0 AND char_length(notes) <= 2000
  ),
  CONSTRAINT famous_person_suggestions_accepted_person_chk CHECK (
    (status = 'accepted' AND accepted_person_id IS NOT NULL)
    OR (status <> 'accepted' AND accepted_person_id IS NULL)
  )
);

CREATE INDEX idx_famous_person_suggestions_status
  ON public.famous_person_suggestions (status, created_at DESC);
CREATE INDEX idx_famous_person_suggestions_city
  ON public.famous_person_suggestions (city_id);
CREATE INDEX idx_famous_person_suggestions_user
  ON public.famous_person_suggestions (user_id);

COMMENT ON TABLE public.famous_person_suggestions IS
  'Coda community «Consiglia personaggio». Distinta da city_people. Accept crea draft ufficiale.';

-- ---------------------------------------------------------------------------
-- 2. Suggerimenti foto (una foto per suggestion → diventa ufficiale se accepted)
-- ---------------------------------------------------------------------------
CREATE TABLE public.famous_person_photo_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_name text NOT NULL,
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  city_name text NOT NULL,
  person_id uuid NOT NULL REFERENCES public.city_people (id) ON DELETE CASCADE,
  person_name text NOT NULL,
  notes text,
  rights_confirmed boolean NOT NULL DEFAULT false,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'accepted', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT famous_person_photo_suggestions_rights_chk CHECK (rights_confirmed = true),
  CONSTRAINT famous_person_photo_suggestions_image_chk CHECK (
    char_length(trim(image_url)) > 0 AND char_length(trim(storage_path)) > 0
  )
);

CREATE INDEX idx_famous_person_photo_suggestions_status
  ON public.famous_person_photo_suggestions (status, created_at DESC);
CREATE INDEX idx_famous_person_photo_suggestions_person
  ON public.famous_person_photo_suggestions (person_id);
CREATE INDEX idx_famous_person_photo_suggestions_city
  ON public.famous_person_photo_suggestions (city_id);

COMMENT ON TABLE public.famous_person_photo_suggestions IS
  'Suggerimenti foto Famous Person. Accept sostituisce la sola foto ufficiale su city_people.';

-- ---------------------------------------------------------------------------
-- 3. Segnalazioni abuso (solo foto ufficiale pubblicata)
-- ---------------------------------------------------------------------------
CREATE TABLE public.famous_person_photo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.city_people (id) ON DELETE RESTRICT,
  person_image_url text NOT NULL,
  person_image_storage_path text,
  reporter_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reporter_user_name text,
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  city_name text NOT NULL,
  person_name text NOT NULL,
  reason text NOT NULL
    CHECK (reason IN ('copyright', 'other_rights', 'unauthorized', 'other')),
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'photo_blocked', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT famous_person_photo_reports_image_chk CHECK (char_length(trim(person_image_url)) > 0)
);

CREATE INDEX idx_famous_person_photo_reports_status
  ON public.famous_person_photo_reports (status, created_at DESC);
CREATE INDEX idx_famous_person_photo_reports_person
  ON public.famous_person_photo_reports (person_id);
CREATE INDEX idx_famous_person_photo_reports_city
  ON public.famous_person_photo_reports (city_id, created_at DESC);

COMMENT ON TABLE public.famous_person_photo_reports IS
  'Abuse su foto ufficiale pubblicata Famous Person. person_id obbligatorio; snapshot URL/path conservati se la foto viene sostituita o bloccata.';
COMMENT ON COLUMN public.famous_person_photo_reports.person_id IS
  'Personaggio segnalato (obbligatorio). ON DELETE RESTRICT: hard delete su city_people bloccato finché esistono report (audit trail).';
COMMENT ON COLUMN public.famous_person_photo_reports.person_image_url IS
  'Snapshot URL foto ufficiale al momento della segnalazione; INSERT deve coincidere (trim) con city_people.image_url corrente.';
COMMENT ON COLUMN public.famous_person_photo_reports.person_image_storage_path IS
  'Snapshot path Storage al momento della segnalazione; INSERT deve coincidere (IS NOT DISTINCT FROM) con city_people.image_storage_path corrente; NULL legittimo se foto esterna.';

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_famous_person_moderation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_famous_person_suggestions_updated_at ON public.famous_person_suggestions;
CREATE TRIGGER trg_famous_person_suggestions_updated_at
  BEFORE UPDATE ON public.famous_person_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_famous_person_moderation_updated_at();

DROP TRIGGER IF EXISTS trg_famous_person_photo_suggestions_updated_at
  ON public.famous_person_photo_suggestions;
CREATE TRIGGER trg_famous_person_photo_suggestions_updated_at
  BEFORE UPDATE ON public.famous_person_photo_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_famous_person_moderation_updated_at();

DROP TRIGGER IF EXISTS trg_famous_person_photo_reports_updated_at
  ON public.famous_person_photo_reports;
CREATE TRIGGER trg_famous_person_photo_reports_updated_at
  BEFORE UPDATE ON public.famous_person_photo_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_famous_person_moderation_updated_at();

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.famous_person_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.famous_person_photo_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.famous_person_photo_reports ENABLE ROW LEVEL SECURITY;

-- Person suggestions: SELECT/UPDATE/DELETE admin; INSERT solo via RPC
DROP POLICY IF EXISTS fp_person_suggestions_admin_select ON public.famous_person_suggestions;
CREATE POLICY fp_person_suggestions_admin_select ON public.famous_person_suggestions
  FOR SELECT TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_person_suggestions_admin_update ON public.famous_person_suggestions;
CREATE POLICY fp_person_suggestions_admin_update ON public.famous_person_suggestions
  FOR UPDATE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_person_suggestions_admin_delete ON public.famous_person_suggestions;
CREATE POLICY fp_person_suggestions_admin_delete ON public.famous_person_suggestions
  FOR DELETE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

-- Photo suggestions: SELECT/UPDATE/DELETE admin; INSERT solo via RPC
DROP POLICY IF EXISTS fp_photo_suggestions_admin_select ON public.famous_person_photo_suggestions;
CREATE POLICY fp_photo_suggestions_admin_select ON public.famous_person_photo_suggestions
  FOR SELECT TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_photo_suggestions_admin_update ON public.famous_person_photo_suggestions;
CREATE POLICY fp_photo_suggestions_admin_update ON public.famous_person_photo_suggestions
  FOR UPDATE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_photo_suggestions_admin_delete ON public.famous_person_photo_suggestions;
CREATE POLICY fp_photo_suggestions_admin_delete ON public.famous_person_photo_suggestions
  FOR DELETE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

-- Reports: INSERT authenticated (pending); SELECT/UPDATE/DELETE admin
DROP POLICY IF EXISTS fp_photo_reports_admin_select ON public.famous_person_photo_reports;
CREATE POLICY fp_photo_reports_admin_select ON public.famous_person_photo_reports
  FOR SELECT TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_photo_reports_insert_authenticated ON public.famous_person_photo_reports;
CREATE POLICY fp_photo_reports_insert_authenticated ON public.famous_person_photo_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    famous_person_photo_reports.reporter_user_id = auth.uid()
    AND famous_person_photo_reports.status = 'pending'
    AND famous_person_photo_reports.admin_notes IS NULL
    AND char_length(trim(famous_person_photo_reports.person_image_url)) > 0
    AND EXISTS (
      SELECT 1
      FROM public.city_people cp
      INNER JOIN public.cities c ON c.id = cp.city_id
      INNER JOIN public.profiles pr ON pr.id = auth.uid()
      WHERE cp.id = famous_person_photo_reports.person_id
        AND cp.city_id = famous_person_photo_reports.city_id
        AND cp.status = 'published'
        AND cp.image_url IS NOT NULL
        AND trim(cp.image_url) <> ''
        AND trim(famous_person_photo_reports.person_image_url) = trim(cp.image_url)
        AND famous_person_photo_reports.person_image_storage_path IS NOT DISTINCT FROM cp.image_storage_path
        AND trim(famous_person_photo_reports.person_name) = trim(cp.name)
        AND trim(famous_person_photo_reports.city_name) = trim(c.name)
        AND trim(COALESCE(famous_person_photo_reports.reporter_user_name, '')) = trim(COALESCE(pr.name, ''))
        AND trim(COALESCE(pr.name, '')) <> ''
    )
  );

DROP POLICY IF EXISTS fp_photo_reports_admin_update ON public.famous_person_photo_reports;
CREATE POLICY fp_photo_reports_admin_update ON public.famous_person_photo_reports
  FOR UPDATE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_photo_reports_admin_delete ON public.famous_person_photo_reports;
CREATE POLICY fp_photo_reports_admin_delete ON public.famous_person_photo_reports
  FOR DELETE TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

-- ---------------------------------------------------------------------------
-- 6. GRANT
-- ---------------------------------------------------------------------------
GRANT SELECT, UPDATE, DELETE ON public.famous_person_suggestions TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.famous_person_photo_suggestions TO authenticated;
GRANT INSERT ON public.famous_person_photo_reports TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.famous_person_photo_reports TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC — consiglia personaggio (nota obbligatoria)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_famous_person_suggestion(
  p_city_id text,
  p_suggested_name text,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_profile public.profiles%ROWTYPE;
  v_user_name text;
  v_city_name text;
  v_name text;
  v_notes text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  v_name := trim(COALESCE(p_suggested_name, ''));
  IF v_name = '' THEN
    RAISE EXCEPTION 'Nome personaggio obbligatorio.';
  END IF;
  IF char_length(v_name) > 200 THEN
    RAISE EXCEPTION 'Nome personaggio troppo lungo.';
  END IF;

  v_notes := trim(COALESCE(p_notes, ''));
  IF v_notes = '' THEN
    RAISE EXCEPTION 'La nota è obbligatoria.';
  END IF;
  IF char_length(v_notes) > 2000 THEN
    RAISE EXCEPTION 'Nota troppo lunga.';
  END IF;

  SELECT trim(COALESCE(c.name, '')) INTO v_city_name
  FROM public.cities c
  WHERE c.id = p_city_id;

  IF NOT FOUND OR v_city_name = '' THEN
    RAISE EXCEPTION 'Città non valida.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo utente non trovato.';
  END IF;

  v_user_name := trim(COALESCE(v_profile.name, ''));
  IF v_user_name = '' THEN
    RAISE EXCEPTION 'Nome profilo obbligatorio.';
  END IF;

  INSERT INTO public.famous_person_suggestions (
    user_id, user_name, city_id, city_name, suggested_name, notes, status
  )
  VALUES (
    v_uid, v_user_name, p_city_id, v_city_name, v_name, v_notes, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_famous_person_suggestion(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_famous_person_suggestion(text, text, text)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. RPC — suggerisci foto (una sola)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_famous_person_photo_suggestion(
  p_person_id uuid,
  p_rights_confirmed boolean,
  p_image_url text,
  p_storage_path text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_profile public.profiles%ROWTYPE;
  v_user_name text;
  v_city_id text;
  v_city_name text;
  v_person_name text;
  v_image_url text;
  v_storage_path text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  IF p_rights_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Conferma sui diritti obbligatoria.';
  END IF;

  v_image_url := trim(COALESCE(p_image_url, ''));
  v_storage_path := trim(COALESCE(p_storage_path, ''));
  IF v_image_url = '' OR v_storage_path = '' THEN
    RAISE EXCEPTION 'Fotografia obbligatoria.';
  END IF;

  IF v_storage_path NOT LIKE ('famous_person_photo_suggestions/' || v_uid::text || '/%') THEN
    RAISE EXCEPTION 'storage_path non consentito.';
  END IF;

  SELECT cp.city_id, trim(COALESCE(cp.name, '')), trim(COALESCE(c.name, ''))
  INTO v_city_id, v_person_name, v_city_name
  FROM public.city_people cp
  JOIN public.cities c ON c.id = cp.city_id
  WHERE cp.id = p_person_id
    AND cp.status = 'published';

  IF NOT FOUND OR v_person_name = '' OR v_city_name = '' THEN
    RAISE EXCEPTION 'Personaggio non valido o non pubblicato.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo utente non trovato.';
  END IF;

  v_user_name := trim(COALESCE(v_profile.name, ''));
  IF v_user_name = '' THEN
    RAISE EXCEPTION 'Nome profilo obbligatorio.';
  END IF;

  INSERT INTO public.famous_person_photo_suggestions (
    user_id, user_name, city_id, city_name, person_id, person_name,
    notes, rights_confirmed, image_url, storage_path, status
  )
  VALUES (
    v_uid,
    v_user_name,
    v_city_id,
    v_city_name,
    p_person_id,
    v_person_name,
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    true,
    v_image_url,
    v_storage_path,
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_famous_person_photo_suggestion(uuid, boolean, text, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_famous_person_photo_suggestion(uuid, boolean, text, text, text)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Storage — public-media (cartella dedicata Famous Person)
-- famous_person_photo_suggestions/{userId}/ → upload utente (suggerimenti foto)
-- Pattern allineato a patron_photo_suggestions/{userId}/ (migration Patron §12).
-- Prerequisito: bucket `public-media` già esistente (non creato in repo).
-- ---------------------------------------------------------------------------

CREATE POLICY "public_media_famous_person_suggestions_user_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-media'
    AND auth.uid() IS NOT NULL
    AND name LIKE 'famous_person_photo_suggestions/%'
    AND (string_to_array(name, '/'))[2] = auth.uid()::text
  );

CREATE POLICY "public_media_famous_person_suggestions_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'public-media'
    AND public.is_td_admin(auth.uid())
    AND name LIKE 'famous_person_photo_suggestions/%'
  );
