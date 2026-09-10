-- =============================================================================
-- Atomic upsert: city_people + replace city_person_category_links (single txn)
-- Pattern: promote_staging_poi_to_live / famous_person moderation RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_city_person_with_category_links(
  p_person jsonb,
  p_specific_category_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_person_id uuid;
  v_existing public.city_people%ROWTYPE;
  v_is_update boolean := false;
  v_city_id uuid;
  v_name text;
  v_bio text;
  v_full_bio text;
  v_image_url text;
  v_quote text;
  v_birth_year integer;
  v_birth_date date;
  v_is_living boolean;
  v_death_year integer;
  v_death_date date;
  v_lifespan_display text;
  v_famous_works text[];
  v_awards text[];
  v_private_life text;
  v_related_places jsonb;
  v_career_stats jsonb;
  v_status text;
  v_order_index integer;
BEGIN
  -- Auth: allineato al pattern promote_staging_poi_to_live / moderation RPCs
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF p_person IS NULL OR jsonb_typeof(p_person) <> 'object' THEN
    RAISE EXCEPTION 'Payload persona non valido.';
  END IF;

  IF p_person->>'city_id' IS NULL OR trim(p_person->>'city_id') = '' THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  IF p_person->>'name' IS NULL OR trim(p_person->>'name') = '' THEN
    RAISE EXCEPTION 'name obbligatorio.';
  END IF;

  v_city_id := trim(p_person->>'city_id')::uuid;
  v_name := trim(p_person->>'name');

  IF p_person ? 'id' AND NULLIF(trim(p_person->>'id'), '') IS NOT NULL THEN
    v_person_id := (p_person->>'id')::uuid;

    SELECT * INTO v_existing
    FROM public.city_people
    WHERE id = v_person_id
    FOR UPDATE;

    IF FOUND THEN
      v_is_update := true;
    END IF;
  ELSE
    v_person_id := gen_random_uuid();
  END IF;

  -- Campi sempre presenti nel payload saveCityPerson (PostgREST upsert)
  v_bio := CASE
    WHEN p_person ? 'bio' THEN NULLIF(trim(p_person->>'bio'), '')
    WHEN v_is_update THEN v_existing.bio
    ELSE NULL
  END;

  v_image_url := CASE
    WHEN p_person ? 'image_url' THEN NULLIF(trim(p_person->>'image_url'), '')
    WHEN v_is_update THEN v_existing.image_url
    ELSE NULL
  END;

  v_birth_year := CASE
    WHEN p_person ? 'birth_year' AND (p_person->>'birth_year') IS NOT NULL
      THEN (p_person->>'birth_year')::integer
    WHEN p_person ? 'birth_year' THEN NULL
    WHEN v_is_update THEN v_existing.birth_year
    ELSE NULL
  END;

  v_birth_date := CASE
    WHEN p_person ? 'birth_date' AND (p_person->>'birth_date') IS NOT NULL
      THEN (p_person->>'birth_date')::date
    WHEN p_person ? 'birth_date' THEN NULL
    WHEN v_is_update THEN v_existing.birth_date
    ELSE NULL
  END;

  IF p_person ? 'is_living' THEN
    v_is_living := COALESCE((p_person->>'is_living')::boolean, false);
  ELSIF v_is_update THEN
    v_is_living := v_existing.is_living;
  ELSE
    v_is_living := true;
  END IF;

  v_death_year := CASE
    WHEN p_person ? 'death_year' AND (p_person->>'death_year') IS NOT NULL
      THEN (p_person->>'death_year')::integer
    WHEN p_person ? 'death_year' THEN NULL
    WHEN v_is_update THEN v_existing.death_year
    ELSE NULL
  END;

  v_death_date := CASE
    WHEN p_person ? 'death_date' AND (p_person->>'death_date') IS NOT NULL
      THEN (p_person->>'death_date')::date
    WHEN p_person ? 'death_date' THEN NULL
    WHEN v_is_update THEN v_existing.death_date
    ELSE NULL
  END;

  v_lifespan_display := CASE
    WHEN p_person ? 'lifespan_display' THEN NULLIF(trim(p_person->>'lifespan_display'), '')
    WHEN v_is_update THEN v_existing.lifespan_display
    ELSE NULL
  END;

  v_status := CASE
    WHEN p_person ? 'status' THEN NULLIF(trim(p_person->>'status'), '')
    WHEN v_is_update THEN v_existing.status
    ELSE NULL
  END;

  v_order_index := CASE
    WHEN p_person ? 'order_index' AND (p_person->>'order_index') IS NOT NULL
      THEN (p_person->>'order_index')::integer
    WHEN p_person ? 'order_index' THEN NULL
    WHEN v_is_update THEN v_existing.order_index
    ELSE 0
  END;

  -- Campi opzionali: omessi nel JSON = non aggiornare (update) / NULL (insert)
  v_full_bio := CASE
    WHEN p_person ? 'full_bio' THEN NULLIF(trim(p_person->>'full_bio'), '')
    WHEN v_is_update THEN v_existing.full_bio
    ELSE NULL
  END;

  v_quote := CASE
    WHEN p_person ? 'quote' THEN NULLIF(trim(p_person->>'quote'), '')
    WHEN v_is_update THEN v_existing.quote
    ELSE NULL
  END;

  v_private_life := CASE
    WHEN p_person ? 'private_life' THEN NULLIF(trim(p_person->>'private_life'), '')
    WHEN v_is_update THEN v_existing.private_life
    ELSE NULL
  END;

  v_famous_works := CASE
    WHEN NOT p_person ? 'famous_works' THEN
      CASE WHEN v_is_update THEN v_existing.famous_works ELSE NULL END
    WHEN p_person->'famous_works' IS NULL OR jsonb_typeof(p_person->'famous_works') = 'null' THEN NULL
    ELSE ARRAY(SELECT jsonb_array_elements_text(p_person->'famous_works'))
  END;

  v_awards := CASE
    WHEN NOT p_person ? 'awards' THEN
      CASE WHEN v_is_update THEN v_existing.awards ELSE NULL END
    WHEN p_person->'awards' IS NULL OR jsonb_typeof(p_person->'awards') = 'null' THEN NULL
    ELSE ARRAY(SELECT jsonb_array_elements_text(p_person->'awards'))
  END;

  v_related_places := CASE
    WHEN NOT p_person ? 'related_places' THEN
      CASE WHEN v_is_update THEN v_existing.related_places ELSE NULL END
    WHEN p_person->'related_places' IS NULL OR jsonb_typeof(p_person->'related_places') = 'null' THEN NULL
    ELSE p_person->'related_places'
  END;

  v_career_stats := CASE
    WHEN NOT p_person ? 'career_stats' THEN
      CASE WHEN v_is_update THEN v_existing.career_stats ELSE NULL END
    WHEN p_person->'career_stats' IS NULL OR jsonb_typeof(p_person->'career_stats') = 'null' THEN NULL
    ELSE p_person->'career_stats'
  END;

  IF v_is_update THEN
    UPDATE public.city_people
    SET
      city_id = v_city_id,
      name = v_name,
      bio = v_bio,
      full_bio = v_full_bio,
      image_url = v_image_url,
      quote = v_quote,
      birth_year = v_birth_year,
      birth_date = v_birth_date,
      is_living = v_is_living,
      death_year = v_death_year,
      death_date = v_death_date,
      lifespan_display = v_lifespan_display,
      famous_works = v_famous_works,
      awards = v_awards,
      private_life = v_private_life,
      related_places = v_related_places,
      career_stats = v_career_stats,
      status = v_status,
      order_index = v_order_index
    WHERE id = v_person_id;
  ELSE
    INSERT INTO public.city_people (
      id,
      city_id,
      name,
      bio,
      full_bio,
      image_url,
      quote,
      birth_year,
      birth_date,
      is_living,
      death_year,
      death_date,
      lifespan_display,
      famous_works,
      awards,
      private_life,
      related_places,
      career_stats,
      status,
      order_index
    )
    VALUES (
      v_person_id,
      v_city_id,
      v_name,
      v_bio,
      v_full_bio,
      v_image_url,
      v_quote,
      v_birth_year,
      v_birth_date,
      v_is_living,
      v_death_year,
      v_death_date,
      v_lifespan_display,
      v_famous_works,
      v_awards,
      v_private_life,
      v_related_places,
      v_career_stats,
      v_status,
      v_order_index
    );
  END IF;

  -- Replace category links (semantica replacePersonCategoryLinks)
  DELETE FROM public.city_person_category_links
  WHERE person_id = v_person_id;

  INSERT INTO public.city_person_category_links (person_id, specific_category_id)
  SELECT v_person_id, deduped.cat_id
  FROM (
    SELECT DISTINCT unnest(COALESCE(p_specific_category_ids, ARRAY[]::uuid[])) AS cat_id
  ) AS deduped
  WHERE deduped.cat_id IS NOT NULL;

  RETURN v_person_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_city_person_with_category_links(jsonb, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_city_person_with_category_links(jsonb, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_city_person_with_category_links(jsonb, uuid[]) TO service_role;

COMMENT ON FUNCTION public.upsert_city_person_with_category_links(jsonb, uuid[]) IS
  'Atomically upserts city_people and replaces city_person_category_links for admin editorial save.';
