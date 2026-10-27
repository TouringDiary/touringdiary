-- Rifiuto sponsor: la funzione del 17 luglio 2026 scrive updated_at,
-- colonna che la migration del 16 luglio ha deciso di non aggiungere.
-- Questa candidata non aggiunge updated_at. Usa status_changed_at.
-- Non applicata al database remoto. Non rifiuta richieste reali.

BEGIN;

ALTER TABLE public.sponsor_requests
    ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

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

    p_reason := btrim(p_reason);

    -- Una sola transizione pending → rejected. Il predicato è nella stessa
    -- UPDATE: la seconda chiamata concorrente non aggiorna alcuna riga.
    UPDATE public.sponsor_requests
    SET status = 'rejected',
        rejection_reason = p_reason,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        status_changed_at = now()
    WHERE id = p_request_id
      AND status = 'pending'
    RETURNING * INTO v_row;

    IF FOUND THEN
        PERFORM public.record_sponsor_admin_audit(
            'reject_sponsor_request',
            format('Rifiuto richiesta %s', p_request_id),
            p_request_id,
            NULL,
            jsonb_build_object('reason', p_reason)
        );
        RETURN v_row;
    END IF;

    SELECT * INTO v_row
    FROM public.sponsor_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sponsor request not found: %', p_request_id;
    END IF;

    RAISE EXCEPTION 'Sponsor request must be in pending status, got: %', v_row.status
        USING ERRCODE = 'P0001';
END;
$$;

COMMIT;
