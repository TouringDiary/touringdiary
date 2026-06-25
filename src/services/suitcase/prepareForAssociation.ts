import { Itinerary } from '@/types';
import { isDiaryPersisted, isDiaryTempId } from '@/utils/suitcaseAssociation';
import type { DocumentSaveController } from '@/domain/save/documentSaveTypes';
import { SuitcaseAssociationError } from '@/services/suitcase/associateSuitcaseWithDiary';

export interface PrepareForAssociationInput {
  isGuest: boolean;
  onLoginRequired: () => void;
  diaryController: Pick<
    DocumentSaveController,
    'phase' | 'flush' | 'save' | 'awaitInFlight' | 'isGuest' | 'cancelPendingAutosave'
  > & { getPhase?: () => DocumentSaveController['phase'] };
  suitcaseController: Pick<
    DocumentSaveController,
    'phase' | 'flush' | 'save' | 'awaitInFlight' | 'isGuest' | 'cancelPendingAutosave'
  > & { getPhase?: () => DocumentSaveController['phase'] };
  itinerary: Itinerary;
  savedProjects: Itinerary[];
  suitcaseId: string;
  diaryName?: string;
  suitcaseName?: string;
  isSuitcaseNeverSaved: (id: string) => boolean;
}

export type AssociationReadiness =
  | { ready: true; itineraryId: string; suitcaseId: string }
  | { ready: false; reason: 'login' | 'error' | 'needs_name' | 'saving' };

function getPhase(
  controller: PrepareForAssociationInput['diaryController']
): DocumentSaveController['phase'] {
  return controller.getPhase?.() ?? controller.phase;
}

/**
 * Ensures both documents are persisted and synced before creating itinerary_suitcases link.
 * Cancels pending autosave debounce, then flushes the latest snapshot immediately.
 */
export async function prepareForAssociation(
  input: PrepareForAssociationInput
): Promise<AssociationReadiness> {
  if (input.isGuest || input.diaryController.isGuest || input.suitcaseController.isGuest) {
    input.onLoginRequired();
    return { ready: false, reason: 'login' };
  }

  input.diaryController.cancelPendingAutosave();
  input.suitcaseController.cancelPendingAutosave();

  await input.diaryController.awaitInFlight();
  await input.suitcaseController.awaitInFlight();

  const diaryPhase = getPhase(input.diaryController);
  const suitcasePhase = getPhase(input.suitcaseController);

  if (diaryPhase === 'saving' || suitcasePhase === 'saving') {
    await input.diaryController.awaitInFlight();
    await input.suitcaseController.awaitInFlight();
  }

  if (getPhase(input.diaryController) === 'error' || getPhase(input.suitcaseController) === 'error') {
    return { ready: false, reason: 'error' };
  }

  const diaryNeverSaved = !isDiaryPersisted(input.itinerary, input.savedProjects);
  const suitcaseNeverSaved = input.isSuitcaseNeverSaved(input.suitcaseId);

  if (diaryNeverSaved && !input.diaryName?.trim()) {
    return { ready: false, reason: 'needs_name' };
  }
  if (suitcaseNeverSaved && !input.suitcaseName?.trim()) {
    return { ready: false, reason: 'needs_name' };
  }

  let itineraryId = input.itinerary.id;

  if (diaryNeverSaved) {
    const savedId = await input.diaryController.save({ name: input.diaryName?.trim() });
    if (!savedId) {
      throw new SuitcaseAssociationError('Impossibile salvare il diario.', 'save-diary');
    }
    itineraryId = savedId;
  } else if (getPhase(input.diaryController) === 'dirty') {
    const flushed = await input.diaryController.flush();
    if (!flushed) {
      throw new SuitcaseAssociationError('Impossibile sincronizzare il diario.', 'save-diary');
    }
    itineraryId = flushed;
  }

  let suitcaseId = input.suitcaseId;

  if (suitcaseNeverSaved) {
    const savedId = await input.suitcaseController.save({ name: input.suitcaseName?.trim() });
    if (!savedId) {
      throw new SuitcaseAssociationError('Impossibile salvare la valigia.', 'persist-suitcase');
    }
    suitcaseId = savedId;
  } else if (getPhase(input.suitcaseController) === 'dirty') {
    const flushed = await input.suitcaseController.flush();
    if (!flushed) {
      throw new SuitcaseAssociationError('Impossibile sincronizzare la valigia.', 'persist-suitcase');
    }
    suitcaseId = flushed;
  }

  if (!itineraryId || isDiaryTempId(itineraryId)) {
    throw new SuitcaseAssociationError('Diario non disponibile per l\'associazione.', 'link');
  }

  return { ready: true, itineraryId, suitcaseId };
}
