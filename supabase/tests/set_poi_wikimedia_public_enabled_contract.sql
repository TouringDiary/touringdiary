-- =============================================================================
-- NOT A MIGRATION — non includere in supabase db push.
--
-- Contratto: public.set_poi_wikimedia_public_enabled(text, text, boolean)
-- Migration: 20261001200000_set_poi_wikimedia_public_enabled.sql
--
-- Nel repository non ci sono pgTAP, helper SQL condivisi né seed di POI
-- (supabase/seed.sql assente). L'harness eseguibile già usato è
-- image_mgmt_phase1_dual_write_integration.sql: psql, set_config,
-- request.jwt.claim.sub, transazione con ROLLBACK, esiti PASS/FAIL/SKIP.
-- save_poi_d90_contract_tests.sql è solo una checklist manuale.
--
-- Questo file non inserisce POI, media, assignment, history o report
-- e non modifica profiles.role.
-- I casi 1–12 richiedono id già presenti, passati dall'operatore.
-- Girano nella sessione psql (di solito postgres) con JWT simulato
-- (request.jwt.claim.sub). Verificano auth.uid(), is_td_admin e la logica
-- della funzione. Non sono una richiesta PostgREST e non assumono il ruolo
-- PostgreSQL authenticated (niente SET ROLE).
-- I casi 13–17 leggono solo i privilegi di catalogo:
-- EXECUTE di authenticated, anon, service_role e PUBLIC; UPDATE su pois.
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 ^
--     -c "SELECT set_config('poi_wiki_toggle.confirm','1',false)" ^
--     -c "SELECT set_config('poi_wiki_toggle.poi_id','<POI_ESISTENTE>',false)" ^
--     -c "SELECT set_config('poi_wiki_toggle.admin_all_uid','<UUID>',false)" ^
--     -c "SELECT set_config('poi_wiki_toggle.admin_limited_uid','<UUID>',false)" ^
--     -c "SELECT set_config('poi_wiki_toggle.non_admin_uid','<UUID>',false)" ^
--     -f supabase/tests/set_poi_wikimedia_public_enabled_contract.sql
--
-- Senza confirm=1 non esegue nulla. ROLLBACK finale.
-- Se un id reale manca, il caso resta SKIP.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE poi_wiki_toggle_results (
  case_num int NOT NULL,
  case_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('PASS', 'FAIL', 'SKIP')),
  detail text NOT NULL DEFAULT ''
) ON COMMIT DROP;

