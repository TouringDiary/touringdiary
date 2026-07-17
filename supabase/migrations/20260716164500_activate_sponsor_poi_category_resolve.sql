-- ==========================================
-- Bugfix attivazione Sponsor — pois.category (pois_category_check)
-- Date: 2026-07-16
-- Contesto: activate_sponsor_from_request INSERT pois con category non ammessa
--           (es. 'activity' da sponsor_requests.poi_category)
-- Decisione: sanitizzare/mappare category come resolvePlanPoiCategory + poiWrite;
--           nessun cambio CHECK; nessuna nuova categoria; nessuna pipeline Sponsor
-- Specchio TS: src/services/sponsors/sponsorResolvers.ts (resolvePlanPoiCategory)
--              src/services/city/poi/poiWrite.ts (allowlist + fallback discovery)
-- Out of scope: claim/rivendica POI esistente; ID Governance; form submit category
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper unico (evita duplicare le regole nelle due RPC)
-- 1) se p_poi_category è già una categoria POI ammessa dal CHECK live → usala
-- 2) altrimenti mappa dal plan type (mirror resolvePlanPoiCategory)
-- 3) fallback 'discovery' (mirror poiWrite / normalizePoiCategory)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_poi_category_for_sponsor_activation(
    p_plan_type text,
    p_poi_category text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cat text := lower(btrim(coalesce(p_poi_category, '')));
BEGIN
    -- Allowlist allineata al CHECK live pois_category_check (nessuna categoria nuova)
    IF v_cat IN (
        'monument', 'food', 'hotel', 'nature',
        'discovery', 'leisure', 'shop', 'service'
    ) THEN
        RETURN v_cat;
    END IF;

    -- Mirror resolvePlanPoiCategory (sponsorResolvers.ts)
    CASE p_plan_type
        WHEN 'DIGITAL_SHOWCASE' THEN
            RETURN 'shop';
        WHEN 'TOUR_GUIDE',
             'TOUR_OPERATOR',
             'LOCAL_ACTIVITY',
             'REGIONAL_ACTIVITY',
             'activity' THEN
            RETURN 'discovery';
        ELSE
            RETURN 'discovery';
    END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_poi_category_for_sponsor_activation(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_poi_category_for_sponsor_activation(text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. activate_sponsor_from_request
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
    v_res_id text;
    v_poi_category text;
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
    v_poi_category := public.resolve_poi_category_for_sponsor_activation(
        coalesce(v_plan_type, v_req.type),
        v_req.poi_category
    );

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
        v_poi_category,
        v_req.poi_sub_category
    )
    RETURNING id INTO v_sponsor_id;

    -- Plan type (app) + shorthand legacy (activity/shop/guide/…)
    CASE v_req.type
        WHEN 'activity', 'LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY' THEN
            v_res_id := 'poi_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_'
                || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.pois (
                id, city_id, name, category, description, image_url,
                coords_lat, coords_lng, address, status, is_sponsored, tier, phone
            )
            VALUES (
                v_res_id, v_req.city_id, v_req.company_name, v_poi_category, v_req.description,
                v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address,
                'published', true, v_plan_type, v_req.requester_phone
            );
            UPDATE public.sponsors SET poi_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'shop', 'DIGITAL_SHOWCASE' THEN
            v_res_id := 'shop_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_'
                || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.shops (id, name, vat_number, city_id, is_active)
            VALUES (v_res_id, v_req.company_name, v_req.vat_number, v_req.city_id, true);
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'guide', 'TOUR_GUIDE' THEN
            INSERT INTO public.city_guides (city_id, name, image_url, email, phone, license_number, languages, specialties, is_official)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone, v_req.license_number, v_req.languages, v_req.specialties, false)
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id::uuid WHERE id = v_sponsor_id;

        WHEN 'tour_operator', 'TOUR_OPERATOR' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone)
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id::uuid WHERE id = v_sponsor_id;

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
-- 2. Legacy activate_sponsor_with_resource — stesso resolve category
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_sponsor_with_resource(
    p_request_id uuid,
    p_sponsor_id uuid,
    p_pricing_version_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_req record;
    v_spon record;
    v_res_id text;
    v_poi_category text;
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
    v_poi_category := public.resolve_poi_category_for_sponsor_activation(
        coalesce(v_spon.type, v_req.type),
        coalesce(v_req.poi_category, v_spon.poi_category)
    );

    CASE v_spon.type
        WHEN 'activity', 'LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY' THEN
            v_res_id := 'poi_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_'
                || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.pois (
                id, city_id, name, category, description, image_url,
                coords_lat, coords_lng, address, status, is_sponsored, tier, phone
            )
            VALUES (
                v_res_id, v_req.city_id, v_req.company_name, v_poi_category, v_req.description,
                v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address,
                'published', true, v_spon.tier, v_req.requester_phone
            );
            UPDATE public.sponsors SET poi_id = v_res_id, poi_category = v_poi_category WHERE id = p_sponsor_id;

        WHEN 'shop', 'DIGITAL_SHOWCASE' THEN
            v_res_id := 'shop_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_'
                || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.shops (id, name, vat_number, city_id, is_active)
            VALUES (v_res_id, v_req.company_name, v_req.vat_number, v_req.city_id, true);
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = p_sponsor_id;

        WHEN 'guide', 'TOUR_GUIDE' THEN
            INSERT INTO public.city_guides (city_id, name, image_url, email, phone, license_number, languages, specialties, is_official)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone, v_req.license_number, v_req.languages, v_req.specialties, false)
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id::uuid WHERE id = p_sponsor_id;

        WHEN 'tour_operator', 'TOUR_OPERATOR' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone)
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id::uuid WHERE id = p_sponsor_id;
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

REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) TO service_role;

COMMIT;
