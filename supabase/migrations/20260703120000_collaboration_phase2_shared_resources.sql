-- Fase 2 Collaborazione: Motore Risorse Condivisibili, ruoli, ACL condivisione semplice

DO $$ BEGIN
  CREATE TYPE public.shared_resource_kind AS ENUM ('diary', 'suitcase', 'user_template');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sharing_mode AS ENUM ('collaborative', 'personal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.collaborative_member_role AS ENUM ('collaborator', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.shared_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.shared_resource_kind NOT NULL,
  resource_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sharing_mode public.sharing_mode NOT NULL DEFAULT 'collaborative',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shared_resources_kind_resource_id_unique UNIQUE (kind, resource_id)
);

CREATE INDEX IF NOT EXISTS shared_resources_owner_id_idx
  ON public.shared_resources (owner_id);

CREATE INDEX IF NOT EXISTS shared_resources_resource_lookup_idx
  ON public.shared_resources (kind, resource_id);

COMMENT ON TABLE public.shared_resources IS
  'Registro interno delle Risorse Condivisibili (§3). Un record per Diario, Valigia o Template Utente.';

COMMENT ON COLUMN public.shared_resources.sharing_mode IS
  'Modalità Collaborativa o Personale (§4). La UI wizard è nelle fasi successive.';

CREATE TABLE IF NOT EXISTS public.shared_resource_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_resource_id uuid NOT NULL
    REFERENCES public.shared_resources (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.collaborative_member_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shared_resource_members_unique_user UNIQUE (shared_resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS shared_resource_members_user_id_idx
  ON public.shared_resource_members (user_id);

CREATE INDEX IF NOT EXISTS shared_resource_members_resource_id_idx
  ON public.shared_resource_members (shared_resource_id);

COMMENT ON TABLE public.shared_resource_members IS
  'ACL condivisione semplice (§8). Il Proprietario è su shared_resources.owner_id, non in questa tabella.';

-- ─── updated_at (pattern progetto) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_collaboration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_resources_updated_at ON public.shared_resources;
CREATE TRIGGER trg_shared_resources_updated_at
  BEFORE UPDATE ON public.shared_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

DROP TRIGGER IF EXISTS trg_shared_resource_members_updated_at ON public.shared_resource_members;
CREATE TRIGGER trg_shared_resource_members_updated_at
  BEFORE UPDATE ON public.shared_resource_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_collaboration_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_resource_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_resources_select"
  ON public.shared_resources
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.shared_resource_members m
      WHERE m.shared_resource_id = shared_resources.id
        AND m.user_id = auth.uid()
    )
    OR public.is_td_admin(auth.uid())
  );

CREATE POLICY "shared_resources_owner_write"
  ON public.shared_resources
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "shared_resource_members_select"
  ON public.shared_resource_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = shared_resource_members.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.shared_resource_members m2
      WHERE m2.shared_resource_id = shared_resource_members.shared_resource_id
        AND m2.user_id = auth.uid()
    )
    OR public.is_td_admin(auth.uid())
  );

CREATE POLICY "shared_resource_members_owner_write"
  ON public.shared_resource_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = shared_resource_members.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.shared_resources sr
      WHERE sr.id = shared_resource_members.shared_resource_id
        AND sr.owner_id = auth.uid()
    )
    AND role IN ('collaborator'::public.collaborative_member_role, 'viewer'::public.collaborative_member_role)
    AND user_id <> (
      SELECT sr.owner_id
      FROM public.shared_resources sr
      WHERE sr.id = shared_resource_members.shared_resource_id
    )
  );
