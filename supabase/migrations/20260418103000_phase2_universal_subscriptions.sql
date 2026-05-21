-- ==========================================
-- SUB-SYSTEM REFACTOR - PHASE 2
-- Date: 2026-04-18
-- Description: RPCs, Triggers e Schedulers per Subscriptions
-- ==========================================

BEGIN;

-- 1. UPGRADE SCHEMA PER STRIPE E RINNOVI (Punti 10 e 11)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;


-- 2. AGGIORNAMENTO RPC: activate_sponsor_with_resource (Punto 1)
-- Implementa il dual-write per mantenere la retrocompatibilità (sponsor_subscriptions)
-- E per instradare sul nuovo engine (subscriptions).
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
    SELECT * INTO v_req FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;
    SELECT * INTO v_spon FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_spon IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;
    
    SELECT duration_days, price, currency 
    INTO v_duration_days, v_price, v_currency 
    FROM public.pricing_versions 
    WHERE id = p_pricing_version_id;

    IF v_duration_days IS NULL THEN
        RAISE EXCEPTION 'Invalid pricing_version_id: %', p_pricing_version_id;
    END IF;

    v_end_date := v_start_date + (v_duration_days || ' days')::interval;

    CASE v_spon.type
        WHEN 'activity' THEN
            INSERT INTO public.pois (city_id, name, category, description, image_url, coords_lat, coords_lng, address, status, is_sponsored, tier, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.poi_category, v_req.description, v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address, 'published', true, v_spon.tier, v_req.requester_phone)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET poi_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'shop' THEN
            INSERT INTO public.shops (name, vat_number, city_id, is_active)
            VALUES (v_req.company_name, v_req.vat_number, v_req.city_id, true)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'guide' THEN
            INSERT INTO public.city_guides (city_id, name, image_url, email, phone, license_number, languages, specialties, is_official)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone, v_req.license_number, v_req.languages, v_req.specialties, false)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'tour_operator' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id WHERE id = p_sponsor_id;
    END CASE;

    IF v_res_id IS NULL THEN
        RAISE EXCEPTION 'Resource creation failed for sponsor %', p_sponsor_id;
    END IF;

    -- SCRITTURA SUL VECCHIO SISTEMA (Retrocompatibile)
    INSERT INTO public.sponsor_subscriptions (sponsor_id, pricing_version_id, price_paid, currency_paid, start_date, end_date, status)
    VALUES (p_sponsor_id, p_pricing_version_id, v_price, v_currency, v_start_date, v_end_date, 'ACTIVE');

    -- SCRITTURA SUL NUOVO SISTEMA UNIFICATO
    INSERT INTO public.subscriptions (sponsor_id, pricing_version_id, price_paid, currency_paid, start_date, end_date, auto_renew, status, current_period_start, current_period_end)
    VALUES (p_sponsor_id, p_pricing_version_id, v_price, v_currency, v_start_date, v_end_date, false, 'active', v_start_date, v_end_date);

    UPDATE public.sponsors 
    SET status = 'approved', start_date = v_start_date, end_date = v_end_date, amount = v_price
    WHERE id = p_sponsor_id;

    UPDATE public.sponsor_requests 
    SET status = 'converted', updated_at = now() 
    WHERE id = p_request_id;

    RETURN v_res_id;
END;
$$;


-- 3. NUOVA RPC: activate_premium_user (Punto 2)
CREATE OR REPLACE FUNCTION activate_premium_user(
    p_user_id uuid,
    p_pricing_version_id uuid,
    p_campaign_id uuid DEFAULT NULL,
    p_stripe_customer_id text DEFAULT NULL,
    p_stripe_subscription_id text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_duration_days integer;
    v_price numeric;
    v_currency text;
    v_start_date timestamptz := now();
    v_end_date timestamptz;
    v_sub_id uuid;
BEGIN
    SELECT duration_days, price, currency 
    INTO v_duration_days, v_price, v_currency 
    FROM public.pricing_versions 
    WHERE id = p_pricing_version_id;

    IF v_duration_days IS NULL THEN
        RAISE EXCEPTION 'Invalid pricing_version_id: %', p_pricing_version_id;
    END IF;

    v_end_date := v_start_date + (v_duration_days || ' days')::interval;

    -- Inserimento del nuovo abbonamento (SENZA modificare i rules core del db)
    INSERT INTO public.subscriptions (
        user_id, pricing_version_id, campaign_id, price_paid, currency_paid, 
        start_date, end_date, status, auto_renew, 
        stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end
    ) VALUES (
        p_user_id, p_pricing_version_id, p_campaign_id, v_price, v_currency, 
        v_start_date, v_end_date, 'active', true,
        p_stripe_customer_id, p_stripe_subscription_id, v_start_date, v_end_date
    ) RETURNING id INTO v_sub_id;

    RETURN v_sub_id;
END;
$$;


-- 4. STRUTTURA SCHEDULER (Punto 3)
CREATE OR REPLACE FUNCTION check_and_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND end_date < now();
END;
$$;


-- 5. TRIGGER DI SINCRONIZZAZIONE (Punto 4 e 5)
CREATE OR REPLACE FUNCTION handle_subscription_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'active' AND NEW.status = 'expired' THEN
        -- Sincronizza lo stato dello sponsor se pertinente
        IF NEW.sponsor_id IS NOT NULL THEN
            UPDATE public.sponsors SET status = 'expired' WHERE id = NEW.sponsor_id;
        END IF;

        -- Nota sulle utenze turiste (Punto 5): 
        -- Il backend decoterà già a un profilo Free quando constata
        -- che non vi è una subscription "active". Eventuali wipeout di token
        -- possono però essere gestiti dinamicamente o qui, ma rispettando la richiesta (Niente touch su Role).
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_subscription_expired ON public.subscriptions;

CREATE TRIGGER trigger_on_subscription_expired
AFTER UPDATE OF status ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION handle_subscription_expiration();

COMMIT;
