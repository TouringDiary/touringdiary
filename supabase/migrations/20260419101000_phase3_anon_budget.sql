-- Migrazione: Supporto AI Anonimi con Budget Globale
-- Data: 2026-04-19

-- 1. Estensione tabella ai_global_usage
ALTER TABLE public.ai_global_usage 
ADD COLUMN IF NOT EXISTS guest_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS model_type text DEFAULT 'flash';

-- Indice per performance query aggregate (budget globale)
CREATE INDEX IF NOT EXISTS idx_ai_global_usage_date_model ON public.ai_global_usage(date, model_type);

-- 2. Inizializzazione budget in global_settings
INSERT INTO public.global_settings (key, value)
VALUES 
    ('anon_flash_budget_eur', '4.0'),
    ('anon_pro_budget_eur', '6.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMENT ON COLUMN public.ai_global_usage.guest_id IS 'ID anonimo generato dal browser (localStorage).';
COMMENT ON COLUMN public.ai_global_usage.model_type IS 'Tipo di modello (flash/pro) per il tracking del budget.';
