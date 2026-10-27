-- Requisito C: predefiniti dei quattro ruoli e override per utente.
-- Scritta il 2026-10-16 sulla revisione 16. Non applicata in questa attività.
-- Non tocca global_settings, le cinque migrazioni del 12 e 13 ottobre,
-- né 20261016100000. Non revoca i grant delle tabelle già presenti.
-- È una delle sei migrazioni pendenti. supabase db push non può applicarla
-- da sola: --include-all --dry-run le elenca tutte e sei, senza un filtro per file.
-- Questo commento non autorizza l'applicazione remota.

BEGIN;

-- ---------------------------------------------------------------------------
-- Tabelle. Nessuna policy per anon e authenticated: il service role aggira
-- la RLS, la funzione SECURITY DEFINER legge per le policy delle altre tabelle.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permission_defaults (
  role text NOT NULL,
  code text NOT NULL,
  granted boolean NOT NULL,
  PRIMARY KEY (role, code),
  CONSTRAINT role_permission_defaults_role_check CHECK (
    role IN ('admin_all', 'admin_limited', 'business', 'user')
  ),
  CONSTRAINT role_permission_defaults_code_check CHECK (
    code IN (
      'ADM-USR-FULL',
      'ADM-USR-VIEW',
      'ADM-CNT-FULL',
      'ADM-CNT-MOD',
      'ADM-SET-FULL',
      'ADM-LYT-EDIT',
      'ADM-STS-VIEW',
      'ITN-PLAN-SELF',
      'CNT-SGT-EDIT',
      'CMT-VOT',
      'BIZ-REG-SELF',
      'BIZ-REQ-FEAT',
      'BIZ-STS-VIEW'
    )
  )
);

CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  code text NOT NULL,
  granted boolean NOT NULL,
  PRIMARY KEY (user_id, code),
  CONSTRAINT user_permission_overrides_code_check CHECK (
    code IN (
      'ADM-USR-FULL',
      'ADM-USR-VIEW',
      'ADM-CNT-FULL',
      'ADM-CNT-MOD',
      'ADM-SET-FULL',
      'ADM-LYT-EDIT',
      'ADM-STS-VIEW',
      'ITN-PLAN-SELF',
      'CNT-SGT-EDIT',
      'CMT-VOT',
      'BIZ-REG-SELF',
      'BIZ-REQ-FEAT',
      'BIZ-STS-VIEW'
    )
  )
);

ALTER TABLE public.role_permission_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.role_permission_defaults FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_permission_overrides FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.role_permission_defaults TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_permission_overrides TO service_role;

-- Seme: l'array in userService.ts. BIZ-REQ-FEAT è vero per i quattro ruoli,
-- perché l'inserimento della richiesta sponsor oggi non distingue il ruolo.
-- ON CONFLICT non riscrive una riga già salvata dalla matrice.
INSERT INTO public.role_permission_defaults (role, code, granted)
SELECT seed.role, seed.code, seed.granted
FROM (
  VALUES
    ('admin_all', 'ADM-USR-FULL', true),
    ('admin_all', 'ADM-USR-VIEW', false),
    ('admin_all', 'ADM-CNT-FULL', true),
    ('admin_all', 'ADM-CNT-MOD', true),
    ('admin_all', 'ADM-SET-FULL', true),
    ('admin_all', 'ADM-LYT-EDIT', true),
    ('admin_all', 'ADM-STS-VIEW', true),
    ('admin_all', 'ITN-PLAN-SELF', true),
    ('admin_all', 'CNT-SGT-EDIT', true),
    ('admin_all', 'CMT-VOT', true),
    ('admin_all', 'BIZ-REG-SELF', false),
    ('admin_all', 'BIZ-REQ-FEAT', true),
    ('admin_all', 'BIZ-STS-VIEW', false),
    ('admin_limited', 'ADM-USR-FULL', false),
    ('admin_limited', 'ADM-USR-VIEW', true),
    ('admin_limited', 'ADM-CNT-FULL', false),
    ('admin_limited', 'ADM-CNT-MOD', true),
    ('admin_limited', 'ADM-SET-FULL', false),
    ('admin_limited', 'ADM-LYT-EDIT', false),
    ('admin_limited', 'ADM-STS-VIEW', true),
    ('admin_limited', 'ITN-PLAN-SELF', true),
    ('admin_limited', 'CNT-SGT-EDIT', false),
    ('admin_limited', 'CMT-VOT', false),
    ('admin_limited', 'BIZ-REG-SELF', false),
    ('admin_limited', 'BIZ-REQ-FEAT', true),
    ('admin_limited', 'BIZ-STS-VIEW', false),
    ('business', 'ADM-USR-FULL', false),
    ('business', 'ADM-USR-VIEW', false),
    ('business', 'ADM-CNT-FULL', false),
    ('business', 'ADM-CNT-MOD', false),
    ('business', 'ADM-SET-FULL', false),
    ('business', 'ADM-LYT-EDIT', false),
    ('business', 'ADM-STS-VIEW', false),
    ('business', 'ITN-PLAN-SELF', true),
    ('business', 'CNT-SGT-EDIT', true),
    ('business', 'CMT-VOT', true),
    ('business', 'BIZ-REG-SELF', true),
    ('business', 'BIZ-REQ-FEAT', true),
    ('business', 'BIZ-STS-VIEW', true),
    ('user', 'ADM-USR-FULL', false),
    ('user', 'ADM-USR-VIEW', false),
    ('user', 'ADM-CNT-FULL', false),
    ('user', 'ADM-CNT-MOD', false),
    ('user', 'ADM-SET-FULL', false),
    ('user', 'ADM-LYT-EDIT', false),
    ('user', 'ADM-STS-VIEW', false),
    ('user', 'ITN-PLAN-SELF', true),
    ('user', 'CNT-SGT-EDIT', true),
    ('user', 'CMT-VOT', true),
    ('user', 'BIZ-REG-SELF', false),
    ('user', 'BIZ-REQ-FEAT', true),
    ('user', 'BIZ-STS-VIEW', false)
) AS seed(role, code, granted)
ON CONFLICT (role, code) DO NOTHING;

