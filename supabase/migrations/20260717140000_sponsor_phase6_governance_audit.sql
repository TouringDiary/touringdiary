-- ==========================================
-- WF-02 STEP-2 Fase 2.6 — Governance e audit Sponsor (DOC 29 Fase 6 / O8)
-- Date: 2026-07-17
-- Closes: C3/O8 audit log; VT-SUX-03 business role on activation
-- Out of scope: Centro di Controllo consumer (STEP-3); messaggistica unificata
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. sponsor_admin_audit_events (O8)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsor_admin_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    request_id uuid REFERENCES public.sponsor_requests (id) ON DELETE SET NULL,
    sponsor_id uuid REFERENCES public.sponsors (id) ON DELETE SET NULL,
    summary text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sponsor_admin_audit_summary_not_blank
        CHECK (char_length(btrim(summary)) > 0)
);

CREATE INDEX IF NOT EXISTS sponsor_admin_audit_events_created_idx
    ON public.sponsor_admin_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS sponsor_admin_audit_events_sponsor_idx
    ON public.sponsor_admin_audit_events (sponsor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS sponsor_admin_audit_events_request_idx
    ON public.sponsor_admin_audit_events (request_id, created_at DESC);

ALTER TABLE public.sponsor_admin_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sponsor audit events" ON public.sponsor_admin_audit_events;
CREATE POLICY "Admins read sponsor audit events"
    ON public.sponsor_admin_audit_events
    FOR SELECT
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

COMMENT ON TABLE public.sponsor_admin_audit_events IS
    'Audit log operazioni amministrative dominio Sponsor (O8 / DL-012).';

-- ---------------------------------------------------------------------------
-- 2. record_sponsor_admin_audit — helper SECURITY DEFINER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_sponsor_admin_audit(
    p_event_type text,
    p_summary text,
    p_request_id uuid DEFAULT NULL,
    p_sponsor_id uuid DEFAULT NULL,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF p_event_type IS NULL OR btrim(p_event_type) = '' THEN
        RAISE EXCEPTION 'event_type is required' USING ERRCODE = 'P0001';
    END IF;

    IF p_summary IS NULL OR btrim(p_summary) = '' THEN
        RAISE EXCEPTION 'summary is required' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.sponsor_admin_audit_events (
        event_type,
        actor_id,
        request_id,
        sponsor_id,
        summary,
        payload
    )
    VALUES (
        btrim(p_event_type),
        auth.uid(),
        p_request_id,
        p_sponsor_id,
        btrim(p_summary),
        COALESCE(p_payload, '{}'::jsonb)
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_sponsor_admin_audit(text, text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_sponsor_admin_audit(text, text, uuid, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_sponsor_admin_audit(text, text, uuid, uuid, jsonb) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Admin RPCs — audit trail (O8)
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
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Sponsor request must be in pending status, got: %', v_row.status USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.sponsor_requests
    SET status = 'waiting_payment',
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    PERFORM public.record_sponsor_admin_audit(
        'approve_sponsor_request',
        format('Approvazione richiesta %s → waiting_payment', p_request_id),
        p_request_id,
        NULL,
        jsonb_build_object('previous_status', 'pending', 'new_status', 'waiting_payment')
    );

    RETURN v_row;
END;
$$;

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
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Sponsor request must be in pending status, got: %', v_row.status USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.sponsor_requests
    SET status = 'rejected',
        rejection_reason = p_reason,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    PERFORM public.record_sponsor_admin_audit(
        'reject_sponsor_request',
        format('Rifiuto richiesta %s', p_request_id),
        p_request_id,
        NULL,
        jsonb_build_object('reason', p_reason)
    );

    RETURN v_row;
END;
$$;

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
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_row FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    UPDATE public.sponsor_requests
    SET admin_notes = p_notes,
        admin_notes_last_updated = now(),
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    PERFORM public.record_sponsor_admin_audit(
        'update_sponsor_request_admin_notes',
        format('Aggiornamento note admin richiesta %s', p_request_id),
        p_request_id,
        NULL,
        jsonb_build_object('notes_length', char_length(COALESCE(p_notes, '')))
    );

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_sponsor_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN: authentication required' USING ERRCODE = '42501';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_caller AND role = 'admin_all'
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin_all privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.sponsor_requests WHERE id = p_request_id) THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    PERFORM public.record_sponsor_admin_audit(
        'delete_sponsor_request',
        format('Eliminazione definitiva richiesta %s', p_request_id),
        p_request_id,
        NULL,
        '{}'::jsonb
    );

    DELETE FROM public.sponsor_requests WHERE id = p_request_id;
END;
$$;

-- cancel / extend — append audit before RETURN (bodies unchanged from Fase 4)
CREATE OR REPLACE FUNCTION public.cancel_sponsor_contract(
    p_sponsor_id uuid,
    p_reason text
)
RETURNS public.sponsors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsors;
    v_admin_label text;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = v_caller AND role = 'admin_all'
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin_all privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Cancellation reason is required' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Sponsor contract must be approved to cancel, got: %', v_row.status USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(p.email, p.id::text) INTO v_admin_label
    FROM public.profiles p WHERE p.id = v_caller;

    UPDATE public.sponsors
    SET status = 'cancelled',
        admin_notes = btrim(p_reason),
        admin_notes_last_updated = now(),
        updated_at = now()
    WHERE id = p_sponsor_id
    RETURNING * INTO v_row;

    UPDATE public.subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE sponsor_id = p_sponsor_id AND status = 'active';

    PERFORM public.append_sponsor_partner_log(
        p_sponsor_id,
        format('Terminazione contratto da %s. Motivo: %s', COALESCE(v_admin_label, 'sistema'), btrim(p_reason)),
        'system'
    );

    PERFORM public.record_sponsor_admin_audit(
        'cancel_sponsor_contract',
        format('Terminazione contratto sponsor %s', p_sponsor_id),
        v_row.request_id,
        p_sponsor_id,
        jsonb_build_object('reason', btrim(p_reason))
    );

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_sponsor_contract(
    p_sponsor_id uuid,
    p_new_end_date date,
    p_reason text
)
RETURNS public.sponsors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsors;
    v_admin_label text;
    v_days integer;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_new_end_date IS NULL THEN
        RAISE EXCEPTION 'New end date is required' USING ERRCODE = 'P0001';
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Extension reason is required' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Sponsor contract must be approved to extend, got: %', v_row.status USING ERRCODE = 'P0001';
    END IF;

    IF v_row.end_date IS NOT NULL AND p_new_end_date <= v_row.end_date::date THEN
        RAISE EXCEPTION 'New end date must be after current end date' USING ERRCODE = 'P0001';
    END IF;

    v_days := (p_new_end_date - COALESCE(v_row.end_date::date, CURRENT_DATE));

    SELECT COALESCE(p.email, p.id::text) INTO v_admin_label
    FROM public.profiles p WHERE p.id = v_caller;

    UPDATE public.sponsors
    SET end_date = p_new_end_date, updated_at = now()
    WHERE id = p_sponsor_id
    RETURNING * INTO v_row;

    UPDATE public.subscriptions
    SET end_date = p_new_end_date,
        current_period_end = p_new_end_date,
        updated_at = now()
    WHERE sponsor_id = p_sponsor_id AND status = 'active';

    PERFORM public.append_sponsor_partner_log(
        p_sponsor_id,
        format(
            'Estensione contratto da %s: +%s giorni fino al %s. Motivo: %s',
            COALESCE(v_admin_label, 'sistema'), v_days, to_char(p_new_end_date, 'YYYY-MM-DD'), btrim(p_reason)
        ),
        'system'
    );

    PERFORM public.record_sponsor_admin_audit(
        'extend_sponsor_contract',
        format('Estensione contratto sponsor %s fino al %s', p_sponsor_id, to_char(p_new_end_date, 'YYYY-MM-DD')),
        v_row.request_id,
        p_sponsor_id,
        jsonb_build_object('days_added', v_days, 'reason', btrim(p_reason))
    );

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_sponsors_bulk(
    p_sponsor_ids uuid[],
    p_days integer,
    p_reason text,
    p_exclude_critical boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_admin_label text;
    v_id uuid;
    v_row public.sponsors;
    v_new_end date;
    v_count integer := 0;
    v_skipped integer := 0;
    v_shop_rating numeric;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_sponsor_ids IS NULL OR array_length(p_sponsor_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'At least one sponsor id is required' USING ERRCODE = 'P0001';
    END IF;

    IF p_days IS NULL OR p_days <= 0 THEN
        RAISE EXCEPTION 'Days must be greater than zero' USING ERRCODE = 'P0001';
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Extension reason is required' USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(p.email, p.id::text) INTO v_admin_label
    FROM public.profiles p WHERE p.id = v_caller;

    FOREACH v_id IN ARRAY p_sponsor_ids LOOP
        SELECT s.* INTO v_row FROM public.sponsors s WHERE s.id = v_id;

        IF v_row IS NULL OR v_row.status IS DISTINCT FROM 'approved' THEN
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;

        IF p_exclude_critical AND v_row.shop_id IS NOT NULL THEN
            SELECT sh.rating INTO v_shop_rating FROM public.shops sh WHERE sh.id = v_row.shop_id;
            IF v_shop_rating IS NOT NULL AND v_shop_rating < 3 THEN
                v_skipped := v_skipped + 1;
                CONTINUE;
            END IF;
        END IF;

        v_new_end := (COALESCE(v_row.end_date::date, CURRENT_DATE) + (p_days || ' days')::interval)::date;

        UPDATE public.sponsors SET end_date = v_new_end, updated_at = now() WHERE id = v_id;

        UPDATE public.subscriptions
        SET end_date = v_new_end, current_period_end = v_new_end, updated_at = now()
        WHERE sponsor_id = v_id AND status = 'active';

        PERFORM public.append_sponsor_partner_log(
            v_id,
            format(
                'Estensione massiva da %s: +%s giorni fino al %s. Motivo: %s',
                COALESCE(v_admin_label, 'sistema'), p_days, to_char(v_new_end, 'YYYY-MM-DD'), btrim(p_reason)
            ),
            'system'
        );

        PERFORM public.record_sponsor_admin_audit(
            'extend_sponsors_bulk',
            format('Estensione massiva sponsor %s (+ %s giorni)', v_id, p_days),
            v_row.request_id,
            v_id,
            jsonb_build_object('days', p_days, 'reason', btrim(p_reason))
        );

        v_count := v_count + 1;
    END LOOP;

    PERFORM public.record_sponsor_admin_audit(
        'extend_sponsors_bulk_summary',
        format('Estensione massiva completata: %s estesi, %s saltati', v_count, v_skipped),
        NULL,
        NULL,
        jsonb_build_object('count', v_count, 'skipped', v_skipped, 'ids', p_sponsor_ids)
    );

    RETURN jsonb_build_object('count', v_count, 'skipped', v_skipped);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. activate_sponsor_from_request — VT-SUX-03 business role + audit
--    (body = Fase 3 + category resolve; additions only before RETURN)
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
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Activation amount must be greater than zero' USING ERRCODE = 'P0001';
    END IF;

    IF p_invoice_number IS NULL OR btrim(p_invoice_number) = '' THEN
        RAISE EXCEPTION 'Invoice number is required' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_req FROM public.sponsor_requests WHERE id = p_request_id;
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    IF v_req.status IS DISTINCT FROM 'waiting_payment' THEN
        RAISE EXCEPTION 'Sponsor request must be in waiting_payment status, got: %', v_req.status USING ERRCODE = 'P0001';
    END IF;

    IF v_req.city_id IS NULL THEN
        RAISE EXCEPTION 'Sponsor request city_id is required for activation' USING ERRCODE = 'P0001';
    END IF;

    IF v_req.type IS NULL THEN
        RAISE EXCEPTION 'Sponsor request type is required for activation' USING ERRCODE = 'P0001';
    END IF;

    IF v_req.pricing_version_id IS NOT NULL
       AND p_pricing_version_id IS DISTINCT FROM v_req.pricing_version_id THEN
        RAISE EXCEPTION 'Pricing version mismatch for request %', p_request_id USING ERRCODE = 'P0001';
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
        company_name, vat_number, email, address, city_id, pricing_version_id,
        status, owner_id, profile_id, type, request_id, amount, invoice_number,
        tier, plan, start_date, end_date, contact_name, phone, poi_category, poi_sub_category
    ) VALUES (
        v_req.company_name, v_req.vat_number, v_req.requester_email, v_req.address, v_req.city_id,
        p_pricing_version_id, 'approved', v_req.owner_id, v_req.profile_id, v_req.type, p_request_id,
        p_amount, btrim(p_invoice_number), v_plan_type, v_plan_type, v_start_date::date, v_end_date::date,
        v_req.requester_name, v_req.requester_phone, v_poi_category, v_req.poi_sub_category
    )
    RETURNING id INTO v_sponsor_id;

    CASE v_req.type
        WHEN 'activity', 'LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY' THEN
            v_res_id := 'poi_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.pois (
                id, city_id, name, category, description, image_url,
                coords_lat, coords_lng, address, status, is_sponsored, tier, phone
            ) VALUES (
                v_res_id, v_req.city_id, v_req.company_name, v_poi_category, v_req.description,
                v_req.image_url, v_req.coords_lat, v_req.coords_lng, v_req.address,
                'published', true, v_plan_type, v_req.requester_phone
            );
            UPDATE public.sponsors SET poi_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'shop', 'DIGITAL_SHOWCASE' THEN
            v_res_id := 'shop_'
                || (floor(extract(epoch from clock_timestamp()) * 1000))::bigint::text
                || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
            INSERT INTO public.shops (id, name, vat_number, city_id, is_active)
            VALUES (v_res_id, v_req.company_name, v_req.vat_number, v_req.city_id, true);
            UPDATE public.sponsors SET shop_id = v_res_id WHERE id = v_sponsor_id;

        WHEN 'guide', 'TOUR_GUIDE' THEN
            INSERT INTO public.city_guides (
                city_id, name, image_url, email, phone, license_number, languages, specialties, is_official
            ) VALUES (
                v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email,
                v_req.requester_phone, v_req.license_number, v_req.languages, v_req.specialties, false
            )
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET guide_id = v_res_id::uuid WHERE id = v_sponsor_id;

        WHEN 'tour_operator', 'TOUR_OPERATOR' THEN
            INSERT INTO public.city_tour_operators (city_id, name, image_url, email, phone)
            VALUES (v_req.city_id, v_req.company_name, v_req.image_url, v_req.requester_email, v_req.requester_phone)
            RETURNING id::text INTO v_res_id;
            UPDATE public.sponsors SET operator_id = v_res_id::uuid WHERE id = v_sponsor_id;

        ELSE
            RAISE EXCEPTION 'Unsupported sponsor request type: %', v_req.type USING ERRCODE = 'P0001';
    END CASE;

    IF v_res_id IS NULL THEN
        RAISE EXCEPTION 'Resource creation failed for sponsor %', v_sponsor_id;
    END IF;

    INSERT INTO public.subscriptions (
        sponsor_id, pricing_version_id, price_paid, currency_paid,
        start_date, end_date, auto_renew, status, current_period_start, current_period_end
    ) VALUES (
        v_sponsor_id, p_pricing_version_id, v_price, v_currency,
        v_start_date, v_end_date, false, 'active', v_start_date, v_end_date
    );

    UPDATE public.sponsors
    SET status = 'approved', start_date = v_start_date::date, end_date = v_end_date::date, amount = p_amount
    WHERE id = v_sponsor_id;

    UPDATE public.sponsor_requests
    SET status = 'converted', status_changed_at = now()
    WHERE id = p_request_id;

    -- VT-SUX-03: ruolo business assegnato dal sistema all'attivazione
    IF v_req.profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'business'
        WHERE id = v_req.profile_id;
    END IF;

    PERFORM public.record_sponsor_admin_audit(
        'activate_sponsor_from_request',
        format('Attivazione sponsor %s da richiesta %s', v_sponsor_id, p_request_id),
        p_request_id,
        v_sponsor_id,
        jsonb_build_object(
            'amount', p_amount,
            'invoice_number', btrim(p_invoice_number),
            'pricing_version_id', p_pricing_version_id,
            'profile_id', v_req.profile_id
        )
    );

    RETURN v_sponsor_id;
END;
$$;

COMMIT;
