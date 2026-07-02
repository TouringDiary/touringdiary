-- Fase 5 Collaborazione: accesso RLS valigie/template condivisi + tracciamento autore modifica

ALTER TABLE public.suitcases
  ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.suitcases.last_modified_by IS
  'Ultimo utente che ha modificato la risorsa (§21). Il creatore resta su user_id.';

-- ─── Helper RLS collaborativo ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_access_collaborative_suitcase(
  p_suitcase_id uuid,
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
    WHERE sr.resource_id = p_suitcase_id
      AND sr.kind IN (
        'suitcase'::public.shared_resource_kind,
        'user_template'::public.shared_resource_kind
      )
      AND sr.sharing_mode = 'collaborative'::public.sharing_mode
      AND m.user_id = auth.uid()
      AND (
        NOT p_require_collaborator
        OR m.role = 'collaborator'::public.collaborative_member_role
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_collaborative_suitcase(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_collaborative_suitcase(uuid, boolean) TO authenticated;

-- ─── suitcases: SELECT esteso ai membri collaborativi ───────────────────────

DROP POLICY IF EXISTS "Users view accessible suitcases" ON public.suitcases;

CREATE POLICY "Users view accessible suitcases"
  ON public.suitcases
  FOR SELECT
  TO authenticated
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR public.is_td_admin(auth.uid())
    OR public.can_access_collaborative_suitcase(id, false)
  );

-- Collaboratori possono aggiornare metadati valigia/template condivisi
CREATE POLICY "Collaborators update shared suitcases"
  ON public.suitcases
  FOR UPDATE
  TO authenticated
  USING (public.can_access_collaborative_suitcase(id, true))
  WITH CHECK (public.can_access_collaborative_suitcase(id, true));

-- ─── suitcase_items: RLS allineato al contenitore ───────────────────────────

ALTER TABLE public.suitcase_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view suitcase items" ON public.suitcase_items;
DROP POLICY IF EXISTS "Users manage own suitcase items" ON public.suitcase_items;
DROP POLICY IF EXISTS "Collaborators manage shared suitcase items" ON public.suitcase_items;

CREATE POLICY "Users view suitcase items"
  ON public.suitcase_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.suitcases s
      WHERE s.id = suitcase_items.suitcase_id
        AND (
          s.user_id IS NULL
          OR s.user_id = auth.uid()
          OR public.is_td_admin(auth.uid())
          OR public.can_access_collaborative_suitcase(s.id, false)
        )
    )
  );

CREATE POLICY "Users manage own suitcase items"
  ON public.suitcase_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.suitcases s
      WHERE s.id = suitcase_items.suitcase_id
        AND (s.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.suitcases s
      WHERE s.id = suitcase_items.suitcase_id
        AND (s.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  );

CREATE POLICY "Collaborators manage shared suitcase items"
  ON public.suitcase_items
  FOR ALL
  TO authenticated
  USING (public.can_access_collaborative_suitcase(suitcase_id, true))
  WITH CHECK (public.can_access_collaborative_suitcase(suitcase_id, true));
