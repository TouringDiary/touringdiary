-- Porta un Amico — riscatto atomico, importi configurabili, crediti senza scadenza.
-- Candidata: non applicata al database remoto.
--
-- Scadenza: non esiste una durata di piattaforma. Acquisti e bonus amministrativi
-- scrivono expires_at a un anno e il saldo li conta solo se expires_at > now().
-- I crediti source = referral nascono con expires_at NULL. Saldo e consumo
-- li includono. Le altre fonti restano con la condizione expires_at > now().
-- Tra le righe valide, si consuma prima quella con data più vicina (NULLS LAST).
-- Il valore referral è creato in 20260423104500. I file stanno in
-- supabase/migrations e config.toml ha [db.migrations] enabled, schema_paths
-- vuoto: il percorso previsto è la CLI del package supabase 2.118.0
-- (db push, db reset, migration up). Non c'è uno script npm che li applichi.
-- Il sorgente di legacyApplyMigrationFile non è nel repository. Dalla 2.115
-- l'apply è passato a una pipeline che non è, da sola, un blocco transazionale;
-- una CLI precedente avvolgeva il file e un COMMIT interno chiudeva quel
-- blocco. Quale dei due faccia la 2.118.0 non è stato letto dal sorgente.
-- BEGIN e COMMIT restano perché toglierli o tenerli senza quel sorgente
-- sarebbe una scelta. Non sono una prova che l'applicazione sia atomica.
-- COMMIT è l'ultima istruzione. Se una transazione è già aperta, BEGIN non
-- ne apre un'altra e COMMIT chiude quella esterna.
-- PostgreSQL non permette di usare un valore enum aggiunto nella stessa
-- transazione che lo crea, nemmeno se ADD VALUE sta prima di un BEGIN interno.
-- Questo script non aggiunge il valore: richiede che sia già presente.

DO $referral_enum_prerequisite$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ai_credit_source'
      AND e.enumlabel = 'referral'
  ) THEN
    RAISE EXCEPTION
      'Prerequisito non soddisfatto: public.ai_credit_source non contiene referral. Il runner non è verificabile dai file. Un valore enum nuovo non è usabile nella transazione che lo aggiunge. Il valore deve già esistere (20260423104500) prima di questo script.';
  END IF;
END;
$referral_enum_prerequisite$;

BEGIN;

-- Stessa sessione, stesso pg_get_expr: la grafia non è fissata a priori.
-- Un CHECK, una policy o un indice omonimi passano solo se il server
-- decompila la stessa espressione del campione creato qui.
CREATE TEMP TABLE pg_temp.referral_expr_probe (
  invitee_id uuid,
  inviter_id uuid,
  flash_amount integer,
  pro_amount integer,
  referral_code text
) ON COMMIT DROP;
ALTER TABLE pg_temp.referral_expr_probe
  ADD CONSTRAINT probe_flash CHECK (flash_amount >= 0),
  ADD CONSTRAINT probe_pro CHECK (pro_amount >= 0),
  ADD CONSTRAINT probe_pair CHECK (invitee_id <> inviter_id);
-- La policy resta nel catalogo anche senza RLS: il confronto legge pg_policy.
-- ON COMMIT DROP: se ogni istruzione si chiude da sola, il campione non c'è
-- più e il confronto successivo fallisce. Non è una prova sull'atomicità.
CREATE POLICY referral_probe ON pg_temp.referral_expr_probe
  FOR SELECT TO authenticated
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );
CREATE UNIQUE INDEX referral_probe_idx
  ON pg_temp.referral_expr_probe (upper(btrim(referral_code)))
  WHERE referral_code IS NOT NULL AND btrim(referral_code) <> '';

