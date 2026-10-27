-- Visibilità pubblica, visite conservate, nove scelte di cancellazione città.
-- Non applicata al database remoto da questo intervento.
-- I file stanno in supabase/migrations. config.toml abilita [db.migrations]
-- con schema_paths vuoto. Il package è supabase 2.118.0. Il sorgente della
-- funzione che applica un file non è nel repository: dalla 2.115 la pipeline
-- non è un blocco transazionale, una CLI precedente avvolgeva il file.
-- BEGIN e COMMIT restano. Non dimostrano che l'applicazione sia atomica.
-- COMMIT è l'ultima istruzione: se una transazione è già aperta, la chiude.

BEGIN;

CREATE OR REPLACE FUNCTION public.city_is_publicly_visible(p_city_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cities c
    WHERE c.id = p_city_id
      AND c.status = 'published'
      AND c.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.city_is_publicly_visible(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.city_is_publicly_visible(text) TO anon, authenticated, service_role;
-- Questi GRANT non dicono chi è il proprietario. CREATE OR REPLACE non lo
-- cambia se la funzione esisteva già. Il file non legge proowner.

-- PUBLIC è l'OID 0. Vale anche se polroles è NULL o vuoto, e anche se 0
-- compare insieme ad altri ruoli: in quel caso la policy non è «solo di ruolo».
-- SELECT:
--   nome documentato, solo PUBLIC, USING (true), senza WITH CHECK: si sostituisce;
--   stesso nome in altra forma, anche con ruoli accanto a PUBLIC: ci si ferma;
--   PUBLIC insieme ad altri ruoli: ci si ferma, non si conserva come policy di ruolo
--   e non si ricostruisce;
--   solo PUBLIC, oppure USING true o assente, se non è il nome documentato: ci si ferma;
--   destinatari senza PUBLIC e predicato non vero: si conserva.
-- ALL solo PUBLIC con USING true o assente: INSERT, UPDATE e DELETE, stessi
-- destinatari e stessi predicati. WITH CHECK assente resta il USING.
-- Un'ALL restrittiva non entra qui. Un'ALL senza PUBLIC e con predicato non
-- vero si lascia. PUBLIC misto, o ogni altra ALL, ferma la migration prima dei DROP.
CREATE OR REPLACE FUNCTION public.int09_select_policy_disposition(
  p_table text,
  p_name text,
  p_roles oid[],
  p_using text,
  p_check text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expected text;
  v_has_public boolean;
  v_only_public boolean;
BEGIN
  v_expected := CASE p_table
    WHEN 'pois' THEN 'Public read access for pois'
    WHEN 'shops' THEN 'Public Read Shops'
    WHEN 'city_events' THEN 'city_events_public_read'
    WHEN 'city_services' THEN 'city_services_public_read'
    WHEN 'city_guides' THEN 'Public Read Guides'
    WHEN 'city_tour_operators' THEN 'Public Read Operators'
    WHEN 'city_people' THEN 'city_people_public_read'
    ELSE NULL
  END;
  v_has_public := p_roles IS NULL
    OR coalesce(cardinality(p_roles), 0) = 0
    OR 0 = ANY (p_roles);
  v_only_public := p_roles IS NULL
    OR coalesce(cardinality(p_roles), 0) = 0
    OR NOT EXISTS (
      SELECT 1
      FROM unnest(p_roles) AS role_oid
      WHERE role_oid IS DISTINCT FROM 0
    );
  IF p_name IS NOT DISTINCT FROM v_expected
     AND v_only_public
     AND p_using IS NOT NULL
     AND lower(btrim(p_using)) = 'true'
     AND p_check IS NULL THEN
    RETURN 'replace';
  END IF;
  IF p_name IS NOT DISTINCT FROM v_expected THEN
    RAISE EXCEPTION
      'Policy SELECT % su % è la lettura pubblica documentata ma non è solo PUBLIC USING (true) senza WITH CHECK. Non viene eliminata. USING %.',
      COALESCE(p_name, '(senza nome)'),
      p_table,
      COALESCE(p_using, '(assente)');
  END IF;
  IF v_has_public AND NOT v_only_public THEN
    RAISE EXCEPTION
      'Policy SELECT % su % include PUBLIC insieme ad altri destinatari. Non è una policy solo di ruolo e non viene eliminata. USING %.',
      COALESCE(p_name, '(senza nome)'),
      p_table,
      COALESCE(p_using, '(assente)');
  END IF;
  IF v_has_public OR p_using IS NULL OR lower(btrim(p_using)) = 'true' THEN
    RAISE EXCEPTION
      'Policy SELECT % su % è una lettura permissiva aperta e non è fra quelle da sostituire. Non viene eliminata. USING %.',
      COALESCE(p_name, '(senza nome)'),
      p_table,
      COALESCE(p_using, '(assente)');
  END IF;
  RETURN 'keep';
END;
$$;

DROP FUNCTION IF EXISTS public.int09_close_public_entity_reads(text[]);
DROP FUNCTION IF EXISTS public.int09_assert_all_policy_select_replaced(text, text, oid[], text);
CREATE FUNCTION public.int09_assert_all_policy_select_replaced(
  p_table text,
  p_name text,
  p_roles oid[],
  p_using text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_public boolean;
  v_only_public boolean;
BEGIN
  v_has_public := p_roles IS NULL
    OR coalesce(cardinality(p_roles), 0) = 0
    OR 0 = ANY (p_roles);
  v_only_public := p_roles IS NULL
    OR coalesce(cardinality(p_roles), 0) = 0
    OR NOT EXISTS (
      SELECT 1
      FROM unnest(p_roles) AS role_oid
      WHERE role_oid IS DISTINCT FROM 0
    );
  IF v_only_public AND (p_using IS NULL OR lower(btrim(p_using)) = 'true') THEN
    RETURN 'split';
  END IF;
  IF v_has_public AND NOT v_only_public THEN
    RAISE EXCEPTION
      'Policy ALL % su % include PUBLIC insieme ad altri destinatari. Non viene ricostruita né trattata come policy solo di ruolo. USING %.',
      p_name,
      p_table,
      COALESCE(p_using, '(assente)');
  END IF;
  IF NOT v_has_public
     AND p_using IS NOT NULL
     AND lower(btrim(p_using)) <> 'true' THEN
    RETURN 'keep';
  END IF;
  RAISE EXCEPTION
    'Policy ALL % su % non è ricostruibile: o è PUBLIC con USING diverso da true, o è una lettura aperta per destinatari non pubblici. Non viene modificata. USING %.',
    p_name,
    p_table,
    COALESCE(p_using, '(assente)');
END;
$$;

CREATE OR REPLACE FUNCTION public.int09_close_public_entity_reads(p_tables text[])
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pol record;
  v_roles text;
  v_using text;
  v_check text;
  v_unresolved integer;
  v_names text[] := ARRAY[NULL, NULL, NULL];
  v_suffixes text[] := ARRAY['ins', 'upd', 'del'];
  v_i integer;
  v_n integer;
  v_candidate text;
  v_pass integer;
BEGIN
  FOR v_pass IN 1..2 LOOP
    FOR v_pol IN
      SELECT
        c.relname AS table_name,
        pol.polname AS policy_name,
        pol.polcmd AS command,
        pol.polroles AS role_oids,
        pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
        pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = ANY (p_tables)
        AND pol.polpermissive
        AND pol.polcmd IN ('r', '*')
      ORDER BY c.relname, pol.polname
    LOOP
      IF v_pol.command = 'r' THEN
        IF public.int09_select_policy_disposition(
          v_pol.table_name,
          v_pol.policy_name,
          v_pol.role_oids,
          v_pol.using_expr,
          v_pol.check_expr
        ) = 'replace' AND v_pass = 2 THEN
          EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            v_pol.policy_name,
            v_pol.table_name
          );
        END IF;
      ELSIF v_pol.command = '*' THEN
        IF public.int09_assert_all_policy_select_replaced(
          v_pol.table_name,
          v_pol.policy_name,
          v_pol.role_oids,
          v_pol.using_expr
        ) = 'keep' THEN
          CONTINUE;
        END IF;
        IF v_pol.role_oids IS NULL
           OR coalesce(cardinality(v_pol.role_oids), 0) = 0
           OR NOT EXISTS (
             SELECT 1
             FROM unnest(v_pol.role_oids) AS role_oid
             WHERE role_oid IS DISTINCT FROM 0
           ) THEN
          v_roles := ' TO PUBLIC';
        ELSIF 0 = ANY (v_pol.role_oids) THEN
          RAISE EXCEPTION
            'Policy ALL % su % include PUBLIC insieme ad altri destinatari e non arriva alla ricostruzione.',
            v_pol.policy_name, v_pol.table_name;
        ELSE
          SELECT count(*)
          INTO v_unresolved
          FROM unnest(v_pol.role_oids) AS role_oid
          WHERE role_oid <> 0
            AND NOT EXISTS (
              SELECT 1 FROM pg_roles r WHERE r.oid = role_oid
            );
          IF v_unresolved > 0 THEN
            RAISE EXCEPTION
              'Policy % su % ha un destinatario assente da pg_roles e diverso da PUBLIC.',
              v_pol.policy_name, v_pol.table_name;
          END IF;
          SELECT string_agg(
            CASE
              WHEN u.role_oid = 0 THEN 'PUBLIC'
              ELSE quote_ident(r.rolname)
            END,
            ', ' ORDER BY u.ord
          )
          INTO v_roles
          FROM unnest(v_pol.role_oids) WITH ORDINALITY AS u(role_oid, ord)
          LEFT JOIN pg_roles r ON r.oid = u.role_oid AND u.role_oid <> 0;
          v_roles := ' TO ' || v_roles;
        END IF;

        v_using := COALESCE(v_pol.using_expr, 'true');
        v_check := COALESCE(v_pol.check_expr, v_using);

        FOR v_i IN 1..3 LOOP
          v_n := 0;
          LOOP
            v_candidate := 'cv'
              || substr(md5(v_pol.table_name || E'\n' || v_pol.policy_name), 1, 16)
              || CASE WHEN v_n = 0 THEN '' ELSE v_n::text END
              || '_' || v_suffixes[v_i];
            EXIT WHEN NOT EXISTS (
              SELECT 1
              FROM pg_policy existing
              JOIN pg_class existing_table ON existing_table.oid = existing.polrelid
              JOIN pg_namespace existing_ns ON existing_ns.oid = existing_table.relnamespace
              WHERE existing_ns.nspname = 'public'
                AND existing_table.relname = v_pol.table_name
                AND existing.polname = v_candidate
            );
            v_n := v_n + 1;
            IF v_n > 20 THEN
              RAISE EXCEPTION
                'Nome policy ricostruita in collisione su %.', v_pol.table_name;
            END IF;
          END LOOP;
          v_names[v_i] := v_candidate;
        END LOOP;

        IF v_pass = 2 THEN
          EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            v_pol.policy_name,
            v_pol.table_name
          );
          EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR INSERT%s WITH CHECK (%s)',
            v_names[1],
            v_pol.table_name,
            v_roles,
            v_check
          );
          EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR UPDATE%s USING (%s) WITH CHECK (%s)',
            v_names[2],
            v_pol.table_name,
            v_roles,
            v_using,
            v_check
          );
          EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR DELETE%s USING (%s)',
            v_names[3],
            v_pol.table_name,
            v_roles,
            v_using
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.int09_select_policy_disposition(text, text, oid[], text, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.int09_assert_all_policy_select_replaced(text, text, oid[], text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.int09_close_public_entity_reads(text[]) FROM PUBLIC, anon, authenticated, service_role;

-- Prima di ogni DROP di policy e prima di togliere la FK delle visite.
-- BEGIN/COMMIT non sono la garanzia: questi controlli non scrivono.
DO $int09_before_policy_and_fk$
DECLARE
  v_def text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy AS pol
    JOIN pg_class AS rel ON rel.oid = pol.polrelid
    JOIN pg_namespace AS namespace_info ON namespace_info.oid = rel.relnamespace
    WHERE namespace_info.nspname = 'public'
      AND rel.relname = ANY (ARRAY[
        'pois', 'shops', 'city_events', 'city_services',
        'city_guides', 'city_tour_operators', 'city_people'
      ])
      AND NOT pol.polpermissive
      AND pol.polcmd IN ('r', '*')
  ) THEN
    RAISE EXCEPTION
      'Una policy restrittiva di lettura sulle sette tabelle può negare la lettura pubblica. La migration non la modifica e si ferma prima dei DROP.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT pg_get_constraintdef(fk.oid)
  INTO v_def
  FROM pg_constraint AS fk
  JOIN pg_attribute AS source_att
    ON source_att.attrelid = fk.conrelid
   AND source_att.attnum = fk.conkey[1]
  JOIN pg_class AS target ON target.oid = fk.confrelid
  JOIN pg_namespace AS target_ns ON target_ns.oid = target.relnamespace
  JOIN pg_attribute AS target_att
    ON target_att.attrelid = fk.confrelid
   AND target_att.attnum = fk.confkey[1]
  WHERE fk.conname = 'user_visited_cities_city_id_fkey'
    AND fk.conrelid = 'public.user_visited_cities'::regclass
    AND fk.contype = 'f'
    AND fk.convalidated
    AND cardinality(fk.conkey) = 1
    AND cardinality(fk.confkey) = 1
    AND source_att.attname = 'city_id'
    AND source_att.attnotnull
    AND target_ns.nspname = 'public'
    AND target.relname = 'cities'
    AND target_att.attname = 'id'
    AND fk.confdeltype = 'c';
  IF v_def IS NULL OR position('ON DELETE CASCADE' IN v_def) = 0 THEN
    RAISE EXCEPTION
      'user_visited_cities_city_id_fkey non è la foreign key validata di city_id verso cities.id ON DELETE CASCADE. Il vincolo non viene rimosso. Definizione: %',
      COALESCE(v_def, '(assente)')
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS pk
    JOIN pg_attribute AS pk_att
      ON pk_att.attrelid = pk.conrelid
     AND pk_att.attnum = ANY (pk.conkey)
    WHERE pk.conrelid = 'public.user_visited_cities'::regclass
      AND pk.contype = 'p'
      AND pk_att.attname = 'city_id'
  ) THEN
    RAISE EXCEPTION
      'city_id non fa parte della chiave primaria di user_visited_cities. Il vincolo non viene rimosso.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$int09_before_policy_and_fk$;

