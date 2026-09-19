-- MF2 — entity_image_assignments (§42.2)
-- Associazione autonoma media_asset ↔ entità/contesto; target segnalazione foto.

CREATE TABLE IF NOT EXISTS public.entity_image_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid NOT NULL REFERENCES public.media_assets (id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (
    entity_type IN (
      'city_person',
      'poi',
      'patron',
      'photo_submission'
    )
  ),
  -- Polimorfico (dual-family PK, AI_CONTEXT_MASTER 03): uuid-as-text per city_people/photo_submission;
  -- text territoriale per poi/patron (entity_id = city_id).
  entity_id text NOT NULL CHECK (char_length(trim(entity_id)) > 0),
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  assignment_role text NOT NULL DEFAULT 'primary' CHECK (
    assignment_role IN ('primary', 'gallery')
  ),
  assignment_status text NOT NULL DEFAULT 'active' CHECK (
    assignment_status IN ('active', 'suspended', 'removed', 'replaced')
  ),
  is_current boolean NOT NULL DEFAULT true,
  replaced_by_assignment_id uuid REFERENCES public.entity_image_assignments (id) ON DELETE SET NULL,
  -- Snapshot/compatibility legacy (§42.15): opzionali — NON seconda SoT; media_asset_id è canonico.
  source_image_url text,
  source_storage_bucket text,
  source_storage_path text,
  first_published_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.entity_image_assignments.media_asset_id IS
  'FK obbligatoria a media_assets — ogni assignment referenzia un asset canonico.';
COMMENT ON COLUMN public.entity_image_assignments.entity_id IS
  'Identificativo polimorfico dell''entità: uuid (city_people, photo_submission) o text territoriale (poi, patron=city_id).';
COMMENT ON COLUMN public.entity_image_assignments.city_id IS
  'FK a cities.id (text — famiglia territoriale, AI_CONTEXT_MASTER 03).';
COMMENT ON COLUMN public.entity_image_assignments.source_image_url IS
  'Snapshot URL legacy opzionale al momento dell''associazione; non sostituisce media_assets.';
COMMENT ON COLUMN public.entity_image_assignments.source_storage_bucket IS
  'Snapshot bucket legacy opzionale; non sostituisce media_assets.';
COMMENT ON COLUMN public.entity_image_assignments.source_storage_path IS
  'Snapshot path legacy opzionale; non sostituisce media_assets.';
COMMENT ON COLUMN public.entity_image_assignments.entity_type IS
  'Contesto entità (§42.2): city_person, poi, patron, photo_submission. LIVE/GALLERIA = photo_submission + source_context su content_reports.';

-- §42.14 — indici consigliati
CREATE INDEX IF NOT EXISTS entity_image_assignments_media_current_idx
  ON public.entity_image_assignments (media_asset_id, is_current)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS entity_image_assignments_entity_current_idx
  ON public.entity_image_assignments (entity_type, entity_id, is_current)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS entity_image_assignments_city_type_idx
  ON public.entity_image_assignments (city_id, entity_type);

-- Un solo assignment corrente per ruolo primary (§42.2 / D1 foto ufficiale).
-- Gallery: più correnti ammessi (es. patron gallery) — nessun vincolo aggiuntivo.
CREATE UNIQUE INDEX IF NOT EXISTS entity_image_assignments_one_current_primary_uidx
  ON public.entity_image_assignments (entity_type, entity_id, city_id, assignment_role)
  WHERE is_current = true AND assignment_role = 'primary';

COMMENT ON TABLE public.entity_image_assignments IS
  'MF2 — associazione governabile foto↔entità; segnalazione colpisce assignment, non altri utilizzi dello stesso asset.';

ALTER TABLE public.entity_image_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_image_assignments_admin_manage ON public.entity_image_assignments;
CREATE POLICY entity_image_assignments_admin_manage ON public.entity_image_assignments
  FOR ALL
  TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS entity_image_assignments_authenticated_read ON public.entity_image_assignments;
CREATE POLICY entity_image_assignments_authenticated_read ON public.entity_image_assignments
  FOR SELECT
  TO authenticated
  USING (assignment_status = 'active' AND is_current = true);

-- Lettura pubblica: solo assignment correnti e attivi (D77).
DROP POLICY IF EXISTS entity_image_assignments_anon_read ON public.entity_image_assignments;
CREATE POLICY entity_image_assignments_anon_read ON public.entity_image_assignments
  FOR SELECT
  TO anon
  USING (assignment_status = 'active' AND is_current = true);

GRANT SELECT ON public.entity_image_assignments TO authenticated, anon;
GRANT ALL ON public.entity_image_assignments TO service_role;
