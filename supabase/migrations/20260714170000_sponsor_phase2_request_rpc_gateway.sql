-- ==========================================
-- WF-02 STEP-2 Fase 2.2 — RPC gateway sponsor_requests (DOC 29 Fase 2 / B1 / O3)
-- Date: 2026-07-14
-- Closes: B1 (admin mutations on sponsor_requests via RPC)
-- Out of scope: activate_sponsor_from_request (Fase 2.3), sponsors admin_notes (Fase 4)
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. approve_sponsor_request — pending → waiting_payment
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
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_sponsor_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_sponsor_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_sponsor_request(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. reject_sponsor_request — pending → rejected
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
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_sponsor_request(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_sponsor_request(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_sponsor_request(uuid, text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. update_sponsor_request_admin_notes
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
        admin_notes_last_updated = now(),
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_sponsor_request_admin_notes(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. delete_sponsor_request — admin_all only (O4 / DL-027)
-- ---------------------------------------------------------------------------
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
            RAISE EXCEPTION 'FORBIDDEN: authentication required'
                USING ERRCODE = '42501';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = v_caller
              AND role = 'admin_all'
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin_all privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.sponsor_requests WHERE id = p_request_id) THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    DELETE FROM public.sponsor_requests WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_sponsor_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_sponsor_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_sponsor_request(uuid) TO authenticated, service_role;

COMMIT;