DO $referral_grants_contract$
BEGIN
  IF to_regclass('public.referral_credit_grants') IS NULL THEN
    RETURN;
  END IF;
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'referral_credit_grants'
  ) IS DISTINCT FROM 6
     OR EXISTS (
       SELECT 1
       FROM information_schema.columns AS column_info
       WHERE column_info.table_schema = 'public'
         AND column_info.table_name = 'referral_credit_grants'
         AND (column_info.column_name, column_info.data_type, column_info.is_nullable) NOT IN (
           ('id', 'uuid', 'NO'),
           ('invitee_id', 'uuid', 'NO'),
           ('inviter_id', 'uuid', 'NO'),
           ('flash_amount', 'integer', 'NO'),
           ('pro_amount', 'integer', 'NO'),
           ('created_at', 'timestamp with time zone', 'NO')
         )
     )
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'referral_credit_grants'
         AND column_name = 'id'
         AND column_default ILIKE '%gen_random_uuid%'
     )
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'referral_credit_grants'
         AND column_name = 'created_at'
         AND column_default ILIKE '%now()%'
     )
     OR (
       SELECT coalesce(array_agg(attribute.attname::text ORDER BY key_ord.ord), ARRAY[]::text[])
       FROM pg_constraint AS pk
       JOIN unnest(pk.conkey) WITH ORDINALITY AS key_ord(attnum, ord) ON true
       JOIN pg_attribute AS attribute
         ON attribute.attrelid = pk.conrelid
        AND attribute.attnum = key_ord.attnum
       WHERE pk.conrelid = 'public.referral_credit_grants'::regclass
         AND pk.contype = 'p'
         AND pk.convalidated
     ) IS DISTINCT FROM ARRAY['id']::text[]
     OR (
       SELECT count(*)
       FROM pg_constraint
       WHERE conrelid = 'public.referral_credit_grants'::regclass
         AND contype = 'f'
     ) IS DISTINCT FROM 2
     OR (
       SELECT coalesce(array_agg(source_att.attname::text ORDER BY source_att.attname), ARRAY[]::text[])
       FROM pg_constraint AS fk
       JOIN pg_class AS target ON target.oid = fk.confrelid
       JOIN pg_namespace AS target_ns ON target_ns.oid = target.relnamespace
       JOIN unnest(fk.conkey) WITH ORDINALITY AS source_key(attnum, ord) ON true
       JOIN unnest(fk.confkey) WITH ORDINALITY AS target_key(attnum, ord)
         ON target_key.ord = source_key.ord
       JOIN pg_attribute AS source_att
         ON source_att.attrelid = fk.conrelid
        AND source_att.attnum = source_key.attnum
       JOIN pg_attribute AS target_att
         ON target_att.attrelid = fk.confrelid
        AND target_att.attnum = target_key.attnum
       WHERE fk.conrelid = 'public.referral_credit_grants'::regclass
         AND fk.contype = 'f'
         AND target_ns.nspname = 'public'
         AND target.relname = 'profiles'
         AND target_att.attname = 'id'
         AND fk.confdeltype = 'a'
         AND fk.confupdtype = 'a'
         AND fk.convalidated
         AND cardinality(fk.conkey) = 1
         AND cardinality(fk.confkey) = 1
         AND source_att.attname IN ('invitee_id', 'inviter_id')
     ) IS DISTINCT FROM ARRAY['invitee_id', 'inviter_id']::text[]
     OR (
       SELECT count(*)
       FROM pg_constraint
       WHERE conrelid = 'public.referral_credit_grants'::regclass
         AND contype = 'u'
     ) IS DISTINCT FROM 1
     OR (
       SELECT coalesce(array_agg(attribute.attname::text ORDER BY key_ord.ord), ARRAY[]::text[])
       FROM pg_constraint AS unique_grant
       JOIN unnest(unique_grant.conkey) WITH ORDINALITY AS key_ord(attnum, ord) ON true
       JOIN pg_attribute AS attribute
         ON attribute.attrelid = unique_grant.conrelid
        AND attribute.attnum = key_ord.attnum
       WHERE unique_grant.conname = 'referral_credit_grants_invitee_unique'
         AND unique_grant.contype = 'u'
         AND unique_grant.convalidated
         AND unique_grant.conrelid = 'public.referral_credit_grants'::regclass
     ) IS DISTINCT FROM ARRAY['invitee_id']::text[]
     OR (
       SELECT count(*)
       FROM pg_constraint
       WHERE conrelid = 'public.referral_credit_grants'::regclass
         AND contype = 'c'
     ) IS DISTINCT FROM 3
     OR EXISTS (
       SELECT 1
       FROM pg_constraint AS chk
       WHERE chk.conrelid = 'public.referral_credit_grants'::regclass
         AND chk.contype = 'c'
         AND (
           NOT chk.convalidated
           OR NOT EXISTS (
             SELECT 1
             FROM pg_constraint AS probe
             WHERE probe.conrelid = 'pg_temp.referral_expr_probe'::regclass
               AND probe.contype = 'c'
               AND pg_get_expr(chk.conbin, chk.conrelid)
                   IS NOT DISTINCT FROM pg_get_expr(probe.conbin, probe.conrelid)
           )
         )
     )
     OR (
       SELECT count(*)
       FROM pg_constraint AS chk
       JOIN pg_constraint AS probe
         ON pg_get_expr(chk.conbin, chk.conrelid)
            IS NOT DISTINCT FROM pg_get_expr(probe.conbin, probe.conrelid)
       WHERE chk.conrelid = 'public.referral_credit_grants'::regclass
         AND chk.contype = 'c'
         AND chk.convalidated
         AND probe.conrelid = 'pg_temp.referral_expr_probe'::regclass
         AND probe.conname = 'probe_flash'
     ) IS DISTINCT FROM 1
     OR (
       SELECT count(*)
       FROM pg_constraint AS chk
       JOIN pg_constraint AS probe
         ON pg_get_expr(chk.conbin, chk.conrelid)
            IS NOT DISTINCT FROM pg_get_expr(probe.conbin, probe.conrelid)
       WHERE chk.conrelid = 'public.referral_credit_grants'::regclass
         AND chk.contype = 'c'
         AND chk.convalidated
         AND probe.conrelid = 'pg_temp.referral_expr_probe'::regclass
         AND probe.conname = 'probe_pro'
     ) IS DISTINCT FROM 1
     OR (
       SELECT count(*)
       FROM pg_constraint AS chk
       JOIN pg_constraint AS probe
         ON pg_get_expr(chk.conbin, chk.conrelid)
            IS NOT DISTINCT FROM pg_get_expr(probe.conbin, probe.conrelid)
       WHERE chk.conname = 'referral_credit_grants_distinct_pair'
         AND chk.contype = 'c'
         AND chk.convalidated
         AND chk.conrelid = 'public.referral_credit_grants'::regclass
         AND probe.conrelid = 'pg_temp.referral_expr_probe'::regclass
         AND probe.conname = 'probe_pair'
     ) IS DISTINCT FROM 1
     OR EXISTS (
       SELECT 1
       FROM pg_policy
       WHERE polrelid = 'public.referral_credit_grants'::regclass
         AND polname IS DISTINCT FROM 'referral_credit_grants_select_parties'
     ) THEN
    RAISE EXCEPTION
      'referral_credit_grants esiste già senza il contratto atteso (sei colonne, tipi, NOT NULL, default di id e created_at, chiave primaria validata su id, due foreign key NO ACTION validate di invitee_id e inviter_id verso profiles.id, unicità validata sulla sola invitee_id, tre CHECK validati e interi sulle espressioni flash_amount >= 0, pro_amount >= 0 e invitee_id <> inviter_id, nessuna policy extra). Un frammento dentro un CHECK più largo non basta. Una grafia diversa di pg_get_expr ferma la migration e non riscrive la tabella. CREATE TABLE IF NOT EXISTS non allinea una tabella diversa.';
  END IF;
END;
$referral_grants_contract$;

CREATE TABLE IF NOT EXISTS public.referral_credit_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invitee_id uuid NOT NULL REFERENCES public.profiles (id),
    inviter_id uuid NOT NULL REFERENCES public.profiles (id),
    flash_amount integer NOT NULL CHECK (flash_amount >= 0),
    pro_amount integer NOT NULL CHECK (pro_amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT referral_credit_grants_distinct_pair CHECK (invitee_id <> inviter_id),
    CONSTRAINT referral_credit_grants_invitee_unique UNIQUE (invitee_id)
);

ALTER TABLE public.referral_credit_grants ENABLE ROW LEVEL SECURITY;

-- service_role legge la tabella. Non scrive: redeem_referral_code è
-- SECURITY DEFINER e inserisce come proprietario della funzione.
REVOKE ALL ON TABLE public.referral_credit_grants FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.referral_credit_grants TO authenticated, service_role;

-- Parentesi esterne e spazi non cambiano l'OR delle tre condizioni.
-- Un termine in più, un AND o un cast non letti su PostgreSQL 17 non passano.
-- Una policy già presente viene tenuta solo se è la SELECT permissiva
-- delle parti. Un OR in più non viene sostituito. La grafia reale di
-- pg_get_expr non è stata letta su PostgreSQL 17.
DO $referral_policy_guard$
DECLARE
  v_using text;
BEGIN
  SELECT pg_get_expr(pol.polqual, pol.polrelid)
  INTO v_using
  FROM pg_policy AS pol
  WHERE pol.polrelid = 'public.referral_credit_grants'::regclass
    AND pol.polname = 'referral_credit_grants_select_parties';

  IF FOUND THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policy AS pol
      WHERE pol.polrelid = 'public.referral_credit_grants'::regclass
        AND pol.polname = 'referral_credit_grants_select_parties'
        AND pol.polcmd = 'r'
        AND pol.polpermissive
        AND pol.polwithcheck IS NULL
        AND pol.polroles = ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]
    ) OR v_using IS DISTINCT FROM (
      SELECT pg_get_expr(probe.polqual, probe.polrelid)
      FROM pg_policy AS probe
      WHERE probe.polrelid = 'pg_temp.referral_expr_probe'::regclass
        AND probe.polname = 'referral_probe'
    ) THEN
      RAISE EXCEPTION
        'referral_credit_grants_select_parties esiste e non è la SELECT delle parti. Non viene sostituita. Espressione: %',
        COALESCE(v_using, '(assente)')
        USING ERRCODE = 'P0001';
    END IF;
  ELSE
    EXECUTE $referral_policy$
      CREATE POLICY referral_credit_grants_select_parties
        ON public.referral_credit_grants
        FOR SELECT
        TO authenticated
        USING (
          invitee_id = auth.uid()
          OR inviter_id = auth.uid()
          OR public.is_td_admin(auth.uid())
        )
    $referral_policy$;
  END IF;
END;
$referral_policy_guard$;

DO $referral_grants_privileges$
DECLARE
  v_using text;
