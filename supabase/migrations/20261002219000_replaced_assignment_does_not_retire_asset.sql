-- SOSTITUITO resta sull assignment. Il media asset non passa a replaced.

CREATE OR REPLACE FUNCTION public.upsert_entity_image_assignment_dual_write(
  p_entity_type text,
  p_entity_id text,
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_assignment_role text DEFAULT 'primary',
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_url text;
  v_bucket text;
  v_path text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_current public.entity_image_assignments%ROWTYPE;
  v_published_at timestamptz;
  v_same_source_active_id uuid;
  v_origin_type text;
  v_canonical_url text;
  v_canonical_bucket text;
  v_canonical_path text;
  v_lock_key bigint;
  v_photo_status text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  p_entity_id := pg_catalog.btrim(p_entity_id);
  p_city_id := pg_catalog.btrim(p_city_id);

  IF pg_catalog.char_length(p_entity_id) = 0 OR pg_catalog.char_length(p_city_id) = 0 THEN
    RAISE EXCEPTION 'entity_id e city_id obbligatori.';
  END IF;

  v_role := COALESCE(NULLIF(pg_catalog.btrim(p_assignment_role), ''), 'primary');
  IF v_role NOT IN ('primary', 'gallery') THEN
    RAISE EXCEPTION 'assignment_role non valido: %', v_role;
  END IF;

  PERFORM public.image_mgmt_phase1_validate_dual_write_request(
    p_entity_type,
    v_role,
    p_origin_type,
    p_city_id
  );

  v_url := NULLIF(pg_catalog.btrim(p_image_url), '');
  v_bucket := NULLIF(pg_catalog.btrim(p_storage_bucket), '');
  v_path := NULLIF(pg_catalog.btrim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  IF p_entity_type = 'patron' AND p_entity_id IS DISTINCT FROM p_city_id THEN
    RAISE EXCEPTION 'Patrono: entity_id deve coincidere con city_id (D72).';
  END IF;

  IF p_entity_type = 'city' AND p_entity_id IS DISTINCT FROM p_city_id THEN
    RAISE EXCEPTION 'City hero: entity_id deve coincidere con city_id.';
  END IF;

  IF p_entity_type = 'photo_submission' THEN
    SELECT
      NULLIF(pg_catalog.btrim(ps.image_url), ''),
      ps.status,
      CASE
        WHEN ps.status = 'approved' THEN COALESCE(ps.published_at, pg_catalog.now())
        ELSE NULL
      END
    INTO v_canonical_url, v_photo_status, v_published_at
    FROM public.photo_submissions ps
    WHERE ps.id = p_entity_id::uuid
      AND ps.city_id = p_city_id
      AND (
        public.is_td_admin(v_uid)
        OR ps.user_id = v_uid
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'photo_submission non trovata, non appartiene alla città o non autorizzato.';
    END IF;

    IF v_photo_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'photo_submission non approvata: assignment non consentito.';
    END IF;

    IF v_canonical_url IS NULL THEN
      RAISE EXCEPTION 'photo_submission senza sorgente immagine canonica.';
    END IF;

    v_canonical_bucket := NULL;
    v_canonical_path := NULL;

    IF v_canonical_url ~ '/object/public/community-photos/' THEN
      v_canonical_bucket := 'community-photos';
      v_canonical_path := substring(v_canonical_url from '/object/public/community-photos/([^?]+)');
    ELSIF v_canonical_url ~ '/object/public/public-media/' THEN
      v_canonical_bucket := 'public-media';
      v_canonical_path := substring(v_canonical_url from '/object/public/public-media/([^?]+)');
    END IF;

    IF v_canonical_bucket IS NULL
      OR v_canonical_path IS NULL
      OR pg_catalog.char_length(pg_catalog.btrim(v_canonical_path)) = 0 THEN
      RAISE EXCEPTION
        'photo_submission image_url non canonica: atteso storage Supabase community-photos o public-media.';
    END IF;

    IF v_url IS NOT NULL AND v_url IS DISTINCT FROM v_canonical_url THEN
      RAISE EXCEPTION 'image_url non corrisponde alla sorgente canonica della photo_submission.';
    END IF;

    IF v_path IS NOT NULL THEN
      IF v_canonical_path IS NULL OR v_path IS DISTINCT FROM v_canonical_path THEN
        RAISE EXCEPTION 'storage_path non corrisponde alla sorgente canonica della photo_submission.';
      END IF;
      IF v_bucket IS NOT NULL
        AND v_canonical_bucket IS NOT NULL
        AND v_bucket IS DISTINCT FROM v_canonical_bucket THEN
        RAISE EXCEPTION 'storage_bucket non corrisponde alla sorgente canonica della photo_submission.';
      END IF;
    ELSIF v_url IS NULL THEN
      RAISE EXCEPTION 'Sorgente immagine assente per photo_submission.';
    END IF;

    v_url := v_canonical_url;
    v_bucket := COALESCE(v_canonical_bucket, v_bucket);
    v_path := COALESCE(v_canonical_path, v_path);

  ELSIF p_entity_type = 'city_person' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per city_person.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.city_people cp
      WHERE cp.id = p_entity_id::uuid
        AND cp.city_id = p_city_id
    ) THEN
      RAISE EXCEPTION 'city_person non trovato per city_id/entity_id.';
    END IF;

    SELECT CASE
      WHEN cp.status = 'published' THEN pg_catalog.now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.city_people cp
    WHERE cp.id = p_entity_id::uuid
      AND cp.city_id = p_city_id;

  ELSIF p_entity_type = 'poi' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per poi.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.pois p
      WHERE p.id = p_entity_id
        AND p.city_id = p_city_id
    ) THEN
      RAISE EXCEPTION 'poi non trovato per city_id/entity_id.';
    END IF;

    SELECT CASE
      WHEN COALESCE(p.status, 'published') = 'published' THEN pg_catalog.now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.pois p
    WHERE p.id = p_entity_id
      AND p.city_id = p_city_id;

  ELSIF p_entity_type = 'patron' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per patron.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.cities c
      WHERE c.id = p_city_id
    ) THEN
      RAISE EXCEPTION 'Città Patrono non trovata.';
    END IF;

    SELECT CASE
      WHEN COALESCE(c.patron_editorial_status, 'published') = 'published' THEN pg_catalog.now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.cities c
    WHERE c.id = p_city_id;

  ELSIF p_entity_type = 'city' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per city.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.cities c
      WHERE c.id = p_city_id
    ) THEN
      RAISE EXCEPTION 'Città non trovata.';
    END IF;

    SELECT CASE
      WHEN COALESCE(c.status, 'published') = 'published' THEN pg_catalog.now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.cities c
    WHERE c.id = p_city_id;
  END IF;

  v_lock_key := pg_catalog.hashtextextended(
    p_entity_type || E'\x1f' || p_entity_id || E'\x1f' || p_city_id || E'\x1f' || v_role,
    0
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_key);

  IF p_entity_type = 'photo_submission' THEN
    v_origin_type := 'community';
  ELSE
    v_origin_type := public.normalize_canonical_media_origin_type(
      COALESCE(NULLIF(pg_catalog.btrim(p_origin_type), ''), 'admin')
    );
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(
    v_url,
    v_bucket,
    v_path,
    v_origin_type
  );

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_asset_id::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.media_assets ma
    WHERE ma.id = v_asset_id
      AND ma.archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Dual-write: asset archiviato; assignment non consentito.';
  END IF;

  SELECT eia.id
  INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = p_entity_type
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = v_role
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
    AND (
      eia.media_asset_id = v_asset_id
      OR (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = p_entity_type
      AND eia.entity_id = p_entity_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = v_role
      AND eia.assignment_status IN ('suspended', 'removed')
      AND (
        eia.media_asset_id = v_asset_id
        OR (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Dual-write: associazione sospesa o rimossa per la stessa sorgente; rematerializzazione non consentita.';
  END IF;

  IF v_role = 'gallery' THEN
    INSERT INTO public.entity_image_assignments (
      media_asset_id,
      entity_type,
      entity_id,
      city_id,
      assignment_role,
      assignment_status,
      is_current,
      source_image_url,
      source_storage_bucket,
      source_storage_path,
      first_published_at,
      published_at
    )
    VALUES (
      v_asset_id,
      p_entity_type,
      p_entity_id,
      p_city_id,
      'gallery',
      'active',
      true,
      v_url,
      v_bucket,
      v_path,
      v_published_at,
      v_published_at
    )
    RETURNING id INTO v_assignment_id;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_created',
      v_asset_id,
      v_assignment_id,
      p_entity_type,
      p_entity_id,
      p_city_id,
      NULL,
      'active',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      pg_catalog.jsonb_build_object(
        'assignment_role', 'gallery',
        'origin_type', v_origin_type,
        'source', 'upsert_entity_image_assignment_dual_write'
      )
    );

    RETURN v_assignment_id;
  END IF;

  SELECT *
  INTO v_current
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = p_entity_type
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF v_current.assignment_status IN ('suspended', 'removed') THEN
      RAISE EXCEPTION
        'Dual-write: primary corrente % (id=%); sostituzione non consentita.',
        v_current.assignment_status,
        v_current.id;
    END IF;

    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = 'replaced',
      updated_at = pg_catalog.now()
    WHERE id = v_current.id;



    INSERT INTO public.entity_image_assignments (
      media_asset_id,
      entity_type,
      entity_id,
      city_id,
      assignment_role,
      assignment_status,
      is_current,
      source_image_url,
      source_storage_bucket,
      source_storage_path,
      first_published_at,
      published_at
    )
    VALUES (
      v_asset_id,
      p_entity_type,
      p_entity_id,
      p_city_id,
      'primary',
      'active',
      true,
      v_url,
      v_bucket,
      v_path,
      v_published_at,
      v_published_at
    )
    RETURNING id INTO v_assignment_id;

    UPDATE public.entity_image_assignments
    SET replaced_by_assignment_id = v_assignment_id
    WHERE id = v_current.id;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_replaced',
      v_current.media_asset_id,
      v_current.id,
      p_entity_type,
      p_entity_id,
      p_city_id,
      v_current.assignment_status,
      'replaced',
      NULL,
      NULL,
      v_assignment_id,
      NULL,
      NULL,
      false,
      pg_catalog.jsonb_build_object(
        'new_assignment_id', v_assignment_id,
        'new_media_asset_id', v_asset_id,
        'origin_type', v_origin_type,
        'source', 'upsert_entity_image_assignment_dual_write'
      )
    );

    PERFORM public.append_entity_image_history_trusted(
      'assignment_created',
      v_asset_id,
      v_assignment_id,
      p_entity_type,
      p_entity_id,
      p_city_id,
      NULL,
      'active',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      pg_catalog.jsonb_build_object(
        'assignment_role', 'primary',
        'origin_type', v_origin_type,
        'source', 'upsert_entity_image_assignment_dual_write'
      )
    );

    RETURN v_assignment_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id,
    entity_type,
    entity_id,
    city_id,
    assignment_role,
    assignment_status,
    is_current,
    source_image_url,
    source_storage_bucket,
    source_storage_path,
    first_published_at,
    published_at
  )
  VALUES (
    v_asset_id,
    p_entity_type,
    p_entity_id,
    p_city_id,
    'primary',
    'active',
    true,
    v_url,
    v_bucket,
    v_path,
    v_published_at,
    v_published_at
  )
  RETURNING id INTO v_assignment_id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_created',
    v_asset_id,
    v_assignment_id,
    p_entity_type,
    p_entity_id,
    p_city_id,
    NULL,
    'active',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    pg_catalog.jsonb_build_object(
      'assignment_role', 'primary',
      'origin_type', v_origin_type,
      'source', 'upsert_entity_image_assignment_dual_write'
    )
  );

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_entity_image_assignment_dual_write(
  text, text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_entity_image_assignment_dual_write(
  text, text, text, text, text, text, text, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_patron_primary_image_assignment(
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url text;
  v_bucket text;
  v_path text;
  v_origin_type text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_current public.entity_image_assignments%ROWTYPE;
  v_published_at timestamptz;
  v_same_source_active_id uuid;
  v_lock_key bigint;
  v_active_primary_count integer;
  v_same_source_count integer;
  v_loop_id uuid;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.cities c
    WHERE c.id = p_city_id
  ) THEN
    RAISE EXCEPTION 'Città non trovata: %', p_city_id;
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_path IS NOT NULL THEN
    v_bucket := COALESCE(NULLIF(trim(p_storage_bucket), ''), 'public-media');
    IF v_bucket <> 'public-media' THEN
      RAISE EXCEPTION
        'Bucket Patrono primary non canonico (%). Atteso public-media (uploadPublicMediaDetailed).',
        v_bucket;
    END IF;
  ELSE
    v_bucket := NULL;
    IF NULLIF(trim(p_storage_bucket), '') IS NOT NULL THEN
      RAISE EXCEPTION
        'storage_bucket senza storage_path non consentito (primary URL-only: bucket NULL).';
    END IF;
  END IF;

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  SELECT CASE WHEN c.patron_editorial_status = 'published' THEN now() ELSE NULL END
  INTO v_published_at
  FROM public.cities c
  WHERE c.id = p_city_id;

  IF lower(trim(COALESCE(p_origin_type, ''))) = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non ammesso; impostare su media_assets dalla pipeline D79-D82.';
  END IF;

  v_origin_type := public.normalize_canonical_media_origin_type(
    COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
  );

  v_lock_key := hashtextextended(
    'patron' || E'\x1f' || p_city_id || E'\x1f' || p_city_id || E'\x1f' || 'primary',
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

  v_same_source_active_id := NULL;
  v_same_source_count := 0;
  FOR v_loop_id IN
    SELECT eia.id
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = p_city_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status IN ('active', 'restored')
      AND (
        (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
          AND (
            (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
            OR (
              v_bucket IS NOT NULL
              AND eia.source_storage_bucket IS NOT NULL
              AND eia.source_storage_bucket = v_bucket
            )
          )
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
    ORDER BY eia.id
    FOR UPDATE
  LOOP
    v_same_source_count := v_same_source_count + 1;
    IF v_same_source_count = 1 THEN
      v_same_source_active_id := v_loop_id;
    END IF;
  END LOOP;

  IF v_same_source_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo per la stessa sorgente (city_id=%).',
      p_city_id;
  END IF;

  IF v_same_source_active_id IS NOT NULL THEN
    SELECT eia.media_asset_id
    INTO v_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_same_source_active_id;

    IF v_asset_id IS NULL THEN
      RAISE EXCEPTION
        'Assignment primary corrente attivo senza media_asset_id (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.media_assets ma
      WHERE ma.id = v_asset_id AND ma.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION
        'Assignment primary corrente referenzia media_asset assente o archiviato (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT public.is_media_asset_publicly_usable(v_asset_id) THEN
      RAISE EXCEPTION
        'Assignment primary corrente referenzia media_asset non pubblicamente utilizzabile (assignment=%).',
        v_same_source_active_id;
    END IF;

    RETURN v_same_source_active_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = p_city_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.assignment_status IN ('suspended', 'removed')
      AND (
        (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
          AND (
            (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
            OR (
              v_bucket IS NOT NULL
              AND eia.source_storage_bucket IS NOT NULL
              AND eia.source_storage_bucket = v_bucket
            )
          )
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Associazione sospesa o rimossa per la stessa sorgente; rematerializzazione non consentita.';
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(v_url, v_bucket, v_path, v_origin_type);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_asset_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.media_assets ma
    WHERE ma.id = v_asset_id AND ma.archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Asset archiviato; assignment non consentito.';
  END IF;

  v_same_source_active_id := NULL;
  v_same_source_count := 0;
  FOR v_loop_id IN
    SELECT eia.id
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = p_city_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status IN ('active', 'restored')
      AND (
        (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
          AND (
            (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
            OR (
              v_bucket IS NOT NULL
              AND eia.source_storage_bucket IS NOT NULL
              AND eia.source_storage_bucket = v_bucket
            )
          )
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
    ORDER BY eia.id
    FOR UPDATE
  LOOP
    v_same_source_count := v_same_source_count + 1;
    IF v_same_source_count = 1 THEN
      v_same_source_active_id := v_loop_id;
    END IF;
  END LOOP;

  IF v_same_source_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo per la stessa sorgente (city_id=%).',
      p_city_id;
  END IF;

  IF v_same_source_active_id IS NOT NULL THEN
    SELECT eia.media_asset_id
    INTO v_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_same_source_active_id;

    IF v_asset_id IS NULL THEN
      RAISE EXCEPTION
        'Assignment primary corrente attivo senza media_asset_id (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.media_assets ma
      WHERE ma.id = v_asset_id AND ma.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION
        'Assignment primary corrente referenzia media_asset assente o archiviato (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT public.is_media_asset_publicly_usable(v_asset_id) THEN
      RAISE EXCEPTION
        'Assignment primary corrente referenzia media_asset non pubblicamente utilizzabile (assignment=%).',
        v_same_source_active_id;
    END IF;

    RETURN v_same_source_active_id;
  END IF;

  SELECT count(*)
  INTO v_active_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'patron'
    AND eia.entity_id = p_city_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored');

  IF v_active_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo per patron (city_id=%).',
      p_city_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = p_city_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status IN ('suspended', 'removed')
  ) THEN
    RAISE EXCEPTION
      'Assignment primary corrente non attivo (suspended/removed); sostituzione non consentita (city_id=%).',
      p_city_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = p_city_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status NOT IN ('active', 'suspended', 'removed', 'restored')
  ) THEN
    RAISE EXCEPTION
      'Assignment primary corrente con stato non governato; sostituzione non consentita (city_id=%).',
      p_city_id;
  END IF;

  SELECT * INTO v_current
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'patron'
    AND eia.entity_id = p_city_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = 'replaced',
      updated_at = now()
    WHERE id = v_current.id;



    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id,
      assignment_role, assignment_status, is_current,
      source_image_url, source_storage_bucket, source_storage_path,
      first_published_at, published_at
    )
    VALUES (
      v_asset_id, 'patron', p_city_id, p_city_id,
      'primary', 'active', true,
      v_url, v_bucket, v_path,
      v_published_at, v_published_at
    )
    RETURNING id INTO v_assignment_id;

    IF v_current.assignment_status IN ('active', 'restored') THEN
      UPDATE public.entity_image_assignments
      SET replaced_by_assignment_id = v_assignment_id
      WHERE id = v_current.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_replaced',
        v_current.media_asset_id, v_current.id,
        'patron', p_city_id, p_city_id,
        v_current.assignment_status, 'replaced',
        NULL, NULL, v_assignment_id, NULL, NULL, false,
        jsonb_build_object(
          'new_assignment_id', v_assignment_id,
          'new_media_asset_id', v_asset_id,
          'origin_type', v_origin_type,
          'source', 'upsert_patron_primary_image_assignment'
        )
      );
    END IF;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_created', v_asset_id, v_assignment_id,
      'patron', p_city_id, p_city_id,
      NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
      jsonb_build_object(
        'assignment_role', 'primary',
        'origin_type', v_origin_type,
        'source', 'upsert_patron_primary_image_assignment'
      )
    );

    RETURN v_assignment_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id,
    assignment_role, assignment_status, is_current,
    source_image_url, source_storage_bucket, source_storage_path,
    first_published_at, published_at
  )
  VALUES (
    v_asset_id, 'patron', p_city_id, p_city_id,
    'primary', 'active', true,
    v_url, v_bucket, v_path,
    v_published_at, v_published_at
  )
  RETURNING id INTO v_assignment_id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_created', v_asset_id, v_assignment_id,
    'patron', p_city_id, p_city_id,
    NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
    jsonb_build_object(
      'assignment_role', 'primary',
      'origin_type', v_origin_type,
      'source', 'upsert_patron_primary_image_assignment'
    )
  );

  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_poi_primary_image_assignment(
  p_entity_id text,
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url text;
  v_bucket text;
  v_path text;
  v_origin_type text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_current public.entity_image_assignments%ROWTYPE;
  v_published_at timestamptz;
  v_same_source_active_id uuid;
  v_lock_key bigint;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pois p
    WHERE p.id = p_entity_id AND p.city_id = p_city_id
  ) THEN
    RAISE EXCEPTION 'poi non trovato per city_id/entity_id.';
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  SELECT CASE WHEN p.status = 'published' THEN now() ELSE NULL END
  INTO v_published_at
  FROM public.pois p
  WHERE p.id = p_entity_id AND p.city_id = p_city_id;

  IF lower(trim(COALESCE(p_origin_type, ''))) = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non ammesso; impostare su media_assets dalla pipeline D79-D82.';
  END IF;

  v_origin_type := public.normalize_canonical_media_origin_type(
    COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
  );

  v_lock_key := hashtextextended(
    'poi' || E'\x1f' || p_entity_id || E'\x1f' || p_city_id::text || E'\x1f' || 'primary',
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Stessa sorgente già attiva (prima di ensure_media_asset — evita materializzazione inutile).
  SELECT eia.id INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
    AND (
      (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
        AND (
          (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
          OR (
            v_bucket IS NOT NULL
            AND eia.source_storage_bucket IS NOT NULL
            AND eia.source_storage_bucket = v_bucket
          )
        )
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = p_entity_id
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.assignment_status IN ('suspended', 'removed')
      AND (
        (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
          AND (
            (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
            OR (
              v_bucket IS NOT NULL
              AND eia.source_storage_bucket IS NOT NULL
              AND eia.source_storage_bucket = v_bucket
            )
          )
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Associazione sospesa o rimossa per la stessa sorgente; rematerializzazione non consentita.';
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(v_url, v_bucket, v_path, v_origin_type);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_asset_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.media_assets ma
    WHERE ma.id = v_asset_id AND ma.archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Asset archiviato; assignment non consentito.';
  END IF;

  SELECT eia.id INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
    AND (
      eia.media_asset_id = v_asset_id
      OR (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
        AND (
          (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
          OR (
            v_bucket IS NOT NULL
            AND eia.source_storage_bucket IS NOT NULL
            AND eia.source_storage_bucket = v_bucket
          )
        )
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  SELECT * INTO v_current
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF v_current.assignment_status IN ('suspended', 'removed') THEN
      RAISE EXCEPTION
        'Assignment primary corrente % (id=%); sostituzione non consentita.',
        v_current.assignment_status,
        v_current.id;
    END IF;

    IF v_current.assignment_status NOT IN ('active', 'restored') THEN
      RAISE EXCEPTION
        'Assignment primary corrente con stato non governato; sostituzione non consentita (id=%).',
        v_current.id;
    END IF;

    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = CASE
        WHEN v_current.assignment_status IN ('active', 'restored') THEN 'replaced'
        ELSE v_current.assignment_status
      END,
      updated_at = now()
    WHERE id = v_current.id;



    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id,
      assignment_role, assignment_status, is_current,
      source_image_url, source_storage_bucket, source_storage_path,
      first_published_at, published_at
    )
    VALUES (
      v_asset_id, 'poi', p_entity_id, p_city_id,
      'primary', 'active', true,
      v_url, v_bucket, v_path,
      v_published_at, v_published_at
    )
    RETURNING id INTO v_assignment_id;

    IF v_current.assignment_status IN ('active', 'restored') THEN
      UPDATE public.entity_image_assignments
      SET replaced_by_assignment_id = v_assignment_id
      WHERE id = v_current.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_replaced',
        v_current.media_asset_id, v_current.id,
        'poi', p_entity_id, p_city_id,
        v_current.assignment_status, 'replaced',
        NULL, NULL, v_assignment_id, NULL, NULL, false,
        jsonb_build_object(
          'new_assignment_id', v_assignment_id,
          'new_media_asset_id', v_asset_id,
          'origin_type', v_origin_type,
          'source', 'upsert_poi_primary_image_assignment'
        )
      );
    END IF;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_created', v_asset_id, v_assignment_id,
      'poi', p_entity_id, p_city_id,
      NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
      jsonb_build_object(
        'assignment_role', 'primary',
        'origin_type', v_origin_type,
        'source', 'upsert_poi_primary_image_assignment'
      )
    );

    RETURN v_assignment_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id,
    assignment_role, assignment_status, is_current,
    source_image_url, source_storage_bucket, source_storage_path,
    first_published_at, published_at
  )
  VALUES (
    v_asset_id, 'poi', p_entity_id, p_city_id,
    'primary', 'active', true,
    v_url, v_bucket, v_path,
    v_published_at, v_published_at
  )
  RETURNING id INTO v_assignment_id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_created', v_asset_id, v_assignment_id,
    'poi', p_entity_id, p_city_id,
    NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
    jsonb_build_object(
      'assignment_role', 'primary',
      'origin_type', v_origin_type,
      'source', 'upsert_poi_primary_image_assignment'
    )
  );

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_poi_primary_image_assignment(
  text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_poi_primary_image_assignment(
  text, text, text, text, text, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_entity_primary_image_assignment(
  p_entity_id uuid,
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url text;
  v_bucket text;
  v_path text;
  v_origin_type text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_current public.entity_image_assignments%ROWTYPE;
  v_published_at timestamptz;
  v_same_source_active_id uuid;
  v_lock_key bigint;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.city_people cp
    WHERE cp.id = p_entity_id AND cp.city_id = p_city_id
  ) THEN
    RAISE EXCEPTION 'city_person non trovato per city_id/entity_id.';
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  SELECT CASE WHEN cp.status = 'published' THEN now() ELSE NULL END
  INTO v_published_at
  FROM public.city_people cp
  WHERE cp.id = p_entity_id AND cp.city_id = p_city_id;

  IF lower(trim(COALESCE(p_origin_type, ''))) = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non ammesso; impostare su media_assets dalla pipeline D79-D82.';
  END IF;

  v_origin_type := public.normalize_canonical_media_origin_type(
    COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
  );

  v_lock_key := hashtextextended(
    'city_person' || E'\x1f' || p_entity_id::text || E'\x1f' || p_city_id::text || E'\x1f' || 'primary',
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Stessa sorgente già attiva (prima di ensure_media_asset — evita materializzazione inutile).
  SELECT eia.id INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'city_person'
    AND eia.entity_id = p_entity_id::text
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
    AND (
      (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
        AND (
          (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
          OR (
            v_bucket IS NOT NULL
            AND eia.source_storage_bucket IS NOT NULL
            AND eia.source_storage_bucket = v_bucket
          )
        )
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'city_person'
      AND eia.entity_id = p_entity_id::text
      AND eia.city_id = p_city_id
      AND eia.assignment_role = 'primary'
      AND eia.assignment_status IN ('suspended', 'removed')
      AND (
        (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
          AND (
            (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
            OR (
              v_bucket IS NOT NULL
              AND eia.source_storage_bucket IS NOT NULL
              AND eia.source_storage_bucket = v_bucket
            )
          )
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Associazione sospesa o rimossa per la stessa sorgente; rematerializzazione non consentita.';
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(v_url, v_bucket, v_path, v_origin_type);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_asset_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.media_assets ma
    WHERE ma.id = v_asset_id AND ma.archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Asset archiviato; assignment non consentito.';
  END IF;

  SELECT eia.id INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'city_person'
    AND eia.entity_id = p_entity_id::text
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status IN ('active', 'restored')
    AND (
      eia.media_asset_id = v_asset_id
      OR (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
        AND (
          (v_bucket IS NULL AND eia.source_storage_bucket IS NULL)
          OR (
            v_bucket IS NOT NULL
            AND eia.source_storage_bucket IS NOT NULL
            AND eia.source_storage_bucket = v_bucket
          )
        )
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  SELECT * INTO v_current
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'city_person'
    AND eia.entity_id = p_entity_id::text
    AND eia.city_id = p_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF v_current.assignment_status IN ('suspended', 'removed') THEN
      RAISE EXCEPTION
        'Assignment primary corrente % (id=%); sostituzione non consentita.',
        v_current.assignment_status,
        v_current.id;
    END IF;

    IF v_current.assignment_status NOT IN ('active', 'restored') THEN
      RAISE EXCEPTION
        'Assignment primary corrente con stato non governato; sostituzione non consentita (id=%).',
        v_current.id;
    END IF;

    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = CASE
        WHEN v_current.assignment_status IN ('active', 'restored') THEN 'replaced'
        ELSE v_current.assignment_status
      END,
      updated_at = now()
    WHERE id = v_current.id;



    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id,
      assignment_role, assignment_status, is_current,
      source_image_url, source_storage_bucket, source_storage_path,
      first_published_at, published_at
    )
    VALUES (
      v_asset_id, 'city_person', p_entity_id::text, p_city_id,
      'primary', 'active', true,
      v_url, v_bucket, v_path,
      v_published_at, v_published_at
    )
    RETURNING id INTO v_assignment_id;

    IF v_current.assignment_status IN ('active', 'restored') THEN
      UPDATE public.entity_image_assignments
      SET replaced_by_assignment_id = v_assignment_id
      WHERE id = v_current.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_replaced',
        v_current.media_asset_id, v_current.id,
        'city_person', p_entity_id::text, p_city_id,
        v_current.assignment_status, 'replaced',
        NULL, NULL, v_assignment_id, NULL, NULL, false,
        jsonb_build_object(
          'new_assignment_id', v_assignment_id,
          'new_media_asset_id', v_asset_id,
          'origin_type', v_origin_type,
          'source', 'upsert_entity_primary_image_assignment'
        )
      );
    END IF;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_created', v_asset_id, v_assignment_id,
      'city_person', p_entity_id::text, p_city_id,
      NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
      jsonb_build_object(
        'assignment_role', 'primary',
        'origin_type', v_origin_type,
        'source', 'upsert_entity_primary_image_assignment'
      )
    );

    RETURN v_assignment_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id,
    assignment_role, assignment_status, is_current,
    source_image_url, source_storage_bucket, source_storage_path,
    first_published_at, published_at
  )
  VALUES (
    v_asset_id, 'city_person', p_entity_id::text, p_city_id,
    'primary', 'active', true,
    v_url, v_bucket, v_path,
    v_published_at, v_published_at
  )
  RETURNING id INTO v_assignment_id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_created', v_asset_id, v_assignment_id,
    'city_person', p_entity_id::text, p_city_id,
    NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
    jsonb_build_object(
      'assignment_role', 'primary',
      'origin_type', v_origin_type,
      'source', 'upsert_entity_primary_image_assignment'
    )
  );

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_entity_primary_image_assignment(
  uuid, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_entity_primary_image_assignment(
  uuid, text, text, text, text, text
) TO authenticated;
