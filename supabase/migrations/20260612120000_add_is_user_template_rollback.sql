-- Rollback: remove is_user_template from suitcases

DROP POLICY IF EXISTS "suitcases_insert_owner_only" ON public.suitcases;

CREATE POLICY "Utenti possono inserire le proprie valigie"
  ON public.suitcases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.suitcases
  DROP CONSTRAINT IF EXISTS suitcases_user_template_requires_owner;

ALTER TABLE public.suitcases
  DROP COLUMN IF EXISTS is_user_template;
