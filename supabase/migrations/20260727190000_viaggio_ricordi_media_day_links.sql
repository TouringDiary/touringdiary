-- WF-11 / MP-02 STEP-2 — link logici multi-giorno per Ricordi media (DOC 37 §6.4 / VD-020).
-- Contenuto unico su viaggio_ricordi_media; giorni = associazioni in junction.
-- day_key su media resta colonna di compatibilità (giorno primario / path storage).

CREATE TABLE IF NOT EXISTS public.viaggio_ricordi_media_day_links (
  media_id uuid NOT NULL REFERENCES public.viaggio_ricordi_media (id) ON DELETE CASCADE,
  day_key text NOT NULL CHECK (length(trim(day_key)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (media_id, day_key)
);

COMMENT ON TABLE public.viaggio_ricordi_media_day_links IS
  'Link logici giorno↔media Ricordi (DOC 37 §6.4). Contenuto unico; multi-giorno ammesso.';

CREATE INDEX IF NOT EXISTS idx_viaggio_ricordi_media_day_links_day
  ON public.viaggio_ricordi_media_day_links (day_key);

-- Backfill idempotente da day_key legacy.
-- WHERE NOT EXISTS: equivalente funzionale a ON CONFLICT DO NOTHING sulla PK,
-- esplicito e sicuro se la migration viene rivalutata.
INSERT INTO public.viaggio_ricordi_media_day_links (media_id, day_key)
SELECT m.id, m.day_key
FROM public.viaggio_ricordi_media m
WHERE NOT EXISTS (
  SELECT 1
  FROM public.viaggio_ricordi_media_day_links l
  WHERE l.media_id = m.id
    AND l.day_key = m.day_key
);

ALTER TABLE public.viaggio_ricordi_media_day_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_ricordi_media_day_links"
  ON public.viaggio_ricordi_media_day_links;
CREATE POLICY "Users manage own viaggio_ricordi_media_day_links"
  ON public.viaggio_ricordi_media_day_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.viaggio_ricordi_media m
      WHERE m.id = media_id
        AND (m.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.viaggio_ricordi_media m
      WHERE m.id = media_id
        AND (m.user_id = auth.uid() OR public.is_td_admin(auth.uid()))
    )
  );

-- Nessun UPDATE necessario sul junction (solo insert/delete di link).
GRANT SELECT, INSERT, DELETE ON public.viaggio_ricordi_media_day_links TO authenticated;
