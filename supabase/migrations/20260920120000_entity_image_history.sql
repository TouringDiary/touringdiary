-- MF4 — Storico immagini append-only (D84, §42.6)
-- Ownership (solo questo file): archived_at, entity_image_history, append-only, trusted/admin writers,
-- transition_media_asset_status (+ history), normalize_canonical_media_origin_type.
-- upsert_entity_image_assignment_dual_write → 20260920120300.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

COMMENT ON COLUMN public.media_assets.archived_at IS
  'MF4 — marca temporale archivio sicuro (soft); non implica cancellazione Storage né asset_status=removed.';

CREATE TABLE IF NOT EXISTS public.entity_image_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (
    event_type IN (
      'assignment_created',
      'assignment_replaced',
      'assignment_status_changed',
      'asset_status_changed',
      'asset_archived',
      'wikimedia_import',
      'admin_note'
    )
  ),
  media_asset_id uuid REFERENCES public.media_assets (id) ON DELETE RESTRICT,
  assignment_id uuid REFERENCES public.entity_image_assignments (id) ON DELETE RESTRICT,
  entity_type text,
  entity_id text,
  city_id text REFERENCES public.cities (id) ON DELETE SET NULL,
  previous_assignment_status text,
  new_assignment_status text,
  previous_asset_status public.image_asset_status,
  new_asset_status public.image_asset_status,
  replaced_by_assignment_id uuid REFERENCES public.entity_image_assignments (id) ON DELETE RESTRICT,
  actor_user_id uuid,
  ai_rationale text,
  admin_rationale text,
  admin_override boolean NOT NULL DEFAULT false,
  geo_continent text,
  geo_nation text,
  geo_admin_region text,
  geo_zone text,
  geo_city_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Installazioni parziali MF4: se le FK erano ON DELETE SET NULL (pg_constraint.confdeltype = n), riallinea a RESTRICT (D76).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'entity_image_history'
      AND c.conname = 'entity_image_history_media_asset_id_fkey'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE public.entity_image_history
      DROP CONSTRAINT entity_image_history_media_asset_id_fkey;
    ALTER TABLE public.entity_image_history
      ADD CONSTRAINT entity_image_history_media_asset_id_fkey
      FOREIGN KEY (media_asset_id) REFERENCES public.media_assets (id) ON DELETE RESTRICT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'entity_image_history'
      AND c.conname = 'entity_image_history_assignment_id_fkey'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE public.entity_image_history
      DROP CONSTRAINT entity_image_history_assignment_id_fkey;
    ALTER TABLE public.entity_image_history
      ADD CONSTRAINT entity_image_history_assignment_id_fkey
      FOREIGN KEY (assignment_id) REFERENCES public.entity_image_assignments (id) ON DELETE RESTRICT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'entity_image_history'
      AND c.conname = 'entity_image_history_replaced_by_assignment_id_fkey'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE public.entity_image_history
      DROP CONSTRAINT entity_image_history_replaced_by_assignment_id_fkey;
    ALTER TABLE public.entity_image_history
      ADD CONSTRAINT entity_image_history_replaced_by_assignment_id_fkey
      FOREIGN KEY (replaced_by_assignment_id) REFERENCES public.entity_image_assignments (id) ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS entity_image_history_media_asset_created_idx
  ON public.entity_image_history (media_asset_id, created_at DESC);

