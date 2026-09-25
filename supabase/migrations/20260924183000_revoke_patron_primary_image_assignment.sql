-- POST-MF5 — revoca atomica primary Patrono (assignment + history)

CREATE OR REPLACE FUNCTION public.revoke_patron_primary_image_assignment(p_city_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text;
  v_row public.entity_image_assignments%ROWTYPE;
  v_active_primary_count integer;
BEGIN
  IF NOT public.is_service_role() THEN
    IF auth.uid() IS NULL OR NOT public.is_td_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  v_city_id := NULLIF(trim(p_city_id), '');
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  SELECT count(*)
  INTO v_active_primary_count
  FROM public.entity_image_assignments eia
  WHERE eia.entity_type = 'patron'
    AND eia.entity_id = v_city_id
    AND eia.city_id = v_city_id
    AND eia.assignment_role = 'primary'
    AND eia.is_current = true
    AND eia.assignment_status = 'active';

  IF v_active_primary_count > 1 THEN
    RAISE EXCEPTION
      'Incoerenza dati: più di un assignment primary corrente attivo per Patrono (city_id=%).',
      v_city_id;
  END IF;

  FOR v_row IN
    SELECT eia.*
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = v_city_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
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
      'patron',
      v_city_id,
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
        'source', 'revoke_patron_primary_image_assignment',
        'reason', 'patron_primary_image_cleared'
      )
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_patron_primary_image_assignment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_patron_primary_image_assignment(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_patron_primary_image_assignment(text) TO service_role;
