import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionCandidate,
  WorkspaceCompositionEdge,
} from '@/domain/collaboration/workspaceComposition';
import type { Itinerary } from '@/types/index';
import type { Suitcase } from '@/types/suitcase';
import { listDiariesByViaggio } from '@/services/viaggio/viaggioDiaryService';
import { listSuitcasesByViaggio } from '@/services/viaggio/viaggioSuitcaseService';
import {
  classifySuitcaseRow,
  fetchDiarySuitcasePairsForDiaryIds,
} from './workspaceCompositionGraph';

export interface ResolveWorkspaceCompositionCatalogFromViaggioInput {
  ownerId: string;
  viaggioId: string;
  /** Diario pre-selezionato se appartiene al Viaggio. */
  preselectedDiaryId?: string | null;
}

/** Diario persistito: `Itinerary.id` dominio ammette null solo per bozze locali. */
type PersistedDiary = Itinerary & { id: string };

function isPersistedDiary(diary: Itinerary): diary is PersistedDiary {
  return typeof diary.id === 'string' && diary.id.length > 0;
}

function diaryTitle(title: string | null | undefined): string {
  return title?.trim() || 'Diario di viaggio';
}

function suitcaseTitle(title: string | null | undefined): string {
  return title?.trim() || 'Valigia';
}

function toDiaryCandidate(diary: PersistedDiary): WorkspaceCompositionCandidate {
  return {
    kind: 'diary',
    resourceId: diary.id,
    title: diaryTitle(diary.name),
    createdAt: diary.createdAt ? new Date(diary.createdAt).toISOString() : null,
    updatedAt: diary.updatedAt ? new Date(diary.updatedAt).toISOString() : null,
  };
}

function toSuitcaseCandidate(suitcase: Suitcase): WorkspaceCompositionCandidate {
  return {
    kind: 'suitcase',
    resourceId: suitcase.id,
    title: suitcaseTitle(suitcase.title),
    createdAt: suitcase.created_at ?? null,
    updatedAt: suitcase.updated_at ?? null,
  };
}

/**
 * Catalogo composizione limitato alle risorse del Viaggio (DOC 28 Parte A).
 * Solo Diario + Valigia — nessun Template; sezioni non selezionabili restano vuote nel WS.
 * Solo risorse con `resourceId` stringa valida diventano candidati.
 */
export async function resolveWorkspaceCompositionCatalogFromViaggio(
  input: ResolveWorkspaceCompositionCatalogFromViaggioInput,
): Promise<WorkspaceCompositionBlueprint> {
  const { ownerId, viaggioId } = input;
  const preselectedDiaryId = input.preselectedDiaryId?.trim() || '';

  const [diaries, suitcases] = await Promise.all([
    listDiariesByViaggio(viaggioId),
    listSuitcasesByViaggio(viaggioId),
  ]);

  const ownedDiaries: PersistedDiary[] = [];
  for (const diary of diaries) {
    if (diary.userId !== ownerId) continue;
    if (!isPersistedDiary(diary)) continue;
    ownedDiaries.push(diary);
  }

  const ownedSuitcases: Suitcase[] = [];
  for (const suitcase of suitcases) {
    if (suitcase.user_id !== ownerId) continue;
    if (typeof suitcase.id !== 'string' || suitcase.id.length === 0) continue;
    const row = {
      id: suitcase.id,
      title: suitcase.title,
      is_user_template: suitcase.is_user_template ?? false,
      user_id: suitcase.user_id,
      source_template_id: suitcase.source_template_id ?? null,
    };
    if (classifySuitcaseRow(row) !== 'suitcase') continue;
    ownedSuitcases.push(suitcase);
  }

  const diaryIds = ownedDiaries.map((diary) => diary.id);
  const suitcaseIdSet = new Set(ownedSuitcases.map((suitcase) => suitcase.id));

  const edges: WorkspaceCompositionEdge[] = [];
  if (diaryIds.length > 0 && suitcaseIdSet.size > 0) {
    const pairs = await fetchDiarySuitcasePairsForDiaryIds(diaryIds);
    for (const pair of pairs) {
      if (suitcaseIdSet.has(pair.suitcaseId)) {
        edges.push({
          type: 'diary_suitcase',
          diaryId: pair.diaryId,
          suitcaseId: pair.suitcaseId,
        });
      }
    }
  }

  const diaryIdSet = new Set(diaryIds);
  const seedDiaryId =
    preselectedDiaryId && diaryIdSet.has(preselectedDiaryId) ? preselectedDiaryId : '';

  return {
    seed: { kind: 'diary', resourceId: seedDiaryId },
    diary: {
      mode: 'single_optional',
      candidates: ownedDiaries.map(toDiaryCandidate),
    },
    suitcases: {
      candidates: ownedSuitcases.map(toSuitcaseCandidate),
    },
    userTemplates: { candidates: [] },
    edges,
  };
}
