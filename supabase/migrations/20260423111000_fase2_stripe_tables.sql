-- ==========================================
-- FASE 2: STRIPE INTEGRATION & CREDIT PACKAGES
-- Date: 2026-04-23
-- Description: Setup tabelle per vendita crediti extra
-- ==========================================

BEGIN;

-- 1. Tabella Pacchetti Crediti Extra
CREATE TABLE IF NOT EXISTS public.extra_credit_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    flash_credits integer NOT NULL DEFAULT 0,
    pro_credits integer NOT NULL DEFAULT 0,
    price_eur numeric(10,2) NOT NULL,
    stripe_price_id_test text,
    stripe_price_id_prod text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extra_credit_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono leggere i pacchetti attivi
CREATE POLICY "Anyone can view active packages" 
ON public.extra_credit_packages FOR SELECT 
USING (is_active = true);

-- 2. Tabella Transazioni Crediti
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id uuid REFERENCES public.extra_credit_packages(id),
    amount_eur numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    provider_session_id text, -- Stripe Checkout Session ID
    flash_credits_assigned integer DEFAULT 0,
    pro_credits_assigned integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti possono vedere solo le proprie transazioni
CREATE POLICY "Users can view own transactions" 
ON public.credit_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Seed dei pacchetti iniziali (come da requisiti)
INSERT INTO public.extra_credit_packages (name, flash_credits, pro_credits, price_eur, sort_order)
VALUES 
    ('50 Flash Credits', 50, 0, 1.00, 10),
    ('150 Flash Credits', 150, 0, 2.00, 20),
    ('500 Flash Credits', 500, 0, 5.00, 30),
    ('10 Pro Credits', 0, 10, 3.00, 40),
    ('30 Pro Credits', 0, 30, 7.00, 50)
ON CONFLICT DO NOTHING;

COMMIT;
