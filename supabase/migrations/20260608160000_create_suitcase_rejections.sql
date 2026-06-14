-- =============================================================================
-- MIGRATION: 20260608160000_create_suitcase_rejections.sql
-- DESCRIZIONE: Introduzione della blacklist persistente per i suggerimenti AI 
--              rifiutati nella Valigia.
-- =============================================================================

-- 1. Creazione Tabella
CREATE TABLE IF NOT EXISTS public.suitcase_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relazione con la valigia (Dominio)
    suitcase_id UUID NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
    
    -- Identità dell'oggetto rifiutato
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    
    -- Metadati (Standard di progetto: created_at per log/registri)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ai_suggestion_context TEXT,
    
    -- Vincolo di Unicità: un oggetto può essere rifiutato una sola volta per valigia
    CONSTRAINT suitcase_rejections_unique_item UNIQUE (suitcase_id, name)
);

-- 2. Indici per Performance
-- Ottimizza il lookup durante la generazione di nuovi suggerimenti AI
CREATE INDEX IF NOT EXISTS idx_suitcase_rejections_lookup 
ON public.suitcase_rejections (suitcase_id, name);

-- Ottimizza la visualizzazione della lista "Oggetti Rifiutati"
CREATE INDEX IF NOT EXISTS idx_suitcase_rejections_created_at 
ON public.suitcase_rejections (suitcase_id, created_at DESC);

-- 3. Commenti (Documentazione Schema)
COMMENT ON TABLE public.suitcase_rejections IS 'Blacklist persistente degli oggetti suggeriti dall''AI e rifiutati dall''utente.';
COMMENT ON COLUMN public.suitcase_rejections.name IS 'Nome normalizzato dell''oggetto per evitare duplicati e riproposte.';
COMMENT ON COLUMN public.suitcase_rejections.ai_suggestion_context IS 'Contesto originale del suggerimento (es. tag viaggio) per analisi.';

-- 4. Sicurezza (RLS)
ALTER TABLE public.suitcase_rejections ENABLE ROW LEVEL SECURITY;

-- Policy: Selezione (Proprietario della valigia)
CREATE POLICY "Users can view rejections for their own suitcases"
ON public.suitcase_rejections
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.suitcases
        WHERE suitcases.id = suitcase_rejections.suitcase_id
        AND suitcases.user_id = auth.uid()
    )
);

-- Policy: Inserimento (Proprietario della valigia)
CREATE POLICY "Users can reject items for their own suitcases"
ON public.suitcase_rejections
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.suitcases
        WHERE suitcases.id = suitcase_id
        AND suitcases.user_id = auth.uid()
    )
);

-- Policy: Eliminazione (Proprietario della valigia - per ripristino o reset)
CREATE POLICY "Users can remove rejections from their own suitcases"
ON public.suitcase_rejections
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.suitcases
        WHERE suitcases.id = suitcase_rejections.suitcase_id
        AND suitcases.user_id = auth.uid()
    )
);

-- Policy: Admin (Accesso totale per manutenzione/analytics)
CREATE POLICY "Admins have full access to suitcase rejections"
ON public.suitcase_rejections
FOR ALL
TO authenticated
USING (public.is_td_admin(auth.uid()) OR public.is_service_role());
