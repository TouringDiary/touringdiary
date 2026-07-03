-- Fase 9 Collaborazione: lock per risorsa (tutti i kind), heartbeat, realtime, config

-- ─── Configurazione centralizzata (§18.1 — nessun hardcode applicativo) ───────

INSERT INTO public.global_settings (key, value)
VALUES (
  'collaboration_live_config',
  '{"edit_lock_timeout_minutes":5,"edit_lock_heartbeat_seconds":30}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ─── Helper: timeout lock da impostazioni globali ───────────────────────────

CREATE OR REPLACE FUNCTION public.collaboration_edit_lock_timeout_interval()
RETURNS interval
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT make_interval(
    mins => GREATEST(
      COALESCE(
        (
          SELECT (gs.value::jsonb->>'edit_lock_timeout_minutes')::integer
          FROM public.global_settings gs
          WHERE gs.key = 'collaboration_live_config'
          LIMIT 1
        ),
        5
      ),
      1
    )
  );
$$;

REVOKE ALL ON FUNCTION public.collaboration_edit_lock_timeout_interval() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.collaboration_edit_lock_timeout_interval() TO authenticated;

-- ─── Permessi lock generalizzati (diary, suitcase, user_template) ───────────
-- Punto di estensione per futuri shared_resource_kind: aggiungere un ramo WHEN
-- e la relativa helper RLS (es. can_access_collaborative_<modulo>).

CREATE OR REPLACE FUNCTION public.current_user_can_access_collaborative_resource_entity(
  p_kind public.shared_resource_kind,
  p_resource_id uuid,
  p_require_collaborator boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE p_kind
    WHEN 'diary'::public.shared_resource_kind THEN
      public.can_access_collaborative_diary(p_resource_id, p_require_collaborator)
    WHEN 'suitcase'::public.shared_resource_kind THEN
      EXISTS (
        SELECT 1
        FROM public.suitcases s
        WHERE s.id = p_resource_id
          AND s.user_id = auth.uid()
      )
      OR public.can_access_collaborative_suitcase(p_resource_id, p_require_collaborator)
    -- user_template riutilizza intenzionalmente l'ACL delle suitcase (stesso modello dati e regole).
    -- Se i due domini verranno separati, introdurre una helper dedicata; questa funzione resta il punto di estensione per kind.
    WHEN 'user_template'::public.shared_resource_kind THEN
      EXISTS (
        SELECT 1
        FROM public.suitcases s
        WHERE s.id = p_resource_id
          AND s.user_id = auth.uid()
      )
      OR public.can_access_collaborative_suitcase(p_resource_id, p_require_collaborator)
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.current_user_can_access_collaborative_resource_entity(public.shared_resource_kind, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_can_access_collaborative_resource_entity(public.shared_resource_kind, uuid, boolean) TO authenticated;

COMMENT ON FUNCTION public.current_user_can_access_collaborative_resource_entity(public.shared_resource_kind, uuid, boolean) IS
  'ACL entità per kind (§18): estendere il CASE WHEN per ogni nuovo shared_resource_kind collaborativo.';

CREATE OR REPLACE FUNCTION public.current_user_can_view_shared_resource(
  p_shared_resource_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_resources sr
    WHERE sr.id = p_shared_resource_id
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND (
        sr.owner_id = auth.uid()
        OR public.current_user_is_shared_resource_member(sr.id)
        OR public.current_user_can_access_collaborative_resource_entity(
          sr.kind,
          sr.resource_id,
          false
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_edit_shared_resource(
  p_shared_resource_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_resources sr
    WHERE sr.id = p_shared_resource_id
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND (
        sr.owner_id = auth.uid()
        OR public.current_user_can_access_collaborative_resource_entity(
          sr.kind,
          sr.resource_id,
          true
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_can_view_shared_resource(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_can_edit_shared_resource(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_can_view_shared_resource(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_edit_shared_resource(uuid) TO authenticated;

COMMENT ON FUNCTION public.collaboration_edit_lock_timeout_interval() IS
  'Intervallo timeout lock modifica (§18.1) da global_settings.collaboration_live_config; fallback 5 min.';

COMMENT ON FUNCTION public.current_user_can_view_shared_resource(uuid) IS
  'Visualizzazione lock/stato su risorsa collaborativa: owner, membro ACL o accesso entità per kind.';

COMMENT ON FUNCTION public.current_user_can_edit_shared_resource(uuid) IS
  'Modifica/acquisizione lock (§18): owner o collaboratore autorizzato sulla risorsa per kind.';

-- ─── Lock: acquisizione con scadenza stale (§18.1) ─────────────────────────

CREATE OR REPLACE FUNCTION public.try_acquire_shared_resource_edit_lock(
  p_shared_resource_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_timeout interval := public.collaboration_edit_lock_timeout_interval();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.current_user_can_edit_shared_resource(p_shared_resource_id) THEN
    RETURN false;
  END IF;

  UPDATE public.shared_resources
  SET
    edit_locked_by = v_uid,
    edit_locked_at = now()
  WHERE id = p_shared_resource_id
    AND sharing_mode = 'collaborative'::public.sharing_mode
    AND (
      edit_locked_by IS NULL
      OR edit_locked_by = v_uid
      OR edit_locked_at IS NULL
      OR edit_locked_at < now() - v_timeout
    );

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_shared_resource_edit_lock(
  p_shared_resource_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.current_user_can_edit_shared_resource(p_shared_resource_id) THEN
    RETURN false;
  END IF;

  UPDATE public.shared_resources
  SET edit_locked_at = now()
  WHERE id = p_shared_resource_id
    AND sharing_mode = 'collaborative'::public.sharing_mode
    AND edit_locked_by = v_uid;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_shared_resource_edit_lock(
  p_shared_resource_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.current_user_can_edit_shared_resource(p_shared_resource_id) THEN
    RETURN false;
  END IF;

  UPDATE public.shared_resources
  SET
    edit_locked_by = NULL,
    edit_locked_at = NULL
  WHERE id = p_shared_resource_id
    AND sharing_mode = 'collaborative'::public.sharing_mode
    AND (
      edit_locked_by = v_uid
      OR public.current_user_is_shared_resource_owner(id)
    );

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_resource_edit_lock_holder(
  p_shared_resource_id uuid
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sr.edit_locked_by
  FROM public.shared_resources sr
  WHERE sr.id = p_shared_resource_id
    AND sr.sharing_mode = 'collaborative'::public.sharing_mode
    AND public.current_user_can_view_shared_resource(p_shared_resource_id)
    AND sr.edit_locked_by IS NOT NULL
    AND sr.edit_locked_at IS NOT NULL
    AND sr.edit_locked_at >= now() - public.collaboration_edit_lock_timeout_interval();
$$;

CREATE OR REPLACE FUNCTION public.get_shared_resource_edit_lock_state(
  p_shared_resource_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN sr.edit_locked_by IS NULL
      OR sr.edit_locked_at IS NULL
      OR sr.edit_locked_at < now() - public.collaboration_edit_lock_timeout_interval()
    THEN jsonb_build_object('locked_by', NULL, 'locked_at', NULL)
    ELSE jsonb_build_object(
      'locked_by', sr.edit_locked_by,
      'locked_at', sr.edit_locked_at
    )
  END
  FROM public.shared_resources sr
  WHERE sr.id = p_shared_resource_id
    AND public.current_user_can_view_shared_resource(p_shared_resource_id);
$$;

REVOKE ALL ON FUNCTION public.refresh_shared_resource_edit_lock(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_resource_edit_lock_state(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.refresh_shared_resource_edit_lock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_resource_edit_lock_state(uuid) TO authenticated;

COMMENT ON FUNCTION public.try_acquire_shared_resource_edit_lock(uuid) IS
  'Acquisisce il lock modifica se libero, già detenuto dall''utente o scaduto (§18). Ritorna false se negato.';

COMMENT ON FUNCTION public.refresh_shared_resource_edit_lock(uuid) IS
  'Heartbeat lock (§18.1): aggiorna edit_locked_at per il detentore corrente; estende il timeout inattività.';

COMMENT ON FUNCTION public.release_shared_resource_edit_lock(uuid) IS
  'Rilascia il lock modifica se detenuto dall''utente corrente o se l''utente è owner della risorsa.';

COMMENT ON FUNCTION public.get_shared_resource_edit_lock_holder(uuid) IS
  'UUID del detentore lock attivo (non scaduto), visibile ai soggetti autorizzati in lettura; NULL se libero.';

COMMENT ON FUNCTION public.get_shared_resource_edit_lock_state(uuid) IS
  'Stato lock JSON { locked_by, locked_at } per UI presenza/blocco; valori null se assente o scaduto.';

COMMENT ON COLUMN public.shared_resources.edit_locked_by IS
  'Lock modifica v1 (§18): utente che detiene il lock sulla risorsa. Enforcement UI Fase 9.';

COMMENT ON COLUMN public.shared_resources.edit_locked_at IS
  'Timestamp acquisizione/heartbeat lock modifica (§18.1).';

-- ─── Realtime: lock e sincronizzazione contenuti (§4.1, §17) ────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shared_resources'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_resources;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'itineraries'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraries;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'suitcases'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.suitcases;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'suitcase_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.suitcase_items;
    END IF;
  END IF;
END $$;
