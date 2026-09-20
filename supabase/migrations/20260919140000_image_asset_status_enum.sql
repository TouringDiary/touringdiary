-- MF3 — Stati lifecycle asset (D40) distinti da media_status entità legacy.

DO $$
DECLARE
  v_required text[] := ARRAY[
    'active',
    'suspended',
    'restored',
    'replaced',
    'removed',
    'verify_ai_image'
  ];
  v_label text;
  v_missing text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'image_asset_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.image_asset_status AS ENUM (
      'active',
      'suspended',
      'restored',
      'replaced',
      'removed',
      'verify_ai_image'
    );
  ELSE
    FOREACH v_label IN ARRAY v_required
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'image_asset_status'
          AND n.nspname = 'public'
          AND e.enumlabel = v_label
      ) THEN
        v_missing := array_append(v_missing, v_label);
      END IF;
    END LOOP;

    IF coalesce(array_length(v_missing, 1), 0) > 0 THEN
      RAISE EXCEPTION
        'public.image_asset_status incompleto: label MF3 mancanti %. Completare l''enum in una migration dedicata prima di eseguire questa migration.',
        v_missing;
    END IF;
  END IF;
END $$;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS asset_status public.image_asset_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS media_assets_asset_status_idx
  ON public.media_assets (asset_status);

COMMENT ON COLUMN public.media_assets.asset_status IS
  'Lifecycle canonico asset (ATTIVO/SOSPESO/…/verify_ai_image) — MF3 D40; distinto da assignment_status e editorial status entità.';

-- Unicità sorgente Storage (idempotenza concorrente; non catalogo MF4).
DO $$
DECLARE
  v_dup_groups integer;
  v_has_correct_unique boolean;
  v_named_index_oid oid;
  v_named_index_ok boolean;
