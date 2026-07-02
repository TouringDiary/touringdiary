-- Fase 1 Collaborazione: Nome utente univoco (profiles.slug)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_ci
  ON public.profiles (lower(trim(slug)))
  WHERE slug IS NOT NULL AND trim(slug) <> '';
