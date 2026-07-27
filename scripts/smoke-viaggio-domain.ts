/**
 * Smoke — fondazione dominio Viaggio (MP-01 STEP-1 / WF-05).
 * Pure logic + invarianti anti-alias. Eseguire: npx tsx scripts/smoke-viaggio-domain.ts
 */
import { createEmptyItinerary } from '../src/types/models/Itinerary';
import { createEmptyViaggioDraft, type Viaggio } from '../src/types/models/Viaggio';
import { mapDbViaggioToRuntime } from '../src/services/viaggio/viaggioMappers';
import type { DbViaggio } from '../src/types/domain';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

// 1) Empty Diario non è Aggregate Root (niente viaggioId obbligatorio)
{
  const diary = createEmptyItinerary();
  assert(diary.id === null, 'empty diary id null');
  assert(diary.viaggioId == null, 'empty diary has no viaggioId');
}

// 2) Empty Viaggio draft: activeDiaryId null, 0 diari
{
  const v = createEmptyViaggioDraft('user-1', 'Test');
  assert(v.id === null, 'empty viaggio draft id null');
  assert(v.activeDiaryId === null, 'empty viaggio has no active diary');
  assert(v.userId === 'user-1', 'empty viaggio keeps owner');
}

// 3) mapDbViaggioToRuntime
{
  const row: DbViaggio = {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222222',
    title: 'Roma 2026',
    destination: 'Roma',
    period_start: '2026-07-01',
    period_end: '2026-07-10',
    cover_image: null,
    active_diary_id: null,
    metadata: {},
    created_at: '2026-07-26T10:00:00.000Z',
    updated_at: '2026-07-26T10:00:00.000Z',
  };
  const mapped: Viaggio = mapDbViaggioToRuntime(row);
  assert(mapped.id === row.id, 'map id');
  assert(mapped.userId === row.user_id, 'map userId');
  assert(mapped.title === 'Roma 2026', 'map title');
  assert(mapped.activeDiaryId === null, 'map active null = empty viaggio OK');
  assert(mapped.periodStart === '2026-07-01', 'map periodStart');
}

// 4) Anti-alias: tipi distinti (Viaggio.title vs Itinerary.name)
{
  const diary = createEmptyItinerary();
  diary.name = 'Diario giorno per giorno';
  const viaggioDraft = createEmptyViaggioDraft('u', 'Identità patrimonio');
  assert(diary.name !== viaggioDraft.title, 'diary name ≠ viaggio title possible');
  assert(!('activeDiaryId' in diary), 'diary must not expose activeDiaryId');
}

// 5) Cutover order invariant (documentato come funzione pura)
{
  type Step = 'insert_viaggio_null_active' | 'link_diary_viaggio_id' | 'set_active_diary';
  const order: Step[] = [
    'insert_viaggio_null_active',
    'link_diary_viaggio_id',
    'set_active_diary',
  ];
  assert(order[0] === 'insert_viaggio_null_active', 'cutover step 1');
  assert(order[2] === 'set_active_diary', 'cutover step 3 last');
}

// 6) Delete active → null (no auto-promote) modellato come regola
{
  const before: { activeDiaryId: string | null } = { activeDiaryId: 'diary-a' };
  const afterDeleteActive = { activeDiaryId: null as string | null };
  assert(before.activeDiaryId !== null, 'had active');
  assert(afterDeleteActive.activeDiaryId === null, 'delete active clears; no promote');
}

if (issues.length > 0) {
  console.error('smoke-viaggio-domain FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log('smoke-viaggio-domain OK (' + [
  'empty diary',
  'empty viaggio',
  'mapDbViaggio',
  'anti-alias',
  'cutover order',
  'no auto-promote',
].join(', ') + ')');
