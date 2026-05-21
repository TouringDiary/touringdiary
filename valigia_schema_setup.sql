-- ==============================================
-- SETUP SISTEMA "VALIGIA DI VIAGGIO"
-- Copia e incolla questo script nell'SQL Editor di Supabase
-- ==============================================

-- 0. Rimuovi la vecchia tabella se esiste
DROP TABLE IF EXISTS packing_items CASCADE;

-- 1. Tabella Contenitori (Suitcases)
CREATE TABLE suitcases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = Template Globale
  itinerary_id uuid REFERENCES itineraries(id) ON DELETE CASCADE, -- NULL = Template Personale 
  title text NOT NULL,
  icon text DEFAULT '🧳',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_suitcases_user ON suitcases(user_id);
CREATE INDEX idx_suitcases_itinerary ON suitcases(itinerary_id);

-- 2. Tabella Oggetti (Suitcase Items)
CREATE TABLE suitcase_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  suitcase_id uuid REFERENCES suitcases(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  quantity integer DEFAULT 1,
  is_checked boolean DEFAULT false,
  is_ai_suggestion boolean DEFAULT false,
  poi_triggers text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_suitcase_items_suitcase ON suitcase_items(suitcase_id);

-- 3. Abilitazione RLS (Opzionale ma consigliato)
ALTER TABLE suitcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suitcase_items ENABLE ROW LEVEL SECURITY;

-- 4. Policy di sicurezza per le suitcases
CREATE POLICY "Utenti possono leggere le proprie valigie o quelle globali" 
  ON suitcases FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Utenti possono inserire le proprie valigie" 
  ON suitcases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare le proprie valigie" 
  ON suitcases FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono eliminare le proprie valigie" 
  ON suitcases FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Policy di sicurezza per gli items
CREATE POLICY "Utenti gestiscono gli item delle valigie a cui hanno accesso" 
  ON suitcase_items FOR ALL 
  USING (
    suitcase_id IN (
      SELECT id FROM suitcases WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- ==============================================
-- RPC FUNZIONE CLONE: Deep Copy Template -> Valigia
-- ==============================================
CREATE OR REPLACE FUNCTION clone_suitcase(p_template_id uuid, p_itinerary_id uuid, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_new_suitcase_id uuid;
  v_title text;
  v_icon text;
BEGIN
  -- 1. Preleva i metadata del template
  SELECT title, icon INTO v_title, v_icon 
  FROM suitcases WHERE id = p_template_id;
  
  -- 2. Crea la nuova valigia "fisica" legata al viaggio attuale
  INSERT INTO suitcases (user_id, itinerary_id, title, icon)
  VALUES (p_user_id, p_itinerary_id, v_title, v_icon)
  RETURNING id INTO v_new_suitcase_id;

  -- 3. Copia gli oggetti azzerando le spunte e l'AI flag
  INSERT INTO suitcase_items (suitcase_id, name, category, quantity, is_checked, is_ai_suggestion)
  SELECT v_new_suitcase_id, name, category, quantity, false, false
  FROM suitcase_items
  WHERE suitcase_id = p_template_id AND is_ai_suggestion = false;

  RETURN v_new_suitcase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
