-- Fase Collaborazione: primitive ACL per eliminare ricorsione RLS
-- tra shared_resources e shared_resource_members (policy Fase 2).
--
-- Le policy non possono interrogare in modo sicuro tabelle la cui policy
-- ritorna sulla tabella originale. Le primitive SECURITY DEFINER leggono
-- i dati ACL senza riattivare RLS (owner tabella, no FORCE RLS).

-- ─── Primitive ACL (atomiche, auth.uid() interno) ───────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_is_shared_resource_owner(
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
      AND sr.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_shared_resource_member(
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
    FROM public.shared_resource_members m
    WHERE m.shared_resource_id = p_shared_resource_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_current_owner_manage_shared_member(
  p_shared_resource_id uuid,
  p_member_user_id uuid
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
      AND sr.owner_id = auth.uid()
      AND sr.owner_id <> p_member_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_shared_resource_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_shared_resource_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_current_owner_manage_shared_member(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_is_shared_resource_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_shared_resource_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_current_owner_manage_shared_member(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.current_user_is_shared_resource_owner(uuid) IS
  'Primitiva ACL: auth.uid() è owner della risorsa condivisibile.';

COMMENT ON FUNCTION public.current_user_is_shared_resource_member(uuid) IS
  'Primitiva ACL: auth.uid() è membro della risorsa condivisibile.';

COMMENT ON FUNCTION public.can_current_owner_manage_shared_member(uuid, uuid) IS
  'Primitiva ACL: auth.uid() è owner e può gestire p_member_user_id (non il proprietario).';

-- ─── Policy riscritte (stessa semantica, niente subquery cross-table) ───────

DROP POLICY IF EXISTS "shared_resources_select" ON public.shared_resources;

CREATE POLICY "shared_resources_select"
  ON public.shared_resources
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.current_user_is_shared_resource_member(id)
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "shared_resource_members_select" ON public.shared_resource_members;

CREATE POLICY "shared_resource_members_select"
  ON public.shared_resource_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_is_shared_resource_owner(shared_resource_id)
    OR public.current_user_is_shared_resource_member(shared_resource_id)
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "shared_resource_members_owner_write" ON public.shared_resource_members;

CREATE POLICY "shared_resource_members_owner_write"
  ON public.shared_resource_members
  FOR ALL
  TO authenticated
  USING (
    public.current_user_is_shared_resource_owner(shared_resource_id)
  )
  WITH CHECK (
    public.can_current_owner_manage_shared_member(shared_resource_id, user_id)
    AND role IN (
      'collaborator'::public.collaborative_member_role,
      'viewer'::public.collaborative_member_role
    )
  );
