-- POST-MF5 — Patrono primary + gallery (SoT media_assets + entity_image_assignments; no dual-write MF2)

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
      AND eia.assignment_status = 'active'
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
      AND eia.assignment_status = 'active'
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
    AND eia.assignment_status = 'active';

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
      AND eia.assignment_status NOT IN ('active', 'suspended', 'removed')
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
    AND eia.assignment_status = 'active'
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = 'replaced',
      updated_at = now()
    WHERE id = v_current.id;

    -- MF3 lifecycle: 'replaced' solo se nessun assignment attivo corrente referenzia l'asset
    IF v_current.media_asset_id IS NOT NULL AND v_current.media_asset_id <> v_asset_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.entity_image_assignments eia
        WHERE eia.media_asset_id = v_current.media_asset_id
          AND eia.is_current = true
          AND eia.assignment_status = 'active'
      ) THEN
        PERFORM public.transition_media_asset_status(
          v_current.media_asset_id,
          'replaced'::public.image_asset_status,
          NULL
        );
      END IF;
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

    IF v_current.assignment_status = 'active' THEN
      UPDATE public.entity_image_assignments
      SET replaced_by_assignment_id = v_assignment_id
      WHERE id = v_current.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_replaced',
        v_current.media_asset_id, v_current.id,
        'patron', p_city_id, p_city_id,
        'active', 'replaced',
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


