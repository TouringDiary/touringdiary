-- ==============================================
-- MIGRAZIONE MODELLO RELAZIONALE VALIGIE (1-a-N)
-- ==============================================

-- 1. Creazione Tabella Pivot
CREATE TABLE IF NOT EXISTS itinerary_suitcases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id uuid REFERENCES itineraries(id) ON DELETE CASCADE,
  suitcase_id uuid REFERENCES suitcases(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_id, suitcase_id)
);

-- 2. Vincolo Unicità Primaria (Un solo primary per itinerario)
CREATE UNIQUE INDEX IF NOT EXISTS idx_itinerary_suitcases_primary_unique 
ON itinerary_suitcases (itinerary_id) 
WHERE is_primary = true;

-- 3. Backfill Dati Esistenti
INSERT INTO itinerary_suitcases (itinerary_id, suitcase_id, is_primary, created_at)
SELECT itinerary_id, id, true, created_at 
FROM suitcases 
WHERE itinerary_id IS NOT NULL;

-- 4. Funzione per Promozione Primaria Automatica post-delete
CREATE OR REPLACE FUNCTION promote_new_primary_suitcase()
RETURNS TRIGGER AS $$
BEGIN
  -- Se la valigia eliminata era la primaria
  IF OLD.is_primary = true THEN
    -- Trova la prossima valigia collegata più vecchia (FIFO)
    UPDATE itinerary_suitcases 
    SET is_primary = true 
    WHERE id = (
      SELECT id FROM itinerary_suitcases 
      WHERE itinerary_id = OLD.itinerary_id 
      AND id != OLD.id
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger per Promozione Primaria
DROP TRIGGER IF EXISTS trigger_promote_primary ON itinerary_suitcases;
CREATE TRIGGER trigger_promote_primary
AFTER DELETE ON itinerary_suitcases
FOR EACH ROW
EXECUTE FUNCTION promote_new_primary_suitcase();

-- 6. Aggiornamento RPC clone_suitcase per il nuovo modello
CREATE OR REPLACE FUNCTION clone_suitcase(p_template_id uuid, p_itinerary_id uuid, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_new_suitcase_id uuid;
  v_title text;
  v_icon text;
  v_is_primary boolean;
BEGIN
  -- 1. Preleva i metadata del template
  SELECT title, icon INTO v_title, v_icon 
  FROM suitcases WHERE id = p_template_id;
  
  -- 2. Crea la nuova valigia "fisica" (indipendente)
  INSERT INTO suitcases (user_id, title, icon)
  VALUES (p_user_id, v_title, v_icon)
  RETURNING id INTO v_new_suitcase_id;

  -- 3. Copia gli oggetti
  INSERT INTO suitcase_items (suitcase_id, name, category, quantity, is_checked, is_ai_suggestion)
  SELECT v_new_suitcase_id, name, category, quantity, false, false
  FROM suitcase_items
  WHERE suitcase_id = p_template_id AND is_ai_suggestion = false;

  -- 4. Determina se deve essere primaria
  SELECT NOT EXISTS (SELECT 1 FROM itinerary_suitcases WHERE itinerary_id = p_itinerary_id)
  INTO v_is_primary;

  -- 5. Crea il link nella pivot
  INSERT INTO itinerary_suitcases (itinerary_id, suitcase_id, is_primary)
  VALUES (p_itinerary_id, v_new_suitcase_id, v_is_primary);

  RETURN v_new_suitcase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
