import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  draftToCompositionResources,
} from '@/domain/collaboration/workspaceComposition';
import type { SharedResourceKind } from '@/domain/collaboration';
import { workspaceResourceKey } from '@/domain/collaboration';
import { duplicateSharedResourceForOwner } from '@/services/collaboration/personalShareService';
import { linkSuitcaseToTripAsync } from '@/services/suitcase/suitcaseLinkingService';
import { deleteSuitcaseAsync, updateSuitcaseAsync } from '@/services/suitcase/suitcaseCoreService';
import { supabase } from '@/services/supabaseClient';
import type { WorkspaceCompositionResource } from '../workspaceCompositionService';

export type MaterializeWorkspaceCompositionResult =
  | { success: true; resources: WorkspaceCompositionResource[] }
  | { success: false; error: string };

type ResourceKey = string;

function toKey(kind: SharedResourceKind, resourceId: string): ResourceKey {
  return workspaceResourceKey(kind, resourceId);
}

function isResourceSelected(
  draft: WorkspaceCompositionDraft,
  kind: SharedResourceKind,
  resourceId: string
): boolean {
  if (kind === 'diary') return draft.selectedDiaryId === resourceId;
  if (kind === 'suitcase') return draft.selectedSuitcaseIds.has(resourceId);
  return draft.selectedUserTemplateIds.has(resourceId);
}

async function deleteDuplicatedResource(
  kind: SharedResourceKind,
  resourceId: string
): Promise<void> {
  if (kind === 'diary') {
    await supabase.from('itineraries').delete().eq('id', resourceId);
    return;
  }

  await deleteSuitcaseAsync(resourceId);
}

/** Rimuove copie create da una materializzazione fallita a valle (es. creazione workspace). */
export async function rollbackDuplicatedCompositionResources(
  resources: WorkspaceCompositionResource[]
): Promise<void> {
  const diaryResources = resources.filter((resource) => resource.kind === 'diary');
  const nonDiaryResources = resources.filter((resource) => resource.kind !== 'diary');

  for (const resource of nonDiaryResources.reverse()) {
    try {
      await deleteDuplicatedResource(resource.kind, resource.resourceId);
    } catch (rollbackError) {
      console.error('[materializeWorkspaceComposition] rollbackDuplicatedCompositionResources:', rollbackError);
    }
  }

  for (const resource of diaryResources) {
    try {
      await deleteDuplicatedResource(resource.kind, resource.resourceId);
    } catch (rollbackError) {
      console.error('[materializeWorkspaceComposition] rollbackDuplicatedCompositionResources:', rollbackError);
    }
  }
}

export type WorkspaceCompositionShareIntent = 'duplicate_and_share' | 'share_current';

/**
 * Materializza la composizione selezionata applicando ShareIntent:
 * - share_current: istanze originali
 * - duplicate_and_share: copie + ricostruzione relazioni tra copie selezionate
 */