SELECT public.int09_close_public_entity_reads(ARRAY[
  'pois',
  'shops',
  'city_events',
  'city_services',
  'city_guides',
  'city_tour_operators',
  'city_people'
]);

-- anon non ha EXECUTE su is_td_admin. La lettura anonima non chiama quella funzione.
-- L'amministratore autenticato resta coperto dalla seconda policy.
CREATE POLICY pois_public_read_published_city ON public.pois
  FOR SELECT TO anon
  USING (
    public.city_is_publicly_visible(city_id)
    AND status = 'published'
  );
-- ALL TO PUBLIC dava la SELECT anche a un ruolo che non è anon né
-- authenticated. La lettura pubblica resta il predicato della città
-- pubblicata, per PUBLIC, non USING (true). L'amministratore resta sulla
-- policy authenticated.
CREATE POLICY pois_any_role_read_published_city ON public.pois
  FOR SELECT TO PUBLIC
  USING (
    public.city_is_publicly_visible(city_id)
    AND status = 'published'
  );
CREATE POLICY pois_authenticated_read_published_city ON public.pois
  FOR SELECT TO authenticated
  USING (
    (
      public.city_is_publicly_visible(city_id)
      AND status = 'published'
    )
    OR public.is_td_admin(auth.uid())
  );
CREATE POLICY shops_public_read_published_city ON public.shops
  FOR SELECT TO anon
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY shops_any_role_read_published_city ON public.shops
  FOR SELECT TO PUBLIC
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY shops_authenticated_read_published_city ON public.shops
  FOR SELECT TO authenticated
  USING (public.city_is_publicly_visible(city_id) OR public.is_td_admin(auth.uid()));
