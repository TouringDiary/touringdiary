-- Macrofase C: verifica vincoli DB prima di applicare le migration generate.
-- Eseguire in Supabase SQL Editor. Ogni sezione indica il risultato atteso.

-- =============================================================================
-- 1. packing_standard_items
-- =============================================================================
-- Vincolo richiesto dalle migration M2:
--   CONSTRAINT packing_standard_items_unique_name UNIQUE (category, name)
-- Origine: 20260616120000_create_packing_catalog_tables.sql

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.packing_standard_items'::regclass
  AND contype = 'u';

-- Atteso: almeno 1 riga con definition ~ UNIQUE (category, name)
-- ON CONFLICT (category, name) in M2: VALIDO solo se il vincolo esiste.

-- =============================================================================
-- 2. packing_template_items
-- =============================================================================
-- Vincolo richiesto dalle migration M3:
--   CONSTRAINT packing_template_items_unique_name UNIQUE (template_id, category, name)

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.packing_template_items'::regclass
  AND contype = 'u';

-- Atteso: UNIQUE (template_id, category, name)
-- ON CONFLICT (template_id, category, name) in M3: VALIDO solo se il vincolo esiste.
-- Nota: M3 usa DELETE + INSERT; ON CONFLICT è difesa aggiuntiva su re-run.

-- =============================================================================
-- 3. packing_ai_catalog
-- =============================================================================
-- Vincolo richiesto dalle migration M4:
--   CONSTRAINT packing_ai_catalog_unique_name UNIQUE (name)

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.packing_ai_catalog'::regclass
  AND contype = 'u';

-- Atteso: UNIQUE (name)
-- ON CONFLICT (name) in M4: VALIDO solo se il vincolo esiste.

-- =============================================================================
-- 4. city_template_map
-- =============================================================================
-- Nessun UNIQUE su (city_type, template_id) nella migration originale.
-- M5 usa DELETE + INSERT senza ON CONFLICT.

SELECT
  conname AS constraint_name,
  contype,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.city_template_map'::regclass;

-- Atteso: solo PRIMARY KEY su id, FK su template_id.
-- ON CONFLICT su city_template_map: NON USARE (non garantito).

-- =============================================================================
-- 5. suitcases (template TD per M1/M3/M5)
-- =============================================================================

SELECT id, title
FROM public.suitcases
WHERE user_id IS NULL
ORDER BY title;

-- Atteso post-M1: 7 righe con title 'Template Mare', 'Template Fiumi & Laghi', ...
