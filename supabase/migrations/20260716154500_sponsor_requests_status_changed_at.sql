-- ==========================================
-- Sponsor requests — timestamp semantico status_changed_at
-- Date: 2026-07-16
-- Contesto: lacuna modello dati emersa in test funzionale post Fase 2.4
-- Motivo: le RPC scrivevano updated_at su sponsor_requests (colonna inesistente)
-- Decisione: NON introdurre updated_at generico; aggiungere status_changed_at
-- Out of scope: trigger, audit, storici, backfill
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Schema — status_changed_at (NULL iniziale, nessun backfill)
-- ---------------------------------------------------------------------------
ALTER TABLE public.sponsor_requests
    ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NULL;

COMMENT ON COLUMN public.sponsor_requests.status_changed_at IS
    'Timestamp dell''ultimo cambio di status della richiesta. NULL fino al primo passaggio di stato. Non aggiornato su sole note admin o campi descrittivi.';

-- ---------------------------------------------------------------------------
-- 2. approve_sponsor_request — pending → waiting_payment
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_sponsor_request(p_request_id uuid)
RETURNS public.sponsor_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsor_requests;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Sponsor request must be in pending status, got: %', v_row.status
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.sponsor_requests
    SET status = 'waiting_payment',
        status_changed_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_sponsor_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_sponsor_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_sponsor_request(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. reject_sponsor_request — pending → rejected
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_sponsor_request(
    p_request_id uuid,
    p_reason text,
    p_admin_notes text DEFAULT NULL
)
RETURNS public.sponsor_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsor_requests;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Sponsor request must be in pending status, got: %', v_row.status
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.sponsor_requests
    SET status = 'rejected',
        rejection_reason = p_reason,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        status_changed_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_sponsor_request(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_sponsor_request(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_sponsor_request(uuid, text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. update_sponsor_request_admin_notes — SOLO note (nessun status_changed_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_sponsor_request_admin_notes(
    p_request_id uuid,
    p_notes text
)
RETURNS public.sponsor_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsor_requests;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    UPDATE public.sponsor_requests
    SET admin_notes = p_notes,
        admin_notes_last_updated = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. activate_sponsor_from_request — waiting_payment → converted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_sponsor_from_request(
    p_request_id uuid,
    p_pricing_version_id uuid,
    p_amount numeric,
    p_invoice_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_req record;
    v_sponsor_id uuid;
    v_res_id uuid;
    v_duration_days integer;
    v_price numeric;
    v_currency text;
    v_plan_type text;
    v_start_date timestamptz := now();
    v_end_date timestamptz;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Activation amount must be greater than zero'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_invoice_number IS NULL OR btrim(p_invoice_number) = '' THEN
        RAISE EXCEPTION 'Invoice number is required'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_req FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_req.status IS DISTINCT FROM 'waiting_payment' THEN
        RAISE EXCEPTION 'Sponsor request must be in waiting_payment status, got: %', v_req.status
            USING ERRCODE = 'P0001';
    END IF;

    IF v_req.city_id IS NULL THEN
        RAISE EXCEPTION 'Sponsor request city_id is required for activation'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_req.type IS NULL THEN
        RAISE EXCEPTION 'Sponsor request type is required for activation'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_req.pricing_version_id IS NOT NULL
       AND p_pricing_version_id IS DISTINCT FROM v_req.pricing_version_id THEN
        RAISE EXCEPTION 'Pricing version mismatch for request %', p_request_id
            USING ERRCODE = 'P0001';
    END IF;

    SELECT pv.duration_days, pv.price, pv.currency, pl.type
    INTO v_duration_days, v_price, v_currency, v_plan_type
    FROM public.pricing_versions pv
    JOIN public.plans pl ON pl.id = pv.plan_id
    WHERE pv.id = p_pricing_version_id;

    IF v_duration_days IS NULL THEN
        RAISE EXCEPTION 'Invalid pricing_version_id: %', p_pricing_version_id;
    END IF;

    v_end_date := v_start_date + (v_duration_days || ' days')::interval;

    INSERT INTO public.sponsors (
        company_name,
        vat_number,
        email,
        address,
        city_id,
        pricing_version_id,
        status,
        owner_id,
        profile_id,
        type,
        request_id,
        amount,
        invoice_number,
        tier,
        plan,
        start_date,
        end_date,
        contact_name,
        phone,
        poi_category,
        poi_sub_category
    ) VALUES (
        v_req.company_name,
        v_req.vat_number,
        v_req.requester_email,
        v_req.address,
        v_req.city_id,
        p_pricing_version_id,
        'approved',
        v_req.owner_id,
        v_req.profile_id,
        v_req.type,
        p_request_id,
        p_amount,
        btrim(p_invoice_number),
        v_plan_type,
        v_plan_type,
        v_start_date::date,
        v_end_date::date,
        v_req.requester_name,
        v_req.requester_phone,
        v_req.poi_category,
        v_req.poi_sub_category
    )
    RETURNING id INTO v_sponsor_id;

    CASE v_req.type
        WHEN 'activity' THEN
            INSERT INTO public.pois (city_id, name, category, description, image_url, coords_lat, coords_lng, address, status, is_sponsored, tier, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.poi_category, v_req.description, v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address, 'published', true, v_plan_type, v_req.requester_phone)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET poi_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'shop' THEN
            INSERT INTO public.shops (name, vat_number, city_id, is_active)
            VALUES (v_req.company_name, v_req.vat_number, v_req.city_id, true)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'guide' THEN
            INSERT INTO public.city_guides (city_id, name, image_url, email, phone, license_number, languages, specialties, is_official)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone, v_req.license_number, v_req.languages, v_req.specialties, false)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'tour_operator' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone)
            RETURNING id INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id WHERE id = v_sponsor_id;

        ELSE
            RAISE EXCEPTION 'Unsupported sponsor request type: %', v_req.type
                USING ERRCODE = 'P0001';
    END CASE;

    IF v_res_id IS NULL THEN
        RAISE EXCEPTION 'Resource creation failed for sponsor %', v_sponsor_id;
    END IF;

    INSERT INTO public.subscriptions (
        sponsor_id,
        pricing_version_id,
        price_paid,
        currency_paid,
        start_date,
        end_date,
        auto_renew,
        status,
        current_period_start,
        current_period_end
    )
    VALUES (
        v_sponsor_id,
        p_pricing_version_id,
        v_price,
        v_currency,
        v_start_date,
        v_end_date,
        false,
        'active',
        v_start_date,
        v_end_date
    );

    UPDATE public.sponsors
    SET status = 'approved',
        start_date = v_start_date::date,
        end_date = v_end_date::date,
        amount = p_amount
    WHERE id = v_sponsor_id;

    UPDATE public.sponsor_requests
    SET status = 'converted',
        status_changed_at = now()
    WHERE id = p_request_id;

    RETURN v_sponsor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_sponsor_from_request(uuid, uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_sponsor_from_request(uuid, uuid, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.activate_sponsor_from_request(uuid, uuid, numeric, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. activate_sponsor_with_resource (legacy) — waiting_payment → converted
--    Mantenuta allineata allo schema anche se revocata dal client (O9).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_sponsor_with_resource(
    p_request_id uuid,
    p_sponsor_id uuid,
    p_pricing_version_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_req FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_req.status IS DISTINCT FROM 'waiting_payment' THEN
        RAISE EXCEPTION 'Sponsor request must be in waiting_payment status, got: %', v_req.status
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_spon FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_spon IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    IF v_spon.request_id IS DISTINCT FROM p_request_id THEN
        RAISE EXCEPTION 'Sponsor % is not linked to request %', p_sponsor_id, p_request_id
            USING ERRCODE = 'P0001';
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

    INSERT INTO public.subscriptions (sponsor_id, pricing_version_id, price_paid, currency_paid, start_date, end_date, auto_renew, status, current_period_start, current_period_end)
    VALUES (p_sponsor_id, p_pricing_version_id, v_price, v_currency, v_start_date, v_end_date, false, 'active', v_start_date, v_end_date);

    UPDATE public.sponsors
    SET status = 'approved', start_date = v_start_date, end_date = v_end_date, amount = v_price
    WHERE id = p_sponsor_id;

    UPDATE public.sponsor_requests
    SET status = 'converted',
        status_changed_at = now()
    WHERE id = p_request_id;

    RETURN v_res_id;
END;
$$;

-- Privilegi legacy: restano revocati dal client (Fase 2.3 O9); service_role invariato.
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) TO service_role;

COMMIT;
