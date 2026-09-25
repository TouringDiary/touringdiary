-- POST-MF5 D90 — merge POI: riconciliazione immagini + DELETE victim (transazione unica)
-- Origin merge: admin/admin_upload e ai/ai_generated sono alias governati per dati legacy (priorità merge).

CREATE OR REPLACE FUNCTION public.media_origin_primary_merge_priority(p_origin text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE lower(trim(COALESCE(p_origin, '')))
    WHEN 'admin' THEN 4
    WHEN 'admin_upload' THEN 4
    WHEN 'verified_real' THEN 3
    WHEN 'wikimedia' THEN 3
    WHEN 'community' THEN 2
    WHEN 'ai' THEN 1
    WHEN 'ai_generated' THEN 1
    WHEN 'placeholder' THEN 0
    ELSE 0
  END;
$$;

-- Coerente con normalize_canonical_media_origin_type (alias admin_upload/ai_generated; verified_real su asset esistenti).
CREATE OR REPLACE FUNCTION public.media_origin_is_merge_governed(p_origin text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT NULLIF(trim(COALESCE(p_origin, '')), '') IS NOT NULL
    AND lower(trim(p_origin)) IN (
      'admin',
      'admin_upload',
      'verified_real',
      'wikimedia',
      'community',
      'ai',
      'ai_generated',
      'placeholder'
    );
$$;

CREATE OR REPLACE FUNCTION public.reconcile_poi_image_assignments_for_merge(
  p_survivor_id text,
  p_survivor_city_id text,
  p_victim_id text,
  p_victim_city_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_survivor_priority integer := 0;
  v_victim_priority integer := 0;
  v_victim_primary public.entity_image_assignments%ROWTYPE;
  v_victim_origin text;
  v_victim_is_placeholder boolean;
  v_survivor_origin text;
  v_survivor_media_asset_id uuid;
  v_row public.entity_image_assignments%ROWTYPE;
  v_survivor_primary_count integer;
  v_survivor_current_primary_total integer;
  v_survivor_suspended_primary_count integer;
  v_survivor_bad_primary_count integer;
  v_victim_primary_count integer;
  v_victim_current_primary_total integer;
  v_victim_suspended_primary_count integer;
  v_post_transfer_verify_count integer;
  v_victim_suspended_primary public.entity_image_assignments%ROWTYPE;
  v_should_transfer boolean;
  v_deleted integer;
  v_victim_non_primary_count integer;
  v_victim_bad_current_count integer;
  v_survivor_usable boolean := false;
  v_victim_usable boolean := false;
BEGIN
  IF NOT public.is_service_role() THEN
    IF auth.uid() IS NULL OR NOT public.is_td_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF NULLIF(trim(p_survivor_id), '') IS NULL
    OR NULLIF(trim(p_victim_id), '') IS NULL
    OR NULLIF(trim(p_survivor_city_id), '') IS NULL
    OR NULLIF(trim(p_victim_city_id), '') IS NULL
  THEN
    RAISE EXCEPTION 'survivor/victim id e city_id obbligatori.';
  END IF;

  IF p_survivor_id = p_victim_id THEN
    RAISE EXCEPTION 'Merge POI: survivor e victim non possono coincidere.';
  END IF;

  IF p_survivor_city_id IS DISTINCT FROM p_victim_city_id THEN
    RAISE EXCEPTION
      'Merge POI intra-city richiesto: survivor city_id=% victim city_id=%.',
      p_survivor_city_id,
      p_victim_city_id;
  END IF;

  IF p_survivor_id <= p_victim_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = p_survivor_id AND p.city_id = p_survivor_city_id
    ) THEN
      RAISE EXCEPTION 'POI survivor non trovato.';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_survivor_id, 0));
    PERFORM 1 FROM public.pois p
    WHERE p.id = p_survivor_id AND p.city_id = p_survivor_city_id
    FOR UPDATE;

    IF NOT EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = p_victim_id AND p.city_id = p_victim_city_id
    ) THEN
      RAISE EXCEPTION 'POI victim non trovato.';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_victim_id, 0));
    PERFORM 1 FROM public.pois p
    WHERE p.id = p_victim_id AND p.city_id = p_victim_city_id
    FOR UPDATE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = p_victim_id AND p.city_id = p_victim_city_id
    ) THEN
      RAISE EXCEPTION 'POI victim non trovato.';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_victim_id, 0));
    PERFORM 1 FROM public.pois p
    WHERE p.id = p_victim_id AND p.city_id = p_victim_city_id
    FOR UPDATE;

    IF NOT EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = p_survivor_id AND p.city_id = p_survivor_city_id
    ) THEN
      RAISE EXCEPTION 'POI survivor non trovato.';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_survivor_id, 0));
    PERFORM 1 FROM public.pois p
    WHERE p.id = p_survivor_id AND p.city_id = p_survivor_city_id
    FOR UPDATE;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'reconcile_poi_image_assignments_for_merge'
        || E'\x1f' || p_survivor_id
        || E'\x1f' || p_victim_id,
      0
    )
  );

  SELECT count(*)
  INTO v_survivor_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_survivor_id
    AND eia.city_id = p_survivor_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF v_survivor_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo sul POI survivor (%).',
      p_survivor_id;
  END IF;

  SELECT count(*)
  INTO v_survivor_current_primary_total
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_survivor_id
    AND eia.city_id = p_survivor_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true;

  IF v_survivor_current_primary_total > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente sul POI survivor (%).',
      p_survivor_id;
  END IF;

  SELECT count(*)
  INTO v_survivor_suspended_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_survivor_id
    AND eia.city_id = p_survivor_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'suspended';

  IF v_survivor_suspended_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente sospeso sul POI survivor (%).',
      p_survivor_id;
  END IF;

  SELECT count(*)
  INTO v_survivor_bad_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_survivor_id
    AND eia.city_id = p_survivor_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status NOT IN ('active', 'suspended');

  IF v_survivor_bad_primary_count > 0 THEN
    RAISE EXCEPTION
      'POI survivor con primary corrente in stato non governato (%): risolvere prima del merge.',
      p_survivor_id;
  END IF;

  IF v_survivor_suspended_primary_count = 1 THEN
    RAISE EXCEPTION
      'Merge POI D90: survivor con primary corrente sospesa (%); risolvere prima del merge immagini.',
      p_survivor_id;
  END IF;

  SELECT count(*)
  INTO v_victim_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF v_victim_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo sul POI victim (%).',
      p_victim_id;
  END IF;

  SELECT count(*)
  INTO v_victim_current_primary_total
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true;

  IF v_victim_current_primary_total > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente sul POI victim (%).',
      p_victim_id;
  END IF;

  SELECT count(*)
  INTO v_victim_suspended_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'suspended';

  IF v_victim_suspended_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente sospeso sul POI victim (%).',
      p_victim_id;
  END IF;

  SELECT count(*)
  INTO v_victim_non_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.is_current = true
    AND eia.assignment_status = 'active'
    AND eia.assignment_role <> 'primary';

  IF v_victim_non_primary_count > 0 THEN
    RAISE EXCEPTION
      'POI victim con assignment attivi non-primary (%): merge D90 POI supporta solo assignment primary.',
      p_victim_id;
  END IF;

  SELECT count(*)
  INTO v_victim_bad_current_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.is_current = true
    AND eia.assignment_status NOT IN ('active', 'suspended');

  IF v_victim_bad_current_count > 0 THEN
    RAISE EXCEPTION
      'POI victim con assignment correnti in stato non governato (%): risolvere prima del merge.',
      p_victim_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = p_victim_id
      AND eia.city_id = p_victim_city_id
      AND eia.is_current = true
      AND eia.assignment_status = 'suspended'
      AND eia.assignment_role <> 'primary'
  ) THEN
    RAISE EXCEPTION
      'POI victim con assignment non-primary correnti sospesi (%): merge D90 POI supporta solo assignment primary.',
      p_victim_id;
  END IF;

  IF v_survivor_primary_count = 1 THEN
    SELECT eia.media_asset_id
    INTO v_survivor_media_asset_id
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = p_survivor_id
      AND eia.city_id = p_survivor_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active';

    IF v_survivor_media_asset_id IS NULL THEN
      RAISE EXCEPTION
        'POI survivor primary assignment senza media_asset_id (survivor=%).',
        p_survivor_id;
    END IF;

    SELECT ma.origin_type::text
    INTO v_survivor_origin
    FROM public.media_assets ma
    WHERE ma.id = v_survivor_media_asset_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'POI survivor primary referenzia media_asset inesistente (%).',
        v_survivor_media_asset_id;
    END IF;

    IF NOT public.media_origin_is_merge_governed(v_survivor_origin) THEN
      RAISE EXCEPTION
        'POI survivor primary: origin_type media_asset non governato o assente (%).',
        v_survivor_origin;
    END IF;

    v_survivor_priority := public.media_origin_primary_merge_priority(v_survivor_origin);
    v_survivor_usable := public.is_media_asset_publicly_usable(v_survivor_media_asset_id);
  END IF;

  SELECT eia.*
  INTO v_victim_primary
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'poi'
    AND eia.entity_id = p_victim_id
    AND eia.city_id = p_victim_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF FOUND THEN
    IF v_victim_primary.media_asset_id IS NULL THEN
      RAISE EXCEPTION
        'POI victim primary assignment senza media_asset_id (assignment=%).',
        v_victim_primary.id;
    END IF;

    SELECT ma.origin_type::text, COALESCE(ma.is_placeholder, false)
    INTO v_victim_origin, v_victim_is_placeholder
    FROM public.media_assets ma
    WHERE ma.id = v_victim_primary.media_asset_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'POI victim primary referenzia media_asset inesistente (%).',
        v_victim_primary.media_asset_id;
    END IF;

    IF NOT public.media_origin_is_merge_governed(v_victim_origin) THEN
      RAISE EXCEPTION
        'POI victim primary: origin_type media_asset non governato o assente (%).',
        v_victim_origin;
    END IF;

    v_victim_priority := public.media_origin_primary_merge_priority(v_victim_origin);
    v_victim_usable := public.is_media_asset_publicly_usable(v_victim_primary.media_asset_id);
    v_should_transfer := false;

    IF NOT v_victim_is_placeholder
      AND lower(trim(COALESCE(v_victim_origin, ''))) <> 'placeholder'
      AND v_victim_usable
    THEN
      IF v_survivor_primary_count = 0 THEN
        v_should_transfer := true;
      ELSIF v_survivor_primary_count = 1 THEN
        IF NOT v_survivor_usable THEN
          v_should_transfer := true;
        ELSIF v_victim_priority > v_survivor_priority THEN
          v_should_transfer := true;
        END IF;
      END IF;
    END IF;

    IF v_should_transfer THEN
      PERFORM public.upsert_poi_primary_image_assignment(
        p_survivor_id,
        p_survivor_city_id,
        v_victim_primary.source_image_url,
        v_victim_primary.source_storage_bucket,
        v_victim_primary.source_storage_path,
        v_victim_origin
      );

      SELECT count(*)
      INTO v_post_transfer_verify_count
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'poi'
        AND eia.entity_id = p_survivor_id
        AND eia.city_id = p_survivor_city_id
        AND eia.assignment_role = 'primary'
        AND eia.is_current = true
        AND eia.assignment_status = 'active'
        AND eia.media_asset_id = v_victim_primary.media_asset_id;

      IF v_post_transfer_verify_count <> 1 THEN
        RAISE EXCEPTION
          'Merge POI: survivor primary attivo atteso dopo transfer non verificato (survivor=%, media_asset_id=%).',
          p_survivor_id,
          v_victim_primary.media_asset_id;
      END IF;
    END IF;
  END IF;

  IF v_victim_suspended_primary_count = 1 THEN
    SELECT eia.*
    INTO v_victim_suspended_primary
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = p_victim_id
      AND eia.city_id = p_victim_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'suspended';

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Incoerenza dati: primary corrente sospesa victim attesa ma non trovata (%).',
        p_victim_id;
    END IF;

    IF v_victim_suspended_primary.media_asset_id IS NULL THEN
      RAISE EXCEPTION
        'POI victim primary sospesa senza media_asset_id (assignment=%).',
        v_victim_suspended_primary.id;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.media_assets ma
      WHERE ma.id = v_victim_suspended_primary.media_asset_id
    ) THEN
      RAISE EXCEPTION
        'POI victim primary sospesa referenzia media_asset inesistente (%).',
        v_victim_suspended_primary.media_asset_id;
    END IF;
  END IF;

  -- D90 POI: revoca primary correnti (active + suspended) prima del DELETE victim.
  FOR v_row IN
    SELECT eia.*
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = p_victim_id
      AND eia.city_id = p_victim_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status IN ('active', 'suspended')
    FOR UPDATE
  LOOP
    UPDATE public.entity_image_assignments
    SET
      assignment_status = 'removed',
      is_current = false,
      removed_at = now(),
      updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_status_changed',
      v_row.media_asset_id,
      v_row.id,
      'poi',
      p_victim_id,
      p_victim_city_id,
      v_row.assignment_status,
      'removed',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      jsonb_build_object(
        'assignment_role', v_row.assignment_role,
        'source', 'reconcile_poi_image_assignments_for_merge',
        'reason', 'poi_merged_deleted',
        'survivor_id', p_survivor_id
      )
    );
  END LOOP;

  DELETE FROM public.pois
  WHERE id = p_victim_id AND city_id = p_victim_city_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'DELETE POI victim fallito (id=%, city_id=%).', p_victim_id, p_victim_city_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.media_origin_primary_merge_priority(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.media_origin_primary_merge_priority(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_origin_primary_merge_priority(text) TO service_role;

REVOKE ALL ON FUNCTION public.media_origin_is_merge_governed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.media_origin_is_merge_governed(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_origin_is_merge_governed(text) TO service_role;

REVOKE ALL ON FUNCTION public.reconcile_poi_image_assignments_for_merge(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_poi_image_assignments_for_merge(text, text, text, text) TO service_role;
