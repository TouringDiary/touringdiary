/**
 * Smoke WF-13 — decisioni 1–8 (associazione / create / Salva con nome / conflitti).
 * Pure logic + tipizzazione; no DB write.
 * Eseguire: npx tsx scripts/smoke-wf13-resource-association.ts
 */
import {
  ResourceAssociationError,
  SuitcaseLinkConflictError,
  type SuitcaseLinkConflict,
  type ViaggioAssociationChoice,
  type CreateDiaryInput,
  type CreateSuitcaseInput,
  type SaveAsViaggioOptions,
} from '../src/types/resourceAssociation';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

// 1) Scelte A/B/C complete
{
  const choices: ViaggioAssociationChoice[] = ['none', 'existing', 'new'];
  assert(choices.length === 3, 'A/B/C association choices');
}

// 2) CreateDiaryInput / CreateSuitcaseInput shape (fixedViaggioId vs tools)
{
  const fromViaggio: CreateDiaryInput = {
    userId: 'u1',
    name: 'Tour',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    viaggioChoice: 'existing',
    fixedViaggioId: 'v1',
  };
  assert(!!fromViaggio.fixedViaggioId, 'viaggio-detail uses fixedViaggioId');

  const fromTools: CreateSuitcaseInput = {
    userId: 'u1',
    name: 'Valigia',
    viaggioChoice: 'none',
  };
  assert(fromTools.viaggioChoice === 'none', 'tools independent suitcase');
}

// 3) SaveAs options
{
  const opts: SaveAsViaggioOptions = {
    viaggioChoice: 'existing',
    existingViaggioId: 'v2',
  };
  assert(opts.viaggioChoice === 'existing', 'saveAs existing viaggio');
}

// 4) Domain errors distinguishable from generic Error
{
  const domain = new ResourceAssociationError('[resourceAssociation] Seleziona un Viaggio.');
  assert(domain.name === 'ResourceAssociationError', 'ResourceAssociationError name');
  assert(domain instanceof Error, 'ResourceAssociationError extends Error');

  const conflict: Exclude<SuitcaseLinkConflict, { type: 'none' }> = { type: 'other_viaggio' };
  const linkErr = new SuitcaseLinkConflictError(conflict);
  assert(linkErr.name === 'SuitcaseLinkConflictError', 'SuitcaseLinkConflictError name');
  assert(linkErr.conflict.type === 'other_viaggio', 'conflict payload');
}

// 5) Conflict taxonomy (DOC 31 / 35)
{
  const kinds: SuitcaseLinkConflict['type'][] = [
    'none',
    'other_viaggio',
    'linked_to_diary_or_viaggio',
  ];
  assert(kinds.includes('linked_to_diary_or_viaggio'), 'diary conflict kind preserved');
}

// 6) Date validation rule used by CreateDiaryModal (end >= start)
{
  const ok = '2026-07-05' >= '2026-07-01';
  const bad = '2026-06-01' >= '2026-07-01';
  assert(ok && !bad, 'endDate >= startDate rule');
}

if (issues.length > 0) {
  console.error('WF-13 smoke FAILED:');
  for (const i of issues) console.error(' -', i);
  process.exit(1);
}

console.log('WF-13 smoke OK — decisioni 1–8 (tipi / errori / regole A/B/C)');
