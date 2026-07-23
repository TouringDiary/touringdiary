-- =============================================================================
-- reviews.criteria — allinea lo schema al modello multi-criterio applicativo
-- =============================================================================
-- Contesto: saveUnifiedReview inviava `criteria` (PGRST204) perché la colonna
-- non esisteva. Il voto medio resta in `rating` (monitoraggio qualità / soglia
-- sponsor); i singoli criteri restano in `criteria` (jsonb object).
-- =============================================================================

ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS criteria jsonb NULL;

COMMENT ON COLUMN public.reviews.criteria IS
    'Valutazioni multi-criterio (object key → stelle 1–5). NULL se assente. Il voto medio resta in rating.';