DROP FUNCTION IF EXISTS public.upsert_patron_gallery_image_assignment(text, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.upsert_patron_gallery_image_assignment(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.upsert_patron_gallery_image_assignment_core(text, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.upsert_patron_gallery_image_assignment_core(
  p_city_id text,
  p_image_url text,
  p_storage_bucket text,
  p_storage_path text,
  p_origin_type text,
  p_allow_same_source_rematerialize boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text;
  v_url text;
  v_bucket text;
  v_path text;
  v_origin_type text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_same_source_active_id uuid;
  v_published_at timestamptz;
  v_lock_key bigint;
  v_same_source_count integer;
  v_loop_id uuid;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  v_city_id := NULLIF(trim(p_city_id), '');
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cities c WHERE c.id = v_city_id) THEN
    RAISE EXCEPTION 'Città non trovata: %', v_city_id;
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_path IS NOT NULL THEN
    v_bucket := COALESCE(NULLIF(trim(p_storage_bucket), ''), 'public-media');
  ELSE
    v_bucket := NULL;
    IF NULLIF(trim(p_storage_bucket), '') IS NOT NULL THEN
      RAISE EXCEPTION
        'storage_bucket senza storage_path non consentito (sorgente URL-only: bucket NULL).';
    END IF;
  END IF;

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  IF lower(trim(COALESCE(p_origin_type, ''))) = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non ammesso; impostare su media_assets dalla pipeline D79-D82.';
  END IF;

  v_origin_type := public.normalize_canonical_media_origin_type(
    COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
  );

  SELECT CASE WHEN c.patron_editorial_status = 'published' THEN now() ELSE NULL END
  INTO v_published_at
  FROM public.cities c
  WHERE c.id = v_city_id;

  v_lock_key := hashtextextended(
    'patron' || E'\x1f' || v_city_id || E'\x1f' || v_city_id || E'\x1f' || 'gallery',
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

  v_same_source_active_id := NULL;
  v_same_source_count := 0;
  FOR v_loop_id IN
    SELECT eia.id
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = v_city_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'gallery'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
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
      'Incoerenza dati: piu di un assignment gallery corrente attivo per la stessa sorgente (city_id=%).',
      v_city_id;
  END IF;

  IF v_same_source_active_id IS NOT NULL THEN
    SELECT eia.media_asset_id
    INTO v_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_same_source_active_id;

    IF v_asset_id IS NULL THEN
      RAISE EXCEPTION
        'Assignment gallery corrente attivo senza media_asset_id (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.media_assets ma
      WHERE ma.id = v_asset_id AND ma.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION
        'Assignment gallery corrente referenzia media_asset assente o archiviato (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT public.is_media_asset_publicly_usable(v_asset_id) THEN
      RAISE EXCEPTION
        'Assignment gallery corrente referenzia media_asset non pubblicamente utilizzabile (assignment=%).',
        v_same_source_active_id;
    END IF;

    RETURN v_same_source_active_id;
  END IF;

  IF NOT COALESCE(p_allow_same_source_rematerialize, false) AND EXISTS (
    SELECT 1 FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = v_city_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'gallery'
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
      AND eia.entity_id = v_city_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'gallery'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
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
      'Incoerenza dati: piu di un assignment gallery corrente attivo per la stessa sorgente/asset (city_id=%).',
      v_city_id;
  END IF;

  IF v_same_source_active_id IS NOT NULL THEN
    SELECT eia.media_asset_id
    INTO v_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_same_source_active_id;

    IF v_asset_id IS NULL THEN
      RAISE EXCEPTION
        'Assignment gallery corrente attivo senza media_asset_id (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.media_assets ma
      WHERE ma.id = v_asset_id AND ma.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION
        'Assignment gallery corrente referenzia media_asset assente o archiviato (assignment=%).',
        v_same_source_active_id;
    END IF;

    IF NOT public.is_media_asset_publicly_usable(v_asset_id) THEN
      RAISE EXCEPTION
        'Assignment gallery corrente referenzia media_asset non pubblicamente utilizzabile (assignment=%).',
        v_same_source_active_id;
    END IF;

    RETURN v_same_source_active_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id,
    assignment_role, assignment_status, is_current,
    source_image_url, source_storage_bucket, source_storage_path,
    first_published_at, published_at
  )
  VALUES (
    v_asset_id, 'patron', v_city_id, v_city_id,
    'gallery', 'active', true,
    v_url, v_bucket, v_path,
    v_published_at, v_published_at
  )
  RETURNING id INTO v_assignment_id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_created', v_asset_id, v_assignment_id,
    'patron', v_city_id, v_city_id,
    NULL, 'active', NULL, NULL, NULL, NULL, NULL, false,
    jsonb_build_object(
      'assignment_role', 'gallery',
      'origin_type', v_origin_type,
      'source', 'upsert_patron_gallery_image_assignment'
    )
  );

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_patron_gallery_image_assignment_core(
  text, text, text, text, text, boolean
) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.upsert_patron_gallery_image_assignment(
  p_city_id text,
  p_image_url text,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  RETURN public.upsert_patron_gallery_image_assignment_core(
    p_city_id,
    p_image_url,
    p_storage_bucket,
    p_storage_path,
    p_origin_type,
    false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_city_patron_gallery_photo_with_assignment(
  p_city_id text,
  p_gallery_photo_id uuid,
  p_image_url text,
  p_storage_path text,
  p_sort_order integer DEFAULT NULL,
  p_caption text DEFAULT NULL,
  p_source_suggestion_item_id uuid DEFAULT NULL,
  p_approved_by uuid DEFAULT NULL,
  p_approved_at timestamptz DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text;
  v_url text;
  v_path text;
  v_assignment_id uuid;
  v_approved_by uuid;
  v_approved_at timestamptz;
  v_core_bucket text;
  v_sort_order integer;
  v_gallery_lock bigint;
BEGIN
  -- p_sort_order, p_approved_by, p_approved_at: ignorati (sort_order e audit server-authoritative); firma mantenuta per compatibilità RPC client.

  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  v_city_id := NULLIF(trim(p_city_id), '');
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  IF p_gallery_photo_id IS NULL THEN
    RAISE EXCEPTION 'gallery_photo_id obbligatorio.';
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_path := NULLIF(trim(p_storage_path), '');
  IF v_url IS NULL OR v_path IS NULL THEN
    RAISE EXCEPTION 'image_url e storage_path obbligatori per gallery Patrono.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cities c WHERE c.id = v_city_id) THEN
    RAISE EXCEPTION 'Città non trovata: %', v_city_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.city_patron_gallery g WHERE g.id = p_gallery_photo_id
  ) THEN
    RAISE EXCEPTION 'Foto gallery Patrono già esistente (id=%).', p_gallery_photo_id;
  END IF;

  IF p_source_suggestion_item_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.city_patron_gallery g
      WHERE g.source_suggestion_item_id = p_source_suggestion_item_id
    ) THEN
      RAISE EXCEPTION
        'patron_photo_suggestion_item già materializzato in gallery (id=%).',
        p_source_suggestion_item_id;
    END IF;
  END IF;

  v_core_bucket := 'public-media';

  v_gallery_lock := hashtextextended(
    'patron' || E'\x1f' || v_city_id || E'\x1f' || v_city_id || E'\x1f' || 'gallery',
    0
  );
  PERFORM pg_advisory_xact_lock(v_gallery_lock);

  SELECT COALESCE(MAX(g.sort_order), -1) + 1
  INTO v_sort_order
  FROM public.city_patron_gallery g
  WHERE g.city_id = v_city_id;

  IF p_source_suggestion_item_id IS NOT NULL THEN
    -- approvePatronPhotoSuggestionItems: claim CAS pps → accepted (tutti approvati) o rejected (parziale), poi gallery con ppsi pending;
    -- rejectPatronPhotoSuggestion non chiama questo RPC. Moderazione client-side: nessun advisory lock condiviso con gallery;
    -- FOR UPDATE su ppsi/pps serializza con gli update item post-gallery o durante reject.
    IF NOT EXISTS (
      SELECT 1
      FROM public.patron_photo_suggestion_items ppsi
      INNER JOIN public.patron_photo_suggestions pps ON pps.id = ppsi.suggestion_id
      WHERE ppsi.id = p_source_suggestion_item_id
        AND pps.city_id = v_city_id
        AND ppsi.status = 'pending'
        AND pps.status IN ('accepted', 'rejected')
      FOR UPDATE OF ppsi, pps
    ) THEN
      RAISE EXCEPTION
        'patron_photo_suggestion_item non valido per gallery (id=%, city_id=%).',
        p_source_suggestion_item_id,
        v_city_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.city_patron_gallery g
      WHERE g.source_suggestion_item_id = p_source_suggestion_item_id
    ) THEN
      RAISE EXCEPTION
        'patron_photo_suggestion_item già materializzato in gallery (id=%).',
        p_source_suggestion_item_id;
    END IF;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION
        'Materializzazione da patron_photo_suggestion_item richiede sessione admin autenticata (auth.uid).';
    END IF;
    v_approved_by := auth.uid();
    v_approved_at := now();
  ELSE
    v_approved_by := NULL;
    v_approved_at := NULL;
  END IF;

  INSERT INTO public.city_patron_gallery (
    id,
    city_id,
    image_url,
    storage_path,
    sort_order,
    caption,
    source_suggestion_item_id,
    approved_by,
    approved_at,
    created_at
  )
  VALUES (
    p_gallery_photo_id,
    v_city_id,
    v_url,
    v_path,
    v_sort_order,
    NULLIF(trim(COALESCE(p_caption, '')), ''),
    p_source_suggestion_item_id,
    v_approved_by,
    v_approved_at,
    now()
  );

  v_assignment_id := public.upsert_patron_gallery_image_assignment_core(
    v_city_id,
    v_url,
    v_core_bucket,
    v_path,
    p_origin_type,
    false
  );

  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_patron_gallery_image_assignment(p_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.entity_image_assignments%ROWTYPE;
  v_gallery_city_id text;
  v_gallery_lock bigint;
BEGIN
  IF NOT public.is_service_role() THEN
    IF auth.uid() IS NULL OR NOT public.is_td_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF p_assignment_id IS NULL THEN
    RAISE EXCEPTION 'assignment_id obbligatorio.';
  END IF;

  SELECT eia.city_id
  INTO v_gallery_city_id
  FROM public.entity_image_assignments eia
  WHERE eia.id = p_assignment_id
    AND eia.entity_type = 'patron'
    AND eia.entity_id = eia.city_id
    AND eia.assignment_role = 'gallery';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment gallery Patrono non trovato.';
  END IF;

  v_gallery_lock := hashtextextended(
    'patron' || E'\x1f' || v_gallery_city_id || E'\x1f' || v_gallery_city_id || E'\x1f' || 'gallery',
    0
  );
  PERFORM pg_advisory_xact_lock(v_gallery_lock);

  SELECT * INTO v_row
  FROM public.entity_image_assignments eia
  WHERE eia.id = p_assignment_id
    AND eia.entity_type = 'patron'
    AND eia.entity_id = eia.city_id
    AND eia.assignment_role = 'gallery'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment gallery Patrono non trovato.';
  END IF;

  IF v_row.assignment_status <> 'active' OR NOT v_row.is_current THEN
    RETURN;
  END IF;

  UPDATE public.entity_image_assignments
  SET
    assignment_status = 'removed',
    is_current = false,
    removed_at = now(),
    updated_at = now()
  WHERE id = v_row.id;

  PERFORM public.append_entity_image_history_trusted(
    'assignment_status_changed',
    v_row.media_asset_id,
    v_row.id,
    'patron',
    v_row.city_id,
    v_row.city_id,
    'active',
    'removed',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    jsonb_build_object(
      'assignment_role', 'gallery',
      'source', 'revoke_patron_gallery_image_assignment',
      'reason', 'patron_gallery_assignment_revoked'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_city_patron_gallery_photo_with_assignment(
  p_gallery_photo_id uuid,
  p_image_url text,
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
  v_gallery public.city_patron_gallery%ROWTYPE;
  v_gallery_city_id text;
  v_old_assignment_id uuid;
  v_new_assignment_id uuid;
  v_url text;
  v_path text;
  v_bucket text;
  v_gallery_path text;
  v_gallery_url text;
  v_match_count integer := 0;
  v_row public.entity_image_assignments%ROWTYPE;
  v_gallery_lock bigint;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF p_gallery_photo_id IS NULL THEN
    RAISE EXCEPTION 'gallery_photo_id obbligatorio.';
  END IF;

  SELECT g.city_id
  INTO v_gallery_city_id
  FROM public.city_patron_gallery g
  WHERE g.id = p_gallery_photo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto gallery Patrono non trovata.';
  END IF;

  v_gallery_lock := hashtextextended(
    'patron' || E'\x1f' || v_gallery_city_id || E'\x1f' || v_gallery_city_id || E'\x1f' || 'gallery',
    0
  );
  PERFORM pg_advisory_xact_lock(v_gallery_lock);

  SELECT * INTO v_gallery
  FROM public.city_patron_gallery g
  WHERE g.id = p_gallery_photo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto gallery Patrono non trovata.';
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_path := NULLIF(trim(p_storage_path), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');

  IF v_bucket IS NOT NULL AND v_bucket <> 'public-media' THEN
    RAISE EXCEPTION
      'Replace gallery Patrono: bucket non canonico (%). Atteso public-media (uploadPublicMediaDetailed).',
      v_bucket;
  END IF;

  v_gallery_path := NULLIF(trim(v_gallery.storage_path), '');
  v_gallery_url := NULLIF(trim(v_gallery.image_url), '');

  v_old_assignment_id := NULL;
  v_match_count := 0;
  FOR v_row IN
    SELECT eia.*
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = v_gallery.city_id
      AND eia.city_id = v_gallery.city_id
      AND eia.assignment_role = 'gallery'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND (
        (
          v_gallery_path IS NOT NULL
          AND NULLIF(trim(eia.source_storage_path), '') IS NOT NULL
          AND trim(eia.source_storage_path) = v_gallery_path
          AND NULLIF(trim(eia.source_storage_bucket), '') = 'public-media'
        )
        OR (
          v_gallery_path IS NULL
          AND v_gallery_url IS NOT NULL
          AND NULLIF(trim(eia.source_image_url), '') IS NOT NULL
          AND trim(eia.source_image_url) = v_gallery_url
        )
      )
    ORDER BY eia.id
    FOR UPDATE
  LOOP
    v_match_count := v_match_count + 1;
    IF v_match_count = 1 THEN
      v_old_assignment_id := v_row.id;
    END IF;
  END LOOP;

  IF v_match_count > 1 THEN
    RAISE EXCEPTION
      'Replace gallery Patrono ambigua: % assignment attivi corrispondono alla foto % (city_id=%).',
      v_match_count,
      p_gallery_photo_id,
      v_gallery.city_id;
  END IF;

  IF v_match_count = 0 THEN
    IF v_gallery_path IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'patron'
        AND eia.entity_id = v_gallery.city_id
        AND eia.city_id = v_gallery.city_id
        AND eia.assignment_role = 'gallery'
        AND eia.is_current = true
        AND eia.assignment_status = 'active'
        AND NULLIF(trim(eia.source_storage_path), '') = v_gallery_path
    ) THEN
      RAISE EXCEPTION
        'Replace gallery Patrono: assignment attivo con path coincidente ma bucket sorgente non canonico (public-media atteso) per foto % (city_id=%).',
        p_gallery_photo_id,
        v_gallery.city_id;
    END IF;

    IF v_gallery_path IS NULL
      AND v_gallery_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'patron'
          AND eia.entity_id = v_gallery.city_id
          AND eia.city_id = v_gallery.city_id
          AND eia.assignment_role = 'gallery'
          AND eia.is_current = true
          AND eia.assignment_status = 'active'
          AND NULLIF(trim(eia.source_image_url), '') = v_gallery_url
      )
    THEN
      RAISE EXCEPTION
        'Replace gallery Patrono: assignment attivo con URL coincidente ma storage_path non allineato (URL-only atteso) per foto % (city_id=%).',
        p_gallery_photo_id,
        v_gallery.city_id;
    END IF;

    RAISE EXCEPTION
      'Replace gallery Patrono: nessun assignment gallery attivo corrisponde alla foto % (city_id=%).',
      p_gallery_photo_id,
      v_gallery.city_id;
  END IF;

  IF v_old_assignment_id IS NOT NULL
    AND (
      (v_url IS DISTINCT FROM trim(v_gallery.image_url))
      OR (v_path IS DISTINCT FROM trim(COALESCE(v_gallery.storage_path, '')))
    )
  THEN
    PERFORM public.revoke_patron_gallery_image_assignment(v_old_assignment_id);
  END IF;

  UPDATE public.city_patron_gallery
  SET
    image_url = COALESCE(v_url, v_gallery.image_url),
    storage_path = v_path
  WHERE id = p_gallery_photo_id;

  IF v_path IS NOT NULL THEN
    v_bucket := COALESCE(v_bucket, 'public-media');
  ELSE
    v_bucket := NULL;
  END IF;

  v_new_assignment_id := public.upsert_patron_gallery_image_assignment_core(
    v_gallery.city_id,
    COALESCE(v_url, v_gallery.image_url),
    v_bucket,
    v_path,
    p_origin_type,
    true
  );

  RETURN v_new_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_patron_primary_image_assignment(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_patron_primary_image_assignment(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_patron_primary_image_assignment(text, text, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_patron_gallery_image_assignment(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_patron_gallery_image_assignment(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_patron_gallery_image_assignment(text, text, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.insert_city_patron_gallery_photo_with_assignment(
  text, uuid, text, text, integer, text, uuid, uuid, timestamptz, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_city_patron_gallery_photo_with_assignment(
  text, uuid, text, text, integer, text, uuid, uuid, timestamptz, text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_city_patron_gallery_photo_with_assignment(
  text, uuid, text, text, integer, text, uuid, uuid, timestamptz, text
) TO service_role;

REVOKE ALL ON FUNCTION public.revoke_patron_gallery_image_assignment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_patron_gallery_image_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_patron_gallery_image_assignment(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.replace_city_patron_gallery_photo_with_assignment(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_city_patron_gallery_photo_with_assignment(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_city_patron_gallery_photo_with_assignment(uuid, text, text, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.upsert_entity_primary_image_assignment(uuid, text, text, text, text, text) TO service_role;

-- upsert_entity_image_assignment_dual_write: DROP bloccata — caller runtime residui:
--   src/services/media/entityImageAssignmentWriteService.ts (RPC upsert_entity_image_assignment_dual_write)
--   import: src/services/photoService.ts
--   import: src/services/media/mediaAssetService.ts
--   import: src/services/wikimedia/commonsDownloadPipeline.ts