CREATE OR REPLACE FUNCTION pg_temp.poi_wiki_record(
  p_case int,
  p_name text,
  p_status text,
  p_detail text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO poi_wiki_toggle_results (case_num, case_name, status, detail)
  VALUES (p_case, p_name, p_status, COALESCE(p_detail, ''));
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.poi_wiki_set_auth(p_uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    format('{"sub":"%s","role":"authenticated","aal":"aal1"}', p_uid),
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.poi_wiki_clear_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$$;

DO $$
DECLARE
  v_confirm text;
  v_poi_id text;
  v_city_id text;
  v_other_city_id text;
  v_missing_id text;
  v_admin_all uuid;
  v_admin_limited uuid;
  v_non_admin uuid;
  v_actor uuid;
  v_uid_text text;
  v_original boolean;
  v_before boolean;
  v_flag boolean;
  v_cols jsonb;
  v_now jsonb;
  v_err text;
  v_auth_exec boolean;
  v_anon_exec boolean;
  v_service_exec boolean;
  v_public_exec boolean;
  v_can_update boolean;
BEGIN
  v_confirm := current_setting('poi_wiki_toggle.confirm', true);
  IF v_confirm IS DISTINCT FROM '1' THEN
    PERFORM pg_temp.poi_wiki_record(
      0, 'guard_confirm', 'SKIP',
      'Impostare poi_wiki_toggle.confirm=1. Nessun test eseguito.'
    );
    RETURN;
  END IF;

  IF to_regprocedure('public.set_poi_wikimedia_public_enabled(text,text,boolean)') IS NULL THEN
    PERFORM pg_temp.poi_wiki_record(
      0, 'guard_function', 'SKIP',
      'Funzione assente. Applicare 20261001200000 sul DB di prova.'
    );
    RETURN;
  END IF;

  v_auth_exec := has_function_privilege(
    'authenticated',
    'public.set_poi_wikimedia_public_enabled(text,text,boolean)',
    'EXECUTE'
  );
  v_service_exec := has_function_privilege(
    'service_role',
    'public.set_poi_wikimedia_public_enabled(text,text,boolean)',
    'EXECUTE'
  );
  v_anon_exec := has_function_privilege(
    'anon',
    'public.set_poi_wikimedia_public_enabled(text,text,boolean)',
    'EXECUTE'
  );
  v_public_exec := has_function_privilege(
    'public',
    'public.set_poi_wikimedia_public_enabled(text,text,boolean)',
    'EXECUTE'
  );
  v_can_update := has_table_privilege('authenticated', 'public.pois', 'UPDATE');

  PERFORM pg_temp.poi_wiki_record(
    13, 'no_update_grant_authenticated',
    CASE WHEN NOT v_can_update THEN 'PASS' ELSE 'FAIL' END,
    'has_table_privilege(authenticated, public.pois, UPDATE)'
  );
  PERFORM pg_temp.poi_wiki_record(
    14, 'execute_authenticated',
    CASE WHEN v_auth_exec THEN 'PASS' ELSE 'FAIL' END,
    format('authenticated=%s', v_auth_exec)
  );
  PERFORM pg_temp.poi_wiki_record(
    15, 'no_execute_anon',
    CASE WHEN NOT v_anon_exec THEN 'PASS' ELSE 'FAIL' END,
    format('anon=%s', v_anon_exec)
  );
  PERFORM pg_temp.poi_wiki_record(
    16, 'no_execute_service_role',
    CASE WHEN NOT v_service_exec THEN 'PASS' ELSE 'FAIL' END,
    format('service_role=%s', v_service_exec)
  );
  PERFORM pg_temp.poi_wiki_record(
    17, 'no_execute_public',
    CASE WHEN NOT v_public_exec THEN 'PASS' ELSE 'FAIL' END,
    format('public=%s', v_public_exec)
  );

  v_poi_id := NULLIF(btrim(current_setting('poi_wiki_toggle.poi_id', true)), '');
  IF v_poi_id IS NULL THEN
    PERFORM pg_temp.poi_wiki_record(1, 'admin_all_true', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(2, 'admin_all_false', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(3, 'admin_limited_true', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(4, 'admin_limited_false', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(5, 'non_admin', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(6, 'unauthenticated', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(7, 'poi_missing', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(8, 'enabled_null', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(9, 'city_mismatch', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(10, 'false_to_true', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(11, 'true_to_false', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    PERFORM pg_temp.poi_wiki_record(12, 'poi_columns_unchanged', 'SKIP', 'poi_id non fornito. Nessun seed POI nel repository.');
    RETURN;
  END IF;

  SELECT p.city_id, p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
  INTO v_city_id, v_original, v_cols
  FROM public.pois p
  WHERE p.id = v_poi_id;

  IF NOT FOUND THEN
    PERFORM pg_temp.poi_wiki_record(
      0, 'guard_poi', 'FAIL',
      'poi_id assente in public.pois. Nessuna riga creata.'
    );
    RETURN;
  END IF;

  SELECT c.id
  INTO v_other_city_id
  FROM public.cities c
  WHERE c.id IS DISTINCT FROM v_city_id
  ORDER BY c.id
  LIMIT 1;

  -- Chiave di lookup soltanto: non viene inserita. Se esiste già, il caso 7 resta SKIP.
  v_missing_id := 'absent-' || pg_catalog.txid_current()::text;
  IF EXISTS (SELECT 1 FROM public.pois p WHERE p.id = v_missing_id) THEN
    v_missing_id := NULL;
  END IF;

  BEGIN
    v_uid_text := NULLIF(btrim(current_setting('poi_wiki_toggle.admin_all_uid', true)), '');
    IF v_uid_text IS NULL THEN
      v_admin_all := NULL;
    ELSE
      v_admin_all := v_uid_text::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_admin_all := NULL;
      PERFORM pg_temp.poi_wiki_record(1, 'admin_all_true', 'FAIL', 'admin_all_uid non è un UUID.');
      PERFORM pg_temp.poi_wiki_record(2, 'admin_all_false', 'FAIL', 'admin_all_uid non è un UUID.');
  END;

  BEGIN
    v_uid_text := NULLIF(btrim(current_setting('poi_wiki_toggle.admin_limited_uid', true)), '');
    IF v_uid_text IS NULL THEN
      v_admin_limited := NULL;
    ELSE
      v_admin_limited := v_uid_text::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_admin_limited := NULL;
      PERFORM pg_temp.poi_wiki_record(3, 'admin_limited_true', 'FAIL', 'admin_limited_uid non è un UUID.');
      PERFORM pg_temp.poi_wiki_record(4, 'admin_limited_false', 'FAIL', 'admin_limited_uid non è un UUID.');
  END;

  BEGIN
    v_uid_text := NULLIF(btrim(current_setting('poi_wiki_toggle.non_admin_uid', true)), '');
    IF v_uid_text IS NULL THEN
      v_non_admin := NULL;
    ELSE
      v_non_admin := v_uid_text::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_non_admin := NULL;
      PERFORM pg_temp.poi_wiki_record(5, 'non_admin', 'FAIL', 'non_admin_uid non è un UUID.');
  END;

  IF v_admin_all IS NULL AND NOT EXISTS (
    SELECT 1 FROM poi_wiki_toggle_results r WHERE r.case_num = 1
  ) THEN
    PERFORM pg_temp.poi_wiki_record(1, 'admin_all_true', 'SKIP', 'admin_all_uid non fornito.');
    PERFORM pg_temp.poi_wiki_record(2, 'admin_all_false', 'SKIP', 'admin_all_uid non fornito.');
  ELSIF v_admin_all IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = v_admin_all AND p.role = 'admin_all'
  ) THEN
    PERFORM pg_temp.poi_wiki_record(
      1, 'admin_all_true', 'FAIL',
      'Il profilo non ha role admin_all. profiles.role non viene modificato.'
    );
    PERFORM pg_temp.poi_wiki_record(
      2, 'admin_all_false', 'FAIL',
      'Il profilo non ha role admin_all. profiles.role non viene modificato.'
    );
    v_admin_all := NULL;
  ELSIF v_admin_all IS NOT NULL THEN
    PERFORM pg_temp.poi_wiki_set_auth(v_admin_all);
    IF auth.uid() IS DISTINCT FROM v_admin_all THEN
      PERFORM pg_temp.poi_wiki_record(
        1, 'admin_all_true', 'FAIL',
        format('auth.uid()=%s: request.jwt.claim.sub non efficace', auth.uid())
      );
      PERFORM pg_temp.poi_wiki_record(2, 'admin_all_false', 'FAIL', 'auth.uid() non efficace.');
      v_admin_all := NULL;
    ELSE
      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, true);
        SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
        INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          1, 'admin_all_true',
          CASE WHEN v_flag IS TRUE AND v_now = v_cols THEN 'PASS' ELSE 'FAIL' END,
          CASE WHEN v_now = v_cols THEN 'flag true' ELSE 'altre colonne cambiate' END
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(1, 'admin_all_true', 'FAIL', SQLERRM);
      END;
      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, false);
        SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
        INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          2, 'admin_all_false',
          CASE WHEN v_flag IS FALSE AND v_now = v_cols THEN 'PASS' ELSE 'FAIL' END,
          CASE WHEN v_now = v_cols THEN 'flag false' ELSE 'altre colonne cambiate' END
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(2, 'admin_all_false', 'FAIL', SQLERRM);
      END;
    END IF;
  END IF;

  IF v_admin_limited IS NULL AND NOT EXISTS (
    SELECT 1 FROM poi_wiki_toggle_results r WHERE r.case_num = 3
  ) THEN
    PERFORM pg_temp.poi_wiki_record(3, 'admin_limited_true', 'SKIP', 'admin_limited_uid non fornito.');
    PERFORM pg_temp.poi_wiki_record(4, 'admin_limited_false', 'SKIP', 'admin_limited_uid non fornito.');
  ELSIF v_admin_limited IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = v_admin_limited AND p.role = 'admin_limited'
  ) THEN
    PERFORM pg_temp.poi_wiki_record(
      3, 'admin_limited_true', 'FAIL',
      'Il profilo non ha role admin_limited. profiles.role non viene modificato.'
    );
    PERFORM pg_temp.poi_wiki_record(
      4, 'admin_limited_false', 'FAIL',
      'Il profilo non ha role admin_limited. profiles.role non viene modificato.'
    );
    v_admin_limited := NULL;
  ELSIF v_admin_limited IS NOT NULL THEN
    PERFORM pg_temp.poi_wiki_set_auth(v_admin_limited);
    IF auth.uid() IS DISTINCT FROM v_admin_limited THEN
      PERFORM pg_temp.poi_wiki_record(
        3, 'admin_limited_true', 'FAIL',
        format('auth.uid()=%s: request.jwt.claim.sub non efficace', auth.uid())
      );
      PERFORM pg_temp.poi_wiki_record(4, 'admin_limited_false', 'FAIL', 'auth.uid() non efficace.');
      v_admin_limited := NULL;
    ELSE
      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, true);
        SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
        INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          3, 'admin_limited_true',
          CASE WHEN v_flag IS TRUE AND v_now = v_cols THEN 'PASS' ELSE 'FAIL' END,
          CASE WHEN v_now = v_cols THEN 'flag true' ELSE 'altre colonne cambiate' END
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(3, 'admin_limited_true', 'FAIL', SQLERRM);
      END;
      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, false);
        SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
        INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          4, 'admin_limited_false',
          CASE WHEN v_flag IS FALSE AND v_now = v_cols THEN 'PASS' ELSE 'FAIL' END,
          CASE WHEN v_now = v_cols THEN 'flag false' ELSE 'altre colonne cambiate' END
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(4, 'admin_limited_false', 'FAIL', SQLERRM);
      END;
    END IF;
  END IF;

  v_actor := COALESCE(v_admin_all, v_admin_limited);

  IF v_non_admin IS NULL AND NOT EXISTS (
    SELECT 1 FROM poi_wiki_toggle_results r WHERE r.case_num = 5
  ) THEN
    PERFORM pg_temp.poi_wiki_record(5, 'non_admin', 'SKIP', 'non_admin_uid non fornito.');
  ELSIF v_non_admin IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = v_non_admin
  ) THEN
    PERFORM pg_temp.poi_wiki_record(5, 'non_admin', 'FAIL', 'UUID assente in profiles.');
  ELSIF v_non_admin IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_non_admin AND p.role IN ('admin_all', 'admin_limited')
  ) THEN
    PERFORM pg_temp.poi_wiki_record(
      5, 'non_admin', 'FAIL',
      'L''utente fornito è admin. profiles.role non viene modificato.'
    );
  ELSIF v_non_admin IS NOT NULL THEN
    PERFORM pg_temp.poi_wiki_set_auth(v_non_admin);
    IF auth.uid() IS DISTINCT FROM v_non_admin THEN
      PERFORM pg_temp.poi_wiki_record(
        5, 'non_admin', 'FAIL',
        format('auth.uid()=%s: request.jwt.claim.sub non efficace', auth.uid())
      );
    ELSE
      SELECT p.wikimedia_public_enabled INTO v_before FROM public.pois p WHERE p.id = v_poi_id;
      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, NOT v_before);
        PERFORM pg_temp.poi_wiki_record(5, 'non_admin', 'FAIL', 'atteso rifiuto');
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
        INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          5, 'non_admin',
          CASE
            WHEN v_err = 'Permessi admin richiesti.' AND v_flag IS NOT DISTINCT FROM v_before AND v_now = v_cols
            THEN 'PASS' ELSE 'FAIL'
          END,
          v_err
        );
      END;
    END IF;
  END IF;

  PERFORM pg_temp.poi_wiki_clear_auth();
  IF auth.uid() IS NOT NULL THEN
    PERFORM pg_temp.poi_wiki_record(
      6, 'unauthenticated', 'FAIL',
      format('auth.uid()=%s dopo clear: la chiamata non è senza autenticazione', auth.uid())
    );
  ELSE
    SELECT p.wikimedia_public_enabled INTO v_before FROM public.pois p WHERE p.id = v_poi_id;
    BEGIN
      PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, NOT v_before);
      PERFORM pg_temp.poi_wiki_record(6, 'unauthenticated', 'FAIL', 'atteso rifiuto');
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      SELECT p.wikimedia_public_enabled INTO v_flag FROM public.pois p WHERE p.id = v_poi_id;
      PERFORM pg_temp.poi_wiki_record(
        6, 'unauthenticated',
        CASE
          WHEN v_err = 'Autenticazione richiesta.' AND v_flag IS NOT DISTINCT FROM v_before
          THEN 'PASS' ELSE 'FAIL'
        END,
        v_err
      );
    END;
  END IF;

  IF v_actor IS NULL THEN
    PERFORM pg_temp.poi_wiki_record(7, 'poi_missing', 'SKIP', 'Serve un admin_all o admin_limited reale.');
    PERFORM pg_temp.poi_wiki_record(8, 'enabled_null', 'SKIP', 'Serve un admin_all o admin_limited reale.');
    PERFORM pg_temp.poi_wiki_record(9, 'city_mismatch', 'SKIP', 'Serve un admin_all o admin_limited reale.');
    PERFORM pg_temp.poi_wiki_record(10, 'false_to_true', 'SKIP', 'Serve un admin_all o admin_limited reale.');
    PERFORM pg_temp.poi_wiki_record(11, 'true_to_false', 'SKIP', 'Serve un admin_all o admin_limited reale.');
    PERFORM pg_temp.poi_wiki_record(12, 'poi_columns_unchanged', 'SKIP', 'Serve un admin_all o admin_limited reale.');
  ELSE
    PERFORM pg_temp.poi_wiki_set_auth(v_actor);
    IF auth.uid() IS DISTINCT FROM v_actor THEN
      PERFORM pg_temp.poi_wiki_record(7, 'poi_missing', 'FAIL', 'auth.uid() non efficace.');
      PERFORM pg_temp.poi_wiki_record(8, 'enabled_null', 'FAIL', 'auth.uid() non efficace.');
      PERFORM pg_temp.poi_wiki_record(9, 'city_mismatch', 'FAIL', 'auth.uid() non efficace.');
      PERFORM pg_temp.poi_wiki_record(10, 'false_to_true', 'FAIL', 'auth.uid() non efficace.');
      PERFORM pg_temp.poi_wiki_record(11, 'true_to_false', 'FAIL', 'auth.uid() non efficace.');
      PERFORM pg_temp.poi_wiki_record(12, 'poi_columns_unchanged', 'FAIL', 'auth.uid() non efficace.');
    ELSE
      IF v_missing_id IS NULL THEN
        PERFORM pg_temp.poi_wiki_record(7, 'poi_missing', 'SKIP', 'La chiave di lookup esiste già. Nessuna riga creata.');
      ELSE
        BEGIN
          PERFORM public.set_poi_wikimedia_public_enabled(v_missing_id, v_city_id, true);
          PERFORM pg_temp.poi_wiki_record(7, 'poi_missing', 'FAIL', 'atteso rifiuto');
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
          PERFORM pg_temp.poi_wiki_record(
            7, 'poi_missing',
            CASE WHEN v_err = 'POI non trovato.' THEN 'PASS' ELSE 'FAIL' END,
            v_err
          );
        END;
      END IF;

      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, NULL);
        PERFORM pg_temp.poi_wiki_record(8, 'enabled_null', 'FAIL', 'atteso rifiuto');
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        PERFORM pg_temp.poi_wiki_record(
          8, 'enabled_null',
          CASE WHEN v_err = 'p_enabled obbligatorio.' THEN 'PASS' ELSE 'FAIL' END,
          v_err
        );
      END;

      IF v_other_city_id IS NULL THEN
        PERFORM pg_temp.poi_wiki_record(
          9, 'city_mismatch', 'SKIP',
          'Nel DB di prova non c''è una seconda città reale. Nessun id inventato.'
        );
      ELSE
        SELECT p.wikimedia_public_enabled INTO v_before FROM public.pois p WHERE p.id = v_poi_id;
        BEGIN
          PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_other_city_id, NOT v_before);
          PERFORM pg_temp.poi_wiki_record(9, 'city_mismatch', 'FAIL', 'atteso rifiuto');
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
          SELECT p.wikimedia_public_enabled, to_jsonb(p) - 'wikimedia_public_enabled'
          INTO v_flag, v_now FROM public.pois p WHERE p.id = v_poi_id;
          PERFORM pg_temp.poi_wiki_record(
            9, 'city_mismatch',
            CASE
              WHEN v_err = 'Il POI non appartiene alla città indicata.'
                AND v_flag IS NOT DISTINCT FROM v_before
                AND v_now = v_cols
              THEN 'PASS' ELSE 'FAIL'
            END,
            v_err
          );
        END;
      END IF;

      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, false);
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, true);
        SELECT p.wikimedia_public_enabled INTO v_flag FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          10, 'false_to_true',
          CASE WHEN v_flag IS TRUE THEN 'PASS' ELSE 'FAIL' END,
          'transizione del flag; le altre colonne sono il caso 12'
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(10, 'false_to_true', 'FAIL', SQLERRM);
      END;

      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, false);
        SELECT p.wikimedia_public_enabled INTO v_flag FROM public.pois p WHERE p.id = v_poi_id;
        PERFORM pg_temp.poi_wiki_record(
          11, 'true_to_false',
          CASE WHEN v_flag IS FALSE THEN 'PASS' ELSE 'FAIL' END,
          'transizione del flag; le altre colonne sono il caso 12'
        );
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(11, 'true_to_false', 'FAIL', SQLERRM);
      END;

      SELECT to_jsonb(p) - 'wikimedia_public_enabled'
      INTO v_now FROM public.pois p WHERE p.id = v_poi_id;
      PERFORM pg_temp.poi_wiki_record(
        12, 'poi_columns_unchanged',
        CASE WHEN v_now = v_cols THEN 'PASS' ELSE 'FAIL' END,
        'jsonb della riga escluso wikimedia_public_enabled, rispetto allo snapshot iniziale'
      );

      BEGIN
        PERFORM public.set_poi_wikimedia_public_enabled(v_poi_id, v_city_id, v_original);
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.poi_wiki_record(0, 'restore_flag', 'FAIL', SQLERRM);
      END;
    END IF;
  END IF;
