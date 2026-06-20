-- Fix: anon cannot read TD templates — is_td_admin() in PUBLIC SELECT policy without EXECUTE.
-- Scope: public.suitcases SELECT policies only.

REVOKE EXECUTE ON FUNCTION public.is_td_admin(uuid) FROM anon;

DROP POLICY IF EXISTS "Allow read template suitcases" ON public.suitcases;
DROP POLICY IF EXISTS "Users view accessible suitcases" ON public.suitcases;

CREATE POLICY "Allow read template suitcases"
  ON public.suitcases
  FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL);

CREATE POLICY "Users view accessible suitcases"
  ON public.suitcases
  FOR SELECT
  TO authenticated
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR public.is_td_admin(auth.uid())
  );
