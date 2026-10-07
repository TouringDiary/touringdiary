-- =============================================================================
-- NOT A MIGRATION. Non applicare con supabase db push.
--
-- Contract test di public.hard_delete_media_photo.
-- Eseguire come script unico, con il ruolo delle migration, DOPO
-- 20261005143000_hard_delete_media_photo.sql.
--
-- Lo script apre una transazione, crea solo fixture, e termina con ROLLBACK.
-- Non va eseguito istruzione per istruzione in autocommit.
-- Se il blocco fallisce, la transazione è abortita: inviare comunque ROLLBACK
-- prima di chiudere la sessione. Non eseguire COMMIT.
--
-- Non usa asset, città o utenti già presenti.
-- Le cancellazioni passano dalla RPC, che legge auth.uid() da
-- request.jwt.claim.sub. Non si imposta il ruolo service_role.
--
-- Le DELETE su storage.objects verificano la policy RLS PostgreSQL.
-- Non sono una cancellazione del file fisico tramite Storage API.
-- Il file fisico non viene toccato. ROLLBACK annulla le righe fixture.
-- La piattaforma blocca la DELETE SQL su storage.objects salvo
-- storage.allow_delete_query. Il contract test lo imposta solo in questa
-- transazione. Non è un meccanismo dell'applicazione.
-- =============================================================================

BEGIN;

DO $contract$
DECLARE
  v_admin uuid := gen_random_uuid();
  v_other_admin uuid := gen_random_uuid();
  v_limited uuid := gen_random_uuid();
  v_plain uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
  v_city text := 'hd_contract_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_poi_one text := 'hd_contract_poi_one_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_a text := 'hd_contract_poi_a_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_b text := 'hd_contract_poi_b_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_ga text := 'hd_contract_poi_ga_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_gb text := 'hd_contract_poi_gb_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_residual text := 'hd_contract_poi_res_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_placeholder text := 'hd_contract_poi_ph_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_fault text := 'hd_contract_poi_fault_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_other text := 'hd_contract_poi_other_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_asset_one uuid := gen_random_uuid();
  v_asset_two uuid := gen_random_uuid();
  v_asset_global uuid := gen_random_uuid();
  v_asset_residual uuid := gen_random_uuid();
  v_asset_placeholder uuid := gen_random_uuid();
  v_asset_fault uuid := gen_random_uuid();
  v_asset_other uuid := gen_random_uuid();
  v_asg_one uuid := gen_random_uuid();
  v_asg_a uuid := gen_random_uuid();
  v_asg_b uuid := gen_random_uuid();
  v_asg_ga uuid := gen_random_uuid();
  v_asg_gb uuid := gen_random_uuid();
  v_asg_active uuid := gen_random_uuid();
  v_asg_removed uuid := gen_random_uuid();
  v_asg_replaced uuid := gen_random_uuid();
  v_asg_fault uuid := gen_random_uuid();
  v_asg_other uuid := gen_random_uuid();
  v_hist_one uuid := gen_random_uuid();
  v_hist_a uuid := gen_random_uuid();
  v_hist_b uuid := gen_random_uuid();
  v_hist_other uuid := gen_random_uuid();
  v_run uuid := gen_random_uuid();
  v_step uuid := gen_random_uuid();
  v_report_one uuid := gen_random_uuid();
  v_report_shared_a uuid := gen_random_uuid();
  v_report_exclusive uuid := gen_random_uuid();
  v_report_kept uuid := gen_random_uuid();
  v_group uuid := gen_random_uuid();
  v_submission uuid;
  v_gallery uuid;
  v_asset_reused uuid := gen_random_uuid();
  v_report_reused uuid := gen_random_uuid();
  v_deleted integer;
  v_policy_allow text := 'hard_delete_contract/policy-allow-' || gen_random_uuid()::text || '.jpg';
  v_policy_expired text := 'hard_delete_contract/policy-expired-' || gen_random_uuid()::text || '.jpg';
  v_policy_deny text := 'hard_delete_contract/policy-deny-' || gen_random_uuid()::text || '.jpg';
  v_policy_release text := 'hard_delete_contract/policy-release-' || gen_random_uuid()::text || '.jpg';
  v_reused_path text := 'hard_delete_contract/reused-by-asset-' || gen_random_uuid()::text || '.jpg';
  v_reused_evidence text := 'hard_delete_contract/reused-evidence-' || gen_random_uuid()::text || '.jpg';
  v_orphan_path text := 'hard_delete_contract/orphan-keep-' || gen_random_uuid()::text || '.jpg';
  v_result jsonb;
  v_message text;
