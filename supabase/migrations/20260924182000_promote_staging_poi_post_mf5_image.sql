-- POST-MF5 - promote_staging_poi_to_live: no image_url write (SoT media_assets + assignments)

CREATE OR REPLACE FUNCTION public.promote_staging_poi_to_live(

  p_staging_id uuid,

  p_poi jsonb

)

RETURNS boolean

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public, pg_temp

AS $$

DECLARE

  v_staging public.pois_staging%ROWTYPE;

  v_uid uuid := auth.uid();

  v_poi_id text;

  v_poi_city_id text;

  v_existing_city_id text;

  v_coords_lat double precision;

  v_coords_lng double precision;

  v_price_level integer;

  v_rating numeric;

  v_votes integer;

  v_status text;

  v_date_added date;

  v_updated_at timestamptz;

  v_last_verified timestamptz;

  v_showcase_expiry timestamptz;

  v_has_price_level boolean := false;

  v_has_rating boolean := false;

  v_has_votes boolean := false;

  v_has_status boolean := false;

  v_has_date_added boolean := false;

  v_created_at timestamptz;

  v_has_created_at boolean := false;

  v_has_updated_at boolean := false;

  v_has_last_verified boolean := false;

  v_row_count integer;

  v_cols text;

  v_vals text;

  v_updates text;

  v_sql text;

