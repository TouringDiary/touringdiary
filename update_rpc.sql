-- Definisce una funzione per approvare uno sponsor e creare la sua sottoscrizione
-- utilizzando un ID di versione di prezzo esplicito, con il corretto type casting per l'''ID sponsor.
CREATE OR REPLACE FUNCTION approve_sponsor_with_subscription(
    p_sponsor_id uuid,
    p_pricing_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_duration_days integer;
    v_price numeric;
    v_currency text;
    v_start_date timestamptz;
    v_end_date timestamptz;
    v_new_log jsonb;
    v_current_logs jsonb;
BEGIN
    -- 1. Legge i dettagli (durata, prezzo, valuta) direttamente dalla pricing_version specificata
    SELECT
        pv.duration_days,
        pv.price,
        pv.currency
    INTO
        v_duration_days,
        v_price,
        v_currency
    FROM
        public.pricing_versions AS pv
    WHERE
        pv.id = p_pricing_version_id;

    -- Se non viene trovata nessuna versione di prezzo, solleva un'''eccezione
    IF NOT FOUND THEN
        RAISE EXCEPTION '''Pricing version with ID % not found''', p_pricing_version_id;
    END IF;

    -- 2. Calcola la data di inizio e di fine usando timestamptz
    v_start_date := now();
    v_end_date := v_start_date + (v_duration_days || ''' days''')::interval;

    -- 3. Inserisce il record nello storico delle sottoscrizioni usando le colonne corrette
    INSERT INTO public.sponsor_subscriptions (
        id,
        sponsor_id,
        pricing_version_id,
        price_paid,
        currency_paid,
        start_date,
        end_date,
        status,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        p_sponsor_id,
        p_pricing_version_id,
        v_price,
        v_currency,
        v_start_date,
        v_end_date,
        '''ACTIVE''',
        now()
    );

    -- 4. Prepara il log di sistema da aggiungere alla chat del partner
    v_new_log := jsonb_build_object(
        '''id''', gen_random_uuid(),
        '''date''', now(),
        '''type''', '''system''',
        '''message''', '''Sponsorizzazione attivata. Durata: ''' || v_duration_days || ''' giorni. Scadenza: ''' || to_char(v_end_date, '''DD/MM/YYYY''') || '''.''',
        '''direction''', '''outbound''',
        '''isUnread''', true
    );
    
    -- Recupera i log esistenti per non sovrascriverli, usando il cast a text
    SELECT partner_logs INTO v_current_logs FROM public.sponsors WHERE id = p_sponsor_id::text;

    -- 5. Aggiorna la tabella sponsors con stato, date e importo, usando il cast a text
    UPDATE public.sponsors
    SET
        status = '''approved''',
        start_date = v_start_date,
        end_date = v_end_date,
        amount = v_price,
        partner_logs = COALESCE(v_current_logs, '''[]'''::jsonb) || v_new_log
    WHERE
        id = p_sponsor_id::text; -- CORREZIONE APPLICATA QUI
END;
$$;