CREATE INDEX IF NOT EXISTS entity_image_history_entity_created_idx
  ON public.entity_image_history (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS entity_image_history_assignment_created_idx
  ON public.entity_image_history (assignment_id, created_at DESC);

COMMENT ON TABLE public.entity_image_history IS
  'MF4 — audit trail append-only (D84/D76). FK RESTRICT su asset/assignment; geo snapshot su colonne denormalizzate se city rimossa.';

-- ---------------------------------------------------------------------------
-- Append-only DB-level (UPDATE/DELETE/TRUNCATE)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.entity_image_history_deny_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'entity_image_history è append-only: UPDATE/DELETE non consentiti.';
END;
$$;

CREATE OR REPLACE FUNCTION public.entity_image_history_deny_truncate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'entity_image_history è append-only: TRUNCATE non consentito.';
END;
$$;

DROP TRIGGER IF EXISTS entity_image_history_append_only ON public.entity_image_history;
CREATE TRIGGER entity_image_history_append_only
  BEFORE UPDATE OR DELETE ON public.entity_image_history
  FOR EACH ROW
  EXECUTE FUNCTION public.entity_image_history_deny_mutation();

DROP TRIGGER IF EXISTS entity_image_history_deny_truncate ON public.entity_image_history;
CREATE TRIGGER entity_image_history_deny_truncate
  BEFORE TRUNCATE ON public.entity_image_history
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.entity_image_history_deny_truncate();

ALTER TABLE public.entity_image_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_image_history_admin_read ON public.entity_image_history;
CREATE POLICY entity_image_history_admin_read ON public.entity_image_history
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

REVOKE ALL ON TABLE public.entity_image_history FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.entity_image_history FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.entity_image_history FROM service_role;
GRANT SELECT ON TABLE public.entity_image_history TO authenticated;
GRANT SELECT ON TABLE public.entity_image_history TO service_role;

-- ---------------------------------------------------------------------------
-- Inserimento trusted — solo RPC SECURITY DEFINER (nessun GRANT EXECUTE client)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.append_entity_image_history_trusted(
  p_event_type text,
  p_media_asset_id uuid DEFAULT NULL,
  p_assignment_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_city_id text DEFAULT NULL,
  p_previous_assignment_status text DEFAULT NULL,
  p_new_assignment_status text DEFAULT NULL,
  p_previous_asset_status public.image_asset_status DEFAULT NULL,
  p_new_asset_status public.image_asset_status DEFAULT NULL,
  p_replaced_by_assignment_id uuid DEFAULT NULL,
  p_ai_rationale text DEFAULT NULL,
  p_admin_rationale text DEFAULT NULL,
  p_admin_override boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_actor uuid;
  v_city public.cities%ROWTYPE;
BEGIN
  IF p_event_type IS NULL
    OR p_event_type NOT IN (
      'assignment_created',
      'assignment_replaced',
      'assignment_status_changed',
      'asset_status_changed',
      'asset_archived',
      'wikimedia_import',
      'admin_note'
    ) THEN
    RAISE EXCEPTION 'event_type history non valido: %', p_event_type;
  END IF;

  v_actor := auth.uid();

  IF p_city_id IS NOT NULL THEN
    SELECT * INTO v_city FROM public.cities c WHERE c.id = p_city_id;
  END IF;

  INSERT INTO public.entity_image_history (
    event_type,
    media_asset_id,
    assignment_id,
    entity_type,
    entity_id,
    city_id,
    previous_assignment_status,
    new_assignment_status,
    previous_asset_status,
    new_asset_status,
    replaced_by_assignment_id,
    actor_user_id,
    ai_rationale,
    admin_rationale,
    admin_override,
    geo_continent,
    geo_nation,
    geo_admin_region,
    geo_zone,
    geo_city_name,
    metadata
  )
  VALUES (
    p_event_type,
    p_media_asset_id,
    p_assignment_id,
    NULLIF(trim(p_entity_type), ''),
    NULLIF(trim(p_entity_id), ''),
    p_city_id,
    NULLIF(trim(p_previous_assignment_status), ''),
    NULLIF(trim(p_new_assignment_status), ''),
    p_previous_asset_status,
    p_new_asset_status,
    p_replaced_by_assignment_id,
    v_actor,
    NULLIF(trim(p_ai_rationale), ''),
    NULLIF(trim(p_admin_rationale), ''),
    COALESCE(p_admin_override, false),
    v_city.continent,
    v_city.nation,
    v_city.admin_region,
    v_city.zone,
    v_city.name,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_entity_image_history_trusted(
  text, uuid, uuid, text, text, text, text, text,
  public.image_asset_status, public.image_asset_status, uuid, text, text, boolean, jsonb
) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Entry point Admin / service_role (admin_note, import manuali)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.append_entity_image_history(
  p_event_type text,
  p_media_asset_id uuid DEFAULT NULL,
  p_assignment_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_city_id text DEFAULT NULL,
  p_previous_assignment_status text DEFAULT NULL,
  p_new_assignment_status text DEFAULT NULL,
  p_previous_asset_status public.image_asset_status DEFAULT NULL,
  p_new_asset_status public.image_asset_status DEFAULT NULL,
  p_replaced_by_assignment_id uuid DEFAULT NULL,
  p_ai_rationale text DEFAULT NULL,
  p_admin_rationale text DEFAULT NULL,
  p_admin_override boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF public.is_service_role() THEN
    NULL;
  ELSE
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato a registrare entity_image_history.';
    END IF;
  END IF;

  IF p_event_type = 'admin_note' AND char_length(trim(COALESCE(p_admin_rationale, ''))) = 0 THEN
    RAISE EXCEPTION 'admin_note richiede admin_rationale.';
  END IF;

  RETURN public.append_entity_image_history_trusted(
    p_event_type,
    p_media_asset_id,
    p_assignment_id,
    p_entity_type,
    p_entity_id,
    p_city_id,
    p_previous_assignment_status,
    p_new_assignment_status,
    p_previous_asset_status,
    p_new_asset_status,
    p_replaced_by_assignment_id,
    p_ai_rationale,
    p_admin_rationale,
    p_admin_override,
    p_metadata
  );
END;
$$;

REVOKE ALL ON FUNCTION public.append_entity_image_history(
  text, uuid, uuid, text, text, text, text, text,
  public.image_asset_status, public.image_asset_status, uuid, text, text, boolean, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_entity_image_history(
  text, uuid, uuid, text, text, text, text, text,
  public.image_asset_status, public.image_asset_status, uuid, text, text, boolean, jsonb
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.append_entity_image_history(
  text, uuid, uuid, text, text, text, text, text,
  public.image_asset_status, public.image_asset_status, uuid, text, text, boolean, jsonb
) TO service_role;

-- ---------------------------------------------------------------------------
-- MF3 transition_media_asset_status + MF4 asset_status_changed (unico punto canonico)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_media_asset_status(
  p_media_asset_id uuid,
  p_target_status public.image_asset_status,
  p_admin_rationale text DEFAULT NULL
)
RETURNS public.image_asset_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_current public.image_asset_status;
  v_allowed boolean := false;
BEGIN
  IF public.is_service_role() THEN
    NULL;
  ELSE
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato.';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_media_asset_id::text, 0));

  SELECT asset_status INTO v_current
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'media_asset non trovato: %', p_media_asset_id;
  END IF;

  IF v_current = p_target_status THEN
    RETURN v_current;
  END IF;

  v_allowed := CASE
    WHEN v_current = 'active' AND p_target_status IN ('suspended', 'removed', 'replaced', 'verify_ai_image') THEN true
    WHEN v_current = 'suspended' AND p_target_status IN ('restored', 'removed', 'active') THEN true
    WHEN v_current = 'restored' AND p_target_status IN ('active', 'suspended', 'removed', 'verify_ai_image') THEN true
    WHEN v_current = 'verify_ai_image' AND p_target_status IN ('active', 'removed', 'suspended', 'replaced') THEN true
    WHEN v_current = 'replaced' AND p_target_status = 'removed' THEN true
    ELSE false
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transizione asset non consentita: % → %', v_current, p_target_status;
  END IF;

  UPDATE public.media_assets
  SET asset_status = p_target_status, updated_at = now()
  WHERE id = p_media_asset_id;

  PERFORM public.append_entity_image_history_trusted(
    'asset_status_changed',
    p_media_asset_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_current,
    p_target_status,
    NULL,
    NULL,
    NULLIF(trim(p_admin_rationale), ''),
    false,
    jsonb_build_object('source', 'transition_media_asset_status')
  );

  RETURN p_target_status;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Normalizzazione provenance dichiarabile (≠ verified_real: solo pipeline D79–D82 su media_assets).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_canonical_media_origin_type(p_origin_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw text;
BEGIN
  v_raw := lower(trim(COALESCE(p_origin_type, '')));

  IF v_raw = 'verified_real' THEN
    RAISE EXCEPTION
      'verified_real non è origin dichiarabile; impostare su media_assets dalla pipeline di verifica D79-D82.';
  END IF;

  IF v_raw = '' OR v_raw = 'admin_upload' THEN
    RETURN 'admin';
  END IF;

  IF v_raw = 'ai_generated' THEN
    RETURN 'ai';
  END IF;

  IF v_raw NOT IN ('admin', 'ai', 'wikimedia', 'community', 'placeholder') THEN
    RAISE EXCEPTION 'origin_type non valido: %', p_origin_type;
  END IF;

  RETURN v_raw;
END;
$$;

COMMENT ON FUNCTION public.normalize_canonical_media_origin_type(text) IS
  'Normalizza origin dichiarabile per ensure/dual-write. verified_real escluso: solo pipeline verifica su media_assets.';