CREATE POLICY city_events_public_read_published_city ON public.city_events
  FOR SELECT TO anon
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_events_any_role_read_published_city ON public.city_events
  FOR SELECT TO PUBLIC
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_events_authenticated_read_published_city ON public.city_events
  FOR SELECT TO authenticated
  USING (public.city_is_publicly_visible(city_id) OR public.is_td_admin(auth.uid()));
CREATE POLICY city_services_public_read_published_city ON public.city_services
  FOR SELECT TO anon
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_services_any_role_read_published_city ON public.city_services
  FOR SELECT TO PUBLIC
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_services_authenticated_read_published_city ON public.city_services
  FOR SELECT TO authenticated
  USING (public.city_is_publicly_visible(city_id) OR public.is_td_admin(auth.uid()));
CREATE POLICY city_guides_public_read_published_city ON public.city_guides
  FOR SELECT TO anon
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_guides_any_role_read_published_city ON public.city_guides
  FOR SELECT TO PUBLIC
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_guides_authenticated_read_published_city ON public.city_guides
  FOR SELECT TO authenticated
  USING (public.city_is_publicly_visible(city_id) OR public.is_td_admin(auth.uid()));
CREATE POLICY city_tour_operators_public_read_published_city ON public.city_tour_operators
  FOR SELECT TO anon
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_tour_operators_any_role_read_published_city ON public.city_tour_operators
  FOR SELECT TO PUBLIC
  USING (public.city_is_publicly_visible(city_id));
CREATE POLICY city_tour_operators_authenticated_read_published_city ON public.city_tour_operators
  FOR SELECT TO authenticated
  USING (public.city_is_publicly_visible(city_id) OR public.is_td_admin(auth.uid()));
CREATE POLICY city_people_public_read_published_city ON public.city_people
  FOR SELECT TO anon
  USING (
    public.city_is_publicly_visible(city_id)
    AND status = 'published'
  );
CREATE POLICY city_people_any_role_read_published_city ON public.city_people
  FOR SELECT TO PUBLIC
  USING (
    public.city_is_publicly_visible(city_id)
    AND status = 'published'
  );
CREATE POLICY city_people_authenticated_read_published_city ON public.city_people
  FOR SELECT TO authenticated
  USING (
    (
      public.city_is_publicly_visible(city_id)
      AND status = 'published'
    )
    OR public.is_td_admin(auth.uid())
  );

