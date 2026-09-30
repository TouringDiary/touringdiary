-- Atomic POI vote adjustment (no client read-modify-write)

CREATE OR REPLACE FUNCTION public.adjust_poi_vote(
  p_poi_id text,
  p_delta integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_votes integer;
BEGIN
  IF p_poi_id IS NULL OR btrim(p_poi_id) = '' THEN
    RAISE EXCEPTION 'POI id obbligatorio.';
  END IF;

  IF p_delta IS NULL OR p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Delta voto non valido: consentiti solo +1 o -1.';
  END IF;

  UPDATE public.pois
  SET votes = GREATEST(0, COALESCE(votes, 0) + p_delta)
  WHERE id = btrim(p_poi_id)
  RETURNING votes INTO v_new_votes;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POI non trovato: %', p_poi_id;
  END IF;

  RETURN v_new_votes;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_poi_vote(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_poi_vote(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_poi_vote(text, integer) TO anon;

COMMENT ON FUNCTION public.adjust_poi_vote IS
  'Aggiunta/rimozione di un singolo voto POI: p_delta ammesso esclusivamente +1 o -1; UPDATE atomico con GREATEST(0, COALESCE(votes,0)+p_delta).';
