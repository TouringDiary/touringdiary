import {
  createDefaultCompositionDraft,
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';

/** Allinea la draft alla nuova blueprint, potando selezioni non più valide. */
export function mergeCompositionDraftWithBlueprint(
  current: WorkspaceCompositionDraft | null,
  nextBlueprint: WorkspaceCompositionBlueprint,
  selectedDiaryId: string | null,
): WorkspaceCompositionDraft {
  const base = current ?? createDefaultCompositionDraft(nextBlueprint);
  const nextSuitcaseIds = new Set(
    [...base.selectedSuitcaseIds].filter((id) =>
      nextBlueprint.suitcases.candidates.some((candidate) => candidate.resourceId === id)
    )
  );
  const nextTemplateIds = new Set(
    [...base.selectedUserTemplateIds].filter((id) =>
      nextBlueprint.userTemplates.candidates.some((candidate) => candidate.resourceId === id)
    )
  );

  if (nextBlueprint.seed.kind === 'suitcase') {
    nextSuitcaseIds.add(nextBlueprint.seed.resourceId);
  }
  if (nextBlueprint.seed.kind === 'user_template') {
    nextTemplateIds.add(nextBlueprint.seed.resourceId);
  }

  return {
    ...base,
    selectedDiaryId,
    selectedSuitcaseIds: nextSuitcaseIds,
    selectedUserTemplateIds: nextTemplateIds,
  };
}