-- POI e persone: solo status published è pubblico (20260916120000).
-- NULL, draft, suspended, canceled e needs_check restano fuori.
-- Le altre cinque tabelle non hanno una colonna di stato editoriale.
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_tour_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_people ENABLE ROW LEVEL SECURITY;

DO $int09_rls_required$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class AS rel
    JOIN pg_namespace AS namespace_info ON namespace_info.oid = rel.relnamespace
    WHERE namespace_info.nspname = 'public'
      AND rel.relname = ANY (ARRAY[
        'pois', 'shops', 'city_events', 'city_services',
        'city_guides', 'city_tour_operators', 'city_people'
      ])
      AND NOT rel.relrowsecurity
  ) THEN
    RAISE EXCEPTION
      'RLS non è attiva su una delle sette tabelle di lettura pubblica.'
      USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_policy AS pol
    JOIN pg_class AS rel ON rel.oid = pol.polrelid
    JOIN pg_namespace AS namespace_info ON namespace_info.oid = rel.relnamespace
    WHERE namespace_info.nspname = 'public'
      AND rel.relname = ANY (ARRAY[
        'pois', 'shops', 'city_events', 'city_services',
        'city_guides', 'city_tour_operators', 'city_people'
      ])
      AND NOT pol.polpermissive
      AND pol.polcmd IN ('r', '*')
  ) THEN
    RAISE EXCEPTION
      'Una policy restrittiva di lettura sulle sette tabelle può negare la lettura pubblica. La migration non la modifica e si ferma.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$int09_rls_required$;

-- Archivio Esploratore (DOC 35): la visita non segue la cancellazione del
-- Viaggio e non segue nemmeno l'hard-delete della città. La chiave originale
-- è ON DELETE CASCADE (20260728120000): lasciarla cancellerebbe le visite.
-- Sostituirla con NO ACTION bloccherebbe l'hard-delete finché esiste una
-- visita e la farebbe entrare di fatto in v_soft_city. ON DELETE SET NULL
-- non è applicabile: city_id è NOT NULL e fa parte della chiave primaria.
-- listVisitedCities legge user_id, city_id, first_seen_at, source, senza join.
-- MySpaceExplorerRoot, se getCitiesMinimalByIds non ha il nome, mostra cityId.
-- Il controllo del vincolo è già stato eseguito prima dei DROP di policy.
ALTER TABLE public.user_visited_cities DROP CONSTRAINT user_visited_cities_city_id_fkey;

DROP FUNCTION IF EXISTS public.int09_parse_city_delete_options(jsonb);

