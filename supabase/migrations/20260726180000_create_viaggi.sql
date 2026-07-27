-- WF-05 / MP-01 STEP-1 / Batch B1 (M1)
-- Aggregate Root patrimonio personale: public.viaggi
-- Dominio: DOC 34A / DOC 37 — Diario resta su itineraries (M2 aggiunge viaggio_id).

CREATE TABLE IF NOT EXISTS public.viaggi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NULL,
  period_start date NULL,
  period_end date NULL,
  cover_image text NULL,
  -- FK a itineraries: tabella già esistente. Valorizzazione post-cutover (Batch B4).
  active_diary_id uuid NULL REFERENCES public.itineraries (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT viaggi_period_order_chk CHECK (
    period_start IS NULL
    OR period_end IS NULL
    OR period_end >= period_start
  )
);

COMMENT ON TABLE public.viaggi IS
  'Aggregate Root patrimonio personale (dominio Viaggio). Non condividere l''originale via collaboration.';

COMMENT ON COLUMN public.viaggi.title IS 'Identità del Viaggio (non del Diario).';
COMMENT ON COLUMN public.viaggi.destination IS 'Destinazione (label libera STEP-1).';
COMMENT ON COLUMN public.viaggi.period_start IS 'Inizio periodo patrimonio.';
COMMENT ON COLUMN public.viaggi.period_end IS 'Fine periodo patrimonio.';
COMMENT ON COLUMN public.viaggi.cover_image IS 'Copertina del Viaggio.';
COMMENT ON COLUMN public.viaggi.active_diary_id IS
  'Diario attivo (riferimento operativo). ON DELETE SET NULL — nessuna auto-promozione.';
COMMENT ON COLUMN public.viaggi.metadata IS 'Estensioni senza migration obbligatoria.';

CREATE INDEX IF NOT EXISTS idx_viaggi_user_id
  ON public.viaggi (user_id);

CREATE INDEX IF NOT EXISTS idx_viaggi_user_created_at
  ON public.viaggi (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_viaggi_active_diary_id
  ON public.viaggi (active_diary_id)
  WHERE active_diary_id IS NOT NULL;

-- RLS: solo owner (nessuna ACL collaborativa sul Viaggio in STEP-1)
ALTER TABLE public.viaggi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggi" ON public.viaggi;
CREATE POLICY "Users manage own viaggi"
  ON public.viaggi
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggi TO authenticated;
