import type { ImageVerificationStepOutcomeDb } from '@/constants/governance';
import { isImageVerificationStepOutcomeDb } from '@/constants/governance';
import {
  IMAGE_VERIFICATION_STEP_DEFINITIONS,
  isExactCanonicalVerificationStepSet,
} from '@/constants/imageVerificationSteps';
import {
  adminNoteRequiredForOutcome,
  wikimediaFunctionalStatusLabel,
} from '@/domain/media/imagePublicationPolicy';
import { loadLatestCanonicalVerificationRun } from '@/services/media/canonicalVerificationRun';
import { mf3ImageVerificationStepsTable, mf3Rpc } from '@/services/media/mf3DbClient';
import { loadPoiWikimediaAssetSummary } from '@/services/poi/poiWikimediaAssetSummaryService';

export type WikimediaValidationStep = {
  stepCode: string;
  stepOrder: number;
  label: string;
  outcome: ImageVerificationStepOutcomeDb;
  aiRationale: string | null;
  adminRationale: string;
  evidenceJson: unknown;
  noteRequired: boolean;
};

export async function loadLatestWikimediaValidationSteps(
  mediaAssetId: string,
): Promise<WikimediaValidationStep[]> {
  const canonical = await loadLatestCanonicalVerificationRun(mediaAssetId);
  if (!canonical) return [];

  const { data, error } = await mf3ImageVerificationStepsTable()
    .select('step_code, outcome, ai_rationale, admin_rationale, evidence_json')
    .eq('run_id', canonical.id);
  if (error) throw new Error(error.message);

  const codes: string[] = [];
  const byCode = new Map<string, NonNullable<(typeof data)[number]>>();
  for (const row of data ?? []) {
    if (!row?.step_code) throw new Error('Step di verifica Wikimedia non valido.');
    codes.push(row.step_code);
    byCode.set(row.step_code, row);
  }
  if (!isExactCanonicalVerificationStepSet(codes)) {
    throw new Error('Run di verifica Wikimedia non canonico.');
  }

  return IMAGE_VERIFICATION_STEP_DEFINITIONS.map((def) => {
    const row = byCode.get(def.code);
    if (!row) throw new Error('Step di verifica Wikimedia mancante.');
    if (!isImageVerificationStepOutcomeDb(row.outcome)) {
      throw new Error('Esito di verifica Wikimedia non valido.');
    }
    return {
      stepCode: def.code,
      stepOrder: def.order,
      label: def.label,
      outcome: row.outcome,
      aiRationale: row.ai_rationale,
      adminRationale: row.admin_rationale ?? '',
      evidenceJson: row.evidence_json,
      noteRequired: adminNoteRequiredForOutcome(row.outcome),
    };
  });
}

export async function saveWikimediaValidationDraft(
  mediaAssetId: string,
  notes: Array<{ stepCode: string; adminRationale: string }>,
): Promise<void> {
  const { error } = await mf3Rpc<string>('save_wikimedia_validation_notes', {
    p_media_asset_id: mediaAssetId,
    p_notes: notes.map((note) => ({
      step_code: note.stepCode,
      admin_rationale: note.adminRationale,
    })),
  });
  if (error) throw new Error(error.message);
}

export async function completeWikimediaValidation(
  mediaAssetId: string,
  adminRationale: string,
): Promise<void> {
  const { error } = await mf3Rpc<boolean>('set_wikimedia_validation', {
    p_media_asset_id: mediaAssetId,
    p_validated: true,
    p_admin_rationale: adminRationale,
  });
  if (error) throw new Error(error.message);
}

export type WikimediaBulkPoiOutcome = {
  poiId: string;
  poiName: string;
  result: 'validated' | 'skipped' | 'failed';
  message: string | null;
};

async function fillMissingRequiredWikimediaNotes(
  mediaAssetId: string,
  adminRationale: string,
): Promise<void> {
  const steps = await loadLatestWikimediaValidationSteps(mediaAssetId);
  const missing = steps.filter(
    (step) => step.noteRequired && step.adminRationale.trim().length === 0,
  );
  if (missing.length === 0) return;
  await saveWikimediaValidationDraft(
    mediaAssetId,
    missing.map((step) => ({ stepCode: step.stepCode, adminRationale })),
  );
}

/**
 * Valida il file Wikimedia collegato a ciascun POI selezionato.
 * `wikimedia_validated` appartiene al media asset: se più POI condividono lo stesso
 * `media_asset_id`, la validazione riguarda quel file e vale per tutti i suoi utilizzi.
 */
export async function validateWikimediaForSelectedPois(input: {
  cityId: string;
  pois: Array<{ id: string; name: string }>;
  adminRationale: string;
}): Promise<WikimediaBulkPoiOutcome[]> {
  const rationale = input.adminRationale.trim();
  if (rationale.length === 0) {
    throw new Error('La motivazione è obbligatoria.');
  }
  const outcomes: WikimediaBulkPoiOutcome[] = [];
  for (const poi of input.pois) {
    try {
      const summary = await loadPoiWikimediaAssetSummary(poi.id, input.cityId);
      if (!summary.linked) {
        outcomes.push({
          poiId: poi.id,
          poiName: poi.name,
          result: 'skipped',
          message: 'Nessuna Wikimedia pertinente.',
        });
        continue;
      }
      await fillMissingRequiredWikimediaNotes(summary.linked.assetId, rationale);
      await completeWikimediaValidation(summary.linked.assetId, rationale);
      outcomes.push({
        poiId: poi.id,
        poiName: poi.name,
        result: 'validated',
        message: null,
      });
    } catch (err: unknown) {
      outcomes.push({
        poiId: poi.id,
        poiName: poi.name,
        result: 'failed',
        message: err instanceof Error ? err.message : 'Validazione fallita.',
      });
    }
  }
  return outcomes;
}

export { wikimediaFunctionalStatusLabel };
