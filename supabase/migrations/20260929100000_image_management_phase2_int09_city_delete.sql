-- Fase 2 INT-09 — FK CONSERVA, soft-delete cities, RPC atomica admin_all
-- Verifica DB remoto 2026-09-29: cities.id = text; CASCADE su content_reports / entity_image_assignments / city_patron_gallery.
--
-- PREREQUISITI MIGRATION — devono risultare già applicate sul DB target prima di questa migration:
--   20260916130000_entity_image_assignments.sql
--   20260916130100_content_reports.sql
--   20260920120000_entity_image_history.sql          → append_entity_image_history_trusted
--   20260923153000_poi_d90_save_with_image_assignment.sql → delete_poi_with_image_cleanup(text)
--   20260924170000_delete_city_person_with_image_cleanup.sql → delete_city_person_with_image_cleanup(uuid)
--   20260924183000_revoke_patron_primary_image_assignment.sql
--   20260924183400_delete_city_patron_gallery_photo_with_assignment.sql
--   20260714180000_sponsor_phase4_contracts_shop_city.sql → handle_city_deleted_for_sponsors(text)
-- Probe linked 2026-09-29: tutte le RPC sopra PRESENTI (Person D90 non assente sul DB target).

-- ---------------------------------------------------------------------------
-- A. Soft-delete marker (idempotente)
-- ---------------------------------------------------------------------------
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS cities_deleted_at_idx ON public.cities (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- B. FK — CASCADE → RESTRICT / SET NULL (no DROP CASCADE su tabelle)
-- ---------------------------------------------------------------------------

-- content_reports: mai DELETE report; scollega city_id su DELETE cities (hard path)
ALTER TABLE public.content_reports
  ALTER COLUMN city_id DROP NOT NULL;

ALTER TABLE public.content_reports
  DROP CONSTRAINT IF EXISTS content_reports_city_id_fkey;

ALTER TABLE public.content_reports
  ADD CONSTRAINT content_reports_city_id_fkey
  FOREIGN KEY (city_id) REFERENCES public.cities (id) ON DELETE SET NULL;

-- entity_image_assignments: CONSERVA — vietato CASCADE implicito su DELETE cities
ALTER TABLE public.entity_image_assignments
  DROP CONSTRAINT IF EXISTS entity_image_assignments_city_id_fkey;

ALTER TABLE public.entity_image_assignments
  ADD CONSTRAINT entity_image_assignments_city_id_fkey
  FOREIGN KEY (city_id) REFERENCES public.cities (id) ON DELETE RESTRICT;

-- city_patron_gallery: revoca D90 esplicita in RPC; no CASCADE su cities
ALTER TABLE public.city_patron_gallery
  DROP CONSTRAINT IF EXISTS city_patron_gallery_city_id_fkey;

ALTER TABLE public.city_patron_gallery
  ADD CONSTRAINT city_patron_gallery_city_id_fkey
  FOREIGN KEY (city_id) REFERENCES public.cities (id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- C. Guard admin_all (INT-09 — nessun altro caller nel repo oltre a questa migration)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_td_admin_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN;
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin_all'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: admin_all richiesto per eliminazione città.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_td_admin_all() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_td_admin_all() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_td_admin_all() TO service_role;

-- ---------------------------------------------------------------------------
-- D. Validazione p_options (keepUserPhotos, keepPOIs, keepPeople — soli flag UI)
-- Nota firma RPC: cities.id è text nel DB reale (non uuid). p_admin_role non è
-- parametro RPC: il ruolo è verificato via assert_td_admin_all() + auth.uid().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.int09_parse_city_delete_options(p_options jsonb)
RETURNS TABLE (
  keep_user_photos boolean,
  keep_pois boolean,
  keep_people boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_opts jsonb := COALESCE(p_options, '{}'::jsonb);
  v_key text;
BEGIN
  IF jsonb_typeof(v_opts) <> 'object' THEN
    RAISE EXCEPTION 'p_options deve essere un oggetto JSON.';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(v_opts)
  LOOP
    IF v_key NOT IN ('keepUserPhotos', 'keepPOIs', 'keepPeople') THEN
      RAISE EXCEPTION 'p_options chiave non consentita: %', v_key;
    END IF;
    IF jsonb_typeof(v_opts -> v_key) <> 'boolean' THEN
      RAISE EXCEPTION 'p_options.% deve essere boolean.', v_key;
    END IF;
  END LOOP;

  keep_user_photos := COALESCE((v_opts ->> 'keepUserPhotos')::boolean, true);
  keep_pois := COALESCE((v_opts ->> 'keepPOIs')::boolean, false);
  keep_people := COALESCE((v_opts ->> 'keepPeople')::boolean, true);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.int09_parse_city_delete_options(jsonb) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- E. relink_orphaned_city_content — ripristino riga cities (contenuti: city_id già invariato)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relink_orphaned_city_content(p_city_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text := NULLIF(trim(p_city_id), '');
BEGIN
  PERFORM public.assert_td_admin_all();

  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  UPDATE public.cities c
  SET
    deleted_at = NULL,
    status = CASE WHEN c.status = 'deleted_orphan' THEN 'draft' ELSE c.status END,
    updated_at = now()
  WHERE c.id = v_city_id
    AND c.deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Città % non trovata o non in stato soft-deleted.', v_city_id;
  END IF;

  -- Nessun UPDATE su photo_submissions/pois/assignments: INT-09 mantiene city_id su CONSERVA.
END;
$$;

REVOKE ALL ON FUNCTION public.relink_orphaned_city_content(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.relink_orphaned_city_content(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.relink_orphaned_city_content(text) TO service_role;

COMMENT ON FUNCTION public.relink_orphaned_city_content IS
  'INT-09: ripristina cities soft-deleted (deleted_at). Contenuti CONSERVA conservano già lo stesso city_id. '
  'DECISIONE CHIUSA relink città: deleted_orphan→draft, mai auto-publish. '
  'Ripristino status pre-delete di contenuti (es. photo_submissions city_deleted) non gestito qui — scope post-Fase-2.';

-- ---------------------------------------------------------------------------
-- F. Helper — revoca assignment photo_submission prima di DELETE righe (CANCELLA media)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.int09_revoke_photo_submission_assignments_for_city(p_city_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.entity_image_assignments%ROWTYPE;
  v_photo_id text;
BEGIN
  FOR v_photo_id IN
    SELECT ps.id::text FROM public.photo_submissions ps WHERE ps.city_id = p_city_id
  LOOP
    FOR v_row IN
      SELECT eia.*
      FROM public.entity_image_assignments eia
      WHERE eia.entity_type = 'photo_submission'
        AND eia.entity_id = v_photo_id
        AND eia.city_id = p_city_id
        AND eia.is_current = true
        AND eia.assignment_status IN ('active', 'suspended')
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
        'photo_submission',
        v_photo_id,
        p_city_id,
        v_row.assignment_status,
        'removed',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        jsonb_build_object(
          'assignment_role', v_row.assignment_role,
          'source', 'delete_city_admin',
          'reason', 'photo_submission_deleted'
        )
      );
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.int09_revoke_photo_submission_assignments_for_city(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- G. delete_city_admin — transazione unica (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_city_admin(
  p_city_id text,
  p_options jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_city_id text := NULLIF(trim(p_city_id), '');
  v_keep_user_photos boolean;
  v_keep_pois boolean;
  v_keep_people boolean;
  v_soft_city boolean;
  v_poi_id text;
  v_person_id uuid;
  v_gallery_id uuid;
  v_guide_ids text[];
  v_operator_ids text[];
  v_poi_ids text[];
  v_shop_ids text[];
BEGIN
  PERFORM public.assert_td_admin_all();

  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  SELECT t.keep_user_photos, t.keep_pois, t.keep_people
  INTO v_keep_user_photos, v_keep_pois, v_keep_people
  FROM public.int09_parse_city_delete_options(p_options) AS t;

  PERFORM pg_advisory_xact_lock(hashtext('delete_city_admin:' || v_city_id));

  PERFORM 1
  FROM public.cities c
  WHERE c.id = v_city_id
    AND c.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Città % non trovata o già eliminata (soft-deleted).', v_city_id;
  END IF;

  -- 1) Media community + patrono (keepUserPhotos — matrice §37.4 F: stessa categoria «Foto Community & Media» / galleria patrono)
  IF v_keep_user_photos THEN
    UPDATE public.photo_submissions ps
    SET status = 'city_deleted', updated_at = now()
    WHERE ps.city_id = v_city_id;
  ELSE
    PERFORM public.int09_revoke_photo_submission_assignments_for_city(v_city_id);

    -- Patrono CANCELLA: report legacy patrono → D90 gallery (revoke assignment + DELETE riga) → primary → suggerimenti
    DELETE FROM public.patron_photo_reports ppr WHERE ppr.city_id = v_city_id;

    FOR v_gallery_id IN
      SELECT g.id FROM public.city_patron_gallery g WHERE g.city_id = v_city_id
    LOOP
      PERFORM public.delete_city_patron_gallery_photo_with_assignment(v_gallery_id);
    END LOOP;

    PERFORM public.revoke_patron_primary_image_assignment(v_city_id);

    DELETE FROM public.patron_photo_suggestions pps WHERE pps.city_id = v_city_id;

    DELETE FROM public.photo_submissions ps WHERE ps.city_id = v_city_id;
  END IF;

  -- 2) Sponsor / negozi (shops sempre CANCELLA)
  SELECT coalesce(array_agg(g.id::text), '{}') INTO v_guide_ids
  FROM public.city_guides g WHERE g.city_id = v_city_id;

  SELECT coalesce(array_agg(o.id::text), '{}') INTO v_operator_ids
  FROM public.city_tour_operators o WHERE o.city_id = v_city_id;

  SELECT coalesce(array_agg(p.id::text), '{}') INTO v_poi_ids
  FROM public.pois p WHERE p.city_id = v_city_id;

  SELECT coalesce(array_agg(s.id::text), '{}') INTO v_shop_ids
  FROM public.shops s WHERE s.city_id = v_city_id;

  UPDATE public.sponsors sp
  SET guide_id = NULL, operator_id = NULL, poi_id = NULL, shop_id = NULL
  WHERE sp.city_id = v_city_id;

  IF cardinality(v_guide_ids) > 0 THEN
    UPDATE public.sponsors sp SET guide_id = NULL WHERE sp.guide_id = ANY (v_guide_ids);
  END IF;
  IF cardinality(v_operator_ids) > 0 THEN
    UPDATE public.sponsors sp SET operator_id = NULL WHERE sp.operator_id = ANY (v_operator_ids);
  END IF;
  IF cardinality(v_poi_ids) > 0 THEN
    UPDATE public.sponsors sp SET poi_id = NULL WHERE sp.poi_id = ANY (v_poi_ids);
  END IF;
  IF cardinality(v_shop_ids) > 0 THEN
    UPDATE public.sponsors sp SET shop_id = NULL WHERE sp.shop_id = ANY (v_shop_ids);
  END IF;

  PERFORM public.handle_city_deleted_for_sponsors(v_city_id);

  DELETE FROM public.shops sh WHERE sh.city_id = v_city_id;

  -- 3) Personaggi
  IF NOT v_keep_people THEN
    DELETE FROM public.famous_person_photo_reports WHERE city_id = v_city_id;
    DELETE FROM public.famous_person_photo_suggestions WHERE city_id = v_city_id;
    DELETE FROM public.famous_person_suggestions WHERE city_id = v_city_id;

    FOR v_person_id IN
      SELECT cp.id FROM public.city_people cp WHERE cp.city_id = v_city_id
    LOOP
      PERFORM public.delete_city_person_with_image_cleanup(v_person_id);
    END LOOP;
  END IF;

  -- 4) POI — boundary D90 delete_poi_with_image_cleanup (revoca assignment + DELETE poi; non DELETE media_assets)
  IF NOT v_keep_pois THEN
    FOR v_poi_id IN
      SELECT p.id FROM public.pois p WHERE p.city_id = v_city_id
    LOOP
      -- D90 non include reviews/suggestions (nessuna FK poi_id su DB linked); cleanup satellite INT-09.
      DELETE FROM public.reviews r WHERE r.poi_id = v_poi_id;
      DELETE FROM public.suggestions su WHERE su.poi_id = v_poi_id;
      PERFORM public.delete_poi_with_image_cleanup(v_poi_id);
    END LOOP;
  END IF;

  -- 5) Dipendenze semplici (content_reports: nessun DELETE)
  DELETE FROM public.city_events WHERE city_id = v_city_id;
  DELETE FROM public.city_services WHERE city_id = v_city_id;
  DELETE FROM public.city_guides WHERE city_id = v_city_id;
  DELETE FROM public.city_tour_operators WHERE city_id = v_city_id;

  -- 6) Chiusura riga cities — decisione sullo stato FINALE post-cleanup (§INT-09 / matrice §37.4)
  -- content_reports (MF2): MAI DELETE. Scelta B: non forzano soft-delete; su hard-delete solo city_id := NULL.
  -- Soft-delete se resta contenuto CONSERVA (flag o righe ancorate) O storico assignment (city_id NOT NULL, RESTRICT FK).
  SELECT (
    v_keep_user_photos
    OR v_keep_pois
    OR v_keep_people
    OR EXISTS (SELECT 1 FROM public.photo_submissions ps WHERE ps.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.pois p WHERE p.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_people cp WHERE cp.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.city_patron_gallery g WHERE g.city_id = v_city_id)
    OR EXISTS (SELECT 1 FROM public.entity_image_assignments eia WHERE eia.city_id = v_city_id)
  ) INTO v_soft_city;

  IF v_soft_city THEN
    UPDATE public.cities c
    SET status = 'deleted_orphan', deleted_at = now(), updated_at = now()
    WHERE c.id = v_city_id;
  ELSE
    UPDATE public.content_reports cr
    SET city_id = NULL
    WHERE cr.city_id = v_city_id;

    DELETE FROM public.user_visited_cities uvc WHERE uvc.city_id = v_city_id;

    DELETE FROM public.cities c WHERE c.id = v_city_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_city_admin(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_city_admin(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_city_admin(text, jsonb) TO service_role;

COMMENT ON FUNCTION public.delete_city_admin IS
  'INT-09: delete città atomico (admin_all). cities.id=text. Soft-delete se post-cleanup restano contenuti CONSERVA o righe entity_image_assignments (RESTRICT). content_reports: mai DELETE; hard-path city_id NULL. Patrono CANCELLA via D90 gallery + revoke primary. Person/POI: D90 RPC. Transazione unica — errore ⇒ rollback completo.';
  