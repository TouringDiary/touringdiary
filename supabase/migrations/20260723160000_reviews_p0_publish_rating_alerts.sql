-- =============================================================================
-- Reviews P0 — pubblicazione immediata, 1 review/utente/target, rating SoT,
-- RLS autore, updated_at, alert soglia, sync pois.rating
-- =============================================================================
-- Contesto: AI_CONTEXT/AUDIT_REVIEWS_AND_RATINGS.md — decisioni PO 2026-07-23
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Colonna updated_at
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL;

COMMENT ON COLUMN public.reviews.updated_at IS
    'Timestamp ultima modifica contenuto (testo/voto/criteri). NULL se mai modificata.';

-- ---------------------------------------------------------------------------
-- 2. Pubblicazione immediata: pending → approved (backfill)
-- ---------------------------------------------------------------------------
UPDATE public.reviews
SET
    status = 'approved',
    approved_at = COALESCE(approved_at, created_at, timezone('utc', now()))
WHERE status = 'pending';

ALTER TABLE public.reviews
    ALTER COLUMN status SET DEFAULT 'approved';

-- ---------------------------------------------------------------------------
-- 3. Dedup: una sola recensione per (author, poi) / (author, itinerary)
--    Conserva la più recente (created_at, poi id).
-- ---------------------------------------------------------------------------
DELETE FROM public.reviews r
USING public.reviews newer
WHERE r.author_id IS NOT NULL
  AND r.poi_id IS NOT NULL
  AND newer.author_id = r.author_id
  AND newer.poi_id = r.poi_id
  AND (
      newer.created_at > r.created_at
      OR (newer.created_at IS NOT DISTINCT FROM r.created_at AND newer.id > r.id)
  );

DELETE FROM public.reviews r
USING public.reviews newer
WHERE r.author_id IS NOT NULL
  AND r.itinerary_id IS NOT NULL
  AND newer.author_id = r.author_id
  AND newer.itinerary_id = r.itinerary_id
  AND (
      newer.created_at > r.created_at
      OR (newer.created_at IS NOT DISTINCT FROM r.created_at AND newer.id > r.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_poi_unique
    ON public.reviews (author_id, poi_id)
    WHERE author_id IS NOT NULL AND poi_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_itinerary_unique
    ON public.reviews (author_id, itinerary_id)
    WHERE author_id IS NOT NULL AND itinerary_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. RLS — UPDATE / DELETE per autore
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;
CREATE POLICY "Users update own reviews"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;
CREATE POLICY "Users delete own reviews"
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- 5. Tabella segnalazioni soglia rating
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_rating_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id text NOT NULL,
    average_rating numeric NOT NULL,
    threshold numeric NOT NULL,
    reviews_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'open'
        CHECK (status = ANY (ARRAY['open'::text, 'acknowledged'::text, 'resolved'::text])),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    acknowledged_at timestamptz NULL,
    acknowledged_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    CONSTRAINT review_rating_alerts_poi_id_not_blank CHECK (char_length(btrim(poi_id)) > 0)
);

CREATE INDEX IF NOT EXISTS review_rating_alerts_status_created_idx
    ON public.review_rating_alerts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS review_rating_alerts_poi_idx
    ON public.review_rating_alerts (poi_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS review_rating_alerts_one_open_per_poi
    ON public.review_rating_alerts (poi_id)
    WHERE status = 'open';

COMMENT ON TABLE public.review_rating_alerts IS
    'Coda segnalazioni admin quando la media recensioni POI scende sotto soglia CC.';

ALTER TABLE public.review_rating_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_rating_alerts_admin_all ON public.review_rating_alerts;
CREATE POLICY review_rating_alerts_admin_all
    ON public.review_rating_alerts
    FOR ALL
    TO authenticated
    USING (public.is_td_admin(auth.uid()))
    WITH CHECK (public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_rating_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_rating_alerts TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Helper: soglia da Centro di Controllo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_sponsor_rating_alert_threshold()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_override jsonb;
    v_default jsonb;
    v_num numeric;
BEGIN
    SELECT manual_override, default_value
      INTO v_override, v_default
      FROM public.platform_feature_flags
     WHERE key = 'threshold.sponsor_rating_alert_stars';

    IF v_override IS NOT NULL THEN
        BEGIN
            v_num := (v_override #>> '{}')::numeric;
            IF v_num IS NOT NULL THEN
                RETURN v_num;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    IF v_default IS NOT NULL THEN
        BEGIN
            v_num := (v_default #>> '{}')::numeric;
            IF v_num IS NOT NULL THEN
                RETURN v_num;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    RETURN 3;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sponsor_rating_alert_threshold() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sponsor_rating_alert_threshold() TO authenticated, service_role, anon;

-- ---------------------------------------------------------------------------
-- 7. Sync pois.rating da media reviews + alert soglia
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_poi_rating_from_reviews(p_poi_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_avg numeric;
    v_count integer;
    v_threshold numeric;
BEGIN
    IF p_poi_id IS NULL OR btrim(p_poi_id) = '' THEN
        RETURN;
    END IF;

    SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        COUNT(*)::integer
      INTO v_avg, v_count
      FROM public.reviews
     WHERE poi_id = p_poi_id
       AND status = 'approved';

    UPDATE public.pois
       SET rating = v_avg,
           updated_at = timezone('utc', now())
     WHERE id = p_poi_id;

    v_threshold := public.get_sponsor_rating_alert_threshold();

    IF v_count > 0 AND v_avg < v_threshold THEN
        INSERT INTO public.review_rating_alerts (
            poi_id, average_rating, threshold, reviews_count, status, created_at, updated_at
        ) VALUES (
            p_poi_id, v_avg, v_threshold, v_count, 'open',
            timezone('utc', now()), timezone('utc', now())
        )
        ON CONFLICT (poi_id) WHERE (status = 'open')
        DO UPDATE SET
            average_rating = EXCLUDED.average_rating,
            threshold = EXCLUDED.threshold,
            reviews_count = EXCLUDED.reviews_count,
            updated_at = timezone('utc', now());
    ELSE
        UPDATE public.review_rating_alerts
           SET status = 'resolved',
               updated_at = timezone('utc', now())
         WHERE poi_id = p_poi_id
           AND status = 'open';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reviews_sync_poi_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_poi_id text;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_poi_id := OLD.poi_id;
    ELSE
        v_poi_id := NEW.poi_id;
        IF TG_OP = 'UPDATE' AND OLD.poi_id IS DISTINCT FROM NEW.poi_id AND OLD.poi_id IS NOT NULL THEN
            PERFORM public.sync_poi_rating_from_reviews(OLD.poi_id);
        END IF;
    END IF;

    IF v_poi_id IS NOT NULL THEN
        PERFORM public.sync_poi_rating_from_reviews(v_poi_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_sync_poi_rating ON public.reviews;
CREATE TRIGGER reviews_sync_poi_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_reviews_sync_poi_rating();

-- Evita XP doppio: resta solo handle_review_approval_xp
DROP TRIGGER IF EXISTS on_review_approved_insert ON public.reviews;
DROP TRIGGER IF EXISTS on_review_approved_update ON public.reviews;

-- ---------------------------------------------------------------------------
-- 8. Backfill rating POI + alert aperti
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT DISTINCT poi_id
          FROM public.reviews
         WHERE poi_id IS NOT NULL
    LOOP
        PERFORM public.sync_poi_rating_from_reviews(r.poi_id);
    END LOOP;
END;
$$;

COMMIT;
