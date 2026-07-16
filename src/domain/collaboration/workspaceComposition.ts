import type { SharedResourceKind } from './sharedResource';
import { workspaceResourceKey } from './workspace';

/** Risorsa candidata in una sezione della composizione Workspace. */
export interface WorkspaceCompositionCandidate {
  kind: SharedResourceKind;
  resourceId: string;
  title: string;
  isSeed?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type WorkspaceCompositionDiaryMode = 'fixed' | 'single_optional';

export interface WorkspaceCompositionSection {
  candidates: WorkspaceCompositionCandidate[];
}

export interface WorkspaceCompositionDiarySection extends WorkspaceCompositionSection {
  mode: WorkspaceCompositionDiaryMode;
}

/** Arco strutturale di primo livello (per ricostruzione relazioni tra copie). */
export type WorkspaceCompositionEdge =
  | { type: 'diary_suitcase'; diaryId: string; suitcaseId: string }
  | { type: 'suitcase_template'; suitcaseId: string; templateId: string };

export interface WorkspaceCompositionSeed {
  kind: SharedResourceKind;
  resourceId: string;
}

/**
 * Blueprint read-only prodotto dal resolver: candidati per sezione + archi originali.
 */
export interface WorkspaceCompositionBlueprint {
  seed: WorkspaceCompositionSeed;
  diary: WorkspaceCompositionDiarySection;
  suitcases: WorkspaceCompositionSection;
  userTemplates: WorkspaceCompositionSection;
  edges: WorkspaceCompositionEdge[];
}

/** Selezione utente nello step composizione. */
export interface WorkspaceCompositionDraft {
  seed: WorkspaceCompositionSeed;
  selectedDiaryId: string | null;
  selectedSuitcaseIds: Set<string>;
  selectedUserTemplateIds: Set<string>;
}

export function compositionCandidateKey(
  kind: SharedResourceKind,
  resourceId: string
): string {
  return workspaceResourceKey(kind, resourceId);
}

export function countSelectedResources(draft: WorkspaceCompositionDraft): number {
  let count = draft.selectedDiaryId ? 1 : 0;
  count += draft.selectedSuitcaseIds.size;
  count += draft.selectedUserTemplateIds.size;
  return count;
}

export interface ValidateWorkspaceCompositionDraftOptions {
  /** Consente composizione vuota (create Workspace dedicato). */
  allowEmpty?: boolean;
}

export function validateWorkspaceCompositionDraft(
  draft: WorkspaceCompositionDraft,
  blueprint: WorkspaceCompositionBlueprint,
  options?: ValidateWorkspaceCompositionDraftOptions,
): string | null {
  if (countSelectedResources(draft) === 0) {
    if (options?.allowEmpty) return null;
    return 'Seleziona almeno un elemento per il Workspace.';
  }

  if (draft.selectedDiaryId) {
    const diaryAllowed = blueprint.diary.candidates.some(
      (candidate) => candidate.resourceId === draft.selectedDiaryId
    );
    if (!diaryAllowed) {
      return 'Il Diario selezionato non è valido per questa composizione.';
    }
  }

  for (const suitcaseId of draft.selectedSuitcaseIds) {
    if (!blueprint.suitcases.candidates.some((candidate) => candidate.resourceId === suitcaseId)) {
      return 'Una Valigia selezionata non è valida per questa composizione.';
    }
  }

  for (const templateId of draft.selectedUserTemplateIds) {
    if (
      !blueprint.userTemplates.candidates.some(
        (candidate) => candidate.resourceId === templateId
      )
    ) {
      return 'Un Template selezionato non è valido per questa composizione.';
    }
  }

  return null;
}

export function draftToCompositionResources(
  draft: WorkspaceCompositionDraft
): Array<{ kind: SharedResourceKind; resourceId: string }> {
  const resources: Array<{ kind: SharedResourceKind; resourceId: string }> = [];

  if (draft.selectedDiaryId) {
    resources.push({ kind: 'diary', resourceId: draft.selectedDiaryId });
  }

  for (const suitcaseId of draft.selectedSuitcaseIds) {
    resources.push({ kind: 'suitcase', resourceId: suitcaseId });
  }

  for (const templateId of draft.selectedUserTemplateIds) {
    resources.push({ kind: 'user_template', resourceId: templateId });
  }

  return resources;
}

export function createDefaultCompositionDraft(
  blueprint: WorkspaceCompositionBlueprint
): WorkspaceCompositionDraft {
  const draft: WorkspaceCompositionDraft = {
    seed: blueprint.seed,
    selectedDiaryId: null,
    selectedSuitcaseIds: new Set(),
    selectedUserTemplateIds: new Set(),
  };

  if (!blueprint.seed.resourceId) {
    return draft;
  }

  if (blueprint.seed.kind === 'diary') {
    const isCandidate = blueprint.diary.candidates.some(
      (candidate) => candidate.resourceId === blueprint.seed.resourceId
    );
    if (isCandidate) {
      draft.selectedDiaryId = blueprint.seed.resourceId;
    }
    return draft;
  }

  if (blueprint.seed.kind === 'suitcase') {
    if (
      blueprint.suitcases.candidates.some(
        (candidate) => candidate.resourceId === blueprint.seed.resourceId
      )
    ) {
      draft.selectedSuitcaseIds.add(blueprint.seed.resourceId);
    }
    return draft;
  }

  if (
    blueprint.userTemplates.candidates.some(
      (candidate) => candidate.resourceId === blueprint.seed.resourceId
    )
  ) {
    draft.selectedUserTemplateIds.add(blueprint.seed.resourceId);
  }

  return draft;
}