CREATE OR REPLACE FUNCTION public.int09_parse_city_delete_options(p_options jsonb)
RETURNS TABLE (
  keep_community_photos boolean,
  keep_patron_photos boolean,
  keep_people boolean,
  keep_pois boolean,
  keep_shops boolean,
  keep_events boolean,
  keep_services boolean,
  keep_guides boolean,
  keep_operators boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_opts jsonb := COALESCE(p_options, '{}'::jsonb);
  v_key text;
  v_legacy_photos boolean;
BEGIN
  IF jsonb_typeof(v_opts) <> 'object' THEN
    RAISE EXCEPTION 'p_options deve essere un oggetto JSON.';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(v_opts)
  LOOP
    IF v_key NOT IN (
      'keepCommunityPhotos',
      'keepPatronPhotos',
      'keepPeople',
      'keepPOIs',
      'keepShops',
      'keepEvents',
      'keepServices',
      'keepGuides',
      'keepOperators',
      'keepUserPhotos'
    ) THEN
      RAISE EXCEPTION 'p_options chiave non consentita: %', v_key;
    END IF;
    IF jsonb_typeof(v_opts -> v_key) <> 'boolean' THEN
      RAISE EXCEPTION 'p_options.% deve essere boolean.', v_key;
    END IF;
  END LOOP;

  v_legacy_photos := COALESCE((v_opts ->> 'keepUserPhotos')::boolean, true);
  keep_community_photos := COALESCE((v_opts ->> 'keepCommunityPhotos')::boolean, v_legacy_photos);
  keep_patron_photos := COALESCE((v_opts ->> 'keepPatronPhotos')::boolean, v_legacy_photos);
  keep_people := COALESCE((v_opts ->> 'keepPeople')::boolean, true);
  keep_pois := COALESCE((v_opts ->> 'keepPOIs')::boolean, false);
  keep_shops := COALESCE((v_opts ->> 'keepShops')::boolean, true);
  keep_events := COALESCE((v_opts ->> 'keepEvents')::boolean, true);
  keep_services := COALESCE((v_opts ->> 'keepServices')::boolean, true);
  keep_guides := COALESCE((v_opts ->> 'keepGuides')::boolean, true);
  keep_operators := COALESCE((v_opts ->> 'keepOperators')::boolean, true);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.int09_parse_city_delete_options(jsonb) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_city_admin(
  p_city_id text,
  p_options jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text := NULLIF(trim(p_city_id), '');
  v_keep_community boolean;
  v_keep_patron boolean;
  v_keep_pois boolean;
  v_keep_people boolean;
  v_keep_shops boolean;
  v_keep_events boolean;
  v_keep_services boolean;
  v_keep_guides boolean;
  v_keep_operators boolean;
  v_soft_city boolean;
  v_cascade_hit boolean;
  v_fk record;
  v_poi_id text;
  v_person_id uuid;
  v_gallery_id uuid;
  v_guide_ids text[];
  v_operator_ids text[];
  v_poi_ids text[];
  v_shop_ids text[];
  v_assignment public.entity_image_assignments%ROWTYPE;
  v_unlisted text;
BEGIN
  PERFORM public.assert_td_admin_all();

  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  SELECT
    t.keep_community_photos,
    t.keep_patron_photos,
    t.keep_pois,
    t.keep_people,
    t.keep_shops,
    t.keep_events,
    t.keep_services,
    t.keep_guides,
    t.keep_operators
  INTO
    v_keep_community,
    v_keep_patron,
    v_keep_pois,
    v_keep_people,
    v_keep_shops,
    v_keep_events,
    v_keep_services,
    v_keep_guides,
    v_keep_operators
  FROM public.int09_parse_city_delete_options(p_options) AS t;

  PERFORM pg_advisory_xact_lock(hashtext('delete_city_admin:' || v_city_id));

  PERFORM 1
  FROM public.cities c
  WHERE c.id = v_city_id
    AND c.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Città % non trovata o già eliminata (soft-deleted).', v_city_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.cities'::regclass
      AND NOT trigger_info.tgisinternal
      AND (
        (trigger_info.tgtype & 8) = 8
        OR (trigger_info.tgtype & 16) = 16
        OR (trigger_info.tgtype & 32) = 32
      )
  ) THEN
    RAISE EXCEPTION
      'Cancellazione interrotta prima di ogni modifica: public.cities ha trigger non interni su UPDATE, DELETE o TRUNCATE. Non esiste un elenco approvato. Nessuna riga collegata viene toccata.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY[
      'public.int09_revoke_photo_submission_assignments_for_city(text)',
      'public.delete_city_patron_gallery_photo_with_assignment(uuid)',
      'public.revoke_patron_primary_image_assignment(text)',
      'public.append_entity_image_history_trusted(text,uuid,uuid,text,text,text,text,text,public.image_asset_status,public.image_asset_status,uuid,text,text,boolean,jsonb)',
      'public.handle_city_deleted_for_sponsors(text)',
      'public.delete_city_person_with_image_cleanup(uuid)',
      'public.delete_poi_with_image_cleanup(text)'
    ]) AS signature(sig)
    WHERE to_regprocedure(signature.sig) IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cancellazione interrotta prima di ogni modifica: una funzione di pulizia del contratto non è nel catalogo. Nessuna riga collegata viene toccata.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Rifiuta pericoli classificabili: linguaggio diverso da sql o plpgsql
  -- fuori da pg_catalog, EXECUTE, nomi di effetti che il rollback non annulla.
  -- Non autorizza l'hard-delete. Una chiamata senza pg_depend resta invisibile.
  IF EXISTS (
    WITH RECURSIVE reached(fn_oid) AS (
      SELECT fn.oid
      FROM unnest(ARRAY[
        'public.int09_revoke_photo_submission_assignments_for_city(text)',
        'public.delete_city_patron_gallery_photo_with_assignment(uuid)',
        'public.revoke_patron_primary_image_assignment(text)',
        'public.append_entity_image_history_trusted(text,uuid,uuid,text,text,text,text,text,public.image_asset_status,public.image_asset_status,uuid,text,text,boolean,jsonb)',
        'public.handle_city_deleted_for_sponsors(text)',
        'public.delete_city_person_with_image_cleanup(uuid)',
        'public.delete_poi_with_image_cleanup(text)'
      ]) AS signature(sig)
      JOIN pg_proc AS fn ON fn.oid = to_regprocedure(signature.sig)
      UNION
      SELECT trigger_info.tgfoid
      FROM pg_trigger AS trigger_info
      WHERE NOT trigger_info.tgisinternal
        AND trigger_info.tgrelid = ANY (ARRAY[
          'public.cities'::regclass,
          'public.photo_submissions'::regclass,
          'public.patron_photo_reports'::regclass,
          'public.city_patron_gallery'::regclass,
          'public.patron_photo_suggestions'::regclass,
          'public.sponsors'::regclass,
          'public.entity_image_assignments'::regclass,
          'public.shops'::regclass,
          'public.famous_person_photo_reports'::regclass,
          'public.famous_person_photo_suggestions'::regclass,
          'public.famous_person_suggestions'::regclass,
          'public.city_people'::regclass,
          'public.reviews'::regclass,
          'public.suggestions'::regclass,
          'public.pois'::regclass,
          'public.city_events'::regclass,
          'public.city_services'::regclass,
          'public.city_guides'::regclass,
          'public.city_tour_operators'::regclass,
          'public.content_reports'::regclass
        ])
      UNION
      SELECT dependency.refobjid
      FROM reached
      JOIN pg_depend AS dependency
        ON dependency.classid = 'pg_proc'::regclass
       AND dependency.objid = reached.fn_oid
       AND dependency.refclassid = 'pg_proc'::regclass
       AND dependency.deptype = 'n'
       AND dependency.refobjid IS DISTINCT FROM reached.fn_oid
    )
    SELECT 1
    FROM reached
    JOIN pg_proc AS fn ON fn.oid = reached.fn_oid
    JOIN pg_namespace AS ns ON ns.oid = fn.pronamespace
    JOIN pg_language AS lang ON lang.oid = fn.prolang
    WHERE coalesce(fn.prosrc, '') ~* '(dblink|pg_net|net\.http|http_request|http_post|storage\.objects|lo_export|lo_import)'
       OR (
         ns.nspname IS DISTINCT FROM 'pg_catalog'
         AND (
           lang.lanname NOT IN ('sql', 'plpgsql')
           OR coalesce(fn.prosrc, '') ~* '\mexecute\M'
         )
       )
  ) THEN
    RAISE EXCEPTION
      'Cancellazione interrotta prima di ogni modifica: nel grafo statico c''è un linguaggio non sql/plpgsql fuori da pg_catalog, EXECUTE, oppure un effetto non annullato dal rollback. Una chiamata senza dipendenza non è visibile e questo controllo non certifica il percorso. Nessuna riga collegata viene toccata.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint AS fk
    WHERE fk.confrelid = 'public.cities'::regclass
      AND fk.contype = 'f'
      AND (
        NOT fk.convalidated
        OR fk.confdeltype NOT IN ('a', 'r', 'c', 'n', 'd')
        OR (
          fk.confdeltype IN ('c', 'n', 'd')
          AND cardinality(fk.conkey) IS DISTINCT FROM 1
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Cancellazione interrotta prima di ogni modifica: una foreign key verso cities non è validata, ha un''azione sconosciuta, oppure CASCADE, SET NULL o SET DEFAULT non è a colonna singola.'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_keep_community THEN
    UPDATE public.photo_submissions ps
    SET status = 'city_deleted', updated_at = now()
    WHERE ps.city_id = v_city_id;
  ELSE
    PERFORM public.int09_revoke_photo_submission_assignments_for_city(v_city_id);
    DELETE FROM public.photo_submissions ps WHERE ps.city_id = v_city_id;
  END IF;

  IF NOT v_keep_patron THEN
    DELETE FROM public.patron_photo_reports ppr WHERE ppr.city_id = v_city_id;
    FOR v_gallery_id IN
      SELECT g.id FROM public.city_patron_gallery g WHERE g.city_id = v_city_id
    LOOP
      PERFORM public.delete_city_patron_gallery_photo_with_assignment(v_gallery_id);
    END LOOP;
    PERFORM public.revoke_patron_primary_image_assignment(v_city_id);
    DELETE FROM public.patron_photo_suggestions pps WHERE pps.city_id = v_city_id;
  END IF;

  SELECT coalesce(array_agg(g.id::text), '{}') INTO v_guide_ids
  FROM public.city_guides g WHERE g.city_id = v_city_id;
  SELECT coalesce(array_agg(o.id::text), '{}') INTO v_operator_ids
  FROM public.city_tour_operators o WHERE o.city_id = v_city_id;
  SELECT coalesce(array_agg(p.id::text), '{}') INTO v_poi_ids
  FROM public.pois p WHERE p.city_id = v_city_id;
  SELECT coalesce(array_agg(s.id::text), '{}') INTO v_shop_ids
  FROM public.shops s WHERE s.city_id = v_city_id;

  IF cardinality(v_guide_ids) > 0 AND NOT v_keep_guides THEN
    UPDATE public.sponsors sp SET guide_id = NULL WHERE sp.guide_id = ANY (v_guide_ids);
  END IF;
  IF cardinality(v_operator_ids) > 0 AND NOT v_keep_operators THEN
    UPDATE public.sponsors sp SET operator_id = NULL WHERE sp.operator_id = ANY (v_operator_ids);
  END IF;
  IF cardinality(v_poi_ids) > 0 AND NOT v_keep_pois THEN
    FOR v_assignment IN
      SELECT eia.*
      FROM public.entity_image_assignments eia
      JOIN public.media_assets ma ON ma.id = eia.media_asset_id
      WHERE eia.entity_type = 'poi'
        AND eia.entity_id = ANY (v_poi_ids)
        AND eia.is_current = true
        AND eia.assignment_status = 'active'
        AND ma.origin_type = 'sponsor'
      ORDER BY eia.entity_id, eia.id
    LOOP
      UPDATE public.entity_image_assignments
      SET
        assignment_status = 'removed',
        is_current = false,
        removed_at = now(),
        updated_at = now()
      WHERE id = v_assignment.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_status_changed',
        v_assignment.media_asset_id,
        v_assignment.id,
        'poi',
        v_assignment.entity_id,
        v_assignment.city_id,
        'active',
        'removed',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        jsonb_build_object(
          'assignment_role', v_assignment.assignment_role,
          'source', 'delete_city_admin',
          'reason', 'poi_deleted'
        )
      );
    END LOOP;

    UPDATE public.sponsors sp SET poi_id = NULL WHERE sp.poi_id = ANY (v_poi_ids);
  END IF;
  IF cardinality(v_shop_ids) > 0 AND NOT v_keep_shops THEN
    UPDATE public.sponsors sp SET shop_id = NULL WHERE sp.shop_id = ANY (v_shop_ids);
  END IF;

  PERFORM public.handle_city_deleted_for_sponsors(v_city_id);

  IF NOT v_keep_shops THEN
    DELETE FROM public.shops sh WHERE sh.city_id = v_city_id;
  END IF;

  IF NOT v_keep_people THEN
    DELETE FROM public.famous_person_photo_reports WHERE city_id = v_city_id;
    DELETE FROM public.famous_person_photo_suggestions WHERE city_id = v_city_id;
    DELETE FROM public.famous_person_suggestions WHERE city_id = v_city_id;
    FOR v_person_id IN
      SELECT cp.id FROM public.city_people cp WHERE cp.city_id = v_city_id
    LOOP
      PERFORM public.delete_city_person_with_image_cleanup(v_person_id);
    END LOOP;
  END IF;

  IF NOT v_keep_pois THEN
    FOR v_poi_id IN
      SELECT p.id FROM public.pois p WHERE p.city_id = v_city_id
    LOOP
      DELETE FROM public.reviews r WHERE r.poi_id = v_poi_id;
      DELETE FROM public.suggestions su WHERE su.poi_id = v_poi_id;
      PERFORM public.delete_poi_with_image_cleanup(v_poi_id);
    END LOOP;
  END IF;

  IF NOT v_keep_events THEN
    DELETE FROM public.city_events WHERE city_id = v_city_id;
  END IF;
  IF NOT v_keep_services THEN
    DELETE FROM public.city_services WHERE city_id = v_city_id;
  END IF;
  IF NOT v_keep_guides THEN
    DELETE FROM public.city_guides WHERE city_id = v_city_id;
  END IF;
  IF NOT v_keep_operators THEN
    DELETE FROM public.city_tour_operators WHERE city_id = v_city_id;
  END IF;

  -- v_keep_* è solo la scelta di cancellazione. Qui contano le righe rimaste.
  -- 20260929100000 ha cambiato alcune FK: il catalogo, non questo elenco,
  -- decide se un CASCADE residuo ha ancora righe.
  SELECT (
    EXISTS (SELECT 1 FROM public.photo_submissions ps WHERE ps.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.pois p WHERE p.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_people cp WHERE cp.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_patron_gallery g WHERE g.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.patron_photo_reports ppr WHERE ppr.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.patron_photo_suggestions pps WHERE pps.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.famous_person_photo_reports fpr WHERE fpr.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.famous_person_photo_suggestions fps WHERE fps.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.famous_person_suggestions fsu WHERE fsu.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.shops sh WHERE sh.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_events ev WHERE ev.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_services sv WHERE sv.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_guides gd WHERE gd.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_tour_operators op WHERE op.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.entity_image_assignments eia WHERE eia.city_id = v_city_id)
  ) INTO v_soft_city;

  IF v_soft_city THEN
    UPDATE public.cities c
    SET status = 'deleted_orphan', deleted_at = now(), updated_at = now()
    WHERE c.id = v_city_id;
  ELSE
    -- L'hard-delete prosegue solo se ogni funzione fuori da pg_catalog
    -- raggiunta dal grafo è una di quelle lette nel repository. Non dimostra
    -- l'assenza di chiamate dinamiche. Un trigger o una funzione non in elenco
    -- è un prerequisito non soddisfatto: la città non viene cancellata.
    SELECT string_agg(
      ns.nspname || '.' || fn.proname || '(' || pg_get_function_identity_arguments(fn.oid) || ')',
      ', ' ORDER BY ns.nspname, fn.proname
    )
    INTO v_unlisted
    FROM (
      WITH RECURSIVE reached(fn_oid) AS (
        SELECT fn.oid
        FROM unnest(ARRAY[
          'public.int09_revoke_photo_submission_assignments_for_city(text)',
          'public.delete_city_patron_gallery_photo_with_assignment(uuid)',
          'public.revoke_patron_primary_image_assignment(text)',
          'public.append_entity_image_history_trusted(text,uuid,uuid,text,text,text,text,text,public.image_asset_status,public.image_asset_status,uuid,text,text,boolean,jsonb)',
          'public.handle_city_deleted_for_sponsors(text)',
          'public.delete_city_person_with_image_cleanup(uuid)',
          'public.delete_poi_with_image_cleanup(text)',
          'public.assert_td_admin_all()',
          'public.int09_parse_city_delete_options(jsonb)'
        ]) AS signature(sig)
        JOIN pg_proc AS fn ON fn.oid = to_regprocedure(signature.sig)
        UNION
        SELECT trigger_info.tgfoid
        FROM pg_trigger AS trigger_info
        WHERE NOT trigger_info.tgisinternal
          AND trigger_info.tgrelid = ANY (ARRAY[
            'public.cities'::regclass,
            'public.photo_submissions'::regclass,
            'public.patron_photo_reports'::regclass,
            'public.city_patron_gallery'::regclass,
            'public.patron_photo_suggestions'::regclass,
            'public.sponsors'::regclass,
            'public.entity_image_assignments'::regclass,
            'public.shops'::regclass,
            'public.famous_person_photo_reports'::regclass,
            'public.famous_person_photo_suggestions'::regclass,
            'public.famous_person_suggestions'::regclass,
            'public.city_people'::regclass,
            'public.pois'::regclass,
            'public.city_events'::regclass,
            'public.city_services'::regclass,
            'public.city_guides'::regclass,
            'public.city_tour_operators'::regclass,
            'public.content_reports'::regclass,
            'public.reviews'::regclass,
            'public.suggestions'::regclass
          ])
        UNION
        SELECT dependency.refobjid
        FROM reached
        JOIN pg_depend AS dependency
          ON dependency.classid = 'pg_proc'::regclass
         AND dependency.objid = reached.fn_oid
         AND dependency.refclassid = 'pg_proc'::regclass
         AND dependency.deptype = 'n'
         AND dependency.refobjid IS DISTINCT FROM reached.fn_oid
      )
      SELECT reached.fn_oid FROM reached
    ) AS reached_fn
    JOIN pg_proc AS fn ON fn.oid = reached_fn.fn_oid
    JOIN pg_namespace AS ns ON ns.oid = fn.pronamespace
    WHERE ns.nspname IS DISTINCT FROM 'pg_catalog'
      AND fn.oid <> ALL (COALESCE((
        SELECT array_agg(known.oid)
        FROM unnest(ARRAY[
          'public.int09_revoke_photo_submission_assignments_for_city(text)',
          'public.delete_city_patron_gallery_photo_with_assignment(uuid)',
          'public.revoke_patron_gallery_image_assignment(uuid)',
          'public.revoke_patron_primary_image_assignment(text)',
          'public.append_entity_image_history_trusted(text,uuid,uuid,text,text,text,text,text,public.image_asset_status,public.image_asset_status,uuid,text,text,boolean,jsonb)',
          'public.handle_city_deleted_for_sponsors(text)',
          'public.delete_city_person_with_image_cleanup(uuid)',
          'public.delete_poi_with_image_cleanup(text)',
          'public.assert_td_admin_all()',
          'public.int09_parse_city_delete_options(jsonb)',
          'public.is_service_role()',
          'public.is_td_admin(uuid)',
          'auth.uid()'
        ]) AS signature(sig)
        JOIN pg_proc AS known ON known.oid = to_regprocedure(signature.sig)
      ), ARRAY[]::oid[]));
    IF v_unlisted IS NOT NULL THEN
      RAISE EXCEPTION
        'Prerequisito non soddisfatto: hard-delete non eseguito. Il grafo statico raggiunge funzioni non recensite (%). pg_depend non dimostra l''assenza di chiamate dinamiche. Le nove scelte e il soft-delete restano disponibili.',
        v_unlisted
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.content_reports cr
    SET city_id = NULL
    WHERE cr.city_id = v_city_id;

    FOR v_fk IN
      SELECT
        namespace_info.nspname AS schema_name,
        source_rel.relname AS table_name,
        source_att.attname AS column_name,
        fk.conname AS constraint_name
      FROM pg_constraint AS fk
      JOIN pg_class AS source_rel ON source_rel.oid = fk.conrelid
      JOIN pg_namespace AS namespace_info ON namespace_info.oid = source_rel.relnamespace
      JOIN pg_attribute AS source_att
        ON source_att.attrelid = fk.conrelid
       AND source_att.attnum = fk.conkey[1]
      WHERE fk.confrelid = 'public.cities'::regclass
        AND fk.contype = 'f'
        AND fk.confdeltype = 'c'
        AND cardinality(fk.conkey) = 1
    LOOP
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I = $1)',
        v_fk.schema_name,
        v_fk.table_name,
        v_fk.column_name
      ) INTO v_cascade_hit USING v_city_id;
      IF v_cascade_hit THEN
        RAISE EXCEPTION
          'Hard-delete interrotto: %.% ha ancora righe e % è ON DELETE CASCADE. Nessuna riga viene cancellata implicitamente.',
          v_fk.schema_name,
          v_fk.table_name,
          v_fk.constraint_name
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    FOR v_fk IN
      SELECT
        namespace_info.nspname AS schema_name,
        source_rel.relname AS table_name,
        source_att.attname AS column_name,
        fk.conname AS constraint_name
      FROM pg_constraint AS fk
      JOIN pg_class AS source_rel ON source_rel.oid = fk.conrelid
      JOIN pg_namespace AS namespace_info ON namespace_info.oid = source_rel.relnamespace
      JOIN pg_attribute AS source_att
        ON source_att.attrelid = fk.conrelid
       AND source_att.attnum = fk.conkey[1]
      WHERE fk.confrelid = 'public.cities'::regclass
        AND fk.contype = 'f'
        AND fk.confdeltype IN ('n', 'd')
        AND cardinality(fk.conkey) = 1
    LOOP
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I = $1)',
        v_fk.schema_name,
        v_fk.table_name,
        v_fk.column_name
      ) INTO v_cascade_hit USING v_city_id;
      IF v_cascade_hit THEN
        RAISE EXCEPTION
          'Hard-delete interrotto: %.% ha ancora righe e % è SET NULL o SET DEFAULT. Nessuna riga viene riscritta implicitamente.',
          v_fk.schema_name,
          v_fk.table_name,
          v_fk.constraint_name
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    DELETE FROM public.cities c WHERE c.id = v_city_id;
  END IF;
