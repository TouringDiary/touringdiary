-- ==========================================
-- WF-02 STEP-2 Fase 2.5 — Contenimento messaggi legacy (DOC 29 Fase 5 / B8 / A10)
-- Date: 2026-07-17
-- Closes: B8, A10 (REVOKE CRUD client su sponsor_messages + RPC gateway legacy)
-- Out of scope: consolidamento partner_logs/sponsor_messages (G-MSG-1 step 5);
--               UX Sponsor-centric (DL-037); motore Messaggistica unificato
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. B8 / A10 — revoca scritture client dirette su sponsor_messages
--    SELECT resta via RLS (badge unread admin, lettura partner)
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON TABLE public.sponsor_messages FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.sponsor_messages FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.sponsor_messages FROM authenticated;

-- ---------------------------------------------------------------------------
-- 2. insert_sponsor_message — gateway legacy (sostituisce INSERT client)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.insert_sponsor_message(
    p_partner_id uuid,
    p_message text,
    p_direction public.sponsor_message_direction,
    p_request_id uuid DEFAULT NULL,
    p_sponsor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_id uuid;
BEGIN
    IF p_message IS NULL OR btrim(p_message) = '' THEN
        RAISE EXCEPTION 'Message body is required'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_partner_id IS NULL THEN
        RAISE EXCEPTION 'partner_id is required'
            USING ERRCODE = 'P0001';
    END IF;

    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN: authentication required'
                USING ERRCODE = '42501';
        END IF;

        IF p_direction = 'partner' THEN
            IF v_caller IS DISTINCT FROM p_partner_id THEN
                RAISE EXCEPTION 'FORBIDDEN: partners may only send as themselves'
                    USING ERRCODE = '42501';
            END IF;
        ELSIF p_direction IN ('admin', 'system') THEN
            IF NOT public.is_td_admin(v_caller) THEN
                RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                    USING ERRCODE = '42501';
            END IF;
        ELSE
            RAISE EXCEPTION 'Unsupported message direction: %', p_direction
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    INSERT INTO public.sponsor_messages (
        partner_id,
        sender_id,
        request_id,
        sponsor_id,
        direction,
        message,
        is_read
    )
    VALUES (
        p_partner_id,
        v_caller,
        p_request_id,
        p_sponsor_id,
        p_direction,
        btrim(p_message),
        false
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_sponsor_message(uuid, text, public.sponsor_message_direction, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_sponsor_message(uuid, text, public.sponsor_message_direction, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.insert_sponsor_message(uuid, text, public.sponsor_message_direction, uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. mark_sponsor_messages_read — gateway legacy (sostituisce UPDATE client)
--    p_reader: 'admin' | 'partner' — chi sta leggendo (segna l'altro lato come letto)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_sponsor_messages_read(
    p_partner_id uuid DEFAULT NULL,
    p_request_id uuid DEFAULT NULL,
    p_reader text DEFAULT 'partner'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_target_direction public.sponsor_message_direction;
    v_updated integer;
BEGIN
    IF p_partner_id IS NULL AND p_request_id IS NULL THEN
        RAISE EXCEPTION 'partner_id or request_id is required'
            USING ERRCODE = 'P0001';
    END IF;

    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN: authentication required'
                USING ERRCODE = '42501';
        END IF;

        IF p_reader = 'admin' THEN
            IF NOT public.is_td_admin(v_caller) THEN
                RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                    USING ERRCODE = '42501';
            END IF;
            v_target_direction := 'partner';
        ELSIF p_reader = 'partner' THEN
            IF p_partner_id IS NOT NULL AND v_caller IS DISTINCT FROM p_partner_id THEN
                RAISE EXCEPTION 'FORBIDDEN: partners may only mark their own threads'
                    USING ERRCODE = '42501';
            END IF;
            v_target_direction := 'admin';
        ELSE
            RAISE EXCEPTION 'Unsupported reader role: %', p_reader
                USING ERRCODE = 'P0001';
        END IF;
    ELSE
        v_target_direction := CASE
            WHEN p_reader = 'admin' THEN 'partner'::public.sponsor_message_direction
            ELSE 'admin'::public.sponsor_message_direction
        END;
    END IF;

    UPDATE public.sponsor_messages
    SET is_read = true
    WHERE is_read = false
      AND direction = v_target_direction
      AND (
          (p_partner_id IS NOT NULL AND partner_id = p_partner_id)
          OR (p_request_id IS NOT NULL AND request_id = p_request_id)
      );

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_sponsor_messages_read(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_sponsor_messages_read(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_sponsor_messages_read(uuid, uuid, text) TO authenticated, service_role;

COMMIT;
