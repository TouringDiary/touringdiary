-- =============================================================================
-- city_patron_gallery — didascalia opzionale per singola foto ufficiale
-- Prerequisito: 20260819120000_city_patron_gallery_and_suggestions.sql applicata.
-- NON introduce colonne temporali: created_at esistente resta il timestamp di creazione.
-- =============================================================================

ALTER TABLE public.city_patron_gallery
    ADD COLUMN caption TEXT;

COMMENT ON COLUMN public.city_patron_gallery.caption IS
    'Didascalia opzionale della singola foto ufficiale Patrono / Festa Patronale.';