BEGIN

  -- Auth: allineato al pattern accept_famous_person_suggestion / moderation RPCs

  IF NOT public.is_service_role() THEN

    IF v_uid IS NULL THEN

      RAISE EXCEPTION 'Autenticazione richiesta.';

    END IF;

    IF NOT public.is_td_admin(v_uid) THEN

      RAISE EXCEPTION 'Permessi admin richiesti.';

    END IF;

  END IF;



  SELECT * INTO v_staging

  FROM public.pois_staging

  WHERE id = p_staging_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Staging item not found: %', p_staging_id;

  END IF;



  IF v_staging.city_id IS NULL THEN

    RAISE EXCEPTION 'Cannot promote orphaned staging item %', p_staging_id;

  END IF;



  -- Idempotente: già importato (seconda chiamata concorrente post-commit)

  IF v_staging.processing_status = 'imported' THEN

    RETURN true;

  END IF;



  v_poi_id := NULLIF(trim(p_poi->>'id'), '');

  IF v_poi_id IS NULL THEN

    RAISE EXCEPTION 'POI id is required for promotion';

  END IF;



  v_poi_city_id := NULLIF(trim(p_poi->>'city_id'), '');

  IF v_poi_city_id IS NULL THEN

    RAISE EXCEPTION 'POI city_id is required for promotion';

  END IF;



  IF v_poi_city_id IS DISTINCT FROM v_staging.city_id THEN

    RAISE EXCEPTION 'POI city_id must match staging item city_id';

  END IF;



  IF p_poi->>'name' IS NULL OR trim(p_poi->>'name') = '' THEN

    RAISE EXCEPTION 'POI name is required for promotion';

  END IF;



  BEGIN

    v_coords_lat := (p_poi->>'coords_lat')::double precision;

    v_coords_lng := (p_poi->>'coords_lng')::double precision;

  EXCEPTION

    WHEN invalid_text_representation THEN

      RAISE EXCEPTION 'Invalid POI coordinates in promotion payload';

  END;



  IF v_coords_lat IS NULL

     OR v_coords_lng IS NULL

     OR v_coords_lat = 'Infinity'::double precision

     OR v_coords_lat = '-Infinity'::double precision

     OR v_coords_lng = 'Infinity'::double precision

     OR v_coords_lng = '-Infinity'::double precision

     OR v_coords_lat::text = 'NaN'

     OR v_coords_lng::text = 'NaN' THEN

    RAISE EXCEPTION 'POI coordinates must be finite for promotion';

  END IF;



  -- Protezione integrità city_id: impedisce spostamento cross-city su POI esistente (caso non concorrente)

  SELECT city_id INTO v_existing_city_id

  FROM public.pois

  WHERE id = v_poi_id

  FOR UPDATE;



  IF FOUND AND v_existing_city_id IS DISTINCT FROM v_staging.city_id THEN

    RAISE EXCEPTION 'Existing POI city_id conflicts with staging item city_id';

  END IF;



  -- Campi opzionali dal payload: parse esplicito, nessun fallback silenzioso

  IF p_poi ? 'price_level' AND NULLIF(trim(p_poi->>'price_level'), '') IS NOT NULL THEN

    BEGIN

      v_price_level := (p_poi->>'price_level')::integer;

      v_has_price_level := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid price_level in promotion payload';

    END;

    IF v_price_level < 1 OR v_price_level > 4 THEN

      RAISE EXCEPTION 'price_level fuori range consentito (1-4): %', v_price_level;

    END IF;

  END IF;



  IF p_poi ? 'rating' AND NULLIF(trim(p_poi->>'rating'), '') IS NOT NULL THEN

    BEGIN

      v_rating := (p_poi->>'rating')::numeric;

      v_has_rating := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid rating in promotion payload';

    END;

    IF v_rating IS NULL
      OR lower(v_rating::text) = 'nan'
      OR v_rating < 0
      OR v_rating > 5 THEN

      RAISE EXCEPTION 'rating non valido (consentiti 0-5, escluso NaN): %', v_rating;

    END IF;

  END IF;



  IF p_poi ? 'votes' AND NULLIF(trim(p_poi->>'votes'), '') IS NOT NULL THEN

    BEGIN

      v_votes := (p_poi->>'votes')::integer;

      v_has_votes := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid votes in promotion payload';

    END;

    IF v_votes < 0 THEN

      RAISE EXCEPTION 'votes must be non-negative: %', v_votes;

    END IF;

  END IF;



  IF p_poi ? 'status' AND NULLIF(trim(p_poi->>'status'), '') IS NOT NULL THEN

    v_status := trim(p_poi->>'status');

    IF v_status NOT IN ('draft', 'published', 'suspended', 'canceled', 'needs_check') THEN

      RAISE EXCEPTION 'Invalid status in promotion payload (pois_status_check): %', v_status;

    END IF;

    v_has_status := true;

  END IF;



  IF p_poi ? 'date_added' AND NULLIF(trim(p_poi->>'date_added'), '') IS NOT NULL THEN

    BEGIN

      v_date_added := (p_poi->>'date_added')::date;

      v_has_date_added := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid date_added in promotion payload';

    END;

  END IF;



  IF p_poi ? 'created_at' AND NULLIF(trim(p_poi->>'created_at'), '') IS NOT NULL THEN

    BEGIN

      v_created_at := (p_poi->>'created_at')::timestamptz;

      v_has_created_at := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid created_at in promotion payload';

    END;

  END IF;



  IF p_poi ? 'updated_at' AND NULLIF(trim(p_poi->>'updated_at'), '') IS NOT NULL THEN

    BEGIN

      v_updated_at := (p_poi->>'updated_at')::timestamptz;

      v_has_updated_at := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid updated_at in promotion payload';

    END;

  END IF;



  IF p_poi ? 'last_verified' AND NULLIF(trim(p_poi->>'last_verified'), '') IS NOT NULL THEN

    BEGIN

      v_last_verified := (p_poi->>'last_verified')::timestamptz;

      v_has_last_verified := true;

    EXCEPTION

      WHEN invalid_text_representation THEN

        RAISE EXCEPTION 'Invalid last_verified in promotion payload';

    END;

  END IF;



  -- Colonne sempre presenti; is_sponsored/tier gestiti dal sistema (non dal payload)

  v_cols := 'id, city_id, name, category, sub_category, description, coords_lat, coords_lng, address, visit_duration, tourism_interest, ai_reliability, is_sponsored, tier';

  v_vals := format(

    '%L, %L, %L, %L, %L, %L, %s, %s, %L, %L, %L, %L, false, NULL',

    v_poi_id,

    v_poi_city_id,

    trim(p_poi->>'name'),

    p_poi->>'category',

    p_poi->>'sub_category',

    p_poi->>'description',

    v_coords_lat,

    v_coords_lng,

    NULLIF(p_poi->>'address', ''),

    p_poi->>'visit_duration',

    p_poi->>'tourism_interest',

    p_poi->>'ai_reliability'

  );

  -- city_id escluso dall'UPDATE: non può essere modificato in caso di conflict

  v_updates := 'name = EXCLUDED.name, category = EXCLUDED.category, sub_category = EXCLUDED.sub_category, description = EXCLUDED.description, coords_lat = EXCLUDED.coords_lat, coords_lng = EXCLUDED.coords_lng, address = EXCLUDED.address, visit_duration = EXCLUDED.visit_duration, tourism_interest = EXCLUDED.tourism_interest, ai_reliability = EXCLUDED.ai_reliability';



  IF v_has_price_level THEN

    v_cols := v_cols || ', price_level';

    v_vals := v_vals || format(', %s', v_price_level);

    v_updates := v_updates || ', price_level = EXCLUDED.price_level';

  END IF;



  IF v_has_rating THEN

    v_cols := v_cols || ', rating';

    v_vals := v_vals || format(', %s', v_rating);

    v_updates := v_updates || ', rating = EXCLUDED.rating';

  END IF;



  IF v_has_votes THEN

    v_cols := v_cols || ', votes';

    v_vals := v_vals || format(', %s', v_votes);

    v_updates := v_updates || ', votes = EXCLUDED.votes';

  END IF;



  IF v_has_status THEN

    v_cols := v_cols || ', status';

    v_vals := v_vals || format(', %L', v_status);

    v_updates := v_updates || ', status = EXCLUDED.status';

  END IF;



  IF v_has_date_added THEN

    v_cols := v_cols || ', date_added';

    v_vals := v_vals || format(', %L::date', v_date_added);

    v_updates := v_updates || ', date_added = EXCLUDED.date_added';

  END IF;



  -- created_at (pois.created_at timestamptz): valorizzato solo in INSERT; v_updates non lo include — immutabile su ON CONFLICT DO UPDATE.
  IF v_has_created_at THEN

    v_cols := v_cols || ', created_at';

    v_vals := v_vals || format(', %L::timestamptz', v_created_at);

  END IF;



  IF v_has_updated_at THEN

    v_cols := v_cols || ', updated_at';

    v_vals := v_vals || format(', %L::timestamptz', v_updated_at);

    v_updates := v_updates || ', updated_at = EXCLUDED.updated_at';

  END IF;



  IF p_poi ? 'opening_hours' THEN

    v_cols := v_cols || ', opening_hours';

    IF p_poi->'opening_hours' IS NULL OR p_poi->'opening_hours' = 'null'::jsonb THEN

      v_vals := v_vals || ', NULL::jsonb';

    ELSE

      v_vals := v_vals || format(', %L::jsonb', p_poi->>'opening_hours');

    END IF;

    v_updates := v_updates || ', opening_hours = EXCLUDED.opening_hours';

  END IF;



  IF p_poi ? 'affiliate' THEN

    v_cols := v_cols || ', affiliate';

    IF p_poi->'affiliate' IS NULL OR p_poi->'affiliate' = 'null'::jsonb THEN

      v_vals := v_vals || ', NULL::jsonb';

    ELSE

      v_vals := v_vals || format(', %L::jsonb', p_poi->>'affiliate');

    END IF;

    v_updates := v_updates || ', affiliate = EXCLUDED.affiliate';

  END IF;



  IF p_poi ? 'link_metadata' THEN

    v_cols := v_cols || ', link_metadata';

    IF p_poi->'link_metadata' IS NULL OR p_poi->'link_metadata' = 'null'::jsonb THEN

      v_vals := v_vals || ', NULL::jsonb';

    ELSE

      v_vals := v_vals || format(', %L::jsonb', p_poi->>'link_metadata');

    END IF;

    v_updates := v_updates || ', link_metadata = EXCLUDED.link_metadata';

  END IF;



  IF p_poi ? 'showcase_expiry' THEN

    v_cols := v_cols || ', showcase_expiry';

    IF NULLIF(trim(p_poi->>'showcase_expiry'), '') IS NULL THEN

      v_vals := v_vals || ', NULL';

    ELSE

      BEGIN

        v_showcase_expiry := (p_poi->>'showcase_expiry')::timestamptz;

      EXCEPTION

        WHEN invalid_text_representation THEN

          RAISE EXCEPTION 'Invalid showcase_expiry in promotion payload';

      END;

      v_vals := v_vals || format(', %L::timestamptz', v_showcase_expiry);

    END IF;

    v_updates := v_updates || ', showcase_expiry = EXCLUDED.showcase_expiry';

  END IF;



  -- Audit: created_by/updated_by da auth.uid(); service_role con uid NULL → colonne NULL (pois.created_by nullable).
  v_cols := v_cols || ', created_by, updated_by';
  v_vals := v_vals || format(', %L, %L', v_uid::text, v_uid::text);
  v_updates := v_updates || format(', updated_by = %L', v_uid::text);



  IF v_has_last_verified THEN

    v_cols := v_cols || ', last_verified';

    v_vals := v_vals || format(', %L::timestamptz', v_last_verified);

    v_updates := v_updates || ', last_verified = EXCLUDED.last_verified';

  END IF;



  -- Upsert POI + mark staging imported (single PostgreSQL transaction)

  v_sql := format(

    'INSERT INTO public.pois (%s) VALUES (%s) ON CONFLICT (id) DO UPDATE SET %s WHERE public.pois.city_id IS NOT DISTINCT FROM %L',

    v_cols,

    v_vals,

    v_updates,

    v_staging.city_id

  );

  EXECUTE v_sql;



  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  IF v_row_count = 0 AND EXISTS (SELECT 1 FROM public.pois WHERE id = v_poi_id) THEN

    RAISE EXCEPTION 'Existing POI city_id conflicts with staging item city_id';

  END IF;



  UPDATE public.pois_staging

  SET

    processing_status = 'imported',

    updated_at = now()

  WHERE id = p_staging_id;



  RETURN true;

END;

$$;



REVOKE ALL ON FUNCTION public.promote_staging_poi_to_live(uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.promote_staging_poi_to_live(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_staging_poi_to_live(uuid, jsonb) TO service_role;



COMMENT ON FUNCTION public.promote_staging_poi_to_live(uuid, jsonb) IS

  'Atomically upserts a POI from staging enrichment payload and marks pois_staging as imported.';