-- Nessuna riga di override: eredità. Una riga prevale. Il cambio di profiles.role
-- non cancella le righe. La cancellazione del profilo sì, per la chiave esterna.
CREATE OR REPLACE FUNCTION public.effective_permission(p_uid uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_override boolean;
  v_default boolean;
BEGIN
  IF p_uid IS NULL OR p_code IS NULL OR p_code NOT IN (
    'ADM-USR-FULL',
    'ADM-USR-VIEW',
    'ADM-CNT-FULL',
    'ADM-CNT-MOD',
    'ADM-SET-FULL',
    'ADM-LYT-EDIT',
    'ADM-STS-VIEW',
    'ITN-PLAN-SELF',
    'CNT-SGT-EDIT',
    'CMT-VOT',
    'BIZ-REG-SELF',
    'BIZ-REQ-FEAT',
    'BIZ-STS-VIEW'
  ) THEN
    RETURN false;
  END IF;

  -- La policy passa sempre auth.uid(). Un altro id non rivela i permessi,
  -- tranne al service role delle route e a un amministratore.
  IF p_uid IS DISTINCT FROM auth.uid()
     AND NOT public.is_service_role()
     AND NOT public.is_td_admin(auth.uid()) THEN
    RETURN false;
  END IF;

  SELECT profiles.role INTO v_role
  FROM public.profiles
  WHERE profiles.id = p_uid;

  IF v_role IS NULL OR v_role NOT IN ('admin_all', 'admin_limited', 'business', 'user') THEN
    RETURN false;
  END IF;

  -- I codici amministrativi non si attivano su user o business, nemmeno con un override.
  IF p_code IN (
       'ADM-USR-FULL',
       'ADM-USR-VIEW',
       'ADM-CNT-FULL',
       'ADM-CNT-MOD',
       'ADM-SET-FULL',
       'ADM-LYT-EDIT',
       'ADM-STS-VIEW'
     )
     AND v_role NOT IN ('admin_all', 'admin_limited') THEN
    RETURN false;
  END IF;

  -- ADM-USR-FULL implica la lettura. Una negazione di ADM-USR-VIEW non la toglie
  -- finché la gestione completa è effettiva. La chiamata riguarda solo quel codice:
  -- non rientra in questo ramo e non si richiama.
  IF p_code = 'ADM-USR-VIEW' AND public.effective_permission(p_uid, 'ADM-USR-FULL') THEN
    RETURN true;
  END IF;

  SELECT overrides.granted INTO v_override
  FROM public.user_permission_overrides AS overrides
  WHERE overrides.user_id = p_uid AND overrides.code = p_code;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  SELECT defaults.granted INTO v_default
  FROM public.role_permission_defaults AS defaults
  WHERE defaults.role = v_role AND defaults.code = p_code;

  IF FOUND THEN
    RETURN v_default;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.effective_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_permission(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- design_system_rules — le tre scritture insieme. Le SELECT restano.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin Write Design" ON public.design_system_rules;
DROP POLICY IF EXISTS "Allow All Design Rules" ON public.design_system_rules;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.design_system_rules;

DROP POLICY IF EXISTS design_system_rules_write_adm_lyt ON public.design_system_rules;
CREATE POLICY design_system_rules_write_adm_lyt
  ON public.design_system_rules
  FOR ALL
  TO authenticated
  USING (
    public.is_td_admin(auth.uid())
    AND public.effective_permission(auth.uid(), 'ADM-LYT-EDIT')
  )
  WITH CHECK (
    public.is_td_admin(auth.uid())
    AND public.effective_permission(auth.uid(), 'ADM-LYT-EDIT')
  );

-- ---------------------------------------------------------------------------
-- reviews — i tre INSERT insieme. La moderazione non richiede CMT-VOT
-- e non include più l'inserimento.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.reviews;
DROP POLICY IF EXISTS "Public Insert Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin full access to reviews" ON public.reviews;

DROP POLICY IF EXISTS reviews_insert_own_cmt_vot ON public.reviews;
CREATE POLICY reviews_insert_own_cmt_vot
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.effective_permission(auth.uid(), 'CMT-VOT')
  );

DROP POLICY IF EXISTS reviews_admin_select ON public.reviews;
CREATE POLICY reviews_admin_select
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS reviews_admin_update ON public.reviews;
CREATE POLICY reviews_admin_update
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (public.is_td_admin(auth.uid()))
  WITH CHECK (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS reviews_admin_delete ON public.reviews;
CREATE POLICY reviews_admin_delete
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- itineraries.
-- D-01 e D-12: la lettura pubblica è solo Community, official e ai con
-- status published. Le tre SELECT pubbliche precedenti si eliminano, compreso
-- USING true. Le bozze personali e il Workspace non passano da quella policy.
-- D-02: dopo la pubblicazione l'autore non aggiorna la copia non personale.
-- La delete propria resta solo sul tipo personal. La delete di community,
-- official e ai è un'altra policy, solo per is_td_admin: è lo stesso gate già
-- usato per insert e update di quelle righe. Non c'è un codice operativo
-- distinto per questa cancellazione.
-- D-03: l'update del collaboratore resta, ma solo su type personal. type e
-- user_id non cambiano se il chiamante non è amministratore o service role.
-- Nessuna policy del proprietario è FOR ALL.
-- SELECT propria riga: proprietà, senza ITN-PLAN-SELF.
-- SELECT editoriale per is_td_admin: community, official e ai, anche in bozza
-- e con user_id nullo. Non include i diari personal.
-- INSERT e UPDATE personal: proprietà e ITN-PLAN-SELF.
-- DELETE personal: proprietà, type personal e ITN-PLAN-SELF.
-- INSERT e UPDATE non personal: solo is_td_admin. La proprietà non è richiesta.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Public Read Community" ON public.itineraries;
DROP POLICY IF EXISTS "Public itineraries are viewable by everyone" ON public.itineraries;

DROP POLICY IF EXISTS "Public read published editorial itineraries" ON public.itineraries;
CREATE POLICY "Public read published editorial itineraries"
  ON public.itineraries
  FOR SELECT
  TO public
  USING (
    status = 'published'
    AND type IN ('community', 'official', 'ai')
  );

DROP POLICY IF EXISTS "Admins read editorial itineraries" ON public.itineraries;
CREATE POLICY "Admins read editorial itineraries"
  ON public.itineraries
  FOR SELECT
  TO authenticated
  USING (
    public.is_td_admin(auth.uid())
    AND type IN ('community', 'official', 'ai')
  );

DROP POLICY IF EXISTS "Auth Insert Itineraries" ON public.itineraries;
CREATE POLICY "Auth Insert Itineraries"
  ON public.itineraries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      type IS DISTINCT FROM 'personal'
      AND public.is_td_admin(auth.uid())
    )
    OR (
      type = 'personal'
      AND user_id = auth.uid()
      AND public.effective_permission(auth.uid(), 'ITN-PLAN-SELF')
    )
  );

