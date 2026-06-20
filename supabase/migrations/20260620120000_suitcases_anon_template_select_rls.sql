-- =============================================================================
-- Fix: guest (anon) cannot read TD templates on public.suitcases
-- Root cause: permissive SELECT policy "Users view accessible suitcases" applied
--   to anon and references public.is_td_admin(uuid) without EXECUTE for anon
--   → PostgreSQL 42501 "permission denied for function is_td_admin"
--
-- Fix strategy (least privilege):
--   - anon: SELECT only via template policy (user_id IS NULL)
--   - authenticated: template policy + full accessible policy (incl. is_td_admin)
--   - NO GRANT EXECUTE ON is_td_admin TO anon (avoids RPC probing)
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE POLICY
-- Does NOT alter INSERT/UPDATE/DELETE policies on suitcases.
-- =============================================================================

BEGIN;

-- Defensive: ensure anon never retains EXECUTE on admin helper (no-op if absent)
REVOKE EXECUTE ON FUNCTION public.is_td_admin(uuid) FROM anon;

-- -----------------------------------------------------------------------------
-- SELECT policies (recreated with explicit role scoping)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow read template suitcases" ON public.suitcases;
DROP POLICY IF EXISTS "Users view accessible suitcases" ON public.suitcases;

-- Public read path for TD templates (global rows: user_id IS NULL)
CREATE POLICY "Allow read template suitcases"
  ON public.suitcases
  FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL);

-- Authenticated read path: own rows + TD templates + admin override
-- Must NOT apply to anon: is_td_admin() requires EXECUTE not granted to anon by design
CREATE POLICY "Users view accessible suitcases"
  ON public.suitcases
  FOR SELECT
  TO authenticated
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR public.is_td_admin(auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Post-migration verification (fails deploy if invariants broken)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_template_policy_roles name[];
  v_accessible_policy_roles name[];
  v_anon_is_td_admin_select_count integer;
BEGIN
  -- 1) Template policy must exist and target anon + authenticated
  SELECT roles
  INTO v_template_policy_roles
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'suitcases'
    AND policyname = 'Allow read template suitcases'
    AND cmd = 'SELECT';

  IF v_template_policy_roles IS NULL THEN
    RAISE EXCEPTION 'Verification failed: policy "Allow read template suitcases" not found';
  END IF;

  IF NOT (v_template_policy_roles @> ARRAY['anon']::name[]
          AND v_template_policy_roles @> ARRAY['authenticated']::name[]) THEN
    RAISE EXCEPTION 'Verification failed: template policy roles = %, expected anon + authenticated',
      v_template_policy_roles;
  END IF;

  -- 2) Accessible policy must be authenticated-only
  SELECT roles
  INTO v_accessible_policy_roles
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'suitcases'
    AND policyname = 'Users view accessible suitcases'
    AND cmd = 'SELECT';

  IF v_accessible_policy_roles IS NULL THEN
    RAISE EXCEPTION 'Verification failed: policy "Users view accessible suitcases" not found';
  END IF;

  IF v_accessible_policy_roles @> ARRAY['anon']::name[] THEN
    RAISE EXCEPTION 'Verification failed: accessible policy must not include anon, roles = %',
      v_accessible_policy_roles;
  END IF;

  IF NOT (v_accessible_policy_roles @> ARRAY['authenticated']::name[]) THEN
    RAISE EXCEPTION 'Verification failed: accessible policy must include authenticated, roles = %',
      v_accessible_policy_roles;
  END IF;

  -- 3) No other SELECT/ALL policy visible to anon may reference is_td_admin
  --    (pg_policies exposes PUBLIC as roles = {public}, not an empty array)
  SELECT count(*)::integer
  INTO v_anon_is_td_admin_select_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'suitcases'
    AND cmd IN ('SELECT', 'ALL')
    AND qual LIKE '%is_td_admin%'
    AND (
      roles @> ARRAY['public']::name[]
      OR roles @> ARRAY['anon']::name[]
    );

  IF v_anon_is_td_admin_select_count > 0 THEN
    RAISE EXCEPTION
      'Verification failed: % SELECT policy(ies) still expose is_td_admin to anon on suitcases',
      v_anon_is_td_admin_select_count;
  END IF;

  RAISE NOTICE 'suitcases RLS verification OK: anon template read isolated from is_td_admin';
END $$;

COMMIT;

-- =============================================================================
-- Manual smoke tests (run after migration in SQL Editor or psql)
-- =============================================================================
--
-- -- A) Guest: TD templates only
-- SET LOCAL role anon;
-- SELECT count(*) FROM public.suitcases WHERE user_id IS NULL;  -- expect > 0
-- SELECT count(*) FROM public.suitcases WHERE user_id IS NOT NULL;  -- expect 0
-- RESET role;
--
-- -- B) Authenticated user (replace UUID): own rows + templates
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub TO '<user_uuid>';
-- SELECT count(*) FROM public.suitcases
--   WHERE user_id IS NULL OR user_id = '<user_uuid>'::uuid;
-- RESET role;
--
-- -- C) Admin: all rows (replace admin UUID)
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub TO '<admin_uuid>';
-- SELECT count(*) FROM public.suitcases;  -- expect full table count if is_td_admin true
-- RESET role;
--
-- -- D) Confirm anon cannot call is_td_admin via RPC privilege
-- SELECT has_function_privilege('anon', 'public.is_td_admin(uuid)', 'EXECUTE');  -- expect false
--
-- -- E) Policy inventory
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'suitcases'
-- ORDER BY policyname;
