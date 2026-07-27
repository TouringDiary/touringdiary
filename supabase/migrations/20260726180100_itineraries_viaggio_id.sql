-- WF-05 / MP-01 STEP-1 / Batch B1 (M2)
-- Collega Diario (itineraries) al Viaggio (viaggi).
-- Id Diario immutati. Tipi official/community/ai restano con viaggio_id NULL.

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS viaggio_id uuid NULL
    REFERENCES public.viaggi (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.itineraries.viaggio_id IS
  'FK al Viaggio proprietario (solo diari personali post-cutover). ON DELETE CASCADE con il Viaggio.';

CREATE INDEX IF NOT EXISTS idx_itineraries_viaggio_id
  ON public.itineraries (viaggio_id)
  WHERE viaggio_id IS NOT NULL;

-- Invariante soft: se active_diary punta a un diario, quel diario deve appartenere allo stesso viaggio.
-- Enforcement applicativo in B2+; check DB opzionale (non bloccante se active_diary_id NULL).
CREATE OR REPLACE FUNCTION public.viaggi_active_diary_belongs_to_viaggio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.active_diary_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.itineraries i
    WHERE i.id = NEW.active_diary_id
      AND i.viaggio_id = NEW.id
      AND i.type = 'personal'
  ) THEN
    RAISE EXCEPTION
      'viaggi.active_diary_id (%) must reference a personal itinerary with viaggio_id = %',
      NEW.active_diary_id,
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_viaggi_active_diary_belongs ON public.viaggi;
CREATE TRIGGER trg_viaggi_active_diary_belongs
  BEFORE INSERT OR UPDATE OF active_diary_id
  ON public.viaggi
  FOR EACH ROW
  EXECUTE FUNCTION public.viaggi_active_diary_belongs_to_viaggio();

COMMENT ON FUNCTION public.viaggi_active_diary_belongs_to_viaggio() IS
  'WF-05: active_diary_id deve appartenere allo stesso Viaggio (type=personal).';
