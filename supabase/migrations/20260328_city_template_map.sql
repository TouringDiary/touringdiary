-- Migration: city_template_map
-- Purpose: Maps city_type values to global suitcase templates for automatic suggestion.
-- Supports multiple templates per city_type and future priority ranking.

CREATE TABLE IF NOT EXISTS public.city_template_map (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_type   text NOT NULL,           -- e.g. 'mare', 'montagna', 'cultura', 'business'
  template_id uuid NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
  priority    integer NOT NULL DEFAULT 0, -- lower = higher priority (for future AI ranking)
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by city_type
CREATE INDEX IF NOT EXISTS idx_city_template_map_city_type ON public.city_template_map(city_type);

-- RLS: Readable by all authenticated users, writeable only by admins (via service role)
ALTER TABLE public.city_template_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_template_map: read for all authenticated"
  ON public.city_template_map FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed: Example entries (template_id must be real UUIDs from your suitcases table — update after inserting templates)
-- INSERT INTO public.city_template_map (city_type, template_id, priority)
-- VALUES
--   ('mare',      '<id of Template Mare>',      0),
--   ('montagna',  '<id of Template Montagna>',  0),
--   ('cultura',   '<id of Template Città>',     0),
--   ('business',  '<id of Template Lavoro>',    0),
--   ('lago',      '<id of Template Fiumi & Laghi>', 0);
