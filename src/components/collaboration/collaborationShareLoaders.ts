/**
 * Entry loaders composizione — due flussi distinti, due resolver distinti.
 *
 * | Loader                     | Entry mode              | Resolver                                      |
 * |----------------------------|-------------------------|-----------------------------------------------|
 * | loadCreateWorkspaceCatalog | create_workspace        | resolveWorkspaceCompositionCatalog            |
 * | loadViaggioWorkspaceCatalog| workspace_from_viaggio  | resolveWorkspaceCompositionCatalogFromViaggio |
 */
import {
  createDefaultCompositionDraft,
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  listWorkspacesForUser,
  resolveWorkspaceCompositionCatalog,
  resolveWorkspaceCompositionCatalogFromViaggio,
} from '@/services/collaboration';

export type WorkspaceList = Awaited<ReturnType<typeof listWorkspacesForUser>>;

export type WorkspaceCatalogBootstrap = {
  blueprint: WorkspaceCompositionBlueprint;
  draft: WorkspaceCompositionDraft;
  workspaces: WorkspaceList;
};

/**
 * Entry loader — flusso «Crea Workspace» (`entryMode: 'create_workspace'`).
 * Carica catalogo personale + draft iniziale.
 * Restituisce `null` se la richiesta async non è più valida.
 */
export async function loadCreateWorkspaceCatalog(
  userId: string,
  generation: number,
  isStale: (generation: number) => boolean,
  preselectedDiaryId?: string,
): Promise<WorkspaceCatalogBootstrap | null> {
  const blueprint = await resolveWorkspaceCompositionCatalog({
    ownerId: userId,
    preselectedDiaryId,
  });
  if (isStale(generation)) return null;

  const draft = createDefaultCompositionDraft(blueprint);
  if (isStale(generation)) return null;

  const workspaces = await listWorkspacesForUser(userId);
  if (isStale(generation)) return null;

  return { blueprint, draft, workspaces };
}

/**
 * Entry loader — flusso «Workspace da Viaggio» (`entryMode: 'workspace_from_viaggio'`).
 */
export async function loadViaggioWorkspaceCatalog(
  userId: string,
  viaggioId: string,
  generation: number,
  isStale: (generation: number) => boolean,
  preselectedDiaryId?: string,
): Promise<WorkspaceCatalogBootstrap | null> {
  const blueprint = await resolveWorkspaceCompositionCatalogFromViaggio({
    ownerId: userId,
    viaggioId,
    preselectedDiaryId,
  });
  if (isStale(generation)) return null;

  const draft = createDefaultCompositionDraft(blueprint);
  if (isStale(generation)) return null;

  const workspaces = await listWorkspacesForUser(userId);
  if (isStale(generation)) return null;

  return { blueprint, draft, workspaces };
}
