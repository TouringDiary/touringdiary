-- D90 — distingue aggiornamento editoriale POI da revoca/assegnazione primary (MF4 SoT).

DROP FUNCTION IF EXISTS public.save_poi_with_image_assignment(jsonb, text, text, text, text);
DROP FUNCTION IF EXISTS public.save_poi_with_image_assignment(jsonb, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.save_poi_with_image_assignment(
  p_poi jsonb,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin',
  p_skip_primary_image_update boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poi_id text;
  v_city_id text;
  v_url text;
  v_bucket text;
  v_path text;
  v_poi_payload jsonb;
  v_uid uuid;
  v_lock_key bigint;
  v_current_primary public.entity_image_assignments%ROWTYPE;
  v_existing public.pois%ROWTYPE;
  v_primary_active_count integer;
  v_coords_lat double precision;
  v_coords_lng double precision;
  v_coords_lat_raw text;
  v_coords_lng_raw text;
BEGIN
  v_uid := auth.uid();
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF p_poi IS NULL OR jsonb_typeof(p_poi) <> 'object' THEN
    RAISE EXCEPTION 'Payload POI non valido.';
  END IF;

  IF p_poi->>'id' IS NULL OR trim(p_poi->>'id') = '' THEN
    RAISE EXCEPTION 'POI id obbligatorio.';
  END IF;

  IF p_poi->>'city_id' IS NULL OR trim(p_poi->>'city_id') = '' THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  v_poi_id := trim(p_poi->>'id');
  v_city_id := trim(p_poi->>'city_id');

  v_poi_payload := jsonb_set(p_poi, '{image_url}', 'null'::jsonb, true);

  IF NOT p_skip_primary_image_update THEN
    v_url := NULLIF(trim(p_image_url), '');
    v_bucket := NULLIF(trim(p_storage_bucket), '');
    v_path := NULLIF(trim(p_storage_path), '');

    IF NOT (v_url IS NULL AND v_path IS NULL AND v_bucket IS NULL) THEN
      IF v_url IS NULL OR v_path IS NULL OR v_bucket IS NULL THEN
        RAISE EXCEPTION
          'Parametri immagine primary incompleti: p_image_url, p_storage_bucket e p_storage_path obbligatori per assegnazione.';
      END IF;
    END IF;
  END IF;

  v_coords_lat := NULL;
  v_coords_lng := NULL;
  v_coords_lat_raw := v_poi_payload->>'coords_lat';
  v_coords_lng_raw := v_poi_payload->>'coords_lng';

  IF v_coords_lat_raw IS NOT NULL AND trim(v_coords_lat_raw) <> '' THEN
    BEGIN
      v_coords_lat := v_coords_lat_raw::double precision;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'coords_lat non valida (non numerica).';
    END;
    IF v_coords_lat <> v_coords_lat
      OR v_coords_lat < -90
      OR v_coords_lat > 90 THEN
      RAISE EXCEPTION 'coords_lat fuori range o non finita ([-90,90] richiesto).';
    END IF;
  END IF;

  IF v_coords_lng_raw IS NOT NULL AND trim(v_coords_lng_raw) <> '' THEN
    BEGIN
      v_coords_lng := v_coords_lng_raw::double precision;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'coords_lng non valida (non numerica).';
    END;
    IF v_coords_lng <> v_coords_lng
      OR v_coords_lng < -180
      OR v_coords_lng > 180 THEN
      RAISE EXCEPTION 'coords_lng fuori range o non finita ([-180,180] richiesto).';
    END IF;
  END IF;

  IF (v_coords_lat IS NULL) <> (v_coords_lng IS NULL) THEN
    RAISE EXCEPTION 'Coordinate POI incomplete: lat e lng devono essere entrambe presenti o assenti.';
  END IF;

  SELECT * INTO v_existing
  FROM public.pois p
  WHERE p.id = v_poi_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.city_id IS DISTINCT FROM v_city_id THEN
      RAISE EXCEPTION
        'city_id del payload (%) non corrisponde alla città del POI (%); spostamento tra città non consentito.',
        v_city_id,
        v_existing.city_id;
    END IF;
  END IF;

  INSERT INTO public.pois (
    id, city_id, name, category, sub_category, description, address,
    image_url, image_status, image_credit, image_license,
    coords_lat, coords_lng, rating, votes, status,
    visit_duration, price_level, is_sponsored, tier, showcase_expiry,
    ai_reliability, tourism_interest, last_verified,
    opening_hours, affiliate, link_metadata,
    date_added, created_at, created_by, updated_at, updated_by
  )
  VALUES (
    v_poi_id,
    v_city_id,
    COALESCE(NULLIF(trim(v_poi_payload->>'name'), ''), 'Senza Nome'),
    COALESCE(NULLIF(trim(v_poi_payload->>'category'), ''), 'discovery'),
    NULLIF(v_poi_payload->>'sub_category', ''),
    COALESCE(v_poi_payload->>'description', ''),
    NULLIF(v_poi_payload->>'address', ''),
    NULL,
    COALESCE(NULLIF(trim(v_poi_payload->>'image_status'), ''), 'real')::public.media_status,
    NULLIF(v_poi_payload->>'image_credit', ''),
    NULLIF(v_poi_payload->>'image_license', '')::public.image_license,
    v_coords_lat,
    v_coords_lng,
    COALESCE((v_poi_payload->>'rating')::numeric, 0),
    COALESCE((v_poi_payload->>'votes')::integer, 0),
    COALESCE(NULLIF(trim(v_poi_payload->>'status'), ''), 'published'),
    NULLIF(v_poi_payload->>'visit_duration', ''),
    NULLIF(v_poi_payload->>'price_level', '')::integer,
    COALESCE((v_poi_payload->>'is_sponsored')::boolean, false),
    NULLIF(v_poi_payload->>'tier', ''),
    NULLIF(v_poi_payload->>'showcase_expiry', ''),
    NULLIF(v_poi_payload->>'ai_reliability', ''),
    NULLIF(v_poi_payload->>'tourism_interest', ''),
    NULLIF(v_poi_payload->>'last_verified', '')::timestamptz,
    COALESCE(v_poi_payload->'opening_hours', 'null'::jsonb),
    COALESCE(v_poi_payload->'affiliate', 'null'::jsonb),
    COALESCE(v_poi_payload->'link_metadata', 'null'::jsonb),
    COALESCE((v_poi_payload->>'date_added')::date, CURRENT_DATE),
    COALESCE((v_poi_payload->>'created_at')::timestamptz, now()),
    COALESCE(NULLIF(trim(v_poi_payload->>'created_by'), ''), 'Sistema'),
    COALESCE((v_poi_payload->>'updated_at')::timestamptz, now()),
    COALESCE(NULLIF(trim(v_poi_payload->>'updated_by'), ''), 'Sistema')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    image_url = NULL,
    image_status = EXCLUDED.image_status,
    image_credit = EXCLUDED.image_credit,
    image_license = EXCLUDED.image_license,
    coords_lat = EXCLUDED.coords_lat,
    coords_lng = EXCLUDED.coords_lng,
    rating = EXCLUDED.rating,
    votes = EXCLUDED.votes,
    status = EXCLUDED.status,
    visit_duration = EXCLUDED.visit_duration,
    price_level = EXCLUDED.price_level,
    is_sponsored = EXCLUDED.is_sponsored,
    tier = EXCLUDED.tier,
    showcase_expiry = EXCLUDED.showcase_expiry,
    ai_reliability = EXCLUDED.ai_reliability,
    tourism_interest = EXCLUDED.tourism_interest,
    last_verified = EXCLUDED.last_verified,
    opening_hours = EXCLUDED.opening_hours,
    affiliate = EXCLUDED.affiliate,
    link_metadata = EXCLUDED.link_metadata,
    date_added = EXCLUDED.date_added,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;

  IF p_skip_primary_image_update THEN
    RETURN v_poi_id;
  END IF;

  IF v_url IS NULL AND v_path IS NULL THEN
    v_lock_key := hashtextextended(
      'poi' || E'\x1f' || v_poi_id || E'\x1f' || v_city_id || E'\x1f' || 'primary',
      0
    );
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COUNT(*) INTO v_primary_active_count
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active';

    IF v_primary_active_count > 1 THEN
      RAISE EXCEPTION
        'Incoerenza dati: più di una primary active per poi % in city %; riparare prima del save.',
        v_poi_id,
        v_city_id;
    END IF;

    SELECT * INTO v_current_primary
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.entity_image_assignments
      SET
        assignment_status = 'removed',
        is_current = false,
        removed_at = now(),
        updated_at = now()
      WHERE id = v_current_primary.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_status_changed',
        v_current_primary.media_asset_id,
        v_current_primary.id,
        'poi',
        v_poi_id,
        v_city_id,
        'active',
        'removed',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        jsonb_build_object(
          'assignment_role', 'primary',
          'source', 'save_poi_with_image_assignment',
          'reason', 'image_cleared_on_save'
        )
      );
    END IF;
  ELSE
    PERFORM public.upsert_poi_primary_image_assignment(
      v_poi_id,
      v_city_id,
      v_url,
      v_bucket,
      v_path,
      COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
    );
  END IF;

  RETURN v_poi_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_poi_with_image_assignment(
  jsonb, text, text, text, text, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_poi_with_image_assignment(
  jsonb, text, text, text, text, boolean
) TO authenticated;

COMMENT ON FUNCTION public.save_poi_with_image_assignment IS
  'D90/MF4 — upsert pois (image_url null) + primary assignment/revoke; p_skip_primary_image_update salva solo dati editoriali.';
