-- Campi candidatura Sponsor e controllo quote. Non applicata al database remoto.
-- Il piano non arriva dal chiamante: si legge dallo sponsor approved collegato.
-- Le assegnazioni documentate sono city_person, poi, patron, photo_submission e city.
-- L'unica colonna sponsor che corrisponde a un entity_type di assegnazione è poi_id.
-- shop_id, guide_id e operator_id non si usano per un altro tipo: un id uguale in
-- un'altra tabella non è un collegamento.
--
-- I file stanno in supabase/migrations. config.toml abilita [db.migrations]
-- con schema_paths vuoto. Il package è supabase 2.118.0. Il sorgente della
-- funzione che applica un file non è nel repository: dalla 2.115 la pipeline
-- non è un blocco transazionale, una CLI precedente avvolgeva il file.
-- BEGIN e COMMIT restano. Non dimostrano che l'applicazione sia atomica.
-- COMMIT è l'ultima istruzione: se una transazione è già aperta, la chiude.
-- Più sponsor approved sullo stesso POI restano ammessi finché non c'è nessuna
-- assegnazione sponsor corrente. La prima assegnazione corrente richiede un solo approved.
-- Non ci sono CREATE INDEX CONCURRENTLY né ALTER TYPE ... ADD VALUE.

BEGIN;

DO $sponsor_request_columns$
DECLARE
  v_column text;
  v_kind "char";
BEGIN
  SELECT table_info.relkind
  INTO v_kind
  FROM pg_class AS table_info
  JOIN pg_namespace AS namespace_info ON namespace_info.oid = table_info.relnamespace
  WHERE namespace_info.nspname = 'public'
    AND table_info.relname = 'sponsor_requests';
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'public.sponsor_requests non esiste. ADD COLUMN IF NOT EXISTS non crea la relazione.'
      USING ERRCODE = 'P0001';
  END IF;
  IF v_kind NOT IN ('r', 'p') THEN
    RAISE EXCEPTION
      'public.sponsor_requests non è una tabella (relkind %). ADD COLUMN non viene eseguito.',
      v_kind
      USING ERRCODE = 'P0001';
  END IF;
  FOREACH v_column IN ARRAY ARRAY['poi_id', 'public_name', 'website', 'public_phone']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute AS column_info
      JOIN pg_class AS table_info ON table_info.oid = column_info.attrelid
      JOIN pg_namespace AS namespace_info ON namespace_info.oid = table_info.relnamespace
      WHERE namespace_info.nspname = 'public'
        AND table_info.relname = 'sponsor_requests'
        AND column_info.attname = v_column
        AND NOT column_info.attisdropped
        AND (
          column_info.atttypid IS DISTINCT FROM 'text'::regtype
          OR column_info.attnotnull
        )
    ) THEN
      RAISE EXCEPTION
        'sponsor_requests.% esiste già e non è text nullable. ADD COLUMN IF NOT EXISTS non corregge il tipo.',
        v_column
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
END;
$sponsor_request_columns$;

-- Due sponsor approved sullo stesso poi_id restano ambigui anche con lo stesso piano.
-- Se esistono assegnazioni correnti attive, un secondo approved, oppure un cambio
-- di poi_id, status o pricing_version_id, è rifiutato. Lo stesso lock serializza
-- anche il cambio di plans.type e di pricing_versions.plan_id. Senza assegnazioni
-- correnti quei cambi restano possibili: il vincolo scatta al primo inserimento.
-- La scrittura canonica toglie is_current alla riga vecchia e poi fa INSERT.
-- Il BEFORE UPDATE copre un aggiornamento che rende conteggiata una riga esistente
-- o le cambia asset, tipo o entità. Un UPDATE di media_assets.origin_type verso
-- sponsor è coperto dal trigger sull'asset. Non esiste un secondo inserimento.

ALTER TABLE public.sponsor_requests
  ADD COLUMN IF NOT EXISTS poi_id text,
  ADD COLUMN IF NOT EXISTS public_name text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS public_phone text;

