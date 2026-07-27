import { supabase } from '@/services/supabaseClient';
import type {
  SharedResourceKind,
  Workspace,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { mapWorkspaceRow } from './workspaceMappers';
import { createWorkspace, deleteWorkspace, getWorkspace } from './workspaceService';
import {
  addWorkspaceResource,
  setWorkspaceResourcePermissionsForUser,
} from './workspaceResourceService';
import {
  getWorkspaceResourceByKindAndId,
  listWorkspaceResourceLinks,
} from './workspaceResourceLinkLookup';

export interface WorkspaceCompositionResource {
  kind: SharedResourceKind;
  resourceId: string;
}

export interface WorkspaceMemberPermissionDraft {
  userId: string;
  permissions: WorkspaceResourcePermissionEntry[];
}

export type CreateWorkspaceWithCompositionResult =
  | { success: true; workspace: Workspace }
  | { success: false; error: string };

/**
 * Suggerisce la composizione iniziale partendo da una risorsa (§12.0).
 * Per un Diario include le Valigie collegate tramite pivot itinerary_suitcases.
 */
export async function suggestWorkspaceCompositionFromResource(
  kind: SharedResourceKind,
  resourceId: string
): Promise<WorkspaceCompositionResource[]> {
  const composition: WorkspaceCompositionResource[] = [{ kind, resourceId }];

  if (kind !== 'diary') {
    return composition;
  }

  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('suitcase_id')
    .eq('itinerary_id', resourceId);

  if (error) {
    console.error('[workspaceCompositionService] suggestWorkspaceCompositionFromResource:', error.message);
    return composition;
  }

  for (const row of data ?? []) {
    if (row.suitcase_id) {
      composition.push({ kind: 'suitcase', resourceId: row.suitcase_id });
    }
  }

  return composition;
}

export async function createWorkspaceWithComposition(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    settings?: Record<string, unknown>;
    resources?: WorkspaceCompositionResource[];
    memberPermissions?: WorkspaceMemberPermissionDraft[];
  }
): Promise<CreateWorkspaceWithCompositionResult> {
  const resources = input.resources ?? [];
  const diaryCount = resources.filter((resource) => resource.kind === 'diary').length;
  if (diaryCount > 1) {
    return {
      success: false,
      error: 'Il Workspace può contenere al massimo un Diario.',
    };
  }
  const createResult = await createWorkspace({
    ownerId,
    name: input.name,
    description: input.description,
    settings: input.settings,
  });
  if (createResult.success !== true) {
    return createResult;
  }

  const workspace = createResult.workspace;

  for (const resource of input.resources ?? []) {
    const addResult = await addWorkspaceResource(workspace.id, ownerId, resource);
    if (addResult.success !== true) {
      await deleteWorkspace(workspace.id, ownerId);
      return { success: false, error: addResult.error };
    }
  }

  for (const memberDraft of input.memberPermissions ?? []) {
    const permResult = await setWorkspaceResourcePermissionsForUser(
      workspace.id,
      ownerId,
      memberDraft.userId,
      memberDraft.permissions
    );
    if (!permResult.success) {
      await deleteWorkspace(workspace.id, ownerId);
      return { success: false, error: permResult.error ?? 'Impossibile impostare i permessi.' };
    }
  }

  return { success: true, workspace };
}

export async function createWorkspaceFromResource(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    seedResource: WorkspaceCompositionResource;
    includeSuggestedComposition?: boolean;
    memberPermissions?: WorkspaceMemberPermissionDraft[];
  }
): Promise<CreateWorkspaceWithCompositionResult> {
  const resources = input.includeSuggestedComposition !== false
    ? await suggestWorkspaceCompositionFromResource(
        input.seedResource.kind,
        input.seedResource.resourceId
      )
    : [input.seedResource];

  return createWorkspaceWithComposition(ownerId, {
    name: input.name,
    description: input.description,
    resources,
    memberPermissions: input.memberPermissions,
  });
}

export async function addResourceToExistingWorkspace(
  workspaceId: string,
  actorId: string,
  resource: WorkspaceCompositionResource,
  memberPermissions?: WorkspaceMemberPermissionDraft[]
): Promise<{ success: boolean; error?: string }> {
  const addResult = await addWorkspaceResource(workspaceId, actorId, resource);
  if (addResult.success !== true) {
    return { success: false, error: addResult.error };
  }

  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    return { success: false, error: 'Workspace non trovato.' };
  }

  for (const memberDraft of memberPermissions ?? []) {
    const permissionsWithNewResource: WorkspaceResourcePermissionEntry[] = [
      ...memberDraft.permissions,
    ];
    const hasEntry = permissionsWithNewResource.some(
      (entry) => entry.kind === resource.kind && entry.resourceId === resource.resourceId
    );
    if (!hasEntry) {
      permissionsWithNewResource.push({
        kind: resource.kind,
        resourceId: resource.resourceId,
        accessLevel: 'none',
      });
    }

    const permResult = await setWorkspaceResourcePermissionsForUser(
      workspaceId,
      workspace.ownerId,
      memberDraft.userId,
      permissionsWithNewResource
    );
    if (!permResult.success) {
      return permResult;
    }
  }

  return { success: true };
}

export async function isResourceInWorkspace(
  workspaceId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<boolean> {
  const linked = await getWorkspaceResourceByKindAndId(workspaceId, kind, resourceId);
  return linked !== null;
}

export async function listWorkspacesContainingResource(
  kind: SharedResourceKind,
  resourceId: string
): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspace_resources')
    .select('workspace_id, workspaces(*)')
    .eq('kind', kind)
    .eq('resource_id', resourceId);

  if (error) {
    console.error('[workspaceCompositionService] listWorkspacesContainingResource:', error.message);
    return [];
  }

  const workspaces: Workspace[] = [];

  for (const row of data ?? []) {
    const workspace = row.workspaces;
    if (workspace && !Array.isArray(workspace) && isSharedResourceKind(kind)) {
      workspaces.push(mapWorkspaceRow(workspace));
    }
  }

  return workspaces;
}

export async function listWorkspaceComposition(
  workspaceId: string
): Promise<WorkspaceCompositionResource[]> {
  const resources = await listWorkspaceResourceLinks(workspaceId);
  return resources.map((resource) => ({
    kind: resource.kind,
    resourceId: resource.resourceId,
  }));
}
