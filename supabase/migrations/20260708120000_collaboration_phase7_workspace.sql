-- Fase 7 Collaborazione: Workspace — modello, composizione, permessi per risorsa, inviti

DO $$ BEGIN
  CREATE TYPE public.workspace_resource_access AS ENUM ('none', 'viewer', 'collaborator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabelle ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON public.workspaces (owner_id);

COMMENT ON TABLE public.workspaces IS
  'Workspace collaborativo (§12). Proprietario workspace ≠ proprietario risorse.';

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_members_unique_user UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx
  ON public.workspace_members (workspace_id);

CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx
  ON public.workspace_members (user_id);

COMMENT ON TABLE public.workspace_members IS
  'Membri workspace accettati. Il proprietario è su workspaces.owner_id.';

CREATE TABLE IF NOT EXISTS public.workspace_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  kind public.shared_resource_kind NOT NULL,
  resource_id uuid NOT NULL,
  added_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_resources_unique_link UNIQUE (workspace_id, kind, resource_id),
  CONSTRAINT workspace_resources_workspace_id_id_key UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS workspace_resources_workspace_id_idx
  ON public.workspace_resources (workspace_id);

CREATE INDEX IF NOT EXISTS workspace_resources_lookup_idx
  ON public.workspace_resources (kind, resource_id);

COMMENT ON TABLE public.workspace_resources IS
  'Collegamenti risorse nel workspace (§12.0). La rimozione non elimina la risorsa originale.';

CREATE TABLE IF NOT EXISTS public.workspace_resource_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  workspace_resource_id uuid NOT NULL
    REFERENCES public.workspace_resources (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  access_level public.workspace_resource_access NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_resource_permissions_unique UNIQUE (workspace_resource_id, user_id),
  CONSTRAINT workspace_resource_permissions_resource_in_workspace_fkey
    FOREIGN KEY (workspace_id, workspace_resource_id)
    REFERENCES public.workspace_resources (workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workspace_resource_permissions_workspace_id_idx
  ON public.workspace_resource_permissions (workspace_id);

CREATE INDEX IF NOT EXISTS workspace_resource_permissions_user_id_idx
  ON public.workspace_resource_permissions (user_id);

COMMENT ON TABLE public.workspace_resource_permissions IS
  'Matrice permessi workspace per utente e risorsa (§12.5): none / viewer / collaborator.';

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.resource_invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT workspace_invites_no_self CHECK (inviter_id <> invitee_id),
  CONSTRAINT workspace_invites_unique_invitee UNIQUE (workspace_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx
  ON public.workspace_invites (workspace_id);

CREATE INDEX IF NOT EXISTS workspace_invites_invitee_id_idx
  ON public.workspace_invites (invitee_id);

COMMENT ON TABLE public.workspace_invites IS
  'Inviti al workspace (§6, S1). Permessi per risorsa in workspace_invite_permissions.';

CREATE TABLE IF NOT EXISTS public.workspace_invite_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.workspace_invites (id) ON DELETE CASCADE,
  kind public.shared_resource_kind NOT NULL,
  resource_id uuid NOT NULL,
  access_level public.workspace_resource_access NOT NULL,
  CONSTRAINT workspace_invite_permissions_unique UNIQUE (invite_id, kind, resource_id)
);

CREATE INDEX IF NOT EXISTS workspace_invite_permissions_invite_id_idx
  ON public.workspace_invite_permissions (invite_id);

COMMENT ON TABLE public.workspace_invite_permissions IS
  'Permessi per risorsa definiti durante invito workspace (§12.5).';

-- ─── updated_at ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

DROP TRIGGER IF EXISTS trg_workspace_resource_permissions_updated_at
  ON public.workspace_resource_permissions;
CREATE TRIGGER trg_workspace_resource_permissions_updated_at
  BEFORE UPDATE ON public.workspace_resource_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

DROP TRIGGER IF EXISTS trg_workspace_invites_updated_at ON public.workspace_invites;
CREATE TRIGGER trg_workspace_invites_updated_at
  BEFORE UPDATE ON public.workspace_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

-- ─── Helper RLS ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_can_access_workspace(
  p_workspace_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id IS NOT NULL
    AND (
      public.is_td_admin(p_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.workspaces w
        WHERE w.id = p_workspace_id
          AND w.owner_id = p_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.workspace_members m
        WHERE m.workspace_id = p_workspace_id
          AND m.user_id = p_user_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_workspace(
  p_workspace_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id IS NOT NULL
    AND (
      public.is_td_admin(p_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.workspaces w
        WHERE w.id = p_workspace_id
          AND w.owner_id = p_user_id
      )
    );
$$;

-- ─── RLS workspaces ────────────────────────────────────────────────────────

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
CREATE POLICY "workspaces_select"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_workspace(id, auth.uid()));

DROP POLICY IF EXISTS "workspaces_owner_insert" ON public.workspaces;
CREATE POLICY "workspaces_owner_insert"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_owner_update" ON public.workspaces;
CREATE POLICY "workspaces_owner_update"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_owner_delete" ON public.workspaces;
CREATE POLICY "workspaces_owner_delete"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ─── RLS workspace_members ─────────────────────────────────────────────────

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
CREATE POLICY "workspace_members_select"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_workspace(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "workspace_members_owner_write" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_owner_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_owner_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_owner_delete" ON public.workspace_members;

CREATE POLICY "workspace_members_owner_insert"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_owns_workspace(workspace_id, auth.uid())
    AND user_id <> (
      SELECT w.owner_id
      FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
    )
  );

CREATE POLICY "workspace_members_owner_update"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_workspace(workspace_id, auth.uid()))
  WITH CHECK (
    public.user_owns_workspace(workspace_id, auth.uid())
    AND user_id <> (
      SELECT w.owner_id
      FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
    )
  );

CREATE POLICY "workspace_members_owner_delete"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (public.user_owns_workspace(workspace_id, auth.uid()));

-- ─── RLS workspace_resources ───────────────────────────────────────────────

ALTER TABLE public.workspace_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_resources_select" ON public.workspace_resources;
CREATE POLICY "workspace_resources_select"
  ON public.workspace_resources
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_workspace(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "workspace_resources_owner_insert" ON public.workspace_resources;
CREATE POLICY "workspace_resources_owner_insert"
  ON public.workspace_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND (
      public.user_owns_workspace(workspace_id, auth.uid())
      OR (
        kind = 'suitcase'::public.shared_resource_kind
        AND public.user_can_access_workspace(workspace_id, auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "workspace_resources_owner_delete" ON public.workspace_resources;
CREATE POLICY "workspace_resources_owner_delete"
  ON public.workspace_resources
  FOR DELETE
  TO authenticated
  USING (public.user_owns_workspace(workspace_id, auth.uid()));

-- ─── RLS workspace_resource_permissions ────────────────────────────────────

ALTER TABLE public.workspace_resource_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_resource_permissions_select" ON public.workspace_resource_permissions;
CREATE POLICY "workspace_resource_permissions_select"
  ON public.workspace_resource_permissions
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_workspace(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "workspace_resource_permissions_owner_write" ON public.workspace_resource_permissions;
DROP POLICY IF EXISTS "workspace_resource_permissions_owner_insert" ON public.workspace_resource_permissions;
DROP POLICY IF EXISTS "workspace_resource_permissions_owner_update" ON public.workspace_resource_permissions;
DROP POLICY IF EXISTS "workspace_resource_permissions_owner_delete" ON public.workspace_resource_permissions;

CREATE POLICY "workspace_resource_permissions_owner_insert"
  ON public.workspace_resource_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_workspace(workspace_id, auth.uid()));

CREATE POLICY "workspace_resource_permissions_owner_update"
  ON public.workspace_resource_permissions
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_workspace(workspace_id, auth.uid()))
  WITH CHECK (public.user_owns_workspace(workspace_id, auth.uid()));

CREATE POLICY "workspace_resource_permissions_owner_delete"
  ON public.workspace_resource_permissions
  FOR DELETE
  TO authenticated
  USING (public.user_owns_workspace(workspace_id, auth.uid()));

-- ─── RLS workspace_invites ─────────────────────────────────────────────────

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_invites_select" ON public.workspace_invites;
CREATE POLICY "workspace_invites_select"
  ON public.workspace_invites
  FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR public.user_owns_workspace(workspace_id, auth.uid())
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "workspace_invites_owner_insert" ON public.workspace_invites;
CREATE POLICY "workspace_invites_owner_insert"
  ON public.workspace_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND public.user_owns_workspace(workspace_id, auth.uid())
    AND invitee_id <> auth.uid()
  );

DROP POLICY IF EXISTS "workspace_invites_invitee_respond" ON public.workspace_invites;
CREATE POLICY "workspace_invites_invitee_respond"
  ON public.workspace_invites
  FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid() AND status = 'pending')
  WITH CHECK (
    invitee_id = auth.uid()
    AND status IN (
      'accepted'::public.resource_invite_status,
      'rejected'::public.resource_invite_status
    )
  );

DROP POLICY IF EXISTS "workspace_invites_owner_manage" ON public.workspace_invites;
CREATE POLICY "workspace_invites_owner_manage"
  ON public.workspace_invites
  FOR UPDATE
  TO authenticated
  USING (
    public.user_owns_workspace(workspace_id, auth.uid())
    AND status IN (
      'pending'::public.resource_invite_status,
      'rejected'::public.resource_invite_status,
      'revoked'::public.resource_invite_status
    )
  )
  WITH CHECK (
    public.user_owns_workspace(workspace_id, auth.uid())
    AND status IN (
      'pending'::public.resource_invite_status,
      'revoked'::public.resource_invite_status
    )
  );

-- ─── RLS workspace_invite_permissions ──────────────────────────────────────

ALTER TABLE public.workspace_invite_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_invite_permissions_select" ON public.workspace_invite_permissions;
CREATE POLICY "workspace_invite_permissions_select"
  ON public.workspace_invite_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspace_invites wi
      WHERE wi.id = workspace_invite_permissions.invite_id
        AND (
          wi.inviter_id = auth.uid()
          OR wi.invitee_id = auth.uid()
          OR public.user_owns_workspace(wi.workspace_id, auth.uid())
        )
    )
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "workspace_invite_permissions_owner_insert" ON public.workspace_invite_permissions;
CREATE POLICY "workspace_invite_permissions_owner_insert"
  ON public.workspace_invite_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workspace_invites wi
      WHERE wi.id = invite_id
        AND wi.inviter_id = auth.uid()
        AND public.user_owns_workspace(wi.workspace_id, auth.uid())
        AND wi.status = 'pending'::public.resource_invite_status
    )
  );

DROP POLICY IF EXISTS "workspace_invite_permissions_owner_update" ON public.workspace_invite_permissions;
CREATE POLICY "workspace_invite_permissions_owner_update"
  ON public.workspace_invite_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspace_invites wi
      WHERE wi.id = workspace_invite_permissions.invite_id
        AND public.user_owns_workspace(wi.workspace_id, auth.uid())
        AND wi.status = 'pending'::public.resource_invite_status
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workspace_invites wi
      WHERE wi.id = invite_id
        AND public.user_owns_workspace(wi.workspace_id, auth.uid())
        AND wi.status = 'pending'::public.resource_invite_status
    )
  );

DROP POLICY IF EXISTS "workspace_invite_permissions_owner_delete" ON public.workspace_invite_permissions;
CREATE POLICY "workspace_invite_permissions_owner_delete"
  ON public.workspace_invite_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspace_invites wi
      WHERE wi.id = workspace_invite_permissions.invite_id
        AND public.user_owns_workspace(wi.workspace_id, auth.uid())
        AND wi.status = 'pending'::public.resource_invite_status
    )
  );
