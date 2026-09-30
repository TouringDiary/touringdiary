-- FASE 1 — Image Management consolidation: toggles Wikimedia, entity_type city, origin sponsor

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS wikimedia_public_enabled boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pois'
      AND column_name = 'wikimedia_public_enabled'
  ) THEN
    UPDATE public.pois
    SET wikimedia_public_enabled = false
    WHERE wikimedia_public_enabled IS NULL;
    ALTER TABLE public.pois
      ALTER COLUMN wikimedia_public_enabled SET DEFAULT false;
    ALTER TABLE public.pois
      ALTER COLUMN wikimedia_public_enabled SET NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.pois.wikimedia_public_enabled IS
  'FASE 1: Wikimedia può esistere in sistema (gallery) ma il read pubblico D-22 lo usa solo se true.';

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS wikimedia_hero_public_enabled boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cities'
      AND column_name = 'wikimedia_hero_public_enabled'
  ) THEN
    UPDATE public.cities
    SET wikimedia_hero_public_enabled = false
    WHERE wikimedia_hero_public_enabled IS NULL;
    ALTER TABLE public.cities
      ALTER COLUMN wikimedia_hero_public_enabled SET DEFAULT false;
    ALTER TABLE public.cities
      ALTER COLUMN wikimedia_hero_public_enabled SET NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.cities.wikimedia_hero_public_enabled IS
  'FASE 1: Hero Wikimedia (assignment entity_type=city gallery) visibile in cascata solo se true.';

-- Diagnosi: blocca il CHECK se esistono entity_type legacy (non cancellare dati).
DO $$
DECLARE
  v_off text;
BEGIN
  SELECT string_agg(DISTINCT eia.entity_type, ', ' ORDER BY eia.entity_type)
  INTO v_off
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type NOT IN (
    'city_person',
    'poi',
    'patron',
    'photo_submission',
    'city'
  );
  IF v_off IS NOT NULL THEN
    RAISE EXCEPTION
      'entity_image_assignments.entity_type fuori whitelist Fase 1: %. Eseguire diagnosi e bonifica dati prima del CHECK.',
      v_off;
  END IF;
END $$;

ALTER TABLE public.entity_image_assignments
  DROP CONSTRAINT IF EXISTS entity_image_assignments_entity_type_check;

ALTER TABLE public.entity_image_assignments
  ADD CONSTRAINT entity_image_assignments_entity_type_check CHECK (
    entity_type IN (
      'city_person',
      'poi',
      'patron',
      'photo_submission',
      'city'
    )
  );

CREATE OR REPLACE FUNCTION public.image_mgmt_phase1_validate_dual_write_request(
  p_entity_type text,
  p_assignment_role text,
  p_origin_type text,
  p_city_id text
)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_role text;
  v_origin_raw text;
BEGIN
  v_role := pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.btrim(p_assignment_role), ''), 'primary');

  IF p_entity_type NOT IN ('city_person', 'poi', 'patron', 'photo_submission', 'city') THEN
    RAISE EXCEPTION 'entity_type non valido: %', p_entity_type;
  END IF;

  IF p_entity_type = 'city' AND v_role <> 'gallery' THEN
    RAISE EXCEPTION 'City Hero Wikimedia: solo assignment_role gallery consentito (D-CONS-25).';
  END IF;

  v_origin_raw := pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(p_origin_type, '')));
  IF v_origin_raw = 'sponsor' THEN
    RAISE EXCEPTION
      'Dual-write: origin sponsor non consentito; usare la pipeline Sponsor canonica (D-22), non p_origin_type dichiarativo.';
  END IF;

  IF pg_catalog.char_length(pg_catalog.btrim(pg_catalog.coalesce(p_city_id, ''))) = 0 THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_canonical_media_origin_type(p_origin_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_raw text;
BEGIN
  v_raw := pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(p_origin_type, '')));

  IF v_raw = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non è origin dichiarabile; impostare su media_assets dalla pipeline di verifica D79-D82.';
  END IF;

  IF v_raw = '' OR v_raw = 'admin_upload' THEN
    RETURN 'admin';
  END IF;

  IF v_raw = 'ai_generated' THEN
    RETURN 'ai';
  END IF;

  IF v_raw NOT IN ('admin', 'ai', 'wikimedia', 'community', 'placeholder', 'sponsor') THEN
    RAISE EXCEPTION 'origin_type non valido: %', p_origin_type;
  END IF;

  RETURN v_raw;
END;
$$;

