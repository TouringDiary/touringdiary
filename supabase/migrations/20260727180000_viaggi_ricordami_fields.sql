-- WF-10 / MP-02 STEP-1
-- Ricordami questo viaggio: preferenza sull'Aggregate Root (DOC 35 §6.5 · DOC 37 VD-016/023)
-- Delete Viaggio elimina la riga → preferenza cascata automatica (no tabella separata).

ALTER TABLE public.viaggi
  ADD COLUMN IF NOT EXISTS ricordami_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ricordami_interval_months integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS ricordami_next_at timestamptz NULL;

ALTER TABLE public.viaggi
  DROP CONSTRAINT IF EXISTS viaggi_ricordami_interval_chk;

ALTER TABLE public.viaggi
  ADD CONSTRAINT viaggi_ricordami_interval_chk
  CHECK (ricordami_interval_months >= 1 AND ricordami_interval_months <= 120);

COMMENT ON COLUMN public.viaggi.ricordami_enabled IS
  'Preferenza «Ricordami questo viaggio». Persistente anche se CC sospende le notifiche globali.';
COMMENT ON COLUMN public.viaggi.ricordami_interval_months IS
  'Intervallo mesi tra promemoria (default 12).';
COMMENT ON COLUMN public.viaggi.ricordami_next_at IS
  'Prossima emissione pianificata (null se OFF). Il valore viene ricalcolato dal servizio quando necessario.';

-- Default nuovi: ON + 12 mesi; next_at impostato dal client/service alla create.
-- Righe esistenti: priorità next_at = period_end+12m → updated_at+12m → now()+12m.
UPDATE public.viaggi
SET
  ricordami_enabled = COALESCE(ricordami_enabled, true),
  ricordami_interval_months = COALESCE(ricordami_interval_months, 12),
  ricordami_next_at = COALESCE(
    ricordami_next_at,
    (
      COALESCE(period_end::timestamptz, updated_at, now())
      + interval '12 months'
    )
  )
WHERE ricordami_next_at IS NULL AND COALESCE(ricordami_enabled, true) = true;

CREATE INDEX IF NOT EXISTS idx_viaggi_ricordami_due
  ON public.viaggi (user_id, ricordami_next_at)
  WHERE ricordami_enabled = true AND ricordami_next_at IS NOT NULL;
