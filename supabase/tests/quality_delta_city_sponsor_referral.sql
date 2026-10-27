-- =============================================================================
-- NOT A MIGRATION. Non applicare con supabase db push e non eseguirlo sul
-- database remoto.
--
-- Integration harness delle tre candidate:
--   20261012190000_public_city_visibility_visits_nine_choices.sql
--   20261012191000_sponsor_request_fields_and_quota.sql
--   20261013180000_referral_program_nonexpiring_credits.sql
--
-- Prerequisito: quelle tre migration sono già applicate su un database di prova
-- che contiene anche la storia precedente. public.ai_credit_source.referral
-- deve già esistere. I ruoli anon e authenticated devono esistere.
--
-- Questo file, in questa attività, NON è stato eseguito. Non c'è un Postgres
-- locale su cui lanciarlo e il remoto è fuori scope. I controlli statici sono
-- in server/domain/candidateMigrationGuards.test.ts.
--
-- ROLLBACK annulla le scritture SQL di questa transazione. Non annulla
-- effetti esterni, se una funzione chiamata ne produce. Le funzioni di questo
-- file non sono state dimostrate prive di quegli effetti.
-- qd.confirm deve essere il nome del database, e quel nome deve essere
-- td_scratch_ seguito da lettere minuscole, cifre o underscore.
-- La connessione deve essere locale. Un database di produzione non passa.
--
-- La classificazione SELECT e la chiusura delle letture chiamano
-- int09_select_policy_disposition e int09_close_public_entity_reads.
-- Una sola transazione non dimostra le corse. Le prove a due sessioni
-- restano da eseguire a parte, su un PostgreSQL 17 sacrificabile, e non
-- sono coperte da questo file. Ordine dei lock atteso: riga media_assets,
-- poi piani per uuid, poi POI per id.
--
-- Fixture, identificate dal prefisso qd_cc_ e da uuid propri:
--   piano P, pricing V, città C, POI A < POI B, sponsor approved S su A
--   con V, cinque media origin_type sponsor e cinque assegnazioni
--   current/active su A. Un sesto asset M collegato current/active sia
--   ad A sia a B non è ammesso dal limite 5: il caso multi-POI usa un
--   asset N current/active solo su B, con uno sponsor approved distinto
--   su B e sullo stesso piano P.
--
-- Caso 1. Tre assegnazioni current/active su POI A, piano LOCAL_ACTIVITY
-- (massimo 5). La quarta è valida prima del cambio e non lo è dopo
-- TOUR_GUIDE (massimo 3). Cinque assegnazioni non servono: la sesta
-- fallirebbe anche senza il cambio piano.
--   A: BEGIN;
--      SELECT pg_advisory_xact_lock(hashtext(
--        'sponsor_media_quota:plan:' || '<plan_uuid>'));
--   B: BEGIN;
--      INSERT INTO public.entity_image_assignments (
--        media_asset_id, entity_type, entity_id, city_id,
--        assignment_role, assignment_status, is_current)
--      VALUES ('<asset_uuid>', 'poi', '<poi_a>', '<city>',
--        'gallery', 'active', true);
--   Terza sessione: pg_blocking_pids(<pid_B>) contiene <pid_A>.
--   A: UPDATE public.plans SET type = 'TOUR_GUIDE' WHERE id = '<plan_uuid>';
--      COMMIT;
--   B: SQLSTATE P0001 e messaggio che contiene «superata» e «massimo 3».
--      Le assegnazioni current/active sponsor su A restano 3.
--      23505 o un altro «superata» senza «massimo 3» è un fallimento
--      del protocollo. 40001 non è atteso: B rilegge lo stesso piano.
--
-- Caso 2. Prima di A, B committa un POI C sullo stesso piano con 4
-- assegnazioni. A parte da LOCAL_ACTIVITY e tre assegnazioni sul POI A.
--   B: BEGIN; inserisce C, sponsor approved, 4 assegnazioni; COMMIT;
--   A: BEGIN;
--      UPDATE public.plans SET type = 'TOUR_GUIDE' WHERE id = '<plan_uuid>';
--   enforce_plan_type_sponsor_quota prende il lock di piano prima della
--   SELECT DISTINCT dei POI. In READ COMMITTED la lista include C.
--   Atteso: P0001, «superata», «massimo 3», type resta LOCAL_ACTIVITY.
--   Se A committasse TOUR_GUIDE, il protocollo sarebbe fallito.
--
-- Caso 3. Lo spostamento di poi_id con assegnazioni correnti è rifiutato
-- («non univoco») e non va usato come fixture dei lock. Fixture: sponsor
-- S approved su A, nessuna assegnazione current/active, destinazione B
-- senza assegnazioni. Il massimo non scende sotto le righe esistenti.
--   A: BEGIN;
--      UPDATE public.sponsors SET poi_id = '<poi_b>' WHERE id = '<sponsor>';
--   La funzione prende prima i lock di piano ordinati, poi i POI ordinati.
--   B: BEGIN;
--      UPDATE public.plans SET type = 'REGIONAL_ACTIVITY'
--      WHERE id = '<plan_uuid>';
--   Atteso: una sessione attende, pg_blocking_pids lo mostra, entrambe
--   fanno COMMIT. 40P01 è fallimento. 40001 è atteso solo se, dopo i
--   lock, l'insieme dei piani è diverso da quello bloccato: si ripete
--   l'istruzione, non si fa un lock di piano dopo un lock di POI.
--
-- Caso 4, due sessioni su consume_ai_credits, resta esterno e non è stato
-- eseguito. La funzione prende prima pg_advisory_xact_lock
-- ('ai_consume_user:' || user_id), poi FOR UPDATE sulla riga con
-- remaining > 0, e decrementa solo se remaining > 0. La seconda sessione
-- attende il lock di transazione. Atteso: una sola risposta source
-- extra_credits su quella riga, saldo 0, l'altra CREDITS_EXHAUSTED.
-- Saldo negativo o due extra_credits sulla stessa riga sono fallimento.
-- Questo file verifica solo la seconda chiamata nella stessa sessione.
-- Due chiamate nella stessa sessione non sono una prova di concorrenza.
--
-- Caso 5, due sessioni sullo stesso invitato, resta esterno e non è stato
-- eseguito. Entrambe chiamano redeem_referral_code con lo stesso codice.
-- Atteso: un solo grant, referred_by valorizzato una volta, due righe
-- user_ai_credits con source referral. L'altra sessione riceve già
-- riscattato, SQLSTATE non è un vincolo diverso da
-- referral_credit_grants_invitee_unique. 40P01 è fallimento.
--
-- Copertura delete_city_admin, non le 512 combinazioni. Ogni opzione ha
-- il ramo predefinito e il ramo esplicito opposto, più un incrocio:
--   keepPOIs predefinito false: città vuota hard-delete; POI presente soft
--     solo se keepPOIs true; POI eliminato se false e non restano altre righe.
--   keepEvents predefinito true conserva l'evento in soft-delete; false
--     cancella evento e città se non restano residui.
--   keepPeople false con report pending abortisce e non cancella nulla.
--   keepServices, keepGuides, keepOperators, keepShops: true conserva e
--     forza il soft-delete; false rimuove la riga e consente l'hard-delete.
--   keepCommunityPhotos true marca la submission city_deleted e resta in
--     soft-delete; false la cancella.
--   keepPatronPhotos true è il suggerimento patrono già presente; false
--     cancella il suggerimento.
--   keepUserPhotos false equivale ai due flag foto false.
--   Incrocio: evento conservato e POI non conservato sulla stessa città:
--     il POI sparisce, l'evento resta, soft-delete, content_reports.city_id
--     non si azzera. Sull'hard-delete city_id del report si azzera.
--   Le visite non si cancellano in nessuno dei due percorsi.
--
-- ON DELETE non documentato nel repository per pois, city_events,
-- city_guides, city_services, city_people, photo_submissions,
-- sponsors.city_id, sponsor_requests, pois_staging. Lo script interroga
-- pg_constraint e solleva un prerequisito se il vincolo manca o se
-- l'azione non è stata letta; non sceglie un'azione.
--
-- Query di catalogo, da leggere e non da interpretare come attesa:
--   SELECT n.nspname, c.relname, con.conname,
--          pg_get_constraintdef(con.oid) AS def
--   FROM pg_constraint con
--   JOIN pg_class c ON c.oid = con.conrelid
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE con.contype = 'f'
--     AND con.confrelid = 'public.cities'::regclass
--   ORDER BY 1, 2, 3;
--
-- Le sette tabelle sono controllate sul catalogo. Comando, ruoli,
-- permissività e presenza di WITH CHECK sono campi di pg_policy.
-- pg_get_expr è solo diagnostico: una stringa uguale non dimostra
-- l'equivalenza del predicato, e una stringa diversa non dimostra
-- un difetto. ALL, USING true e OR true fermano il file come difetto
-- osservabile. Ogni altra rappresentazione non nota è un prerequisito
-- di catalogo, non un verdetto sulla candidata.
-- Questo file non elimina quelle policy. Il catalogo reale non è stato letto.
--
-- Con ON_ERROR_STOP uno statement fallito chiude psql prima del ROLLBACK
-- scritto in fondo. La transazione è comunque annullata: non c'è COMMIT e
-- la sessione che esce scarta la transazione aperta. Non eseguire COMMIT.
-- Non lanciare questo file su un database non sacrificabile.
-- Il solo SQL non dimostra che l'istanza sia sacrificabile.
-- inet_server_addr() 127.0.0.1 passa anche con un tunnel o un proxy locale
-- verso un server remoto: l'indirizzo visto dal server può essere localhost.
-- Controllo esterno obbligatorio, prima di impostare qd.confirm:
--   1. Nessun tunnel, proxy o port-forward sulla porta usata da psql.
--   2. initdb ha creato un cluster il cui data_directory contiene td_scratch.
--   3. SHOW data_directory, letto su quel server, conferma quel percorso.
--   4. Il database si chiama td_scratch_<nome> e non è un clone di produzione.
-- data_directory è un parametro del server, non un GUC di sessione.
-- Contenerci td_scratch è un requisito necessario, non la prova che
-- il cluster sia quello sacrificabile. Un percorso remoto con lo stesso
-- testo, un clone o un proxy locale lo soddisfano ugualmente.
-- In quel caso non eseguire il file.
--
-- ROLLBACK annulla le scritture della transazione. Non annulla nextval,
-- effetti di un trigger su auth.users, né chiamate esterne raggiunte
-- da funzioni invocate da quel trigger. La scansione dei corpi e delle
-- dipendenze dirette non dimostra l'assenza di SQL dinamico.
-- Le fixture usano gen_random_uuid(). Un trigger non presente nel
-- repository può comunque consumare una sequenza.
--
-- Esecuzione, solo dopo quel controllo, con ON_ERROR_STOP:
--
--   psql "postgresql://127.0.0.1/td_scratch_qd" -v ON_ERROR_STOP=1 ^
--     -c "SELECT set_config('qd.confirm', current_database(), false), set_config('qd.effects_ack', current_database() || ':effetti-esterni-verificati', false)" ^
--     -f supabase/tests/quality_delta_city_sponsor_referral.sql
--
-- qd.effects_ack si imposta solo dopo aver letto, su quel server, i trigger
-- di auth.users e di public.profiles e le funzioni chiamate da
-- delete_city_admin. Senza quel valore il file si ferma prima degli insert.
-- Il valore non dimostra l'ispezione e non dimostra l'assenza di effetti esterni.
--
-- -c e -f sono lo stesso processo psql e quindi la stessa sessione.
-- Il terzo argomento false tiene qd.confirm per quella sessione.
-- Un altro client non lo vede.
-- ROLLBACK non annulla effetti esterni. Questo file non è stato eseguito.
--
-- La transazione termina con ROLLBACK. Non eseguire COMMIT.
-- =============================================================================

BEGIN;

DO $qd_gate$
DECLARE
  v_addr inet := inet_server_addr();
  v_data text;
BEGIN
  IF v_addr IS NOT NULL
     AND NOT (
       v_addr = '127.0.0.1'::inet
       OR v_addr = '::1'::inet
       OR (family(v_addr) = 4 AND v_addr << '127.0.0.0/8'::inet)
     ) THEN
    RAISE EXCEPTION
      'Non eseguito: la connessione non è locale (%). Nessuna fixture è stata scritta.',
      v_addr;
  END IF;
  IF current_database() !~ '^td_scratch_[a-z0-9_]+$'
     OR current_setting('qd.confirm', true) IS DISTINCT FROM current_database() THEN
    RAISE EXCEPTION
      'Non eseguito. Creare un database locale td_scratch_<nome> e impostare qd.confirm a current_database() nella stessa sessione. Database attuale: %.',
      current_database();
  END IF;
  BEGIN
    v_data := current_setting('data_directory');
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE EXCEPTION
        'Non eseguito: servono i privilegi per leggere data_directory. Il nome del database non basta.';
  END;
  IF position('td_scratch' IN lower(v_data)) = 0 THEN
    RAISE EXCEPTION
      'Non eseguito: data_directory (%) non contiene td_scratch. È un requisito necessario, non la prova che il cluster sia sacrificabile.',
      v_data;
  END IF;
END;
$qd_gate$;

