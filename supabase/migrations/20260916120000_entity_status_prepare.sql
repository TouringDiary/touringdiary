-- MF1 — Estensione additiva stati editoriali entità (D39).
-- Nessun UPDATE massivo su dati esistenti.

ALTER TABLE public.city_people
  DROP CONSTRAINT IF EXISTS city_people_status_check;

ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_status_check
  CHECK (
    status IS NULL
    OR status IN ('draft', 'published', 'suspended', 'canceled')
  );

ALTER TABLE public.pois
  DROP CONSTRAINT IF EXISTS pois_status_check;

ALTER TABLE public.pois
  ADD CONSTRAINT pois_status_check
  CHECK (
    status IS NULL
    OR status IN ('draft', 'published', 'suspended', 'canceled', 'needs_check')
  );

COMMENT ON COLUMN public.city_people.status IS
  'Editorial lifecycle MF1: draft|published|suspended|canceled';

COMMENT ON COLUMN public.pois.status IS
  'Editorial lifecycle MF1: draft|published|suspended|canceled|needs_check (needs_check solo POI)';
