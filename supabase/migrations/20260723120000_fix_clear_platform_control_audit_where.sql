-- =============================================================================
-- Fix clear_platform_control_audit — DELETE senza WHERE bloccato da safeupdate
-- =============================================================================
-- Causa reale (verificata via RPC autenticata):
--   PostgREST → HTTP 400, code 21000, message "DELETE requires a WHERE clause"
--   session_preload_libraries include supautils (guard Supabase su DELETE/UPDATE
--   senza predicato WHERE).
-- delete_platform_control_audit_event non è affetto (ha già WHERE id = p_id).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.clear_platform_control_audit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_count integer := 0;
BEGIN
    IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
        RAISE EXCEPTION 'FORBIDDEN: admin privileges required' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_caller AND p.role = 'admin_all'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN: admin_all write required for Centro di Controllo' USING ERRCODE = '42501';
    END IF;

    -- WHERE obbligatorio: supautils rifiuta DELETE senza predicato (SQLSTATE 21000).
    DELETE FROM public.platform_control_audit
    WHERE id IS NOT NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_platform_control_audit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_platform_control_audit() FROM anon;
GRANT EXECUTE ON FUNCTION public.clear_platform_control_audit()
    TO authenticated, service_role;

COMMENT ON FUNCTION public.clear_platform_control_audit() IS
    'Svuota platform_control_audit. Solo admin_all. Ritorna il numero di righe eliminate.';