BEGIN
  SELECT count(*)::integer INTO v_dup_groups
  FROM (
    SELECT storage_bucket, storage_path
    FROM public.media_assets
    WHERE storage_bucket IS NOT NULL
      AND storage_path IS NOT NULL
    GROUP BY storage_bucket, storage_path
    HAVING count(*) > 1
  ) dup;

  IF v_dup_groups > 0 THEN
    RAISE EXCEPTION
      'MF3 UNIQUE (storage_bucket, storage_path): impossibile creare l''indice — % gruppi sorgente duplicati in public.media_assets. Risolvere i duplicati legacy fuori da questa migration.',
      v_dup_groups;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'media_assets'
      AND i.indisunique
      AND i.indpred IS NULL
      AND i.indnkeyatts = 2
      AND NOT EXISTS (
        SELECT 1
        FROM generate_series(1, i.indnkeyatts) AS k(n)
        WHERE (i.indkey)[k.n] = 0
      )
      AND (
        SELECT array_agg(a.attname ORDER BY k.n)
        FROM generate_series(1, i.indnkeyatts) AS k(n)
        JOIN pg_attribute a
          ON a.attrelid = i.indrelid
         AND a.attnum = (i.indkey)[k.n]
         AND NOT a.attisdropped
      ) = ARRAY['storage_bucket', 'storage_path']::name[]
  ) INTO v_has_correct_unique;

  SELECT c.oid INTO v_named_index_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'i'
    AND c.relname = 'media_assets_storage_bucket_path_unique_idx';

  IF v_named_index_oid IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE i.indexrelid = v_named_index_oid
        AND n.nspname = 'public'
        AND t.relname = 'media_assets'
        AND i.indisunique
        AND i.indpred IS NULL
        AND i.indnkeyatts = 2
        AND NOT EXISTS (
          SELECT 1
          FROM generate_series(1, i.indnkeyatts) AS k(n)
          WHERE (i.indkey)[k.n] = 0
        )
        AND (
          SELECT array_agg(a.attname ORDER BY k.n)
          FROM generate_series(1, i.indnkeyatts) AS k(n)
          JOIN pg_attribute a
            ON a.attrelid = i.indrelid
           AND a.attnum = (i.indkey)[k.n]
           AND NOT a.attisdropped
        ) = ARRAY['storage_bucket', 'storage_path']::name[]
    ) INTO v_named_index_ok;

    IF NOT v_named_index_ok THEN
      IF NOT v_has_correct_unique THEN
        RAISE EXCEPTION
          'Indice public.media_assets_storage_bucket_path_unique_idx presente ma non UNIQUE su (storage_bucket, storage_path). Risolvere fuori da questa migration MF3.';
      ELSE
        RAISE NOTICE
          'MF3: public.media_assets_storage_bucket_path_unique_idx non rispetta l''invariante (storage_bucket, storage_path); un altro indice UNIQUE corretto è già presente.';
      END IF;
    END IF;
  END IF;

  IF NOT v_has_correct_unique THEN
    IF v_named_index_oid IS NULL THEN
      CREATE UNIQUE INDEX media_assets_storage_bucket_path_unique_idx
        ON public.media_assets (storage_bucket, storage_path);
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Vocabolario canonico media_assets.origin_type (MF3)
-- admin | ai | wikimedia | community | placeholder
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_canonical_media_origin_type(p_origin_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw text;
BEGIN
  v_raw := lower(trim(COALESCE(p_origin_type, '')));

  IF v_raw = '' OR v_raw = 'admin_upload' THEN
    RETURN 'admin';
  END IF;

  IF v_raw = 'ai_generated' THEN
    RETURN 'ai';
  END IF;

  IF v_raw NOT IN ('admin', 'ai', 'wikimedia', 'community', 'placeholder') THEN
    RAISE EXCEPTION 'origin_type non valido: %', p_origin_type;
  END IF;

  RETURN v_raw;
END;
$$;

-- ---------------------------------------------------------------------------
-- ensure_media_asset_from_source — provenance canonica; lifecycle invariato su asset esistente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_media_asset_from_source(
  p_image_url text,
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
  v_uid uuid;
  v_asset_id uuid;
  v_bucket text;
  v_path text;
  v_origin text;
  v_generated_by_ai boolean;
  v_is_placeholder boolean;
  v_existing_origin text;
  v_existing_canonical text;
  v_existing_generated_by_ai boolean;
  v_existing_is_placeholder boolean;
  v_lock_key bigint;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL AND NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Autenticazione richiesta.';
  END IF;

  v_bucket := COALESCE(NULLIF(trim(p_storage_bucket), ''), 'public-media');
  IF p_storage_path IS NOT NULL AND char_length(trim(p_storage_path)) > 0 THEN
    v_path := trim(p_storage_path);
  ELSIF p_image_url IS NOT NULL AND char_length(trim(p_image_url)) > 0 THEN
    v_path := trim(p_image_url);
    v_bucket := 'external';
  ELSE
    RAISE EXCEPTION 'Immagine sorgente assente per assignment legacy.';
  END IF;

  IF NOT (public.is_td_admin(v_uid) OR public.is_service_role()) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.photo_submissions ps
      WHERE ps.user_id = v_uid
        AND ps.status = 'approved'
        AND NULLIF(trim(ps.image_url), '') IS NOT NULL
        AND (
          (
            v_bucket = 'community-photos'
            AND substring(ps.image_url from '/object/public/community-photos/([^?]+)') = v_path
          )
          OR (
            v_bucket = 'public-media'
            AND substring(ps.image_url from '/object/public/public-media/([^?]+)') = v_path
          )
          OR (v_bucket = 'external' AND trim(ps.image_url) = v_path)
        )
    ) THEN
      RAISE EXCEPTION 'Non autorizzato.';
    END IF;
  END IF;

  v_origin := public.normalize_canonical_media_origin_type(p_origin_type);
  v_generated_by_ai := (v_origin = 'ai');
  v_is_placeholder := (v_origin = 'placeholder');

  v_lock_key := hashtextextended(v_bucket || E'\x1f' || v_path, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT
    id,
    origin_type,
    generated_by_ai,
    is_placeholder
  INTO
    v_asset_id,
    v_existing_origin,
    v_existing_generated_by_ai,
    v_existing_is_placeholder
  FROM public.media_assets
  WHERE storage_bucket = v_bucket AND storage_path = v_path
  LIMIT 1;

  IF v_asset_id IS NULL THEN
    INSERT INTO public.media_assets (
      storage_bucket,
      storage_path,
      origin_type,
      generated_by_ai,
      is_placeholder,
      asset_status
    )
    VALUES (
      v_bucket,
      v_path,
      v_origin,
      v_generated_by_ai,
      v_is_placeholder,
      'active'
    )
    ON CONFLICT (storage_bucket, storage_path) DO NOTHING
    RETURNING id INTO v_asset_id;

    IF v_asset_id IS NULL THEN
      SELECT
        id,
        origin_type,
        generated_by_ai,
        is_placeholder
      INTO
        v_asset_id,
        v_existing_origin,
        v_existing_generated_by_ai,
        v_existing_is_placeholder
      FROM public.media_assets
      WHERE storage_bucket = v_bucket AND storage_path = v_path
      LIMIT 1;
    ELSE
      RETURN v_asset_id;
    END IF;
  END IF;

  IF v_asset_id IS NOT NULL THEN
    IF v_existing_origin IS NULL OR trim(v_existing_origin) = '' THEN
      v_existing_canonical := NULL;
    ELSIF lower(trim(v_existing_origin)) IN ('admin_upload') THEN
      v_existing_canonical := 'admin';
    ELSIF lower(trim(v_existing_origin)) IN ('ai_generated') THEN
      v_existing_canonical := 'ai';
    ELSE
      v_existing_canonical := lower(trim(v_existing_origin));
    END IF;

    IF v_existing_canonical IS NOT NULL AND v_existing_canonical <> v_origin THEN
      RAISE EXCEPTION
        'Conflitto provenance media_asset per sorgente %/%: origin_type esistente=% richiesto=%',
        v_bucket,
        v_path,
        v_existing_canonical,
        v_origin;
    END IF;

    IF v_existing_generated_by_ai IS NOT NULL
      AND v_existing_generated_by_ai IS DISTINCT FROM v_generated_by_ai THEN
      RAISE EXCEPTION
        'Conflitto provenance media_asset per sorgente %/%: generated_by_ai esistente=% richiesto=%',
        v_bucket,
        v_path,
        v_existing_generated_by_ai,
        v_generated_by_ai;
    END IF;

    IF v_existing_is_placeholder IS NOT NULL
      AND v_existing_is_placeholder IS DISTINCT FROM v_is_placeholder THEN
      RAISE EXCEPTION
        'Conflitto provenance media_asset per sorgente %/%: is_placeholder esistente=% richiesto=%',
        v_bucket,
        v_path,
        v_existing_is_placeholder,
        v_is_placeholder;
    END IF;

    UPDATE public.media_assets
    SET
      origin_type = COALESCE(v_existing_canonical, v_origin),
      generated_by_ai = v_generated_by_ai,
      is_placeholder = v_is_placeholder,
      updated_at = now()
    WHERE id = v_asset_id;

    RETURN v_asset_id;
  END IF;

  RAISE EXCEPTION 'media_asset non materializzato per sorgente %/%', v_bucket, v_path;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_media_asset_from_source(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_media_asset_from_source(text, text, text, text) TO service_role;
