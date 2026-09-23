/**
 * MF5 — smoke statico (invarianti MF5, no DB, no import app graph)
 * Eseguire: npm run mf5:smoke
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const issues: string[] = [];
const root = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.resolve(root, relPath), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

function assertFileContains(relPath: string, snippet: string, label: string): void {
  const source = read(relPath);
  assert(source.includes(snippet), `${relPath}: ${label}`);
}

function assertFileMatches(relPath: string, pattern: RegExp, label: string): void {
  const source = read(relPath);
  assert(pattern.test(source), `${relPath}: ${label}`);
}

function sliceBetweenAnchors(
  relPath: string,
  source: string,
  startAnchor: string,
  endAnchor: string,
  label: string,
): string {
  const start = source.indexOf(startAnchor);
  if (start === -1) {
    issues.push(`${relPath}: anchor mancante (${label}): ${startAnchor}`);
    return '';
  }
  const end = source.indexOf(endAnchor, start + startAnchor.length);
  if (end === -1) {
    issues.push(`${relPath}: anchor mancante (${label}): ${endAnchor}`);
    return '';
  }
  return source.slice(start, end);
}

/** Rimuove solo commenti di blocco/linea (non stringhe — il nome riflette il comportamento reale). */
function stripBlockAndLineComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function hasTopLevelComma(args: string): boolean {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  for (let i = 0; i < args.length; i += 1) {
    const ch = args[i];
    if (inSingle) {
      if (ch === '\\' && i + 1 < args.length) {
        i += 1;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '\\' && i + 1 < args.length) {
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }
    if (ch === '(') {
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === ',' && depth === 0) return true;
  }
  return false;
}

/** Rileva chiamate findExistingPortrait con un solo argomento (parentesi bilanciate, no virgola negli args). */
function hasNameOnlyFindExistingPortraitCall(source: string): boolean {
  const withoutComments = stripBlockAndLineComments(source);
  const marker = 'findExistingPortrait(';
  let searchFrom = 0;

  while (searchFrom < withoutComments.length) {
    const openIdx = withoutComments.indexOf(marker, searchFrom);
    if (openIdx === -1) return false;

    let depth = 1;
    let i = openIdx + marker.length;
    while (i < withoutComments.length && depth > 0) {
      const ch = withoutComments[i];
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      i += 1;
    }

    if (depth !== 0) {
      searchFrom = openIdx + marker.length;
      continue;
    }

    const rawArgs = withoutComments.slice(openIdx + marker.length, i - 1);
    const args = rawArgs.replace(/\s+/g, ' ').trim();
    if (args.length > 0 && !hasTopLevelComma(args)) {
      return true;
    }

    searchFrom = i;
  }

  return false;
}

function assertPortraitCallerCityScoped(relPath: string, expectedCalls: string[]): void {
  const source = read(relPath);
  assert(
    source.includes('findExistingPortrait('),
    `${relPath}: deve chiamare findExistingPortrait`,
  );
  for (const call of expectedCalls) {
    assert(source.includes(call), `${relPath}: chiamata attesa mancante: ${call}`);
  }
  assert(
    !hasNameOnlyFindExistingPortraitCall(source),
    `${relPath}: possibile chiamata findExistingPortrait name-only (un solo argomento)`,
  );
}

// A) mediaService — city-scoped portrait
const mediaService = read('src/services/mediaService.ts');
assert(
  /findExistingPortrait\s*=\s*async\s*\(\s*personName:\s*string,\s*cityId:\s*string/.test(
    mediaService,
  ),
  'mediaService: findExistingPortrait(personName, cityId)',
);
assert(mediaService.includes(".eq('city_id', trimmedCityId)"), 'mediaService: filtro city_id');
assert(
  mediaService.includes('resolvePrimaryImagePublicUrlsForCityPeople'),
  'mediaService: findExistingPortrait risolve da assignment (POST-MF5)',
);
const findExistingPortraitSection = sliceBetweenAnchors(
  'src/services/mediaService.ts',
  mediaService,
  'export const findExistingPortrait',
  'export const getAssetUsageMap',
  'findExistingPortrait section',
);
if (findExistingPortraitSection.length > 0) {
  assert(
    !findExistingPortraitSection.includes('image_url'),
    'mediaService: findExistingPortrait non legge image_url legacy',
  );
  assert(
    !findExistingPortraitSection.includes('image_storage_path'),
    'mediaService: findExistingPortrait non legge image_storage_path legacy',
  );
}
const entityPrimaryImageRead = read('src/services/media/entityPrimaryImageReadService.ts');
const resolvePeopleCutover = sliceBetweenAnchors(
  'src/services/media/entityPrimaryImageReadService.ts',
  entityPrimaryImageRead,
  'export async function resolvePrimaryImagePublicUrlsForCityPeople',
  'export async function applyPrimaryImageCutoverForCityPeople',
  'resolvePrimaryImagePublicUrlsForCityPeople',
);
if (resolvePeopleCutover.length > 0) {
  assert(
    resolvePeopleCutover.includes('loadPrimaryAssignmentIndex') &&
      resolvePeopleCutover.includes('resolvePublicUrlFromIndex') &&
      !resolvePeopleCutover.includes(".from('city_people')"),
    'entityPrimaryImageReadService: resolvePrimaryImagePublicUrlsForCityPeople usa assignment index, no fallback legacy',
  );
}
assertFileMatches(
  'src/services/media/entityPrimaryImageReadService.ts',
  /async function loadPrimaryAssignmentIndex[\s\S]*?\.eq\s*\(\s*['"]assignment_role['"]\s*,\s*['"]primary['"]\s*\)[\s\S]*?\.eq\s*\(\s*['"]is_current['"]\s*,\s*true\s*\)/,
  'loadPrimaryAssignmentIndex: primary + is_current',
);

// B) entityPrimaryImageReadService
assertFileContains(
  'src/services/media/entityPrimaryImageReadService.ts',
  'applyPrimaryImageCutoverForCityPeople',
  'cutover export',
);
assertFileMatches(
  'src/services/media/entityPrimaryImageReadService.ts',
  /type\s+PrimaryEntityType\s*=\s*['"]city_person['"]\s*\|\s*['"]poi['"]\s*\|\s*['"]patron['"]/,
  'cutover entity_type city_person/poi/patron',
);
assertFileMatches(
  'src/services/media/entityPrimaryImageReadService.ts',
  /\.eq\s*\(\s*['"]assignment_role['"]\s*,\s*['"]primary['"]\s*\)/,
  'cutover role primary',
);
assertFileMatches(
  'src/services/media/entityPrimaryImageReadService.ts',
  /\.eq\s*\(\s*['"]is_current['"]\s*,\s*true\s*\)/,
  'cutover is_current',
);
assertFileContains(
  'src/services/media/entityPrimaryImageReadService.ts',
  'fetchMediaAssetsByIds',
  'cutover media_assets batch',
);

// C) assetUsageMapService
assertFileContains(
  'src/services/media/assetUsageMapService.ts',
  'buildAssetUsageMap',
  'usage map export',
);
assertFileContains(
  'src/services/media/assetUsageMapService.ts',
  'mf2EntityImageAssignmentsTable',
  'usage assignments',
);
assert(
  !read('src/services/media/assetUsageMapService.ts').includes('Person (legacy)'),
  'usage map: nessun merge URL legacy personaggi',
);
assert(
  !read('src/services/media/assetUsageMapService.ts').includes('POI (legacy)'),
  'usage map: nessun merge URL legacy POI',
);
assert(
  !read('src/services/media/assetUsageMapService.ts').includes('cityReadService'),
  'assetUsageMapService: no import cityReadService (no cycle)',
);
assertFileContains(
  'src/services/city/poi/poiRead.ts',
  'applyPrimaryImageCutoverForPoisList',
  'poiRead: cutover POST-MF5 su letture POI',
);
assertFileContains(
  'src/services/city/entitiesService.ts',
  'save_city_person_with_image_assignment',
  'saveCityPerson: boundary atomico D90 server-side',
);
assertFileContains(
  'src/services/city/poi/poiWrite.ts',
  'save_poi_with_image_assignment',
  'saveSinglePoi: boundary atomico D90 server-side',
);
assert(
  !read('src/services/city/poi/poiWrite.ts').includes("from('pois').upsert"),
  'poiWrite: nessun upsert diretto pois (D90 RPC)',
);
assertFileContains(
  'src/services/city/poi/poiWrite.ts',
  'delete_poi_with_image_cleanup',
  'deleteSinglePoi: boundary atomico D90 server-side',
);
assert(
  !read('src/services/city/poi/poiWrite.ts').includes("from('pois').delete"),
  'poiWrite: nessun delete diretto pois (D90 RPC)',
);
assert(
  !read('src/services/city/entitiesService.ts').includes('upsertEntityImageAssignmentDualWrite'),
  'entitiesService: nessun dual-write client post-save',
);
assert(
  !existsSync(path.resolve(root, 'src/services/media/imageAssignmentDualWriteService.ts')),
  'imageAssignmentDualWriteService.ts rimosso (dual-write MF2 decommissionato)',
);
const mf2DbClient = read('src/services/reports/mf2DbClient.ts');
assert(
  !mf2DbClient.includes('upsert_entity_image_assignment_dual_write'),
  'mf2DbClient: RPC upsert_entity_image_assignment_dual_write non esposta',
);
assertFileContains(
  'src/services/media/entityPrimaryImageReadService.ts',
  'applyPrimaryImageCutoverForPoisList',
  'cutover POI batch multi-città',
);

// D) backfill script
const backfill = read('scripts/backfill_media_assets_from_legacy.ts');
assert(backfill.includes("execute: flags.has('--execute')"), 'backfill: flag execute');
assert(backfill.includes('DRY-RUN'), 'backfill: dry-run documented');
assert(
  !backfill.includes("flags.has('--execute')") || backfill.includes('!options.execute'),
  'backfill: dry-run branch',
);
assert(
  backfill.includes('city_person') && backfill.includes('poi') && backfill.includes('patron'),
  'backfill: entity types',
);

// E) orphan cleanup
const orphan = read('scripts/cleanup_orphan_storage.ts');
assert(orphan.includes("execute: flags.has('--execute')"), 'orphan: execute flag');
assert(orphan.includes('DRY-RUN'), 'orphan: dry-run default messaging');
assert(
  orphan.includes('verified/') && orphan.includes('wikimedia/'),
  'orphan: MF4 blocked namespaces',
);
assertFileContains(
  'scripts/cleanup_orphan_storage.ts',
  'addUrl(row.source_url',
  'media_assets source_url indicizzato in buildReferenceIndex',
);
assert(
  orphan.includes('fetchAllPaginatedRows') && orphan.includes('REFERENCE_INDEX_PAGE_SIZE'),
  'orphan: paginazione reference index',
);
assert(
  orphan.includes('remainingBudget') && orphan.includes('budget globale condiviso'),
  'orphan: max-objects budget globale condiviso',
);
assert(
  !orphan.includes("'report-evidence'"),
  'orphan: report-evidence escluso da whitelist public-media',
);
assertFileContains(
  'scripts/cleanup_orphan_storage.ts',
  "'content_reports snapshot'",
  'orphan pathReferenced: label content_reports snapshot (no evidence bucket public-media)',
);
assert(
  !orphan.includes("'content_reports snapshot/evidence'"),
  'orphan: label obsoleta content_reports snapshot/evidence assente',
);
assert(
  !orphan.includes('addPublicPath(PUBLIC_BUCKET, row.evidence_storage_path)'),
  'orphan: evidence_storage_path non indicizzato come public-media',
);

// F) entitiesService cutover on read
const entitiesService = read('src/services/city/entitiesService.ts');
assert(
  /filterFamousPeopleByAudience\([\s\S]*?\)[\s\S]*?applyPrimaryImageCutoverForCityPeople\(filtered\)/.test(
    entitiesService,
  ),
  'entitiesService: audience filter prima del cutover (getCityPeople)',
);
assert(
  (entitiesService.match(/applyPrimaryImageCutoverForCityPeople\(filtered\)/g) ?? []).length >= 2,
  'entitiesService: cutover su getCityPeople e getCityPeopleByCityIds',
);

assertPortraitCallerCityScoped('src/hooks/admin/people/usePeopleAI.ts', [
  'findExistingPortrait(person.name, cityId)',
]);

assertPortraitCallerCityScoped('src/hooks/admin/useAiMagicCity.ts', [
  'findExistingPortrait(p.name, cityId)',
]);

assertPortraitCallerCityScoped(
  'src/components/admin/cityEditor/culture/editorCultureRegeneration.ts',
  ['findExistingPortrait(p.name, cityId)'],
);

assertPortraitCallerCityScoped('src/hooks/admin/useAiCompleteCity.ts', [
  'findExistingPortrait(existingMatch.name, cityId)',
  'findExistingPortrait(p.name, cityId)',
]);

if (issues.length > 0) {
  console.error('[smoke-mf5-image-management] FAILED');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('[smoke-mf5-image-management] OK — invarianti statiche MF5');
