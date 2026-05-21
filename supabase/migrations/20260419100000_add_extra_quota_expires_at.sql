-- Migrazione: Aggiunta supporto override temporaneo AI
-- Data: 2026-04-19

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS extra_quota_expires_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.profiles.extra_quota_expires_at IS 'Data di scadenza per l''extra quota AI assegnata manualmente.';