DO $qd$
DECLARE
  v_admin uuid := gen_random_uuid();
  v_invitee uuid := gen_random_uuid();
  v_invitee_b uuid := gen_random_uuid();
  v_inviter uuid := gen_random_uuid();
  v_stranger uuid := gen_random_uuid();
  v_city text := 'qd_empty_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_kept text := 'qd_kept_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_trigger text := 'qd_trig_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_photo_trigger uuid := gen_random_uuid();
  v_poi_kept text := 'qd_poi_kept_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_two text := 'qd_poi_two_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_missing text := 'qd_poi_miss_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_cross text := 'qd_poi_cross_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_limit text := 'qd_poi_limit_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_origin text := 'qd_poi_origin_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_report uuid := gen_random_uuid();
  v_plan uuid := gen_random_uuid();
  v_plan_show uuid := gen_random_uuid();
  v_price uuid := gen_random_uuid();
  v_price_show uuid := gen_random_uuid();
  v_message text;
  v_saved_code text;
  v_json json;
  v_count integer;
  v_flash integer;
  v_usage integer;
  v_soon uuid := gen_random_uuid();
  v_later uuid := gen_random_uuid();
  v_expired uuid := gen_random_uuid();
  v_roles oid[];
  v_using text;
  v_check text;
  v_public_ins text;
  v_public_upd text;
  v_public_del text;
  v_using_ins text;
  v_roles_upd text;
  v_collision text;
  v_i integer;
  v_asset uuid;
  v_assignment uuid;
  v_fill uuid;
  v_pol record;
  v_role_sql text;
  v_using_sql text;
  v_check_sql text;
  v_unresolved integer;
  v_names text[] := ARRAY[NULL, NULL, NULL];
  v_suffixes text[] := ARRAY['ins', 'upd', 'del'];
  v_n integer;
  v_candidate text;
  v_cmd integer;
  v_saved_role text;
  v_auth_oid oid;
  v_base text;
  v_parse record;
  v_visible integer;
  v_city_pub text := 'qd_pub_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_draft text := 'qd_draft_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_mod text := 'qd_mod_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_block text := 'qd_block_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_other text := 'qd_other_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_drop text := 'qd_drop_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_event text := 'qd_event_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_event_del text := 'qd_evdel_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_event text := gen_random_uuid()::text;
  v_event_del text := gen_random_uuid()::text;
  v_sqlstate text;
  v_slot_assignment uuid;
  v_fill_asset uuid;
  v_origin_asset uuid;
  v_origin_assignment uuid;
  v_over_asset uuid;
  v_city_svc text := 'qd_svc_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_svc_del text := 'qd_svcd_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_guide_del text := 'qd_guided_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_op_del text := 'qd_opdel_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_shop text := 'qd_shop_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_shop_del text := 'qd_shopd_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_photo text := 'qd_photo_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_photo_del text := 'qd_photod_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_patron_del text := 'qd_patd_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_city_mix text := 'qd_mix_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_svc text := gen_random_uuid()::text;
  v_svc_del text := gen_random_uuid()::text;
  v_guide_del text := gen_random_uuid()::text;
  v_op_del text := gen_random_uuid()::text;
  v_shop text := gen_random_uuid()::text;
  v_shop_del text := gen_random_uuid()::text;
  v_photo uuid := gen_random_uuid();
  v_photo_del uuid := gen_random_uuid();
  v_patron_del uuid := gen_random_uuid();
  v_mix_event text := gen_random_uuid()::text;
  v_mix_poi text := 'qd_mixpoi_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_mix_report uuid := gen_random_uuid();
  v_hard_report uuid := gen_random_uuid();
  v_zero uuid := gen_random_uuid();
  v_null_source uuid := gen_random_uuid();
  v_fk_name text;
  v_fk_def text;
  v_poi_pub text := 'qd_poi_pub_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_draft text := 'qd_poi_draft_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_hidden text := 'qd_poi_hidden_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_fit text := 'qd_poi_fit_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_poi_drop text := 'qd_poi_drop_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_suggestion uuid := gen_random_uuid();
  v_person uuid := gen_random_uuid();
  v_person_report uuid := gen_random_uuid();
  v_plan_guide uuid := gen_random_uuid();
  v_price_guide uuid := gen_random_uuid();
  v_price_ai uuid := gen_random_uuid();
  v_sponsor uuid;
  v_sponsor_keep uuid;
  v_sponsor_extra uuid;
  v_sponsor_shop uuid;
  v_ai uuid := gen_random_uuid();
  v_guest uuid := gen_random_uuid();
  v_bonus uuid := gen_random_uuid();
  v_had_stop boolean;
  v_had_enabled boolean;
  v_stop jsonb;
  v_enabled jsonb;