END;
$$;

-- delete_city_admin è SECURITY DEFINER e può già esistere con un altro
-- proprietario: CREATE OR REPLACE non lo cambia. Gli helper revocati a
-- PUBLIC non sono eseguibili da quel proprietario se non risultano nel suo ACL.
DO $int09_caller_execute$
DECLARE
  v_owner name;
  v_sig text;
BEGIN
  SELECT owner_role.rolname
  INTO v_owner
  FROM pg_proc AS fn
  JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
  WHERE fn.oid = 'public.delete_city_admin(text,jsonb)'::regprocedure;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'delete_city_admin non ha un proprietario leggibile.'
      USING ERRCODE = 'P0001';
  END IF;
  FOREACH v_sig IN ARRAY ARRAY[
    'public.int09_parse_city_delete_options(jsonb)',
    'public.assert_td_admin_all()',
    'public.int09_revoke_photo_submission_assignments_for_city(text)',
    'public.delete_city_patron_gallery_photo_with_assignment(uuid)',
    'public.revoke_patron_primary_image_assignment(text)',
    'public.append_entity_image_history_trusted(text,uuid,uuid,text,text,text,text,text,public.image_asset_status,public.image_asset_status,uuid,text,text,boolean,jsonb)',
    'public.handle_city_deleted_for_sponsors(text)',
    'public.delete_city_person_with_image_cleanup(uuid)',
    'public.delete_poi_with_image_cleanup(text)'
  ]
  LOOP
    IF to_regprocedure(v_sig) IS NULL THEN
      RAISE EXCEPTION
        'delete_city_admin chiama % e la funzione non è nel catalogo.',
        v_sig
        USING ERRCODE = 'P0001';
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I', v_sig, v_owner);
    IF NOT has_function_privilege(v_owner, to_regprocedure(v_sig), 'EXECUTE') THEN
      RAISE EXCEPTION
        'Il proprietario di delete_city_admin (%) non può eseguire %.',
        v_owner, v_sig
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
  SELECT owner_role.rolname
  INTO v_owner
  FROM pg_proc AS fn
  JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
  WHERE fn.oid = 'public.assert_td_admin_all()'::regprocedure;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'assert_td_admin_all non ha un proprietario leggibile.'
      USING ERRCODE = 'P0001';
  END IF;
  -- Corpo nel repository: is_service_role() e auth.uid(). Non chiama is_td_admin.
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.is_service_role() TO %I', v_owner);
  IF to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION
      'assert_td_admin_all chiama auth.uid() e la funzione non è nel catalogo.'
      USING ERRCODE = 'P0001';
  END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION auth.uid() TO %I', v_owner);
  IF NOT has_function_privilege(v_owner, 'public.is_service_role()', 'EXECUTE')
     OR NOT has_function_privilege(v_owner, 'auth.uid()', 'EXECUTE') THEN
    RAISE EXCEPTION
      'Il proprietario di assert_td_admin_all (%) non può eseguire is_service_role() o auth.uid().',
      v_owner
      USING ERRCODE = 'P0001';
  END IF;
  -- relink è SECURITY DEFINER e chiama solo assert_td_admin_all. Il REVOKE da
  -- PUBLIC non lascia EXECUTE al proprietario: authenticated e service_role non bastano.
  IF to_regprocedure('public.relink_orphaned_city_content(text)') IS NULL THEN
    RAISE EXCEPTION 'relink_orphaned_city_content non è nel catalogo.'
      USING ERRCODE = 'P0001';
  END IF;
  SELECT owner_role.rolname
  INTO v_owner
  FROM pg_proc AS fn
  JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
  WHERE fn.oid = 'public.relink_orphaned_city_content(text)'::regprocedure;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'relink_orphaned_city_content non ha un proprietario leggibile.'
      USING ERRCODE = 'P0001';
  END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.assert_td_admin_all() TO %I', v_owner);
  IF NOT has_function_privilege(v_owner, 'public.assert_td_admin_all()', 'EXECUTE') THEN
    RAISE EXCEPTION
      'Il proprietario di relink_orphaned_city_content (%) non può eseguire assert_td_admin_all().',
      v_owner
      USING ERRCODE = 'P0001';
  END IF;
END;
$int09_caller_execute$;

COMMENT ON FUNCTION public.delete_city_admin(text, jsonb) IS
  'Nove scelte indipendenti. Non cancella user_visited_cities né content_reports. Si ferma prima di ogni modifica se public.cities ha un trigger non interno su UPDATE, DELETE o TRUNCATE, se manca una funzione di pulizia, o se il grafo statico contiene un linguaggio non sql/plpgsql fuori da pg_catalog, EXECUTE, o un effetto non annullato dal rollback. Quel grafo non certifica le chiamate senza dipendenza. L''hard-delete prosegue solo se ogni funzione raggiunta fuori da pg_catalog è fra quelle recensite; altrimenti il prerequisito non è soddisfatto e la città non viene cancellata. Soft-delete se restano righe da conservare. Hard-path azzera content_reports.city_id e si ferma se una foreign key CASCADE, SET NULL o SET DEFAULT verso cities ha ancora righe. NO ACTION e RESTRICT restano al DELETE. I riferimenti sponsor si azzerano solo per le entità non conservate. admin_all.';

COMMIT;
