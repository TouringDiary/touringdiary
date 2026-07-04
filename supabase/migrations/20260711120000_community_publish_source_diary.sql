-- Community publish: source_diary_id traceability, duplicate guard, XP award (atomic RPC).

BEGIN;

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS source_diary_id uuid REFERENCES public.itineraries (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.itineraries.source_diary_id IS
  'Riferimento storico al diario personale da cui è stata creata la copia Community. Solo tracciabilità; nessun collegamento modificabile.';

CREATE UNIQUE INDEX IF NOT EXISTS itineraries_one_community_per_source
  ON public.itineraries (source_diary_id)
  WHERE type = 'community' AND source_diary_id IS NOT NULL;

-- Incrementa XP profilo (helper interno — non esporre ai client).
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + p_amount
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.add_user_xp(uuid, integer) IS
  'Helper interno per aggiornare XP profilo. Invocabile solo da funzioni SECURITY DEFINER del backend (es. publish_diary_to_community).';

REVOKE ALL ON FUNCTION public.add_user_xp(uuid, integer) FROM PUBLIC;
-- Nessun GRANT a authenticated: entry point pubblico unico = publish_diary_to_community.

-- Pubblicazione atomica: verifica proprietario, anti-duplicato, insert Community, XP.
CREATE OR REPLACE FUNCTION public.publish_diary_to_community(
  p_source_diary_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_source public.itineraries%ROWTYPE;
  v_xp_amount integer := 100;
  v_community_id uuid;
  v_new_xp integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF p_source_diary_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: source diary id required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_source
  FROM public.itineraries
  WHERE id = p_source_diary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_source.type IS DISTINCT FROM 'personal' THEN
    RAISE EXCEPTION 'INVALID_SOURCE: only personal diaries can be published' USING ERRCODE = '22023';
  END IF;

  IF v_source.user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN: not diary owner' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.itineraries
    WHERE source_diary_id = p_source_diary_id
      AND type = 'community'
  ) THEN
    RAISE EXCEPTION 'ALREADY_PUBLISHED' USING ERRCODE = '23505';
  END IF;

  SELECT COALESCE(xp_amount, 100) INTO v_xp_amount
  FROM public.xp_actions
  WHERE action_key = 'publish_itinerary'
  LIMIT 1;

  IF v_xp_amount IS NULL OR v_xp_amount <= 0 THEN
    v_xp_amount := 100;
  END IF;

  INSERT INTO public.itineraries (
    user_id,
    title,
    description,
    duration_days,
    cover_image,
    tags,
    difficulty,
    type,
    status,
    author_name,
    rating,
    votes,
    continent,
    nation,
    region,
    zone,
    main_city,
    items_json,
    source_diary_id,
    created_at,
    updated_at
  )
  SELECT
    v_user_id,
    COALESCE(NULLIF(trim(v_source.title), ''), 'Itinerario senza nome'),
    COALESCE(v_source.description, 'Itinerario Community'),
    COALESCE(v_source.duration_days, 1),
    COALESCE(
      NULLIF(trim(v_source.cover_image), ''),
      ''
    ),
    COALESCE(v_source.tags, ARRAY['Community']::text[]),
    COALESCE(v_source.difficulty, 'Moderato'),
    'community',
    'published',
    (SELECT name FROM public.profiles WHERE id = v_user_id),
    0,
    0,
    COALESCE(v_source.continent, 'Europa'),
    COALESCE(v_source.nation, 'Italia'),
    COALESCE(v_source.region, 'Campania'),
    COALESCE(v_source.zone, 'Campania'),
    COALESCE(v_source.main_city, 'Campania'),
    v_source.items_json,
    p_source_diary_id,
    now(),
    now()
  RETURNING id INTO v_community_id;

  PERFORM public.add_user_xp(v_user_id, v_xp_amount);

  SELECT COALESCE(xp, 0) INTO v_new_xp
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'community_id', v_community_id,
    'xp_awarded', v_xp_amount,
    'new_xp', v_new_xp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_diary_to_community(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_diary_to_community(uuid) TO authenticated;

-- Regola XP configurabile da admin (fallback 100 in RPC se assente).
INSERT INTO public.xp_actions (action_key, label, xp_amount, icon, description)
VALUES (
  'publish_itinerary',
  'Pubblica itinerario in Community',
  100,
  '🌍',
  'XP assegnati alla prima pubblicazione di un diario in Community'
)
ON CONFLICT (action_key) DO NOTHING;

COMMIT;
