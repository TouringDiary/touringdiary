/**
 * Smoke — MP-01 STEP-5 / WF-09 (Ricordi · Allegati · Mappa · Riepilogo + gate).
 * Pure logic su costanti/modelli/sorgenti reali (no DB).
 * Eseguire: npx tsx scripts/smoke-viaggio-step5.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  VIAGGIO_FOLDER_SECTION_IDS,
  VIAGGIO_FOLDER_SECTIONS,
  viaggioFolderHasAiSection,
} from '../src/myspace/viaggioFolderSections';
import { MY_SPACE_ROOTS, MY_SPACE_DEFAULT_ROOT } from '../src/myspace/mySpaceRoots';
import {
  buildDaysFromDiaryTimeline,
  buildDaysFromViaggioPeriod,
  buildRicordiDaySlots,
} from '../src/services/viaggio/viaggioRicordiDayStructure';
import { unionViaggioMapPins } from '../src/services/viaggio/viaggioMappaUnion';
import type { Itinerary } from '../src/types/index';
import type { ViaggioRicordoMedia } from '../src/types/models/ViaggioRicordi';

const issues: string[] = [];
const root = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

function assertExportedAsyncFunction(relativePath: string, name: string): void {
  const src = readSrc(relativePath);
  assert(
    src.includes(`export async function ${name}`),
    `export async function ${name} in ${relativePath}`,
  );
}

// 1) Sezioni STEP-5 + stereotipi; nessuna sezione AI
{
  for (const id of ['ricordi', 'allegati', 'mappa', 'riepilogo'] as const) {
    assert(VIAGGIO_FOLDER_SECTION_IDS.includes(id), `section id ${id}`);
  }
  const byId = Object.fromEntries(VIAGGIO_FOLDER_SECTIONS.map((s) => [s.id, s]));
  assert(byId.ricordi?.stereotype === 'Resource', 'ricordi Resource');
  assert(byId.allegati?.stereotype === 'Resource', 'allegati Resource');
  assert(byId.mappa?.stereotype === 'View', 'mappa View');
  assert(byId.riepilogo?.stereotype === 'View', 'riepilogo View');
  assert(byId.roadbook?.stereotype === 'Library', 'roadbook Library');
  assert(!viaggioFolderHasAiSection(), 'no AI section in folder');
}

// 2) Root MySpace gate (DOC 35 labels presenti; trips = default)
{
  assert(MY_SPACE_DEFAULT_ROOT === 'trips', 'default root trips');
  for (const id of ['trips', 'explorer', 'favorites', 'tools', 'invites'] as const) {
    assert(MY_SPACE_ROOTS.some((r) => r.id === id), `myspace root ${id}`);
  }
}

// 3) Service exports STEP-5
{
  assertExportedAsyncFunction('src/services/viaggio/viaggioRicordiService.ts', 'listRicordiMediaByViaggio');
  assertExportedAsyncFunction('src/services/viaggio/viaggioRicordiService.ts', 'uploadRicordoMedia');
  assertExportedAsyncFunction('src/services/viaggio/viaggioRicordiService.ts', 'upsertRicordiDayNote');
  assertExportedAsyncFunction('src/services/viaggio/viaggioAttachmentService.ts', 'listViaggioAttachments');
  assertExportedAsyncFunction('src/services/viaggio/viaggioAttachmentService.ts', 'uploadViaggioAttachment');
  assertExportedAsyncFunction('src/services/viaggio/viaggioMappaService.ts', 'listViaggioMapPins');
  assertExportedAsyncFunction('src/services/viaggio/viaggioRiepilogoService.ts', 'computeViaggioRiepilogo');
  assertExportedAsyncFunction(
    'src/services/viaggio/viaggioRiepilogoService.ts',
    'upsertViaggioRiepilogoAnnotations',
  );
}

// 4) Shell wire + ownership Allegati
{
  const shell = readSrc('src/components/myspace/ViaggioFolderShell.tsx');
  assert(shell.includes('ViaggioRicordiSection'), 'shell wires Ricordi');
  assert(shell.includes('ViaggioAllegatiSection'), 'shell wires Allegati');
  assert(shell.includes('ViaggioMappaSection'), 'shell wires Mappa');
  assert(shell.includes('ViaggioRiepilogoSection'), 'shell wires Riepilogo');

  const allegati = readSrc('src/components/myspace/ViaggioAllegatiSection.tsx');
  assert(allegati.includes('allegati-ownership-note'), 'allegati ownership note');
  assert(allegati.includes('Workspace'), 'allegati distinguishes Workspace');

  const catalog = readSrc('src/components/myspace/MySpaceTripsCatalog.tsx');
  assert(catalog.includes('listViaggiByUser'), 'catalog SoT viaggi');
  assert(!catalog.includes('savedProjects'), 'catalog not savedProjects alias');
}

// 5) Migration tables + buckets
{
  const migration = readSrc(
    'supabase/migrations/20260727120000_create_viaggio_step5_resources.sql',
  );
  assert(migration.includes('viaggio_ricordi_media'), 'migration ricordi media');
  assert(migration.includes('viaggio_ricordi_day_notes'), 'migration day notes');
  assert(migration.includes('viaggio_attachments'), 'migration allegati');
  assert(migration.includes('viaggio_riepilogo_annotations'), 'migration riepilogo');
  assert(migration.includes("'viaggio-ricordi'"), 'bucket ricordi');
  assert(migration.includes("'viaggio-attachments'"), 'bucket allegati');
  assert(
    migration.includes('Distinti da workspace_attachments'),
    'allegati ≠ workspace comment',
  );
  assert(migration.includes('set_viaggio_updated_at'), 'updated_at trigger fn');
  assert(
    migration.includes('trg_viaggio_ricordi_day_notes_updated_at'),
    'trigger day notes updated_at',
  );
  assert(
    migration.includes('trg_viaggio_riepilogo_annotations_updated_at'),
    'trigger riepilogo updated_at',
  );
  assert(migration.includes('length(trim(day_key)) > 0'), 'CHECK day_key non vuoto');
  assert(migration.includes('length(trim(storage_path)) > 0'), 'CHECK storage_path non vuoto');
  assert(migration.includes('length(trim(mime_type)) > 0'), 'CHECK mime_type non vuoto');
  assert(
    migration.includes('viaggio_ricordi_media_coords_range_chk'),
    'CHECK coords lat/lng range',
  );
}

// 6) Day structure — due modalità
{
  const periodDays = buildDaysFromViaggioPeriod({
    periodStart: '2026-07-01',
    periodEnd: '2026-07-03',
  });
  assert(periodDays.length === 3, 'period 3 days');
  assert(periodDays[0].dayKey === '2026-07-01', 'period first day key ISO');

  const diary: Itinerary = {
    id: 'd1',
    name: 'Test',
    startDate: '2026-08-01',
    endDate: '2026-08-02',
    items: [
      {
        id: 'i1',
        cityId: 'c1',
        dayIndex: 1,
        timeSlotStr: '',
        poi: {
          id: 'p1',
          name: 'Duomo',
          category: 'monument',
          description: '',
          imageUrl: '',
          rating: 0,
          votes: 0,
          coords: { lat: 45.46, lng: 9.19 },
          address: 'Milano',
        },
      },
    ],
    createdAt: 0,
  };
  const timeline = buildDaysFromDiaryTimeline(diary);
  assert(timeline.length >= 2, 'diary timeline >= 2 days');
  assert(timeline[0].dayKey === 'd0', 'diary day key d0');

  const slotsPeriod = buildRicordiDaySlots({
    mode: 'viaggio_period',
    viaggio: { periodStart: '2026-07-01', periodEnd: '2026-07-01' },
    diary: null,
  });
  assert(slotsPeriod.length === 1, 'buildRicordiDaySlots period');

  const slotsDiary = buildRicordiDaySlots({
    mode: 'diary_timeline',
    viaggio: { periodStart: null, periodEnd: null },
    diary,
  });
  assert(slotsDiary.length >= 2, 'buildRicordiDaySlots diary');
}

// 7) Mappa union (pure)
{
  const diary: Itinerary = {
    id: 'd1',
    name: 'Test',
    startDate: null,
    endDate: null,
    items: [
      {
        id: 'i1',
        cityId: 'c1',
        dayIndex: 0,
        timeSlotStr: '',
        poi: {
          id: 'p1',
          name: 'Duomo',
          category: 'monument',
          description: '',
          imageUrl: '',
          rating: 0,
          votes: 0,
          coords: { lat: 45.46, lng: 9.19 },
          address: 'Milano',
        },
      },
      {
        id: 'i2',
        cityId: 'c1',
        dayIndex: 0,
        timeSlotStr: '',
        poi: {
          id: 'p2',
          name: 'Zero',
          category: 'monument',
          description: '',
          imageUrl: '',
          rating: 0,
          votes: 0,
          coords: { lat: 0, lng: 0 },
          address: '',
        },
      },
    ],
    createdAt: 0,
  };
  const media: ViaggioRicordoMedia[] = [
    {
      id: 'm1',
      viaggioId: 'v1',
      userId: 'u1',
      kind: 'photo',
      dayKey: '2026-07-01',
      dayKeys: ['2026-07-01'],
      title: 'Sunset',
      storagePath: 'u1/v1/x.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 10,
      coordsLat: 44.1,
      coordsLng: 10.2,
      createdAt: new Date().toISOString(),
    },
  ];
  const pins = unionViaggioMapPins([diary], media);
  assert(pins.length === 2, 'union excludes 0,0 coords');
  assert(pins.some((p) => p.source === 'diary_poi'), 'has diary pin');
  assert(pins.some((p) => p.source === 'ricordo_media'), 'has media pin');
  assert(pins.some((p) => p.source === 'diary_poi' && p.poiId === 'p1'), 'diary pin has poiId');
}

if (issues.length > 0) {
  console.error('smoke-viaggio-step5 FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log(
  'smoke-viaggio-step5 OK (stereotypes, services, shell, day modes, map union, gate catalog)',
);
