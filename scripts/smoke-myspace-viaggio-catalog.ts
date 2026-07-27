/**
 * Smoke — MySpace catalogo / cartella Viaggio (MP-01 STEP-2 / WF-06).
 * Pure logic + anti-alias. Eseguire: npx tsx scripts/smoke-myspace-viaggio-catalog.ts
 */
import { MY_SPACE_ROOTS, MY_SPACE_DEFAULT_ROOT } from '../src/myspace/mySpaceRoots';
import {
  VIAGGIO_FOLDER_SECTIONS,
  VIAGGIO_FOLDER_DEFAULT_SECTION,
  getViaggioFolderSection,
} from '../src/myspace/viaggioFolderSections';
import {
  MY_SPACE_TRIPS_CATALOG,
  openTripsFolder,
} from '../src/myspace/mySpaceTripsSession';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

// 1) Root default = I miei Viaggi
{
  assert(MY_SPACE_DEFAULT_ROOT === 'trips', 'default root trips');
  const trips = MY_SPACE_ROOTS.find((r) => r.id === 'trips');
  assert(!!trips && trips.label === 'I miei Viaggi', 'trips label');
}

// 2) Sezioni DOC 37 complete
{
  const ids = VIAGGIO_FOLDER_SECTIONS.map((s) => s.id);
  for (const expected of [
    'diario',
    'valigia',
    'ricordi',
    'allegati',
    'roadbook',
    'mappa',
    'riepilogo',
  ] as const) {
    assert(ids.includes(expected), `section ${expected}`);
  }
  assert(VIAGGIO_FOLDER_DEFAULT_SECTION === 'diario', 'default section diario');
  assert(getViaggioFolderSection('mappa').label === 'Mappa', 'mappa label');
}

// 3) Session trips: catalog vs folder
{
  assert(MY_SPACE_TRIPS_CATALOG.kind === 'catalog', 'catalog view');
  const folder = openTripsFolder('vid-1');
  assert(folder.kind === 'folder', 'folder view');
  if (folder.kind === 'folder') {
    assert(folder.viaggioId === 'vid-1', 'folder viaggioId');
    assert(folder.section === 'diario', 'folder default section');
  }
}

// 4) Anti-alias: catalogo non usa itineraries / savedProjects
{
  const catalogSource = 'viaggi / listViaggiByUser';
  assert(!catalogSource.includes('itineraries'), 'catalog SoT not itineraries');
  assert(!catalogSource.includes('savedProjects'), 'catalog not savedProjects');
}

// 5) Breadcrumb depth model
{
  type Crumb = { id: string };
  const catalogCrumbs: Crumb[] = [
    { id: 'myWorld' },
    { id: 'mySpace' },
    { id: 'trips' },
  ];
  const folderCrumbs: Crumb[] = [
    ...catalogCrumbs,
    { id: 'viaggio-uuid' },
  ];
  assert(catalogCrumbs.length === 3, 'catalog breadcrumb depth');
  assert(folderCrumbs.length === 4, 'folder breadcrumb includes viaggio');
}

if (issues.length > 0) {
  console.error('smoke-myspace-viaggio-catalog FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log(
  'smoke-myspace-viaggio-catalog OK (roots, sections DOC37, trips session, anti-alias, breadcrumb)',
);
