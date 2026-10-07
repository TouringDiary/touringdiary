-- CANCELLA FOTO — hard delete di un utilizzo o dell'asset, solo Admin ALL.
-- Lo storico resta append-only: il trigger viene sospeso e riattivato nella stessa transazione.
-- photo_submissions e city_patron_gallery non hanno FK verso media_assets e non vengono toccate.
-- Il file Storage non si cancella qui: la RPC autorizza solo gli oggetti appena scollegati.

CREATE OR REPLACE FUNCTION public.is_admin_all(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_uid
      AND role = 'admin_all'
  );
$$;

-- Nessun GRANT a authenticated: la usano solo le funzioni SECURITY DEFINER dello stesso owner.
REVOKE ALL ON FUNCTION public.is_admin_all(uuid) FROM PUBLIC;

CREATE TABLE public.media_hard_delete_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket_id text NOT NULL,
  object_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_hard_delete_objects_user_object_uidx UNIQUE (user_id, bucket_id, object_name)
);

COMMENT ON TABLE public.media_hard_delete_objects IS
  'Autorizzazioni temporanee per completare la DELETE Storage di una CANCELLA FOTO. Durano un''ora dall''avvio di quella operazione, solo per quell''utente e quell''oggetto. Non sono un permesso sul bucket e non limitano da quando la foto può essere cancellata. Una riga scaduta non autorizza la DELETE e una nuova operazione la sostituisce.';

