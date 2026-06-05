-- 1. Creazione Tabella affiliate_clicks
CREATE TABLE public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    partner_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web',
    category TEXT NOT NULL,
    poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
    product_id TEXT,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    search_query TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Indici per Performance Analytics
CREATE INDEX idx_affiliate_clicks_created_at ON public.affiliate_clicks (created_at DESC);
CREATE INDEX idx_affiliate_clicks_partner_id ON public.affiliate_clicks (partner_id);
CREATE INDEX idx_affiliate_clicks_source_type ON public.affiliate_clicks (source_type);
CREATE INDEX idx_affiliate_clicks_category ON public.affiliate_clicks (category);
CREATE INDEX idx_affiliate_clicks_platform ON public.affiliate_clicks (platform);
CREATE INDEX idx_affiliate_clicks_poi_id ON public.affiliate_clicks (poi_id) WHERE poi_id IS NOT NULL;

-- 3. Commenti
COMMENT ON TABLE public.affiliate_clicks IS 'Registro atomico dei click-out verso partner affiliati.';
COMMENT ON COLUMN public.affiliate_clicks.source_type IS 'Origine: suitcase, poi, ai, cta.';

-- 4. RLS e Sicurezza
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Policy Inserimento (Public): Consente a chiunque (anche guest) di registrare un click.
CREATE POLICY "Allow public insert" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);

-- Policy Lettura (Admin): Allineata allo standard di governance TD.
CREATE POLICY "Allow admin select" 
ON public.affiliate_clicks 
FOR SELECT 
TO authenticated 
USING (public.is_td_admin(auth.uid()) OR public.is_service_role());
