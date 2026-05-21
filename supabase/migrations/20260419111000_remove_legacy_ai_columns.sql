-- ==========================================
-- CLEANUP LEGACY AI COLUMNS
-- Date: 2026-04-19
-- Description: Rimuove le colonne di conteggio AI migrate in ai_global_usage
-- ==========================================

BEGIN;

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS ai_flash_count,
DROP COLUMN IF EXISTS ai_pro_count,
DROP COLUMN IF EXISTS ai_daily_count,
DROP COLUMN IF EXISTS ai_last_date;

COMMIT;