ALTER TABLE public.media_hard_delete_objects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.media_hard_delete_objects FROM PUBLIC;
REVOKE ALL ON TABLE public.media_hard_delete_objects FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.media_hard_delete_object_authorized(
  p_bucket text,
  p_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin_all(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.media_hard_delete_objects a
      WHERE a.user_id = auth.uid()
        AND a.bucket_id = p_bucket
        AND a.object_name = p_name
        AND a.expires_at > now()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.media_assets live_asset
      WHERE live_asset.storage_bucket = p_bucket
        AND live_asset.storage_path = p_name
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.content_reports live_report
      WHERE live_report.evidence_storage_bucket = p_bucket
        AND live_report.evidence_storage_path = p_name
    );
$$;

REVOKE ALL ON FUNCTION public.media_hard_delete_object_authorized(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.media_hard_delete_object_authorized(text, text) TO authenticated;

DROP POLICY IF EXISTS media_hard_delete_authorized_delete ON storage.objects;
CREATE POLICY media_hard_delete_authorized_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (public.media_hard_delete_object_authorized(bucket_id, name));

CREATE OR REPLACE FUNCTION public.hard_delete_media_photo(
  p_media_asset_id uuid,
  p_assignment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_asset public.media_assets%ROWTYPE;
  v_assignment_ids uuid[];
  v_report_ids uuid[];
  v_evidence jsonb := '[]'::jsonb;
  v_remaining integer;
  v_delete_asset boolean;
  v_bucket text;
  v_path text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_admin_all(v_uid) THEN
    RAISE EXCEPTION 'Solo Admin ALL può cancellare una foto.';
  END IF;

  IF p_media_asset_id IS NULL THEN
    RAISE EXCEPTION 'Foto obbligatoria.';
  END IF;

  -- Solo i ticket scaduti di chi avvia l'operazione. Quelli di un altro utente non
  -- servono a questo click, e un path ancora in uso non va ripulito qui.
  DELETE FROM public.media_hard_delete_objects stale
  WHERE stale.user_id = v_uid
    AND stale.expires_at <= now();

  PERFORM pg_advisory_xact_lock(hashtextextended(p_media_asset_id::text, 0));

  SELECT * INTO v_asset
  FROM public.media_assets
  WHERE id = p_media_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto non trovata.';
  END IF;

  IF v_asset.is_placeholder OR lower(trim(v_asset.origin_type)) = 'placeholder' THEN
    RAISE EXCEPTION 'Il placeholder non si cancella con Cancella foto.';
  END IF;

  IF p_assignment_id IS NULL THEN
    PERFORM 1
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = p_media_asset_id
    FOR UPDATE;

    SELECT COALESCE(array_agg(eia.id), ARRAY[]::uuid[])
    INTO v_assignment_ids
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = p_media_asset_id;
  ELSE
    PERFORM 1
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = p_media_asset_id
      AND eia.id = p_assignment_id
    FOR UPDATE;

    SELECT COALESCE(array_agg(eia.id), ARRAY[]::uuid[])
    INTO v_assignment_ids
    FROM public.entity_image_assignments eia
    WHERE eia.media_asset_id = p_media_asset_id
      AND eia.id = p_assignment_id;

    IF COALESCE(array_length(v_assignment_ids, 1), 0) = 0 THEN
      RAISE EXCEPTION 'Utilizzo non trovato per questa foto.';
    END IF;
  END IF;

  SELECT count(*)
  INTO v_remaining
  FROM public.entity_image_assignments eia
  WHERE eia.media_asset_id = p_media_asset_id
    AND NOT (eia.id = ANY (v_assignment_ids));

  v_delete_asset := v_remaining = 0;
  v_bucket := CASE
    WHEN NULLIF(trim(v_asset.storage_bucket), '') IS NULL THEN NULL
    ELSE v_asset.storage_bucket
  END;
  v_path := CASE
    WHEN NULLIF(trim(v_asset.storage_path), '') IS NULL THEN NULL
    ELSE v_asset.storage_path
  END;

  IF v_delete_asset AND v_bucket IS NOT NULL AND v_path IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.media_assets other
      WHERE other.id <> p_media_asset_id
        AND other.storage_bucket = v_asset.storage_bucket
        AND other.storage_path = v_asset.storage_path
    ) THEN
      RAISE EXCEPTION 'File Storage condiviso da un altro asset. Cancellazione annullata.';
    END IF;
  END IF;

  PERFORM 1
  FROM public.content_reports cr
  WHERE cr.assignment_id = ANY (v_assignment_ids)
  FOR UPDATE;

  SELECT COALESCE(array_agg(cr.id), ARRAY[]::uuid[])
  INTO v_report_ids
  FROM public.content_reports cr
  WHERE cr.assignment_id = ANY (v_assignment_ids);

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('bucket', evidence_rows.bucket_id, 'path', evidence_rows.object_name)),
    '[]'::jsonb
  )
  INTO v_evidence
  FROM (
    SELECT DISTINCT
      cr.evidence_storage_bucket AS bucket_id,
      cr.evidence_storage_path AS object_name
    FROM public.content_reports cr
    WHERE cr.id = ANY (v_report_ids)
      AND NULLIF(trim(cr.evidence_storage_bucket), '') IS NOT NULL
      AND NULLIF(trim(cr.evidence_storage_path), '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.content_reports keeper
        WHERE NOT (keeper.id = ANY (v_report_ids))
          AND keeper.evidence_storage_bucket = cr.evidence_storage_bucket
          AND keeper.evidence_storage_path = cr.evidence_storage_path
      )
  ) evidence_rows;

  UPDATE public.content_reports
  SET parent_report_id = NULL,
      updated_at = now()
  WHERE id = ANY (v_report_ids)
    AND parent_report_id = ANY (v_report_ids);

  DELETE FROM public.content_reports
  WHERE id = ANY (v_report_ids);

  -- Eccezione distruttiva: il trigger append-only resta attivo per ogni altro comando.
  -- Se il DELETE fallisce, la transazione annulla anche DISABLE TRIGGER.
  ALTER TABLE public.entity_image_history DISABLE TRIGGER entity_image_history_append_only;
  DELETE FROM public.entity_image_history h
  WHERE h.assignment_id = ANY (v_assignment_ids)
     OR h.replaced_by_assignment_id = ANY (v_assignment_ids)
     OR (v_delete_asset AND h.media_asset_id = p_media_asset_id);
  ALTER TABLE public.entity_image_history ENABLE TRIGGER entity_image_history_append_only;

  DELETE FROM public.entity_image_assignments
  WHERE id = ANY (v_assignment_ids);

  IF v_delete_asset THEN
    DELETE FROM public.media_assets
    WHERE id = p_media_asset_id;
  END IF;

  -- Dopo la cancellazione: un ticket di un altro Admin ALL, anche se inserito dopo
  -- il cleanup iniziale, non resta valido sui path appena liberati.
  -- I ticket di path ancora referenziati non entrano in questo insieme.
  DELETE FROM public.media_hard_delete_objects stale
  WHERE (
      v_delete_asset
      AND v_bucket IS NOT NULL
      AND v_path IS NOT NULL
      AND stale.bucket_id = v_bucket
      AND stale.object_name = v_path
    )
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_evidence) item
      WHERE stale.bucket_id = NULLIF(trim(item->>'bucket'), '')
        AND stale.object_name = NULLIF(trim(item->>'path'), '')
    );

  INSERT INTO public.media_hard_delete_objects (user_id, bucket_id, object_name, expires_at)
  SELECT v_uid, objects.bucket_id, objects.object_name, now() + interval '1 hour'
  FROM (
    SELECT v_bucket AS bucket_id, v_path AS object_name
    WHERE v_delete_asset AND v_bucket IS NOT NULL AND v_path IS NOT NULL
    UNION
    SELECT item->>'bucket', item->>'path'
    FROM jsonb_array_elements(v_evidence) item
    WHERE NULLIF(trim(item->>'bucket'), '') IS NOT NULL
      AND NULLIF(trim(item->>'path'), '') IS NOT NULL
  ) objects
  WHERE objects.bucket_id IS NOT NULL
    AND objects.object_name IS NOT NULL
  ON CONFLICT (user_id, bucket_id, object_name)
  DO UPDATE SET expires_at = EXCLUDED.expires_at;

  RETURN jsonb_build_object(
    'asset_deleted', v_delete_asset,
    'storage', CASE
      WHEN v_delete_asset AND v_bucket IS NOT NULL AND v_path IS NOT NULL
        THEN jsonb_build_object('bucket', v_bucket, 'path', v_path)
      ELSE NULL
    END,
    'storage_path_absent', v_delete_asset AND (v_bucket IS NULL OR v_path IS NULL),
    'evidence', v_evidence
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hard_delete_media_photo(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hard_delete_media_photo(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.hard_delete_media_photo(uuid, uuid) IS
  'CANCELLA FOTO, solo profiles.role = admin_all. p_assignment_id valorizza un solo utilizzo; NULL cancella tutti gli assignment dell''asset. L''asset e il file si eliminano solo se non resta alcun assignment. Non tocca photo_submissions né city_patron_gallery.';

CREATE OR REPLACE FUNCTION public.release_media_hard_delete_objects(p_objects jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_admin_all(v_uid) THEN
    RAISE EXCEPTION 'Solo Admin ALL può chiudere una cancellazione foto.';
  END IF;

  IF p_objects IS NULL OR jsonb_typeof(p_objects) <> 'array' THEN
    RAISE EXCEPTION 'Elenco file non valido.';
  END IF;

  DELETE FROM public.media_hard_delete_objects a
  WHERE a.user_id = v_uid
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_objects) item
      WHERE a.bucket_id = NULLIF(trim(item->>'bucket'), '')
        AND a.object_name = NULLIF(trim(item->>'path'), '')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.release_media_hard_delete_objects(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_media_hard_delete_objects(jsonb) TO authenticated;
