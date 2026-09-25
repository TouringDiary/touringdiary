-- POST-MF5 D90 — merge POI osservatorio atomico (reviews + suggestions + enrich + immagini + DELETE victim)

CREATE OR REPLACE FUNCTION public.merge_pois_observatory_atomic(
  p_survivor_id text,
  p_victim_id text,
  p_enrichment jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_survivor_city_id text;
  v_victim_city_id text;
  v_first_poi_id text;
  v_second_poi_id text;
  v_enrichment_price_level integer;
  v_price_level_text text;
  v_lock_dummy integer;
BEGIN
  IF NOT public.is_service_role() THEN
    IF auth.uid() IS NULL OR NOT public.is_td_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF NULLIF(trim(p_survivor_id), '') IS NULL OR NULLIF(trim(p_victim_id), '') IS NULL THEN
    RAISE EXCEPTION 'survivor_id e victim_id obbligatori.';
  END IF;

  IF p_survivor_id = p_victim_id THEN
    RAISE EXCEPTION 'Merge POI: survivor e victim non possono coincidere.';
  END IF;

  IF p_survivor_id <= p_victim_id THEN
    v_first_poi_id := p_survivor_id;
    v_second_poi_id := p_victim_id;
  ELSE
    v_first_poi_id := p_victim_id;
    v_second_poi_id := p_survivor_id;
  END IF;

  SELECT 1 INTO v_lock_dummy
  FROM public.pois p
  WHERE p.id = v_first_poi_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POI non trovato (lock ordine id): %.', v_first_poi_id;
  END IF;

  SELECT 1 INTO v_lock_dummy
  FROM public.pois p
  WHERE p.id = v_second_poi_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POI non trovato (lock ordine id): %.', v_second_poi_id;
  END IF;

  SELECT p.city_id INTO v_survivor_city_id
  FROM public.pois p
  WHERE p.id = p_survivor_id;

  SELECT p.city_id INTO v_victim_city_id
  FROM public.pois p
  WHERE p.id = p_victim_id;

  IF v_survivor_city_id IS DISTINCT FROM v_victim_city_id THEN
    RAISE EXCEPTION
      'Merge POI intra-city richiesto: survivor city_id=% victim city_id=%.',
      v_survivor_city_id,
      v_victim_city_id;
  END IF;

  IF p_enrichment IS NOT NULL AND p_enrichment ? 'price_level' THEN
    v_price_level_text := NULLIF(trim(p_enrichment->>'price_level'), '');
    IF v_price_level_text IS NOT NULL THEN
      BEGIN
        v_enrichment_price_level := v_price_level_text::integer;
      EXCEPTION
        WHEN invalid_text_representation THEN
          RAISE EXCEPTION
            'Enrichment price_level non valido (intero atteso): %',
            v_price_level_text;
      END;
      IF v_enrichment_price_level < 1 OR v_enrichment_price_level > 5 THEN
        RAISE EXCEPTION
          'Enrichment price_level fuori range consentito (1-5): %',
          v_enrichment_price_level;
      END IF;
    END IF;
  END IF;

  UPDATE public.reviews
  SET poi_id = p_survivor_id
  WHERE poi_id = p_victim_id;

  UPDATE public.suggestions
  SET poi_id = p_survivor_id
  WHERE poi_id = p_victim_id;

  IF p_enrichment IS NOT NULL AND p_enrichment <> '{}'::jsonb THEN
    UPDATE public.pois s
    SET
      description = COALESCE(s.description, NULLIF(trim(p_enrichment->>'description'), '')),
      address = COALESCE(s.address, NULLIF(trim(p_enrichment->>'address'), '')),
      visit_duration = COALESCE(s.visit_duration, NULLIF(trim(p_enrichment->>'visit_duration'), '')),
      price_level = CASE
        WHEN s.price_level IS NULL THEN COALESCE(v_enrichment_price_level, s.price_level)
        ELSE s.price_level
      END,
      -- Observatory buildSurvivorEnrichmentPayload: affiliate solo se merge cambia survivor e victim.affiliate non è vuoto.
      affiliate = CASE
        WHEN p_enrichment ? 'affiliate'
          AND jsonb_typeof(p_enrichment->'affiliate') = 'object'
          AND p_enrichment->'affiliate' <> '{}'::jsonb THEN p_enrichment->'affiliate'
        ELSE s.affiliate
      END,
      updated_at = now()
    WHERE s.id = p_survivor_id;
  END IF;

  PERFORM public.reconcile_poi_image_assignments_for_merge(
    p_survivor_id,
    v_survivor_city_id,
    p_victim_id,
    v_victim_city_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.merge_pois_observatory_atomic(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_pois_observatory_atomic(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_pois_observatory_atomic(text, text, jsonb) TO service_role;

COMMENT ON FUNCTION public.merge_pois_observatory_atomic IS
  'D90 merge duplicati POI: lock pois in ordine lexicographic id; reviews, suggestions, arricchimento survivor, reconcile_poi_image_assignments_for_merge (immagini + DELETE victim).';
