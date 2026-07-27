-- WF-07 / MP-01 STEP-3 — Valigia del Viaggio (DOC 31 Parte A / DOC 37 §8)
-- Pivot patrimonio: viaggio_suitcases. itinerary_suitcases resta per debito/legacy collab.

CREATE TABLE IF NOT EXISTS public.viaggio_suitcases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id uuid NOT NULL REFERENCES public.viaggi (id) ON DELETE CASCADE,
  suitcase_id uuid NOT NULL REFERENCES public.suitcases (id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (viaggio_id, suitcase_id)
);

COMMENT ON TABLE public.viaggio_suitcases IS
  'Valigie del Viaggio (Resource). Distinte da Strumenti permanenti (DOC 31 Parte A).';

CREATE INDEX IF NOT EXISTS idx_viaggio_suitcases_viaggio_id
  ON public.viaggio_suitcases (viaggio_id);

CREATE INDEX IF NOT EXISTS idx_viaggio_suitcases_suitcase_id
  ON public.viaggio_suitcases (suitcase_id);

ALTER TABLE public.viaggio_suitcases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_suitcases" ON public.viaggio_suitcases;
CREATE POLICY "Users manage own viaggio_suitcases"
  ON public.viaggio_suitcases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.viaggi v
      WHERE v.id = viaggio_id
        AND (v.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.viaggi v
      WHERE v.id = viaggio_id
        AND (v.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggio_suitcases TO authenticated;

-- Cutover: link esistenti su diari personali con viaggio_id
INSERT INTO public.viaggio_suitcases (viaggio_id, suitcase_id, user_id, created_at)
SELECT DISTINCT i.viaggio_id, isc.suitcase_id, isc.user_id, COALESCE(isc.created_at, now())
FROM public.itinerary_suitcases isc
JOIN public.itineraries i ON i.id = isc.itinerary_id
WHERE i.viaggio_id IS NOT NULL
ON CONFLICT (viaggio_id, suitcase_id) DO NOTHING;
