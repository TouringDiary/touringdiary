-- POST-MF5 — SoT assignment definitivo (city_person primary). Non invoca dual-write transitorio.

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
    AND eia.assignment_status = 'active'
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
    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = CASE
        WHEN v_current.assignment_status = 'active' THEN 'replaced'
        ELSE v_current.assignment_status
      END,
      updated_at = now()
    WHERE id = v_current.id;

    -- MF3 lifecycle: 'replaced' solo se nessun assignment attivo corrente referenzia l'asset
    -- (riuso multi-entity: altri assignment attivi → asset resta 'active').
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
      v_asset_id, 'city_person', p_entity_id::text, p_city_id,
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
        'city_person', p_entity_id::text, p_city_id,
        'active', 'replaced',
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

COMMENT ON FUNCTION public.upsert_entity_primary_image_assignment IS
  'POST-MF5 — media_assets + entity_image_assignments primary per city_person (SoT definitivo, no dual-write).';