END;
$$;

SELECT case_num, case_name, status, detail
FROM poi_wiki_toggle_results
ORDER BY case_num;

SELECT
  CASE
    WHEN count(*) FILTER (WHERE status = 'FAIL') > 0 THEN 'FAIL'
    WHEN count(*) FILTER (WHERE status = 'SKIP') > 0 THEN 'SKIP'
    WHEN count(*) FILTER (WHERE status = 'PASS') = 0 THEN 'SKIP'
    ELSE 'PASS'
  END AS suite_status,
  count(*) FILTER (WHERE status = 'PASS') AS pass_n,
  count(*) FILTER (WHERE status = 'FAIL') AS fail_n,
  count(*) FILTER (WHERE status = 'SKIP') AS skip_n,
  CASE
    WHEN count(*) FILTER (WHERE status = 'FAIL') > 0 THEN 'almeno un caso FAIL'
    WHEN count(*) FILTER (WHERE status = 'SKIP') > 0 THEN 'suite incompleta: presenti casi SKIP'
    WHEN count(*) FILTER (WHERE status = 'PASS') = 0 THEN 'suite incompleta: nessun caso eseguito'
    ELSE 'tutti i casi PASS'
  END AS suite_detail
FROM poi_wiki_toggle_results;

ROLLBACK;
