-- ==========================================
-- FASE 1: AI QUOTA CONSOLIDATION & ANALYTICS
-- Date: 2026-04-23
-- Description: Centralizzazione crediti, rimozione legacy extra_quota e setup analytics
-- ==========================================

BEGIN;

-- 1. Creazione Enum per la sorgente dei crediti
DO $$ BEGIN
    CREATE TYPE public.ai_credit_source AS ENUM (
        'purchase', 
        'subscription', 
        'rollover', 
        'bonus', 
        'sponsor', 
        'promo', 
        'referral'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Estensione tabella user_ai_credits
-- Nota: assumiamo che la tabella esista già come indicato nel sistema
ALTER TABLE public.user_ai_credits 
ADD COLUMN IF NOT EXISTS source public.ai_credit_source DEFAULT 'purchase',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Creazione tabella ai_usage_logs per Analytics Admin
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    feature_name text NOT NULL, -- 'planner', 'roadbook', 'chat', 'vision'
    model_name text NOT NULL,   -- 'gemini-2.0-pro', 'gemini-2.0-flash'
    prompt_tokens integer DEFAULT 0,
    completion_tokens integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    estimated_cost_eur numeric(10,6) DEFAULT 0,
    pricing_version_id uuid REFERENCES public.pricing_versions(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Indici per performance Analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs(feature_name);

-- 4. Cleanup legacy columns in profiles
-- Rimuoviamo extra_quota dato che siamo in pre-produzione e il sistema user_ai_credits è il nuovo standard
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS extra_quota,
DROP COLUMN IF EXISTS extra_quota_expires_at;

COMMIT;