BEGIN
  IF to_regprocedure('public.hard_delete_media_photo(uuid,uuid)') IS NULL
     OR to_regprocedure('public.is_admin_all(uuid)') IS NULL
     OR to_regprocedure('public.media_hard_delete_object_authorized(text,text)') IS NULL
     OR to_regprocedure('public.release_media_hard_delete_objects(jsonb)') IS NULL THEN
    RAISE EXCEPTION
      'RPC assente. Applicare 20261005143000 prima di questo script. Nessuna fixture è stata scritta.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_hard_delete_objects'
      AND column_name = 'expires_at'
      AND is_nullable = 'NO'
  )
  OR pg_get_functiondef('public.media_hard_delete_object_authorized(text,text)'::regprocedure) NOT ILIKE '%expires_at > now()%'
  OR pg_get_functiondef('public.hard_delete_media_photo(uuid,uuid)'::regprocedure) NOT ILIKE '%1 hour%'
  OR pg_get_functiondef('public.hard_delete_media_photo(uuid,uuid)'::regprocedure) ILIKE '%created_at%1 hour%' THEN
    RAISE EXCEPTION 'la scadenza di 1 ora non è limitata all''autorizzazione Storage dell''operazione';
  END IF;

  -- Solo questa transazione. Il trigger storage.protect_delete rifiuta la
  -- DELETE SQL se il parametro non è true. Non va nella migration né nel client.
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (v_admin, 'hard-delete-contract-admin-' || v_admin::text || '@example.invalid', '{"role":"admin_all"}'::jsonb),
    (v_other_admin, 'hard-delete-contract-admin-b-' || v_other_admin::text || '@example.invalid', '{"role":"admin_all"}'::jsonb),
    (v_limited, 'hard-delete-contract-limited-' || v_limited::text || '@example.invalid', '{"role":"admin_limited"}'::jsonb),
    (v_plain, 'hard-delete-contract-user-' || v_plain::text || '@example.invalid', '{"role":"user"}'::jsonb),
    (v_owner, 'hard-delete-contract-owner-' || v_owner::text || '@example.invalid', '{"role":"user"}'::jsonb);

  UPDATE public.profiles
  SET is_test_account = true
  WHERE id IN (v_admin, v_other_admin, v_limited, v_plain, v_owner);

  IF NOT public.is_admin_all(v_admin)
     OR NOT public.is_admin_all(v_other_admin)
     OR public.is_admin_all(v_limited)
     OR public.is_admin_all(v_plain) THEN
    RAISE EXCEPTION 'Le fixture profilo non rispettano admin_all / admin_limited / user.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  IF auth.uid() IS DISTINCT FROM v_admin THEN
    RAISE EXCEPTION
      'auth.uid() non legge request.jwt.claim.sub. Autorizzazione e RPC non sono eseguibili in questa sessione. Nessun bypass viene simulato.';
  END IF;

  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES (v_city, 'HD Contract City', v_city, 'Contratto', 'Contratto');

  INSERT INTO public.cities (id, name, slug)
  VALUES (v_city, 'HD Contract City', v_city);

  INSERT INTO public.pois (id, name, city_id)
  VALUES
    (v_poi_one, 'HD Contract POI one', v_city),
    (v_poi_a, 'HD Contract POI A', v_city),
    (v_poi_b, 'HD Contract POI B', v_city),
    (v_poi_ga, 'HD Contract POI GA', v_city),
    (v_poi_gb, 'HD Contract POI GB', v_city),
    (v_poi_residual, 'HD Contract POI residual', v_city),
    (v_poi_placeholder, 'HD Contract POI placeholder', v_city),
    (v_poi_fault, 'HD Contract POI fault', v_city),
    (v_poi_other, 'HD Contract POI other', v_city);

  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES
    (v_asset_one, 'public-media', 'hard_delete_contract/' || v_asset_one::text || '.jpg', 'admin', false, 'active'),
    (v_asset_two, 'public-media', 'hard_delete_contract/' || v_asset_two::text || '.jpg', 'admin', false, 'active'),
    (v_asset_global, 'public-media', 'hard_delete_contract/' || v_asset_global::text || '.jpg', 'wikimedia', false, 'active'),
    (v_asset_residual, 'public-media', 'hard_delete_contract/' || v_asset_residual::text || '.jpg', 'admin', false, 'active'),
    (v_asset_placeholder, 'public-media', 'hard_delete_contract/' || v_asset_placeholder::text || '.jpg', 'placeholder', true, 'active'),
    (v_asset_fault, 'public-media', 'hard_delete_contract/' || v_asset_fault::text || '.jpg', 'admin', false, 'active'),
    (v_asset_other, 'public-media', 'hard_delete_contract/' || v_asset_other::text || '.jpg', 'community', false, 'active');

  INSERT INTO public.entity_image_assignments (
    id, media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  )
  VALUES
    (v_asg_one, v_asset_one, 'poi', v_poi_one, v_city, 'primary', 'active', true),
    (v_asg_a, v_asset_two, 'poi', v_poi_a, v_city, 'primary', 'active', true),
    (v_asg_b, v_asset_two, 'poi', v_poi_b, v_city, 'primary', 'active', true),
    (v_asg_ga, v_asset_global, 'poi', v_poi_ga, v_city, 'primary', 'active', true),
    (v_asg_gb, v_asset_global, 'poi', v_poi_gb, v_city, 'primary', 'active', true),
    (v_asg_active, v_asset_residual, 'poi', v_poi_residual, v_city, 'primary', 'active', true),
    (v_asg_removed, v_asset_residual, 'poi', v_poi_residual, v_city, 'gallery', 'removed', false),
    (v_asg_replaced, v_asset_residual, 'poi', v_poi_residual, v_city, 'gallery', 'replaced', false),
    (v_asg_fault, v_asset_fault, 'poi', v_poi_fault, v_city, 'primary', 'active', true),
    (v_asg_other, v_asset_other, 'poi', v_poi_other, v_city, 'primary', 'active', true);

  INSERT INTO public.entity_image_history (id, event_type, media_asset_id, assignment_id, entity_type, entity_id, city_id)
  VALUES
    (v_hist_one, 'assignment_created', v_asset_one, v_asg_one, 'poi', v_poi_one, v_city),
    (v_hist_a, 'assignment_created', v_asset_two, v_asg_a, 'poi', v_poi_a, v_city),
    (v_hist_b, 'assignment_created', v_asset_two, v_asg_b, 'poi', v_poi_b, v_city),
    (v_hist_other, 'assignment_created', v_asset_other, v_asg_other, 'poi', v_poi_other, v_city);

  INSERT INTO public.image_verification_runs (id, media_asset_id, overall_outcome)
  VALUES (v_run, v_asset_one, 'not_applicable');

  INSERT INTO public.image_verification_steps (id, run_id, step_code, step_order, outcome)
  VALUES (v_step, v_run, 'hd_contract_step', 1, 'not_applicable');

  INSERT INTO public.content_reports (
    id, report_group_id, report_kind, entity_type, entity_id, city_id,
    assignment_id, status, reason, user_notes,
    evidence_storage_bucket, evidence_storage_path
  )
  VALUES
    (
      v_report_one, v_group, 'image_abuse', 'poi', v_poi_one, v_city,
      v_asg_one, 'nuovo', 'other', 'Fixture contratto: report del solo utilizzo.',
      'report-evidence', 'hard_delete_contract/only-one.jpg'
    ),
    (
      v_report_shared_a, v_group, 'image_abuse', 'poi', v_poi_a, v_city,
      v_asg_a, 'nuovo', 'other', 'Fixture contratto: evidence condivisa, lato cancellato.',
      'report-evidence', 'hard_delete_contract/shared.jpg'
    ),
    (
      v_report_exclusive, v_group, 'image_abuse', 'poi', v_poi_a, v_city,
      v_asg_a, 'ko', 'other', 'Fixture contratto: evidence solo del report cancellato.',
      'report-evidence', 'hard_delete_contract/exclusive.jpg'
    ),
    (
      v_report_kept, v_group, 'image_abuse', 'poi', v_poi_b, v_city,
      v_asg_b, 'nuovo', 'other', 'Fixture contratto: report che deve restare.',
      'report-evidence', 'hard_delete_contract/shared.jpg'
    );

  INSERT INTO public.photo_submissions (user_id, user_name, location_name, image_url, media_status)
  VALUES (v_plain, 'HD Contract', 'HD Contract place', 'https://example.invalid/hd-contract.jpg', 'real')
  RETURNING id INTO v_submission;

  INSERT INTO public.city_patron_gallery (city_id, image_url, storage_path)
  VALUES (v_city, 'https://example.invalid/hd-contract-gallery.jpg', 'hard_delete_contract/gallery-not-an-asset.jpg')
  RETURNING id INTO v_gallery;

  -- Autorizzazione Storage: solo la funzione, nessun oggetto fisico.
  -- service_role non è verificato da questa contract suite perché bypassa il normale percorso auth.uid()/policy; deve essere verificato separatamente in ambiente controllato dopo il db push.
  INSERT INTO public.media_hard_delete_objects (user_id, bucket_id, object_name, created_at, expires_at)
  VALUES
    (
      v_admin,
      'public-media',
      'hard_delete_contract/auth-only.jpg',
      now(),
      now() + interval '1 hour'
    ),
    (
      v_admin,
      'public-media',
      'hard_delete_contract/auth-expired.jpg',
      now() - interval '10 days',
      now() - interval '10 days'
    );

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  IF NOT public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'auth A: Admin ALL non è autorizzato sull''oggetto della fixture';
  END IF;
  IF public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/altro-oggetto.jpg')
     OR public.media_hard_delete_object_authorized('altro-bucket', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'auth B: un bucket o un path diverso risulta autorizzato';
  END IF;
  IF public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-expired.jpg') THEN
    RAISE EXCEPTION 'auth E: un''autorizzazione scaduta da giorni risulta ancora valida';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_limited::text, true);
  IF public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'auth C: Admin LIMITED è autorizzato sull''oggetto di un altro utente';
  END IF;
  BEGIN
    PERFORM public.release_media_hard_delete_objects(
      jsonb_build_array(
        jsonb_build_object('bucket', 'public-media', 'path', 'hard_delete_contract/auth-only.jpg')
      )
    );
    RAISE EXCEPTION 'release: Admin LIMITED non è stato rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%Solo Admin ALL%' THEN
        RAISE EXCEPTION 'release Admin LIMITED: messaggio inatteso: %', v_message;
      END IF;
  END;

  PERFORM set_config('request.jwt.claim.sub', v_plain::text, true);
  IF public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'auth D: un utente normale è autorizzato sull''oggetto di un altro utente';
  END IF;
  BEGIN
    PERFORM public.release_media_hard_delete_objects(
      jsonb_build_array(
        jsonb_build_object('bucket', 'public-media', 'path', 'hard_delete_contract/auth-only.jpg')
      )
    );
    RAISE EXCEPTION 'release: utente normale non è stato rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%Solo Admin ALL%' THEN
        RAISE EXCEPTION 'release utente: messaggio inatteso: %', v_message;
      END IF;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/auth-only.jpg'
  ) THEN
    RAISE EXCEPTION 'release: la riga è stata rimossa da un ruolo non Admin ALL';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  IF NOT public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'release: l''autorizzazione non è più vera prima del rilascio Admin ALL';
  END IF;
  PERFORM public.release_media_hard_delete_objects(
    jsonb_build_array(
      jsonb_build_object('bucket', 'public-media', 'path', 'hard_delete_contract/auth-only.jpg')
    )
  );
  IF EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/auth-only.jpg'
  ) THEN
    RAISE EXCEPTION 'release: la riga di autorizzazione è rimasta';
  END IF;
  IF public.media_hard_delete_object_authorized('public-media', 'hard_delete_contract/auth-only.jpg') THEN
    RAISE EXCEPTION 'release: l''autorizzazione resta vera dopo il rilascio';
  END IF;

  -- Prova RLS su storage.objects, non una cancellazione Storage API.
  -- Il ruolo della sessione è quello delle migration e bypassa RLS: la DELETE
  -- va eseguita come authenticated. Le fixture hanno owner = v_owner, diverso
  -- da admin, limited e utente. Il path hard_delete_contract/ non rientra
  -- nelle policy DELETE di galleria, personaggi, viaggio o workspace.
  -- service_role non è verificato da questa contract suite perché bypassa il normale percorso auth.uid()/policy; deve essere verificato separatamente in ambiente controllato dopo il db push.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy pol
    JOIN pg_class rel ON rel.oid = pol.polrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'storage'
      AND rel.relname = 'objects'
      AND pol.polname = 'media_hard_delete_authorized_delete'
      AND pol.polcmd = 'd'
      AND pol.polpermissive
      AND pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%media_hard_delete_object_authorized%'
      AND EXISTS (
        SELECT 1
        FROM pg_roles granted_role
        WHERE granted_role.oid = ANY (pol.polroles)
          AND granted_role.rolname = 'authenticated'
      )
  ) THEN
    RAISE EXCEPTION 'policy media_hard_delete_authorized_delete assente o non agganciata alla funzione';
  END IF;
  IF (
    SELECT count(*)
    FROM storage.buckets
    WHERE id IN ('public-media', 'report-evidence')
  ) < 2 THEN
    RAISE EXCEPTION 'bucket fixture assente: la prova della policy non inserisce oggetti di produzione';
  END IF;

  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES
    ('public-media', v_policy_allow, v_owner),
    ('public-media', v_policy_expired, v_owner),
    ('public-media', v_policy_deny, v_owner),
    ('public-media', v_policy_release, v_owner),
    ('public-media', v_reused_path, v_owner),
    ('report-evidence', v_reused_evidence, v_owner);

  INSERT INTO public.media_hard_delete_objects (user_id, bucket_id, object_name, created_at, expires_at)
  VALUES
    (v_admin, 'public-media', v_policy_allow, now(), now() + interval '1 hour'),
    (v_admin, 'public-media', v_policy_expired, now() - interval '10 days', now() - interval '10 days'),
    (v_admin, 'public-media', v_policy_release, now(), now() + interval '1 hour'),
    (v_admin, 'public-media', v_reused_path, now(), now() + interval '1 hour'),
    (v_other_admin, 'public-media', v_reused_path, now(), now() + interval '1 hour'),
    (v_admin, 'report-evidence', v_reused_evidence, now(), now() + interval '1 hour'),
    (v_other_admin, 'report-evidence', v_reused_evidence, now(), now() + interval '1 hour'),
    (v_admin, 'public-media', v_orphan_path, now() - interval '10 days', now() - interval '10 days');

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_allow;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 1
     OR EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_allow
     ) THEN
    RAISE EXCEPTION 'policy 1: Admin ALL con autorizzazione non ha cancellato la fixture';
  END IF;

  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_deny;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_deny
     ) THEN
    RAISE EXCEPTION 'policy 2: Admin ALL senza autorizzazione ha cancellato la fixture';
  END IF;

  IF public.media_hard_delete_object_authorized('public-media', v_policy_expired) THEN
    RAISE EXCEPTION 'policy scaduta: la funzione autorizza una riga di dieci giorni fa';
  END IF;
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_expired;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_expired
     ) THEN
    RAISE EXCEPTION 'policy scaduta: Admin ALL con autorizzazione scaduta ha cancellato la fixture';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_limited::text, true);
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_release;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_release
     ) THEN
    RAISE EXCEPTION 'policy 3: Admin LIMITED ha cancellato la fixture';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_plain::text, true);
  IF EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'public-media'
      AND name = v_policy_release
      AND owner IS NOT DISTINCT FROM v_plain
  ) OR v_policy_release LIKE 'city_patron_gallery/%'
     OR v_policy_release LIKE 'patron_photo_suggestions/%'
     OR v_policy_release LIKE 'famous_person_photo_suggestions/%' THEN
    RAISE EXCEPTION 'policy 4: la fixture non è isolata dalle policy DELETE già presenti';
  END IF;
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_release;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_release
     ) THEN
    RAISE EXCEPTION 'policy 4: un utente normale ha cancellato la fixture';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM public.release_media_hard_delete_objects(
    jsonb_build_array(jsonb_build_object('bucket', 'public-media', 'path', v_policy_release))
  );
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media' AND name = v_policy_release;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects
       WHERE bucket_id = 'public-media' AND name = v_policy_release
     ) THEN
    RAISE EXCEPTION 'policy 5: dopo il release la DELETE Storage è ancora consentita';
  END IF;

  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset_reused, 'public-media', v_reused_path, 'admin', false, 'active');
  INSERT INTO public.content_reports (
    id, report_group_id, report_kind, entity_type, entity_id, city_id,
    assignment_id, status, reason, user_notes,
    evidence_storage_bucket, evidence_storage_path
  )
  VALUES (
    v_report_reused, v_group, 'image_abuse', 'poi', v_poi_other, v_city,
    v_asg_other, 'ko', 'other', 'Fixture contratto: evidence ancora in uso.',
    'report-evidence', v_reused_evidence
  );

  IF public.media_hard_delete_object_authorized('public-media', v_reused_path)
     OR public.media_hard_delete_object_authorized('report-evidence', v_reused_evidence) THEN
    RAISE EXCEPTION 'interruzione: un path ripreso da un asset o da un report resta autorizzato';
  END IF;
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE (bucket_id = 'public-media' AND name = v_reused_path)
       OR (bucket_id = 'report-evidence' AND name = v_reused_evidence);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0 THEN
    RAISE EXCEPTION 'interruzione: la policy ha cancellato un oggetto il cui path è di nuovo in uso';
  END IF;
  IF public.media_hard_delete_object_authorized('public-media', v_orphan_path) THEN
    RAISE EXCEPTION 'tempo: un''autorizzazione creata dieci giorni fa è ancora valida';
  END IF;

  -- 16. Admin LIMITED rifiutato. 17. Utente non admin rifiutato.
  PERFORM set_config('request.jwt.claim.sub', v_limited::text, true);
  BEGIN
    PERFORM public.hard_delete_media_photo(v_asset_one, v_asg_one);
    RAISE EXCEPTION 'case 16: admin_limited non è stato rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%Solo Admin ALL%' THEN
        RAISE EXCEPTION 'case 16: messaggio inatteso: %', v_message;
      END IF;
  END;

  PERFORM set_config('request.jwt.claim.sub', v_plain::text, true);
  BEGIN
    PERFORM public.hard_delete_media_photo(v_asset_one, v_asg_one);
    RAISE EXCEPTION 'case 17: utente non admin non è stato rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%Solo Admin ALL%' THEN
        RAISE EXCEPTION 'case 17: messaggio inatteso: %', v_message;
      END IF;
  END;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);

  -- 18. Placeholder rifiutato.
  BEGIN
    PERFORM public.hard_delete_media_photo(v_asset_placeholder, NULL);
    RAISE EXCEPTION 'case 18: il placeholder non è stato rifiutato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%placeholder%' THEN
        RAISE EXCEPTION 'case 18: messaggio inatteso: %', v_message;
      END IF;
  END;

  IF NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_placeholder) THEN
    RAISE EXCEPTION 'case 18: il placeholder è stato cancellato';
  END IF;

  -- 19. Errore durante la DELETE dell''asset: la transazione della RPC torna indietro.
  CREATE TEMP TABLE hd_contract_fault (
    id integer PRIMARY KEY,
    media_asset_id uuid NOT NULL REFERENCES public.media_assets (id) ON DELETE RESTRICT
  );
  INSERT INTO hd_contract_fault (id, media_asset_id) VALUES (1, v_asset_fault);
  BEGIN
    PERFORM public.hard_delete_media_photo(v_asset_fault, NULL);
    RAISE EXCEPTION 'case 19: la RPC doveva fallire sulla foreign key temporanea';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%foreign key%' THEN
        RAISE EXCEPTION 'case 19: errore diverso dalla foreign key: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_fault)
     OR NOT EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE id = v_asg_fault) THEN
    RAISE EXCEPTION 'case 19: la cancellazione parziale è rimasta';
  END IF;
  DROP TABLE hd_contract_fault;

  -- 15 e 1-4. Admin ALL, un solo assignment: assignment, asset, storico, verifiche.
  v_result := public.hard_delete_media_photo(v_asset_one, v_asg_one);

  IF EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE id = v_asg_one) THEN
    RAISE EXCEPTION 'case 1: assignment non eliminato';
  END IF;
  IF EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_one) THEN
    RAISE EXCEPTION 'case 2: asset non eliminato';
  END IF;
  IF EXISTS (SELECT 1 FROM public.entity_image_history WHERE id = v_hist_one) THEN
    RAISE EXCEPTION 'case 3: storico non eliminato';
  END IF;
  IF EXISTS (SELECT 1 FROM public.image_verification_runs WHERE id = v_run)
     OR EXISTS (SELECT 1 FROM public.image_verification_steps WHERE id = v_step) THEN
    RAISE EXCEPTION 'case 4: verification run o step ancora presenti';
  END IF;
  IF v_result->>'asset_deleted' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'case 15: Admin ALL non ha completato la cancellazione';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.content_reports WHERE id = v_report_kept) THEN
    RAISE EXCEPTION 'case 12 anticipato: un report non coinvolto è sparito durante il primo delete';
  END IF;
  IF (
    SELECT count(*)
    FROM public.media_hard_delete_objects
    WHERE (bucket_id = 'public-media' AND object_name = v_reused_path)
       OR (bucket_id = 'report-evidence' AND object_name = v_reused_evidence)
  ) <> 4 THEN
    RAISE EXCEPTION 'concorrenza: un ticket di un path ancora in uso è stato cancellato';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_other_admin::text, true);
  IF public.media_hard_delete_object_authorized('public-media', v_reused_path)
     OR public.media_hard_delete_object_authorized('report-evidence', v_reused_evidence) THEN
    RAISE EXCEPTION 'concorrenza: un path ancora in uso risulta autorizzato';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  IF EXISTS (
    SELECT 1 FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = v_orphan_path
  )
  OR public.media_hard_delete_object_authorized('public-media', v_orphan_path) THEN
    RAISE EXCEPTION 'tempo: un''autorizzazione scaduta è rimasta valida dopo una nuova operazione';
  END IF;

  -- 5-8, 11-14. Due assignment: ne resta uno, con il suo storico e il report.
  v_result := public.hard_delete_media_photo(v_asset_two, v_asg_a);

  IF EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE id = v_asg_a) THEN
    RAISE EXCEPTION 'case 5: il primo assignment non è stato eliminato';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_two) THEN
    RAISE EXCEPTION 'case 6: l''asset è stato eliminato nonostante resti un assignment';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.entity_image_assignments
    WHERE id = v_asg_b AND assignment_status = 'active' AND is_current = true
  ) THEN
    RAISE EXCEPTION 'case 7: l''altro assignment non è rimasto invariato';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.entity_image_history WHERE id = v_hist_b)
     OR EXISTS (SELECT 1 FROM public.entity_image_history WHERE id = v_hist_a) THEN
    RAISE EXCEPTION 'case 8: lo storico dell''altro assignment non è quello rimasto';
  END IF;
  IF EXISTS (SELECT 1 FROM public.content_reports WHERE id IN (v_report_shared_a, v_report_exclusive))
     OR NOT EXISTS (SELECT 1 FROM public.content_reports WHERE id = v_report_kept) THEN
    RAISE EXCEPTION 'case 11 o 12: report relativi o report superstite non coerenti';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_result->'evidence') item
    WHERE item->>'path' = 'hard_delete_contract/shared.jpg'
  ) THEN
    RAISE EXCEPTION 'case 13: l''evidence condivisa è stata restituita per la cancellazione';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_result->'evidence') item
    WHERE item->>'bucket' = 'report-evidence'
      AND item->>'path' = 'hard_delete_contract/exclusive.jpg'
  ) THEN
    RAISE EXCEPTION 'case 14: l''evidence non più usata non è nel risultato';
  END IF;
  IF v_result->>'asset_deleted' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'case 6: la RPC ha dichiarato l''asset eliminato';
  END IF;

  -- Utilizzo removed/replaced: cancellare solo il corrente non elimina l'asset.
  PERFORM public.hard_delete_media_photo(v_asset_residual, v_asg_active);
  IF NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_residual)
     OR NOT EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE id = v_asg_removed AND assignment_status = 'removed')
     OR NOT EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE id = v_asg_replaced AND assignment_status = 'replaced') THEN
    RAISE EXCEPTION 'removed/replaced non contano come utilizzo residuo';
  END IF;

  -- 9-10. L'asset ha dieci giorni: si cancella. L'autorizzazione precedente, scaduta, no.
  UPDATE public.media_assets
  SET created_at = now() - interval '10 days'
  WHERE id = v_asset_global;

  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('public-media', 'hard_delete_contract/' || v_asset_global::text || '.jpg', v_owner);
  INSERT INTO public.media_hard_delete_objects (user_id, bucket_id, object_name, created_at, expires_at)
  VALUES
    (
      v_admin,
      'public-media',
      'hard_delete_contract/' || v_asset_global::text || '.jpg',
      now() - interval '10 days',
      now() - interval '10 days'
    ),
    (
      v_other_admin,
      'public-media',
      'hard_delete_contract/' || v_asset_global::text || '.jpg',
      now(),
      now() + interval '1 hour'
    );
  IF public.media_hard_delete_object_authorized(
    'public-media',
    'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'tempo: l''autorizzazione scaduta autorizza ancora l''asset vecchio';
  END IF;
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media'
      AND name = 'hard_delete_contract/' || v_asset_global::text || '.jpg';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0 THEN
    RAISE EXCEPTION 'tempo: la policy ha cancellato la fixture con l''autorizzazione scaduta';
  END IF;

  v_result := public.hard_delete_media_photo(v_asset_global, NULL);
  IF EXISTS (SELECT 1 FROM public.entity_image_assignments WHERE media_asset_id = v_asset_global) THEN
    RAISE EXCEPTION 'case 9: è rimasto un assignment';
  END IF;
  IF EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_global) THEN
    RAISE EXCEPTION 'case 10: l''asset globale è ancora presente';
  END IF;
  IF v_result->>'asset_deleted' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'storage rpc: asset_deleted non è true';
  END IF;
  IF v_result->'storage'->>'bucket' IS DISTINCT FROM 'public-media'
     OR v_result->'storage'->>'path' IS DISTINCT FROM ('hard_delete_contract/' || v_asset_global::text || '.jpg') THEN
    RAISE EXCEPTION 'storage rpc: bucket o path diversi dalla fixture';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'storage rpc: manca la riga in media_hard_delete_objects';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_other_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'concorrenza: il ticket dell''altro Admin ALL è sopravvissuto alla cancellazione';
  END IF;
  IF (
    SELECT count(*)
    FROM public.media_hard_delete_objects
    WHERE (bucket_id = 'public-media' AND object_name = v_reused_path)
       OR (bucket_id = 'report-evidence' AND object_name = v_reused_evidence)
  ) <> 4 THEN
    RAISE EXCEPTION 'concorrenza: la cancellazione ha rimosso ticket di risorse ancora in uso';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_other_admin::text, true);
  IF public.media_hard_delete_object_authorized(
    'public-media',
    'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'concorrenza: l''altro Admin ALL resta autorizzato sul path cancellato';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  IF NOT public.media_hard_delete_object_authorized(
    'public-media',
    'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'storage rpc: Admin ALL non risulta autorizzato sull''oggetto restituito';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/' || v_asset_global::text || '.jpg'
      AND expires_at > now() + interval '59 minutes'
      AND expires_at <= now() + interval '1 hour' + interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'tempo: la nuova operazione non ha creato un''autorizzazione valida un''ora';
  END IF;
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media'
      AND name = 'hard_delete_contract/' || v_asset_global::text || '.jpg';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'tempo: la nuova autorizzazione non ha consentito la DELETE Storage';
  END IF;
  PERFORM public.release_media_hard_delete_objects(
    jsonb_build_array(
      jsonb_build_object(
        'bucket', 'public-media',
        'path', 'hard_delete_contract/' || v_asset_global::text || '.jpg'
      )
    )
  );
  IF EXISTS (
    SELECT 1
    FROM public.media_hard_delete_objects
    WHERE user_id = v_admin
      AND bucket_id = 'public-media'
      AND object_name = 'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'storage rpc: la riga non è stata rilasciata';
  END IF;
  IF public.media_hard_delete_object_authorized(
    'public-media',
    'hard_delete_contract/' || v_asset_global::text || '.jpg'
  ) THEN
    RAISE EXCEPTION 'storage rpc: l''autorizzazione resta vera dopo il rilascio';
  END IF;
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('public-media', 'hard_delete_contract/' || v_asset_global::text || '.jpg', v_owner);
  BEGIN
    PERFORM set_config('role', 'authenticated', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-media'
      AND name = 'hard_delete_contract/' || v_asset_global::text || '.jpg';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXECUTE 'RESET ROLE';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE 'RESET ROLE';
      RAISE;
  END;
  IF v_deleted <> 0 THEN
    RAISE EXCEPTION 'storage rpc: dopo il release la policy consente ancora la DELETE';
  END IF;

  -- 20. Asset e dati non correlati. D-22: l'assignment non toccato resta.
  IF NOT EXISTS (
    SELECT 1 FROM public.entity_image_assignments
    WHERE id = v_asg_other AND media_asset_id = v_asset_other AND assignment_status = 'active'
  ) OR NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = v_asset_other)
     OR NOT EXISTS (SELECT 1 FROM public.pois WHERE id = v_poi_other AND name = 'HD Contract POI other') THEN
    RAISE EXCEPTION 'case 20: un asset o un POI non correlato è cambiato';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.photo_submissions WHERE id = v_submission)
     OR NOT EXISTS (SELECT 1 FROM public.city_patron_gallery WHERE id = v_gallery) THEN
    RAISE EXCEPTION 'photo_submissions o city_patron_gallery sono state toccate';
  END IF;

  -- Il trigger è di nuovo attivo: il DELETE diretto sullo storico fixture fallisce.
  BEGIN
    DELETE FROM public.entity_image_history WHERE id = v_hist_other;
    RAISE EXCEPTION 'il DELETE diretto sullo storico è stato consentito';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message NOT LIKE '%append-only%' THEN
        RAISE EXCEPTION 'trigger storico: messaggio inatteso: %', v_message;
      END IF;
  END;

  IF NOT EXISTS (SELECT 1 FROM public.entity_image_history WHERE id = v_hist_other) THEN
    RAISE EXCEPTION 'il DELETE sullo storico ha avuto effetto';
  END IF;
END
$contract$;

ROLLBACK;
