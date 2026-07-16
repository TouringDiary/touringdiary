-- ==========================================
-- WF-02 STEP-2 Fase 2.1 — Contenimento critico P0 (DOC 29 Fase 1)
-- Date: 2026-07-14
-- Closes: B9, B2, B7, B6, B5, A11 (policy messages), VT-SPONSOR-PUBLIC-READ (anon column hardening)
-- Out of scope: B1 RPC gateway (Fase 2.2), B8 REVOKE CRUD messages (Fase 2.5), B10 auxiliary RPC (P1)
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Hardening activate_sponsor_with_resource (B9, B2, B7)
--    Body aligned to remote SSOT (subscriptions only — no sponsor_subscriptions).
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
    SET status = 'converted', updated_at = now()
    WHERE id = p_request_id;

    RETURN v_res_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.activate_sponsor_with_resource(uuid, uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. sponsor_messages — bonifica admin_city → is_td_admin (B5, A11 / DL-027)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all sponsor messages" ON public.sponsor_messages;

CREATE POLICY "Admins can manage all sponsor messages"
ON public.sponsor_messages
FOR ALL
TO authenticated
USING (public.is_td_admin(auth.uid()))
WITH CHECK (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. sponsor_requests — revoca INSERT anon + INSERT authenticated scoped (B6 / O1)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS public_insert_sponsor_requests ON public.sponsor_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert sponsor requests" ON public.sponsor_requests;

CREATE POLICY "Authenticated users insert own sponsor requests"
ON public.sponsor_requests
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND profile_id = auth.uid()
    AND (owner_id IS NULL OR owner_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 4. VT-SPONSOR-PUBLIC-READ — colonne sensibili non leggibili da anon (DL-032)
-- ---------------------------------------------------------------------------
REVOKE SELECT (
    admin_notes,
    admin_notes_last_updated,
    partner_logs,
    email,
    phone,
    vat_number,
    amount,
    invoice_number,
    owner_id,
    profile_id,
    rejection_reason
) ON public.sponsors FROM anon;

COMMIT;
