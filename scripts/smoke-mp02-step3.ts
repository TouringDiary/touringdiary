/**
 * Smoke — MP-02 STEP-3 / WF-12 (Preferiti · Esploratore · Strumenti · Inviti).
 * Pure / source checks (no DB). Eseguire: npx tsx scripts/smoke-mp02-step3.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MY_SPACE_ROOT_IDS } from '../src/myspace/mySpaceRoots';

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

function parseMigrationEntityKinds(migrationSql: string): string[] {
  const match = migrationSql.match(/entity_kind IN \(\s*([\s\S]*?)\s*\)/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

function parseTsEntityKinds(serviceSrc: string): string[] {
  const match = serviceSrc.match(
    /export const USER_FAVORITE_ENTITY_KINDS = \[([\s\S]*?)\] as const/,
  );
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

// 1) Migration Preferiti + Esploratore + entity_kind ↔ TS
{
  const mig = readSrc('supabase/migrations/20260728120000_user_favorites_and_visited_cities.sql');
  assert(mig.includes('user_favorites'), 'user_favorites table');
  assert(mig.includes('user_visited_cities'), 'user_visited_cities table');
  assert(mig.includes("source IN ('auto', 'manual')"), 'visited source check');
  assert(!mig.includes('REFERENCES public.viaggi'), 'no viaggio FK on visited cities');
  assert(
    mig.includes('USER_FAVORITE_ENTITY_KINDS in userFavoritesService.ts'),
    'migration references TS entity_kind SoT',
  );
  const sqlKinds = parseMigrationEntityKinds(mig);
  const tsKinds = parseTsEntityKinds(readSrc('src/services/myspace/userFavoritesService.ts'));
  assert(
    sqlKinds.length === tsKinds.length && sqlKinds.every((k, i) => k === tsKinds[i]),
    `entity_kind parity SQL/TS (${sqlKinds.join(',')} vs ${tsKinds.join(',')})`,
  );
}

// 2) Root ids
{
  assert(MY_SPACE_ROOT_IDS.includes('favorites'), 'favorites root');
  assert(MY_SPACE_ROOT_IDS.includes('explorer'), 'explorer root');
  assert(MY_SPACE_ROOT_IDS.includes('tools'), 'tools root');
  assert(MY_SPACE_ROOT_IDS.includes('invites'), 'invites root');
}

// 3) Shell wiring (no placeholder for STEP-3 roots)
{
  const shell = readSrc('src/components/myspace/MySpaceMinimalShell.tsx');
  assert(shell.includes('MySpaceFavoritesRoot'), 'favorites root wired');
  assert(shell.includes('MySpaceExplorerRoot'), 'explorer root wired');
  assert(shell.includes('MySpaceToolsRoot'), 'tools root wired');
  assert(shell.includes('MySpaceInvitesRoot'), 'invites root wired');
  assert(!shell.includes('MySpaceSectionPlaceholder'), 'placeholder removed from shell');
}

// 4) Preferiti layout + Segnalibro
{
  assertIncludes(
    'src/components/myspace/MySpaceFavoritesRoot.tsx',
    'data-testid="myspace-favorites-cities-section"',
    'cities section testid',
  );
  assertIncludes(
    'src/components/myspace/MySpaceFavoritesRoot.tsx',
    'data-testid="myspace-favorites-other-section"',
    'other favorites section testid',
  );
  assertIncludes(
    'src/components/myspace/MySpaceFavoritesRoot.tsx',
    'data-testid="myspace-favorites-recap-section"',
    'poi recap section testid',
  );
  assertIncludes(
    'src/components/myspace/FavoriteBookmarkButton.tsx',
    'data-testid={`favorite-bookmark-${entityKind}`}',
    'segnalibro testid',
  );
  assertIncludes(
    'src/components/myspace/FavoriteBookmarkButton.tsx',
    'Bookmark',
    'segnalibro icon',
  );
}

// 5) Esploratore sync + batch city ids
{
  assertIncludes(
    'src/services/myspace/userVisitedCitiesService.ts',
    'listCityIdsForViaggi',
    'batch city ids from viaggi',
  );
  assertIncludes(
    'src/services/viaggio/viaggioCityService.ts',
    'listDiariesByViaggioIds',
    'batch diaries helper',
  );
  assertIncludes(
    'src/services/myspace/userVisitedCitiesService.ts',
    'removeVisitedCity',
    'manual remove',
  );
  assertIncludes(
    'src/components/myspace/ViaggioFolderShell.tsx',
    'syncVisitedCitiesFromViaggio',
    'sync on folder open',
  );
}

// 6) Strumenti packing
{
  assertIncludes(
    'src/components/myspace/MySpaceToolsRoot.tsx',
    "openModal('packingList'",
    'open packing from tools',
  );
  assertIncludes(
    'src/components/myspace/MySpaceToolsRoot.tsx',
    'fetchUserOwnedTemplatesAsync',
    'templates list',
  );
}

// 7) Inviti tabs + batch workspace names
{
  assertIncludes(
    'src/components/myspace/MySpaceInvitesRoot.tsx',
    'myspace-invites-tab-',
    'invites tab testids',
  );
  assertIncludes(
    'src/components/myspace/MySpaceInvitesRoot.tsx',
    "id: 'pending'",
    'pending tab id',
  );
  assertIncludes(
    'src/components/myspace/MySpaceInvitesRoot.tsx',
    "id: 'received'",
    'received tab id',
  );
  assertIncludes(
    'src/components/myspace/MySpaceInvitesRoot.tsx',
    "id: 'sent'",
    'sent tab id',
  );
  assertIncludes(
    'src/components/myspace/MySpaceInvitesRoot.tsx',
    'getWorkspaceNamesByIds',
    'batch workspace names',
  );
  assertIncludes(
    'src/services/collaboration/workspaceInviteService.ts',
    'listOutgoingWorkspaceInvitesForUser',
    'outgoing invites API',
  );
  assertIncludes(
    'src/services/collaboration/workspaceInviteService.ts',
    'listIncomingWorkspaceInvitesForUser',
    'incoming invites API',
  );
}

// 8) Responsive grids mobile-first
{
  assertIncludes(
    'src/components/myspace/MySpaceFavoritesRoot.tsx',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'favorites responsive grid',
  );
  assertIncludes(
    'src/components/myspace/MySpaceExplorerRoot.tsx',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'explorer responsive grid',
  );
  assertIncludes(
    'src/components/myspace/MySpaceToolsRoot.tsx',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'tools responsive grid',
  );
}

if (issues.length > 0) {
  console.error('MP-02 STEP-3 smoke FAILED:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

console.log('MP-02 STEP-3 smoke OK');
