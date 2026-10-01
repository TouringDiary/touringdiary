-- Toggle Wikimedia pubblico POI: solo public.pois.wikimedia_public_enabled.
-- Caller reale: client authenticated (anon key + JWT utente).
-- Nessun caller service_role. I default privilege di Production concedono EXECUTE
-- anche a anon e service_role: vanno revocati in modo esplicito.

CREATE OR REPLACE FUNCTION public.set_poi_wikimedia_public_enabled(
  p_poi_id text,
  p_city_id text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_poi_id text;
  v_city_id text;
  v_existing_city_id text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;
  IF NOT public.is_td_admin(v_uid) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF p_poi_id IS NULL OR btrim(p_poi_id) = '' THEN
    RAISE EXCEPTION 'p_poi_id obbligatorio.';
  END IF;

  IF p_city_id IS NULL OR btrim(p_city_id) = '' THEN
    RAISE EXCEPTION 'p_city_id obbligatorio.';
  END IF;

  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'p_enabled obbligatorio.';
  END IF;

  v_poi_id := btrim(p_poi_id);
  v_city_id := btrim(p_city_id);

  SELECT p.city_id
  INTO v_existing_city_id
  FROM public.pois p
  WHERE p.id = v_poi_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POI non trovato.';
  END IF;

  IF v_existing_city_id IS DISTINCT FROM v_city_id THEN
    RAISE EXCEPTION 'Il POI non appartiene alla città indicata.';
  END IF;

  UPDATE public.pois
  SET wikimedia_public_enabled = p_enabled
  WHERE id = v_poi_id
    AND city_id = v_city_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_poi_wikimedia_public_enabled(text, text, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.set_poi_wikimedia_public_enabled(text, text, boolean) TO authenticated;

COMMENT ON FUNCTION public.set_poi_wikimedia_public_enabled(text, text, boolean) IS
  'Aggiorna solo pois.wikimedia_public_enabled. Richiede auth.uid() e is_td_admin. EXECUTE solo a authenticated.';
