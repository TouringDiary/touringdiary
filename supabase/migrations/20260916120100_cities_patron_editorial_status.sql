-- MF1 — D72: status editoriale Santo Patrono su colonna dedicata (NON patron_details JSON).

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS patron_editorial_status text;

ALTER TABLE public.cities
  DROP CONSTRAINT IF EXISTS cities_patron_editorial_status_check;

ALTER TABLE public.cities
  ADD CONSTRAINT cities_patron_editorial_status_check
  CHECK (
    patron_editorial_status IS NULL
    OR patron_editorial_status IN ('draft', 'published', 'suspended', 'canceled')
  );

COMMENT ON COLUMN public.cities.patron_editorial_status IS
  'D72 editorial status for Santo Patrono public visibility. NULL treated as published by app.';
