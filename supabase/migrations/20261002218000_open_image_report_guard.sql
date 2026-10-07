-- Una sola segnalazione image_abuse aperta per assignment.
-- Il controllo è dopo FOR UPDATE. L'indice chiude la corsa tra due insert.

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_one_open_image_abuse_idx
  ON public.content_reports (assignment_id)
  WHERE report_kind = 'image_abuse'
    AND assignment_id IS NOT NULL
    AND status IN ('nuovo', 'in_verifica');

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
  v_city_person public.city_people%ROWTYPE;
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

  IF v_entity_type = 'city_person' THEN
    SELECT * INTO v_city_person
    FROM public.city_people
    WHERE id = v_entity_id::uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Personaggio non trovato per city_id/entity_id.';
    END IF;

    IF v_city_person.city_id IS DISTINCT FROM v_city_id THEN
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
    IF NOT EXISTS (
      SELECT 1
      FROM public.photo_submissions ps
      WHERE ps.id = v_entity_id::uuid
        AND ps.city_id = v_city_id
    ) THEN
      RAISE EXCEPTION 'Foto Community non trovata o city_id non coerente.';
    END IF;
  END IF;

  IF v_include_image THEN
    IF v_assignment_id IS NULL THEN
      RAISE EXCEPTION
        'Segnalazione image_abuse POST-MF5: assignment_id obbligatorio (entity_type=%).',
        v_entity_type;
    END IF;

    SELECT * INTO v_assign_row
    FROM public.entity_image_assignments
    WHERE id = v_assignment_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assignment non trovato.';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.content_reports cr
      WHERE cr.assignment_id = v_assignment_id
        AND cr.report_kind = 'image_abuse'
        AND cr.status IN ('nuovo', 'in_verifica')
    ) THEN
      RAISE EXCEPTION 'Questa immagine è già stata segnalata.';
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
      IF v_assign_row.assignment_role <> 'primary' THEN
        RAISE EXCEPTION 'Segnalazione photo_submission: assignment deve essere primary.';
      END IF;
    ELSIF v_entity_type = 'patron' THEN
      IF v_assign_row.entity_type <> 'patron'
        OR v_assign_row.entity_id IS DISTINCT FROM v_city_id
        OR v_assign_row.entity_id IS DISTINCT FROM v_entity_id THEN
        RAISE EXCEPTION 'Assignment Patrono non coerente con entità segnalata.';
      END IF;
      IF v_assign_row.assignment_role <> 'gallery' THEN
        RAISE EXCEPTION
          'Segnalazione Patrono image_abuse: assignment deve essere gallery (source_context patron_gallery).';
      END IF;
    ELSIF v_assign_row.entity_type IS DISTINCT FROM v_entity_type
      OR v_assign_row.entity_id IS DISTINCT FROM v_entity_id THEN
      RAISE EXCEPTION 'Assignment non coerente con entità segnalata.';
    END IF;

    IF v_entity_type = 'city_person' AND v_assign_row.assignment_role <> 'primary' THEN
      RAISE EXCEPTION 'Segnalazione city_person: assignment deve essere primary.';
    END IF;

    IF v_entity_type = 'poi' AND v_assign_row.assignment_role <> 'primary' THEN
      RAISE EXCEPTION 'Segnalazione POI: assignment deve essere primary.';
    END IF;

    IF NOT v_assign_row.is_current THEN
      RAISE EXCEPTION
        'Assignment non corrente; segnalazione image_abuse non consentita (POST-MF5).';
    END IF;

    IF v_assign_row.assignment_status NOT IN ('active', 'restored') THEN
      RAISE EXCEPTION
        'Assignment non visibile; segnalazione image_abuse non consentita.';
    END IF;

    v_image_url := v_assign_row.source_image_url;
    v_storage_bucket := COALESCE(v_assign_row.source_storage_bucket, v_media_bucket);
    v_storage_path := COALESCE(v_assign_row.source_storage_path, v_media_path);

    v_assignment_status := v_assign_row.assignment_status;

    UPDATE public.entity_image_assignments
    SET assignment_status = 'suspended', updated_at = now()
    WHERE id = v_assignment_id;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_status_changed',
      v_assign_row.media_asset_id,
      v_assignment_id,
      v_assign_row.entity_type,
      v_assign_row.entity_id,
      v_assign_row.city_id,
      v_assignment_status,
      'suspended',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      jsonb_build_object(
        'assignment_role', v_assign_row.assignment_role,
        'source', 'create_content_report_group',
        'reason', v_reason,
        'report_kind', 'image_abuse'
      )
    );
  END IF;

  IF v_include_entity THEN
    IF v_entity_type = 'city_person' THEN
      v_entity_status := v_city_person.status;
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

COMMENT ON FUNCTION public.delete_city_person_with_image_cleanup IS
  'POST-MF5 D90 — revoca assignment correnti active/suspended + history + DELETE city_person; non DELETE media_assets condivisi. '
  'Serializzazione: city_people FOR UPDATE; advisory city_person_moderation; content_reports aperti FOR UPDATE (una sola volta, prima degli assignment); entity_image_assignments is_current=true. '
  'create_content_report_group (rigenerata in questo file): city_person FOR UPDATE anticipato; nessun secondo lock content_reports dopo assignment nel DELETE (evita deadlock con transition_report_status). '
  'transition_report_status: content_reports poi assignment — DELETE non riacquisisce content_reports dopo assignment. '
  'famous_person_photo_reports.person_id FK ON DELETE RESTRICT (20260827140000).';
