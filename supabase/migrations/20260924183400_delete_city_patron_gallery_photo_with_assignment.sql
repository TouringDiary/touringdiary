-- POST-MF5 D90 — delete atomico riga city_patron_gallery + revoca assignment gallery (match deterministico)

CREATE OR REPLACE FUNCTION public.delete_city_patron_gallery_photo_with_assignment(
  p_gallery_photo_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_gallery public.city_patron_gallery%ROWTYPE;
  v_gallery_path text;
  v_gallery_url text;
  v_match_count integer := 0;
  v_assignment_id uuid;
  v_media_asset_id uuid;
  v_row public.entity_image_assignments%ROWTYPE;
BEGIN
  IF NOT public.is_service_role() AND NOT public.is_td_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permessi admin richiesti.';
  END IF;

  IF p_gallery_photo_id IS NULL THEN
    RAISE EXCEPTION 'gallery_photo_id obbligatorio.';
  END IF;

  SELECT * INTO v_gallery
  FROM public.city_patron_gallery g
  WHERE g.id = p_gallery_photo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_gallery_path := NULLIF(trim(v_gallery.storage_path), '');
  v_gallery_url := NULLIF(trim(v_gallery.image_url), '');

  FOR v_row IN
    SELECT eia.*
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'patron'
      AND eia.entity_id = v_gallery.city_id
      AND eia.city_id = v_gallery.city_id
      AND eia.assignment_role = 'gallery'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
      AND (
        (
          v_gallery_path IS NOT NULL
          AND NULLIF(trim(eia.source_storage_path), '') IS NOT NULL
          AND trim(eia.source_storage_path) = v_gallery_path
          AND NULLIF(trim(eia.source_storage_bucket), '') = 'public-media'
        )
        OR (
          v_gallery_path IS NULL
          AND v_gallery_url IS NOT NULL
          AND NULLIF(trim(eia.source_storage_path), '') IS NULL
          AND NULLIF(trim(eia.source_image_url), '') IS NOT NULL
          AND trim(eia.source_image_url) = v_gallery_url
        )
      )
    ORDER BY eia.id
    FOR UPDATE
  LOOP
    v_match_count := v_match_count + 1;
    IF v_match_count = 1 THEN
      v_assignment_id := v_row.id;
      v_media_asset_id := v_row.media_asset_id;
    END IF;
  END LOOP;

  IF v_match_count > 1 THEN
    RAISE EXCEPTION
      'Eliminazione gallery Patrono ambigua: % assignment attivi corrispondono alla foto % (city_id=%).',
      v_match_count,
      p_gallery_photo_id,
      v_gallery.city_id;
  END IF;

  IF v_match_count = 0 THEN
    IF v_gallery_path IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'patron'
        AND eia.entity_id = v_gallery.city_id
        AND eia.city_id = v_gallery.city_id
        AND eia.assignment_role = 'gallery'
        AND eia.is_current = true
        AND eia.assignment_status = 'active'
        AND NULLIF(trim(eia.source_storage_path), '') = v_gallery_path
    ) THEN
      RAISE EXCEPTION
        'Eliminazione gallery Patrono: assignment attivo con path coincidente ma bucket sorgente non canonico (public-media atteso) per foto % (city_id=%).',
        p_gallery_photo_id,
        v_gallery.city_id;
    END IF;

    IF v_gallery_path IS NULL
      AND v_gallery_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.entity_image_assignments eia
        WHERE eia.entity_type = 'patron'
          AND eia.entity_id = v_gallery.city_id
          AND eia.city_id = v_gallery.city_id
          AND eia.assignment_role = 'gallery'
          AND eia.is_current = true
          AND eia.assignment_status = 'active'
          AND NULLIF(trim(eia.source_image_url), '') = v_gallery_url
      )
    THEN
      RAISE EXCEPTION
        'Eliminazione gallery Patrono: assignment attivo con URL coincidente ma storage_path non allineato (URL-only atteso) per foto % (city_id=%).',
        p_gallery_photo_id,
        v_gallery.city_id;
    END IF;

    RAISE EXCEPTION
      'Eliminazione gallery Patrono: nessun assignment gallery attivo corrisponde alla foto % (city_id=%).',
      p_gallery_photo_id,
      v_gallery.city_id;
  END IF;

  PERFORM public.revoke_patron_gallery_image_assignment(v_assignment_id);

  DELETE FROM public.city_patron_gallery
  WHERE id = p_gallery_photo_id;

  RETURN v_media_asset_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_city_patron_gallery_photo_with_assignment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_city_patron_gallery_photo_with_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_city_patron_gallery_photo_with_assignment(uuid) TO service_role;

COMMENT ON FUNCTION public.delete_city_patron_gallery_photo_with_assignment IS
  'POST-MF5 D90 — revoca esattamente un assignment gallery Patrono (match bucket+path o URL-only, coerente upsert_patron_gallery_image_assignment) + DELETE city_patron_gallery; '
  '0 match fail-closed (distingue incoerenza sorgente vs assenza match); >1 match → eccezione; restituisce media_asset_id revocato per safe_archive client-side.';
