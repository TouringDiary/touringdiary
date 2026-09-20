-- MF3 — Pipeline verifica per-step (D80, §42.13)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'image_verification_step_outcome') THEN
    CREATE TYPE public.image_verification_step_outcome AS ENUM (
      'verified',
      'unverified',
      'doubt',
      'blocked',
      'not_applicable'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.image_verification_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid NOT NULL REFERENCES public.media_assets (id) ON DELETE CASCADE,
  overall_outcome public.image_verification_step_outcome,
  blocking_step_code text,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS image_verification_runs_media_asset_created_idx
  ON public.image_verification_runs (media_asset_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.image_verification_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.image_verification_runs (id) ON DELETE CASCADE,
  step_code text NOT NULL,
  step_order integer NOT NULL,
  outcome public.image_verification_step_outcome NOT NULL,
  ai_rationale text,
  admin_rationale text,
  admin_override boolean NOT NULL DEFAULT false,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_code)
);

CREATE INDEX IF NOT EXISTS image_verification_steps_run_order_idx
  ON public.image_verification_steps (run_id, step_order);

ALTER TABLE public.image_verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_verification_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS image_verification_runs_admin ON public.image_verification_runs;
CREATE POLICY image_verification_runs_admin ON public.image_verification_runs
  FOR ALL
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS image_verification_steps_admin ON public.image_verification_steps;
CREATE POLICY image_verification_steps_admin ON public.image_verification_steps
  FOR ALL
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_verification_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_verification_steps TO authenticated;
GRANT ALL ON public.image_verification_runs TO service_role;
GRANT ALL ON public.image_verification_steps TO service_role;

COMMENT ON TABLE public.image_verification_runs IS
  'MF3 — esecuzione pipeline verifica foto reale / candidati dubbi (D80).';
COMMENT ON TABLE public.image_verification_steps IS
  'MF3 — esito per step checklist §6.1; motivazione AI separata da override Admin (D81/D82).';
