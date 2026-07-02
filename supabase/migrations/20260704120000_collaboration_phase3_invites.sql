-- Fase 3 Collaborazione: inviti a risorsa, blocchi utenti (motore inviti)

DO $$ BEGIN
  CREATE TYPE public.resource_invite_status AS ENUM ('pending', 'accepted', 'rejected', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Blocchi utenti (§9.2) — dati usati dal motore inviti; UI Amici in Fase 10
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_no_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx ON public.user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON public.user_blocks (blocked_id);

COMMENT ON TABLE public.user_blocks IS
  'Blocco tra utenti (§9.2). Gli utenti bloccati non possono inviare né ricevere inviti.';

CREATE TABLE IF NOT EXISTS public.resource_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_resource_id uuid NOT NULL
    REFERENCES public.shared_resources (id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.collaborative_member_role NOT NULL,
  status public.resource_invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT resource_invites_no_self CHECK (inviter_id <> invitee_id),
  CONSTRAINT resource_invites_unique_invitee UNIQUE (shared_resource_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS resource_invites_shared_resource_id_idx
  ON public.resource_invites (shared_resource_id);

CREATE INDEX IF NOT EXISTS resource_invites_invitee_id_idx
  ON public.resource_invites (invitee_id);

CREATE INDEX IF NOT EXISTS resource_invites_inviter_id_idx
  ON public.resource_invites (inviter_id);

COMMENT ON TABLE public.resource_invites IS
  'Inviti a risorsa — condivisione semplice (§6, S1). Accesso solo dopo accettazione.';

-- ─── updated_at ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_resource_invites_updated_at ON public.resource_invites;
CREATE TRIGGER trg_resource_invites_updated_at
  BEFORE UPDATE ON public.resource_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

-- ─── RLS user_blocks ───────────────────────────────────────────────────────

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_blocks_select"
  ON public.user_blocks
  FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR public.is_td_admin(auth.uid()));

CREATE POLICY "user_blocks_insert"
  ON public.user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "user_blocks_delete"
  ON public.user_blocks
  FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid() OR public.is_td_admin(auth.uid()));

-- ─── RLS resource_invites ──────────────────────────────────────────────────

ALTER TABLE public.resource_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_invites_select"
  ON public.resource_invites
  FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = resource_invites.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    OR public.is_td_admin(auth.uid())
  );

CREATE POLICY "resource_invites_owner_insert"
  ON public.resource_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    AND invitee_id <> auth.uid()
  );

CREATE POLICY "resource_invites_invitee_respond"
  ON public.resource_invites
  FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid() AND status = 'pending')
  WITH CHECK (
    invitee_id = auth.uid()
    AND status IN ('accepted'::public.resource_invite_status, 'rejected'::public.resource_invite_status)
  );

CREATE POLICY "resource_invites_owner_manage"
  ON public.resource_invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = resource_invites.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    AND status IN (
      'pending'::public.resource_invite_status,
      'rejected'::public.resource_invite_status,
      'revoked'::public.resource_invite_status
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = resource_invites.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    AND status IN (
      'pending'::public.resource_invite_status,
      'revoked'::public.resource_invite_status
    )
  );
