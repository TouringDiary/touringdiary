/**
 * Smoke — MP-01 STEP-4 / WF-08 (collaborazione allineata DOC 28 Parte A).
 * Pure logic su costanti/modelli/sorgenti reali (no DB, evita import @/ pesanti).
 * Eseguire: npx tsx scripts/smoke-collaboration-step4.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHARED_RESOURCE_KINDS } from '../src/domain/collaboration/sharedResource';
import {
  WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL,
  buildWorkspaceViaggioShellSettings,
  isWorkspaceViaggioShellSettings,
  readWorkspaceViaggioShellSettings,
  resolvePopulatedSectionsFromResources,
} from '../src/domain/collaboration/workspaceViaggioShell';
import { VIAGGIO_FOLDER_SECTION_IDS } from '../src/myspace/viaggioFolderSections';

const issues: string[] = [];
const root = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

// 1) Nessun kind viaggio shareable
{
  assert(!(SHARED_RESOURCE_KINDS as readonly string[]).includes('viaggio'), 'no viaggio shared kind');
  assert(SHARED_RESOURCE_KINDS.includes('diary'), 'diary shareable');
  assert(SHARED_RESOURCE_KINDS.includes('suitcase'), 'suitcase shareable');
}

// 2) ShareIntent copy-only (sorgenti)
{
  const presentation = readSrc('src/components/collaboration/collaborationSharePresentation.ts');
  assert(
    presentation.includes("export type ShareIntent = 'duplicate_and_share'"),
    'ShareIntent = duplicate_and_share only',
  );
  assert(!presentation.includes("'share_current'"), 'presentation: no share_current');
  assert(
    presentation.includes("Nessuno step share_intent"),
    'wizard steps comment: no share_intent',
  );
  const materialize = readSrc(
    'src/services/collaboration/workspaceComposition/materializeWorkspaceComposition.ts',
  );
  assert(!materialize.includes("shareIntent === 'share_current'"), 'materialize: no share_current branch');
  const wizard = readSrc('src/components/collaboration/CollaborationShareWizard.tsx');
  assert(!wizard.includes('Condividi Originale'), 'wizard: no Condividi Originale');
}

// 3) Wizard steps: nessun share_intent nei percorsi prodotto
{
  const presentation = readSrc('src/components/collaboration/collaborationSharePresentation.ts');
  assert(
    presentation.includes("return ['workspace_setup', 'workspace_composition', 'workspace_invite']"),
    'create / from_viaggio steps without share_intent',
  );
  assert(presentation.includes("return ['pick_element']"), 'add_element = pick only');
  assert(presentation.includes("return ['path', 'mode', 'invite']"), 'simple path without share_intent');
  assert(
    presentation.includes("'workspace_from_viaggio'"),
    'workspace_from_viaggio in presentation',
  );
}

// 4) Morphologia viaggio_shell
{
  const settings = buildWorkspaceViaggioShellSettings({
    sourceViaggioId: 'v1',
    resources: [{ kind: 'diary' }, { kind: 'suitcase' }],
  });
  assert(settings.morphology === WORKSPACE_MORPHOLOGY_VIAGGIO_SHELL, 'morphology viaggio_shell');
  assert(settings.sourceViaggioId === 'v1', 'sourceViaggioId');
  assert(settings.populatedSections.includes('diario'), 'populated diario');
  assert(settings.populatedSections.includes('valigia'), 'populated valigia');
  assert(!settings.populatedSections.includes('ricordi'), 'ricordi empty when uncopied');
  assert(isWorkspaceViaggioShellSettings(settings), 'isWorkspaceViaggioShellSettings');
  assert(readWorkspaceViaggioShellSettings(settings) !== null, 'read shell settings');
  assert(readWorkspaceViaggioShellSettings({}) === null, 'empty settings = flat hub');
  const sections = resolvePopulatedSectionsFromResources([{ kind: 'user_template' }]);
  assert(sections.length === 0, 'template does not populate DOC 37 sections');
  for (const id of settings.populatedSections) {
    assert((VIAGGIO_FOLDER_SECTION_IDS as readonly string[]).includes(id), `section ${id} in DOC 37`);
  }
}

// 5) Entry prodotto + catalogo da viaggio
{
  const hook = readSrc('src/hooks/useOpenWorkspaceFromViaggio.ts');
  assert(hook.includes("entryMode: 'workspace_from_viaggio'"), 'hook entryMode');
  const folder = readSrc('src/components/myspace/ViaggioFolderShell.tsx');
  assert(folder.includes('useOpenWorkspaceFromViaggio'), 'folder entry hook');
  assert(folder.includes('myspace-workspace-from-viaggio'), 'folder CTA testid');
  const catalog = readSrc(
    'src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionCatalogFromViaggio.ts',
  );
  assert(
    catalog.includes('export async function resolveWorkspaceCompositionCatalogFromViaggio'),
    'catalog from viaggio export',
  );
  const modal = readSrc('src/components/collaboration/CollaborationShareModal.tsx');
  assert(modal.includes('useCollaborationShareBootstrap'), 'modal uses bootstrap hook');
  assert(modal.includes('useCollaborationShareWizardActions'), 'modal uses wizard actions hook');
  const loaders = readSrc('src/components/collaboration/collaborationShareLoaders.ts');
  assert(loaders.includes('loadViaggioWorkspaceCatalog'), 'modal viaggio catalog loader');
  const wizardActions = readSrc('src/components/collaboration/useCollaborationShareWizardActions.ts');
  assert(
    wizardActions.includes('buildWorkspaceViaggioShellSettings'),
    'modal persists shell settings',
  );
}

// 6) Delete isolation — copie diary senza viaggio_id
{
  const personal = readSrc('src/services/collaboration/personalShareService.ts');
  assert(personal.includes('viaggio_id: null'), 'diary copy sets viaggio_id null');
  assert(
    personal.includes('delete MySpace') || personal.includes('staccata dal Viaggio'),
    'delete isolation comment',
  );
}

// 7) Allegati ownership UX
{
  const allegati = readSrc('src/components/workspace/global/sections/AllegatiSection.tsx');
  assert(allegati.includes('Allegati del Viaggio'), 'allegati ownership note');
  const shellNav = readSrc('src/components/workspace/global/WorkspaceViaggioShellNav.tsx');
  assert(shellNav.includes('workspace-viaggio-shell'), 'hub shell nav');
}

if (issues.length > 0) {
  console.error('FAIL smoke-collaboration-step4:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  'OK smoke-collaboration-step4 (no viaggio kind, copy-only, wizard steps, viaggio_shell, entry+catalog, delete isolation, allegati note)',
);