export async function materializeWorkspaceComposition(input: {
  ownerId: string;
  shareIntent: WorkspaceCompositionShareIntent;
  draft: WorkspaceCompositionDraft;
  blueprint: WorkspaceCompositionBlueprint;
}): Promise<MaterializeWorkspaceCompositionResult> {
  const { ownerId, shareIntent, draft, blueprint } = input;
  const originals = draftToCompositionResources(draft);

  if (shareIntent === 'share_current') {
    return { success: true, resources: originals };
  }

  const idMap = new Map<ResourceKey, string>();
  const createdCopies: Array<{ kind: SharedResourceKind; resourceId: string }> = [];

  const rollbackCopies = async () => {
    for (const copy of [...createdCopies].reverse()) {
      try {
        await deleteDuplicatedResource(copy.kind, copy.resourceId);
      } catch (rollbackError) {
        console.error('[materializeWorkspaceComposition] rollback:', rollbackError);
      }
    }
  };

  const duplicateOne = async (
    kind: SharedResourceKind,
    resourceId: string
  ): Promise<string | null> => {
    const result = await duplicateSharedResourceForOwner(kind, resourceId, ownerId);
    if (result.success !== true) {
      return null;
    }
    idMap.set(toKey(kind, resourceId), result.copiedResourceId);
    createdCopies.push({ kind, resourceId: result.copiedResourceId });
    return result.copiedResourceId;
  };

  try {
    const diaryResources = originals.filter((resource) => resource.kind === 'diary');
    const templateResources = originals.filter((resource) => resource.kind === 'user_template');
    const suitcaseResources = originals.filter((resource) => resource.kind === 'suitcase');

    for (const resource of diaryResources) {
      const copiedId = await duplicateOne(resource.kind, resource.resourceId);
      if (!copiedId) {
        await rollbackCopies();
        return { success: false, error: 'Impossibile duplicare il Diario selezionato.' };
      }
    }

    for (const resource of templateResources) {
      const copiedId = await duplicateOne(resource.kind, resource.resourceId);
      if (!copiedId) {
        await rollbackCopies();
        return { success: false, error: 'Impossibile duplicare un Template selezionato.' };
      }
    }

    for (const resource of suitcaseResources) {
      const copiedId = await duplicateOne(resource.kind, resource.resourceId);
      if (!copiedId) {
        await rollbackCopies();
        return { success: false, error: 'Impossibile duplicare una Valigia selezionata.' };
      }
    }

    for (const edge of blueprint.edges) {
      if (edge.type === 'diary_suitcase') {
        if (
          !isResourceSelected(draft, 'diary', edge.diaryId) ||
          !isResourceSelected(draft, 'suitcase', edge.suitcaseId)
        ) {
          continue;
        }

        const copiedDiaryId = idMap.get(toKey('diary', edge.diaryId));
        const copiedSuitcaseId = idMap.get(toKey('suitcase', edge.suitcaseId));
        if (!copiedDiaryId || !copiedSuitcaseId) continue;

        await linkSuitcaseToTripAsync(copiedDiaryId, copiedSuitcaseId, ownerId);
        continue;
      }

      if (edge.type === 'suitcase_template') {
        if (!isResourceSelected(draft, 'suitcase', edge.suitcaseId)) {
          continue;
        }

        const copiedSuitcaseId = idMap.get(toKey('suitcase', edge.suitcaseId));
        if (!copiedSuitcaseId) continue;

        const templateSelected = isResourceSelected(draft, 'user_template', edge.templateId);
        const nextSourceTemplateId = templateSelected
          ? idMap.get(toKey('user_template', edge.templateId)) ?? null
          : null;

        await updateSuitcaseAsync(copiedSuitcaseId, {
          source_template_id: nextSourceTemplateId,
        });
      }
    }

    for (const resource of suitcaseResources) {
      const copiedSuitcaseId = idMap.get(toKey('suitcase', resource.resourceId));
      if (!copiedSuitcaseId) continue;

      const hasTemplateEdgeInBlueprint = blueprint.edges.some(
        (edge) =>
          edge.type === 'suitcase_template' &&
          edge.suitcaseId === resource.resourceId &&
          isResourceSelected(draft, 'user_template', edge.templateId)
      );

      if (!hasTemplateEdgeInBlueprint) {
        await updateSuitcaseAsync(copiedSuitcaseId, { source_template_id: null });
      }
    }

    const resources: WorkspaceCompositionResource[] = originals.map((resource) => ({
      kind: resource.kind,
      resourceId: idMap.get(toKey(resource.kind, resource.resourceId)) ?? resource.resourceId,
    }));

    return { success: true, resources };
  } catch (error) {
    console.error('[materializeWorkspaceComposition]', error);
    await rollbackCopies();
    return {
      success: false,
      error: 'Impossibile preparare la composizione duplicata per il Workspace.',
    };
  }
}
