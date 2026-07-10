import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionCandidate,
  WorkspaceCompositionEdge,
  WorkspaceCompositionSeed,
} from '@/domain/collaboration/workspaceComposition';
import type { SharedResourceKind } from '@/domain/collaboration';
import {
  classifySuitcaseRow,
  fetchDiaryIdsForSuitcase,
  fetchDiaryIdsForSuitcases,
  fetchDiaryRow,
  fetchDiaryTitlesByIds,
  fetchLinkedSuitcaseIdsForDiary,
  fetchOperationalSuitcaseIdsForTemplate,
  fetchSuitcaseRowsByIds,
  fetchUserTemplateRow,
  type SuitcaseGraphRow,
} from './workspaceCompositionGraph';

export interface ResolveWorkspaceCompositionBlueprintInput {
  seed: WorkspaceCompositionSeed;
  /** Per seed valigia/template: diario scelto dall'utente per espandere valigie/template. */
  selectedDiaryId?: string | null;
}

function suitcaseTitle(row: SuitcaseGraphRow, kind: SharedResourceKind): string {
  const base = row.title?.trim();
  if (base) return base;
  return kind === 'user_template' ? 'Template' : 'Valigia';
}

async function buildSuitcaseAndTemplateSections(
  suitcaseRows: SuitcaseGraphRow[],
  seed: WorkspaceCompositionSeed,
  diaryId: string
): Promise<{
  suitcases: WorkspaceCompositionCandidate[];
  userTemplates: WorkspaceCompositionCandidate[];
  edges: WorkspaceCompositionEdge[];
}> {
  const suitcases: WorkspaceCompositionCandidate[] = [];
  const userTemplates: WorkspaceCompositionCandidate[] = [];
  const templateIdsSeen = new Set<string>();
  const edges: WorkspaceCompositionEdge[] = [];

  for (const row of suitcaseRows) {
    const kind = classifySuitcaseRow(row);
    if (!kind) continue;

    if (kind === 'suitcase') {
      suitcases.push({
        kind: 'suitcase',
        resourceId: row.id,
        title: suitcaseTitle(row, kind),
        isSeed: seed.kind === 'suitcase' && seed.resourceId === row.id,
      });
      edges.push({ type: 'diary_suitcase', diaryId, suitcaseId: row.id });
    }
  }

  const templateIdsToResolve = new Set<string>();
  for (const row of suitcaseRows) {
    const kind = classifySuitcaseRow(row);
    if (kind !== 'suitcase' || !row.source_template_id) continue;

    templateIdsToResolve.add(row.source_template_id);
    edges.push({
      type: 'suitcase_template',
      suitcaseId: row.id,
      templateId: row.source_template_id,
    });
  }

  if (templateIdsToResolve.size > 0) {
    const templateRows = await fetchSuitcaseRowsByIds([...templateIdsToResolve]);
    for (const templateRow of templateRows) {
      if (classifySuitcaseRow(templateRow) !== 'user_template') continue;
      if (templateIdsSeen.has(templateRow.id)) continue;
      templateIdsSeen.add(templateRow.id);
      userTemplates.push({
        kind: 'user_template',
        resourceId: templateRow.id,
        title: suitcaseTitle(templateRow, 'user_template'),
        isSeed: seed.kind === 'user_template' && seed.resourceId === templateRow.id,
      });
    }
  }

  return { suitcases, userTemplates, edges };
}

async function expandFromDiary(
  diaryId: string,
  seed: WorkspaceCompositionSeed
): Promise<Pick<WorkspaceCompositionBlueprint, 'suitcases' | 'userTemplates' | 'edges'>> {
  const linkedIds = await fetchLinkedSuitcaseIdsForDiary(diaryId);
  const suitcaseRows = await fetchSuitcaseRowsByIds(linkedIds);
  const { suitcases, userTemplates, edges } = await buildSuitcaseAndTemplateSections(
    suitcaseRows,
    seed,
    diaryId
  );

  return {
    suitcases: { candidates: suitcases },
    userTemplates: { candidates: userTemplates },
    edges,
  };
}

async function buildDiaryCandidate(
  diaryId: string,
  seed: WorkspaceCompositionSeed
): Promise<WorkspaceCompositionCandidate | null> {
  const row = await fetchDiaryRow(diaryId);
  if (!row) return null;

  return {
    kind: 'diary',
    resourceId: diaryId,
    title: row.title?.trim() || 'Diario',
    isSeed: seed.kind === 'diary' && seed.resourceId === diaryId,
  };
}

/**
 * Resolver unico (SSOT) per il blueprint della composizione Workspace.
 */