BEGIN
  IF NOT (
    SELECT rel.relrowsecurity
    FROM pg_class AS rel
    WHERE rel.oid = 'public.referral_credit_grants'::regclass
  ) THEN
    RAISE EXCEPTION 'referral_credit_grants non ha RLS attivo.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.referral_credit_grants', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.referral_credit_grants', 'SELECT')
     OR has_table_privilege('anon', 'public.referral_credit_grants', 'SELECT')
     OR has_table_privilege('anon', 'public.referral_credit_grants', 'INSERT')
     OR has_table_privilege('anon', 'public.referral_credit_grants', 'UPDATE')
     OR has_table_privilege('anon', 'public.referral_credit_grants', 'DELETE')
     OR has_table_privilege('anon', 'public.referral_credit_grants', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.referral_credit_grants', 'INSERT')
     OR has_table_privilege('authenticated', 'public.referral_credit_grants', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.referral_credit_grants', 'DELETE')
     OR has_table_privilege('authenticated', 'public.referral_credit_grants', 'TRUNCATE')
     OR has_table_privilege('service_role', 'public.referral_credit_grants', 'INSERT')
     OR has_table_privilege('service_role', 'public.referral_credit_grants', 'UPDATE')
     OR has_table_privilege('service_role', 'public.referral_credit_grants', 'DELETE')
     OR has_table_privilege('service_role', 'public.referral_credit_grants', 'TRUNCATE')
     OR (
       SELECT count(*)
       FROM pg_policy
       WHERE polrelid = 'public.referral_credit_grants'::regclass
     ) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION
      'referral_credit_grants: SELECT o scrittura non coincidono per anon, authenticated o service_role, oppure c''è più di una policy. has_table_privilege include i grant a PUBLIC e le membership di quei tre ruoli. Il controllo non elenca gli altri ruoli. REVOKE non toglie il diritto del proprietario né quello di un superuser.'
      USING ERRCODE = 'P0001';
  END IF;
  SELECT pg_get_expr(pol.polqual, pol.polrelid)
  INTO v_using
  FROM pg_policy AS pol
  WHERE pol.polrelid = 'public.referral_credit_grants'::regclass
    AND pol.polname = 'referral_credit_grants_select_parties'
    AND pol.polcmd = 'r'
    AND pol.polpermissive
    AND pol.polwithcheck IS NULL
    AND pol.polroles = ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')];
  IF v_using IS DISTINCT FROM (
    SELECT pg_get_expr(probe.polqual, probe.polrelid)
    FROM pg_policy AS probe
    WHERE probe.polrelid = 'pg_temp.referral_expr_probe'::regclass
      AND probe.polname = 'referral_probe'
  ) THEN
    RAISE EXCEPTION
      'referral_credit_grants_select_parties non è la SELECT permissiva delle parti per authenticated. Espressione letta: %',
      COALESCE(v_using, '(assente)')
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_grants_privileges$;

-- referred_by segue la riga di referral_credit_grants.
-- INSERT: il grant non può esistere prima della riga, la FK è immediata,
-- quindi referred_by deve essere NULL.
-- UPDATE che non cambia referred_by: gli altri campi restano scrivibili,
-- anche se la riga storica non combacia col grant. Questo trigger non la ripara.
-- UPDATE che cambia referred_by: il valore nuovo deve essere l'invitante del
-- grant di NEW.id, oppure NULL solo se quel grant non c'è.
-- service_role e admin non saltano la regola: possono scrivere il grant e
-- poi il collegamento, non un collegamento senza grant.
-- La normalizzazione del codice avviene sempre, sulla riga già passata dai
-- BEFORE precedenti. Le scritture che quei trigger hanno già fatto su altre
-- tabelle restano: qui si modifica solo NEW.
CREATE OR REPLACE FUNCTION public.profiles_guard_referred_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.referred_by IS NOT NULL THEN
            RAISE EXCEPTION 'Operazione referral non consentita da questo percorso.'
                USING ERRCODE = '42501';
        END IF;
    ELSIF TG_OP = 'UPDATE'
          AND NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
        IF NEW.referred_by IS NULL THEN
            IF EXISTS (
                SELECT 1
                FROM public.referral_credit_grants g
                WHERE g.invitee_id = NEW.id
            ) THEN
                RAISE EXCEPTION 'Operazione referral non consentita da questo percorso.'
                    USING ERRCODE = '42501';
            END IF;
        ELSIF NOT EXISTS (
            SELECT 1
            FROM public.referral_credit_grants g
            WHERE g.invitee_id = NEW.id
              AND g.inviter_id IS NOT DISTINCT FROM NEW.referred_by
        ) THEN
            RAISE EXCEPTION 'Operazione referral non consentita da questo percorso.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    IF NEW.referral_code IS NOT NULL AND btrim(NEW.referral_code) <> '' THEN
        NEW.referral_code := upper(btrim(NEW.referral_code));
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION pg_temp.assert_named_trigger(
  p_table regclass,
  p_name text,
  p_function regprocedure,
  p_tgtype smallint,
  p_columns text[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected smallint[];
  v_actual smallint[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND trigger_info.tgisinternal
  ) THEN
    RAISE EXCEPTION
      '% su % è un trigger interno. Non viene sostituito.',
      p_name, p_table
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND NOT trigger_info.tgisinternal
  ) THEN
    RETURN;
  END IF;

  IF coalesce(cardinality(p_columns), 0) = 0 THEN
    v_expected := ARRAY[]::smallint[];
  ELSE
    SELECT array_agg(column_info.attnum ORDER BY column_info.attnum)
    INTO v_expected
    FROM pg_attribute AS column_info
    WHERE column_info.attrelid = p_table
      AND column_info.attname = ANY (p_columns)
      AND NOT column_info.attisdropped;

    IF cardinality(v_expected) IS DISTINCT FROM cardinality(p_columns) THEN
      RAISE EXCEPTION
        '% su % non ha tutte le colonne del contratto. Non viene sostituito.',
        p_name, p_table
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_actual := ARRAY[]::smallint[];
  SELECT array_agg(column_ord ORDER BY column_ord)
  INTO v_actual
  FROM pg_trigger AS trigger_info
  CROSS JOIN LATERAL unnest(trigger_info.tgattr::smallint[]) AS column_ord
  WHERE trigger_info.tgrelid = p_table
    AND trigger_info.tgname = p_name
    AND NOT trigger_info.tgisinternal;
  IF v_actual IS NULL THEN
    v_actual := ARRAY[]::smallint[];
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS trigger_info
    WHERE trigger_info.tgrelid = p_table
      AND trigger_info.tgname = p_name
      AND NOT trigger_info.tgisinternal
      AND (
        trigger_info.tgfoid IS DISTINCT FROM p_function
        OR trigger_info.tgtype IS DISTINCT FROM p_tgtype
        OR trigger_info.tgenabled IS DISTINCT FROM 'O'
        OR trigger_info.tgqual IS NOT NULL
        OR trigger_info.tgconstraint <> 0
        OR trigger_info.tgnargs <> 0
        OR trigger_info.tgoldtable IS NOT NULL
        OR trigger_info.tgnewtable IS NOT NULL
        OR v_actual IS DISTINCT FROM v_expected
      )
  ) THEN
    RAISE EXCEPTION
      '% su % non ha funzione, eventi, momento, colonne, WHEN o abilitazione del contratto. Non viene sostituito.',
      p_name, p_table
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

SELECT pg_temp.assert_named_trigger(
  'public.profiles'::regclass,
  'profiles_guard_referred_by',
  'public.profiles_guard_referred_by()'::regprocedure,
  23::smallint,
  ARRAY[]::text[]
);
DROP TRIGGER IF EXISTS profiles_guard_referred_by ON public.profiles;

SELECT pg_temp.assert_named_trigger(
  'public.profiles'::regclass,
  'zzz_profiles_guard_referred_by',
  'public.profiles_guard_referred_by()'::regprocedure,
  23::smallint,
  ARRAY[]::text[]
);
DROP TRIGGER IF EXISTS zzz_profiles_guard_referred_by ON public.profiles;
CREATE TRIGGER zzz_profiles_guard_referred_by
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.profiles_guard_referred_by();

-- Un codice non vuoto vale upper(btrim(referral_code)). I NULL e le stringhe
-- vuote non sono codici e restano ripetibili. Se due profili già coincidono,
-- lo script si ferma prima di riscrivere e prima di creare l'indice: la
-- transazione non lascia una normalizzazione parziale. L'UPDATE seguente è
-- sicuro solo dopo quel controllo. CREATE UNIQUE INDEX, in coda, fallisce
-- ancora se un inserimento concorrente ha creato un duplicato nel frattempo
-- e annulla anche la riscrittura.
DO $referral_code_duplicates$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE referral_code IS NOT NULL
      AND btrim(referral_code) <> ''
    GROUP BY upper(btrim(referral_code))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Prerequisito non soddisfatto: referral_code duplicati dopo upper(btrim()). Nessuna riga è stata riscritta e l''indice non viene creato.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_code_duplicates$;

-- I BEFORE di riga seguono i byte del nome. zzz_ vede NEW dopo i precedenti
-- e può ancora cambiare referral_code o rifiutare referred_by. Non annulla
-- le scritture che un trigger precedente ha già eseguito su altre tabelle.
-- UPDATE OF ha comunque il bit UPDATE: un prima-riga successivo è rifiutato
-- qualunque sia l'elenco di colonne. Il corpo non si legge.
-- trg_profiles_guard_role_change non è un'eccezione.
DO $referral_code_later_trigger$
DECLARE
  v_names text;
BEGIN
  IF current_setting('server_encoding') IS DISTINCT FROM 'UTF8' THEN
    RAISE EXCEPTION
      'Prerequisito non soddisfatto: i trigger BEFORE sono ordinati con strcmp e questo controllo confronta i byte UTF-8. server_encoding è %.',
      current_setting('server_encoding')
      USING ERRCODE = 'P0001';
  END IF;

  SELECT string_agg(trigger_info.tgname, ', ' ORDER BY trigger_info.tgname)
  INTO v_names
  FROM pg_trigger AS trigger_info
  WHERE trigger_info.tgrelid = 'public.profiles'::regclass
    AND NOT trigger_info.tgisinternal
    AND convert_to(trigger_info.tgname, 'UTF8')
        > convert_to('zzz_profiles_guard_referred_by', 'UTF8')
    AND (trigger_info.tgtype & 1) = 1
    AND (trigger_info.tgtype & 2) = 2
    AND ((trigger_info.tgtype & 4) = 4 OR (trigger_info.tgtype & 16) = 16);
  IF v_names IS NOT NULL THEN
    RAISE EXCEPTION
      'Un trigger BEFORE di riga su public.profiles è successivo a zzz_profiles_guard_referred_by e può assegnare NEW dopo il controllo. Il controllo non annulla effetti già prodotti. Corpo non letto: %.',
      v_names
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_code_later_trigger$;

UPDATE public.profiles
SET referral_code = upper(btrim(referral_code))
WHERE referral_code IS NOT NULL
  AND btrim(referral_code) <> ''
  AND referral_code IS DISTINCT FROM upper(btrim(referral_code));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_normalized_uidx
  ON public.profiles (upper(btrim(referral_code)))
  WHERE referral_code IS NOT NULL AND btrim(referral_code) <> '';

DO $referral_code_index_contract$
DECLARE
  v_unique boolean;
  v_valid boolean;
  v_ready boolean;
  v_keys integer;
  v_atts integer;
  v_key smallint;
  v_option smallint;
  v_am text;
  v_opc text;
  v_opc_schema text;
  v_collation oid;
  v_expr text;
  v_pred text;
  v_exclusion boolean;
  v_immediate boolean;
  v_live boolean;
  v_checkxmin boolean;
  v_replident boolean;
  v_nulls_not_distinct boolean;
BEGIN
  SELECT
    index_info.indisunique,
    index_info.indisvalid,
    index_info.indisready,
    index_info.indnkeyatts,
    index_info.indnatts,
    (index_info.indkey::smallint[])[1],
    (index_info.indoption::smallint[])[1],
    access_method.amname,
    opclass.opcname,
    opclass_namespace.nspname,
    (index_info.indcollation::oid[])[1],
    pg_get_expr(index_info.indexprs, index_info.indrelid),
    pg_get_expr(index_info.indpred, index_info.indrelid),
    index_info.indisexclusion,
    index_info.indimmediate,
    index_info.indislive,
    index_info.indcheckxmin,
    index_info.indisreplident,
    index_info.indnullsnotdistinct
  INTO
    v_unique, v_valid, v_ready, v_keys, v_atts, v_key, v_option,
    v_am, v_opc, v_opc_schema, v_collation, v_expr, v_pred,
    v_exclusion, v_immediate, v_live, v_checkxmin, v_replident, v_nulls_not_distinct
  FROM pg_index AS index_info
  JOIN pg_class AS index_rel ON index_rel.oid = index_info.indexrelid
  JOIN pg_class AS table_rel ON table_rel.oid = index_info.indrelid
  JOIN pg_namespace AS namespace_info ON namespace_info.oid = table_rel.relnamespace
  JOIN pg_am AS access_method ON access_method.oid = index_rel.relam
  JOIN pg_opclass AS opclass ON opclass.oid = (index_info.indclass::oid[])[1]
  JOIN pg_namespace AS opclass_namespace ON opclass_namespace.oid = opclass.opcnamespace
  WHERE namespace_info.nspname = 'public'
    AND table_rel.relname = 'profiles'
    AND index_rel.relname = 'profiles_referral_code_normalized_uidx'
    AND NOT index_info.indisprimary;

  -- CREATE UNIQUE INDEX IF NOT EXISTS non sostituisce l'omonimo.
  -- Si confrontano i campi letti qui: unicità, validità, pronto, live,
  -- immediatezza, non exclusion, indcheckxmin, replica identity, NULLS
  -- DISTINCT, una chiave, nessun INCLUDE, btree, text_ops di pg_catalog,
  -- ASC NULLS LAST, collation della colonna referral_code.
  -- Espressione e predicato sono uguali solo se pg_get_expr restituisce lo
  -- stesso testo del campione. Non è un altro certificato di struttura.
  IF NOT COALESCE(v_unique, false)
     OR NOT COALESCE(v_valid, false)
     OR NOT COALESCE(v_ready, false)
     OR NOT COALESCE(v_live, false)
     OR NOT COALESCE(v_immediate, false)
     OR COALESCE(v_exclusion, true)
     OR COALESCE(v_checkxmin, true)
     OR COALESCE(v_replident, true)
     OR COALESCE(v_nulls_not_distinct, true)
     OR v_keys IS DISTINCT FROM 1
     OR v_atts IS DISTINCT FROM 1
     OR v_key IS DISTINCT FROM 0
     OR v_option IS DISTINCT FROM 0
     OR v_am IS DISTINCT FROM 'btree'
     OR v_opc IS DISTINCT FROM 'text_ops'
     OR v_opc_schema IS DISTINCT FROM 'pg_catalog'
     OR v_collation IS NOT DISTINCT FROM 0
     OR v_collation IS DISTINCT FROM (
          SELECT column_info.attcollation
          FROM pg_attribute AS column_info
          WHERE column_info.attrelid = 'public.profiles'::regclass
            AND column_info.attname = 'referral_code'
            AND NOT column_info.attisdropped
        )
     OR v_expr IS DISTINCT FROM (
          SELECT pg_get_expr(probe.indexprs, probe.indrelid)
          FROM pg_index AS probe
          WHERE probe.indrelid = 'pg_temp.referral_expr_probe'::regclass
        )
     OR v_pred IS DISTINCT FROM (
          SELECT pg_get_expr(probe.indpred, probe.indrelid)
          FROM pg_index AS probe
          WHERE probe.indrelid = 'pg_temp.referral_expr_probe'::regclass
        ) THEN
    RAISE EXCEPTION
      'profiles_referral_code_normalized_uidx non corrisponde al predicato intero upper(btrim(referral_code)) per i codici non nulli e non vuoti. CREATE UNIQUE INDEX IF NOT EXISTS non sostituisce un indice omonimo. Espressione: %. Predicato: %',
      COALESCE(v_expr, '(assente)'),
      COALESCE(v_pred, '(assente)')
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_code_index_contract$;

CREATE OR REPLACE FUNCTION public.referral_program_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        CASE
            WHEN manual_override IS NOT NULL THEN (manual_override = 'true'::jsonb)
            ELSE NULL
        END,
        (default_value = 'true'::jsonb),
        false
    )
    FROM public.platform_feature_flags
    WHERE key = 'feature.platform.referral';
$$;

CREATE OR REPLACE FUNCTION public.referral_prize_amount(p_key text, p_fallback integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_raw jsonb;
    v_num numeric;
BEGIN
    SELECT COALESCE(manual_override, default_value)
    INTO v_raw
    FROM public.platform_feature_flags
    WHERE key = p_key;

    IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'number' THEN
        RETURN p_fallback;
    END IF;

    v_num := (v_raw #>> '{}')::numeric;
    IF v_num IS NULL OR v_num < 0 OR v_num <> trunc(v_num) THEN
        RETURN p_fallback;
    END IF;
    IF v_num > 2147483647 THEN
        RAISE EXCEPTION 'Importo referral fuori dal limite intero (massimo 2147483647).'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN v_num::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_feature_flags_guard_referral_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_num numeric;
BEGIN
    IF NEW.key = 'feature.platform.referral' THEN
        IF NEW.value_type IS DISTINCT FROM 'boolean'
           OR jsonb_typeof(NEW.default_value) IS DISTINCT FROM 'boolean'
           OR (
             NEW.manual_override IS NOT NULL
             AND jsonb_typeof(NEW.manual_override) IS DISTINCT FROM 'boolean'
           ) THEN
            RAISE EXCEPTION
                'Il flag Porta un Amico richiede value_type boolean e valori JSON boolean. Un JSON null non è un override assente.'
                USING ERRCODE = 'P0001';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.key NOT IN ('feature.platform.referral_flash', 'feature.platform.referral_pro') THEN
        RETURN NEW;
    END IF;
    IF NEW.value_type IS DISTINCT FROM 'number' THEN
        RAISE EXCEPTION 'Gli importi Porta un Amico richiedono value_type number.'
            USING ERRCODE = 'P0001';
    END IF;

    IF jsonb_typeof(NEW.default_value) <> 'number' THEN
        RAISE EXCEPTION 'Inserire un numero intero maggiore o uguale a 0.'
            USING ERRCODE = 'P0001';
    END IF;
    v_num := (NEW.default_value #>> '{}')::numeric;
    IF v_num IS NULL OR v_num < 0 OR v_num <> trunc(v_num) OR v_num > 2147483647 THEN
        RAISE EXCEPTION 'Inserire un numero intero tra 0 e 2147483647.'
            USING ERRCODE = 'P0001';
    END IF;

    IF NEW.manual_override IS NOT NULL THEN
        IF jsonb_typeof(NEW.manual_override) <> 'number' THEN
            RAISE EXCEPTION 'Inserire un numero intero maggiore o uguale a 0.'
                USING ERRCODE = 'P0001';
        END IF;
        v_num := (NEW.manual_override #>> '{}')::numeric;
        IF v_num IS NULL OR v_num < 0 OR v_num <> trunc(v_num) OR v_num > 2147483647 THEN
            RAISE EXCEPTION 'Inserire un numero intero tra 0 e 2147483647.'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

SELECT pg_temp.assert_named_trigger(
  'public.platform_feature_flags'::regclass,
  'platform_feature_flags_guard_referral_amounts',
  'public.platform_feature_flags_guard_referral_amounts()'::regprocedure,
  23::smallint,
  ARRAY['key', 'manual_override', 'default_value', 'value_type']
);

DROP TRIGGER IF EXISTS platform_feature_flags_guard_referral_amounts ON public.platform_feature_flags;
CREATE TRIGGER platform_feature_flags_guard_referral_amounts
    BEFORE INSERT OR UPDATE OF key, manual_override, default_value, value_type ON public.platform_feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.platform_feature_flags_guard_referral_amounts();

DROP FUNCTION pg_temp.assert_named_trigger(regclass, text, regprocedure, smallint, text[]);

-- Un BEFORE successivo può cambiare key, value_type o i valori dopo questo
-- controllo. Il catalogo non è noto: se quel trigger esiste, ci si ferma.
DO $referral_flag_later_trigger$
DECLARE
  v_names text;
BEGIN
  IF current_setting('server_encoding') IS DISTINCT FROM 'UTF8' THEN
    RAISE EXCEPTION
      'Prerequisito non soddisfatto: i trigger BEFORE sono ordinati con strcmp e questo controllo confronta i byte UTF-8. server_encoding è %.',
      current_setting('server_encoding')
      USING ERRCODE = 'P0001';
  END IF;

  SELECT string_agg(trigger_info.tgname, ', ' ORDER BY trigger_info.tgname)
  INTO v_names
  FROM pg_trigger AS trigger_info
  WHERE trigger_info.tgrelid = 'public.platform_feature_flags'::regclass
    AND NOT trigger_info.tgisinternal
    AND convert_to(trigger_info.tgname, 'UTF8')
        > convert_to('platform_feature_flags_guard_referral_amounts', 'UTF8')
    AND (trigger_info.tgtype & 1) = 1
    AND (trigger_info.tgtype & 2) = 2
    AND ((trigger_info.tgtype & 4) = 4 OR (trigger_info.tgtype & 16) = 16);
  IF v_names IS NOT NULL THEN
    RAISE EXCEPTION
      'Un trigger BEFORE di riga su public.platform_feature_flags è successivo a platform_feature_flags_guard_referral_amounts. Può assegnare NEW anche se UPDATE OF elenca altre colonne. Il corpo non è ispezionato: %.',
      v_names
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_flag_later_trigger$;

CREATE OR REPLACE FUNCTION public.redeem_referral_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_code text := upper(btrim(coalesce(code_input, '')));
    v_invitee_referred uuid;
    v_inviter uuid;
    v_matches integer;
    v_flash integer;
    v_pro integer;
    v_grant uuid;
    v_constraint text;
BEGIN
    IF v_caller IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Accedi per riscattare il codice.'
        );
    END IF;

    IF NOT COALESCE(public.referral_program_enabled(), false) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La funzione Porta un Amico è temporaneamente disattivata.'
        );
    END IF;

    IF v_code = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Inserisci un codice invito.'
        );
    END IF;

    -- La ricerca usa la stessa normalizzazione dell'indice
    -- profiles_referral_code_normalized_uidx. Il conteggio non è il vincolo:
    -- l'indice rifiuta un secondo codice equivalente. Non si usa min(id):
    -- con più di una riga non si sceglie un UUID. La rilettura sotto
    -- FOR UPDATE copre il caso in cui il codice della riga bloccata cambi.
    SELECT count(*)::integer
    INTO v_matches
    FROM public.profiles
    WHERE upper(btrim(referral_code)) = v_code;

    v_inviter := NULL;
    IF v_matches = 1 THEN
        SELECT id
        INTO v_inviter
        FROM public.profiles
        WHERE upper(btrim(referral_code)) = v_code;
    END IF;

    IF v_matches <> 1 OR v_inviter IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Codice invito non valido.'
        );
    END IF;

    IF v_caller < v_inviter THEN
        PERFORM 1 FROM public.profiles WHERE id = v_caller FOR UPDATE;
        PERFORM 1 FROM public.profiles WHERE id = v_inviter FOR UPDATE;
    ELSE
        PERFORM 1 FROM public.profiles WHERE id = v_inviter FOR UPDATE;
        PERFORM 1 FROM public.profiles WHERE id = v_caller FOR UPDATE;
    END IF;

    SELECT referred_by
    INTO v_invitee_referred
    FROM public.profiles
    WHERE id = v_caller;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Profilo non trovato.'
        );
    END IF;

    IF v_inviter = v_caller THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Non puoi usare il tuo codice invito.'
        );
    END IF;

    IF v_invitee_referred IS NOT NULL
       OR EXISTS (
           SELECT 1 FROM public.referral_credit_grants WHERE invitee_id = v_caller
       ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Hai già riscattato un codice invito.'
        );
    END IF;

    IF (
        SELECT count(*)::integer
        FROM public.profiles
        WHERE upper(btrim(referral_code)) = v_code
    ) IS DISTINCT FROM 1
       OR (
        SELECT upper(btrim(referral_code))
        FROM public.profiles
        WHERE id = v_inviter
       ) IS DISTINCT FROM v_code THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Codice invito non valido.'
        );
    END IF;

    v_flash := public.referral_prize_amount('feature.platform.referral_flash', 15);
    v_pro := public.referral_prize_amount('feature.platform.referral_pro', 5);

    INSERT INTO public.referral_credit_grants (invitee_id, inviter_id, flash_amount, pro_amount)
    VALUES (v_caller, v_inviter, v_flash, v_pro)
    RETURNING id INTO v_grant;

    UPDATE public.profiles
    SET referred_by = v_inviter
    WHERE id = v_caller
      AND referred_by IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Collegamento referral non applicato.'
            USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.user_ai_credits (
        user_id, flash_remaining, pro_remaining, expires_at, source, metadata
    )
    VALUES
        (
            v_caller,
            v_flash,
            v_pro,
            NULL,
            'referral'::public.ai_credit_source,
            jsonb_build_object('role', 'invitee', 'grant_id', v_grant, 'inviter_id', v_inviter)
        ),
        (
            v_inviter,
            v_flash,
            v_pro,
            NULL,
            'referral'::public.ai_credit_source,
            jsonb_build_object('role', 'inviter', 'grant_id', v_grant, 'invitee_id', v_caller)
        );

    RETURN json_build_object(
        'success', true,
        'message', 'Codice riscattato. I crediti sono stati aggiunti al wallet AI.',
        'inviter_id', v_inviter
    );
