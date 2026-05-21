-- ==========================================
-- PHASE 1: SPONSOR SYSTEM REFACTOR MIGRATIONS
-- Date: 2026-04-15
-- ==========================================

BEGIN;

-- 1. ESTENSIONE SPONSOR_REQUESTS (NUOVI CAMPI)
-- Aggiungiamo metadati UI e campi specifici per Guide Turistiche
ALTER TABLE public.sponsor_requests 
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS specialties text[],
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS coords_lat double precision,
ADD COLUMN IF NOT EXISTS coords_lng double precision,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS description text;

-- 2. MIGRAZIONE SPONSORS.ID TEXT -> UUID
-- Creazione colonna temporanea tipizzata
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS id_uuid uuid DEFAULT gen_random_uuid();
-- Popolamento tramite casting (ID esistenti confermati come validi UUID serializzati)
UPDATE public.sponsors SET id_uuid = id::uuid;

-- 3. AGGIORNAMENTO FK SPONSOR_SUBSCRIPTIONS
-- Casting della colonna sponsor_id per matchare il tipo UUID
ALTER TABLE public.sponsor_subscriptions
DROP CONSTRAINT sponsor_subscriptions_sponsor_id_fkey;

ALTER TABLE public.sponsor_subscriptions
ALTER COLUMN sponsor_id TYPE uuid USING sponsor_id::uuid;

-- 4. SWITCH COLONNA DEFINITIVA E RIPRISTINO PRIMARY KEY
-- Rimuoviamo il vecchio vincolo PK e la colonna TEXT
ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_pkey;
ALTER TABLE public.sponsors DROP COLUMN IF EXISTS id;
-- Rinominiamo la colonna UUID e impostiamo come Primary Key
ALTER TABLE public.sponsors RENAME COLUMN id_uuid TO id;
ALTER TABLE public.sponsors ADD PRIMARY KEY (id);

-- 5. RIPRISTINO FOREIGN KEY SPONSOR_SUBSCRIPTIONS
-- Riaggiungiamo il vincolo di integrità referenziale per le sottoscrizioni
ALTER TABLE public.sponsor_subscriptions
ADD CONSTRAINT sponsor_subscriptions_sponsor_id_fkey
FOREIGN KEY (sponsor_id)
REFERENCES public.sponsors(id);

-- 6. AGGIUNTA COLONNE RESOURCE LINKING (POI, SHOP, GUIDE, OPERATOR)
-- Queste colonne permettono il resolver basato su FK invece di vat_number
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS poi_id text REFERENCES public.pois(id),
ADD COLUMN IF NOT EXISTS shop_id text REFERENCES public.shops(id),
ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES public.city_guides(id),
ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES public.city_tour_operators(id);

-- 7. INDICE PRESTAZIONI PER RESOLVER
-- Ottimizza i lookup frequenti per città e stato sponsor
CREATE INDEX IF NOT EXISTS idx_sponsors_city_status
ON public.sponsors(city_id, status);

COMMIT;

-- 8. CREAZIONE RPC ATOMICA: activate_sponsor_with_resource
-- Logica integrata per creazione risorsa e attivazione finanziaria
CREATE OR REPLACE FUNCTION activate_sponsor_with_resource(
    p_sponsor_id uuid,
    p_request_id uuid,
    p_pricing_version_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req record;
    v_spon record;
    v_res_id uuid;
    v_duration_days integer;
    v_price numeric;
    v_currency text;
    v_start_date timestamptz := now();
    v_end_date timestamptz;
BEGIN
    -- A. Recupero e validazione dati reali
    SELECT * INTO v_req FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;
    SELECT * INTO v_spon FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_spon IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;
    
    
    -- Recupero e validazione dettagli pricing
    SELECT duration_days, price, currency 
    INTO v_duration_days, v_price, v_currency 
    FROM public.pricing_versions 
    WHERE id = p_pricing_version_id;

    IF v_duration_days IS NULL THEN
        RAISE EXCEPTION 'Invalid pricing_version_id: %', p_pricing_version_id;
    END IF;

    v_end_date := v_start_date + (v_duration_days || ' days')::interval;

    -- B. Creazione Risorsa Automatica in base a sponsors.type
    CASE v_spon.type
        WHEN 'activity' THEN
            INSERT INTO public.pois (city_id, name, category, description, image_url, coords_lat, coords_lng, address, status, is_sponsored, tier)
            VALUES (v_req.city_id, v_req.company_name, v_req.poi_category, v_req.description, v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address, 'published', true, v_spon.tier)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET poi_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'shop' THEN
            INSERT INTO public.shops (name, vat_number, city_id, is_active, layout_config)
            VALUES (v_req.company_name, v_req.vat_number, v_req.city_id, true, '{}'::jsonb)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'guide' THEN
            INSERT INTO public.city_guides (city_id, name, image_url, email, phone, license_number, languages, specialties, is_official)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.email, v_req.phone, v_req.license_number, v_req.languages, v_req.specialties, false)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'tour_operator' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.email, v_req.phone)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id WHERE id = p_sponsor_id;
    END CASE;

    IF v_res_id IS NULL THEN
        RAISE EXCEPTION 'Resource creation failed for sponsor %', p_sponsor_id;
    END IF;

    -- C. Attivazione Sottoscrizione Finanziaria
    INSERT INTO public.sponsor_subscriptions (sponsor_id, pricing_version_id, price_paid, currency_paid, start_date, end_date, status)
    VALUES (p_sponsor_id, p_pricing_version_id, v_price, v_currency, v_start_date, v_end_date, 'ACTIVE');

    -- D. Aggiornamento Stato Sponsor
    UPDATE public.sponsors 
    SET status = 'approved', start_date = v_start_date, end_date = v_end_date, amount = v_price
    WHERE id = p_sponsor_id;

    -- E. Marcatura Richiesta come 'converted' (Consumata)
    UPDATE public.sponsor_requests 
    SET status = 'converted', updated_at = now() 
    WHERE id = p_request_id;

    RETURN v_res_id;
END;
$$;
