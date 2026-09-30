-- =============================================================================
-- NOT A MIGRATION
--   • Non applicare con `supabase db push` né con apply migration automatico.
--   • Nessun harness automatico D90 in repository (solo checklist manuale).
--
-- CHECKLIST MANUALE D90 (nome file storico: «contract_tests» ≠ suite automatica)
--   RPC: public.save_poi_with_image_assignment
--   Migration: 20260928210000_save_poi_skip_primary_image_update.sql
--
-- Nessun PASS/FAIL automatico. Nessun harness psql dedicato (a differenza di
--   supabase/tests/image_mgmt_phase1_dual_write_integration.sql).
-- Verificare in dev (SQL editor / psql) con POI/città reali già presenti nel DB;
-- non copiare id fittizi come dati di produzione.
-- =============================================================================

-- Contratto garantito dalla migration (solo ciò che il SQL implementa):
--   • p_skip_primary_image_update = true → RETURN prima del branch primary (MF4 invariato).
--   • skip=false + tripletta immagine tutta NULL → revoca primary esplicita (lock + count >1 + history).
--   • skip=false + parametri immagine parziali → RAISE prima dell’upsert pois.
--   • skip=false + immagine completa → upsert_poi_primary_image_assignment (lock interno; no check COUNT>1 lì).
--   • Coordinate: se lat/lng assenti nel JSON → v_coords_* restano NULL → ON CONFLICT SET coords_lat/lng = EXCLUDED (NULL).
--     ⚠ Non è «preserve coordinate esistenti se omesso nel payload»: assenza = scrittura NULL su update.
--     Decisione prodotto «omit = preserve» non dimostrata in documentazione D90 — v. D-D90-01 (Technical Debt).

-- -----------------------------------------------------------------------------
-- (a) skip=true preserva primary MF4
-- Pre: POI con primary active.
-- Azione: skip=true, p_image_* NULL.
-- Atteso: nessun ramo primary; assignment invariata; pois.image_url NULL.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- (b) coordinate assenti nel payload (UPDATE POI esistente con coords già valorizzate)
-- Azione: payload senza chiavi coords o valori null/vuoti; skip=true o false (upsert pois sempre).
--
-- Comportamento IMPLEMENTATO dalla migration (verificabile nel SQL):
--   assenza lat/lng nel JSON => v_coords_lat/v_coords_lng NULL => ON CONFLICT SET coords_* = EXCLUDED (NULL).
--   Non usa COALESCE(..., 0); non genera 0,0 sintetico.
--
-- Decisione di prodotto NON dimostrata nel repo (Technical Debt D-D90-01, NON requisito migration):
--   «omit coordinate nel payload = preservare coords_lat/lng già in pois».
--   Questa checklist NON classifica NULL su update come bug né come feature: solo constatazione SQL.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- (c) revoca esplicita primary
-- Azione: skip=false; p_image_url, p_storage_bucket, p_storage_path tutti NULL.
-- Atteso: ramo revoke; primary active → removed + is_current=false + history.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- (d) parametri immagine parziali
-- Azione: skip=false; es. solo p_image_url valorizzato.
-- Atteso: RAISE «Parametri immagine primary incompleti…» (validazione prima dell’upsert pois).
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- (e) più di una primary active — solo ramo revoca esplicita (c)
-- Pre: due primary active stesso POI/city (dato corrotto).
-- Azione: skip=false + tripletta NULL (revoca).
-- Atteso: RAISE «più di una primary active…» nel branch revoke di save_poi_with_image_assignment.
-- Nota: assegnazione con immagine completa delega a upsert_poi_primary_image_assignment;
--   questa checklist NON verifica il comportamento di quella RPC su >1 primary.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- (f) coordinate fuori range / non finite
-- Azione: coords_lat=91, lng=181, o non numerico.
-- Atteso: RAISE; nessun upsert con coordinate invalide.
-- -----------------------------------------------------------------------------