export async function resolveWorkspaceCompositionBlueprint(
  input: ResolveWorkspaceCompositionBlueprintInput
): Promise<WorkspaceCompositionBlueprint> {
  const { seed, selectedDiaryId = null } = input;

  if (seed.kind === 'diary') {
    const diaryCandidate = await buildDiaryCandidate(seed.resourceId, seed);
    const expanded = await expandFromDiary(seed.resourceId, seed);

    return {
      seed,
      diary: {
        mode: 'fixed',
        candidates: diaryCandidate ? [diaryCandidate] : [],
      },
      suitcases: expanded.suitcases,
      userTemplates: expanded.userTemplates,
      edges: expanded.edges,
    };
  }

  if (seed.kind === 'suitcase') {
    const diaryIds = await fetchDiaryIdsForSuitcase(seed.resourceId);
    const diaryTitles = await fetchDiaryTitlesByIds(diaryIds);
    const diaryCandidates: WorkspaceCompositionCandidate[] = diaryIds.map((id) => ({
      kind: 'diary',
      resourceId: id,
      title: diaryTitles.get(id) ?? 'Diario',
    }));

    const seedSuitcaseRows = await fetchSuitcaseRowsByIds([seed.resourceId]);
    const seedRow = seedSuitcaseRows[0];
    const seedSuitcaseCandidate: WorkspaceCompositionCandidate[] =
      seedRow && classifySuitcaseRow(seedRow) === 'suitcase'
        ? [
            {
              kind: 'suitcase',
              resourceId: seed.resourceId,
              title: suitcaseTitle(seedRow, 'suitcase'),
              isSeed: true,
            },
          ]
        : [];

    if (!selectedDiaryId) {
      return {
        seed,
        diary: { mode: 'single_optional', candidates: diaryCandidates },
        suitcases: { candidates: seedSuitcaseCandidate },
        userTemplates: { candidates: [] },
        edges: [],
      };
    }

    const expanded = await expandFromDiary(selectedDiaryId, seed);
    const suitcaseMap = new Map<string, WorkspaceCompositionCandidate>();
    for (const candidate of seedSuitcaseCandidate) {
      suitcaseMap.set(candidate.resourceId, candidate);
    }
    for (const candidate of expanded.suitcases.candidates) {
      suitcaseMap.set(candidate.resourceId, candidate);
    }

    const diaryCandidate = await buildDiaryCandidate(selectedDiaryId, seed);

    return {
      seed,
      diary: {
        mode: 'single_optional',
        candidates: diaryCandidates.length > 0
          ? diaryCandidates
          : diaryCandidate
            ? [diaryCandidate]
            : [],
      },
      suitcases: { candidates: [...suitcaseMap.values()] },
      userTemplates: expanded.userTemplates,
      edges: expanded.edges,
    };
  }

  // seed.kind === 'user_template'
  const templateRow = await fetchUserTemplateRow(seed.resourceId);
  const seedTemplateCandidates: WorkspaceCompositionCandidate[] = templateRow
    ? [
        {
          kind: 'user_template',
          resourceId: seed.resourceId,
          title: suitcaseTitle(templateRow, 'user_template'),
          isSeed: true,
        },
      ]
    : [];

  const derivedSuitcaseIds = await fetchOperationalSuitcaseIdsForTemplate(seed.resourceId);
  const diaryIds = await fetchDiaryIdsForSuitcases(derivedSuitcaseIds);
  const diaryTitles = await fetchDiaryTitlesByIds(diaryIds);
  const diaryCandidates: WorkspaceCompositionCandidate[] = diaryIds.map((id) => ({
    kind: 'diary',
    resourceId: id,
    title: diaryTitles.get(id) ?? 'Diario',
  }));

  if (!selectedDiaryId) {
    return {
      seed,
      diary: { mode: 'single_optional', candidates: diaryCandidates },
      suitcases: { candidates: [] },
      userTemplates: { candidates: seedTemplateCandidates },
      edges: [],
    };
  }

  const expanded = await expandFromDiary(selectedDiaryId, seed);
  const templateMap = new Map<string, WorkspaceCompositionCandidate>();
  for (const candidate of seedTemplateCandidates) {
    templateMap.set(candidate.resourceId, candidate);
  }
  for (const candidate of expanded.userTemplates.candidates) {
    templateMap.set(candidate.resourceId, candidate);
  }

  return {
    seed,
    diary: { mode: 'single_optional', candidates: diaryCandidates },
    suitcases: expanded.suitcases,
    userTemplates: { candidates: [...templateMap.values()] },
    edges: expanded.edges,
  };
}

/** Etichette UI da candidati del blueprint (senza query aggiuntive se i titoli sono già nel blueprint). */
export function blueprintCandidatesToLabels(
  blueprint: WorkspaceCompositionBlueprint
): Array<{ kind: SharedResourceKind; resourceId: string; title: string }> {
  const all = [
    ...blueprint.diary.candidates,
    ...blueprint.suitcases.candidates,
    ...blueprint.userTemplates.candidates,
  ];
  return all.map((candidate) => ({
    kind: candidate.kind,
    resourceId: candidate.resourceId,
    title: candidate.title,
  }));
}
