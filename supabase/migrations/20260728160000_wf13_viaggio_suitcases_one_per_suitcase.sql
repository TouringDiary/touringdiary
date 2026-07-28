-- WF-13 STEP 2 — Enforce «una Valigia ↔ un Viaggio» su viaggio_suitcases
-- Verificato su DB live (2026-07-28): 11 righe, 7 suitcase, 3 multi-viaggio.
-- Diario.viaggio_id è già cardinalità 1 (colonna singola) — nessun UNIQUE aggiuntivo.
--
-- SSOT (DOC 31 / DOC 35 / DOC 37): una Valigia ↔ un solo Viaggio; su conflitto di
-- associazione il prodotto propone una copia — NON definisce quale link storico
-- multi-viaggio conservare in dedupe. Vietato scegliere per euristica (es. created_at).

-- 1) Tabella backup per le righe in conflitto (gruppi suitcase_id con >1 viaggio_id).
--    Se esistono duplicati la migrazione ABORTA: in transazione il backup viene
--    annullato insieme al resto; serve comunque come contratto operativo e resta
--    popolabile dopo risoluzione manuale in riesecuzioni pulite (0 insert).
CREATE TABLE IF NOT EXISTS public._wf13_backup_viaggio_suitcases_dedupe (
  LIKE public.viaggio_suitcases INCLUDING DEFAULTS
);

COMMENT ON TABLE public._wf13_backup_viaggio_suitcases_dedupe IS
  'WF-13 STEP 2 backup: righe viaggio_suitcases in conflitto suitcase_id (nessun delete automatico).';

INSERT INTO public._wf13_backup_viaggio_suitcases_dedupe
SELECT vs.*
FROM public.viaggio_suitcases vs
WHERE vs.suitcase_id IN (
  SELECT suitcase_id
  FROM public.viaggio_suitcases
  GROUP BY suitcase_id
  HAVING COUNT(*) > 1
)
AND NOT EXISTS (
  SELECT 1
  FROM public._wf13_backup_viaggio_suitcases_dedupe b
  WHERE b.id = vs.id
);

-- 2) Nessun DELETE automatico: senza criterio SSOT di keeper, interrompere.
DO $$
DECLARE
  dup_suitcases int;
BEGIN
  SELECT COUNT(*) INTO dup_suitcases
  FROM (
    SELECT suitcase_id
    FROM public.viaggio_suitcases
    GROUP BY suitcase_id
    HAVING COUNT(*) > 1
  ) d;

  IF dup_suitcases > 0 THEN
    RAISE EXCEPTION
      'WF-13: % suitcase_id hanno più di un viaggio_id in public.viaggio_suitcases. '
      'Nessun criterio documentato in DOC 31 / DOC 35 / DOC 37 autorizza a scegliere '
      'automaticamente quale relazione mantenere (euristiche tipo created_at vietate). '
      'Risolvere manualmente i duplicati, poi rieseguire questa migrazione. '
      'Diagnostica: SELECT suitcase_id, count(*) AS n, array_agg(viaggio_id ORDER BY id) AS viaggio_ids, array_agg(id ORDER BY id) AS link_ids FROM public.viaggio_suitcases GROUP BY suitcase_id HAVING count(*) > 1;',
      dup_suitcases;
  END IF;
END $$;

-- 3) Constraint: una Valigia non può comparire su due Viaggi (solo se 0 duplicati)
CREATE UNIQUE INDEX IF NOT EXISTS uq_viaggio_suitcases_suitcase_id
  ON public.viaggio_suitcases (suitcase_id);

COMMENT ON INDEX public.uq_viaggio_suitcases_suitcase_id IS
  'WF-13: una Valigia ↔ un solo Viaggio (DOC 31 / DOC 35 §9.7–9.9).';
