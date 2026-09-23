-- POST-MF5 / D90 — atomicità save city_people + primary image assignment (single transaction)

CREATE OR REPLACE FUNCTION public.save_city_person_with_image_assignment(
  p_person jsonb,
  p_specific_category_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_person_id uuid;
  v_city_id text;
  v_url text;
  v_bucket text;
  v_path text;
  v_person_payload jsonb;
  v_uid uuid;
  v_lock_key bigint;
  v_current_primary public.entity_image_assignments%ROWTYPE;
BEGIN
  v_uid := auth.uid();
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

  v_city_id := trim(p_person->>'city_id');

  v_person_payload := jsonb_set(p_person, '{image_url}', 'null'::jsonb, true);

  v_person_id := public.upsert_city_person_with_category_links(
    v_person_payload,
    COALESCE(p_specific_category_ids, ARRAY[]::uuid[])
  );

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    v_lock_key := hashtextextended(
      'city_person' || E'\x1f' || v_person_id::text || E'\x1f' || v_city_id || E'\x1f' || 'primary',
      0
    );
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT * INTO v_current_primary
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'city_person'
      AND eia.entity_id = v_person_id::text
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.entity_image_assignments
      SET
        assignment_status = 'removed',
        is_current = false,
        removed_at = now(),
        updated_at = now()
      WHERE id = v_current_primary.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_status_changed',
        v_current_primary.media_asset_id,
        v_current_primary.id,
        'city_person',
        v_person_id::text,
        v_city_id,
        'active',
        'removed',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        jsonb_build_object(
          'assignment_role', 'primary',
          'source', 'save_city_person_with_image_assignment',
          'reason', 'image_cleared_on_save'
        )
      );
    END IF;
  ELSE
    PERFORM public.upsert_entity_primary_image_assignment(
      v_person_id,
      v_city_id,
      v_url,
      v_bucket,
      v_path,
      COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
    );
  END IF;

  RETURN v_person_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_city_person_with_image_assignment(
  jsonb, uuid[], text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_city_person_with_image_assignment(
  jsonb, uuid[], text, text, text, text
) TO authenticated;

COMMENT ON FUNCTION public.save_city_person_with_image_assignment IS
  'POST-MF5 D90 — upsert city_people (image_url null) + primary assignment/revoke in una transazione.';
