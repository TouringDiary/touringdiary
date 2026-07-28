/**
 * Smoke — MP-01 STEP-3 / WF-07 (Diario multi, Valigia-viaggio, Roadbook library).
 * Pure logic su costanti/modelli/sorgenti reali (no DB, no import runtime dei service pesanti).
 * Eseguire: npx tsx scripts/smoke-viaggio-step3.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VIAGGIO_FOLDER_SECTION_IDS, VIAGGIO_FOLDER_SECTIONS } from '../src/myspace/viaggioFolderSections';
import type { ViaggioRoadbookArtifact } from '../src/types/models/ViaggioRoadbookArtifact';

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

// 1) Sezioni operative STEP-3 dalla nav cartella condivisa
{
  assert(VIAGGIO_FOLDER_SECTION_IDS.includes('diario'), 'section id diario');
  assert(VIAGGIO_FOLDER_SECTION_IDS.includes('valigia'), 'section id valigia');
  assert(VIAGGIO_FOLDER_SECTION_IDS.includes('roadbook'), 'section id roadbook');
  assert(
    VIAGGIO_FOLDER_SECTIONS.some((s) => s.id === 'diario' && s.label === 'Diario'),
    'section label Diario',
  );
}

// 2) Surface service STEP-3 + WF-13 create Diario (modale / association hub)
{
  assertExportedAsyncFunction('src/services/viaggio/viaggioDiaryService.ts', 'listDiariesByViaggio');
  assertExportedAsyncFunction(
    'src/services/viaggio/resourceAssociationService.ts',
    'createDiaryWithAssociation',
  );
  assertExportedAsyncFunction('src/services/viaggio/viaggioSuitcaseService.ts', 'listSuitcasesByViaggio');
  assertExportedAsyncFunction('src/services/viaggio/viaggioSuitcaseService.ts', 'linkSuitcaseToViaggio');
  assertExportedAsyncFunction(
    'src/services/viaggio/viaggioRoadbookService.ts',
    'listRoadbookArtifactsByViaggio',
  );
  assertExportedAsyncFunction(
    'src/services/viaggio/viaggioRoadbookService.ts',
    'createRoadbookArtifactFromDiary',
  );
  assertExportedAsyncFunction(
    'src/services/viaggio/viaggioRoadbookService.ts',
    'insertRoadbookArtifactSnapshot',
  );
}

// 3) Invarianti leggibili dal sorgente (no DB)
{
  const diarySrc = readSrc('src/services/viaggio/viaggioDiaryService.ts');
  assert(!diarySrc.includes("'Campania'"), 'no hardcoded main_city Campania');
  assert(
    !diarySrc.includes('createEmptyDiaryForViaggio'),
    'legacy createEmptyDiaryForViaggio removed (WF-13)',
  );

  const assocSrc = readSrc('src/services/viaggio/resourceAssociationService.ts');
  assert(assocSrc.includes('durationDaysFromPeriod'), 'duration from diary period (WF-13)');
  assert(
    !assocSrc.includes('healViaggioLinks') &&
      !readSrc('src/services/viaggio/viaggioSuitcaseService.ts').includes('healViaggioLinks'),
    'healViaggioLinks removed (WF-13 anti multi-link)',
  );

  const roadbookSrc = readSrc('src/services/viaggio/viaggioRoadbookService.ts');
  assert(
    /diaryId:\s*string\s*;/.test(roadbookSrc) && !/diaryId:\s*string\s*\|\s*null/.test(roadbookSrc),
    'insertRoadbookArtifactSnapshot diaryId: string',
  );
  assert(roadbookSrc.includes('getCityNameById'), 'generateRoadbook uses city name resolution');

  const migration = readSrc(
    'supabase/migrations/20260726190100_create_viaggio_roadbook_artifacts.sql',
  );
  assert(
    /source_diary_id\s+uuid\s+NOT NULL/.test(migration),
    'migration source_diary_id NOT NULL',
  );
  assert(
    migration.includes('(user_id, created_at DESC)'),
    'migration index (user_id, created_at DESC)',
  );
}

// 4) Metadati minimi artifact — modello dominio condiviso
{
  const required: (keyof ViaggioRoadbookArtifact)[] = [
    'viaggioId',
    'sourceDiaryId',
    'name',
    'createdAt',
    'snapshot',
  ];
  const probe: ViaggioRoadbookArtifact = {
    id: 'x',
    viaggioId: 'v',
    sourceDiaryId: 'd',
    userId: 'u',
    name: 'n',
    snapshot: [],
    createdAt: new Date().toISOString(),
  };
  for (const key of required) {
    assert(key in probe, `ViaggioRoadbookArtifact.${key}`);
  }
  assert(typeof probe.sourceDiaryId === 'string', 'sourceDiaryId required string');
}

if (issues.length > 0) {
  console.error('smoke-viaggio-step3 FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log(
  'smoke-viaggio-step3 OK (folder sections, service exports, source invariants, artifact model)',
);
