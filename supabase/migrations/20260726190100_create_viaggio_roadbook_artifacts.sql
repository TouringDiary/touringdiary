-- WF-07 / MP-01 STEP-3 — Roadbook library sul Viaggio (DOC 37 §5)
-- Snapshot immutabili: INSERT/SELECT/DELETE; nessun UPDATE di contenuto.

CREATE TABLE IF NOT EXISTS public.viaggio_roadbook_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id uuid NOT NULL REFERENCES public.viaggi (id) ON DELETE CASCADE,
  -- Invariante dominio: ogni Roadbook nasce da un Diario (DOC 37 §5 / VD-005).
  source_diary_id uuid NOT NULL REFERENCES public.itineraries (id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.viaggio_roadbook_artifacts IS
  'Library Roadbook del Viaggio: snapshot immutabili generati da un Diario (DOC 37 §5).';

COMMENT ON COLUMN public.viaggio_roadbook_artifacts.source_diary_id IS
  'Diario sorgente obbligatorio (invariante di generazione). FK NOT NULL.';

COMMENT ON COLUMN public.viaggio_roadbook_artifacts.snapshot IS
  'Contenuto Roadbook (RoadbookDay[]) congelato alla creazione.';

CREATE INDEX IF NOT EXISTS idx_viaggio_roadbook_artifacts_viaggio_id
  ON public.viaggio_roadbook_artifacts (viaggio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_viaggio_roadbook_artifacts_source_diary
  ON public.viaggio_roadbook_artifacts (source_diary_id);

CREATE INDEX IF NOT EXISTS idx_viaggio_roadbook_artifacts_user_created_at
  ON public.viaggio_roadbook_artifacts (user_id, created_at DESC);

ALTER TABLE public.viaggio_roadbook_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own viaggio_roadbook_artifacts" ON public.viaggio_roadbook_artifacts;
CREATE POLICY "Users select own viaggio_roadbook_artifacts"
  ON public.viaggio_roadbook_artifacts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users insert own viaggio_roadbook_artifacts" ON public.viaggio_roadbook_artifacts;
CREATE POLICY "Users insert own viaggio_roadbook_artifacts"
  ON public.viaggio_roadbook_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users delete own viaggio_roadbook_artifacts" ON public.viaggio_roadbook_artifacts;
CREATE POLICY "Users delete own viaggio_roadbook_artifacts"
  ON public.viaggio_roadbook_artifacts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_td_admin(auth.uid())
  );

-- Nessuna policy UPDATE → immutabilità a livello RLS.

GRANT SELECT, INSERT, DELETE ON public.viaggio_roadbook_artifacts TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_viaggio_roadbook_artifact_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'viaggio_roadbook_artifacts are immutable (DOC 37 VD-005)';
END;
$$;

DROP TRIGGER IF EXISTS trg_viaggio_roadbook_artifacts_immutable
  ON public.viaggio_roadbook_artifacts;
CREATE TRIGGER trg_viaggio_roadbook_artifacts_immutable
  BEFORE UPDATE ON public.viaggio_roadbook_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_viaggio_roadbook_artifact_update();