CREATE OR REPLACE FUNCTION public.assert_sponsor_media_quota(
  p_entity_type text,
  p_entity_id text,
  p_additional integer,
  p_exclude_assignment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sponsor_count integer;
  v_plan text;
  v_max integer;
  v_existing integer;
  v_plan_ids uuid[];
  v_plan_ids_now uuid[];
BEGIN
  IF p_additional IS NULL OR p_additional < 1 THEN
    RETURN;
  END IF;

  IF p_entity_type IS DISTINCT FROM 'poi' THEN
    RAISE EXCEPTION
      'Quota sponsor: nessuna colonna documentata per entity_type %. Collegamento non assegnato.',
      p_entity_type
      USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = p_entity_id
      AND pv.plan_id IS NOT NULL
  ) s;

  PERFORM public.sponsor_quota_lock_plans(v_plan_ids);
  PERFORM pg_advisory_xact_lock(
    hashtext('sponsor_media_quota:' || p_entity_type || ':' || p_entity_id)
  );

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids_now
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = p_entity_id
      AND pv.plan_id IS NOT NULL
  ) s;

  IF v_plan_ids_now IS DISTINCT FROM v_plan_ids THEN
    RAISE EXCEPTION
      'Quota sponsor: il piano è cambiato durante il controllo. Ripetere.'
      USING ERRCODE = '40001';
  END IF;

  SELECT count(*)::integer
  INTO v_sponsor_count
  FROM public.sponsors sp
  WHERE sp.status = 'approved'
    AND sp.poi_id = p_entity_id;

  IF v_sponsor_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION
      'Quota sponsor: collegamento sponsor approved non univoco per % % (trovati %).',
      p_entity_type, p_entity_id, COALESCE(v_sponsor_count, 0)
      USING ERRCODE = 'P0001';
  END IF;

  SELECT pl.type::text
  INTO v_plan
  FROM public.sponsors sp
  JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
  JOIN public.plans pl ON pl.id = pv.plan_id
  WHERE sp.status = 'approved'
    AND sp.poi_id = p_entity_id;

  v_max := public.sponsor_plan_media_max(v_plan);

  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Quota sponsor: piano non riconosciuto (%).', v_plan
      USING ERRCODE = 'P0001';
  END IF;

  IF p_entity_type = 'poi' THEN
    v_max := LEAST(v_max, 10);
  END IF;

  SELECT count(*)::integer
  INTO v_existing
  FROM public.entity_image_assignments eia
  JOIN public.media_assets ma ON ma.id = eia.media_asset_id
  WHERE eia.entity_type = p_entity_type
    AND eia.entity_id = p_entity_id
    AND eia.is_current = true
    AND eia.assignment_status = 'active'
    AND ma.origin_type = 'sponsor'
    AND (p_exclude_assignment_id IS NULL OR eia.id IS DISTINCT FROM p_exclude_assignment_id);

  IF v_existing + p_additional > v_max THEN
    RAISE EXCEPTION 'Quota sponsor superata per % % (massimo %).',
      p_entity_type, p_entity_id, v_max
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_sponsor_media_quota(text, text, integer, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_sponsor_media_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_origin text;
  v_lock uuid;
  v_assets uuid[];
BEGIN
  IF NEW.is_current IS DISTINCT FROM true OR NEW.assignment_status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  v_assets := ARRAY[NEW.media_asset_id];
  IF TG_OP = 'UPDATE'
     AND OLD.media_asset_id IS NOT NULL
     AND OLD.media_asset_id IS DISTINCT FROM NEW.media_asset_id THEN
    v_assets := v_assets || OLD.media_asset_id;
  END IF;

  FOR v_lock IN
    SELECT asset_id
    FROM unnest(v_assets) AS asset_id
    WHERE asset_id IS NOT NULL
    ORDER BY asset_id
  LOOP
    PERFORM 1
    FROM public.media_assets
    WHERE id = v_lock
    FOR UPDATE;
  END LOOP;

  SELECT ma.origin_type
  INTO v_origin
  FROM public.media_assets ma
  WHERE ma.id = NEW.media_asset_id;

  IF v_origin IS DISTINCT FROM 'sponsor' THEN
    RETURN NEW;
  END IF;

  PERFORM public.assert_sponsor_media_quota(
    NEW.entity_type,
    NEW.entity_id,
    1,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_sponsor_origin_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entity record;
  v_poi text;
  v_plan_ids uuid[];
  v_plan_ids_now uuid[];
BEGIN
  IF NEW.origin_type IS NOT DISTINCT FROM OLD.origin_type
     OR NEW.origin_type IS DISTINCT FROM 'sponsor' THEN
    RETURN NEW;
  END IF;

  PERFORM 1
  FROM public.media_assets
  WHERE id = NEW.id
  FOR UPDATE;

  -- Qualsiasi assegnazione corrente non-poi rifiuta la conversione.
  -- Non si sceglie una riga con LIMIT: o non ce n'è nessuna, o l'asset
  -- non diventa sponsor. shop_id, guide_id e operator_id non sono un tipo.
  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = NEW.id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.entity_type IS DISTINCT FROM 'poi'
  ) THEN
    RAISE EXCEPTION
      'Quota sponsor: l''asset ha un''assegnazione corrente attiva con entity_type diverso da poi. origin_type non diventa sponsor.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.entity_image_assignments eia
    JOIN public.sponsors sp
      ON sp.status = 'approved'
     AND sp.poi_id = eia.entity_id
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE eia.media_asset_id = NEW.id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.entity_type = 'poi'
      AND pv.plan_id IS NOT NULL
  ) s;

  PERFORM public.sponsor_quota_lock_plans(v_plan_ids);

  FOR v_poi IN
    SELECT DISTINCT eia.entity_id
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = NEW.id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.entity_type = 'poi'
    ORDER BY eia.entity_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:poi:' || v_poi));
  END LOOP;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids_now
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.entity_image_assignments eia
    JOIN public.sponsors sp
      ON sp.status = 'approved'
     AND sp.poi_id = eia.entity_id
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE eia.media_asset_id = NEW.id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.entity_type = 'poi'
      AND pv.plan_id IS NOT NULL
  ) s;

  IF v_plan_ids_now IS DISTINCT FROM v_plan_ids THEN
    RAISE EXCEPTION
      'Quota sponsor: il piano è cambiato durante il controllo. Ripetere.'
      USING ERRCODE = '40001';
  END IF;

  FOR v_entity IN
    SELECT eia.entity_type, eia.entity_id, count(*)::integer AS incoming
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = NEW.id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.entity_type = 'poi'
    GROUP BY eia.entity_type, eia.entity_id
    ORDER BY eia.entity_type, eia.entity_id
  LOOP
    PERFORM public.assert_sponsor_media_quota(
      v_entity.entity_type,
      v_entity.entity_id,
      v_entity.incoming,
      NULL
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Stesso criterio dei profili: il trigger di quota si chiama zzz_ così i
-- BEFORE già presenti gli passano NEW. Non annulla le loro scritture.
-- Un BEFORE di riga ancora successivo si rifiuta, senza leggerne il corpo.
CREATE OR REPLACE FUNCTION pg_temp.assert_named_trigger(
  p_table regclass,
  p_name text,
  p_function regprocedure,
  p_tgtype smallint,
  p_columns text[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      '% su % è un trigger interno. Non viene sostituito.',
      p_name, p_table
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  IF coalesce(cardinality(p_columns), 0) = 0 THEN
    v_expected := ARRAY[]::smallint[];
  ELSE
    SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
    INTO v_expected
    FROM pg_attribute AS column_info
    WHERE column_info.attrelid = p_table
      AND column_info.attname = ANY (p_columns)
      AND NOT column_info.attisdropped;
    IF cardinality(v_expected) IS DISTINCT FROM cardinality(p_columns) THEN
      RAISE EXCEPTION
        '% su % non ha tutte le colonne del contratto. Non viene sostituito.',
        p_name, p_table
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  v_actual := ARRAY[]::smallint[];
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = p_table
    AND trigger_info.tgname = p_name
    AND NOT trigger_info.tgisinternal;
  IF v_actual IS NULL THEN
    v_actual := ARRAY[]::smallint[];
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND NOT trigger_info.tgisinternal
      AND (
        trigger_info.tgfoid IS DISTINCT FROM p_function
        OR trigger_info.tgtype IS DISTINCT FROM p_tgtype
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      '% su % non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.',
      p_name, p_table
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

DO $sponsor_trigger_assignment$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
  v_fn oid := 'public.enforce_sponsor_media_quota()'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.entity_image_assignments'::regclass
      AND trigger_info.tgname = 'entity_image_assignments_sponsor_quota'
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'entity_image_assignments_sponsor_quota è interno e non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.entity_image_assignments'::regclass
      AND trigger_info.tgname = 'entity_image_assignments_sponsor_quota'
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
  INTO v_expected
  FROM pg_attribute AS column_info
  WHERE column_info.attrelid = 'public.entity_image_assignments'::regclass
    AND column_info.attname IN (
      'is_current', 'assignment_status', 'media_asset_id', 'entity_type', 'entity_id'
    );
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = 'public.entity_image_assignments'::regclass
    AND trigger_info.tgname = 'entity_image_assignments_sponsor_quota';
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.entity_image_assignments'::regclass
      AND trigger_info.tgname = 'entity_image_assignments_sponsor_quota'
      AND (
        trigger_info.tgfoid IS DISTINCT FROM v_fn
        OR trigger_info.tgtype IS DISTINCT FROM 23::smallint
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      'entity_image_assignments_sponsor_quota non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_trigger_assignment$;

DROP TRIGGER IF EXISTS entity_image_assignments_sponsor_quota ON public.entity_image_assignments;
SELECT pg_temp.assert_named_trigger(
  'public.entity_image_assignments'::regclass,
  'zzz_entity_image_assignments_sponsor_quota',
  'public.enforce_sponsor_media_quota()'::regprocedure,
  23::smallint,
  ARRAY['is_current', 'assignment_status', 'media_asset_id', 'entity_type', 'entity_id']
);
DROP TRIGGER IF EXISTS zzz_entity_image_assignments_sponsor_quota ON public.entity_image_assignments;
CREATE TRIGGER zzz_entity_image_assignments_sponsor_quota
  BEFORE INSERT OR UPDATE OF is_current, assignment_status, media_asset_id, entity_type, entity_id
  ON public.entity_image_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sponsor_media_quota();

DO $sponsor_trigger_origin$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
  v_fn oid := 'public.enforce_sponsor_origin_quota()'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.media_assets'::regclass
      AND trigger_info.tgname = 'media_assets_sponsor_origin_quota'
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'media_assets_sponsor_origin_quota è interno e non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.media_assets'::regclass
      AND trigger_info.tgname = 'media_assets_sponsor_origin_quota'
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
  INTO v_expected
  FROM pg_attribute AS column_info
  WHERE column_info.attrelid = 'public.media_assets'::regclass
    AND column_info.attname = 'origin_type';
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = 'public.media_assets'::regclass
    AND trigger_info.tgname = 'media_assets_sponsor_origin_quota';
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.media_assets'::regclass
      AND trigger_info.tgname = 'media_assets_sponsor_origin_quota'
      AND (
        trigger_info.tgfoid IS DISTINCT FROM v_fn
        OR trigger_info.tgtype IS DISTINCT FROM 19::smallint
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      'media_assets_sponsor_origin_quota non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_trigger_origin$;

DROP TRIGGER IF EXISTS media_assets_sponsor_origin_quota ON public.media_assets;
SELECT pg_temp.assert_named_trigger(
  'public.media_assets'::regclass,
  'zzz_media_assets_sponsor_origin_quota',
  'public.enforce_sponsor_origin_quota()'::regprocedure,
  19::smallint,
  ARRAY['origin_type']
);
DROP TRIGGER IF EXISTS zzz_media_assets_sponsor_origin_quota ON public.media_assets;
CREATE TRIGGER zzz_media_assets_sponsor_origin_quota
  BEFORE UPDATE OF origin_type ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sponsor_origin_quota();

REVOKE ALL ON FUNCTION public.enforce_sponsor_media_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_sponsor_media_quota() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_sponsor_origin_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_sponsor_origin_quota() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sponsor_plan_media_max(p_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_plan
    WHEN 'REGIONAL_ACTIVITY' THEN 10
    WHEN 'LOCAL_ACTIVITY' THEN 5
    WHEN 'TOUR_GUIDE' THEN 3
    WHEN 'TOUR_OPERATOR' THEN 3
    WHEN 'DIGITAL_SHOWCASE' THEN 15
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.sponsor_quota_lock_plans(p_plan_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan uuid;
BEGIN
  FOR v_plan IN
    SELECT DISTINCT plan_id
    FROM unnest(COALESCE(p_plan_ids, ARRAY[]::uuid[])) AS plan_id
    WHERE plan_id IS NOT NULL
    ORDER BY plan_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:plan:' || v_plan::text));
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_poi_sponsor_assignments_fit(
  p_poi_id text,
  p_excluded_sponsor_id uuid,
  p_included_pricing_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing integer;
  v_count integer;
  v_version uuid;
  v_plan text;
  v_max integer;
  v_plan_ids uuid[];
  v_plan_ids_now uuid[];
BEGIN
  IF p_poi_id IS NULL THEN
    RETURN;
  END IF;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = p_poi_id
      AND (p_excluded_sponsor_id IS NULL OR sp.id IS DISTINCT FROM p_excluded_sponsor_id)
      AND pv.plan_id IS NOT NULL
    UNION
    SELECT pv.plan_id
    FROM public.pricing_versions pv
    WHERE p_included_pricing_version_id IS NOT NULL
      AND pv.id = p_included_pricing_version_id
      AND pv.plan_id IS NOT NULL
  ) s;

  PERFORM public.sponsor_quota_lock_plans(v_plan_ids);
  PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:poi:' || p_poi_id));

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids_now
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = p_poi_id
      AND (p_excluded_sponsor_id IS NULL OR sp.id IS DISTINCT FROM p_excluded_sponsor_id)
      AND pv.plan_id IS NOT NULL
    UNION
    SELECT pv.plan_id
    FROM public.pricing_versions pv
    WHERE p_included_pricing_version_id IS NOT NULL
      AND pv.id = p_included_pricing_version_id
      AND pv.plan_id IS NOT NULL
  ) s;

  IF v_plan_ids_now IS DISTINCT FROM v_plan_ids THEN
    RAISE EXCEPTION
      'Quota sponsor: il piano è cambiato durante il controllo. Ripetere.'
      USING ERRCODE = '40001';
  END IF;

  SELECT count(*)::integer
  INTO v_existing
  FROM public.entity_image_assignments eia
  JOIN public.media_assets ma ON ma.id = eia.media_asset_id
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_poi_id
    AND eia.is_current = true
    AND eia.assignment_status = 'active'
    AND ma.origin_type = 'sponsor';

  -- Nessuna assegnazione corrente: la quota non ha righe. Più approved restano ammessi.
  IF COALESCE(v_existing, 0) = 0 THEN
    RETURN;
  END IF;

  SELECT count(*)::integer
  INTO v_count
  FROM public.sponsors sp
  WHERE sp.status = 'approved'
    AND sp.poi_id = p_poi_id
    AND (p_excluded_sponsor_id IS NULL OR sp.id IS DISTINCT FROM p_excluded_sponsor_id);

  IF p_included_pricing_version_id IS NOT NULL THEN
    v_count := COALESCE(v_count, 0) + 1;
    v_version := p_included_pricing_version_id;
  END IF;

  IF v_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION
      'Quota sponsor: collegamento sponsor approved non univoco per poi % (trovati %).',
      p_poi_id, COALESCE(v_count, 0)
      USING ERRCODE = 'P0001';
  END IF;

  IF v_version IS NULL THEN
    SELECT sp.pricing_version_id
    INTO v_version
    FROM public.sponsors sp
    WHERE sp.status = 'approved'
      AND sp.poi_id = p_poi_id
      AND (p_excluded_sponsor_id IS NULL OR sp.id IS DISTINCT FROM p_excluded_sponsor_id);
  END IF;

  SELECT pl.type::text
  INTO v_plan
  FROM public.pricing_versions pv
  JOIN public.plans pl ON pl.id = pv.plan_id
  WHERE pv.id = v_version;

  v_max := public.sponsor_plan_media_max(v_plan);
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Quota sponsor: piano non riconosciuto (%).', v_plan
      USING ERRCODE = 'P0001';
  END IF;
  v_max := LEAST(v_max, 10);

  IF v_existing > v_max THEN
    RAISE EXCEPTION 'Quota sponsor superata per poi % (massimo %).', p_poi_id, v_max
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_sponsor_row_assignment_fit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poi text;
  v_pois text[] := ARRAY[]::text[];
  v_excluded uuid;
  v_plan_ids uuid[];
  v_plan_ids_now uuid[];
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.poi_id IS NOT DISTINCT FROM OLD.poi_id
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.pricing_version_id IS NOT DISTINCT FROM OLD.pricing_version_id THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_excluded := OLD.id;
    IF OLD.poi_id IS NOT NULL THEN
      v_pois := array_append(v_pois, OLD.poi_id);
    END IF;
  END IF;
  IF NEW.poi_id IS NOT NULL AND NOT (NEW.poi_id = ANY (v_pois)) THEN
    v_pois := array_append(v_pois, NEW.poi_id);
  END IF;

  IF cardinality(v_pois) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = ANY (v_pois)
      AND (v_excluded IS NULL OR sp.id IS DISTINCT FROM v_excluded)
      AND pv.plan_id IS NOT NULL
    UNION
    SELECT pv.plan_id
    FROM public.pricing_versions pv
    WHERE NEW.status = 'approved'
      AND NEW.pricing_version_id IS NOT NULL
      AND NEW.poi_id = ANY (v_pois)
      AND pv.id = NEW.pricing_version_id
      AND pv.plan_id IS NOT NULL
  ) s;

  PERFORM public.sponsor_quota_lock_plans(v_plan_ids);

  FOR v_poi IN
    SELECT poi_id
    FROM unnest(v_pois) AS poi_id
    ORDER BY poi_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:poi:' || v_poi));
  END LOOP;

  SELECT coalesce(array_agg(s.plan_id ORDER BY s.plan_id), '{}'::uuid[])
  INTO v_plan_ids_now
  FROM (
    SELECT DISTINCT pv.plan_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE sp.status = 'approved'
      AND sp.poi_id = ANY (v_pois)
      AND (v_excluded IS NULL OR sp.id IS DISTINCT FROM v_excluded)
      AND pv.plan_id IS NOT NULL
    UNION
    SELECT pv.plan_id
    FROM public.pricing_versions pv
    WHERE NEW.status = 'approved'
      AND NEW.pricing_version_id IS NOT NULL
      AND NEW.poi_id = ANY (v_pois)
      AND pv.id = NEW.pricing_version_id
      AND pv.plan_id IS NOT NULL
  ) s;

  IF v_plan_ids_now IS DISTINCT FROM v_plan_ids THEN
    RAISE EXCEPTION
      'Quota sponsor: il piano è cambiato durante il controllo. Ripetere.'
      USING ERRCODE = '40001';
  END IF;

  FOR v_poi IN
    SELECT poi_id
    FROM unnest(v_pois) AS poi_id
    ORDER BY poi_id
  LOOP
    PERFORM public.assert_poi_sponsor_assignments_fit(
      v_poi,
      v_excluded,
      CASE
        WHEN NEW.status = 'approved' AND NEW.poi_id IS NOT DISTINCT FROM v_poi
          THEN NEW.pricing_version_id
        ELSE NULL
      END
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_pricing_version_plan_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poi text;
  v_plan text;
  v_max integer;
  v_existing integer;
  v_count integer;
BEGIN
  IF NEW.plan_id IS NOT DISTINCT FROM OLD.plan_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.sponsor_quota_lock_plans(ARRAY[OLD.plan_id, NEW.plan_id]);

  SELECT pl.type::text INTO v_plan
  FROM public.plans pl
  WHERE pl.id = NEW.plan_id;
  v_max := public.sponsor_plan_media_max(v_plan);
  IF v_max IS NOT NULL THEN
    v_max := LEAST(v_max, 10);
  END IF;

  FOR v_poi IN
    SELECT DISTINCT sp.poi_id
    FROM public.sponsors sp
    WHERE sp.pricing_version_id = NEW.id
      AND sp.status = 'approved'
      AND sp.poi_id IS NOT NULL
    ORDER BY sp.poi_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:poi:' || v_poi));
    SELECT count(*)::integer
    INTO v_existing
    FROM public.entity_image_assignments eia
    JOIN public.media_assets ma ON ma.id = eia.media_asset_id
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND ma.origin_type = 'sponsor';
    IF COALESCE(v_existing, 0) = 0 THEN
      CONTINUE;
    END IF;
    IF v_max IS NULL THEN
      RAISE EXCEPTION 'Quota sponsor: piano non riconosciuto (%).', v_plan
        USING ERRCODE = 'P0001';
    END IF;
    SELECT count(*)::integer
    INTO v_count
    FROM public.sponsors sp
    WHERE sp.status = 'approved'
      AND sp.poi_id = v_poi;
    IF v_count IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION
        'Quota sponsor: collegamento sponsor approved non univoco per poi % (trovati %).',
        v_poi, COALESCE(v_count, 0)
        USING ERRCODE = 'P0001';
    END IF;
    IF v_existing > v_max THEN
      RAISE EXCEPTION 'Quota sponsor superata per poi % (massimo %).', v_poi, v_max
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_plan_type_sponsor_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poi text;
  v_max integer;
  v_existing integer;
  v_count integer;
BEGIN
  IF NEW.type IS NOT DISTINCT FROM OLD.type THEN
    RETURN NEW;
  END IF;

  PERFORM public.sponsor_quota_lock_plans(ARRAY[NEW.id]);

  v_max := public.sponsor_plan_media_max(NEW.type::text);
  IF v_max IS NOT NULL THEN
    v_max := LEAST(v_max, 10);
  END IF;

  FOR v_poi IN
    SELECT DISTINCT sp.poi_id
    FROM public.sponsors sp
    JOIN public.pricing_versions pv ON pv.id = sp.pricing_version_id
    WHERE pv.plan_id = NEW.id
      AND sp.status = 'approved'
      AND sp.poi_id IS NOT NULL
    ORDER BY sp.poi_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext('sponsor_media_quota:poi:' || v_poi));
    SELECT count(*)::integer
    INTO v_existing
    FROM public.entity_image_assignments eia
    JOIN public.media_assets ma ON ma.id = eia.media_asset_id
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND ma.origin_type = 'sponsor';
    IF COALESCE(v_existing, 0) = 0 THEN
      CONTINUE;
    END IF;
    IF v_max IS NULL THEN
      RAISE EXCEPTION 'Quota sponsor: piano non riconosciuto (%).', NEW.type
        USING ERRCODE = 'P0001';
    END IF;
    SELECT count(*)::integer
    INTO v_count
    FROM public.sponsors sp
    WHERE sp.status = 'approved'
      AND sp.poi_id = v_poi;
    IF v_count IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION
        'Quota sponsor: collegamento sponsor approved non univoco per poi % (trovati %).',
        v_poi, COALESCE(v_count, 0)
        USING ERRCODE = 'P0001';
    END IF;
    IF v_existing > v_max THEN
      RAISE EXCEPTION 'Quota sponsor superata per poi % (massimo %).', v_poi, v_max
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DO $sponsor_trigger_row$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
  v_fn oid := 'public.enforce_sponsor_row_assignment_fit()'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.sponsors'::regclass
      AND trigger_info.tgname = 'sponsors_assignment_fit'
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'sponsors_assignment_fit è interno e non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.sponsors'::regclass
      AND trigger_info.tgname = 'sponsors_assignment_fit'
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
  INTO v_expected
  FROM pg_attribute AS column_info
  WHERE column_info.attrelid = 'public.sponsors'::regclass
    AND column_info.attname IN ('poi_id', 'status', 'pricing_version_id');
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = 'public.sponsors'::regclass
    AND trigger_info.tgname = 'sponsors_assignment_fit';
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.sponsors'::regclass
      AND trigger_info.tgname = 'sponsors_assignment_fit'
      AND (
        trigger_info.tgfoid IS DISTINCT FROM v_fn
        OR trigger_info.tgtype IS DISTINCT FROM 23::smallint
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      'sponsors_assignment_fit non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_trigger_row$;

DROP TRIGGER IF EXISTS sponsors_assignment_fit ON public.sponsors;
SELECT pg_temp.assert_named_trigger(
  'public.sponsors'::regclass,
  'zzz_sponsors_assignment_fit',
  'public.enforce_sponsor_row_assignment_fit()'::regprocedure,
  23::smallint,
  ARRAY['poi_id', 'status', 'pricing_version_id']
);
DROP TRIGGER IF EXISTS zzz_sponsors_assignment_fit ON public.sponsors;
CREATE TRIGGER zzz_sponsors_assignment_fit
  BEFORE INSERT OR UPDATE OF poi_id, status, pricing_version_id
  ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sponsor_row_assignment_fit();

DO $sponsor_trigger_price$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
  v_fn oid := 'public.enforce_pricing_version_plan_quota()'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.pricing_versions'::regclass
      AND trigger_info.tgname = 'pricing_versions_sponsor_plan_quota'
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'pricing_versions_sponsor_plan_quota è interno e non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.pricing_versions'::regclass
      AND trigger_info.tgname = 'pricing_versions_sponsor_plan_quota'
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
  INTO v_expected
  FROM pg_attribute AS column_info
  WHERE column_info.attrelid = 'public.pricing_versions'::regclass
    AND column_info.attname = 'plan_id';
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = 'public.pricing_versions'::regclass
    AND trigger_info.tgname = 'pricing_versions_sponsor_plan_quota';
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.pricing_versions'::regclass
      AND trigger_info.tgname = 'pricing_versions_sponsor_plan_quota'
      AND (
        trigger_info.tgfoid IS DISTINCT FROM v_fn
        OR trigger_info.tgtype IS DISTINCT FROM 19::smallint
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      'pricing_versions_sponsor_plan_quota non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_trigger_price$;

DROP TRIGGER IF EXISTS pricing_versions_sponsor_plan_quota ON public.pricing_versions;
SELECT pg_temp.assert_named_trigger(
  'public.pricing_versions'::regclass,
  'zzz_pricing_versions_sponsor_plan_quota',
  'public.enforce_pricing_version_plan_quota()'::regprocedure,
  19::smallint,
  ARRAY['plan_id']
);
DROP TRIGGER IF EXISTS zzz_pricing_versions_sponsor_plan_quota ON public.pricing_versions;
CREATE TRIGGER zzz_pricing_versions_sponsor_plan_quota
  BEFORE UPDATE OF plan_id ON public.pricing_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pricing_version_plan_quota();

DO $sponsor_trigger_plan$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
  v_fn oid := 'public.enforce_plan_type_sponsor_quota()'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.plans'::regclass
      AND trigger_info.tgname = 'plans_sponsor_type_quota'
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'plans_sponsor_type_quota è interno e non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.plans'::regclass
      AND trigger_info.tgname = 'plans_sponsor_type_quota'
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;
  SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
  INTO v_expected
  FROM pg_attribute AS column_info
  WHERE column_info.attrelid = 'public.plans'::regclass
    AND column_info.attname = 'type';
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = 'public.plans'::regclass
    AND trigger_info.tgname = 'plans_sponsor_type_quota';
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = 'public.plans'::regclass
      AND trigger_info.tgname = 'plans_sponsor_type_quota'
      AND (
        trigger_info.tgfoid IS DISTINCT FROM v_fn
        OR trigger_info.tgtype IS DISTINCT FROM 19::smallint
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      'plans_sponsor_type_quota non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_trigger_plan$;

DROP TRIGGER IF EXISTS plans_sponsor_type_quota ON public.plans;
SELECT pg_temp.assert_named_trigger(
  'public.plans'::regclass,
  'zzz_plans_sponsor_type_quota',
  'public.enforce_plan_type_sponsor_quota()'::regprocedure,
  19::smallint,
  ARRAY['type']
);
DROP TRIGGER IF EXISTS zzz_plans_sponsor_type_quota ON public.plans;
CREATE TRIGGER zzz_plans_sponsor_type_quota
  BEFORE UPDATE OF type ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_plan_type_sponsor_quota();

DROP FUNCTION pg_temp.assert_named_trigger(regclass, text, regprocedure, smallint, text[]);

DO $sponsor_later_triggers$
DECLARE
  v_names text;
BEGIN
  IF current_setting('server_encoding') IS DISTINCT FROM 'UTF8' THEN
    RAISE EXCEPTION
      'Prerequisito non soddisfatto: i trigger BEFORE sono ordinati con strcmp e questo controllo confronta i byte UTF-8. server_encoding è %.',
      current_setting('server_encoding')
      USING ERRCODE = 'P0001';
  END IF;
  SELECT string_agg(
    namespace_info.nspname || '.' || table_info.relname || '.' || trigger_info.tgname,
    ', ' ORDER BY namespace_info.nspname, table_info.relname, trigger_info.tgname
  )
  INTO v_names
  FROM (
    VALUES
      ('public.entity_image_assignments'::regclass, 'zzz_entity_image_assignments_sponsor_quota'),
      ('public.media_assets'::regclass, 'zzz_media_assets_sponsor_origin_quota'),
      ('public.sponsors'::regclass, 'zzz_sponsors_assignment_fit'),
      ('public.pricing_versions'::regclass, 'zzz_pricing_versions_sponsor_plan_quota'),
      ('public.plans'::regclass, 'zzz_plans_sponsor_type_quota')
  ) AS quota(table_id, trigger_name)
  JOIN pg_trigger AS trigger_info
    ON trigger_info.tgrelid = quota.table_id
  JOIN pg_class AS table_info ON table_info.oid = trigger_info.tgrelid
  JOIN pg_namespace AS namespace_info ON namespace_info.oid = table_info.relnamespace
  WHERE NOT trigger_info.tgisinternal
    AND convert_to(trigger_info.tgname, 'UTF8')
        > convert_to(quota.trigger_name, 'UTF8')
    AND (trigger_info.tgtype & 1) = 1
    AND (trigger_info.tgtype & 2) = 2
    AND ((trigger_info.tgtype & 4) = 4 OR (trigger_info.tgtype & 16) = 16);
  IF v_names IS NOT NULL THEN
    RAISE EXCEPTION
      'Un trigger BEFORE di riga è successivo al controllo quota e può assegnare NEW dopo il conteggio. Il controllo non annulla effetti già prodotti. Corpo non letto: %.',
      v_names
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_later_triggers$;

-- Helper interni: niente EXECUTE per anon e authenticated. service_role non
-- è revocato: i grant già presenti non sono inventariati e non si tolgono
-- alla cieca. Il proprietario è il ruolo della migration se la funzione è
-- nuova; CREATE OR REPLACE non lo sostituisce e questo file non lo legge.
-- Le funzioni dei trigger restano eseguibili da authenticated e service_role
-- perché l'utente che scrive la tabella deve avere EXECUTE sulla funzione.
REVOKE ALL ON FUNCTION public.sponsor_quota_lock_plans(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sponsor_plan_media_max(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_poi_sponsor_assignments_fit(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_sponsor_row_assignment_fit() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_pricing_version_plan_quota() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_plan_type_sponsor_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_sponsor_row_assignment_fit() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_pricing_version_plan_quota() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_plan_type_sponsor_quota() TO authenticated, service_role;

-- Il trigger è SECURITY DEFINER: EXECUTE sull'helper si giudica sul
-- proprietario della funzione trigger, non su authenticated.
DO $sponsor_caller_execute$
DECLARE
  v_owner name;
  v_edge record;
BEGIN
  FOR v_edge IN
    SELECT caller, callee
    FROM (VALUES
      ('public.enforce_sponsor_media_quota()', 'public.assert_sponsor_media_quota(text,text,integer,uuid)'),
      ('public.enforce_sponsor_origin_quota()', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.enforce_sponsor_origin_quota()', 'public.assert_sponsor_media_quota(text,text,integer,uuid)'),
      ('public.assert_sponsor_media_quota(text,text,integer,uuid)', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.assert_sponsor_media_quota(text,text,integer,uuid)', 'public.sponsor_plan_media_max(text)'),
      ('public.assert_poi_sponsor_assignments_fit(text,uuid,uuid)', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.assert_poi_sponsor_assignments_fit(text,uuid,uuid)', 'public.sponsor_plan_media_max(text)'),
      ('public.enforce_sponsor_row_assignment_fit()', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.enforce_sponsor_row_assignment_fit()', 'public.assert_poi_sponsor_assignments_fit(text,uuid,uuid)'),
      ('public.enforce_pricing_version_plan_quota()', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.enforce_pricing_version_plan_quota()', 'public.sponsor_plan_media_max(text)'),
      ('public.enforce_plan_type_sponsor_quota()', 'public.sponsor_quota_lock_plans(uuid[])'),
      ('public.enforce_plan_type_sponsor_quota()', 'public.sponsor_plan_media_max(text)')
    ) AS edge(caller, callee)
  LOOP
    SELECT owner_role.rolname
    INTO v_owner
    FROM pg_proc AS fn
    JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
    WHERE fn.oid = to_regprocedure(v_edge.caller);
    IF v_owner IS NULL OR to_regprocedure(v_edge.callee) IS NULL THEN
      RAISE EXCEPTION
        'Chiamata quota senza funzione: % -> %.',
        v_edge.caller, v_edge.callee
        USING ERRCODE = 'P0001';
    END IF;
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO %I',
      v_edge.callee,
      v_owner
    );
    IF NOT has_function_privilege(v_owner, to_regprocedure(v_edge.callee), 'EXECUTE') THEN
      RAISE EXCEPTION
        'Il proprietario di % (%) non può eseguire %. Il GRANT al ruolo che scrive la tabella non autorizza il SECURITY DEFINER.',
        v_edge.caller, v_owner, v_edge.callee
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
END;
$sponsor_caller_execute$;

-- pg_depend e il testo di pg_proc non dimostrano l'assenza di una chiamata
-- dinamica. La funzione, se c'è, non viene eliminata e la migration si ferma.
DO $sponsor_quota_drop_guard$
BEGIN
  IF to_regprocedure('public.check_sponsor_media_quota(text,text,text,integer)') IS NOT NULL THEN
    RAISE EXCEPTION
      'check_sponsor_media_quota è presente e non viene eliminata. Una dipendenza costruita a runtime non è visibile nel catalogo.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$sponsor_quota_drop_guard$;

COMMENT ON FUNCTION public.assert_sponsor_media_quota(text, text, integer, uuid) IS
  'Quote dello sponsor approved univoco su sponsors.poi_id. Gold 10, Silver 5, guida 3, operatore 3, vetrina 15. I POI non superano 10. Conta solo assegnazioni correnti attive con origin_type sponsor. Non distingue foto grandi e piccole: lo schema non ha quel campo.';

COMMIT;
