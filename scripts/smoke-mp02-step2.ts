/**
 * Smoke — MP-02 STEP-2 / WF-11 (Ricordi UX · Mappa Maps+cluster · Valigia polish).
 * Pure / source checks (no DB). Eseguire: npx tsx scripts/smoke-mp02-step2.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  filterRicordiMediaForScope,
} from '../src/services/viaggio/viaggioRicordiFilters';
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

function assertIncludes(relativePath: string, needle: string, label: string): void {
  assert(readSrc(relativePath).includes(needle), `${label}: ${needle} in ${relativePath}`);
}

// 1) Day links migration
{
  const mig = readSrc('supabase/migrations/20260727190000_viaggio_ricordi_media_day_links.sql');
  assert(mig.includes('viaggio_ricordi_media_day_links'), 'day links table');
  assert(mig.includes('ON DELETE CASCADE'), 'cascade media delete');
}

// 2) Ricordi service + UX
{
  assertIncludes(
    'src/services/viaggio/viaggioRicordiService.ts',
    'setRicordoMediaDayLinks',
    'set day links',
  );
  assertIncludes(
    'src/services/viaggio/viaggioRicordiService.ts',
    'moveRicordoMediaDay',
    'move day',
  );
  assertIncludes(
    'src/components/myspace/ViaggioRicordiSection.tsx',
    'ricordi-day-all',
    'all-trip day',
  );
  assertIncludes(
    'src/components/myspace/ViaggioRicordiSection.tsx',
    'ricordi-folder-${kind}',
    'FOTO/VIDEO folders',
  );
  assertIncludes(
    'src/components/myspace/ViaggioRicordiSection.tsx',
    'Elimina da TouringDiary',
    'delete TD copy',
  );
}

// 3) filter scope
{
  const media: ViaggioRicordoMedia[] = [
    {
      id: 'a',
      viaggioId: 'v',
      userId: 'u',
      kind: 'photo',
      dayKey: 'd1',
      dayKeys: ['d1', 'd2'],
      title: null,
      storagePath: 'x',
      mimeType: 'image/jpeg',
      sizeBytes: 1,
      coordsLat: null,
      coordsLng: null,
      createdAt: '',
    },
    {
      id: 'b',
      viaggioId: 'v',
      userId: 'u',
      kind: 'video',
      dayKey: 'd2',
      dayKeys: ['d2'],
      title: null,
      storagePath: 'y',
      mimeType: 'video/mp4',
      sizeBytes: 1,
      coordsLat: null,
      coordsLng: null,
      createdAt: '',
    },
  ];
  assert(filterRicordiMediaForScope(media, null).length === 2, 'scope all');
  assert(filterRicordiMediaForScope(media, 'd1').length === 1, 'scope d1');
  assert(filterRicordiMediaForScope(media, 'd2').length === 2, 'scope d2 multi');
}

// 4) Mappa embed + clustering + POI
{
  assertIncludes(
    'src/components/myspace/ViaggioMappaGoogleEmbed.tsx',
    'MarkerClusterer',
    'clusterer',
  );
  assertIncludes(
    'src/components/myspace/ViaggioMappaSection.tsx',
    'mappa-open-poi',
    'open POI CTA',
  );
  assertIncludes(
    'src/components/myspace/ViaggioMappaSection.tsx',
    "returnTo: 'mySpace'",
    'return MySpace',
  );
  assertIncludes('.env.example', 'VITE_GOOGLE_MAPS_API_KEY', 'maps env');
}

// 5) Pin carries POI
{
  const diary: Itinerary = {
    id: 'd1',
    name: 'T',
    startDate: null,
    endDate: null,
    items: [
      {
        id: 'i1',
        cityId: 'c1',
        dayIndex: 0,
        timeSlotStr: '',
        poi: {
          id: 'poi-9',
          name: 'X',
          category: 'monument',
          description: '',
          imageUrl: '',
          rating: 0,
          votes: 0,
          coords: { lat: 1, lng: 2 },
          address: '',
        },
      },
    ],
    createdAt: 0,
  };
  const pins = unionViaggioMapPins([diary], []);
  assert(pins[0]?.poiId === 'poi-9', 'poiId on pin');
  assert(pins[0]?.poi?.id === 'poi-9', 'poi snapshot on pin');
}

// 6) Valigia create/link
{
  assertIncludes('src/components/myspace/ViaggioValigiaSection.tsx', 'valigia-create', 'create CTA');
  assertIncludes('src/components/myspace/ViaggioValigiaSection.tsx', 'valigia-link-panel', 'link panel');
  assertIncludes(
    'src/components/myspace/ViaggioValigiaSection.tsx',
    'linkSuitcaseToViaggio',
    'uses link service',
  );
}

// 7) Diario save untouched (gate)
{
  const diarySection = readSrc('src/components/myspace/ViaggioDiarioSection.tsx');
  assert(!diarySection.includes('useDiaryDocumentSave'), 'Diario section no save hook');
  assert(!diarySection.includes('useDocumentSaveController'), 'Diario section no save controller');
}

// 8) GlobalAlert mounted
{
  assertIncludes('src/components/layout/AppCoordinator.tsx', 'GlobalAlert', 'GlobalAlert mount');
}

if (issues.length > 0) {
  console.error('smoke-mp02-step2 FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log('smoke-mp02-step2 OK');
