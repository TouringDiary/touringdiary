-- Wikimedia non entra in verify_ai_image.
-- La coda AI resta per immagini AI e foto reali non Wikimedia.

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
  v_origin text;
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
  v_absent_codes text;
  v_array_idx integer := 0;
  v_step_row record;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Non autorizzato.';
  END IF;

  SELECT asset_status, origin_type INTO v_current, v_origin
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

  IF v_origin = 'wikimedia' THEN
    SELECT string_agg(required.step_code, ', ' ORDER BY required.step_code)
    INTO v_absent_codes
    FROM public.canonical_image_verification_step_codes() AS required(step_code)
    WHERE NOT (required.step_code = ANY (v_seen_codes));

    IF v_absent_codes IS NOT NULL THEN
      RAISE EXCEPTION 'Verifica Wikimedia incompleta. Controlli assenti: %', v_absent_codes;
    END IF;
  END IF;

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

  IF v_origin IS DISTINCT FROM 'wikimedia'
     AND (p_mark_verify_queue OR v_overall IN ('blocked', 'doubt', 'unverified')) THEN
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