DROP POLICY IF EXISTS "Users Own Their Data" ON public.itineraries;
CREATE POLICY "Users Own Their Data"
  ON public.itineraries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own itineraries" ON public.itineraries;
CREATE POLICY "Users can manage own itineraries"
  ON public.itineraries
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND type = 'personal'
    AND public.effective_permission(auth.uid(), 'ITN-PLAN-SELF')
  );

DROP POLICY IF EXISTS "Admins delete editorial itineraries" ON public.itineraries;
CREATE POLICY "Admins delete editorial itineraries"
  ON public.itineraries
  FOR DELETE
  TO authenticated
  USING (
    public.is_td_admin(auth.uid())
    AND type IN ('community', 'official', 'ai')
  );

DROP POLICY IF EXISTS "Collaborators update shared diaries" ON public.itineraries;
CREATE POLICY "Collaborators update shared diaries"
  ON public.itineraries
  FOR UPDATE
  TO authenticated
  USING (
    type = 'personal'
    AND public.can_access_collaborative_diary(id, true)
  )
  WITH CHECK (
    type = 'personal'
    AND public.can_access_collaborative_diary(id, true)
  );

DROP POLICY IF EXISTS "Owner Mod Itineraries" ON public.itineraries;
CREATE POLICY "Owner Mod Itineraries"
  ON public.itineraries
  FOR UPDATE
  TO authenticated
  USING (
    (
      type = 'personal'
      AND user_id = auth.uid()
      AND public.effective_permission(auth.uid(), 'ITN-PLAN-SELF')
    )
    OR (
      type IS DISTINCT FROM 'personal'
      AND public.is_td_admin(auth.uid())
    )
  )
  WITH CHECK (
    (
      type = 'personal'
      AND user_id = auth.uid()
      AND public.effective_permission(auth.uid(), 'ITN-PLAN-SELF')
    )
    OR (
      type IS DISTINCT FROM 'personal'
      AND public.is_td_admin(auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- suggestions — l'INSERT amministrativo esce dalla policy ALL.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS suggestions_insert_own ON public.suggestions;
CREATE POLICY suggestions_insert_own
  ON public.suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.effective_permission(auth.uid(), 'CNT-SGT-EDIT')
  );

DROP POLICY IF EXISTS suggestions_admin_all ON public.suggestions;

DROP POLICY IF EXISTS suggestions_admin_select ON public.suggestions;
CREATE POLICY suggestions_admin_select
  ON public.suggestions
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS suggestions_admin_update ON public.suggestions;
CREATE POLICY suggestions_admin_update
  ON public.suggestions
  FOR UPDATE
  TO authenticated
  USING (public.is_td_admin(auth.uid()))
  WITH CHECK (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS suggestions_admin_delete ON public.suggestions;
CREATE POLICY suggestions_admin_delete
  ON public.suggestions
  FOR DELETE
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- photo_submissions — update con ADM-CNT-MOD, delete solo admin_all.
-- D-04 e D-05: l'autore non ha più una policy di UPDATE, né prima né dopo
-- l'approvazione. La lettura delle foto approvate e l'insert proprio restano.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS photo_submissions_update_own_pending ON public.photo_submissions;
DROP POLICY IF EXISTS photo_submissions_admin_all ON public.photo_submissions;

DROP POLICY IF EXISTS photo_submissions_admin_select ON public.photo_submissions;
CREATE POLICY photo_submissions_admin_select
  ON public.photo_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS photo_submissions_admin_insert ON public.photo_submissions;
CREATE POLICY photo_submissions_admin_insert
  ON public.photo_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_td_admin(auth.uid()));

DROP POLICY IF EXISTS photo_submissions_admin_update ON public.photo_submissions;
CREATE POLICY photo_submissions_admin_update
  ON public.photo_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_td_admin(auth.uid())
    AND public.effective_permission(auth.uid(), 'ADM-CNT-MOD')
  )
  WITH CHECK (
    public.is_td_admin(auth.uid())
    AND public.effective_permission(auth.uid(), 'ADM-CNT-MOD')
  );

-- Il REVOKE FROM PUBLIC del 2026-10-05 non toglie i grant nominativi. Prima
-- della revoca qui sotto, anon e authenticated possono ancora eseguire
-- is_admin_all(uuid). La policy di DELETE non la chiama: chiama
-- caller_is_admin_all(), che non ha argomenti e risponde solo per auth.uid().
-- Il grant di caller_is_admin_all a authenticated non apre la DELETE a chi non
-- è admin_all.
CREATE OR REPLACE FUNCTION public.caller_is_admin_all()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin_all(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.caller_is_admin_all() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.caller_is_admin_all() TO authenticated, service_role;

-- caller_is_admin_all è SECURITY DEFINER: is_admin_all gira come suo proprietario.
-- Revocare PUBLIC non revoca i privilegi del proprietario. Il blocco seguente
-- gli concede EXECUTE e lo verifica. La revoca successiva chiude l'uso diretto
-- di is_admin_all(uuid) da parte di anon e authenticated.
DO $caller_is_admin_all_execute$
DECLARE
  v_owner name;
BEGIN
  IF to_regprocedure('public.is_admin_all(uuid)') IS NULL THEN
    RAISE EXCEPTION 'caller_is_admin_all chiama is_admin_all(uuid) e la funzione non è nel catalogo.'
      USING ERRCODE = 'P0001';
  END IF;
  IF to_regprocedure('public.caller_is_admin_all()') IS NULL THEN
    RAISE EXCEPTION 'caller_is_admin_all non è nel catalogo.'
      USING ERRCODE = 'P0001';
  END IF;
  SELECT owner_role.rolname
  INTO v_owner
  FROM pg_proc AS fn
  JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
  WHERE fn.oid = 'public.caller_is_admin_all()'::regprocedure;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'caller_is_admin_all non ha un proprietario leggibile.'
      USING ERRCODE = 'P0001';
  END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.is_admin_all(uuid) TO %I', v_owner);
  IF NOT has_function_privilege(v_owner, 'public.is_admin_all(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION
      'Il proprietario di caller_is_admin_all (%) non può eseguire is_admin_all(uuid).',
      v_owner
      USING ERRCODE = 'P0001';
  END IF;
END;
$caller_is_admin_all_execute$;

-- Dopo il controllo sul proprietario. Non tocca postgres né service_role.
-- Le funzioni SECURITY DEFINER di proprietà di postgres continuano a chiamare
-- is_admin_all con il privilegio del proprietario.
REVOKE ALL ON FUNCTION public.is_admin_all(uuid) FROM anon, authenticated;

DROP POLICY IF EXISTS photo_submissions_admin_delete ON public.photo_submissions;
CREATE POLICY photo_submissions_admin_delete
  ON public.photo_submissions
  FOR DELETE
  TO authenticated
  USING (public.caller_is_admin_all());

-- ---------------------------------------------------------------------------
-- sponsor_requests — un solo INSERT. La lettura amministrativa resta.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users insert own sponsor requests" ON public.sponsor_requests;
CREATE POLICY "Authenticated users insert own sponsor requests"
  ON public.sponsor_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND profile_id = auth.uid()
    AND (owner_id IS NULL OR owner_id = auth.uid())
    AND public.effective_permission(auth.uid(), 'BIZ-REQ-FEAT')
  );

-- ---------------------------------------------------------------------------
-- Diario collaborativo. La funzione già in produzione non guarda type né il
-- proprietario della riga. La sostituzione aggiunge quei due vincoli e
-- pg_temp. Non allarga i chiamanti: viewer e collaboratore del diario
-- personal restano. Una riga community, official o ai non passa.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_collaborative_diary(
  p_itinerary_id uuid,
  p_require_collaborator boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_resources sr
    INNER JOIN public.shared_resource_members m
      ON m.shared_resource_id = sr.id
    INNER JOIN public.itineraries i
      ON i.id = sr.resource_id
    WHERE sr.resource_id = p_itinerary_id
      AND sr.kind = 'diary'::public.shared_resource_kind
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND i.id = p_itinerary_id
      AND i.type = 'personal'
      AND i.user_id = sr.owner_id
      AND m.user_id = auth.uid()
      AND (
        NOT p_require_collaborator
        OR m.role = 'collaborator'::public.collaborative_member_role
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_collaborative_diary(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_collaborative_diary(uuid, boolean) TO authenticated;

-- Il registro diary si crea solo sul diario personal di cui owner_id è user_id.
-- Valigie e template non entrano in questo predicato.
DROP POLICY IF EXISTS "shared_resources_owner_write" ON public.shared_resources;
CREATE POLICY "shared_resources_owner_write"
  ON public.shared_resources
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      kind IS DISTINCT FROM 'diary'::public.shared_resource_kind
      OR EXISTS (
        SELECT 1
        FROM public.itineraries AS diary
        WHERE diary.id = resource_id
          AND diary.type = 'personal'
          AND diary.user_id = owner_id
      )
    )
  );

-- type e user_id. Il confronto vecchio/nuovo non sta in una policy.
-- Service role e amministratori restano i soli che possono cambiarli.
CREATE OR REPLACE FUNCTION public.itineraries_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF NOT (public.is_service_role() OR public.is_td_admin(auth.uid())) THEN
      RAISE EXCEPTION 'FORBIDDEN: type or owner change' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.itineraries_guard_privileged_columns() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.itineraries_guard_privileged_columns() TO authenticated, service_role;

DROP TRIGGER IF EXISTS itineraries_guard_privileged_columns ON public.itineraries;
CREATE TRIGGER itineraries_guard_privileged_columns
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.itineraries_guard_privileged_columns();

-- Copia di un diario personal senza lettura pubblica.
-- Il nuovo proprietario è solo auth.uid(). La riga sorgente non cambia.
-- Non copia community, official o ai. Non assegna viaggio né source_diary_id.
-- Autorizzazioni, tutte con shared_resources.owner_id = proprietario del diario:
-- il chiamante è quel proprietario; oppure ha un invito personale ancora
-- pending; oppure è membro collaborator o viewer della condivisione
-- collaborative. workspace_resources non autorizza: il proprietario del
-- Workspace può inserire quel collegamento da solo.
CREATE OR REPLACE FUNCTION public.copy_personal_diary_for_caller(
  p_source_diary_id uuid,
  p_owner_id uuid,
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source public.itineraries%ROWTYPE;
  v_new_id uuid;
  v_allowed boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF p_source_diary_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_SOURCE' USING ERRCODE = '22023';
  END IF;

  IF NOT public.effective_permission(v_uid, 'ITN-PLAN-SELF') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_source
  FROM public.itineraries
  WHERE id = p_source_diary_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_source.type IS DISTINCT FROM 'personal'
     OR v_source.user_id IS NULL
     OR v_source.user_id IS DISTINCT FROM p_owner_id THEN
    RAISE EXCEPTION 'INVALID_SOURCE' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_blocks AS blocks
    WHERE (blocks.blocker_id = v_uid AND blocks.blocked_id = v_source.user_id)
       OR (blocks.blocker_id = v_source.user_id AND blocks.blocked_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  v_allowed := v_source.user_id = v_uid
    OR EXISTS (
      SELECT 1
      FROM public.resource_invites AS invites
      INNER JOIN public.shared_resources AS resources
        ON resources.id = invites.shared_resource_id
      WHERE invites.invitee_id = v_uid
        AND invites.status = 'pending'::public.resource_invite_status
        AND resources.kind = 'diary'::public.shared_resource_kind
        AND resources.sharing_mode = 'personal'::public.sharing_mode
        AND resources.resource_id = v_source.id
        AND resources.owner_id = v_source.user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.shared_resources AS resources
      INNER JOIN public.shared_resource_members AS members
        ON members.shared_resource_id = resources.id
      WHERE resources.kind = 'diary'::public.shared_resource_kind
        AND resources.sharing_mode = 'collaborative'::public.sharing_mode
        AND resources.resource_id = v_source.id
        AND resources.owner_id = v_source.user_id
        AND members.user_id = v_uid
        AND members.role IN (
          'collaborator'::public.collaborative_member_role,
          'viewer'::public.collaborative_member_role
        )
    );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  v_new_id := gen_random_uuid();

  INSERT INTO public.itineraries (
    id,
    user_id,
    title,
    description,
    duration_days,
    type,
    status,
    items_json,
    main_city,
    suitcase_id,
    viaggio_id,
    created_at,
    updated_at,
    last_modified_by
  )
  VALUES (
    v_new_id,
    v_uid,
    COALESCE(NULLIF(trim(p_title), ''), NULLIF(trim(v_source.title), ''), 'Diario'),
    COALESCE(v_source.description, 'Bozza salvata'),
    COALESCE(v_source.duration_days, 1),
    'personal',
    COALESCE(v_source.status, 'draft'),
    v_source.items_json,
    v_source.main_city,
    NULL,
    NULL,
    now(),
    now(),
    v_uid
  );

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.copy_personal_diary_for_caller(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.copy_personal_diary_for_caller(uuid, uuid, text) TO authenticated;

COMMIT;
