-- =============================================================================
-- Platform Control — gestibilità Storico Audit (admin_all)
-- =============================================================================
-- Contesto verificato su DB remoto (2026-07-22):
--   • platform_control_audit: RLS ON
--   • policy esistente: platform_control_audit_admin_read (SELECT only)
--   • RPC esistenti: record_platform_control_audit, mutate_platform_feature_flag
--   • Nessuna policy DELETE client; nessuna RPC di cancellazione
--
-- Decisione architetturale (allineata a mutate_platform_feature_flag):
--   mutazioni SOLO via SECURITY DEFINER RPC; nessun DELETE diretto dal client;
--   nessuna policy DELETE FOR authenticated (tabella resta write-closed lato client).
-- =============================================================================

COMMENT ON TABLE public.platform_control_audit IS
    'Audit mutazioni Centro di Controllo (DL-P05). Scrittura via record_platform_control_audit; cancellazione gestita via delete_platform_control_audit_event / clear_platform_control_audit (admin_all).';

-- ---------------------------------------------------------------------------
-- delete_platform_control_audit_event — elimina una singola voce
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_platform_control_audit_event(
    p_id uuid
)
RETURNS boolean
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

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'p_id is required' USING ERRCODE = 'P0001';
    END IF;

    DELETE FROM public.platform_control_audit
    WHERE id = p_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_platform_control_audit_event(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_platform_control_audit_event(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_platform_control_audit_event(uuid)
    TO authenticated, service_role;

COMMENT ON FUNCTION public.delete_platform_control_audit_event(uuid) IS
    'Elimina una voce di platform_control_audit. Solo admin_all. Nessun DELETE client diretto.';

-- ---------------------------------------------------------------------------
-- clear_platform_control_audit — svuota l’intero storico
-- ---------------------------------------------------------------------------
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

    DELETE FROM public.platform_control_audit;
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