BEGIN
  IF to_regprocedure('public.delete_city_admin(text,jsonb)') IS NULL
     OR to_regprocedure('public.assert_sponsor_media_quota(text,text,integer,uuid)') IS NULL
     OR to_regprocedure('public.enforce_sponsor_origin_quota()') IS NULL
     OR to_regprocedure('public.redeem_referral_code(text)') IS NULL
     OR to_regprocedure('public.consume_ai_credits(uuid,text,text,text)') IS NULL
     OR to_regprocedure('public.int09_select_policy_disposition(text,text,oid[],text,text)') IS NULL
     OR to_regprocedure('public.int09_close_public_entity_reads(text[])') IS NULL
     OR to_regprocedure('public.assert_poi_sponsor_assignments_fit(text,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION
      'Funzioni candidate assenti. Applicare le tre migration su un database di prova prima di questo script.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ai_credit_source'
      AND e.enumlabel = 'referral'
  ) THEN
    RAISE EXCEPTION 'Prerequisito enum: public.ai_credit_source non contiene referral.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'Prerequisito ruoli: anon, authenticated e service_role devono esistere.';
  END IF;

  IF to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'Prerequisito: auth.uid() non è nel catalogo.';
  END IF;
  IF pg_get_functiondef('auth.uid()'::regprocedure) NOT LIKE '%request.jwt.claim.sub%' THEN
    RAISE EXCEPTION
      'Prerequisito: auth.uid() non legge request.jwt.claim.sub. Il corpo non viene reinterpretato.';
  END IF;

  IF to_regprocedure('public.is_service_role()') IS NULL THEN
    RAISE EXCEPTION 'Prerequisito: public.is_service_role() non è nel catalogo.';
  END IF;
  IF pg_get_functiondef('public.is_service_role()'::regprocedure) NOT LIKE '%request.jwt.claims%' THEN
    RAISE EXCEPTION
      'Prerequisito: public.is_service_role() non legge request.jwt.claims.';
  END IF;
  IF to_regprocedure('public.get_current_ai_quota(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Prerequisito: public.get_current_ai_quota(uuid) non è nel catalogo.';
  END IF;

  IF NOT has_function_privilege('anon', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_current_ai_quota(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_current_ai_quota(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_current_ai_quota(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION
      'Prerequisito privilegi: i grant AI non coincidono con 20260530120000 dopo CREATE OR REPLACE.';
  END IF;

  RAISE NOTICE 'qd section: policy_catalog';
  IF (
    SELECT count(*)
    FROM pg_policy pol
    JOIN pg_class rel ON rel.oid = pol.polrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    JOIN (
      VALUES
        ('pois', 'pois_public_read_published_city'),
        ('pois', 'pois_authenticated_read_published_city'),
        ('shops', 'shops_public_read_published_city'),
        ('shops', 'shops_authenticated_read_published_city'),
        ('city_events', 'city_events_public_read_published_city'),
        ('city_events', 'city_events_authenticated_read_published_city'),
        ('city_services', 'city_services_public_read_published_city'),
        ('city_services', 'city_services_authenticated_read_published_city'),
        ('city_guides', 'city_guides_public_read_published_city'),
        ('city_guides', 'city_guides_authenticated_read_published_city'),
        ('city_tour_operators', 'city_tour_operators_public_read_published_city'),
        ('city_tour_operators', 'city_tour_operators_authenticated_read_published_city'),
        ('city_people', 'city_people_public_read_published_city'),
        ('city_people', 'city_people_authenticated_read_published_city')
    ) AS expected(table_name, policy_name)
      ON expected.table_name = rel.relname
     AND expected.policy_name = pol.polname
    WHERE ns.nspname = 'public'
  ) IS DISTINCT FROM 14 THEN
    RAISE EXCEPTION 'Prerequisito: le 14 policy di lettura della candidata città non sono tutte presenti.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('pois', 'pois_public_read_published_city', 'anon'),
        ('shops', 'shops_public_read_published_city', 'anon'),
        ('city_events', 'city_events_public_read_published_city', 'anon'),
        ('city_services', 'city_services_public_read_published_city', 'anon'),
        ('city_guides', 'city_guides_public_read_published_city', 'anon'),
        ('city_tour_operators', 'city_tour_operators_public_read_published_city', 'anon'),
        ('city_people', 'city_people_public_read_published_city', 'anon'),
        ('pois', 'pois_authenticated_read_published_city', 'authenticated'),
        ('shops', 'shops_authenticated_read_published_city', 'authenticated'),
        ('city_events', 'city_events_authenticated_read_published_city', 'authenticated'),
        ('city_services', 'city_services_authenticated_read_published_city', 'authenticated'),
        ('city_guides', 'city_guides_authenticated_read_published_city', 'authenticated'),
        ('city_tour_operators', 'city_tour_operators_authenticated_read_published_city', 'authenticated'),
        ('city_people', 'city_people_authenticated_read_published_city', 'authenticated')
    ) AS expected(table_name, policy_name, role_name)
    LEFT JOIN pg_class AS rel
      ON rel.relname = expected.table_name
    LEFT JOIN pg_namespace AS ns
      ON ns.oid = rel.relnamespace
     AND ns.nspname = 'public'
    LEFT JOIN pg_policy AS pol
      ON pol.polrelid = rel.oid
     AND pol.polname = expected.policy_name
    LEFT JOIN pg_roles AS role_row
      ON role_row.rolname = expected.role_name
    WHERE ns.oid IS NULL
       OR pol.oid IS NULL
       OR role_row.oid IS NULL
       OR pol.polpermissive IS DISTINCT FROM true
       OR pol.polcmd IS DISTINCT FROM 'r'
       OR pol.polwithcheck IS NOT NULL
       OR pol.polroles IS DISTINCT FROM ARRAY[role_row.oid]
  ) THEN
    RAISE EXCEPTION
      'Difetto di catalogo: una policy col nome atteso non è SELECT permissiva, non ha il ruolo atteso, oppure ha WITH CHECK. Nessuna policy è stata modificata.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('pois', 'pois_public_read_published_city', 'anon'),
        ('shops', 'shops_public_read_published_city', 'anon'),
        ('city_events', 'city_events_public_read_published_city', 'anon'),
        ('city_services', 'city_services_public_read_published_city', 'anon'),
        ('city_guides', 'city_guides_public_read_published_city', 'anon'),
        ('city_tour_operators', 'city_tour_operators_public_read_published_city', 'anon'),
        ('city_people', 'city_people_public_read_published_city', 'anon'),
        ('pois', 'pois_authenticated_read_published_city', 'authenticated'),
        ('shops', 'shops_authenticated_read_published_city', 'authenticated'),
        ('city_events', 'city_events_authenticated_read_published_city', 'authenticated'),
        ('city_services', 'city_services_authenticated_read_published_city', 'authenticated'),
        ('city_guides', 'city_guides_authenticated_read_published_city', 'authenticated'),
        ('city_tour_operators', 'city_tour_operators_authenticated_read_published_city', 'authenticated'),
        ('city_people', 'city_people_authenticated_read_published_city', 'authenticated')
    ) AS expected(table_name, policy_name, role_name)
    LEFT JOIN pg_class AS rel
      ON rel.relname = expected.table_name
    LEFT JOIN pg_namespace AS ns
      ON ns.oid = rel.relnamespace
     AND ns.nspname = 'public'
    LEFT JOIN pg_policy AS pol
      ON pol.polrelid = rel.oid
     AND pol.polname = expected.policy_name
    WHERE pg_get_expr(pol.polqual, pol.polrelid) NOT LIKE '%city_is_publicly_visible(city_id)%'
       OR lower(btrim(pg_get_expr(pol.polqual, pol.polrelid))) = 'true'
       OR (
         expected.role_name = 'anon'
         AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%is_td_admin%'
       )
       OR (
         expected.role_name = 'authenticated'
         AND pg_get_expr(pol.polqual, pol.polrelid) NOT LIKE '%is_td_admin%'
       )
       OR (
         expected.table_name IN ('pois', 'city_people')
         AND pg_get_expr(pol.polqual, pol.polrelid) NOT LIKE '%status = ''published''%'
       )
       OR (
         expected.table_name NOT IN ('pois', 'city_people')
         AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%status%'
       )
  ) THEN
    RAISE EXCEPTION
      'Prerequisito catalogo: pg_get_expr di una policy col nome atteso non contiene i frammenti noti. Il testo non dimostra né l''equivalenza né un difetto. Nessuna policy è stata modificata.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy pol
    WHERE pol.polrelid = ANY (ARRAY[
      to_regclass('public.pois'),
      to_regclass('public.shops'),
      to_regclass('public.city_events'),
      to_regclass('public.city_services'),
      to_regclass('public.city_guides'),
      to_regclass('public.city_tour_operators'),
      to_regclass('public.city_people')
    ]::oid[])
      AND pol.polpermissive
      AND (
        pol.polcmd = '*'
        OR lower(btrim(COALESCE(pg_get_expr(pol.polqual, pol.polrelid), ''))) = 'true'
        OR lower(replace(COALESCE(pg_get_expr(pol.polqual, pol.polrelid), ''), ' ', '')) LIKE '%ortrue%'
      )
  ) THEN
    RAISE EXCEPTION
      'Difetto: sulle sette tabelle resta una policy permissiva ALL, USING true, oppure un OR true. Il controllo su OR true è una guardia testuale, non un parser. Nessuna policy è stata modificata.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy pol
    WHERE pol.polrelid = ANY (ARRAY[
      to_regclass('public.pois'),
      to_regclass('public.shops'),
      to_regclass('public.city_events'),
      to_regclass('public.city_services'),
      to_regclass('public.city_guides'),
      to_regclass('public.city_tour_operators'),
      to_regclass('public.city_people')
    ]::oid[])
      AND pol.polpermissive
      AND pol.polcmd = 'r'
      AND lower(replace(COALESCE(pg_get_expr(pol.polqual, pol.polrelid), ''), ' ', '')) NOT IN (
            'public.city_is_publicly_visible(city_id)',
            '(public.city_is_publicly_visible(city_id))',
            'city_is_publicly_visible(city_id)',
            '(city_is_publicly_visible(city_id))',
            '(public.city_is_publicly_visible(city_id)andstatus=''published'')',
            '((public.city_is_publicly_visible(city_id)andstatus=''published''))',
            '(city_is_publicly_visible(city_id)andstatus=''published'')',
            '((city_is_publicly_visible(city_id)andstatus=''published''))',
            'public.city_is_publicly_visible(city_id)orpublic.is_td_admin(auth.uid())',
            '(public.city_is_publicly_visible(city_id)orpublic.is_td_admin(auth.uid()))',
            '((public.city_is_publicly_visible(city_id)orpublic.is_td_admin(auth.uid())))',
            '((public.city_is_publicly_visible(city_id)andstatus=''published'')orpublic.is_td_admin(auth.uid()))',
            '(((public.city_is_publicly_visible(city_id)andstatus=''published'')orpublic.is_td_admin(auth.uid())))',
            '((city_is_publicly_visible(city_id)andstatus=''published'')oris_td_admin(auth.uid()))',
            '(((city_is_publicly_visible(city_id)andstatus=''published'')oris_td_admin(auth.uid())))',
            'city_is_publicly_visible(city_id)oris_td_admin(auth.uid())',
            '(city_is_publicly_visible(city_id)oris_td_admin(auth.uid()))',
            '((city_is_publicly_visible(city_id)oris_td_admin(auth.uid())))'
          )
  ) THEN
    RAISE EXCEPTION
      'Prerequisito catalogo: pg_get_expr non è tra le rappresentazioni note. Equivalenza non dimostrata e difetto non dimostrato. Nessuna policy è stata modificata.';
  END IF;

  FOR v_fk_name IN
    SELECT fk
    FROM unnest(ARRAY[
      'pois_city_id_fkey',
      'city_events_city_id_fkey',
      'city_guides_city_id_fkey',
      'city_services_city_id_fkey',
      'city_people_city_id_fkey',
      'photo_submissions_city_id_fkey',
      'sponsors_city_id_fkey',
      'sponsor_requests_city_id_fkey',
      'pois_staging_city_id_fkey'
    ]) AS fk
  LOOP
    SELECT pg_get_constraintdef(con.oid)
    INTO v_fk_def
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND con.conname = v_fk_name
      AND con.contype = 'f';
    IF v_fk_def IS NULL THEN
      RAISE EXCEPTION
        'Prerequisito catalogo: la FK % non è nello schema public. L''azione ON DELETE non è nelle migration e non viene presunta.',
        v_fk_name;
    END IF;
    RAISE NOTICE 'FK % = %', v_fk_name, v_fk_def;
  END LOOP;

  SELECT oid INTO v_auth_oid FROM pg_roles WHERE rolname = 'authenticated';

  IF public.int09_select_policy_disposition(
    'pois', 'Public read access for pois', ARRAY[0]::oid[], 'true', NULL
  ) IS DISTINCT FROM 'replace' THEN
    RAISE EXCEPTION 'La policy documentata, PUBLIC e USING true non è candidata alla sostituzione.';
  END IF;

  BEGIN
    PERFORM public.int09_select_policy_disposition(
      'qd_select_probe', 'qd_own', ARRAY[0]::oid[], 'city_id = ''visible''', NULL
    );
    RAISE EXCEPTION 'QD_SENTINEL predicato proprio';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Una SELECT con predicato non dimostrato è stata conservata.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%lettura permissiva aperta%' THEN
        RAISE EXCEPTION 'Predicato proprio: % %', v_sqlstate, v_message;
      END IF;
  END;

  IF public.int09_select_policy_disposition(
    'qd_select_probe', 'qd_role_own', ARRAY[v_auth_oid], 'city_id = ''visible''', NULL
  ) IS DISTINCT FROM 'keep' THEN
    RAISE EXCEPTION 'Una SELECT di ruolo con predicato non permissivo non è stata conservata.';
  END IF;

  BEGIN
    PERFORM public.int09_select_policy_disposition(
      'pois', 'Public read access for pois', ARRAY[0]::oid[], 'id IS NOT NULL', NULL
    );
    RAISE EXCEPTION 'Un nome documentato con forma diversa non ha interrotto la procedura.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura pubblica documentata%' THEN
        RAISE EXCEPTION 'Forma diversa: messaggio inatteso: %', v_message;
      END IF;
  END;

  BEGIN
    PERFORM public.int09_select_policy_disposition(
      'qd_select_probe', 'qd_open', ARRAY[0]::oid[], 'true', NULL
    );
    RAISE EXCEPTION 'Una lettura aperta non documentata non è stata rifiutata.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura permissiva aperta%' THEN
        RAISE EXCEPTION 'Lettura aperta: messaggio inatteso: %', v_message;
      END IF;
  END;

  BEGIN
    PERFORM public.int09_select_policy_disposition(
      'pois', 'Public read access for pois', ARRAY[v_auth_oid], 'true', NULL
    );
    RAISE EXCEPTION 'Un nome documentato con destinatario non PUBLIC è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura pubblica documentata%' THEN
        RAISE EXCEPTION 'Destinatario non PUBLIC: messaggio inatteso: %', v_message;
      END IF;
  END;

  CREATE TABLE public.qd_policy_probe (
    id text PRIMARY KEY,
    city_id text
  );
  ALTER TABLE public.qd_policy_probe ENABLE ROW LEVEL SECURITY;

  CREATE POLICY qd_all_public ON public.qd_policy_probe
    FOR ALL TO PUBLIC
    USING (true)
    WITH CHECK (id IS NOT NULL);
  CREATE POLICY qd_insert_keep ON public.qd_policy_probe
    FOR INSERT TO authenticated
    WITH CHECK (true);
  CREATE POLICY qd_delete_keep ON public.qd_policy_probe
    FOR DELETE TO authenticated
    USING (true);
  CREATE POLICY qd_restrictive ON public.qd_policy_probe
    AS RESTRICTIVE FOR ALL TO PUBLIC
    USING (false);

  v_collision := 'cv'
    || substr(md5('qd_policy_probe' || E'\n' || 'qd_all_public'), 1, 16)
    || '_ins';
  EXECUTE format(
    'CREATE POLICY %I ON public.qd_policy_probe FOR INSERT TO authenticated WITH CHECK (true)',
    v_collision
  );

  PERFORM public.int09_close_public_entity_reads(ARRAY['qd_policy_probe']);


  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe') AND pol.polname = v_collision
  ) THEN
    RAISE EXCEPTION 'La policy di scrittura preesistente è stata sostituita.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polname = 'qd_insert_keep'
      AND pol.polcmd = 'a'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polname = 'qd_delete_keep'
      AND pol.polcmd = 'd'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polname = 'qd_restrictive'
      AND pol.polpermissive = false
  ) THEN
    RAISE EXCEPTION 'Una policy di scrittura o restrittiva fuori perimetro è stata modificata.';
  END IF;

  SELECT pol.polname
  INTO v_public_ins
  FROM pg_policy pol
  WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
    AND pol.polcmd = 'a'
    AND pol.polroles = ARRAY[0]::oid[]
    AND pol.polname <> v_collision
    AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'id IS NOT NULL'
    AND pol.polqual IS NULL;
  IF v_public_ins IS NULL OR v_public_ins = v_collision THEN
    RAISE EXCEPTION 'La policy ALL verso PUBLIC non ha prodotto un INSERT con solo WITH CHECK.';
  END IF;

  v_base := 'cv' || substr(md5('qd_policy_probe' || E'\n' || 'qd_all_public'), 1, 16);
  IF v_public_ins IS DISTINCT FROM v_base || '1_ins' THEN
    RAISE EXCEPTION 'La collisione non ha distinto l''INSERT ricostruito: %', v_public_ins;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polname = v_base || '_upd'
      AND pol.polcmd = 'w'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polname = v_base || '_del'
      AND pol.polcmd = 'd'
  ) THEN
    RAISE EXCEPTION 'Le tre policy di scrittura ricostruite non sono distinte.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe') AND pol.polname = 'qd_all_public'
  ) OR EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polcmd = 'r'
      AND pol.polpermissive
      AND lower(btrim(pg_get_expr(pol.polqual, pol.polrelid))) = 'true'
  ) THEN
    RAISE EXCEPTION 'La SELECT aperta della policy ALL è stata conservata o ricreata.';
  END IF;

  SELECT pg_get_expr(pol.polqual, pol.polrelid), pg_get_expr(pol.polwithcheck, pol.polrelid)
  INTO v_using, v_check
  FROM pg_policy pol
  WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
    AND pol.polcmd = 'w'
    AND pol.polroles = ARRAY[0]::oid[]
    AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'id IS NOT NULL';
  IF v_using IS DISTINCT FROM 'true' OR v_check IS DISTINCT FROM 'id IS NOT NULL' THEN
    RAISE EXCEPTION 'UPDATE non conserva USING e WITH CHECK distinti.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_policy_probe')
      AND pol.polcmd = 'd'
      AND pol.polroles = ARRAY[0]::oid[]
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'true'
      AND pol.polwithcheck IS NULL
  ) THEN
    RAISE EXCEPTION 'DELETE non conserva solo USING.';
  END IF;

  CREATE TABLE public.qd_all_nocheck (id text PRIMARY KEY);
  ALTER TABLE public.qd_all_nocheck ENABLE ROW LEVEL SECURITY;
  CREATE POLICY qd_all_nocheck ON public.qd_all_nocheck
    FOR ALL TO PUBLIC
    USING (true);
  PERFORM public.int09_close_public_entity_reads(ARRAY['qd_all_nocheck']);
  IF EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_nocheck')
      AND pol.polcmd = 'r'
  ) THEN
    RAISE EXCEPTION 'La SELECT di una ALL senza WITH CHECK è stata ricreata.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_nocheck')
      AND pol.polcmd = 'a'
      AND pol.polroles = ARRAY[0]::oid[]
      AND pol.polqual IS NULL
      AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_nocheck')
      AND pol.polcmd = 'w'
      AND pol.polroles = ARRAY[0]::oid[]
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'true'
      AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_nocheck')
      AND pol.polcmd = 'd'
      AND pol.polroles = ARRAY[0]::oid[]
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'true'
      AND pol.polwithcheck IS NULL
  ) THEN
    RAISE EXCEPTION 'Una ALL senza WITH CHECK non ha copiato USING sulle tre scritture.';
  END IF;

  CREATE TABLE public.qd_select_abort (id text PRIMARY KEY, city_id text);
  ALTER TABLE public.qd_select_abort ENABLE ROW LEVEL SECURITY;
  CREATE POLICY qd_keep_abort ON public.qd_select_abort
    FOR SELECT TO PUBLIC USING (city_id = 'visible');
  CREATE POLICY qd_open_abort ON public.qd_select_abort
    FOR SELECT TO PUBLIC USING (true);
  BEGIN
    PERFORM public.int09_close_public_entity_reads(ARRAY['qd_select_abort']);
    RAISE EXCEPTION 'La lettura aperta non documentata non ha interrotto la chiusura.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura permissiva aperta%' THEN
        RAISE EXCEPTION 'Chiusura lettura aperta: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_select_abort') AND pol.polname = 'qd_keep_abort'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_select_abort') AND pol.polname = 'qd_open_abort'
  ) THEN
    RAISE EXCEPTION 'Il rifiuto della lettura aperta ha lasciato modifiche parziali.';
  END IF;

  CREATE TABLE public.qd_all_roles (id text PRIMARY KEY, city_id text);
  ALTER TABLE public.qd_all_roles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY qd_all_roles ON public.qd_all_roles
    FOR ALL TO authenticated
    USING (id IS NOT NULL)
    WITH CHECK (city_id IS NOT NULL);
  SELECT polroles INTO v_roles
  FROM pg_policy pol
  WHERE pol.polrelid = to_regclass('public.qd_all_roles') AND pol.polname = 'qd_all_roles';
  PERFORM public.int09_close_public_entity_reads(ARRAY['qd_all_roles']);
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_roles')
      AND pol.polname = 'qd_all_roles'
      AND pol.polcmd = '*'
      AND pol.polroles = v_roles
      AND pg_get_expr(pol.polqual, pol.polrelid) = 'id IS NOT NULL'
      AND pg_get_expr(pol.polwithcheck, pol.polrelid) = 'city_id IS NOT NULL'
  ) THEN
    RAISE EXCEPTION 'La ALL non pubblica non è rimasta invariata.';
  END IF;

  CREATE TABLE public.qd_all_predicate (id text PRIMARY KEY, city_id text);
  ALTER TABLE public.qd_all_predicate ENABLE ROW LEVEL SECURITY;
  CREATE POLICY qd_all_predicate ON public.qd_all_predicate
    FOR ALL TO PUBLIC USING (city_id IS NOT NULL);
  BEGIN
    PERFORM public.int09_close_public_entity_reads(ARRAY['qd_all_predicate']);
    RAISE EXCEPTION 'Una ALL con predicato proprio è stata spezzata.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%non ricostruibile%' THEN
        RAISE EXCEPTION 'ALL con predicato: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_all_predicate')
      AND pol.polname = 'qd_all_predicate'
      AND pol.polcmd = '*'
  ) THEN
    RAISE EXCEPTION 'La ALL con predicato proprio non è rimasta.';
  END IF;

  CREATE TABLE public.qd_select_unproven (id text PRIMARY KEY, city_id text);
  ALTER TABLE public.qd_select_unproven ENABLE ROW LEVEL SECURITY;
  CREATE POLICY qd_all_beside ON public.qd_select_unproven
    FOR ALL TO PUBLIC USING (true);
  CREATE POLICY qd_unproven ON public.qd_select_unproven
    FOR SELECT TO authenticated
    USING (city_id IS NOT NULL OR id = 'published');
  PERFORM public.int09_close_public_entity_reads(ARRAY['qd_select_unproven']);
  IF EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_select_unproven')
      AND pol.polname = 'qd_all_beside'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_select_unproven')
      AND pol.polname = 'qd_unproven'
      AND pol.polcmd = 'r'
      AND pol.polpermissive
      AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%city_id IS NOT NULL%'
      AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%published%'
  ) OR (
    SELECT count(*)
    FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.qd_select_unproven')
      AND pol.polcmd IN ('a', 'w', 'd')
  ) IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'La SELECT di ruolo non è rimasta, oppure la ALL pubblica USING true non è stata divisa nelle tre scritture.';
  END IF;

  CREATE TABLE public.qd_select_keep (id text PRIMARY KEY, city_id text);
  ALTER TABLE public.qd_select_keep ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.qd_select_keep FORCE ROW LEVEL SECURITY;
  GRANT SELECT ON public.qd_select_keep TO anon, authenticated;
  CREATE POLICY qd_keep_read ON public.qd_select_keep
    FOR SELECT TO PUBLIC USING (city_id = 'visible');
  INSERT INTO public.qd_select_keep (id, city_id) VALUES ('shown', 'visible'), ('hidden', 'secret');
  BEGIN
    PERFORM public.int09_close_public_entity_reads(ARRAY['qd_select_keep']);
    RAISE EXCEPTION 'QD_SENTINEL select keep';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'La SELECT non dimostrata è stata accettata dalla chiusura.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura permissiva aperta%' THEN
        RAISE EXCEPTION 'Chiusura predicato proprio: messaggio inatteso: %', v_message;
      END IF;
  END;
  v_saved_role := current_user;
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO v_visible FROM public.qd_select_keep;
  PERFORM set_config('role', v_saved_role, true);
  IF v_visible IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'La SELECT conservata non filtra la lettura: %', v_visible;
  END IF;

  GRANT SELECT ON public.qd_all_roles TO authenticated;
  INSERT INTO public.qd_all_roles (id, city_id) VALUES ('row', 'kept');
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO v_visible FROM public.qd_all_roles;
  PERFORM set_config('role', v_saved_role, true);
  IF v_visible IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'La ALL non pubblica non autorizza più il suo destinatario: %', v_visible;
  END IF;

  DROP POLICY IF EXISTS "Public read access for pois" ON public.pois;
  CREATE POLICY "Public read access for pois" ON public.pois
    FOR SELECT TO PUBLIC USING (id IS NOT NULL);
  BEGIN
    PERFORM public.int09_close_public_entity_reads(ARRAY['pois']);
    RAISE EXCEPTION 'La policy documentata con forma diversa è stata eliminata.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%lettura pubblica documentata%' THEN
        RAISE EXCEPTION 'Catalogo forma diversa: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.pois') AND pol.polname = 'Public read access for pois'
  ) THEN
    RAISE EXCEPTION 'Il rifiuto ha eliminato la policy documentata con forma diversa.';
  END IF;
  DROP POLICY "Public read access for pois" ON public.pois;
  CREATE POLICY "Public read access for pois" ON public.pois
    FOR SELECT TO PUBLIC USING (true);
  PERFORM public.int09_close_public_entity_reads(ARRAY['pois']);
  IF EXISTS (
    SELECT 1 FROM pg_policy pol
    WHERE pol.polrelid = to_regclass('public.pois') AND pol.polname = 'Public read access for pois'
  ) THEN
    RAISE EXCEPTION 'La policy documentata USING true non è stata sostituita.';
  END IF;

  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'Prerequisito: auth.users non esiste. handle_new_user non è nelle migration del repository.';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    JOIN pg_proc AS trigger_fn ON trigger_fn.oid = trigger_info.tgfoid
    LEFT JOIN pg_depend AS dependency
      ON dependency.classid = 'pg_proc'::regclass
     AND dependency.objid = trigger_fn.oid
     AND dependency.refclassid = 'pg_proc'::regclass
     AND dependency.deptype = 'n'
    LEFT JOIN pg_proc AS callee ON callee.oid = dependency.refobjid
    WHERE trigger_info.tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
      AND NOT trigger_info.tgisinternal
      AND (
        pg_get_functiondef(trigger_fn.oid) ~* 'dblink|pg_net|net\.http|http_request|http_post|storage\.objects'
        OR (
          callee.oid IS NOT NULL
          AND pg_get_functiondef(callee.oid) ~* 'dblink|pg_net|net\.http|http_request|http_post|storage\.objects'
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Un trigger su auth.users o public.profiles, o una funzione da cui dipende, contiene rete, dblink o storage.objects. La scansione non vede il SQL dinamico. Harness non eseguito.';
  END IF;
  IF current_setting('qd.effects_ack', true)
     IS DISTINCT FROM current_database() || ':effetti-esterni-verificati' THEN
    RAISE EXCEPTION
      'Conferma operatore assente, non prova tecnica. qd.effects_ack = current_database() || '':effetti-esterni-verificati'' dice solo che l''operatore ha dichiarato l''ispezione. Non dimostra l''assenza di effetti esterni: SQL dinamico, dipendenze non registrate e chiamate oltre il primo livello non sono visibili. Eseguire solo su un cluster sacrificabile già verificato fuori da SQL.';
  END IF;

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (v_admin, 'qd-admin-' || v_admin::text || '@example.invalid', '{"role":"admin_all"}'::jsonb),
    (v_inviter, 'qd-inviter-' || v_inviter::text || '@example.invalid', '{"role":"user"}'::jsonb),
    (v_invitee, 'qd-invitee-' || v_invitee::text || '@example.invalid', '{"role":"user"}'::jsonb),
    (v_invitee_b, 'qd-invitee-b-' || v_invitee_b::text || '@example.invalid', '{"role":"user"}'::jsonb),
    (v_stranger, 'qd-stranger-' || v_stranger::text || '@example.invalid', '{"role":"user"}'::jsonb),
    (v_ai, 'qd-ai-' || v_ai::text || '@example.invalid', '{"role":"user"}'::jsonb);

  UPDATE public.profiles
  SET role = 'admin_all'
  WHERE id = v_admin AND role IS DISTINCT FROM 'admin_all';
  UPDATE public.profiles
  SET referral_code = 'QD' || substr(replace(v_inviter::text, '-', ''), 1, 10)
  WHERE id = v_inviter;
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE referral_code IS NOT NULL
      AND btrim(referral_code) <> ''
    GROUP BY upper(btrim(referral_code))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Prerequisito bloccante: referral_code duplicati dopo upper(btrim()). La candidata non riscrive i profili e non crea l''indice.';
  END IF;
  IF to_regclass('public.profiles_referral_code_normalized_uidx') IS NULL THEN
    RAISE EXCEPTION 'Manca profiles_referral_code_normalized_uidx.';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index AS index_info
    JOIN pg_class AS index_rel ON index_rel.oid = index_info.indexrelid
    WHERE index_rel.oid = 'public.profiles_referral_code_normalized_uidx'::regclass
      AND index_info.indisunique
      AND index_info.indisvalid
      AND index_info.indisready
      AND NOT index_info.indisprimary
      AND index_info.indnkeyatts = 1
      AND replace(COALESCE(pg_get_expr(index_info.indexprs, index_info.indrelid), ''), ' ', '') IN (
        'upper(btrim(referral_code))',
        '(upper(btrim(referral_code)))'
      )
      AND pg_get_expr(index_info.indpred, index_info.indrelid) IS NOT NULL
      AND position(
        'referral_code IS NOT NULL' IN pg_get_expr(index_info.indpred, index_info.indrelid)
      ) > 0
      AND pg_get_expr(index_info.indpred, index_info.indrelid)
          ~ 'btrim\(referral_code\)\s*<>\s*''''(::text)?'
      AND position(
        ' OR ' IN (
          ' ' || upper(pg_get_expr(index_info.indpred, index_info.indrelid)) || ' '
        )
      ) = 0
  ) THEN
    RAISE EXCEPTION
      'profiles_referral_code_normalized_uidx non è l''indice univoco su una sola espressione upper(btrim(referral_code)) per i codici non vuoti: %',
      pg_get_indexdef('public.profiles_referral_code_normalized_uidx'::regclass);
  END IF;
  IF (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
     IS DISTINCT FROM upper(btrim((SELECT referral_code FROM public.profiles WHERE id = v_inviter))) THEN
    RAISE EXCEPTION 'Il codice dell''invitante non è nella forma upper(btrim()).';
  END IF;
  IF (
    SELECT count(*)
    FROM public.profiles
    WHERE id IN (v_admin, v_inviter, v_invitee, v_invitee_b, v_stranger, v_ai)
  ) IS DISTINCT FROM 6 THEN
    RAISE EXCEPTION
      'Prerequisito profili: auth.users non ha prodotto le sei righe in public.profiles. handle_new_user non è definito nelle migration del repository.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  RAISE NOTICE 'qd section: delete_city_admin';
  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES
    (v_city, 'QD Empty', v_city, 'Contratto', 'Contratto'),
    (v_city_kept, 'QD Kept', v_city_kept, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES
    (v_city, 'QD Empty', v_city),
    (v_city_kept, 'QD Kept', v_city_kept);

  INSERT INTO public.user_visited_cities (city_id, user_id)
  VALUES (v_city, v_admin);
  INSERT INTO public.user_favorites (user_id, entity_kind, entity_id)
  VALUES (v_admin, 'city', v_city);
  INSERT INTO public.content_reports (
    id, report_group_id, report_kind, entity_type, entity_id, city_id, reason, user_notes
  ) VALUES (
    v_report, gen_random_uuid(), 'entity_abuse', 'poi', 'qd-report-entity', v_city, 'other', 'nota'
  );

  BEGIN
    PERFORM public.delete_city_admin(v_city, '[]'::jsonb);
    RAISE EXCEPTION 'QD_SENTINEL options array';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Un array JSON è stato accettato come opzioni.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%p_options deve essere un oggetto JSON%' THEN
        RAISE EXCEPTION 'Opzioni non oggetto: % %', v_sqlstate, v_message;
      END IF;
  END;
  BEGIN
    PERFORM public.delete_city_admin(v_city, '{"unknown": true}'::jsonb);
    RAISE EXCEPTION 'QD_SENTINEL unknown key';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Una chiave sconosciuta è stata accettata.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%chiave non consentita%' THEN
        RAISE EXCEPTION 'Chiave sconosciuta: % %', v_sqlstate, v_message;
      END IF;
  END;
  BEGIN
    PERFORM public.delete_city_admin(v_city, '{"keepPOIs": "no"}'::jsonb);
    RAISE EXCEPTION 'QD_SENTINEL bad boolean';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Un valore non booleano è stato accettato.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%deve essere boolean%' THEN
        RAISE EXCEPTION 'Tipo non booleano: % %', v_sqlstate, v_message;
      END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE id = v_city AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Le opzioni rifiutate hanno modificato la città.';
  END IF;
  SELECT * INTO v_parse
  FROM public.int09_parse_city_delete_options('{"keepUserPhotos": false}'::jsonb);
  IF v_parse.keep_community_photos IS DISTINCT FROM false
     OR v_parse.keep_patron_photos IS DISTINCT FROM false
     OR v_parse.keep_pois IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'keepUserPhotos false non spegne entrambi i flag foto.';
  END IF;
  SELECT * INTO v_parse
  FROM public.int09_parse_city_delete_options('{"keepCommunityPhotos": false}'::jsonb);
  IF v_parse.keep_community_photos IS DISTINCT FROM false
     OR v_parse.keep_patron_photos IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'keepCommunityPhotos false ha cambiato anche il flag patrono.';
  END IF;
  SELECT * INTO v_parse
  FROM public.int09_parse_city_delete_options(
    '{"keepUserPhotos": false, "keepCommunityPhotos": true}'::jsonb
  );
  IF v_parse.keep_community_photos IS DISTINCT FROM true
     OR v_parse.keep_patron_photos IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Il flag esplicito community non ha prevalso sull''alias.';
  END IF;
  SELECT * INTO v_parse
  FROM public.int09_parse_city_delete_options(
    '{"keepUserPhotos": false, "keepCommunityPhotos": true, "keepPatronPhotos": true}'::jsonb
  );
  IF v_parse.keep_community_photos IS DISTINCT FROM true
     OR v_parse.keep_patron_photos IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'I flag foto espliciti non hanno prevalso sull''alias.';
  END IF;
  BEGIN
    PERFORM public.delete_city_admin(v_city, 'null'::jsonb);
    RAISE EXCEPTION 'QD_SENTINEL json null';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Un JSON null è stato accettato come opzioni.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%p_options deve essere un oggetto JSON%' THEN
        RAISE EXCEPTION 'JSON null: % %', v_sqlstate, v_message;
      END IF;
  END;

  PERFORM public.delete_city_admin(v_city, '{}'::jsonb);

  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city) THEN
    RAISE EXCEPTION 'La città vuota con opzioni predefinite non è stata hard-deleted.';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_visited_cities
    WHERE city_id = v_city AND user_id = v_admin AND source = 'auto'
  ) OR EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.user_favorites
    WHERE user_id = v_admin AND entity_kind = 'city' AND entity_id = v_city
  ) THEN
    RAISE EXCEPTION 'Dopo l''hard-delete la visita o il preferito non sono rimasti, oppure la città esiste ancora.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.content_reports WHERE id = v_report AND city_id IS NULL
  ) THEN
    RAISE EXCEPTION 'content_reports non è rimasto con city_id azzerato.';
  END IF;

  CREATE FUNCTION pg_temp.qd_city_block()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $qd_city_block$
  BEGIN
    RETURN OLD;
  END;
  $qd_city_block$;
  CREATE TRIGGER qd_city_block
    BEFORE DELETE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION pg_temp.qd_city_block();
  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES (v_city_trigger, 'QD Trigger', v_city_trigger, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES (v_city_trigger, 'QD Trigger', v_city_trigger);
  INSERT INTO public.photo_submissions (
    id, user_id, user_name, city_id, image_url, location_name, is_official
  ) VALUES (
    v_photo_trigger, v_admin, 'QD', v_city_trigger, 'https://example.invalid/qd-trigger.jpg', 'QD', false
  );
  BEGIN
    PERFORM public.delete_city_admin(v_city_trigger, '{}'::jsonb);
    RAISE EXCEPTION 'QD_SENTINEL hard-delete con trigger non interno';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'L''hard-delete è proseguito nonostante un trigger non interno su cities.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%trigger non interni%' THEN
        RAISE EXCEPTION 'Trigger su cities: % %', v_sqlstate, v_message;
      END IF;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city_trigger AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Il rifiuto del trigger ha cancellato o marcato la città.';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.photo_submissions
    WHERE id = v_photo_trigger
      AND city_id = v_city_trigger
      AND status IS DISTINCT FROM 'city_deleted'
  ) THEN
    RAISE EXCEPTION 'Il rifiuto del trigger ha modificato la foto collegata.';
  END IF;
  DROP TRIGGER qd_city_block ON public.cities;
  DROP FUNCTION pg_temp.qd_city_block();

  INSERT INTO public.pois (id, name, city_id)
  VALUES (v_poi_kept, 'QD POI kept', v_city_kept);
  PERFORM public.delete_city_admin(v_city_kept, '{"keepPOIs": true}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities
    WHERE id = v_city_kept AND status = 'deleted_orphan' AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.pois WHERE id = v_poi_kept
  ) THEN
    RAISE EXCEPTION 'Una città con un POI rimasto non è andata in soft-delete.';
  END IF;

  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES
    (v_city_mod, 'QD Moderation', v_city_mod, 'Contratto', 'Contratto'),
    (v_city_block, 'QD Restrict', v_city_block, 'Contratto', 'Contratto'),
    (v_city_other, 'QD Report Home', v_city_other, 'Contratto', 'Contratto'),
    (v_city_pub, 'QD Published', v_city_pub, 'Contratto', 'Contratto'),
    (v_city_draft, 'QD Draft', v_city_draft, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug, status)
  VALUES
    (v_city_mod, 'QD Moderation', v_city_mod, 'published'),
    (v_city_block, 'QD Restrict', v_city_block, 'published'),
    (v_city_other, 'QD Report Home', v_city_other, 'published'),
    (v_city_pub, 'QD Published', v_city_pub, 'published'),
    (v_city_draft, 'QD Draft', v_city_draft, 'draft');
  INSERT INTO public.patron_photo_suggestions (
    id, user_id, user_name, city_id, city_name, patron_name, rights_confirmed
  ) VALUES (
    v_suggestion, v_admin, 'QD', v_city_mod, 'QD Moderation', 'Patrono QD', true
  );
  PERFORM public.delete_city_admin(v_city_mod, '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities
    WHERE id = v_city_mod AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.patron_photo_suggestions WHERE id = v_suggestion
  ) THEN
    RAISE EXCEPTION 'La riga di moderazione da conservare non ha forzato il soft-delete.';
  END IF;

  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES
    (v_city_event, 'QD Event Keep', v_city_event, 'Contratto', 'Contratto'),
    (v_city_event_del, 'QD Event Drop', v_city_event_del, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES
    (v_city_event, 'QD Event Keep', v_city_event),
    (v_city_event_del, 'QD Event Drop', v_city_event_del);
  INSERT INTO public.city_events (id, city_id, name)
  VALUES
    (v_event, v_city_event, 'QD Event'),
    (v_event_del, v_city_event_del, 'QD Event Drop');
  PERFORM public.delete_city_admin(v_city_event, '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities
    WHERE id = v_city_event AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.city_events WHERE id = v_event
  ) THEN
    RAISE EXCEPTION 'keepEvents predefinito non ha conservato l''evento in soft-delete.';
  END IF;
  INSERT INTO public.content_reports (
    id, report_group_id, report_kind, entity_type, entity_id, city_id, reason, user_notes
  ) VALUES (
    v_hard_report, gen_random_uuid(), 'entity_abuse', 'poi', 'qd-hard-report', v_city_event_del, 'other', 'nota'
  );
  PERFORM public.delete_city_admin(v_city_event_del, '{"keepEvents": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_event_del)
     OR EXISTS (SELECT 1 FROM public.city_events WHERE id = v_event_del)
     OR NOT EXISTS (
       SELECT 1 FROM public.content_reports WHERE id = v_hard_report AND city_id IS NULL
     ) THEN
    RAISE EXCEPTION 'keepEvents false non ha cancellato evento e città, o non ha azzerato il report.';
  END IF;

  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES
    (v_city_svc, 'QD Service', v_city_svc, 'Contratto', 'Contratto'),
    (v_city_svc_del, 'QD Service Drop', v_city_svc_del, 'Contratto', 'Contratto'),
    (v_city_guide_del, 'QD Guide Drop', v_city_guide_del, 'Contratto', 'Contratto'),
    (v_city_op_del, 'QD Operator Drop', v_city_op_del, 'Contratto', 'Contratto'),
    (v_city_shop, 'QD Shop', v_city_shop, 'Contratto', 'Contratto'),
    (v_city_shop_del, 'QD Shop Drop', v_city_shop_del, 'Contratto', 'Contratto'),
    (v_city_photo, 'QD Photo', v_city_photo, 'Contratto', 'Contratto'),
    (v_city_photo_del, 'QD Photo Drop', v_city_photo_del, 'Contratto', 'Contratto'),
    (v_city_patron_del, 'QD Patron Drop', v_city_patron_del, 'Contratto', 'Contratto'),
    (v_city_mix, 'QD Mix', v_city_mix, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES
    (v_city_svc, 'QD Service', v_city_svc),
    (v_city_svc_del, 'QD Service Drop', v_city_svc_del),
    (v_city_guide_del, 'QD Guide Drop', v_city_guide_del),
    (v_city_op_del, 'QD Operator Drop', v_city_op_del),
    (v_city_shop, 'QD Shop', v_city_shop),
    (v_city_shop_del, 'QD Shop Drop', v_city_shop_del),
    (v_city_photo, 'QD Photo', v_city_photo),
    (v_city_photo_del, 'QD Photo Drop', v_city_photo_del),
    (v_city_patron_del, 'QD Patron Drop', v_city_patron_del),
    (v_city_mix, 'QD Mix', v_city_mix);
  INSERT INTO public.city_services (id, city_id, name, type)
  VALUES
    (v_svc, v_city_svc, 'QD Service', 'qd'),
    (v_svc_del, v_city_svc_del, 'QD Service Drop', 'qd');
  INSERT INTO public.city_guides (id, city_id, name)
  VALUES (v_guide_del, v_city_guide_del, 'QD Guide Drop');
  INSERT INTO public.city_tour_operators (id, city_id, name)
  VALUES (v_op_del, v_city_op_del, 'QD Operator Drop');
  INSERT INTO public.shops (id, city_id, name, category, image_status)
  VALUES
    (v_shop, v_city_shop, 'QD Shop', 'qd', 'real'),
    (v_shop_del, v_city_shop_del, 'QD Shop Drop', 'qd', 'real');
  INSERT INTO public.photo_submissions (
    id, user_id, user_name, city_id, image_url, location_name, is_official
  ) VALUES
    (v_photo, v_admin, 'QD', v_city_photo, 'https://example.invalid/qd.jpg', 'QD', false),
    (v_photo_del, v_admin, 'QD', v_city_photo_del, 'https://example.invalid/qd2.jpg', 'QD', false);
  INSERT INTO public.patron_photo_suggestions (
    id, user_id, user_name, city_id, city_name, patron_name, rights_confirmed
  ) VALUES (
    v_patron_del, v_admin, 'QD', v_city_patron_del, 'QD Patron Drop', 'Patrono Drop', true
  );
  INSERT INTO public.city_events (id, city_id, name)
  VALUES (v_mix_event, v_city_mix, 'QD Mix Event');
  INSERT INTO public.pois (id, name, city_id)
  VALUES (v_mix_poi, 'QD mix poi', v_city_mix);
  INSERT INTO public.content_reports (
    id, report_group_id, report_kind, entity_type, entity_id, city_id, reason, user_notes
  ) VALUES (
    v_mix_report, gen_random_uuid(), 'entity_abuse', 'poi', v_mix_poi, v_city_mix, 'other', 'nota'
  );

  INSERT INTO public.user_visited_cities (city_id, user_id)
  VALUES (v_city_svc, v_admin);
  PERFORM public.delete_city_admin(v_city_svc, '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city_svc AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.city_services WHERE id = v_svc
  ) THEN
    RAISE EXCEPTION 'keepServices predefinito non ha conservato il servizio.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_visited_cities WHERE city_id = v_city_svc AND user_id = v_admin
  ) THEN
    RAISE EXCEPTION 'Il soft-delete ha cancellato la visita.';
  END IF;
  PERFORM public.delete_city_admin(v_city_svc_del, '{"keepServices": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_svc_del)
     OR EXISTS (SELECT 1 FROM public.city_services WHERE id = v_svc_del) THEN
    RAISE EXCEPTION 'keepServices false non ha cancellato servizio e città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_guide_del, '{"keepGuides": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_guide_del)
     OR EXISTS (SELECT 1 FROM public.city_guides WHERE id = v_guide_del) THEN
    RAISE EXCEPTION 'keepGuides false non ha cancellato guida e città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_op_del, '{"keepOperators": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_op_del)
     OR EXISTS (SELECT 1 FROM public.city_tour_operators WHERE id = v_op_del) THEN
    RAISE EXCEPTION 'keepOperators false non ha cancellato operatore e città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_shop, '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city_shop AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.shops WHERE id = v_shop
  ) THEN
    RAISE EXCEPTION 'keepShops predefinito non ha conservato il negozio.';
  END IF;
  PERFORM public.delete_city_admin(v_city_shop_del, '{"keepShops": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_shop_del)
     OR EXISTS (SELECT 1 FROM public.shops WHERE id = v_shop_del) THEN
    RAISE EXCEPTION 'keepShops false non ha cancellato negozio e città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_photo, '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city_photo AND deleted_at IS NOT NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.photo_submissions
    WHERE id = v_photo AND status = 'city_deleted'
  ) THEN
    RAISE EXCEPTION 'keepCommunityPhotos predefinito non ha conservato la foto marcata city_deleted.';
  END IF;
  PERFORM public.delete_city_admin(v_city_photo_del, '{"keepCommunityPhotos": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_photo_del)
     OR EXISTS (SELECT 1 FROM public.photo_submissions WHERE id = v_photo_del) THEN
    RAISE EXCEPTION 'keepCommunityPhotos false non ha cancellato la foto e la città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_patron_del, '{"keepPatronPhotos": false}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_patron_del)
     OR EXISTS (SELECT 1 FROM public.patron_photo_suggestions WHERE id = v_patron_del) THEN
    RAISE EXCEPTION 'keepPatronPhotos false non ha cancellato il suggerimento e la città.';
  END IF;
  PERFORM public.delete_city_admin(v_city_mix, '{"keepEvents": true, "keepPOIs": false}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.cities WHERE id = v_city_mix AND deleted_at IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM public.pois WHERE id = v_mix_poi
  ) OR NOT EXISTS (
    SELECT 1 FROM public.city_events WHERE id = v_mix_event
  ) OR NOT EXISTS (
    SELECT 1 FROM public.content_reports WHERE id = v_mix_report AND city_id = v_city_mix
  ) THEN
    RAISE EXCEPTION 'L''incrocio evento conservato e POI cancellato non ha fatto soft-delete senza azzerare il report.';
  END IF;

  INSERT INTO public.city_people (id, city_id, name, is_living)
  VALUES (v_person, v_city_block, 'QD Person', true);
  INSERT INTO public.famous_person_photo_reports (
    id, person_id, person_name, person_image_url, city_id, city_name, reason
  ) VALUES (
    v_person_report, v_person, 'QD Person', 'https://example.invalid/qd.jpg',
    v_city_other, 'QD Report Home', 'other'
  );
  BEGIN
    PERFORM public.delete_city_admin(v_city_block, '{"keepPeople": false}'::jsonb);
    RAISE EXCEPTION 'Il report RESTRICT non ha impedito la cancellazione.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%segnalazioni foto legacy%' THEN
        RAISE EXCEPTION 'Report personaggio: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_block AND deleted_at IS NULL)
     OR NOT EXISTS (SELECT 1 FROM public.city_people WHERE id = v_person)
     OR NOT EXISTS (
       SELECT 1 FROM public.famous_person_photo_reports WHERE id = v_person_report
     ) THEN
    RAISE EXCEPTION 'Il fallimento RESTRICT non ha annullato città, personaggio o report.';
  END IF;

  IF NOT has_table_privilege('anon', 'public.pois', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.pois', 'SELECT') THEN
    RAISE EXCEPTION 'Prerequisito GRANT SELECT su public.pois per anon o authenticated assente.';
  END IF;
  INSERT INTO public.pois (id, name, city_id, status)
  VALUES
    (v_poi_pub, 'QD published poi', v_city_pub, 'published'),
    (v_poi_draft, 'QD draft poi', v_city_draft, 'published'),
    (v_poi_hidden, 'QD hidden poi', v_city_pub, 'draft');
  v_saved_role := current_user;
  PERFORM set_config('role', 'anon', true);
  IF current_user IS DISTINCT FROM 'anon' THEN
    RAISE EXCEPTION 'Il cambio di ruolo non ha applicato anon: %', current_user;
  END IF;
  SELECT count(*) INTO v_visible FROM public.pois WHERE id IN (v_poi_pub, v_poi_draft, v_poi_hidden);
  PERFORM set_config('role', v_saved_role, true);
  IF v_visible IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'anon non legge solo il POI pubblicato della città pubblicata: %', v_visible;
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_stranger::text, true);
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO v_visible FROM public.pois WHERE id IN (v_poi_pub, v_poi_draft, v_poi_hidden);
  PERFORM set_config('role', v_saved_role, true);
  IF v_visible IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Un autenticato non amministratore non legge solo il POI pubblicato della città pubblicata: %', v_visible;
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO v_visible FROM public.pois WHERE id IN (v_poi_pub, v_poi_draft, v_poi_hidden);
  PERFORM set_config('role', v_saved_role, true);
  IF v_visible IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'L''amministratore non legge città non pubblicata e POI draft: %', v_visible;
  END IF;

  RAISE NOTICE 'qd section: sponsor_quota';
  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES (v_poi_limit, 'QD Quota City', v_poi_limit, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES (v_poi_limit, 'QD Quota City', v_poi_limit);
  INSERT INTO public.pois (id, name, city_id)
  VALUES
    (v_poi_two, 'QD two', v_poi_limit),
    (v_poi_missing, 'QD missing', v_poi_limit),
    (v_poi_cross, 'QD cross', v_poi_limit),
    (v_poi_limit, 'QD limit', v_poi_limit),
    (v_poi_origin, 'QD origin', v_poi_limit);

  INSERT INTO public.plans (id, name, segment, type, is_active)
  VALUES
    (v_plan, 'QD Local', 'BUSINESS', 'LOCAL_ACTIVITY', true),
    (v_plan_show, 'QD Showcase', 'BUSINESS', 'DIGITAL_SHOWCASE', true);
  INSERT INTO public.pricing_versions (id, plan_id, price, duration_days, valid_from, currency)
  VALUES
    (v_price, v_plan, 0, 30, now(), 'EUR'),
    (v_price_show, v_plan_show, 0, 30, now(), 'EUR');

  INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
  VALUES (v_poi_two, 'approved', v_price, current_date, current_date + 30)
  RETURNING id INTO v_sponsor_keep;
  INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
  VALUES (v_poi_cross, 'approved', v_price, current_date, current_date + 30);
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS shop_fk
    JOIN pg_attribute AS shop_column
      ON shop_column.attrelid = shop_fk.conrelid
     AND shop_column.attnum = ANY (shop_fk.conkey)
    WHERE shop_fk.conrelid = 'public.sponsors'::regclass
      AND shop_fk.contype = 'f'
      AND shop_column.attname = 'shop_id'
      AND shop_fk.confrelid = 'public.shops'::regclass
  ) THEN
    RAISE EXCEPTION
      'Prerequisito: sponsors.shop_id non ha una foreign key verso public.shops.';
  END IF;
  INSERT INTO public.shops (id, city_id, name, category, image_status)
  VALUES (v_poi_cross, v_poi_limit, 'QD cross shop', 'qd', 'real');
  INSERT INTO public.sponsors (shop_id, status, pricing_version_id, start_date, end_date)
  VALUES (v_poi_cross, 'approved', v_price_show, current_date, current_date + 30)
  RETURNING id INTO v_sponsor_shop;
  INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
  VALUES
    (v_poi_limit, 'approved', v_price, current_date, current_date + 30),
    (v_poi_origin, 'approved', v_price, current_date, current_date + 30);

  BEGIN
    INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
    VALUES (v_poi_two, 'approved', v_price, current_date, current_date + 30)
    RETURNING id INTO v_sponsor_extra;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      RAISE EXCEPTION
        'Il secondo approved senza assegnazioni correnti non doveva essere rifiutato: % %',
        v_sqlstate, v_message;
  END;
  IF v_sponsor_keep IS NULL
     OR v_sponsor_extra IS NULL
     OR v_sponsor_keep = v_sponsor_extra
     OR (
       SELECT count(*)
       FROM public.sponsors
       WHERE id IN (v_sponsor_keep, v_sponsor_extra)
         AND poi_id = v_poi_two
         AND status = 'approved'
     ) IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'I due sponsor approved di v_poi_two non hanno gli id attesi.';
  END IF;
  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  BEGIN
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_asset, 'poi', v_poi_two, v_poi_limit, 'gallery', 'active', true
    );
    RAISE EXCEPTION 'Due sponsor con lo stesso piano sono stati accettati.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%non univoco%'
         OR v_message NOT LIKE '%trovati 2%' THEN
        RAISE EXCEPTION 'Due sponsor: % %', v_sqlstate, v_message;
      END IF;
  END;
  DELETE FROM public.sponsors WHERE id = v_sponsor_extra;
  IF EXISTS (
    SELECT 1 FROM public.entity_image_assignments WHERE entity_id = v_poi_two
  ) OR EXISTS (
    SELECT 1 FROM public.sponsors WHERE id = v_sponsor_extra
  ) OR (
    SELECT poi_id FROM public.sponsors WHERE id = v_sponsor_keep AND status = 'approved'
  ) IS DISTINCT FROM v_poi_two
     OR (
       SELECT count(*) FROM public.sponsors WHERE poi_id = v_poi_two AND status = 'approved'
     ) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Due sponsor: è rimasta l''assegnazione, è rimasto lo sponsor extra, oppure è sparito lo sponsor conservato.';
  END IF;

  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  BEGIN
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_asset, 'poi', v_poi_missing, v_poi_limit, 'gallery', 'active', true
    );
    RAISE EXCEPTION 'Un POI senza sponsor approved è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%non univoco%' OR v_message NOT LIKE '%trovati 0%' THEN
        RAISE EXCEPTION 'Sponsor assente: messaggio inatteso: %', v_message;
      END IF;
  END;

  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  BEGIN
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_asset, 'city', v_poi_limit, v_poi_limit, 'gallery', 'active', true
    );
    RAISE EXCEPTION 'entity_type city senza colonna sponsor è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%nessuna colonna documentata%' THEN
        RAISE EXCEPTION 'Tipo non mappato: messaggio inatteso: %', v_message;
      END IF;
  END;

  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/nonpoi-' || v_asset::text || '.jpg', 'admin', false, 'active');
  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_asset, 'city', v_poi_limit, v_poi_limit, 'gallery', 'active', true
  );
  BEGIN
    UPDATE public.media_assets SET origin_type = 'sponsor' WHERE id = v_asset;
    RAISE EXCEPTION 'QD_SENTINEL origin non-poi';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'La conversione a sponsor di un asset con assegnazione non-POI è stata accettata.';
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%nessuna colonna documentata%' THEN
        RAISE EXCEPTION 'Origine non-POI: % %', v_sqlstate, v_message;
      END IF;
  END;
  IF (SELECT origin_type FROM public.media_assets WHERE id = v_asset) IS DISTINCT FROM 'admin'
     OR NOT EXISTS (
       SELECT 1 FROM public.entity_image_assignments
       WHERE media_asset_id = v_asset AND is_current = true AND assignment_status = 'active'
     ) THEN
    RAISE EXCEPTION 'Il rifiuto dell''origine non-POI ha cambiato l''asset o l''assegnazione.';
  END IF;

  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_asset, 'poi', v_poi_cross, v_poi_limit, 'gallery', 'active', true
  );
  IF v_sponsor_shop IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.shops WHERE id = v_poi_cross
     )
     OR NOT EXISTS (
       SELECT 1 FROM public.sponsors
       WHERE id = v_sponsor_shop
         AND shop_id = v_poi_cross
         AND poi_id IS NULL
         AND status = 'approved'
     )
     OR (
       SELECT count(*) FROM public.sponsors
       WHERE poi_id = v_poi_cross AND status = 'approved'
     ) IS DISTINCT FROM 1
     OR NOT EXISTS (
       SELECT 1 FROM public.entity_image_assignments
       WHERE entity_type = 'poi'
         AND entity_id = v_poi_cross
         AND is_current = true
         AND assignment_status = 'active'
     ) THEN
    RAISE EXCEPTION
      'Lo sponsor di shop con lo stesso id testuale del POI non è rimasto distinto, oppure l''assegnazione del POI non è stata creata.';
  END IF;

  FOR v_i IN 1..5 LOOP
    v_asset := gen_random_uuid();
    INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
    VALUES (v_asset, 'public-media', 'qd/' || v_asset::text || '.jpg', 'sponsor', false, 'active');
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_asset, 'poi', v_poi_limit, v_poi_limit, 'gallery', 'active', true
    )
    RETURNING id INTO v_assignment;
    IF v_i = 1 THEN
      v_slot_assignment := v_assignment;
    END IF;
  END LOOP;
  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/over-' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  BEGIN
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_asset, 'poi', v_poi_limit, v_poi_limit, 'gallery', 'active', true
    );
    RAISE EXCEPTION 'QD_SENTINEL sesto inserimento oltre il limite Silver accettato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%superata%' OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'Limite: messaggio inatteso: %', v_message;
      END IF;
  END;

  IF (
    SELECT count(*)
    FROM public.entity_image_assignments eia
    JOIN public.media_assets ma ON ma.id = eia.media_asset_id
    WHERE eia.entity_id = v_poi_limit
      AND eia.entity_type = 'poi'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND ma.origin_type = 'sponsor'
  ) IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'Le cinque assegnazioni Silver non sono il conteggio atteso.';
  END IF;
  IF (
    SELECT entity_id FROM public.entity_image_assignments WHERE id = v_slot_assignment
  ) IS DISTINCT FROM v_poi_limit THEN
    RAISE EXCEPTION 'L''assegnazione da sostituire non appartiene al POI Silver.';
  END IF;
  v_assignment := v_slot_assignment;
  UPDATE public.entity_image_assignments
  SET is_current = false, assignment_status = 'replaced'
  WHERE id = v_assignment;
  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/repl-' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_asset, 'poi', v_poi_limit, v_poi_limit, 'gallery', 'active', true
  );

  v_origin_asset := gen_random_uuid();
  v_origin_assignment := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_origin_asset, 'public-media', 'qd/admin-' || v_origin_asset::text || '.jpg', 'admin', false, 'active');
  INSERT INTO public.entity_image_assignments (
    id, media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_origin_assignment, v_origin_asset, 'poi', v_poi_origin, v_poi_limit, 'gallery', 'active', true
  );
  BEGIN
    UPDATE public.media_assets SET origin_type = 'sponsor' WHERE id = v_origin_asset;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      RAISE EXCEPTION 'Il cambio origine sotto quota non doveva fallire: %', v_message;
  END;
  IF (SELECT origin_type FROM public.media_assets WHERE id = v_origin_asset) IS DISTINCT FROM 'sponsor'
     OR NOT EXISTS (
       SELECT 1 FROM public.entity_image_assignments
       WHERE id = v_origin_assignment
         AND entity_id = v_poi_origin
         AND is_current = true
         AND assignment_status = 'active'
     ) OR (
       SELECT count(*)
       FROM public.entity_image_assignments eia
       JOIN public.media_assets ma ON ma.id = eia.media_asset_id
       WHERE eia.entity_type = 'poi'
         AND eia.entity_id = v_poi_origin
         AND eia.is_current = true
         AND eia.assignment_status = 'active'
         AND ma.origin_type = 'sponsor'
     ) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Il cambio origine sotto quota non ha lasciato asset, assegnazione e conteggio attesi.';
  END IF;
  v_assignment := gen_random_uuid();
  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/admin2-' || v_asset::text || '.jpg', 'admin', false, 'active');
  v_fill_asset := NULL;
  FOR v_i IN 1..4 LOOP
    v_fill := gen_random_uuid();
    IF v_fill_asset IS NULL THEN
      v_fill_asset := v_fill;
    END IF;
    INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
    VALUES (v_fill, 'public-media', 'qd/fill-' || v_fill::text || '.jpg', 'sponsor', false, 'active');
    INSERT INTO public.entity_image_assignments (
      media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
    ) VALUES (
      v_fill, 'poi', v_poi_origin, v_poi_limit, 'gallery', 'active', true
    );
  END LOOP;
  INSERT INTO public.entity_image_assignments (
    id, media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_assignment, v_asset, 'poi', v_poi_origin, v_poi_limit, 'gallery', 'active', false
  );
  BEGIN
    UPDATE public.entity_image_assignments
    SET is_current = true, assignment_status = 'active', media_asset_id = v_fill_asset
    WHERE id = v_assignment;
    RAISE EXCEPTION 'QD_SENTINEL aggiornamento che entra nella quota piena accettato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%superata%'
         OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'Aggiornamento quota: SQLSTATE % messaggio %', v_sqlstate, v_message;
      END IF;
  END;
  IF (
    SELECT is_current FROM public.entity_image_assignments WHERE id = v_assignment
  ) IS DISTINCT FROM false
     OR (
       SELECT media_asset_id FROM public.entity_image_assignments WHERE id = v_assignment
     ) IS DISTINCT FROM v_asset
     OR (SELECT origin_type FROM public.media_assets WHERE id = v_asset) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'L''aggiornamento rifiutato ha modificato assegnazione o asset.';
  END IF;

  v_over_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_over_asset, 'public-media', 'qd/over-origin-' || v_over_asset::text || '.jpg', 'admin', false, 'active');
  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_over_asset, 'poi', v_poi_origin, v_poi_limit, 'gallery', 'active', true
  );
  BEGIN
    UPDATE public.media_assets SET origin_type = 'sponsor' WHERE id = v_over_asset;
    RAISE EXCEPTION 'QD_SENTINEL cambio origine oltre quota accettato';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%superata%' OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'Origine oltre quota: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT origin_type FROM public.media_assets WHERE id = v_over_asset) IS DISTINCT FROM 'admin'
     OR (
       SELECT count(*)
       FROM public.entity_image_assignments eia
       JOIN public.media_assets ma ON ma.id = eia.media_asset_id
       WHERE eia.entity_type = 'poi'
         AND eia.entity_id = v_poi_origin
         AND eia.is_current = true
         AND eia.assignment_status = 'active'
         AND ma.origin_type = 'sponsor'
     ) IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'Il cambio origine rifiutato ha modificato l''asset o il conteggio.';
  END IF;

  SELECT id INTO v_sponsor
  FROM public.sponsors
  WHERE poi_id = v_poi_limit AND status = 'approved';
  INSERT INTO public.plans (id, name, segment, type, is_active)
  VALUES (v_plan_guide, 'QD Guide', 'BUSINESS', 'TOUR_GUIDE', true);
  INSERT INTO public.pricing_versions (id, plan_id, price, duration_days, valid_from, currency)
  VALUES (v_price_guide, v_plan_guide, 0, 30, now(), 'EUR');
  INSERT INTO public.pois (id, name, city_id)
  VALUES (v_poi_fit, 'QD move', v_poi_limit);

  BEGIN
    INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
    VALUES (v_poi_limit, 'approved', v_price, current_date, current_date + 30);
    RAISE EXCEPTION 'Il secondo sponsor approved con assegnazioni è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001'
         OR v_message NOT LIKE '%non univoco%' THEN
        RAISE EXCEPTION 'Secondo sponsor: % %', v_sqlstate, v_message;
      END IF;
  END;
  IF (
    SELECT count(*) FROM public.sponsors WHERE poi_id = v_poi_limit AND status = 'approved'
  ) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Il secondo sponsor rifiutato è rimasto.';
  END IF;

  BEGIN
    UPDATE public.sponsors SET status = 'cancelled' WHERE id = v_sponsor;
    RAISE EXCEPTION 'La cancellazione dello stato con assegnazioni è stata accettata.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%non univoco%' THEN
        RAISE EXCEPTION 'Stato sponsor: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT status FROM public.sponsors WHERE id = v_sponsor) IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Lo stato rifiutato non è tornato approved.';
  END IF;

  BEGIN
    PERFORM public.cancel_sponsor_contract(v_sponsor, 'qd');
    RAISE EXCEPTION 'cancel_sponsor_contract con assegnazioni è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%non univoco%' THEN
        RAISE EXCEPTION 'Annullamento contratto: messaggio inatteso: %', v_message;
      END IF;
  END;

  BEGIN
    UPDATE public.sponsors SET poi_id = v_poi_fit WHERE id = v_sponsor;
    RAISE EXCEPTION 'Lo spostamento di poi_id con assegnazioni è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%non univoco%' THEN
        RAISE EXCEPTION 'poi_id: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT poi_id FROM public.sponsors WHERE id = v_sponsor) IS DISTINCT FROM v_poi_limit THEN
    RAISE EXCEPTION 'poi_id rifiutato non è tornato al POI originale.';
  END IF;

  BEGIN
    UPDATE public.sponsors SET pricing_version_id = v_price_guide WHERE id = v_sponsor;
    RAISE EXCEPTION 'Il cambio di pricing_version_id sotto la quota è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%superata%' OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'pricing_version_id: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT pricing_version_id FROM public.sponsors WHERE id = v_sponsor) IS DISTINCT FROM v_price THEN
    RAISE EXCEPTION 'pricing_version_id rifiutato non è tornato indietro.';
  END IF;

  BEGIN
    UPDATE public.pricing_versions SET plan_id = v_plan_guide WHERE id = v_price;
    RAISE EXCEPTION 'Il cambio di plan_id sotto la quota è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%superata%' OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'plan_id: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT plan_id FROM public.pricing_versions WHERE id = v_price) IS DISTINCT FROM v_plan THEN
    RAISE EXCEPTION 'plan_id rifiutato non è tornato indietro.';
  END IF;

  BEGIN
    UPDATE public.plans SET type = 'TOUR_GUIDE' WHERE id = v_plan;
    RAISE EXCEPTION 'Il cambio di plans.type sotto la quota è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%superata%' OR v_message NOT LIKE '%massimo%' THEN
        RAISE EXCEPTION 'plans.type: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF (SELECT type::text FROM public.plans WHERE id = v_plan) IS DISTINCT FROM 'LOCAL_ACTIVITY' THEN
    RAISE EXCEPTION 'plans.type rifiutato non è tornato LOCAL_ACTIVITY.';
  END IF;

  INSERT INTO public.cities_registry (id, name, slug, region, province)
  VALUES (v_city_drop, 'QD Drop', v_city_drop, 'Contratto', 'Contratto');
  INSERT INTO public.cities (id, name, slug)
  VALUES (v_city_drop, 'QD Drop', v_city_drop);
  INSERT INTO public.pois (id, name, city_id)
  VALUES (v_poi_drop, 'QD drop poi', v_city_drop);
  INSERT INTO public.sponsors (poi_id, status, pricing_version_id, start_date, end_date)
  VALUES (v_poi_drop, 'approved', v_price, current_date, current_date + 30);
  v_asset := gen_random_uuid();
  INSERT INTO public.media_assets (id, storage_bucket, storage_path, origin_type, is_placeholder, asset_status)
  VALUES (v_asset, 'public-media', 'qd/drop-' || v_asset::text || '.jpg', 'sponsor', false, 'active');
  INSERT INTO public.entity_image_assignments (
    media_asset_id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current
  ) VALUES (
    v_asset, 'poi', v_poi_drop, v_city_drop, 'gallery', 'active', true
  );
  PERFORM public.delete_city_admin(v_city_drop, '{}'::jsonb);
  IF EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_drop)
     OR EXISTS (SELECT 1 FROM public.pois WHERE id = v_poi_drop)
     OR EXISTS (
       SELECT 1 FROM public.sponsors
       WHERE poi_id = v_poi_drop AND status = 'approved'
     ) OR EXISTS (
       SELECT 1 FROM public.entity_image_assignments
       WHERE entity_id = v_poi_drop AND is_current = true AND assignment_status = 'active'
     ) THEN
    RAISE EXCEPTION 'La cancellazione città non ha rimosso POI, assegnazione sponsor e collegamento.';
  END IF;

  BEGIN
    UPDATE public.platform_feature_flags
    SET manual_override = to_jsonb(2147483648)
    WHERE key = 'feature.platform.referral_flash';
    RAISE EXCEPTION 'manual_override oltre il limite è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%2147483647%' THEN
        RAISE EXCEPTION 'Limite manual_override: messaggio inatteso: %', v_message;
      END IF;
  END;
  BEGIN
    UPDATE public.platform_feature_flags
    SET default_value = to_jsonb(2147483648)
    WHERE key = 'feature.platform.referral_pro';
    RAISE EXCEPTION 'default_value oltre il limite è stato accettato.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%2147483647%' THEN
        RAISE EXCEPTION 'Limite default_value: messaggio inatteso: %', v_message;
      END IF;
  END;
  UPDATE public.platform_feature_flags
  SET manual_override = NULL, default_value = to_jsonb(15)
  WHERE key = 'feature.platform.referral_flash';
  IF public.referral_prize_amount('feature.platform.referral_flash', 1) IS DISTINCT FROM 15 THEN
    RAISE EXCEPTION 'Il default 15 non è il premio letto.';
  END IF;
  INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, audit_required
  ) VALUES (
    'qd.invalid_amount_key_swap',
    'platform',
    'QD importo non referral',
    'number',
    to_jsonb(2147483648),
    false,
    false,
    NULL,
    true
  );
  BEGIN
    UPDATE public.platform_feature_flags
    SET key = 'feature.platform.referral_flash'
    WHERE key = 'qd.invalid_amount_key_swap';
    RAISE EXCEPTION 'Il cambio della sola chiave ha accettato un importo non valido.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%2147483647%' THEN
        RAISE EXCEPTION 'Cambio della sola chiave: messaggio inatteso: %', v_message;
      END IF;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_feature_flags
    WHERE key = 'feature.platform.referral_flash' AND default_value = to_jsonb(15)
  ) OR NOT EXISTS (
    SELECT 1 FROM public.platform_feature_flags
    WHERE key = 'qd.invalid_amount_key_swap' AND default_value = to_jsonb(2147483648)
  ) THEN
    RAISE EXCEPTION 'Il cambio della sola chiave ha modificato una feature flag.';
  END IF;
  UPDATE public.platform_feature_flags
  SET key = 'qd.other_flag_renamed'
  WHERE key = 'qd.invalid_amount_key_swap';
  UPDATE public.platform_feature_flags
  SET manual_override = 'false'::jsonb
  WHERE key = 'feature.platform.referral';

  RAISE NOTICE 'qd section: referral_redeem';
  PERFORM set_config('request.jwt.claim.sub', v_invitee::text, true);
  v_json := public.redeem_referral_code(
    (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
  );
  IF v_json->>'success' IS DISTINCT FROM 'false'
     OR v_json->>'message' NOT LIKE '%disattivata%' THEN
    RAISE EXCEPTION 'Il flag spento non ha bloccato il riscatto: %', v_json;
  END IF;

  UPDATE public.global_settings
  SET value = 'false'::jsonb
  WHERE key = 'ai_emergency_stop';
  UPDATE public.global_settings
  SET value = 'true'::jsonb
  WHERE key = 'ai_enabled';

  RAISE NOTICE 'qd section: ai_credits';
  INSERT INTO public.user_ai_credits (id, user_id, flash_remaining, pro_remaining, expires_at, source)
  VALUES
    (v_expired, v_invitee, 9, 0, now() - interval '1 day', 'bonus'),
    (v_soon, v_invitee, 3, 0, now() + interval '1 day', 'purchase'),
    (v_later, v_invitee, 7, 0, NULL, 'referral');

  SELECT count(*) INTO v_usage
  FROM public.ai_global_usage
  WHERE user_id = v_invitee;
  v_json := public.consume_ai_credits(v_invitee, 'mini', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'INVALID_MODEL_TYPE' THEN
    RAISE EXCEPTION 'Modello non valido non rifiutato: %', v_json;
  END IF;
  IF (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_soon) IS DISTINCT FROM 3
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_later) IS DISTINCT FROM 7
     OR (SELECT count(*) FROM public.ai_global_usage WHERE user_id = v_invitee) IS DISTINCT FROM v_usage THEN
    RAISE EXCEPTION 'Il modello non valido ha modificato crediti o contatori.';
  END IF;

  v_json := public.get_current_ai_quota(v_invitee);
  IF (v_json->>'extra_credit_packs_flash_remaining')::integer IS DISTINCT FROM 10
     OR (v_json->>'admin_bonus_flash_remaining')::integer IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'Il saldo non include il referral senza scadenza o include il bonus scaduto: %', v_json;
  END IF;

  v_json := public.consume_ai_credits(v_invitee, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'extra_credits'
     OR v_json->>'record_id' IS DISTINCT FROM v_soon::text
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_soon) IS DISTINCT FROM 2
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_later) IS DISTINCT FROM 7
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_expired) IS DISTINCT FROM 9 THEN
    RAISE EXCEPTION 'Il consumo non ha scelto la scadenza più vicina: %', v_json;
  END IF;

  UPDATE public.platform_feature_flags
  SET manual_override = 'true'::jsonb
  WHERE key = 'feature.platform.referral';

  CREATE FUNCTION pg_temp.qd_block_grant()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $block$
  BEGIN
    RAISE EXCEPTION 'qd grant insert failed' USING ERRCODE = 'P0001';
  END;
  $block$;
  CREATE TRIGGER qd_block_grant
  BEFORE INSERT ON public.referral_credit_grants
  FOR EACH ROW EXECUTE FUNCTION pg_temp.qd_block_grant();
  BEGIN
    PERFORM public.redeem_referral_code(
      (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
    );
    RAISE EXCEPTION 'QD_SENTINEL riscatto con grant rifiutato non ha sollevato errore';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%qd grant insert failed%' THEN
        RAISE EXCEPTION 'Rollback grant: messaggio inatteso: %', v_message;
      END IF;
  END;
  DROP TRIGGER qd_block_grant ON public.referral_credit_grants;
  IF EXISTS (SELECT 1 FROM public.referral_credit_grants WHERE invitee_id = v_invitee)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_invitee AND referred_by IS NOT NULL)
     OR EXISTS (
       SELECT 1 FROM public.user_ai_credits
       WHERE user_id IN (v_invitee, v_inviter) AND source = 'referral'
     ) THEN
    RAISE EXCEPTION 'Il fallimento del grant non ha annullato grant, referred_by o crediti.';
  END IF;

  CREATE FUNCTION pg_temp.qd_block_referred()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $block$
  BEGIN
    IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
      RAISE EXCEPTION 'qd referred_by update failed' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END;
  $block$;
  CREATE TRIGGER qd_block_referred
  BEFORE UPDATE OF referred_by ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION pg_temp.qd_block_referred();
  BEGIN
    PERFORM public.redeem_referral_code(
      (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
    );
    RAISE EXCEPTION 'QD_SENTINEL riscatto con referred_by rifiutato non ha sollevato errore';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%qd referred_by update failed%' THEN
        RAISE EXCEPTION 'Rollback referred_by: messaggio inatteso: %', v_message;
      END IF;
  END;
  DROP TRIGGER qd_block_referred ON public.profiles;
  IF EXISTS (SELECT 1 FROM public.referral_credit_grants WHERE invitee_id = v_invitee)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_invitee AND referred_by IS NOT NULL)
     OR EXISTS (
       SELECT 1 FROM public.user_ai_credits
       WHERE user_id IN (v_invitee, v_inviter) AND source = 'referral'
     ) THEN
    RAISE EXCEPTION 'Il fallimento di referred_by non ha annullato grant, referred_by o crediti.';
  END IF;

  CREATE FUNCTION pg_temp.qd_block_credit()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $block$
  BEGIN
    RAISE EXCEPTION 'qd credit insert failed' USING ERRCODE = 'P0001';
  END;
  $block$;
  CREATE TRIGGER qd_block_credit
  BEFORE INSERT ON public.user_ai_credits
  FOR EACH ROW EXECUTE FUNCTION pg_temp.qd_block_credit();
  BEGIN
    PERFORM public.redeem_referral_code(
      (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
    );
    RAISE EXCEPTION 'QD_SENTINEL riscatto con insert crediti fallito non ha sollevato errore';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%qd credit insert failed%' THEN
        RAISE EXCEPTION 'Rollback crediti: messaggio inatteso: %', v_message;
      END IF;
  END;
  DROP TRIGGER qd_block_credit ON public.user_ai_credits;
  IF EXISTS (SELECT 1 FROM public.referral_credit_grants WHERE invitee_id = v_invitee)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_invitee AND referred_by IS NOT NULL)
     OR EXISTS (
       SELECT 1 FROM public.user_ai_credits
       WHERE user_id IN (v_invitee, v_inviter) AND source = 'referral'
     ) THEN
    RAISE EXCEPTION 'Il fallimento dei crediti non ha annullato grant, referred_by o crediti referral.';
  END IF;

  SELECT referral_code INTO v_saved_code
  FROM public.profiles WHERE id = v_invitee;
  UPDATE public.profiles
  SET referral_code = '  qd-norm  '
  WHERE id = v_invitee;
  IF (SELECT referral_code FROM public.profiles WHERE id = v_invitee) IS DISTINCT FROM 'QD-NORM' THEN
    RAISE EXCEPTION 'La scrittura di referral_code non applica upper(btrim()).';
  END IF;
  UPDATE public.profiles
  SET referral_code = v_saved_code
  WHERE id = v_invitee;
  BEGIN
    UPDATE public.profiles AS invitee
    SET referral_code = ' ' || lower(inviter.referral_code) || ' '
    FROM public.profiles AS inviter
    WHERE invitee.id = v_invitee
      AND inviter.id = v_inviter;
    RAISE EXCEPTION 'QD_SENTINEL referral duplicato';
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_fk_name = CONSTRAINT_NAME, v_sqlstate = RETURNED_SQLSTATE;
      IF v_sqlstate IS DISTINCT FROM '23505'
         OR v_fk_name IS DISTINCT FROM 'profiles_referral_code_normalized_uidx' THEN
        RAISE EXCEPTION 'Duplicato referral: vincolo inatteso % %', v_sqlstate, v_fk_name;
      END IF;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION 'Due codici uguali dopo upper(btrim()) sono stati salvati.';
      END IF;
      RAISE;
  END;
  IF (SELECT referral_code FROM public.profiles WHERE id = v_invitee) IS DISTINCT FROM v_saved_code
     OR EXISTS (SELECT 1 FROM public.referral_credit_grants WHERE invitee_id = v_invitee)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_invitee AND referred_by IS NOT NULL) THEN
    RAISE EXCEPTION 'Il rifiuto del codice duplicato ha modificato il profilo o ha creato un grant.';
  END IF;

  v_json := public.redeem_referral_code(
    '  ' || (SELECT referral_code FROM public.profiles WHERE id = v_inviter) || '  '
  );
  IF v_json->>'success' IS DISTINCT FROM 'true'
     OR (SELECT referred_by FROM public.profiles WHERE id = v_invitee) IS DISTINCT FROM v_inviter
     OR (SELECT count(*) FROM public.referral_credit_grants WHERE invitee_id = v_invitee) IS DISTINCT FROM 1
     OR (
       SELECT count(*)
       FROM public.user_ai_credits
       WHERE user_id IN (v_invitee, v_inviter) AND source = 'referral'
     ) IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'Il riscatto con spazi intorno al codice non è atomico: %', v_json;
  END IF;
  v_json := public.redeem_referral_code(
    (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
  );
  IF v_json->>'success' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'Il secondo riscatto dello stesso invitato è riuscito: %', v_json;
  END IF;
  IF (SELECT count(*) FROM public.referral_credit_grants WHERE invitee_id = v_invitee) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Lo stesso invitato ha più di un grant.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_invitee_b::text, true);
  v_json := public.redeem_referral_code(
    (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
  );
  IF v_json->>'success' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Un secondo invitato con lo stesso codice è stato rifiutato: %', v_json;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_inviter::text, true);
  v_json := public.redeem_referral_code(
    (SELECT referral_code FROM public.profiles WHERE id = v_inviter)
  );
  IF v_json->>'success' IS DISTINCT FROM 'false'
     OR v_json->>'message' NOT LIKE '%tuo codice%' THEN
    RAISE EXCEPTION 'L''auto-invito non è stato bloccato: %', v_json;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_ai::text, true);
  v_json := public.get_current_ai_quota(v_ai);
  IF v_json->>'has_active_subscription' IS DISTINCT FROM 'false'
     OR (v_json->>'flash_limit')::integer IS DISTINCT FROM 0
     OR (v_json->>'pro_limit')::integer IS DISTINCT FROM 0
     OR (v_json->>'flash_remaining')::integer IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'Senza subscription il saldo non è vuoto: %', v_json;
  END IF;

  v_fill := gen_random_uuid();
  v_assignment := gen_random_uuid();
  INSERT INTO public.user_ai_credits (id, user_id, flash_remaining, pro_remaining, expires_at, source)
  VALUES
    (v_bonus, v_ai, 4, 1, now() + interval '10 days', 'bonus'),
    (gen_random_uuid(), v_ai, 8, 0, now() - interval '1 day', 'bonus'),
    (v_fill, v_ai, 2, 0, now() + interval '1 day', 'purchase'),
    (v_assignment, v_ai, 5, 3, NULL, 'referral');
  v_json := public.get_current_ai_quota(v_ai);
  IF (v_json->>'admin_bonus_flash_remaining')::integer IS DISTINCT FROM 4
     OR (v_json->>'admin_bonus_pro_remaining')::integer IS DISTINCT FROM 1
     OR (v_json->>'extra_credit_packs_flash_remaining')::integer IS DISTINCT FROM 7
     OR (v_json->>'extra_credit_packs_pro_remaining')::integer IS DISTINCT FROM 3
     OR (v_json->>'has_active_subscription') IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'Bonus, acquisto e referral non sono nei secchi attesi: %', v_json;
  END IF;

  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'extra_credits'
     OR v_json->>'record_id' IS DISTINCT FROM v_fill::text
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_fill) IS DISTINCT FROM 1
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_bonus) IS DISTINCT FROM 4
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_assignment) IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'Il consumo ha ignorato la scadenza più vicina: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(v_ai, 'pro', 'qd', NULL);
  IF v_json->>'record_id' IS DISTINCT FROM v_bonus::text
     OR (SELECT pro_remaining FROM public.user_ai_credits WHERE id = v_bonus) IS DISTINCT FROM 0
     OR (SELECT pro_remaining FROM public.user_ai_credits WHERE id = v_assignment) IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'Il consumo Pro non ha usato il bonus con scadenza: %', v_json;
  END IF;

  INSERT INTO public.user_ai_credits (id, user_id, flash_remaining, pro_remaining, expires_at, source)
  VALUES
    (v_zero, v_ai, 0, 0, now() + interval '3 days', 'purchase'),
    (v_null_source, v_ai, 2, 0, now() + interval '1 hour', NULL);
  v_json := public.get_current_ai_quota(v_ai);
  IF (v_json->>'extra_credit_packs_flash_remaining')::integer IS DISTINCT FROM 8
     OR (v_json->>'admin_bonus_flash_remaining')::integer IS DISTINCT FROM 4 THEN
    RAISE EXCEPTION 'La fonte nulla non è nel secchio extra, oppure il credito a zero è stato contato: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'record_id' IS DISTINCT FROM v_null_source::text
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_null_source) IS DISTINCT FROM 1
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_zero) IS DISTINCT FROM 0
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_fill) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Il consumo non ha ignorato il credito a zero né ha usato la fonte nulla: %', v_json;
  END IF;

  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  v_json := public.get_current_ai_quota(v_invitee);
  IF v_json->>'has_active_subscription' IS NULL THEN
    RAISE EXCEPTION 'Il service role non ha letto il saldo di un altro utente: %', v_json;
  END IF;
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO public.pricing_versions (
    id, plan_id, price, duration_days, valid_from, currency, ai_limits
  ) VALUES (
    v_price_ai, v_plan, 0, 30, now(), 'EUR',
    '{"models":{"flash":4,"pro":2}}'::jsonb
  );
  INSERT INTO public.subscriptions (
    user_id, pricing_version_id, price_paid, start_date, end_date,
    status, current_period_start
  ) VALUES (
    v_ai, v_price_ai, 0, now(), now() + interval '30 days', 'active', now()
  );
  DELETE FROM public.ai_global_usage WHERE user_id = v_ai;
  INSERT INTO public.ai_global_usage (date, user_id, model_type, request_count)
  VALUES (current_date, v_ai, 'flash', 1);
  v_json := public.get_current_ai_quota(v_ai);
  IF v_json->>'has_active_subscription' IS DISTINCT FROM 'true'
     OR (v_json->>'flash_limit')::integer IS DISTINCT FROM 4
     OR (v_json->>'pro_limit')::integer IS DISTINCT FROM 2
     OR (v_json->>'subscription_flash_remaining')::integer IS DISTINCT FROM 3
     OR (v_json->>'subscription_pro_remaining')::integer IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'La subscription attiva non scala i consumi già fatti: %', v_json;
  END IF;
  SELECT COALESCE(sum(request_count), 0) INTO v_usage
  FROM public.ai_global_usage
  WHERE user_id = v_ai AND model_type = 'flash';
  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'subscription'
     OR (v_json->>'remaining')::integer IS DISTINCT FROM 2
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_fill) IS DISTINCT FROM 1
     OR (
       SELECT COALESCE(sum(request_count), 0)
       FROM public.ai_global_usage
       WHERE user_id = v_ai AND model_type = 'flash'
     ) IS DISTINCT FROM v_usage + 1 THEN
    RAISE EXCEPTION 'Il consumo non ha usato la subscription: %', v_json;
  END IF;

  UPDATE public.profiles SET role = 'admin_limited' WHERE id = v_ai;
  SELECT COALESCE(sum(request_count), 0) INTO v_usage
  FROM public.ai_global_usage WHERE user_id = v_ai;
  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'admin'
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_fill) IS DISTINCT FROM 1
     OR (
       SELECT COALESCE(sum(request_count), 0) FROM public.ai_global_usage WHERE user_id = v_ai
     ) IS DISTINCT FROM v_usage + 1 THEN
    RAISE EXCEPTION 'Il percorso amministratore ha toccato i crediti o non ha contato: %', v_json;
  END IF;
  UPDATE public.profiles SET role = 'user' WHERE id = v_ai;

  SELECT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'ai_emergency_stop')
  INTO v_had_stop;
  SELECT value INTO v_stop FROM public.global_settings WHERE key = 'ai_emergency_stop';
  INSERT INTO public.global_settings (key, value)
  VALUES ('ai_emergency_stop', 'true'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  SELECT COALESCE(sum(request_count), 0) INTO v_usage
  FROM public.ai_global_usage WHERE user_id = v_ai;
  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'EMERGENCY_STOP'
     OR (
       SELECT COALESCE(sum(request_count), 0) FROM public.ai_global_usage WHERE user_id = v_ai
     ) IS DISTINCT FROM v_usage THEN
    RAISE EXCEPTION 'ai_emergency_stop non ha bloccato il consumo: %', v_json;
  END IF;
  IF v_had_stop THEN
    UPDATE public.global_settings SET value = v_stop WHERE key = 'ai_emergency_stop';
  ELSE
    DELETE FROM public.global_settings WHERE key = 'ai_emergency_stop';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'ai_enabled')
  INTO v_had_enabled;
  SELECT value INTO v_enabled FROM public.global_settings WHERE key = 'ai_enabled';
  INSERT INTO public.global_settings (key, value)
  VALUES ('ai_enabled', 'false'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  v_json := public.consume_ai_credits(v_ai, 'flash', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'AI_DISABLED' THEN
    RAISE EXCEPTION 'ai_enabled spento non ha bloccato il consumo: %', v_json;
  END IF;
  IF v_had_enabled THEN
    UPDATE public.global_settings SET value = v_enabled WHERE key = 'ai_enabled';
  ELSE
    DELETE FROM public.global_settings WHERE key = 'ai_enabled';
  END IF;

  INSERT INTO public.global_settings (key, value)
  VALUES ('ai_limits_global', '{"daily_free_cap":10}'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  SELECT count(*) INTO v_count
  FROM public.ai_global_usage WHERE guest_id = v_guest;
  v_json := public.consume_ai_credits(NULL, 'flash', 'qd', v_guest::text);
  IF v_json->>'source' IS DISTINCT FROM 'free_tier_guest'
     OR (
       SELECT COALESCE(sum(request_count), 0)
       FROM public.ai_global_usage WHERE guest_id = v_guest
     ) IS DISTINCT FROM v_count + 1 THEN
    RAISE EXCEPTION 'Il guest non ha consumato il piano gratuito: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(NULL, 'flash', 'qd', 'not-a-uuid');
  IF v_json->>'reason' IS DISTINCT FROM 'INVALID_GUEST_ID' THEN
    RAISE EXCEPTION 'Il guest non valido non è stato rifiutato: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(NULL, 'flash', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'GUEST_ID_REQUIRED' THEN
    RAISE EXCEPTION 'Il guest senza id non è stato rifiutato: %', v_json;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_ai::text, true);
  v_json := public.consume_ai_credits(NULL, 'flash', 'qd', v_guest::text);
  IF v_json->>'reason' IS DISTINCT FROM 'FORBIDDEN' THEN
    RAISE EXCEPTION 'Un autenticato ha consumato come guest: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(v_invitee, 'flash', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'FORBIDDEN' THEN
    RAISE EXCEPTION 'Un autenticato ha consumato i crediti di un altro utente: %', v_json;
  END IF;
  BEGIN
    PERFORM public.get_current_ai_quota(v_invitee);
    RAISE EXCEPTION 'Un utente ha letto il saldo di un altro.';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT, v_sqlstate = RETURNED_SQLSTATE;
      IF v_message LIKE 'QD_SENTINEL%' THEN
        RAISE EXCEPTION '%', v_message;
      END IF;
      IF v_sqlstate IS DISTINCT FROM 'P0001' OR v_message NOT LIKE '%FORBIDDEN%' THEN
        RAISE EXCEPTION 'Lettura saldo altrui: messaggio inatteso: %', v_message;
      END IF;
  END;

  PERFORM set_config('request.jwt.claim.sub', v_stranger::text, true);
  SELECT COALESCE(sum(request_count), 0) INTO v_usage
  FROM public.ai_global_usage WHERE user_id = v_stranger;
  v_json := public.consume_ai_credits(v_stranger, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'free_tier'
     OR (
       SELECT COALESCE(sum(request_count), 0)
       FROM public.ai_global_usage WHERE user_id = v_stranger
     ) IS DISTINCT FROM v_usage + 1 THEN
    RAISE EXCEPTION 'Il piano gratuito autenticato non ha consumato: %', v_json;
  END IF;

  DELETE FROM public.ai_global_usage WHERE user_id = v_stranger;
  INSERT INTO public.ai_global_usage (date, user_id, model_type, request_count)
  VALUES (current_date, v_stranger, 'flash', 100);
  DELETE FROM public.user_ai_credits WHERE user_id = v_stranger;
  v_asset := gen_random_uuid();
  INSERT INTO public.user_ai_credits (id, user_id, flash_remaining, pro_remaining, expires_at, source)
  VALUES (v_asset, v_stranger, 1, 0, now() + interval '1 day', 'purchase');
  v_json := public.consume_ai_credits(v_stranger, 'flash', 'qd', NULL);
  IF v_json->>'source' IS DISTINCT FROM 'extra_credits'
     OR v_json->>'record_id' IS DISTINCT FROM v_asset::text
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_asset) IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'L''ultima unità non è stata consumata una sola volta: %', v_json;
  END IF;
  v_json := public.consume_ai_credits(v_stranger, 'flash', 'qd', NULL);
  IF v_json->>'reason' IS DISTINCT FROM 'CREDITS_EXHAUSTED'
     OR v_json->>'source' IS NOT DISTINCT FROM 'extra_credits'
     OR (SELECT flash_remaining FROM public.user_ai_credits WHERE id = v_asset) IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'La seconda richiesta ha consumato di nuovo l''ultima unità: %', v_json;
  END IF;

  v_saved_role := current_user;
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO v_count FROM public.referral_credit_grants;
  IF v_count IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'Un utente estraneo legge i grant referral.';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_invitee::text, true);
  SELECT count(*) INTO v_count
  FROM public.referral_credit_grants
  WHERE invitee_id = v_invitee;
  IF v_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'L''invitato non legge il proprio grant.';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_inviter::text, true);
  SELECT count(*) INTO v_count
  FROM public.referral_credit_grants
  WHERE inviter_id = v_inviter;
  IF v_count IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'L''invitante non legge i grant dei propri invitati.';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  SELECT count(*) INTO v_count FROM public.referral_credit_grants;
  IF v_count < 2 THEN
    RAISE EXCEPTION 'L''amministratore autorizzato non legge i grant.';
  END IF;
  PERFORM set_config('role', v_saved_role, true);
END;
$qd$;

ROLLBACK;
