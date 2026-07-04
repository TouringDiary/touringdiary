-- Fase 10 Collaborazione: Amici, motore eventi, allegati workspace, preferenze notifiche, config engine

-- ─── Amici (§9.2) — distinto da user_blocks ─────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT user_friend_requests_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT user_friend_requests_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS user_friend_requests_requester_idx
  ON public.user_friend_requests (requester_id);

CREATE INDEX IF NOT EXISTS user_friend_requests_addressee_idx
  ON public.user_friend_requests (addressee_id);

COMMENT ON TABLE public.user_friend_requests IS
  'Richieste di amicizia (§9.2). Distinte da user_blocks.';

CREATE TABLE IF NOT EXISTS public.user_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_friends_no_self CHECK (user_id <> friend_id),
  CONSTRAINT user_friends_unique_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS user_friends_user_id_idx ON public.user_friends (user_id);
CREATE INDEX IF NOT EXISTS user_friends_friend_id_idx ON public.user_friends (friend_id);

COMMENT ON TABLE public.user_friends IS
  'Relazioni di amicizia accettate (§9.2). Righe bidirezionali inserite all''accettazione.';

-- ─── Motore eventi dominio (§20) — estendibile oltre il registro attività ───

CREATE TABLE IF NOT EXISTS public.collaboration_domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL DEFAULT 'collaboration',
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  kind public.shared_resource_kind,
  resource_id uuid,
  workspace_id uuid REFERENCES public.workspaces (id) ON DELETE SET NULL,
  shared_resource_id uuid REFERENCES public.shared_resources (id) ON DELETE SET NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collaboration_domain_events_summary_not_blank
    CHECK (char_length(trim(summary)) > 0)
);

