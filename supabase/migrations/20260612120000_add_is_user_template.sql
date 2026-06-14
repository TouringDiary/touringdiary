-- Migration: add is_user_template to suitcases
-- Purpose: Distinguish user-owned templates from operational suitcases (valigie).

ALTER TABLE public.suitcases
  ADD COLUMN IF NOT EXISTS is_user_template boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.suitcases.is_user_template IS
  'True when the row is a personal reusable template (Template USER). False for valigie and ignored for TD templates (user_id IS NULL).';

ALTER TABLE public.suitcases
  DROP CONSTRAINT IF EXISTS suitcases_user_template_requires_owner;

ALTER TABLE public.suitcases
  ADD CONSTRAINT suitcases_user_template_requires_owner
  CHECK (NOT is_user_template OR user_id IS NOT NULL);

-- Harden INSERT: users cannot create global TD templates (user_id NULL) via client.
DROP POLICY IF EXISTS "Utenti possono inserire le proprie valigie" ON public.suitcases;
DROP POLICY IF EXISTS "suitcases_insert_owner_only" ON public.suitcases;

CREATE POLICY "suitcases_insert_owner_only"
  ON public.suitcases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);