EXCEPTION
    WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IS NOT DISTINCT FROM 'referral_credit_grants_invitee_unique' THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Hai già riscattato un codice invito.'
            );
        END IF;
        RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.referral_program_enabled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_program_enabled() TO service_role;

REVOKE ALL ON FUNCTION public.referral_prize_amount(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_prize_amount(text, integer) TO service_role;

-- redeem è SECURITY DEFINER: la chiamata agli helper è autorizzata sul
-- proprietario di redeem, non su service_role. REVOKE da PUBLIC toglie
-- l'EXECUTE di default. Il proprietario non è service_role.
DO $referral_caller_execute$
DECLARE
  v_owner name;
BEGIN
  SELECT owner_role.rolname
  INTO v_owner
  FROM pg_proc AS fn
  JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
  WHERE fn.oid = 'public.redeem_referral_code(text)'::regprocedure;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'redeem_referral_code non ha un proprietario leggibile.'
      USING ERRCODE = 'P0001';
  END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.referral_program_enabled() TO %I', v_owner);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.referral_prize_amount(text, integer) TO %I', v_owner);
  IF NOT has_function_privilege(v_owner, 'public.referral_program_enabled()', 'EXECUTE')
     OR NOT has_function_privilege(v_owner, 'public.referral_prize_amount(text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION
      'Il proprietario di redeem_referral_code (%) non può eseguire referral_program_enabled o referral_prize_amount. Il GRANT a service_role non autorizza il ruolo SECURITY DEFINER.',
      v_owner
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_caller_execute$;

-- Saldo: il secchio bonus resta «bonus e data futura».
-- Il secchio extra conta le altre fonti con data futura e, in più, i referral senza data.
CREATE OR REPLACE FUNCTION public.get_current_ai_quota(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_flash_total integer := 0;
    v_pro_total integer := 0;
    v_flash_limit integer := 0;
    v_pro_limit integer := 0;
    v_start_date date;
    v_flash_used_sub integer := 0;
    v_pro_used_sub integer := 0;
    v_extra_flash integer := 0;
    v_extra_pro integer := 0;
    v_bonus_flash integer := 0;
    v_bonus_pro integer := 0;
    v_subscription_flash_remaining integer := 0;
    v_subscription_pro_remaining integer := 0;
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN: authentication required'
                USING ERRCODE = '42501';
        END IF;
        IF p_user_id IS DISTINCT FROM v_caller AND NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: cannot read another user wallet'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT
        s.current_period_start::date,
        (pv.ai_limits->'models'->>'flash')::integer,
        (pv.ai_limits->'models'->>'pro')::integer
    INTO v_start_date, v_flash_limit, v_pro_limit
    FROM public.subscriptions s
    JOIN public.pricing_versions pv ON s.pricing_version_id = pv.id
    WHERE s.user_id = p_user_id AND s.status = 'active'
    ORDER BY s.end_date DESC LIMIT 1;

    IF v_start_date IS NOT NULL THEN
        SELECT COALESCE(sum(request_count), 0) INTO v_flash_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'flash' AND date >= v_start_date;

        SELECT COALESCE(sum(request_count), 0) INTO v_pro_used_sub
        FROM public.ai_global_usage
        WHERE user_id = p_user_id AND model_type = 'pro' AND date >= v_start_date;

        v_subscription_flash_remaining := GREATEST(0, v_flash_limit - v_flash_used_sub);
        v_subscription_pro_remaining := GREATEST(0, v_pro_limit - v_pro_used_sub);
        v_flash_total := v_subscription_flash_remaining;
        v_pro_total := v_subscription_pro_remaining;
    END IF;

    SELECT
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_bonus_flash, v_bonus_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND source = 'bonus'::public.ai_credit_source;

    SELECT
        COALESCE(sum(flash_remaining), 0),
        COALESCE(sum(pro_remaining), 0)
    INTO v_extra_flash, v_extra_pro
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND (
          expires_at > now()
          OR (source = 'referral'::public.ai_credit_source AND expires_at IS NULL)
      )
      AND (source IS NULL OR source <> 'bonus'::public.ai_credit_source);

    v_flash_total := v_flash_total + v_extra_flash + v_bonus_flash;
    v_pro_total := v_pro_total + v_extra_pro + v_bonus_pro;

    RETURN json_build_object(
        'flash_remaining', v_flash_total,
        'pro_remaining', v_pro_total,
        'flash_limit', COALESCE(v_flash_limit, 0),
        'pro_limit', COALESCE(v_pro_limit, 0),
        'has_active_subscription', (v_start_date IS NOT NULL),
        'admin_extra_quota', 0,
        'subscription_flash_remaining', v_subscription_flash_remaining,
        'subscription_pro_remaining', v_subscription_pro_remaining,
        'extra_credit_packs_flash_remaining', v_extra_flash,
        'extra_credit_packs_pro_remaining', v_extra_pro,
        'admin_bonus_flash_remaining', v_bonus_flash,
        'admin_bonus_pro_remaining', v_bonus_pro,
        'total_remaining', v_flash_total + v_pro_total
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_credits(
    p_user_id uuid,
    p_model_type text,
    p_feature text,
    p_guest_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_reason text := '';
    v_today date := current_date;
    v_start_date date;
    v_monthly_limit integer;
    v_used_this_month integer;
    v_daily_free_limit integer := 10;
    v_used_today integer;
    v_credit_record_id uuid;
    v_is_admin boolean := false;
    v_pricing_version_id uuid;
    v_emergency_stop_text text;
    v_ai_enabled_text text;
    v_guest_uuid uuid;
    v_guest_id_trim text;
BEGIN
    IF p_model_type IS DISTINCT FROM 'flash' AND p_model_type IS DISTINCT FROM 'pro' THEN
        RETURN json_build_object('allowed', false, 'reason', 'INVALID_MODEL_TYPE');
    END IF;

    SELECT lower(trim(both '"' from coalesce(value::text, '')))
    INTO v_emergency_stop_text
    FROM public.global_settings
    WHERE key = 'ai_emergency_stop'
    LIMIT 1;

    IF v_emergency_stop_text IN ('true', 't', '1', 'yes') THEN
        RETURN json_build_object('allowed', false, 'reason', 'EMERGENCY_STOP');
    END IF;

    SELECT lower(trim(both '"' from coalesce(value::text, '')))
    INTO v_ai_enabled_text
    FROM public.global_settings
    WHERE key = 'ai_enabled'
    LIMIT 1;

    IF v_ai_enabled_text IN ('false', 'f', '0', 'no') THEN
        RETURN json_build_object('allowed', false, 'reason', 'AI_DISABLED');
    END IF;

    v_guest_id_trim := NULLIF(btrim(coalesce(p_guest_id, '')), '');

    IF p_user_id IS NULL
       AND auth.uid() IS NOT NULL
       AND NOT public.is_service_role() THEN
        RETURN json_build_object('allowed', false, 'reason', 'FORBIDDEN');
    END IF;

    IF p_user_id IS NULL THEN
        IF v_guest_id_trim IS NULL THEN
            RETURN json_build_object('allowed', false, 'reason', 'GUEST_ID_REQUIRED');
        END IF;

        BEGIN
            v_guest_uuid := v_guest_id_trim::uuid;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RETURN json_build_object('allowed', false, 'reason', 'INVALID_GUEST_ID');
        END;

        SELECT (value->>'daily_free_cap')::integer INTO v_daily_free_limit
        FROM public.global_settings WHERE key = 'ai_limits_global' LIMIT 1;

        v_daily_free_limit := COALESCE(v_daily_free_limit, 10);

        PERFORM pg_advisory_xact_lock(hashtext('ai_consume_guest:' || v_guest_uuid::text));

        SELECT COALESCE(sum(request_count), 0) INTO v_used_today
        FROM public.ai_global_usage
        WHERE guest_id = v_guest_uuid AND date = v_today;

        IF v_used_today < v_daily_free_limit THEN
            PERFORM public.increment_global_usage(NULL, v_guest_id_trim, p_model_type);
            RETURN json_build_object(
                'allowed', true,
                'source', 'free_tier_guest',
                'remaining', v_daily_free_limit - v_used_today - 1
            );
        END IF;

        RETURN json_build_object('allowed', false, 'reason', 'CREDITS_EXHAUSTED');
    END IF;

    IF NOT public.is_service_role() THEN
        IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
            RETURN json_build_object('allowed', false, 'reason', 'FORBIDDEN');
        END IF;
    END IF;

    -- Serializza solo consume_ai_credits per lo stesso utente. La riga di
    -- credito è poi presa con FOR UPDATE e il decremento esige remaining > 0.
    -- grant_admin_ai_credits inserisce un'altra riga e non prende questo lock:
    -- quella funzione è in 20260527120000 e non si sostituisce qui.
    PERFORM pg_advisory_xact_lock(hashtext('ai_consume_user:' || p_user_id::text));

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND role IN ('admin_all', 'admin_limited')
    ) INTO v_is_admin;

    IF v_is_admin THEN
        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'admin');
    END IF;

    SELECT
        s.current_period_start::date,
        (pv.ai_limits->'models'->>p_model_type)::integer,
        pv.id
    INTO v_start_date, v_monthly_limit, v_pricing_version_id
    FROM public.subscriptions s
    JOIN public.pricing_versions pv ON s.pricing_version_id = pv.id
    WHERE s.user_id = p_user_id AND s.status = 'active'
    ORDER BY s.end_date DESC LIMIT 1;

    IF v_monthly_limit IS NOT NULL AND v_monthly_limit > 0 THEN
        SELECT COALESCE(sum(request_count), 0) INTO v_used_this_month
        FROM public.ai_global_usage
        WHERE user_id = p_user_id
          AND model_type = p_model_type
          AND date >= v_start_date;

        IF v_used_this_month < v_monthly_limit THEN
            PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
            RETURN json_build_object(
                'allowed', true,
                'source', 'subscription',
                'pricing_version_id', v_pricing_version_id,
                'remaining', v_monthly_limit - v_used_this_month - 1
            );
        END IF;
    END IF;

    SELECT id INTO v_credit_record_id
    FROM public.user_ai_credits
    WHERE user_id = p_user_id
      AND (CASE WHEN p_model_type = 'flash' THEN flash_remaining ELSE pro_remaining END) > 0
      AND (
          expires_at > now()
          OR (source = 'referral'::public.ai_credit_source AND expires_at IS NULL)
      )
    ORDER BY expires_at ASC NULLS LAST
    LIMIT 1
    FOR UPDATE;

    IF v_credit_record_id IS NOT NULL THEN
        IF p_model_type = 'flash' THEN
            UPDATE public.user_ai_credits
            SET flash_remaining = flash_remaining - 1
            WHERE id = v_credit_record_id
              AND flash_remaining > 0;
        ELSE
            UPDATE public.user_ai_credits
            SET pro_remaining = pro_remaining - 1
            WHERE id = v_credit_record_id
              AND pro_remaining > 0;
        END IF;

        IF FOUND THEN
            PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
            RETURN json_build_object('allowed', true, 'source', 'extra_credits', 'record_id', v_credit_record_id);
        END IF;
    END IF;

    SELECT (value->>'daily_free_cap')::integer INTO v_daily_free_limit
    FROM public.global_settings WHERE key = 'ai_limits_global' LIMIT 1;

    v_daily_free_limit := COALESCE(v_daily_free_limit, 10);

    SELECT COALESCE(sum(request_count), 0) INTO v_used_today
    FROM public.ai_global_usage
    WHERE user_id = p_user_id AND date = v_today;

    IF v_used_today < v_daily_free_limit THEN
        PERFORM public.increment_global_usage(p_user_id, NULL, p_model_type);
        RETURN json_build_object('allowed', true, 'source', 'free_tier', 'remaining', v_daily_free_limit - v_used_today - 1);
    END IF;

    RETURN json_build_object('allowed', false, 'reason', 'CREDITS_EXHAUSTED');
END;
$$;

INSERT INTO public.platform_feature_flags (
    key, category, label, value_type, default_value,
    supports_schedule, supports_audience, manual_override, message_key, audit_required
) VALUES
    (
        'feature.platform.referral',
        'platform',
        'Porta un Amico',
        'boolean',
        'false'::jsonb,
        false,
        false,
        NULL,
        'referral_program_disabled',
        true
    ),
    (
        'feature.platform.referral_flash',
        'platform',
        'Crediti Flash Porta un Amico',
        'number',
        '15'::jsonb,
        false,
        false,
        NULL,
        NULL,
        true
    ),
    (
        'feature.platform.referral_pro',
        'platform',
        'Crediti Pro Porta un Amico',
        'number',
        '5'::jsonb,
        false,
        false,
        NULL,
        NULL,
        true
    )
ON CONFLICT (key) DO NOTHING;

-- Non sovrascrive un override amministrativo. Rifiuta una riga già presente
-- il cui tipo o i cui valori non sono quelli del contratto.
DO $referral_flags_existing$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.platform_feature_flags
    WHERE key = 'feature.platform.referral'
      AND (
        value_type IS DISTINCT FROM 'boolean'
        OR jsonb_typeof(default_value) IS DISTINCT FROM 'boolean'
        OR (
          manual_override IS NOT NULL
          AND jsonb_typeof(manual_override) IS DISTINCT FROM 'boolean'
        )
      )
  ) OR EXISTS (
    SELECT 1
    FROM public.platform_feature_flags
    WHERE key IN ('feature.platform.referral_flash', 'feature.platform.referral_pro')
      AND (
        value_type IS DISTINCT FROM 'number'
        OR jsonb_typeof(default_value) IS DISTINCT FROM 'number'
        OR CASE
             WHEN jsonb_typeof(default_value) = 'number'
             THEN (default_value #>> '{}')::numeric
           END IS NULL
        OR CASE
             WHEN jsonb_typeof(default_value) = 'number'
             THEN (default_value #>> '{}')::numeric
           END < 0
        OR CASE
             WHEN jsonb_typeof(default_value) = 'number'
             THEN (default_value #>> '{}')::numeric
           END <> trunc(CASE
             WHEN jsonb_typeof(default_value) = 'number'
             THEN (default_value #>> '{}')::numeric
           END)
        OR CASE
             WHEN jsonb_typeof(default_value) = 'number'
             THEN (default_value #>> '{}')::numeric
           END > 2147483647
        OR (
          manual_override IS NOT NULL
          AND (
            jsonb_typeof(manual_override) IS DISTINCT FROM 'number'
            OR CASE
                 WHEN jsonb_typeof(manual_override) = 'number'
                 THEN (manual_override #>> '{}')::numeric
               END IS NULL
            OR CASE
                 WHEN jsonb_typeof(manual_override) = 'number'
                 THEN (manual_override #>> '{}')::numeric
               END < 0
            OR CASE
                 WHEN jsonb_typeof(manual_override) = 'number'
                 THEN (manual_override #>> '{}')::numeric
               END <> trunc(CASE
                 WHEN jsonb_typeof(manual_override) = 'number'
                 THEN (manual_override #>> '{}')::numeric
               END)
            OR CASE
                 WHEN jsonb_typeof(manual_override) = 'number'
                 THEN (manual_override #>> '{}')::numeric
               END > 2147483647
          )
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Un flag Porta un Amico esiste già con value_type o valore incompatibile. Nessun override è stato sovrascritto.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_flags_existing$;

INSERT INTO public.system_messages (key, type, label, title_template, body_template, device_target, updated_at)
SELECT
    'referral_program_disabled',
    'internal',
    'Porta un Amico disattivato',
    'Porta un Amico',
    'La funzione Porta un Amico è temporaneamente disattivata.',
    'all',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.system_messages WHERE key = 'referral_program_disabled'
);

-- CREATE OR REPLACE conserva proprietario e ACL. Qui si rifiuta solo ciò
-- che il catalogo può smentire: defininer assente, search_path diverso,
-- proprietario anon/authenticated/service_role, EXECUTE di redeem e degli
-- importi diverso dal GRANT di questo file. I grant già presenti di
-- get_current_ai_quota e consume_ai_credits non vengono revocati: il nome
-- del ruolo di migrazione non è nel repository.
DO $referral_definer_contract$
DECLARE
  v_fn oid;
  v_name text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'public.redeem_referral_code(text)',
    'public.referral_program_enabled()',
    'public.referral_prize_amount(text,integer)',
    'public.get_current_ai_quota(uuid)',
    'public.consume_ai_credits(uuid,text,text,text)'
  ]
  LOOP
    v_fn := to_regprocedure(v_name);
    IF v_fn IS NULL OR NOT EXISTS (
      SELECT 1
      FROM pg_proc AS fn
      JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
      WHERE fn.oid = v_fn
        AND fn.prosecdef
        AND owner_role.rolname NOT IN ('anon', 'authenticated', 'service_role')
        AND EXISTS (
          SELECT 1
          FROM unnest(coalesce(fn.proconfig, ARRAY[]::text[])) AS cfg
          WHERE regexp_replace(lower(cfg), '[[:space:]]+', '', 'g') = 'search_path=public,pg_temp'
        )
    ) THEN
      RAISE EXCEPTION
        '% non è SECURITY DEFINER con search_path public, pg_temp e un proprietario fuori dai ruoli API. CREATE OR REPLACE non corregge il proprietario.',
        v_name
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  IF NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.redeem_referral_code(text)'::regprocedure
       ),
       'public.referral_program_enabled()',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.redeem_referral_code(text)'::regprocedure
       ),
       'public.referral_prize_amount(text,integer)',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.get_current_ai_quota(uuid)'::regprocedure
       ),
       'public.is_service_role()',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.get_current_ai_quota(uuid)'::regprocedure
       ),
       'public.is_td_admin(uuid)',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.consume_ai_credits(uuid,text,text,text)'::regprocedure
       ),
       'public.is_service_role()',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.consume_ai_credits(uuid,text,text,text)'::regprocedure
       ),
       'public.is_td_admin(uuid)',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       (
         SELECT owner_role.oid
         FROM pg_proc AS fn
         JOIN pg_roles AS owner_role ON owner_role.oid = fn.proowner
         WHERE fn.oid = 'public.consume_ai_credits(uuid,text,text,text)'::regprocedure
       ),
       'public.increment_global_usage(uuid,text,text)',
       'EXECUTE'
     )
     OR NOT has_function_privilege('authenticated', 'public.redeem_referral_code(text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.redeem_referral_code(text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.redeem_referral_code(text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.referral_program_enabled()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.referral_program_enabled()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.referral_program_enabled()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.referral_prize_amount(text,integer)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.referral_prize_amount(text,integer)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.referral_prize_amount(text,integer)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_current_ai_quota(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_current_ai_quota(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_current_ai_quota(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('anon', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.consume_ai_credits(uuid,text,text,text)', 'EXECUTE')
  THEN
    RAISE EXCEPTION
      'Gli EXECUTE di redeem, flag, saldo o consumo non coincidono per anon, authenticated o service_role, oppure il proprietario SECURITY DEFINER non può eseguire un helper che chiama. has_function_privilege include PUBLIC e le membership. Gli altri ruoli non sono elencati. I grant storici di consumo e saldo non sono stati revocati. CREATE OR REPLACE non cambia il proprietario.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$referral_definer_contract$;

COMMIT;