CREATE INDEX IF NOT EXISTS collaboration_domain_events_workspace_idx
  ON public.collaboration_domain_events (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS collaboration_domain_events_resource_idx
  ON public.collaboration_domain_events (kind, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS collaboration_domain_events_actor_idx
  ON public.collaboration_domain_events (actor_id, created_at DESC);

COMMENT ON TABLE public.collaboration_domain_events IS
  'Motore eventi collaborativo (§20). Riutilizzabile per feed, timeline, audit.';

-- ─── Allegati workspace (§12.6) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_attachments_name_not_blank CHECK (char_length(trim(file_name)) > 0),
  CONSTRAINT workspace_attachments_path_not_blank CHECK (char_length(trim(storage_path)) > 0)
);

CREATE INDEX IF NOT EXISTS workspace_attachments_workspace_idx
  ON public.workspace_attachments (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS workspace_attachments_owner_quota_idx
  ON public.workspace_attachments (workspace_id);

COMMENT ON TABLE public.workspace_attachments IS
  'Allegati condivisi nel workspace (§12.6). Quota sul proprietario workspace.';

-- ─── Preferenze notifiche collaborative (§19) ───────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS collaboration_notification_preferences jsonb NOT NULL DEFAULT '{
    "invites": true,
    "resource_updates": true,
    "workspace_updates": true,
    "friend_requests": true
  }'::jsonb;

COMMENT ON COLUMN public.profiles.collaboration_notification_preferences IS
  'Preferenze per categoria notifiche collaborative (§19).';

-- ─── Configurazione motore workspace/collaborazione (Admin) ─────────────────

INSERT INTO public.global_settings (key, value)
VALUES (
  'workspace_engine_config',
  '{
    "collaboration_enabled": true,
    "live_presence_enabled": true,
    "enabled_shared_resource_kinds": ["diary", "suitcase", "user_template"],
    "notification_categories": {
      "invites": true,
      "resource_updates": true,
      "workspace_updates": true,
      "friend_requests": true
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.global_settings (key, value)
VALUES (
  'storage_limits',
  '{
    "maxAttachmentBytes": 10485760,
    "maxAccountBytes": 104857600,
    "maxWorkspaceBytes": 52428800
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ─── RLS Amici ──────────────────────────────────────────────────────────────

ALTER TABLE public.user_friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_friend_requests_select"
  ON public.user_friend_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );

CREATE POLICY "user_friend_requests_insert"
  ON public.user_friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "user_friend_requests_update_addressee"
  ON public.user_friend_requests
  FOR UPDATE
  TO authenticated
  USING (addressee_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid());

ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_friends_select"
  ON public.user_friends
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR friend_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );

CREATE POLICY "user_friends_delete_own"
  ON public.user_friends
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ─── RLS eventi dominio ───────────────────────────────────────────────────

ALTER TABLE public.collaboration_domain_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_can_view_collaboration_event(
  p_event_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_domain_events e
    WHERE e.id = p_event_id
      AND (
        public.is_td_admin(p_user_id)
        OR e.actor_id = p_user_id
        OR (
          e.workspace_id IS NOT NULL
          AND public.user_can_access_workspace(e.workspace_id, p_user_id)
        )
        OR (
          e.kind IS NOT NULL
          AND e.resource_id IS NOT NULL
          AND (
            EXISTS (
              SELECT 1
              FROM public.shared_resources sr
              WHERE sr.kind = e.kind
                AND sr.resource_id = e.resource_id
                AND sr.owner_id = p_user_id
            )
            OR EXISTS (
              SELECT 1
              FROM public.shared_resources sr
              INNER JOIN public.shared_resource_members m ON m.shared_resource_id = sr.id
              WHERE sr.kind = e.kind
                AND sr.resource_id = e.resource_id
                AND m.user_id = p_user_id
            )
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_view_collaboration_event(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_view_collaboration_event(uuid, uuid) TO authenticated;

CREATE POLICY "collaboration_domain_events_select"
  ON public.collaboration_domain_events
  FOR SELECT
  TO authenticated
  USING (public.user_can_view_collaboration_event(id, auth.uid()));

CREATE POLICY "collaboration_domain_events_insert"
  ON public.collaboration_domain_events
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ─── RLS allegati workspace ─────────────────────────────────────────────────

ALTER TABLE public.workspace_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_attachments_select"
  ON public.workspace_attachments
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_workspace(workspace_id, auth.uid()));

CREATE POLICY "workspace_attachments_insert"
  ON public.workspace_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.user_can_access_workspace(workspace_id, auth.uid())
  );

CREATE POLICY "workspace_attachments_delete"
  ON public.workspace_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
    OR public.is_td_admin(auth.uid())
  );

-- ─── Storage bucket allegati workspace (privato, allineato ad ACL workspace) ─

INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-attachments', 'workspace-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Path atteso: {ownerId}/{workspaceId}/{uuid}-{filename}
-- Protegge il cast ::uuid da path malformati (segmento mancante o non UUID).

CREATE POLICY "workspace_attachments_storage_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'workspace-attachments'
    AND array_length(string_to_array(name, '/'), 1) >= 2
    AND (string_to_array(name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.user_can_access_workspace(
      (string_to_array(name, '/'))[2]::uuid,
      auth.uid()
    )
  );

CREATE POLICY "workspace_attachments_storage_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workspace-attachments'
    AND array_length(string_to_array(name, '/'), 1) >= 2
    AND (string_to_array(name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.user_can_access_workspace(
      (string_to_array(name, '/'))[2]::uuid,
      auth.uid()
    )
  );

-- DELETE allineato a workspace_attachments_delete:
-- uploader (owner/owner_id impostati da Supabase al JWT dell'upload autenticato),
-- proprietario workspace o admin via user_owns_workspace().
-- user_can_access_workspace() include anche i collaboratori: non usato qui.

CREATE POLICY "workspace_attachments_storage_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'workspace-attachments'
    AND array_length(string_to_array(name, '/'), 1) >= 2
    AND (string_to_array(name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (
      owner = auth.uid()
      OR owner_id = auth.uid()::text
      OR public.user_owns_workspace(
        (string_to_array(name, '/'))[2]::uuid,
        auth.uid()
      )
    )
  );
