import { isExactCanonicalVerificationStepSet } from '@/constants/imageVerificationSteps';
import {
  mf3ImageVerificationRunsTable,
  mf3ImageVerificationStepsTable,
} from '@/services/media/mf3DbClient';

export type CanonicalVerificationRun = {
  id: string;
  overallOutcome: string | null;
  aiSummary: string | null;
};

/** Sotto max_rows PostgREST (1000): una pagina piena non è la fine dell'elenco. */
const RUN_PAGE = 8;
const STEP_PAGE = 200;

/**
 * Ultimo run il cui insieme di step_code coincide esattamente con i codici canonici.
 * Un run più recente incompleto, con codici extra o con duplicati, viene ignorato.
 * A parità di created_at vale l'id più alto, come latest_complete_image_verification_run.
 */
export async function loadLatestCanonicalVerificationRun(
  mediaAssetId: string,
): Promise<CanonicalVerificationRun | null> {
  let runFrom = 0;
  for (;;) {
    const { data: runs, error: runError } = await mf3ImageVerificationRunsTable()
      .select('id, overall_outcome, ai_summary')
      .eq('media_asset_id', mediaAssetId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(runFrom, runFrom + RUN_PAGE - 1);
    if (runError) throw new Error(runError.message);

    const page = runs ?? [];
    const ordered: CanonicalVerificationRun[] = [];
    for (const row of page) {
      if (!row?.id) continue;
      ordered.push({
        id: row.id,
        overallOutcome: row.overall_outcome,
        aiSummary: row.ai_summary,
      });
    }

    if (ordered.length > 0) {
      const codesByRun = await loadStepCodesByRun(ordered.map((run) => run.id));
      const match = ordered.find((run) =>
        isExactCanonicalVerificationStepSet(codesByRun.get(run.id) ?? []),
      );
      if (match) return match;
    }

    if (page.length < RUN_PAGE) return null;
    runFrom += RUN_PAGE;
  }
}

async function loadStepCodesByRun(runIds: string[]): Promise<Map<string, string[]>> {
  const codesByRun = new Map<string, string[]>();
  let stepFrom = 0;
  for (;;) {
    const { data: steps, error: stepsError } = await mf3ImageVerificationStepsTable()
      .select('run_id, step_code')
      .in('run_id', runIds)
      .order('run_id', { ascending: true })
      .order('id', { ascending: true })
      .range(stepFrom, stepFrom + STEP_PAGE - 1);
    if (stepsError) throw new Error(stepsError.message);

    const rows = steps ?? [];
    for (const row of rows) {
      if (!row?.run_id || typeof row.step_code !== 'string') continue;
      const codes = codesByRun.get(row.run_id) ?? [];
      codes.push(row.step_code);
      codesByRun.set(row.run_id, codes);
    }
    if (rows.length < STEP_PAGE) return codesByRun;
    stepFrom += STEP_PAGE;
  }
}
