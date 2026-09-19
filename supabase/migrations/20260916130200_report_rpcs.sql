-- MF2 — RPC segnalazioni centrali: submit atomico, transizioni, context, evidence metadata

-- ---------------------------------------------------------------------------
-- Helper: registra media_asset da URL/path legacy (dual-write §42.15)
-- Solo service_role — invocazione interna da create_content_report_group.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_media_asset_from_source(
  p_image_url text,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin_upload'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset_id uuid;
  v_bucket text;
  v_path text;
BEGIN
  v_bucket := COALESCE(NULLIF(trim(p_storage_bucket), ''), 'public-media');
  IF p_storage_path IS NOT NULL AND char_length(trim(p_storage_path)) > 0 THEN
    v_path := trim(p_storage_path);
  ELSIF p_image_url IS NOT NULL AND char_length(trim(p_image_url)) > 0 THEN
    v_path := trim(p_image_url);
    v_bucket := 'external';
  ELSE
    RAISE EXCEPTION 'Immagine sorgente assente per assignment legacy.';
  END IF;

  SELECT id INTO v_asset_id
  FROM public.media_assets
  WHERE storage_bucket = v_bucket AND storage_path = v_path
  LIMIT 1;

  IF v_asset_id IS NOT NULL THEN
    RETURN v_asset_id;
  END IF;

  INSERT INTO public.media_assets (storage_bucket, storage_path, origin_type)
  VALUES (v_bucket, v_path, COALESCE(NULLIF(trim(p_origin_type), ''), 'admin_upload'))
  RETURNING id INTO v_asset_id;

  RETURN v_asset_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_media_asset_from_source(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_media_asset_from_source(text, text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Helper: assignment corrente per entità (crea da legacy se assente — §42.15)
-- Solo service_role — fallback secondario rispetto a assignment_id canonico.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_current_image_assignment(
  p_entity_type text,
  p_entity_id text,
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_assignment_role text DEFAULT 'primary'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assignment_id uuid;
  v_asset_id uuid;
  v_url text;
  v_bucket text;
  v_path text;
BEGIN
  IF p_entity_type NOT IN ('city_person', 'poi', 'patron', 'photo_submission') THEN
    RAISE EXCEPTION 'entity_type assignment non valido: %', p_entity_type;
  END IF;

  SELECT id INTO v_assignment_id
  FROM public.entity_image_assignments
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND city_id = p_city_id
    AND assignment_role = p_assignment_role
    AND is_current = true
  LIMIT 1;

  IF v_assignment_id IS NOT NULL THEN
    RETURN v_assignment_id;
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    IF p_entity_type = 'city_person' THEN
      SELECT image_url, 'public-media', image_storage_path
      INTO v_url, v_bucket, v_path
      FROM public.city_people
      WHERE id = p_entity_id::uuid;
    ELSIF p_entity_type = 'poi' THEN
      SELECT image_url, 'public-media', NULL
      INTO v_url, v_bucket, v_path
      FROM public.pois
      WHERE id = p_entity_id;
    END IF;
  END IF;

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Nessuna immagine corrente per creare assignment legacy.';
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(v_url, v_bucket, v_path, 'admin_upload');

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
    published_at
  )
  VALUES (
    v_asset_id,
    p_entity_type,
    p_entity_id,
    p_city_id,
    p_assignment_role,
    'active',
    true,
    v_url,
    v_bucket,
    v_path,
    now()
  )
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_image_assignment(text, text, text, text, text, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_current_image_assignment(text, text, text, text, text, text, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- create_content_report_group — submit atomico + auto-SUSPEND (§34.4–§34.7)
-- Verifica email da auth.users (§42.12) — NON fidarsi di reporter_email_verified client.
-- entity_type canonico §42.2; source_context distingue LIVE/GALLERIA.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_content_report_group(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid := gen_random_uuid();
  v_city_id text;
  v_entity_type text;
  v_entity_id text;
  v_entity_name text;
  v_include_entity boolean;
  v_include_image boolean;
  v_reason text;
  v_notes text;
  v_reporter_id uuid;
  v_reporter_name text;
  v_reporter_email text;
  v_email_verified boolean;
  v_source_context text;
  v_image_url text;
  v_storage_bucket text;
  v_storage_path text;
  v_assignment_id uuid;
  v_entity_report_id uuid;
  v_image_report_id uuid;
  v_entity_status text;
  v_assignment_status text;
  v_auth_email text;
  v_auth_confirmed timestamptz;
  v_assign_row public.entity_image_assignments%ROWTYPE;
  v_media_bucket text;
  v_media_path text;
  v_legacy_entity_type text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  v_city_id := NULLIF(trim(p_payload->>'city_id'), '');
  v_entity_type := NULLIF(trim(p_payload->>'entity_type'), '');
  v_entity_id := NULLIF(trim(p_payload->>'entity_id'), '');
  v_entity_name := NULLIF(trim(p_payload->>'entity_name'), '');
  v_include_entity := COALESCE((p_payload->>'include_entity_abuse')::boolean, false);
  v_include_image := COALESCE((p_payload->>'include_image_abuse')::boolean, false);
  v_reason := COALESCE(NULLIF(trim(p_payload->>'reason'), ''), 'other');
  v_notes := COALESCE(NULLIF(trim(p_payload->>'user_notes'), ''), '');
  v_reporter_name := NULLIF(trim(p_payload->>'reporter_user_name'), '');
  v_source_context := NULLIF(trim(p_payload->>'source_context'), '');
  v_image_url := NULLIF(trim(p_payload->>'image_url'), '');
  v_storage_bucket := NULLIF(trim(p_payload->>'storage_bucket'), '');
  v_storage_path := NULLIF(trim(p_payload->>'storage_path'), '');
  v_assignment_id := NULLIF(trim(p_payload->>'assignment_id'), '')::uuid;

  IF v_city_id IS NULL OR v_entity_type IS NULL OR v_entity_id IS NULL THEN
    RAISE EXCEPTION 'Parametri entità obbligatori mancanti.';
  END IF;

  -- Normalizza input legacy consumer → entity_type canonico + source_context obbligatorio
  v_legacy_entity_type := v_entity_type;

  IF v_legacy_entity_type = 'community_live' THEN
    IF v_source_context IS NOT NULL AND v_source_context <> 'community_live' THEN
      RAISE EXCEPTION 'source_context incompatibile con entity_type community_live.';
    END IF;
    v_entity_type := 'photo_submission';
    v_source_context := 'community_live';
  ELSIF v_legacy_entity_type = 'city_gallery' THEN
    IF v_source_context IS NOT NULL AND v_source_context <> 'city_gallery' THEN
      RAISE EXCEPTION 'source_context incompatibile con entity_type city_gallery.';
    END IF;
    v_entity_type := 'photo_submission';
    v_source_context := 'city_gallery';
  ELSIF v_legacy_entity_type = 'community' THEN
    -- Convenzione progetto: community generico → community_live, salvo source_context community valido
    IF v_source_context IS NOT NULL AND v_source_context NOT IN ('community_live', 'city_gallery') THEN
      RAISE EXCEPTION 'source_context incompatibile con entity_type community.';
    END IF;
    IF v_source_context IS NULL THEN
      v_source_context := 'community_live';
    END IF;
    v_entity_type := 'photo_submission';
  END IF;

  IF v_entity_type NOT IN ('city_person', 'poi', 'patron', 'photo_submission') THEN
    RAISE EXCEPTION 'entity_type non valido.';
  END IF;

  -- source_context coerente con entity_type (MF2 provenienza)
  IF v_entity_type = 'photo_submission' THEN
    IF v_source_context IS NULL THEN
      RAISE EXCEPTION 'source_context obbligatorio per photo_submission.';
    END IF;
    IF v_source_context NOT IN ('community_live', 'city_gallery') THEN
      RAISE EXCEPTION 'source_context non valido per photo_submission: %', v_source_context;
    END IF;
  ELSIF v_entity_type = 'city_person' THEN
    IF v_source_context IS NOT NULL AND v_source_context <> 'official_photo' THEN
      RAISE EXCEPTION 'source_context non valido per city_person: %', v_source_context;
    END IF;
  ELSIF v_entity_type = 'patron' THEN
    IF v_source_context IS NOT NULL AND v_source_context <> 'patron_gallery' THEN
      RAISE EXCEPTION 'source_context non valido per patron: %', v_source_context;
    END IF;
  ELSIF v_entity_type = 'poi' THEN
    IF v_source_context IS NOT NULL AND v_source_context <> 'poi' THEN
      RAISE EXCEPTION 'source_context non valido per poi: %', v_source_context;
    END IF;
  END IF;

  IF v_reason NOT IN ('copyright', 'other_rights', 'unauthorized', 'other', 'error', 'suggestion') THEN
    RAISE EXCEPTION 'reason non valido.';
  END IF;
  IF char_length(v_notes) = 0 THEN
    RAISE EXCEPTION 'Note obbligatorie.';
  END IF;
  IF NOT v_include_entity AND NOT v_include_image THEN
    RAISE EXCEPTION 'Selezionare almeno una tipologia di segnalazione.';
  END IF;

  SELECT email, email_confirmed_at INTO v_auth_email, v_auth_confirmed
  FROM auth.users
  WHERE id = v_uid;

  IF v_auth_confirmed IS NULL THEN
    RAISE EXCEPTION 'Email non verificata. Completa la verifica OTP prima di inviare.';
  END IF;

  v_reporter_id := v_uid;
  v_reporter_email := v_auth_email;
  v_email_verified := true;

  -- Validazione esistenza entità (tipi ID dual-family)
  IF v_entity_type = 'city_person' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.city_people
      WHERE id = v_entity_id::uuid AND city_id = v_city_id
    ) THEN
      RAISE EXCEPTION 'Personaggio non trovato per city_id/entity_id.';
    END IF;
  ELSIF v_entity_type = 'poi' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pois
      WHERE id = v_entity_id AND city_id = v_city_id
    ) THEN
      RAISE EXCEPTION 'POI non trovato.';
    END IF;
  ELSIF v_entity_type = 'patron' THEN
    IF v_entity_id IS DISTINCT FROM v_city_id THEN
      RAISE EXCEPTION 'Patrono: entity_id deve coincidere con city_id (D72).';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_id) THEN
      RAISE EXCEPTION 'Città Patrono non trovata.';
    END IF;
  ELSIF v_entity_type = 'photo_submission' THEN
    IF NOT EXISTS (SELECT 1 FROM public.photo_submissions WHERE id = v_entity_id::uuid) THEN
      RAISE EXCEPTION 'Foto Community non trovata.';
    END IF;
  END IF;

  IF v_include_image THEN
    IF v_assignment_id IS NOT NULL THEN
      -- Target canonico: assignment_id
      SELECT * INTO v_assign_row
      FROM public.entity_image_assignments
      WHERE id = v_assignment_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment non trovato.';
      END IF;

      IF v_assign_row.media_asset_id IS NULL THEN
        RAISE EXCEPTION 'Assignment privo di media_asset_id.';
      END IF;

      SELECT ma.storage_bucket, ma.storage_path
      INTO v_media_bucket, v_media_path
      FROM public.media_assets ma
      WHERE ma.id = v_assign_row.media_asset_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'media_asset dell''assignment non trovato.';
      END IF;

      IF v_assign_row.entity_type NOT IN ('city_person', 'poi', 'patron', 'photo_submission') THEN
        RAISE EXCEPTION 'Assignment entity_type non valido.';
      END IF;

      IF v_assign_row.city_id IS DISTINCT FROM v_city_id THEN
        RAISE EXCEPTION 'Assignment non coerente con city_id.';
      END IF;

      IF v_entity_type = 'photo_submission' THEN
        IF v_assign_row.entity_type <> 'photo_submission'
          OR v_assign_row.entity_id IS DISTINCT FROM v_entity_id THEN
          RAISE EXCEPTION 'Assignment non coerente con la foto segnalata.';
        END IF;
      ELSIF v_assign_row.entity_type IS DISTINCT FROM v_entity_type
        OR v_assign_row.entity_id IS DISTINCT FROM v_entity_id THEN
        RAISE EXCEPTION 'Assignment non coerente con entità segnalata.';
      END IF;

      -- Snapshot da assignment/media_asset (non richiede URL client)
      v_image_url := COALESCE(v_image_url, v_assign_row.source_image_url);
      v_storage_bucket := COALESCE(v_storage_bucket, v_assign_row.source_storage_bucket, v_media_bucket);
      v_storage_path := COALESCE(v_storage_path, v_assign_row.source_storage_path, v_media_path);
    ELSE
      -- Fallback legacy §42.15 — solo se assignment_id assente
      IF v_image_url IS NULL AND v_storage_path IS NULL THEN
        RAISE EXCEPTION 'Immagine obbligatoria per segnalazione foto (assignment_id o sorgente legacy).';
      END IF;

      IF v_entity_type = 'photo_submission' THEN
        v_assignment_id := public.ensure_current_image_assignment(
          'photo_submission',
          v_entity_id,
          v_city_id,
          v_image_url,
          v_storage_bucket,
          v_storage_path,
          'primary'
        );
      ELSIF v_entity_type = 'patron' THEN
        v_assignment_id := public.ensure_current_image_assignment(
          'patron',
          v_city_id,
          v_city_id,
          v_image_url,
          v_storage_bucket,
          v_storage_path,
          COALESCE(NULLIF(trim(p_payload->>'assignment_role'), ''), 'gallery')
        );
      ELSE
        v_assignment_id := public.ensure_current_image_assignment(
          v_entity_type,
          v_entity_id,
          v_city_id,
          v_image_url,
          v_storage_bucket,
          v_storage_path,
          'primary'
        );
      END IF;
    END IF;

    SELECT assignment_status INTO v_assignment_status
    FROM public.entity_image_assignments
    WHERE id = v_assignment_id
    FOR UPDATE;

    UPDATE public.entity_image_assignments
    SET assignment_status = 'suspended', updated_at = now()
    WHERE id = v_assignment_id;
  END IF;

  IF v_include_entity THEN
    IF v_entity_type = 'city_person' THEN
      SELECT status INTO v_entity_status FROM public.city_people WHERE id = v_entity_id::uuid FOR UPDATE;
      UPDATE public.city_people SET status = 'suspended' WHERE id = v_entity_id::uuid;
    ELSIF v_entity_type = 'patron' THEN
      SELECT patron_editorial_status INTO v_entity_status FROM public.cities WHERE id = v_city_id FOR UPDATE;
      UPDATE public.cities SET patron_editorial_status = 'suspended', updated_at = now() WHERE id = v_city_id;
    ELSIF v_entity_type = 'poi' THEN
      SELECT status INTO v_entity_status FROM public.pois WHERE id = v_entity_id FOR UPDATE;
      UPDATE public.pois SET status = 'suspended', updated_at = now() WHERE id = v_entity_id;
    ELSIF v_entity_type = 'photo_submission' THEN
      RAISE EXCEPTION 'Segnalazione entità non applicabile a foto Community.';
    END IF;
  END IF;

  IF v_include_entity THEN
    INSERT INTO public.content_reports (
      report_group_id, report_kind, entity_type, entity_id, city_id,
      status, reason, user_notes,
      reporter_user_id, reporter_user_name, reporter_email, reporter_email_verified,
      source_context, snapshot_entity_name, snapshot_entity_status,
      snapshot_image_url, snapshot_storage_bucket, snapshot_storage_path
    )
    VALUES (
      v_group_id, 'entity_abuse', v_entity_type, v_entity_id, v_city_id,
      'nuovo', v_reason, v_notes,
      v_reporter_id, v_reporter_name, v_reporter_email, v_email_verified,
      v_source_context, v_entity_name, v_entity_status,
      v_image_url, v_storage_bucket, v_storage_path
    )
    RETURNING id INTO v_entity_report_id;
  END IF;

  IF v_include_image THEN
    INSERT INTO public.content_reports (
      report_group_id, parent_report_id, report_kind, entity_type, entity_id, city_id,
      assignment_id, status, reason, user_notes,
      reporter_user_id, reporter_user_name, reporter_email, reporter_email_verified,
      source_context, snapshot_entity_name, snapshot_assignment_status,
      snapshot_image_url, snapshot_storage_bucket, snapshot_storage_path
    )
    VALUES (
      v_group_id,
      v_entity_report_id,
      'image_abuse',
      v_entity_type,
      v_entity_id,
      v_city_id,
      v_assignment_id,
      'nuovo',
      v_reason,
      v_notes,
      v_reporter_id,
      v_reporter_name,
      v_reporter_email,
      v_email_verified,
      v_source_context,
      v_entity_name,
      v_assignment_status,
      v_image_url,
      v_storage_bucket,
      v_storage_path
    )
    RETURNING id INTO v_image_report_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'report_group_id', v_group_id,
    'entity_report_id', v_entity_report_id,
    'image_report_id', v_image_report_id,
    'assignment_id', v_assignment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_content_report_group(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_content_report_group(jsonb) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- transition_report_status — NUOVO → IN VERIFICA → OK/KO (§31.8, §35.1)
-- KO: ripristino ESATTO dallo snapshot — nessun fallback inventato.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_report_status(
  p_report_id uuid,
  p_target_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_report public.content_reports%ROWTYPE;
  v_rows int;
  v_notes text;
  v_restore_entity text;
  v_restore_assignment text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;
  IF NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;
  IF p_target_status NOT IN ('in_verifica', 'ok', 'ko') THEN
    RAISE EXCEPTION 'Stato target non valido.';
  END IF;

  SELECT * INTO v_report FROM public.content_reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione non trovata.';
  END IF;

  IF p_target_status = 'in_verifica' AND v_report.status <> 'nuovo' THEN
    RAISE EXCEPTION 'Solo segnalazioni NUOVO possono passare a IN VERIFICA.';
  END IF;
  IF p_target_status IN ('ok', 'ko') AND v_report.status <> 'in_verifica' THEN
    RAISE EXCEPTION 'Solo segnalazioni IN VERIFICA possono essere chiuse.';
  END IF;

  v_notes := CASE
    WHEN p_admin_notes IS NULL THEN v_report.admin_notes
    ELSE NULLIF(trim(p_admin_notes), '')
  END;

  IF p_target_status = 'ko' THEN
    IF v_report.report_kind = 'image_abuse' AND v_report.assignment_id IS NOT NULL THEN
      IF v_report.snapshot_assignment_status IS NULL THEN
        RAISE EXCEPTION 'snapshot_assignment_status mancante — impossibile ripristinare assignment.';
      END IF;
      v_restore_assignment := v_report.snapshot_assignment_status;
      IF v_restore_assignment NOT IN ('active', 'suspended', 'removed', 'replaced') THEN
        RAISE EXCEPTION 'snapshot_assignment_status non valido: %', v_restore_assignment;
      END IF;
      UPDATE public.entity_image_assignments
      SET assignment_status = v_restore_assignment, updated_at = now()
      WHERE id = v_report.assignment_id;
    ELSIF v_report.report_kind = 'entity_abuse' THEN
      IF v_report.snapshot_entity_status IS NULL THEN
        RAISE EXCEPTION 'snapshot_entity_status mancante — impossibile ripristinare entità.';
      END IF;
      v_restore_entity := v_report.snapshot_entity_status;
      IF v_report.entity_type = 'city_person' THEN
        IF v_restore_entity NOT IN ('draft', 'published', 'suspended', 'canceled') THEN
          RAISE EXCEPTION 'snapshot_entity_status non valido per city_person: %', v_restore_entity;
        END IF;
        UPDATE public.city_people SET status = v_restore_entity
        WHERE id = v_report.entity_id::uuid;
      ELSIF v_report.entity_type = 'patron' THEN
        IF v_restore_entity NOT IN ('draft', 'published', 'suspended', 'canceled') THEN
          RAISE EXCEPTION 'snapshot_entity_status non valido per patron: %', v_restore_entity;
        END IF;
        UPDATE public.cities SET patron_editorial_status = v_restore_entity, updated_at = now()
        WHERE id = v_report.city_id;
      ELSIF v_report.entity_type = 'poi' THEN
        IF v_restore_entity NOT IN ('draft', 'published', 'suspended', 'canceled', 'needs_check') THEN
          RAISE EXCEPTION 'snapshot_entity_status non valido per poi: %', v_restore_entity;
        END IF;
        UPDATE public.pois SET status = v_restore_entity, updated_at = now()
        WHERE id = v_report.entity_id;
      END IF;
    END IF;
  ELSIF p_target_status = 'ok' THEN
    IF v_report.report_kind = 'image_abuse' AND v_report.assignment_id IS NOT NULL THEN
      UPDATE public.entity_image_assignments
      SET assignment_status = 'removed', removed_at = now(), updated_at = now()
      WHERE id = v_report.assignment_id;
    ELSIF v_report.report_kind = 'entity_abuse' THEN
      IF v_report.entity_type = 'city_person' THEN
        UPDATE public.city_people SET status = 'canceled'
        WHERE id = v_report.entity_id::uuid;
      ELSIF v_report.entity_type = 'patron' THEN
        UPDATE public.cities SET patron_editorial_status = 'canceled', updated_at = now()
        WHERE id = v_report.city_id;
      ELSIF v_report.entity_type = 'poi' THEN
        UPDATE public.pois SET status = 'canceled', updated_at = now()
        WHERE id = v_report.entity_id;
      END IF;
    END IF;
  END IF;

  UPDATE public.content_reports
  SET status = p_target_status, admin_notes = v_notes, updated_at = now()
  WHERE id = p_report_id AND status = v_report.status;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Conflitto di transizione: stato cambiato da un altro operatore.';
  END IF;

  RETURN jsonb_build_object('ok', true, 'report_id', p_report_id, 'status', p_target_status);
END;
$$;

REVOKE ALL ON FUNCTION public.transition_report_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_report_status(uuid, text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_report_admin_context — alert altri utilizzi (D61)
-- other_person_cities: identità cross-city non presente nello schema (Q7/Q8) — array vuoto.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_report_admin_context(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_report public.content_reports%ROWTYPE;
  v_media_id uuid;
  v_reported_assignment jsonb;
  v_other_assignments jsonb;
BEGIN
  IF v_uid IS NULL OR NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  SELECT * INTO v_report FROM public.content_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione non trovata.';
  END IF;

  IF v_report.assignment_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'assignment_id', a.id,
      'media_asset_id', a.media_asset_id,
      'entity_type', a.entity_type,
      'entity_id', a.entity_id,
      'city_id', a.city_id,
      'city_name', c.name,
      'entity_name', CASE a.entity_type
        WHEN 'city_person' THEN cp.name
        WHEN 'poi' THEN p.name
        WHEN 'patron' THEN COALESCE(c.patron_details->>'name', c.name)
        WHEN 'photo_submission' THEN ps.location_name
        ELSE NULL
      END,
      'assignment_status', a.assignment_status,
      'is_current', a.is_current,
      'source_storage_bucket', COALESCE(a.source_storage_bucket, ma.storage_bucket),
      'source_storage_path', COALESCE(a.source_storage_path, ma.storage_path)
    )
    INTO v_reported_assignment
    FROM public.entity_image_assignments a
    JOIN public.cities c ON c.id = a.city_id
    JOIN public.media_assets ma ON ma.id = a.media_asset_id
    LEFT JOIN public.city_people cp
      ON a.entity_type = 'city_person' AND cp.id = a.entity_id::uuid
    LEFT JOIN public.pois p
      ON a.entity_type = 'poi' AND p.id = a.entity_id
    LEFT JOIN public.photo_submissions ps
      ON a.entity_type = 'photo_submission' AND ps.id = a.entity_id::uuid
    WHERE a.id = v_report.assignment_id;

    SELECT media_asset_id INTO v_media_id
    FROM public.entity_image_assignments
    WHERE id = v_report.assignment_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'assignment_id', a.id,
      'media_asset_id', a.media_asset_id,
      'entity_type', a.entity_type,
      'entity_id', a.entity_id,
      'city_id', a.city_id,
      'city_name', c.name,
      'entity_name', CASE a.entity_type
        WHEN 'city_person' THEN cp.name
        WHEN 'poi' THEN p.name
        WHEN 'patron' THEN COALESCE(c.patron_details->>'name', c.name)
        WHEN 'photo_submission' THEN ps.location_name
        ELSE NULL
      END,
      'assignment_status', a.assignment_status,
      'is_current', a.is_current,
      'source_storage_bucket', COALESCE(a.source_storage_bucket, ma.storage_bucket),
      'source_storage_path', COALESCE(a.source_storage_path, ma.storage_path)
    )), '[]'::jsonb)
    INTO v_other_assignments
    FROM public.entity_image_assignments a
    JOIN public.cities c ON c.id = a.city_id
    JOIN public.media_assets ma ON ma.id = a.media_asset_id
    LEFT JOIN public.city_people cp
      ON a.entity_type = 'city_person' AND cp.id = a.entity_id::uuid
    LEFT JOIN public.pois p
      ON a.entity_type = 'poi' AND p.id = a.entity_id
    LEFT JOIN public.photo_submissions ps
      ON a.entity_type = 'photo_submission' AND ps.id = a.entity_id::uuid
    WHERE a.media_asset_id = v_media_id
      AND a.id IS DISTINCT FROM v_report.assignment_id;
  ELSE
    v_reported_assignment := NULL;
    v_other_assignments := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'report', to_jsonb(v_report),
    'reported_assignment', v_reported_assignment,
    'other_assignments', v_other_assignments,
    -- Identità cross-city personaggio: non definita nello schema (Master Plan Q7/Q8).
    'other_person_cities', '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_report_admin_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_report_admin_context(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- capture_report_evidence — registra metadati post-upload service route (§42.5, D70)
--
-- Contratto con /api/reports/capture-evidence (reports.routes.ts):
--   1. Route autentica il reporter, risolve bytes dallo snapshot del report (non dal client).
--   2. Route calcola SHA-256 sui bytes e carica in bucket report-evidence (upsert: false).
--   3. Route invoca questa RPC via service_role passando bucket/path/hash server-side.
--
-- Questa RPC NON verifica l'hash contro i bytes (non disponibile in SQL).
-- Accetta p_content_hash solo da service_role dopo verifica oggetto in storage.objects
-- e path vincolato al report — impedisce hash/path arbitrari da client autenticato.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_report_evidence(
  p_report_id uuid,
  p_storage_bucket text,
  p_storage_path text,
  p_content_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_report public.content_reports%ROWTYPE;
  v_rows int;
  v_expected_prefix text;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'capture_report_evidence richiede service_role.';
  END IF;

  SELECT * INTO v_report FROM public.content_reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segnalazione non trovata per evidence.';
  END IF;

  IF v_report.report_kind IS DISTINCT FROM 'image_abuse' THEN
    RAISE EXCEPTION 'Evidenza applicabile solo a segnalazioni image_abuse.';
  END IF;

  IF v_report.evidence_storage_path IS NOT NULL THEN
    IF v_report.evidence_content_hash = p_content_hash THEN
      RETURN jsonb_build_object('ok', true, 'report_id', p_report_id, 'idempotent', true);
    END IF;
    RAISE EXCEPTION 'Evidenza già registrata — immutabile.';
  END IF;

  IF p_storage_bucket IS DISTINCT FROM 'report-evidence' THEN
    RAISE EXCEPTION 'Bucket evidence non valido.';
  END IF;

  IF p_storage_path IS NULL OR char_length(trim(p_storage_path)) = 0 THEN
    RAISE EXCEPTION 'Path evidence obbligatorio.';
  END IF;

  IF p_content_hash IS NULL
    OR trim(p_content_hash) !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Hash SHA-256 evidence non valido (atteso 64 hex lowercase).';
  END IF;

  v_expected_prefix := v_report.entity_type || '/' || v_report.entity_id || '/' || p_report_id::text || '.';
  IF NOT starts_with(p_storage_path, v_expected_prefix)
    OR char_length(p_storage_path) <= char_length(v_expected_prefix) THEN
    RAISE EXCEPTION 'Path evidence non coerente con il report segnalato.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects o
    WHERE o.bucket_id = 'report-evidence'
      AND o.name = p_storage_path
  ) THEN
    RAISE EXCEPTION 'Oggetto evidence assente in storage — upload non completato.';
  END IF;

  UPDATE public.content_reports
  SET
    evidence_storage_bucket = p_storage_bucket,
    evidence_storage_path = p_storage_path,
    evidence_content_hash = p_content_hash,
    evidence_captured_at = now(),
    updated_at = now()
  WHERE id = p_report_id
    AND evidence_storage_path IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Conflitto evidence: già registrata da altro processo.';
  END IF;

  RETURN jsonb_build_object('ok', true, 'report_id', p_report_id);
END;
$$;

REVOKE ALL ON FUNCTION public.capture_report_evidence(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_report_evidence(uuid, text, text, text) TO service_role;
