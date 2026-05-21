-- Migrazione: AI Usage Performance & Dynamic Budget Ratio
-- Data: 2026-04-19

-- 1. Indici di performance per query aggregate (Single Source of Truth)
CREATE INDEX IF NOT EXISTS idx_ai_global_usage_user_date ON public.ai_global_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_global_usage_guest_date ON public.ai_global_usage(guest_id, date);

-- Indice per model_type e date (già esistente, ma consolidiamo)
CREATE INDEX IF NOT EXISTS idx_ai_global_usage_model_date ON public.ai_global_usage(model_type, date);

-- 2. Inizializzazione anon_guest_budget_ratio in global_settings
-- Default: 0.05 (5% del budget globale)
INSERT INTO public.global_settings (key, value)
VALUES ('anon_guest_budget_ratio', '0.05')
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN public.ai_global_usage.user_id IS 'ID utente registrato (null se anonimo).';
COMMENT ON INDEX idx_ai_global_usage_user_date IS 'Ottimizza il calcolo dei limiti giornalieri e mensili per utenti registrati.';
COMMENT ON INDEX idx_ai_global_usage_guest_date IS 'Ottimizza il calcolo del budget per utenti ospiti (anonimi).';
