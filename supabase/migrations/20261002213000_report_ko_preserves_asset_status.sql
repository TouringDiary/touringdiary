-- KO immagine: l'assignment diventa restored (RIPRISTINATO), non lo snapshot.
-- Se un'altra segnalazione sullo stesso assignment è ancora aperta, resta suspended.
-- OK: assignment removed. Il media asset non cambia.
-- active e restored sono gli unici assignment leggibili in pubblico.

ALTER TABLE public.entity_image_assignments
  DROP CONSTRAINT IF EXISTS entity_image_assignments_assignment_status_check;

ALTER TABLE public.entity_image_assignments
  ADD CONSTRAINT entity_image_assignments_assignment_status_check
  CHECK (assignment_status IN ('active', 'suspended', 'removed', 'replaced', 'restored'));

DROP POLICY IF EXISTS entity_image_assignments_authenticated_read ON public.entity_image_assignments;
CREATE POLICY entity_image_assignments_authenticated_read ON public.entity_image_assignments
  FOR SELECT
  TO authenticated
  USING (assignment_status IN ('active', 'restored') AND is_current = true);

DROP POLICY IF EXISTS entity_image_assignments_anon_read ON public.entity_image_assignments;
CREATE POLICY entity_image_assignments_anon_read ON public.entity_image_assignments
  FOR SELECT
  TO anon
  USING (assignment_status IN ('active', 'restored') AND is_current = true);

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
  v_previous_assignment text;
  v_media_asset_id uuid;
  v_asset_status public.image_asset_status;
  v_open_reports int;
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
      SELECT eia.assignment_status, eia.media_asset_id, ma.asset_status
      INTO v_previous_assignment, v_media_asset_id, v_asset_status
      FROM public.entity_image_assignments eia
      LEFT JOIN public.media_assets ma ON ma.id = eia.media_asset_id
      WHERE eia.id = v_report.assignment_id
      FOR UPDATE OF eia;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment della segnalazione non trovato.';
      END IF;

      SELECT count(*) INTO v_open_reports
      FROM public.content_reports cr
      WHERE cr.assignment_id = v_report.assignment_id
        AND cr.report_kind = 'image_abuse'
        AND cr.status IN ('nuovo', 'in_verifica')
        AND cr.id <> p_report_id;

      IF v_open_reports > 0 THEN
        PERFORM public.append_entity_image_history(
          'assignment_status_changed',
          v_media_asset_id,
          v_report.assignment_id,
          v_report.entity_type,
          v_report.entity_id,
          v_report.city_id,
          v_previous_assignment,
          v_previous_assignment,
          v_asset_status,
          v_asset_status,
          NULL,
          NULL,
          'KO segnalazione immagine: resta SOSPESO perché un''altra segnalazione è aperta sullo stesso utilizzo.',
          false,
          jsonb_build_object(
            'report_id', p_report_id,
            'functional_status', 'suspended',
            'open_reports', v_open_reports,
            'asset_status_unchanged', true
          )
        );
      ELSE
        UPDATE public.entity_image_assignments
        SET assignment_status = 'restored', updated_at = now()
        WHERE id = v_report.assignment_id;

        PERFORM public.append_entity_image_history(
          'assignment_status_changed',
          v_media_asset_id,
          v_report.assignment_id,
          v_report.entity_type,
          v_report.entity_id,
          v_report.city_id,
          v_previous_assignment,
          'restored',
          v_asset_status,
          v_asset_status,
          NULL,
          NULL,
          'KO segnalazione immagine: utilizzo RIPRISTINATO. asset_status invariato.',
          false,
          jsonb_build_object(
            'report_id', p_report_id,
            'functional_status', 'restored',
            'asset_status_unchanged', true
          )
        );
      END IF;
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
      SELECT eia.assignment_status, eia.media_asset_id, ma.asset_status
      INTO v_previous_assignment, v_media_asset_id, v_asset_status
      FROM public.entity_image_assignments eia
      LEFT JOIN public.media_assets ma ON ma.id = eia.media_asset_id
      WHERE eia.id = v_report.assignment_id
      FOR UPDATE OF eia;

      UPDATE public.entity_image_assignments
      SET assignment_status = 'removed', removed_at = now(), updated_at = now()
      WHERE id = v_report.assignment_id;

      PERFORM public.append_entity_image_history(
        'assignment_status_changed',
        v_media_asset_id,
        v_report.assignment_id,
        v_report.entity_type,
        v_report.entity_id,
        v_report.city_id,
        v_previous_assignment,
        'removed',
        v_asset_status,
        v_asset_status,
        NULL,
        NULL,
        'OK segnalazione immagine: utilizzo RIMOSSO sull''assignment. asset_status invariato.',
        false,
        jsonb_build_object(
          'report_id', p_report_id,
          'functional_status', 'removed',
          'asset_status_unchanged', true
        )
      );
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
