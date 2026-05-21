
-- 1. Enum per la direzione del messaggio
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_message_direction') THEN
        CREATE TYPE sponsor_message_direction AS ENUM ('admin', 'partner', 'system');
    END IF;
END $$;

-- 2. Tabella sponsor_messages
CREATE TABLE IF NOT EXISTS public.sponsor_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Il Partner (Identità principale)
    partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- L'autore del messaggio (Audit)
    sender_id uuid REFERENCES public.profiles(id),
    
    -- Contesto opzionale (collegamento a lead o contratto specifico)
    request_id uuid REFERENCES public.sponsor_requests(id) ON DELETE SET NULL,
    sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE SET NULL,
    
    -- Dati Messaggio
    direction sponsor_message_direction NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS (Row Level Security)
ALTER TABLE public.sponsor_messages ENABLE ROW LEVEL SECURITY;

-- Policy Admin: può fare tutto
CREATE POLICY "Admins can manage all sponsor messages" 
ON public.sponsor_messages 
FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin_all', 'admin_city')));

-- Policy Partner: può leggere e scrivere i propri messaggi
CREATE POLICY "Partners can view their own messages" 
ON public.sponsor_messages 
FOR SELECT 
TO authenticated 
USING (partner_id = auth.uid());

CREATE POLICY "Partners can send messages" 
ON public.sponsor_messages 
FOR INSERT 
TO authenticated 
WITH CHECK (partner_id = auth.uid() AND direction = 'partner');

-- 4. Indici
CREATE INDEX IF NOT EXISTS idx_sponsor_msg_partner ON public.sponsor_messages (partner_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_msg_created ON public.sponsor_messages (created_at DESC);
