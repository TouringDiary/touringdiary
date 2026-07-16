import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionEdge,
} from '@/domain/collaboration/workspaceComposition';
import {
  classifySuitcaseRow,
  fetchDiarySuitcasePairsForDiaryIds,
  fetchOwnedOperationalSuitcasesForCatalog,
  fetchOwnedPersonalDiariesForCatalog,
  fetchOwnedUserTemplatesForCatalog,
} from './workspaceCompositionGraph';

export interface ResolveWorkspaceCompositionCatalogInput {
  ownerId: string;
  /** Ancora iniziale per preselezione diario (solo se presente nel catalogo). */
  preselectedDiaryId?: string | null;
}

function diaryTitle(title: string | null | undefined): string {
  return title?.trim() || 'Diario di viaggio';
}

function suitcaseTitle(title: string | null | undefined): string {
  return title?.trim() || 'Valigia';
}

function templateTitle(title: string | null | undefined): string {
  return title?.trim() || 'Template';
}

/**
 * Resolver definitivo per il flusso «Crea Workspace»: inventario personale completo
 * con date e archi strutturali tra candidati del catalogo.
 *
 * Non usare nel wizard «Condividi» — lì resta `resolveWorkspaceCompositionBlueprint`.
 */
export async function resolveWorkspaceCompositionCatalog(
  input: ResolveWorkspaceCompositionCatalogInput
): Promise<WorkspaceCompositionBlueprint> {
  const { ownerId } = input;
  const preselectedDiaryId = input.preselectedDiaryId?.trim() || '';

  const [diaryRows, suitcaseRows, templateRows] = await Promise.all([
    fetchOwnedPersonalDiariesForCatalog(ownerId),
    fetchOwnedOperationalSuitcasesForCatalog(ownerId),
    fetchOwnedUserTemplatesForCatalog(ownerId),
  ]);

  const diaryIds = new Set(diaryRows.map((row) => row.id));
  const suitcaseIds = new Set(
    suitcaseRows
      .filter((row) => classifySuitcaseRow(row) === 'suitcase')
      .map((row) => row.id)
  );
  const templateIds = new Set(
    templateRows
      .filter((row) => classifySuitcaseRow(row) === 'user_template')
      .map((row) => row.id)
  );

  const edges: WorkspaceCompositionEdge[] = [];

  if (diaryIds.size > 0) {
    const pairs = await fetchDiarySuitcasePairsForDiaryIds([...diaryIds]);
    for (const pair of pairs) {
      if (suitcaseIds.has(pair.suitcaseId)) {
        edges.push({
          type: 'diary_suitcase',
          diaryId: pair.diaryId,
          suitcaseId: pair.suitcaseId,
        });
      }
    }
  }

  for (const row of suitcaseRows) {
    if (!row.source_template_id || !templateIds.has(row.source_template_id)) continue;
    if (!suitcaseIds.has(row.id)) continue;
    edges.push({
      type: 'suitcase_template',
      suitcaseId: row.id,
      templateId: row.source_template_id,
    });
  }

  const seedDiaryId =
    preselectedDiaryId && diaryIds.has(preselectedDiaryId) ? preselectedDiaryId : '';

  return {
    seed: { kind: 'diary', resourceId: seedDiaryId },
    diary: {
      mode: 'single_optional',
      candidates: diaryRows.map((row) => ({
        kind: 'diary' as const,
        resourceId: row.id,
        title: diaryTitle(row.title),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    },
    suitcases: {
      candidates: suitcaseRows
        .filter((row) => classifySuitcaseRow(row) === 'suitcase')
        .map((row) => ({
          kind: 'suitcase' as const,
          resourceId: row.id,
          title: suitcaseTitle(row.title),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
    },
    userTemplates: {
      candidates: templateRows
        .filter((row) => classifySuitcaseRow(row) === 'user_template')
        .map((row) => ({
          kind: 'user_template' as const,
          resourceId: row.id,
          title: templateTitle(row.title),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
    },
    edges,
  };
}
