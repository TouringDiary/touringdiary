-- =============================================================================
-- NOT A MIGRATION — non includere in supabase db push / apply migration automatico.
--
-- Integration harness: public.upsert_entity_image_assignment_dual_write (Fase 1)
--
-- Prerequisiti:
--   - Migration 20260928100000_image_management_phase1_foundation.sql applicata
--   - Connessione diretta Postgres (SUPABASE_DB_URL / DATABASE_URL), ruolo con DDL su sessione
--   - Utente ADMIN_UID presente in auth.users e profiles.role IN ('admin_all','admin_limited')
--   - CITY_ID esistente in public.cities (text, es. city_torre-annunziata)
--
-- ensure_media_asset_from_source: materializza solo metadati in public.media_assets (bucket/path);
-- NON verifica l'esistenza fisica del file in Supabase Storage.
--
-- Auth: psql imposta request.jwt.claim.sub (auth.uid() in Supabase). Diverso da F1-5 (client service_role),
-- ma coerente con il requisito «sessione authenticated td_admin» del dual-write RPC.
--
-- Esecuzione (confirm esplicito, come F1_5_CONFIRM in scripts/f1_verify_save_person_minimal.ts):
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 ^
--     -c "SELECT set_config('image_mgmt_phase1.confirm','1',false)" ^
--     -c "SELECT set_config('image_mgmt_phase1.admin_uid','<UUID_TD_ADMIN>',false)" ^
--     -c "SELECT set_config('image_mgmt_phase1.city_id','<CITY_ID_TEXT>',false)" ^
--     -f supabase/tests/image_mgmt_phase1_dual_write_integration.sql
--
-- Tutte le fixture vivono in una transazione con ROLLBACK finale: nessun dato persistente.
-- POI id e storage path prefix sono univoci per run (txid_current()) — nessuna collisione tra esecuzioni.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE img_mgmt_p1_results (
  case_num int NOT NULL,
  case_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('PASS', 'FAIL', 'SKIP')),
  detail text NOT NULL DEFAULT ''
) ON COMMIT DROP;