-- Estensione dual-write: entity_type city (entity_id = city_id) + origin sponsor
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

  v_role := pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.btrim(p_assignment_role), ''), 'primary');
  IF v_role NOT IN ('primary', 'gallery') THEN
    RAISE EXCEPTION 'assignment_role non valido: %', v_role;
  END IF;

  PERFORM public.image_mgmt_phase1_validate_dual_write_request(
    p_entity_type,
    v_role,
    p_origin_type,
    p_city_id
  );

  v_url := pg_catalog.nullif(pg_catalog.btrim(p_image_url), '');
  v_bucket := pg_catalog.nullif(pg_catalog.btrim(p_storage_bucket), '');
  v_path := pg_catalog.nullif(pg_catalog.btrim(p_storage_path), '');

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
      pg_catalog.nullif(pg_catalog.btrim(ps.image_url), ''),
      ps.status,
      CASE
        WHEN ps.status = 'approved' THEN pg_catalog.coalesce(ps.published_at, pg_catalog.now())
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
      WHEN pg_catalog.coalesce(p.status, 'published') = 'published' THEN pg_catalog.now()
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
      WHEN pg_catalog.coalesce(c.patron_editorial_status, 'published') = 'published' THEN pg_catalog.now()
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
      WHEN pg_catalog.coalesce(c.status, 'published') = 'published' THEN pg_catalog.now()
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
      pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.btrim(p_origin_type), ''), 'admin')
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
    AND eia.assignment_status = 'active'
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

    IF v_current.media_asset_id IS NOT NULL AND v_current.media_asset_id <> v_asset_id THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.entity_image_assignments eia
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
      'active',
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

-- Self-check contratti FASE 1 (statico, senza auth.uid()).
DO $$
BEGIN
  IF public.normalize_canonical_media_origin_type('sponsor') <> 'sponsor' THEN
    RAISE EXCEPTION 'FASE1 contract: sponsor origin normalizer';
  END IF;
  IF public.normalize_canonical_media_origin_type('admin_upload') <> 'admin' THEN
    RAISE EXCEPTION 'FASE1 contract: admin_upload → admin';
  END IF;
  BEGIN
    PERFORM public.normalize_canonical_media_origin_type('verified_real');
    RAISE EXCEPTION 'FASE1 contract: verified_real deve essere rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%verified_real%' THEN
        RAISE;
      END IF;
  END;

  BEGIN
    PERFORM public.image_mgmt_phase1_validate_dual_write_request(
      'city',
      'primary',
      'admin',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'FASE1 contract: city+primary doveva fallire';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%gallery%' THEN
        RAISE;
      END IF;
  END;

  PERFORM public.image_mgmt_phase1_validate_dual_write_request(
    'city',
    'gallery',
    'admin',
    '00000000-0000-0000-0000-000000000001'
  );

  BEGIN
    PERFORM public.image_mgmt_phase1_validate_dual_write_request(
      'poi',
      'primary',
      'sponsor',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'FASE1 contract: sponsor declarative doveva fallire';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%sponsor%' THEN
        RAISE;
      END IF;
  END;

  BEGIN
    PERFORM public.image_mgmt_phase1_validate_dual_write_request(
      'not_valid_type',
      'primary',
      'admin',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'FASE1 contract: entity_type invalid doveva fallire';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%entity_type%' THEN
        RAISE;
      END IF;
  END;

  BEGIN
    PERFORM public.image_mgmt_phase1_validate_dual_write_request(
      'poi',
      'primary',
      'admin',
      '   '
    );
    RAISE EXCEPTION 'FASE1 contract: city_id invalid doveva fallire';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%city_id%' THEN
        RAISE;
      END IF;
  END;
END $$;

COMMENT ON FUNCTION public.upsert_entity_image_assignment_dual_write IS
  'FASE1 dual-write MF4: city=gallery only; primary active→replaced; primary suspended/removed non sostituibili; stessa sorgente suspended/removed non rematerializzabile; origin sponsor solo pipeline Sponsor (non p_origin_type); verified_real non dichiarabile. Integration (auth admin): active primary replace; suspended/removed primary reject; same-source idempotency; history assignment_created/replaced.';

COMMENT ON FUNCTION public.image_mgmt_phase1_validate_dual_write_request IS
  'Validazione statica dual-write Fase 1 (entity_type, city gallery, sponsor declarative block, city_id text non vuoto). Self-check in migration; esistenza città/entità in RPC; lifecycle primary richiede integration test autenticato.';
