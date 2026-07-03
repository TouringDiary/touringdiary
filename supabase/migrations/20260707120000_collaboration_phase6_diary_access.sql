-- Fase 6 Collaborazione: accesso RLS Diario condiviso, autore modifica, lock minimo (dato)

-- ─── Tracciamento autore a livello contenitore (§21) ─────────────────────────

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.itineraries.last_modified_by IS
  'Ultimo utente che ha modificato il Diario (§21). Il creatore resta su user_id.';

-- ─── Lock minimo su risorsa condivisa (predisposizione Fase 9, solo dato) ──

ALTER TABLE public.shared_resources
  ADD COLUMN IF NOT EXISTS edit_locked_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edit_locked_at timestamptz;

COMMENT ON COLUMN public.shared_resources.edit_locked_by IS
  'Lock modifica v1 (§13): utente che detiene il lock sul Diario intero. Enforcement UI in Fase 9.';

COMMENT ON COLUMN public.shared_resources.edit_locked_at IS
  'Timestamp acquisizione lock modifica (§13). Timeout in Fase 9.';

-- ─── Helper RLS collaborativo Diario ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_access_collaborative_diary(
  p_itinerary_id uuid,
  p_require_collaborator boolean DEFAULT false
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
    INNER JOIN public.shared_resource_members m
      ON m.shared_resource_id = sr.id
    WHERE sr.resource_id = p_itinerary_id
      AND sr.kind = 'diary'::public.shared_resource_kind
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND m.user_id = auth.uid()
      AND (
        NOT p_require_collaborator
        OR m.role = 'collaborator'::public.collaborative_member_role
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_collaborative_diary(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_collaborative_diary(uuid, boolean) TO authenticated;

COMMENT ON FUNCTION public.can_access_collaborative_diary(uuid, boolean) IS
  'Accesso collaborativo al Diario (§13): membri ACL in modalità Collaborativa.';

-- ─── Permessi espliciti sul lock (indipendenti dalle policy RLS) ─────────────

CREATE OR REPLACE FUNCTION public.current_user_can_view_shared_diary_resource(
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
      AND sr.kind = 'diary'::public.shared_resource_kind
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND (
        sr.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.shared_resource_members m
          WHERE m.shared_resource_id = sr.id
            AND m.user_id = auth.uid()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_edit_shared_diary_resource(
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
      AND sr.kind = 'diary'::public.shared_resource_kind
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND (
        sr.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.shared_resource_members m
          WHERE m.shared_resource_id = sr.id
            AND m.user_id = auth.uid()
            AND m.role = 'collaborator'::public.collaborative_member_role
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_can_view_shared_diary_resource(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_can_edit_shared_diary_resource(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_can_view_shared_diary_resource(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_edit_shared_diary_resource(uuid) TO authenticated;

-- ─── Lock minimo: primitive RPC (solo dato, nessun enforcement UI) ───────────

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
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.current_user_can_edit_shared_diary_resource(p_shared_resource_id) THEN
    RETURN false;
  END IF;

  UPDATE public.shared_resources
  SET
    edit_locked_by = v_uid,
    edit_locked_at = now()
  WHERE id = p_shared_resource_id
    AND kind = 'diary'::public.shared_resource_kind
    AND sharing_mode = 'collaborative'::public.sharing_mode
    AND (
      edit_locked_by IS NULL
      OR edit_locked_by = v_uid
    );

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

  IF NOT public.current_user_can_edit_shared_diary_resource(p_shared_resource_id) THEN
    RETURN false;
  END IF;

  UPDATE public.shared_resources
  SET
    edit_locked_by = NULL,
    edit_locked_at = NULL
  WHERE id = p_shared_resource_id
    AND kind = 'diary'::public.shared_resource_kind
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
    AND sr.kind = 'diary'::public.shared_resource_kind
    AND public.current_user_can_view_shared_diary_resource(p_shared_resource_id);
$$;

REVOKE ALL ON FUNCTION public.try_acquire_shared_resource_edit_lock(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_shared_resource_edit_lock(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_resource_edit_lock_holder(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.try_acquire_shared_resource_edit_lock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_shared_resource_edit_lock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_resource_edit_lock_holder(uuid) TO authenticated;

-- ─── itineraries: policy additive (non rimuove policy proprietario esistenti) ─
-- RLS già attivo sulla tabella in produzione: non alterare lo stato ENABLE.

DROP POLICY IF EXISTS "Collaborators view shared diaries" ON public.itineraries;
DROP POLICY IF EXISTS "Collaborators update shared diaries" ON public.itineraries;

CREATE POLICY "Collaborators view shared diaries"
  ON public.itineraries
  FOR SELECT
  TO authenticated
  USING (public.can_access_collaborative_diary(id, false));

CREATE POLICY "Collaborators update shared diaries"
  ON public.itineraries
  FOR UPDATE
  TO authenticated
  USING (public.can_access_collaborative_diary(id, true))
  WITH CHECK (public.can_access_collaborative_diary(id, true));