CREATE OR REPLACE FUNCTION pg_temp.img_mgmt_p1_record(
  p_case int,
  p_name text,
  p_pass boolean,
  p_detail text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO img_mgmt_p1_results (case_num, case_name, status, detail)
  VALUES (
    p_case,
    p_name,
    CASE WHEN p_pass THEN 'PASS' ELSE 'FAIL' END,
    COALESCE(p_detail, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.img_mgmt_p1_set_auth(p_admin_uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_admin_uid::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    format('{"sub":"%s","role":"authenticated","aal":"aal1"}', p_admin_uid),
    true
  );
END;
$$;

DO $$
DECLARE
  v_confirm text;
  v_admin_uid_text text;
  v_city_id text;
  v_admin_uid uuid;
  v_run_suffix text;
  v_test_poi_id text;
  v_base_path text;
  v_id uuid;
  v_id2 uuid;
  v_old_id uuid;
  v_cnt int;
  v_hist_replaced int;
  v_hist_created int;
  v_photo_id uuid;
  v_replaced_by uuid;
  v_is_current boolean;
  v_status text;
  v_err text;
  v_old_asset_id uuid;
  v_asset_status public.image_asset_status;
  v_c7a_pass boolean := false;
  v_c7b_pass boolean := false;
BEGIN
  v_confirm := current_setting('image_mgmt_phase1.confirm', true);
  v_admin_uid_text := current_setting('image_mgmt_phase1.admin_uid', true);
  v_city_id := current_setting('image_mgmt_phase1.city_id', true);

  IF v_confirm IS DISTINCT FROM '1' THEN
    INSERT INTO img_mgmt_p1_results (case_num, case_name, status, detail)
    VALUES (
      0,
      'guard_confirm',
      'SKIP',
      'Impostare image_mgmt_phase1.confirm=1 (vedi header file). Nessun test eseguito.'
    );
    RETURN;
  END IF;

  IF v_admin_uid_text IS NULL OR btrim(v_admin_uid_text) = '' THEN
    PERFORM pg_temp.img_mgmt_p1_record(0, 'guard_admin_uid', false, 'image_mgmt_phase1.admin_uid mancante.');
    RETURN;
  END IF;

  IF v_city_id IS NULL OR btrim(v_city_id) = '' THEN
    PERFORM pg_temp.img_mgmt_p1_record(0, 'guard_city_id', false, 'image_mgmt_phase1.city_id mancante.');
    RETURN;
  END IF;

  BEGIN
    v_admin_uid := v_admin_uid_text::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      PERFORM pg_temp.img_mgmt_p1_record(
        0,
        'guard_admin_uid_uuid',
        false,
        format('image_mgmt_phase1.admin_uid non è un UUID valido: %s', v_admin_uid_text)
      );
      RETURN;
  END;

  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_admin_uid) THEN
    PERFORM pg_temp.img_mgmt_p1_record(
      0,
      'guard_auth_user',
      false,
      format('UUID %s assente in auth.users (FK photo_submissions.user_id).', v_admin_uid)
    );
    RETURN;
  END IF;

  IF NOT public.is_td_admin(v_admin_uid) THEN
    PERFORM pg_temp.img_mgmt_p1_record(
      0,
      'guard_td_admin',
      false,
      format('UUID %s non è td_admin (profiles.role admin_all/admin_limited).', v_admin_uid)
    );
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cities c WHERE c.id = v_city_id) THEN
    PERFORM pg_temp.img_mgmt_p1_record(
      0,
      'guard_city_exists',
      false,
      format('city_id inesistente: %s', v_city_id)
    );
    RETURN;
  END IF;

  v_run_suffix := pg_catalog.txid_current()::text;
  v_test_poi_id := 'img_mgmt_p1_integration_poi_' || v_run_suffix;
  v_base_path := 'image_mgmt_phase1_itest/' || v_run_suffix;

  PERFORM pg_temp.img_mgmt_p1_set_auth(v_admin_uid);

  IF auth.uid() IS DISTINCT FROM v_admin_uid THEN
    PERFORM pg_temp.img_mgmt_p1_record(
      0,
      'guard_auth_uid',
      false,
      format(
        'auth.uid()=%s non coincide con admin_uid=%s (request.jwt.claim.sub non efficace in questa sessione).',
        auth.uid(),
        v_admin_uid
      )
    );
    RETURN;
  END IF;

  INSERT INTO public.pois (id, name, city_id, status, image_status)
  VALUES (
    v_test_poi_id,
    'IMG MGMT P1 Integration POI',
    v_city_id,
    'published',
    'missing'::public.media_status
  )
  ON CONFLICT (id) DO UPDATE
  SET
    city_id = EXCLUDED.city_id,
    status = EXCLUDED.status,
    name = EXCLUDED.name,
    image_status = EXCLUDED.image_status;

  -- ---------------------------------------------------------------------------
  -- 1. city + gallery → OK, assignment gallery active
  -- ---------------------------------------------------------------------------
  BEGIN
    v_id := public.upsert_entity_image_assignment_dual_write(
      'city',
      v_city_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c01/gallery.webp',
      'gallery',
      'wikimedia'
    );

    SELECT count(*)
    INTO v_cnt
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_id
      AND eia.entity_type = 'city'
      AND eia.entity_id = v_city_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'gallery'
      AND eia.is_current = true
      AND eia.assignment_status = 'active';

    PERFORM pg_temp.img_mgmt_p1_record(
      1,
      'city + gallery',
      v_cnt = 1,
      CASE WHEN v_cnt = 1 THEN format('assignment_id=%s', v_id) ELSE 'assignment gallery attivo non trovato' END
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(1, 'city + gallery', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 2. city + primary → reject, no assignment
  -- ---------------------------------------------------------------------------
  BEGIN
    v_cnt := (
      SELECT count(*)
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'city'
        AND eia.entity_id = v_city_id
        AND eia.source_storage_path = v_base_path || '/c02/primary.webp'
    );

    PERFORM public.upsert_entity_image_assignment_dual_write(
      'city',
      v_city_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c02/primary.webp',
      'primary',
      'admin'
    );

    PERFORM pg_temp.img_mgmt_p1_record(2, 'city + primary', false, 'RPC avrebbe dovuto fallire');
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      SELECT count(*)
      INTO v_cnt
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'city'
        AND eia.entity_id = v_city_id
        AND eia.source_storage_path = v_base_path || '/c02/primary.webp';

      PERFORM pg_temp.img_mgmt_p1_record(
        2,
        'city + primary',
        v_cnt = 0 AND v_err LIKE '%gallery%',
        CASE
          WHEN v_cnt <> 0 THEN format('assignment creato nonostante errore (count=%s)', v_cnt)
          WHEN v_err NOT LIKE '%gallery%' THEN v_err
          ELSE v_err
        END
      );
  END;

  -- ---------------------------------------------------------------------------
  -- 3. primary active → replaced + history
  -- ---------------------------------------------------------------------------
  BEGIN
    v_old_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c03/primary_a.webp',
      'primary',
      'admin'
    );

    SELECT eia.media_asset_id
    INTO v_old_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_old_id;

    v_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c03/primary_b.webp',
      'primary',
      'admin'
    );

    SELECT eia.is_current, eia.assignment_status, eia.replaced_by_assignment_id
    INTO v_is_current, v_status, v_replaced_by
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_old_id;

    SELECT ma.asset_status
    INTO v_asset_status
    FROM public.media_assets ma
    WHERE ma.id = v_old_asset_id;

    SELECT count(*)
    INTO v_cnt
    FROM public.entity_image_assignments eia
    WHERE eia.id = v_id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND eia.assignment_role = 'primary';

    SELECT count(*)
    INTO v_hist_replaced
    FROM public.entity_image_history eih
    WHERE eih.assignment_id = v_old_id
      AND eih.event_type = 'assignment_replaced';

    SELECT count(*)
    INTO v_hist_created
    FROM public.entity_image_history eih
    WHERE eih.assignment_id = v_id
      AND eih.event_type = 'assignment_created';

    PERFORM pg_temp.img_mgmt_p1_record(
      3,
      'primary active → replaced',
      v_is_current = false
        AND v_status = 'replaced'
        AND v_replaced_by = v_id
        AND v_cnt = 1
        AND v_hist_replaced >= 1
        AND v_hist_created >= 1
        AND v_asset_status = 'replaced'::public.image_asset_status,
      format(
        'old: is_current=%s status=%s replaced_by=%s; prev_asset_status=%s; new active=%s; hist replaced=%s created=%s',
        v_is_current,
        v_status,
        v_replaced_by,
        v_asset_status,
        v_cnt,
        v_hist_replaced,
        v_hist_created
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(3, 'primary active → replaced', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 4. primary suspended → reject, prior unchanged (is_current stays true)
  -- ---------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.pois (id, name, city_id, status, image_status)
    VALUES (v_test_poi_id || '_c04', 'IMG MGMT P1 c04', v_city_id, 'published', 'missing'::public.media_status)
    ON CONFLICT (id) DO UPDATE
    SET
      city_id = EXCLUDED.city_id,
      status = EXCLUDED.status,
      name = EXCLUDED.name,
      image_status = EXCLUDED.image_status;

    v_old_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id || '_c04',
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c04/suspended.webp',
      'primary',
      'admin'
    );

    UPDATE public.entity_image_assignments
    SET assignment_status = 'suspended'
    WHERE id = v_old_id;

    BEGIN
      PERFORM public.upsert_entity_image_assignment_dual_write(
        'poi',
        v_test_poi_id || '_c04',
        v_city_id,
        NULL,
        'public-media',
        v_base_path || '/c04/replacement.webp',
        'primary',
        'admin'
      );
      PERFORM pg_temp.img_mgmt_p1_record(4, 'primary suspended', false, 'RPC avrebbe dovuto fallire');
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT eia.is_current, eia.assignment_status
        INTO v_is_current, v_status
        FROM public.entity_image_assignments eia
        WHERE eia.id = v_old_id;

        SELECT count(*)
        INTO v_cnt
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'poi'
          AND eia.entity_id = v_test_poi_id || '_c04'
          AND eia.source_storage_path = v_base_path || '/c04/replacement.webp';

        PERFORM pg_temp.img_mgmt_p1_record(
          4,
          'primary suspended',
          v_is_current = true
            AND v_status = 'suspended'
            AND v_cnt = 0
            AND v_err LIKE '%suspended%',
          format('err=%s; old is_current=%s status=%s; new_assignments=%s', v_err, v_is_current, v_status, v_cnt)
        );
    END;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(4, 'primary suspended', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 5. primary removed → reject, prior unchanged
  -- ---------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.pois (id, name, city_id, status, image_status)
    VALUES (v_test_poi_id || '_c05', 'IMG MGMT P1 c05', v_city_id, 'published', 'missing'::public.media_status)
    ON CONFLICT (id) DO UPDATE
    SET
      city_id = EXCLUDED.city_id,
      status = EXCLUDED.status,
      name = EXCLUDED.name,
      image_status = EXCLUDED.image_status;

    v_old_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id || '_c05',
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c05/removed.webp',
      'primary',
      'admin'
    );

    UPDATE public.entity_image_assignments
    SET assignment_status = 'removed'
    WHERE id = v_old_id;

    BEGIN
      PERFORM public.upsert_entity_image_assignment_dual_write(
        'poi',
        v_test_poi_id || '_c05',
        v_city_id,
        NULL,
        'public-media',
        v_base_path || '/c05/replacement.webp',
        'primary',
        'admin'
      );
      PERFORM pg_temp.img_mgmt_p1_record(5, 'primary removed', false, 'RPC avrebbe dovuto fallire');
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT eia.is_current, eia.assignment_status
        INTO v_is_current, v_status
        FROM public.entity_image_assignments eia
        WHERE eia.id = v_old_id;

        SELECT count(*)
        INTO v_cnt
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'poi'
          AND eia.entity_id = v_test_poi_id || '_c05'
          AND eia.source_storage_path = v_base_path || '/c05/replacement.webp';

        PERFORM pg_temp.img_mgmt_p1_record(
          5,
          'primary removed',
          v_is_current = true
            AND v_status = 'removed'
            AND v_cnt = 0
            AND v_err LIKE '%removed%',
          format('err=%s; old is_current=%s status=%s; new_assignments=%s', v_err, v_is_current, v_status, v_cnt)
        );
    END;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(5, 'primary removed', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 6. stessa sorgente active → stesso assignment id, no second assignment_created
  -- ---------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.pois (id, name, city_id, status, image_status)
    VALUES (v_test_poi_id || '_c06', 'IMG MGMT P1 c06', v_city_id, 'published', 'missing'::public.media_status)
    ON CONFLICT (id) DO UPDATE
    SET
      city_id = EXCLUDED.city_id,
      status = EXCLUDED.status,
      name = EXCLUDED.name,
      image_status = EXCLUDED.image_status;

    v_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id || '_c06',
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c06/same.webp',
      'primary',
      'admin'
    );

    v_id2 := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id || '_c06',
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c06/same.webp',
      'primary',
      'admin'
    );

    SELECT count(*)
    INTO v_cnt
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_test_poi_id || '_c06'
      AND eia.assignment_role = 'primary'
      AND eia.source_storage_path = v_base_path || '/c06/same.webp';

    SELECT count(*)
    INTO v_hist_created
    FROM public.entity_image_history eih
    WHERE eih.assignment_id = v_id
      AND eih.event_type = 'assignment_created';

    PERFORM pg_temp.img_mgmt_p1_record(
      6,
      'stessa sorgente active (idempotenza)',
      v_id = v_id2 AND v_cnt = 1 AND v_hist_created = 1,
      format('id1=%s id2=%s assignments=%s history_created=%s', v_id, v_id2, v_cnt, v_hist_created)
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(6, 'stessa sorgente active (idempotenza)', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 7. stessa sorgente suspended/removed → reject rematerialization (7A + 7B)
  -- Fixture is_current=false: il blocco RPC non deve dipendere solo da is_current.
  -- ---------------------------------------------------------------------------
  BEGIN
    v_c7a_pass := false;
    v_c7b_pass := false;

    INSERT INTO public.pois (id, name, city_id, status, image_status)
    VALUES (v_test_poi_id || '_c07', 'IMG MGMT P1 c07', v_city_id, 'published', 'missing'::public.media_status)
    ON CONFLICT (id) DO UPDATE
    SET
      city_id = EXCLUDED.city_id,
      status = EXCLUDED.status,
      name = EXCLUDED.name,
      image_status = EXCLUDED.image_status;

    v_old_id := public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id || '_c07',
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c07/same.webp',
      'primary',
      'admin'
    );

    UPDATE public.entity_image_assignments
    SET
      assignment_status = 'suspended',
      is_current = false
    WHERE id = v_old_id;

    -- 7A: assignment suspended, stessa sorgente
    BEGIN
      PERFORM public.upsert_entity_image_assignment_dual_write(
        'poi',
        v_test_poi_id || '_c07',
        v_city_id,
        NULL,
        'public-media',
        v_base_path || '/c07/same.webp',
        'primary',
        'admin'
      );
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT count(*)
        INTO v_cnt
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'poi'
          AND eia.entity_id = v_test_poi_id || '_c07'
          AND eia.source_storage_path = v_base_path || '/c07/same.webp'
          AND eia.id <> v_old_id;

        SELECT eia.assignment_status
        INTO v_status
        FROM public.entity_image_assignments eia
        WHERE eia.id = v_old_id;

        v_c7a_pass := v_cnt = 0
          AND v_status = 'suspended'
          AND v_err LIKE '%rematerializzazione%';
    END;

    UPDATE public.entity_image_assignments
    SET
      assignment_status = 'removed',
      is_current = false
    WHERE id = v_old_id;

    -- 7B: assignment removed, stessa sorgente
    BEGIN
      PERFORM public.upsert_entity_image_assignment_dual_write(
        'poi',
        v_test_poi_id || '_c07',
        v_city_id,
        NULL,
        'public-media',
        v_base_path || '/c07/same.webp',
        'primary',
        'admin'
      );
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT count(*)
        INTO v_cnt
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'poi'
          AND eia.entity_id = v_test_poi_id || '_c07'
          AND eia.source_storage_path = v_base_path || '/c07/same.webp'
          AND eia.id <> v_old_id;

        SELECT eia.assignment_status
        INTO v_status
        FROM public.entity_image_assignments eia
        WHERE eia.id = v_old_id;

        v_c7b_pass := v_cnt = 0
          AND v_status = 'removed'
          AND v_err LIKE '%rematerializzazione%';
    END;

    PERFORM pg_temp.img_mgmt_p1_record(
      7,
      'stessa sorgente suspended/removed',
      v_c7a_pass AND v_c7b_pass,
      format('7A_suspended=%s; 7B_removed=%s', v_c7a_pass, v_c7b_pass)
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      PERFORM pg_temp.img_mgmt_p1_record(7, 'stessa sorgente suspended/removed', false, v_err);
  END;

  -- ---------------------------------------------------------------------------
  -- 8. p_origin_type = sponsor → reject
  -- ---------------------------------------------------------------------------
  BEGIN
    PERFORM public.upsert_entity_image_assignment_dual_write(
      'poi',
      v_test_poi_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c08/sponsor.webp',
      'primary',
      'sponsor'
    );
    PERFORM pg_temp.img_mgmt_p1_record(8, 'p_origin_type sponsor', false, 'RPC avrebbe dovuto fallire');
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      SELECT count(*)
      INTO v_cnt
      FROM public.entity_image_assignments eia
      WHERE eia.source_storage_path = v_base_path || '/c08/sponsor.webp';

      PERFORM pg_temp.img_mgmt_p1_record(
        8,
        'p_origin_type sponsor',
        v_cnt = 0 AND v_err LIKE '%sponsor%',
        CASE WHEN v_cnt <> 0 THEN format('assignment residuo count=%s', v_cnt) ELSE v_err END
      );
  END;

  -- ---------------------------------------------------------------------------
  -- 9. verified_real → reject (normalizer)
  -- ---------------------------------------------------------------------------
  BEGIN
    PERFORM public.upsert_entity_image_assignment_dual_write(
      'city',
      v_city_id,
      v_city_id,
      NULL,
      'public-media',
      v_base_path || '/c09/vr.webp',
      'gallery',
      'verified_real'
    );
    PERFORM pg_temp.img_mgmt_p1_record(9, 'verified_real', false, 'RPC avrebbe dovuto fallire');
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      SELECT count(*)
      INTO v_cnt
      FROM public.entity_image_assignments eia
      WHERE eia.source_storage_path = v_base_path || '/c09/vr.webp';

      PERFORM pg_temp.img_mgmt_p1_record(
        9,
        'verified_real',
        v_cnt = 0 AND v_err LIKE '%verified_real%',
        CASE WHEN v_cnt <> 0 THEN format('assignment residuo count=%s', v_cnt) ELSE v_err END
      );
  END;

  -- ---------------------------------------------------------------------------
  -- 10. photo_submission URL non canonica → reject
  -- ---------------------------------------------------------------------------
  BEGIN
    v_photo_id := gen_random_uuid();

    INSERT INTO public.photo_submissions (
      id,
      user_id,
      user_name,
      location_name,
      description,
      image_url,
      city_id,
      status,
      published_at,
      media_status,
      is_official
    )
    VALUES (
      v_photo_id,
      v_admin_uid,
      'IMG_MGMT_P1_TEST',
      'Integration Test',
      'non-canonical URL fixture',
      'https://example.com/not-a-supabase-storage-object.jpg',
      v_city_id,
      'approved',
      now(),
      'real'::public.media_status,
      false
    );

    BEGIN
      PERFORM public.upsert_entity_image_assignment_dual_write(
        'photo_submission',
        v_photo_id::text,
        v_city_id,
        'https://example.com/not-a-supabase-storage-object.jpg',
        NULL,
        NULL,
        'primary',
        'community'
      );
      PERFORM pg_temp.img_mgmt_p1_record(
        10,
        'photo_submission URL non canonica',
        false,
        'RPC avrebbe dovuto fallire'
      );
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT count(*)
        INTO v_cnt
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'photo_submission'
          AND eia.entity_id = v_photo_id::text;

        PERFORM pg_temp.img_mgmt_p1_record(
          10,
          'photo_submission URL non canonica',
          v_cnt = 0
            AND (
              v_err LIKE '%non canonica%'
              OR v_err LIKE '%community-photos%'
              OR v_err LIKE '%public-media%'
            ),
          format('err=%s; assignments=%s', v_err, v_cnt)
        );
    END;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      -- Solo INSERT (o setup) raggiunge questo ramo; il reject URL è nel blocco interno.
      PERFORM pg_temp.img_mgmt_p1_record(
        10,
        'photo_submission URL non canonica',
        false,
        format('fixture INSERT/setup fallita (non è il reject dual-write): %s', v_err)
      );
  END;
END;
$$;

\echo ''
\echo '========== IMAGE_MGMT PHASE1 DUAL-WRITE INTEGRATION =========='

SELECT
  case_num AS case,
  case_name,
  status,
  detail
FROM img_mgmt_p1_results
ORDER BY case_num;

DO $$
DECLARE
  v_fail int;
  v_skip int;
  r record;
BEGIN
  SELECT count(*) INTO v_fail FROM img_mgmt_p1_results WHERE status = 'FAIL';
  SELECT count(*) INTO v_skip FROM img_mgmt_p1_results WHERE status = 'SKIP' AND case_num = 0;

  IF v_skip > 0 THEN
    RAISE NOTICE 'IMAGE_MGMT_PHASE1_INTEGRATION: SKIP (guard non superato — vedere riga case 0).';
    RETURN;
  END IF;

  IF v_fail > 0 THEN
    FOR r IN
      SELECT case_num, case_name, detail
      FROM img_mgmt_p1_results
      WHERE status = 'FAIL'
      ORDER BY case_num
    LOOP
      RAISE NOTICE 'FAIL case % (%): %', r.case_num, r.case_name, r.detail;
    END LOOP;
    RAISE EXCEPTION 'IMAGE_MGMT_PHASE1_INTEGRATION: % caso/i FAIL (vedere tabella sopra).', v_fail;
  END IF;

  RAISE NOTICE 'IMAGE_MGMT_PHASE1_INTEGRATION: tutti i casi 1–10 PASS.';
END;
$$;

ROLLBACK;

\echo '========== ROLLBACK eseguito — nessun dato di test persistito =========='
