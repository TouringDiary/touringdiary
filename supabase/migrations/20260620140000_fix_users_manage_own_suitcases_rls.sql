-- Fix: anon SELECT on suitcases fails with 42501 on is_td_admin().
-- Cause: "Users manage own suitcases" is FOR ALL TO public; ALL policies participate
-- in SELECT evaluation, so anon still hits is_td_admin() despite scoped SELECT policies.
-- Fix: restrict manage policy to authenticated only.

DROP POLICY IF EXISTS "Users manage own suitcases" ON public.suitcases;

CREATE POLICY "Users manage own suitcases"
  ON public.suitcases
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );
