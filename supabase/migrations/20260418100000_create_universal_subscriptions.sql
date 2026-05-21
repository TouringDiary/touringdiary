-- ==========================================
-- SUB-SYSTEM REFACTOR - PHASE 1
-- Date: 2026-04-18
-- Description: Creazione base per Universal Subscriptions Engine
-- ==========================================

BEGIN;

-- 1. CREAZIONE TABELLA UNIVERSALE SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Owner References (Mutually Exclusive)
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE CASCADE,
    
    -- Configurazione Piano e Campagna
    pricing_version_id uuid REFERENCES public.pricing_versions(id) NOT NULL,
    campaign_id uuid, -- SENZA REFERENCES perché la tabella campaigns non esiste ancora nel database reale
    
    -- Tracking Finanziario
    price_paid numeric NOT NULL,
    currency_paid text NOT NULL DEFAULT 'EUR',
    
    -- Lifecycle Date
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    
    -- Flags e Stato
    auto_renew boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- CONSTRAINT: Integrità Esclusività Owner (O User O Sponsor)
    CONSTRAINT chk_subscription_owner CHECK (
        (user_id IS NOT NULL AND sponsor_id IS NULL) OR 
        (user_id IS NULL AND sponsor_id IS NOT NULL)
    ),
    
    -- CONSTRAINT: Integrità Temporale
    CONSTRAINT chk_subscription_dates CHECK (
        end_date > start_date
    )
);

-- 2. INDICI CONSIGLIATI PER PERFORMANCE & SCHEDULER
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_sponsor_id ON public.subscriptions(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pricing_version_id ON public.subscriptions(pricing_version_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_ranges ON public.subscriptions(start_date, end_date);
-- Indice composito ultra-ottimizzato per le query dello Scheduler Expiration
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end_date ON public.subscriptions(status, end_date);

-- 3. TRIGGER PER AGGIORNAMENTO AUTOMATICO DI `updated_at`
CREATE OR REPLACE FUNCTION public.set_updated_at_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER trigger_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_subscriptions();

-- 4. PREPARAZIONE PER INTEGRAZIONE AI LIMITS IN PRICING_VERSIONS (Punto 6)
-- Aggiungiamo la colonna jsonb se non esiste già, per ospitare i limiti runtime 
-- e spostare la fonte di verità fuori da global_settings.
ALTER TABLE public.pricing_versions 
ADD COLUMN IF NOT EXISTS ai_limits jsonb DEFAULT '{}'::jsonb;

COMMIT;
