-- =============================================================================
-- Patron moderation status rename (DEFINITIVE)
-- Suggestions: pending | in_review | accepted | rejected
-- Reports:     pending | in_review | photo_blocked | rejected
-- Items:       unchanged (pending | approved | rejected)
--
-- Prerequisito: 20260819120000_city_patron_gallery_and_suggestions.sql applicata.
-- Compatibile con CHECK remoto attuale:
--   suggestions: pending | approved | rejected
--   reports:     pending | reviewed | resolved | dismissed
-- NON modifica patron_photo_suggestion_items.
-- NON modifica city_patron_gallery / caption.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. patron_photo_suggestions — convert then constrain
-- ---------------------------------------------------------------------------
ALTER TABLE public.patron_photo_suggestions
    DROP CONSTRAINT IF EXISTS patron_photo_suggestions_status_check;

-- Legacy / intermedia (se presenti): reviewed → in_review; approved → accepted
UPDATE public.patron_photo_suggestions
SET status = 'in_review'
WHERE status = 'reviewed';

UPDATE public.patron_photo_suggestions
SET status = 'accepted'
WHERE status = 'approved';

ALTER TABLE public.patron_photo_suggestions
    ADD CONSTRAINT patron_photo_suggestions_status_check
    CHECK (status IN ('pending', 'in_review', 'accepted', 'rejected'));

COMMENT ON COLUMN public.patron_photo_suggestions.status IS
    'pending=Da gestire; in_review=In revisione; accepted=Accettata; rejected=Rifiutata.';

-- ---------------------------------------------------------------------------
-- 2. patron_photo_reports — convert then constrain
-- ---------------------------------------------------------------------------
ALTER TABLE public.patron_photo_reports
    DROP CONSTRAINT IF EXISTS patron_photo_reports_status_check;

UPDATE public.patron_photo_reports
SET status = 'in_review'
WHERE status = 'reviewed';

UPDATE public.patron_photo_reports
SET status = 'photo_blocked'
WHERE status = 'resolved';

UPDATE public.patron_photo_reports
SET status = 'rejected'
WHERE status = 'dismissed';

ALTER TABLE public.patron_photo_reports
    ADD CONSTRAINT patron_photo_reports_status_check
    CHECK (status IN ('pending', 'in_review', 'photo_blocked', 'rejected'));

COMMENT ON COLUMN public.patron_photo_reports.status IS
    'pending=Da gestire; in_review=In revisione; photo_blocked=Foto bloccata (rimossa gallery); rejected=Segnalazione rifiutata (foto resta).';
