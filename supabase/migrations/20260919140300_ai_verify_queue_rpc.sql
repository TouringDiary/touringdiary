-- MF3 — RPC transizioni asset, coda VERIFICARE IMMAGINE AI, conteggi badge

-- ---------------------------------------------------------------------------
-- Transizioni governate asset_status
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.transition_media_asset_status(uuid, public.image_asset_status, text);

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
  v_uid := auth.uid();
  IF NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

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

  RETURN p_target_status;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_media_asset_status(uuid, public.image_asset_status, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Conteggi badge — SOLO verify_ai_image
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ai_verify_queue_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_total bigint;
  v_by_entity jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  SELECT count(*) INTO v_total
  FROM public.media_assets ma
  WHERE ma.asset_status = 'verify_ai_image';

  SELECT COALESCE(jsonb_object_agg(entity_type, cnt), '{}'::jsonb)
  INTO v_by_entity
  FROM (
    SELECT eia.entity_type, count(DISTINCT ma.id) AS cnt
    FROM public.media_assets ma
    JOIN public.entity_image_assignments eia ON eia.media_asset_id = ma.id
    WHERE ma.asset_status = 'verify_ai_image'
      AND eia.is_current = true
    GROUP BY eia.entity_type
  ) s;

  RETURN jsonb_build_object(
    'total', v_total,
    'by_entity_type', v_by_entity
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_verify_queue_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_verify_queue_counts() TO authenticated;

-- ---------------------------------------------------------------------------
-- Lista coda verify — filtri RPC: entity_type, continent, nation, city_id.
-- admin_region / zone in output sono descrittivi (join cities), non filtri RPC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_ai_verify_queue(
  p_entity_type text DEFAULT NULL,
  p_continent text DEFAULT NULL,
  p_nation text DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  media_asset_id uuid,
  storage_bucket text,
  storage_path text,
  origin_type text,
  generated_by_ai boolean,
  is_placeholder boolean,
  asset_status public.image_asset_status,
  license_code text,
  source_url text,
  entity_type text,
  entity_id text,
  city_id uuid,
  city_name text,
  continent text,
  nation text,
  admin_region text,
  zone text,
  entity_label text,
  latest_run_id uuid,
  latest_ai_summary text,
  blocking_step_code text,
  current_assignments jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  RETURN QUERY
  WITH matching AS (
    SELECT
      ma.id AS media_asset_id,
      ma.storage_bucket,
      ma.storage_path,
      ma.origin_type,
      ma.generated_by_ai,
      ma.is_placeholder,
      ma.asset_status,
      ma.license_code,
      ma.source_url,
      eia.id AS assignment_id,
      eia.entity_type,
      eia.entity_id,
      eia.city_id,
      eia.updated_at AS assignment_updated_at,
      c.name AS city_name,
      c.continent,
      c.nation,
      c.admin_region,
      c.zone,
      CASE
        WHEN eia.entity_type = 'city_person' THEN cp.name
        WHEN eia.entity_type = 'poi' THEN p.name
        WHEN eia.entity_type = 'patron' THEN COALESCE(c.patron_details->>'name', 'Santo Patrono')
        ELSE eia.entity_type
      END AS entity_label
    FROM public.media_assets ma
    JOIN public.entity_image_assignments eia ON eia.media_asset_id = ma.id
    JOIN public.cities c ON c.id = eia.city_id
    LEFT JOIN public.city_people cp ON eia.entity_type = 'city_person' AND cp.id::text = eia.entity_id
    LEFT JOIN public.pois p ON eia.entity_type = 'poi' AND p.id = eia.entity_id
    WHERE ma.asset_status = 'verify_ai_image'
      AND eia.is_current = true
      AND (p_entity_type IS NULL OR eia.entity_type = p_entity_type)
      AND (p_continent IS NULL OR c.continent = p_continent)
      AND (p_nation IS NULL OR c.nation = p_nation)
      AND (p_city_id IS NULL OR c.id = p_city_id)
  ),
  assignment_agg AS (
    SELECT
      m.media_asset_id,
      jsonb_agg(
        jsonb_build_object(
          'assignment_id', m.assignment_id,
          'entity_type', m.entity_type,
          'entity_id', m.entity_id,
          'city_id', m.city_id,
          'city_name', m.city_name,
          'entity_label', m.entity_label,
          'continent', m.continent,
          'nation', m.nation
        )
        ORDER BY m.assignment_updated_at DESC
      ) AS current_assignments
    FROM matching m
    GROUP BY m.media_asset_id
  ),
  ranked_assignments AS (
    SELECT DISTINCT ON (m.media_asset_id)
      m.media_asset_id,
      m.storage_bucket,
      m.storage_path,
      m.origin_type,
      m.generated_by_ai,
      m.is_placeholder,
      m.asset_status,
      m.license_code,
      m.source_url,
      m.entity_type,
      m.entity_id,
      m.city_id,
      m.city_name,
      m.continent,
      m.nation,
      m.admin_region,
      m.zone,
      m.entity_label
    FROM matching m
    ORDER BY m.media_asset_id, m.assignment_updated_at DESC
  ),
  latest_runs AS (
    SELECT DISTINCT ON (ivr.media_asset_id)
      ivr.media_asset_id,
      ivr.id AS latest_run_id,
      ivr.ai_summary AS latest_ai_summary,
      ivr.blocking_step_code
    FROM public.image_verification_runs ivr
    ORDER BY ivr.media_asset_id, ivr.created_at DESC, ivr.id DESC
  )
  SELECT
    ra.media_asset_id,
    ra.storage_bucket,
    ra.storage_path,
    ra.origin_type,
    ra.generated_by_ai,
    ra.is_placeholder,
    ra.asset_status,
    ra.license_code,
    ra.source_url,
    ra.entity_type,
    ra.entity_id,
    ra.city_id,
    ra.city_name,
    ra.continent,
    ra.nation,
    ra.admin_region,
    ra.zone,
    ra.entity_label,
    lr.latest_run_id,
    lr.latest_ai_summary,
    lr.blocking_step_code,
    COALESCE(aa.current_assignments, '[]'::jsonb) AS current_assignments
  FROM ranked_assignments ra
  LEFT JOIN latest_runs lr ON lr.media_asset_id = ra.media_asset_id
  LEFT JOIN assignment_agg aa ON aa.media_asset_id = ra.media_asset_id
  ORDER BY ra.city_name NULLS LAST, ra.entity_label NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.list_ai_verify_queue(text, text, text, uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_ai_verify_queue(text, text, text, uuid, integer, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- Vocabolario canonico step verifica (allineato a IMAGE_VERIFICATION_STEP_DEFINITIONS MF3)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_canonical_image_verification_step_code(p_code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(trim(p_code), '') IN (
    'file_identity',
    'source_provenance',
    'source_trust',
    'license_declared',
    'license_version',
    'license_url',
    'attribution_complete',
    'copyright_notice',
    'usage_rights_td',
    'personality_rights',
    'privacy_content',
    'trademark_logo',
    'third_party_works',
    'cultural_heritage',
    'contradictions',
    'platform_history'
  );
$$;

-- ---------------------------------------------------------------------------
-- Vocabolario canonico outcome step (enum image_verification_step_outcome)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_canonical_image_verification_step_outcome(p_outcome text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(trim(p_outcome), '') IN (
    'verified',
    'unverified',
    'doubt',
    'blocked',
    'not_applicable'
  );
$$;

-- ---------------------------------------------------------------------------
-- step_order numerico valido (fallback = ordine array se assente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.parse_image_verification_step_order(
  p_step jsonb,
  p_fallback integer
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw text;
  v_parsed integer;
BEGIN
  v_raw := NULLIF(trim(p_step->>'step_order'), '');
  IF v_raw IS NULL THEN
    RETURN p_fallback;
  END IF;

  IF v_raw !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'step_order non valido: %', v_raw;
  END IF;

  IF length(v_raw) > 10 OR (v_raw::numeric > 2147483647) THEN
    RAISE EXCEPTION 'step_order non valido: %', v_raw;
  END IF;

  v_parsed := v_raw::integer;
  IF v_parsed < 0 THEN
    RAISE EXCEPTION 'step_order non valido: %', v_raw;
  END IF;

  RETURN v_parsed;
END;
$$;

-- ---------------------------------------------------------------------------
-- Registra run + step (pipeline) e imposta verify_ai_image se dubbio
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_image_verification_run(
  p_media_asset_id uuid,
  p_steps jsonb,
  p_ai_summary text DEFAULT NULL,
  p_mark_verify_queue boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_run_id uuid;
  v_current public.image_asset_status;
  v_blocking text;
  v_overall public.image_verification_step_outcome;
  v_step jsonb;
  v_outcome text;
  v_outcome_rank integer;
  v_worst_rank integer;
  v_step_order integer;
  v_worst_step_order integer;
  v_step_code text;
  v_seen_codes text[] := ARRAY[]::text[];
  v_array_idx integer := 0;
  v_step_row record;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  SELECT asset_status INTO v_current
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'media_asset non trovato.';
  END IF;

  IF p_steps IS NULL
    OR jsonb_typeof(p_steps) <> 'array'
    OR jsonb_array_length(p_steps) = 0 THEN
    RAISE EXCEPTION 'Verifica immagine: almeno uno step è obbligatorio.';
  END IF;

  v_blocking := NULL;
  v_overall := 'verified';
  v_worst_rank := 0;
  v_worst_step_order := NULL;

  FOR v_step IN SELECT value FROM jsonb_array_elements(p_steps) AS value
  LOOP
    v_array_idx := v_array_idx + 1;
    v_step_code := NULLIF(trim(v_step->>'step_code'), '');
    IF v_step_code IS NULL THEN
      RAISE EXCEPTION 'step_code verifica obbligatorio.';
    END IF;
    IF NOT public.is_canonical_image_verification_step_code(v_step_code) THEN
      RAISE EXCEPTION 'step_code verifica non valido: %', v_step_code;
    END IF;
    IF v_step_code = ANY (v_seen_codes) THEN
      RAISE EXCEPTION 'step_code duplicato nel run: %', v_step_code;
    END IF;
    v_seen_codes := array_append(v_seen_codes, v_step_code);

    PERFORM public.parse_image_verification_step_order(v_step, v_array_idx);

    v_outcome := NULLIF(trim(v_step->>'outcome'), '');
    IF v_outcome IS NULL THEN
      v_outcome := 'not_applicable';
    ELSIF NOT public.is_canonical_image_verification_step_outcome(v_outcome) THEN
      RAISE EXCEPTION 'outcome verifica non valido: %', v_step->>'outcome';
    END IF;
  END LOOP;

  FOR v_step_row IN
    SELECT e.value AS step, e.idx::integer AS arr_idx
    FROM jsonb_array_elements(p_steps) WITH ORDINALITY AS e(value, idx)
    ORDER BY
      public.parse_image_verification_step_order(e.value, e.idx::integer),
      e.value->>'step_code'
  LOOP
    v_step := v_step_row.step;
    v_step_code := v_step->>'step_code';
    v_outcome := NULLIF(trim(v_step->>'outcome'), '');
    IF v_outcome IS NULL THEN
      v_outcome := 'not_applicable';
    END IF;

    v_outcome_rank := CASE v_outcome
      WHEN 'blocked' THEN 4
      WHEN 'unverified' THEN 3
      WHEN 'doubt' THEN 2
      ELSE 0
    END;
    v_step_order := public.parse_image_verification_step_order(v_step, v_step_row.arr_idx);

    IF v_outcome_rank > 0
      AND (
        v_outcome_rank > v_worst_rank
        OR (
          v_outcome_rank = v_worst_rank
          AND (v_worst_step_order IS NULL OR v_step_order < v_worst_step_order)
        )
      ) THEN
      v_worst_rank := v_outcome_rank;
      v_worst_step_order := v_step_order;
      v_overall := v_outcome::public.image_verification_step_outcome;
      v_blocking := v_step_code;
    END IF;
  END LOOP;

  INSERT INTO public.image_verification_runs (
    media_asset_id,
    overall_outcome,
    blocking_step_code,
    ai_summary
  )
  VALUES (
    p_media_asset_id,
    v_overall,
    v_blocking,
    NULLIF(trim(p_ai_summary), '')
  )
  RETURNING id INTO v_run_id;

  FOR v_step_row IN
    SELECT e.value AS step, e.idx::integer AS arr_idx
    FROM jsonb_array_elements(p_steps) WITH ORDINALITY AS e(value, idx)
    ORDER BY
      public.parse_image_verification_step_order(e.value, e.idx::integer),
      e.value->>'step_code'
  LOOP
    v_step := v_step_row.step;
    v_step_code := NULLIF(trim(v_step->>'step_code'), '');
    v_outcome := NULLIF(trim(v_step->>'outcome'), '');
    IF v_outcome IS NULL THEN
      v_outcome := 'not_applicable';
    END IF;
    v_step_order := public.parse_image_verification_step_order(v_step, v_step_row.arr_idx);
    INSERT INTO public.image_verification_steps (
      run_id,
      step_code,
      step_order,
      outcome,
      ai_rationale,
      evidence_json
    )
    VALUES (
      v_run_id,
      v_step_code,
      v_step_order,
      v_outcome::public.image_verification_step_outcome,
      NULLIF(trim(v_step->>'ai_rationale'), ''),
      COALESCE(v_step->'evidence_json', '{}'::jsonb)
    );
  END LOOP;

  IF p_mark_verify_queue OR v_overall IN ('blocked', 'doubt', 'unverified') THEN
    IF v_current IN ('active', 'restored') THEN
      PERFORM public.transition_media_asset_status(
        p_media_asset_id,
        'verify_ai_image'::public.image_asset_status,
        NULL
      );
    END IF;
  END IF;

  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_image_verification_run(uuid, jsonb, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_image_verification_run(uuid, jsonb, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_image_verification_run(uuid, jsonb, text, boolean) TO service_role;

-- ---------------------------------------------------------------------------
-- Decisione Admin su coda verify (D82 override tracciato)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_ai_verify_admin_decision(
  p_media_asset_id uuid,
  p_decision text,
  p_admin_rationale text,
  p_override_step_code text DEFAULT NULL
)
RETURNS public.image_asset_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_target public.image_asset_status;
  v_run_id uuid;
  v_current public.image_asset_status;
  v_run_overall public.image_verification_step_outcome;
  v_run_blocking text;
  v_step_row record;
  v_step_outcome text;
  v_step_rank integer;
  v_run_worst_rank integer;
  v_run_worst_step_order integer;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  IF char_length(trim(COALESCE(p_admin_rationale, ''))) = 0 THEN
    RAISE EXCEPTION 'Motivazione Admin obbligatoria.';
  END IF;

  IF p_decision NOT IN ('approve', 'reject', 'override_approve') THEN
    RAISE EXCEPTION 'Decisione non valida: %', p_decision;
  END IF;

  IF p_decision = 'override_approve'
    AND char_length(trim(COALESCE(p_override_step_code, ''))) = 0 THEN
    RAISE EXCEPTION 'Override D82: step obbligatorio.';
  END IF;

  SELECT asset_status INTO v_current
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND OR v_current IS DISTINCT FROM 'verify_ai_image' THEN
    RAISE EXCEPTION 'Decisione coda verify consentita solo da verify_ai_image.';
  END IF;

  SELECT id INTO v_run_id
  FROM public.image_verification_runs
  WHERE media_asset_id = p_media_asset_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_run_id IS NULL THEN
    RAISE EXCEPTION 'Nessun verification run disponibile per la decisione Admin.';
  END IF;

  IF p_decision = 'override_approve' THEN
    IF NOT public.is_canonical_image_verification_step_code(p_override_step_code) THEN
      RAISE EXCEPTION 'Override D82: step_code non valido: %', p_override_step_code;
    END IF;
    UPDATE public.image_verification_steps
    SET
      admin_rationale = trim(p_admin_rationale),
      admin_override = true,
      outcome = 'verified',
      updated_at = now()
    WHERE run_id = v_run_id AND step_code = p_override_step_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Override D82: step non trovato nel run corrente: %', p_override_step_code;
    END IF;

    v_run_overall := 'verified';
    v_run_blocking := NULL;
    v_run_worst_rank := 0;
    v_run_worst_step_order := NULL;

    FOR v_step_row IN
      SELECT ivs.step_code, ivs.step_order, ivs.outcome::text AS outcome
      FROM public.image_verification_steps ivs
      WHERE ivs.run_id = v_run_id
      ORDER BY ivs.step_order ASC, ivs.step_code ASC
    LOOP
      v_step_outcome := v_step_row.outcome;
      v_step_rank := CASE v_step_outcome
        WHEN 'blocked' THEN 4
        WHEN 'unverified' THEN 3
        WHEN 'doubt' THEN 2
        ELSE 0
      END;

      IF v_step_rank > 0
        AND (
          v_step_rank > v_run_worst_rank
          OR (
            v_step_rank = v_run_worst_rank
            AND (v_run_worst_step_order IS NULL OR v_step_row.step_order < v_run_worst_step_order)
          )
        ) THEN
        v_run_worst_rank := v_step_rank;
        v_run_worst_step_order := v_step_row.step_order;
        v_run_overall := v_step_outcome::public.image_verification_step_outcome;
        v_run_blocking := v_step_row.step_code;
      END IF;
    END LOOP;

    UPDATE public.image_verification_runs
    SET
      overall_outcome = v_run_overall,
      blocking_step_code = v_run_blocking
    WHERE id = v_run_id;
  END IF;

  IF p_decision = 'reject' THEN
    v_target := 'removed'::public.image_asset_status;
  ELSIF p_decision = 'approve' THEN
    v_target := 'active'::public.image_asset_status;
  ELSIF p_decision = 'override_approve' THEN
    IF v_run_overall IN (
      'blocked'::public.image_verification_step_outcome,
      'unverified'::public.image_verification_step_outcome,
      'doubt'::public.image_verification_step_outcome
    ) THEN
      RAISE EXCEPTION
        'Override D82: la pipeline resta % — impossibile portare l''asset ad active.',
        v_run_overall;
    END IF;
    v_target := 'active'::public.image_asset_status;
  ELSE
    RAISE EXCEPTION 'Decisione Admin non valida: %', p_decision;
  END IF;

  RETURN public.transition_media_asset_status(
    p_media_asset_id,
    v_target,
    p_admin_rationale
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_ai_verify_admin_decision(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_ai_verify_admin_decision(uuid, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Dual-write: marca asset precedente SOSTITUITO (replaced) su sostituzione primary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_entity_image_assignment_dual_write(
  p_entity_type text,
  p_entity_id text,
  p_city_id text,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_assignment_role text DEFAULT 'primary',
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_url text;
  v_bucket text;
  v_path text;
  v_asset_id uuid;
  v_assignment_id uuid;
  v_current public.entity_image_assignments%ROWTYPE;
  v_published_at timestamptz;
  v_same_source_active_id uuid;
  v_origin_type text;
  v_canonical_url text;
  v_canonical_bucket text;
  v_canonical_path text;
  v_lock_key bigint;
  v_photo_status text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  IF p_entity_type NOT IN ('city_person', 'poi', 'patron', 'photo_submission') THEN
    RAISE EXCEPTION 'entity_type non valido: %', p_entity_type;
  END IF;

  v_role := COALESCE(NULLIF(trim(p_assignment_role), ''), 'primary');
  IF v_role NOT IN ('primary', 'gallery') THEN
    RAISE EXCEPTION 'assignment_role non valido: %', v_role;
  END IF;

  IF char_length(trim(p_entity_id)) = 0 OR char_length(trim(p_city_id)) = 0 THEN
    RAISE EXCEPTION 'entity_id e city_id obbligatori.';
  END IF;

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    RAISE EXCEPTION 'Immagine obbligatoria (URL o storage path).';
  END IF;

  IF p_entity_type = 'patron' AND p_entity_id IS DISTINCT FROM p_city_id THEN
    RAISE EXCEPTION 'Patrono: entity_id deve coincidere con city_id (D72).';
  END IF;

  IF p_entity_type = 'photo_submission' THEN
    SELECT
      NULLIF(trim(ps.image_url), ''),
      ps.status,
      COALESCE(ps.published_at, now())
    INTO v_canonical_url, v_photo_status, v_published_at
    FROM public.photo_submissions ps
    WHERE ps.id = p_entity_id::uuid
      AND ps.city_id = p_city_id::uuid
      AND (
        public.is_td_admin(v_uid)
        OR ps.user_id = v_uid
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'photo_submission non trovata, non appartiene alla città o non autorizzato.';
    END IF;

    IF v_photo_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'photo_submission non approvata: assignment non consentito.';
    END IF;

    IF v_canonical_url IS NULL THEN
      RAISE EXCEPTION 'photo_submission senza sorgente immagine canonica.';
    END IF;

    v_canonical_bucket := NULL;
    v_canonical_path := NULL;

    IF v_canonical_url ~ '/object/public/community-photos/' THEN
      v_canonical_bucket := 'community-photos';
      v_canonical_path := substring(v_canonical_url from '/object/public/community-photos/([^?]+)');
    ELSIF v_canonical_url ~ '/object/public/public-media/' THEN
      v_canonical_bucket := 'public-media';
      v_canonical_path := substring(v_canonical_url from '/object/public/public-media/([^?]+)');
    END IF;

    IF v_url IS NOT NULL AND v_url IS DISTINCT FROM v_canonical_url THEN
      RAISE EXCEPTION 'image_url non corrisponde alla sorgente canonica della photo_submission.';
    END IF;

    IF v_path IS NOT NULL THEN
      IF v_canonical_path IS NULL OR v_path IS DISTINCT FROM v_canonical_path THEN
        RAISE EXCEPTION 'storage_path non corrisponde alla sorgente canonica della photo_submission.';
      END IF;
      IF v_bucket IS NOT NULL
        AND v_canonical_bucket IS NOT NULL
        AND v_bucket IS DISTINCT FROM v_canonical_bucket THEN
        RAISE EXCEPTION 'storage_bucket non corrisponde alla sorgente canonica della photo_submission.';
      END IF;
    ELSIF v_url IS NULL THEN
      RAISE EXCEPTION 'Sorgente immagine assente per photo_submission.';
    END IF;

    v_url := v_canonical_url;
    v_bucket := COALESCE(v_canonical_bucket, v_bucket);
    v_path := COALESCE(v_canonical_path, v_path);

  ELSIF p_entity_type = 'city_person' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per city_person.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.city_people cp
      WHERE cp.id = p_entity_id::uuid
        AND cp.city_id = p_city_id::uuid
    ) THEN
      RAISE EXCEPTION 'city_person non trovato per city_id/entity_id.';
    END IF;

    SELECT CASE
      WHEN cp.status = 'published' THEN now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.city_people cp
    WHERE cp.id = p_entity_id::uuid
      AND cp.city_id = p_city_id::uuid;

  ELSIF p_entity_type = 'poi' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per poi.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.pois p
      WHERE p.id = p_entity_id
        AND p.city_id = p_city_id::uuid
    ) THEN
      RAISE EXCEPTION 'poi non trovato per city_id/entity_id.';
    END IF;

    SELECT CASE
      WHEN COALESCE(p.status, 'published') = 'published' THEN now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.pois p
    WHERE p.id = p_entity_id
      AND p.city_id = p_city_id::uuid;

  ELSIF p_entity_type = 'patron' THEN
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Non autorizzato al dual-write per patron.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.cities c
      WHERE c.id = p_city_id::uuid
    ) THEN
      RAISE EXCEPTION 'Città Patrono non trovata.';
    END IF;

    SELECT CASE
      WHEN COALESCE(c.patron_editorial_status, 'published') = 'published' THEN now()
      ELSE NULL
    END
    INTO v_published_at
    FROM public.cities c
    WHERE c.id = p_city_id::uuid;
  END IF;

  v_lock_key := hashtextextended(
    p_entity_type || E'\x1f' || p_entity_id || E'\x1f' || p_city_id || E'\x1f' || v_role,
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

  IF p_entity_type = 'photo_submission' THEN
    v_origin_type := 'community';
  ELSE
    v_origin_type := public.normalize_canonical_media_origin_type(
      COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
    );
  END IF;

  v_asset_id := public.ensure_media_asset_from_source(
    v_url,
    v_bucket,
    v_path,
    v_origin_type
  );

  SELECT eia.id
  INTO v_same_source_active_id
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = p_entity_type
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id::uuid
    AND eia.assignment_role = v_role
    AND eia.is_current = true
    AND eia.assignment_status = 'active'
    AND (
      eia.media_asset_id = v_asset_id
      OR (
        v_path IS NOT NULL
        AND eia.source_storage_path IS NOT NULL
        AND eia.source_storage_path = v_path
      )
      OR (
        v_path IS NULL
        AND v_url IS NOT NULL
        AND eia.source_image_url IS NOT NULL
        AND eia.source_image_url = v_url
      )
    )
  LIMIT 1
  FOR UPDATE;

  IF v_same_source_active_id IS NOT NULL THEN
    RETURN v_same_source_active_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = p_entity_type
      AND eia.entity_id = p_entity_id
      AND eia.city_id = p_city_id::uuid
      AND eia.assignment_role = v_role
      AND eia.assignment_status IN ('suspended', 'removed')
      AND (
        eia.media_asset_id = v_asset_id
        OR (
          v_path IS NOT NULL
          AND eia.source_storage_path IS NOT NULL
          AND eia.source_storage_path = v_path
        )
        OR (
          v_path IS NULL
          AND v_url IS NOT NULL
          AND eia.source_image_url IS NOT NULL
          AND eia.source_image_url = v_url
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Dual-write: associazione sospesa o rimossa per la stessa sorgente; rematerializzazione non consentita.';
  END IF;

  IF v_role = 'gallery' THEN
    INSERT INTO public.entity_image_assignments (
      media_asset_id,
      entity_type,
      entity_id,
      city_id,
      assignment_role,
      assignment_status,
      is_current,
      source_image_url,
      source_storage_bucket,
      source_storage_path,
      first_published_at,
      published_at
    )
    VALUES (
      v_asset_id,
      p_entity_type,
      p_entity_id,
      p_city_id::uuid,
      'gallery',
      'active',
      true,
      v_url,
      v_bucket,
      v_path,
      v_published_at,
      v_published_at
    )
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
  END IF;

  SELECT *
  INTO v_current
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = p_entity_type
    AND eia.entity_id = p_entity_id
    AND eia.city_id = p_city_id::uuid
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.entity_image_assignments
    SET
      is_current = false,
      assignment_status = CASE
        WHEN v_current.assignment_status = 'active' THEN 'replaced'
        ELSE v_current.assignment_status
      END,
      updated_at = now()
    WHERE id = v_current.id;

    -- MF3 — SOSTITUITO globale solo se nessun altro assignment corrente attivo usa l'asset
    IF v_current.media_asset_id IS NOT NULL AND v_current.media_asset_id <> v_asset_id THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.entity_image_assignments eia
        WHERE eia.media_asset_id = v_current.media_asset_id
          AND eia.is_current = true
          AND eia.assignment_status = 'active'
      ) THEN
        PERFORM public.transition_media_asset_status(
          v_current.media_asset_id,
          'replaced'::public.image_asset_status,
          NULL
        );
      END IF;
    END IF;

    INSERT INTO public.entity_image_assignments (
      media_asset_id,
      entity_type,
      entity_id,
      city_id,
      assignment_role,
      assignment_status,
      is_current,
      source_image_url,
      source_storage_bucket,
      source_storage_path,
      first_published_at,
      published_at
    )
    VALUES (
      v_asset_id,
      p_entity_type,
      p_entity_id,
      p_city_id::uuid,
      'primary',
      'active',
      true,
      v_url,
      v_bucket,
      v_path,
      v_published_at,
      v_published_at
    )
    RETURNING id INTO v_assignment_id;

    IF v_current.assignment_status = 'active' THEN
      UPDATE public.entity_image_assignments
      SET replaced_by_assignment_id = v_assignment_id
      WHERE id = v_current.id;
    END IF;

    RETURN v_assignment_id;
  END IF;

  INSERT INTO public.entity_image_assignments (
    media_asset_id,
    entity_type,
    entity_id,
    city_id,
    assignment_role,
    assignment_status,
    is_current,
    source_image_url,
    source_storage_bucket,
    source_storage_path,
    first_published_at,
    published_at
  )
  VALUES (
    v_asset_id,
    p_entity_type,
    p_entity_id,
    p_city_id::uuid,
    'primary',
    'active',
    true,
    v_url,
    v_bucket,
    v_path,
    v_published_at,
    v_published_at
  )
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_entity_image_assignment_dual_write(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_entity_image_assignment_dual_write(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) TO authenticated;
