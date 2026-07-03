import { supabase } from '@/services/supabaseClient';
import type {
  SharedResourceKind,
  WorkspaceMemberWithProfile,
  WorkspaceResource,
  WorkspaceResourcePermission,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import { isSharedResourceKind, isWorkspaceResourceAccess } from '@/domain/collaboration';
import { isShareableResourceOwner } from './sharedResourceOwnershipVerifiers';
import {
  mapWorkspaceMemberWithProfile,
  mapWorkspaceResourcePermissionRow,
  mapWorkspaceResourceRow,
  type MemberWithProfileRow,
} from './workspaceMappers';
import { getWorkspace, isWorkspaceMember, isWorkspaceOwner } from './workspaceService';
import { notifyWorkspaceSuitcaseAdded } from './workspaceNotificationHelper';
import { resolveResourcePermission } from './permissionService';
import {
  getWorkspaceResourceByKindAndId as lookupWorkspaceResource,
  listWorkspaceResourceLinks,
} from './workspaceResourceLinkLookup';

export { getWorkspaceResourceAccessForUser } from './workspaceAccessLookup';

export type WorkspaceResourceResult =
  | { success: true; resource: WorkspaceResource }
  | { success: false; error: string };

export interface AddWorkspaceResourceInput {
  kind: SharedResourceKind;
  resourceId: string;
}

async function canActorLinkResource(
  workspaceId: string,
  actorId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<string | null> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    return 'Workspace non trovato.';
  }

  if (await isWorkspaceOwner(workspaceId, actorId)) {
    const ownsResource = await isShareableResourceOwner(kind, resourceId, actorId);
    if (ownsResource) {
      return null;
    }
    const permission = await resolveResourcePermission(actorId, kind, resourceId);
    if (permission.capabilities.canView) {
      return null;
    }
    return 'Non hai accesso a questa risorsa.';
  }

  if (!(await isWorkspaceMember(workspaceId, actorId))) {
    return 'Non sei membro di questo workspace.';
  }

  if (kind !== 'suitcase') {
    return 'Solo il proprietario del workspace può aggiungere questa risorsa.';
  }

  const ownsSuitcase = await isShareableResourceOwner('suitcase', resourceId, actorId);
  if (!ownsSuitcase) {
    return 'Puoi aggiungere al workspace solo valigie di tua proprietà.';
  }

  return null;
}

export async function listWorkspaceResources(workspaceId: string): Promise<WorkspaceResource[]> {
  return listWorkspaceResourceLinks(workspaceId);
}

export async function getWorkspaceResourceByKindAndId(
  workspaceId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<WorkspaceResource | null> {
  return lookupWorkspaceResource(workspaceId, kind, resourceId);
}

export async function addWorkspaceResource(
  workspaceId: string,
  actorId: string,
  input: AddWorkspaceResourceInput
): Promise<WorkspaceResourceResult> {
  if (!isSharedResourceKind(input.kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  const linkError = await canActorLinkResource(
    workspaceId,
    actorId,
    input.kind,
    input.resourceId
  );
  if (linkError) {
    return { success: false, error: linkError };
  }

  const existing = await lookupWorkspaceResource(workspaceId, input.kind, input.resourceId);
  if (existing) {
    return { success: false, error: 'Questa risorsa è già nel workspace.' };
  }

  const { data, error } = await supabase
    .from('workspace_resources')
    .insert({
      workspace_id: workspaceId,
      kind: input.kind,
      resource_id: input.resourceId,
      added_by: actorId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[workspaceResourceService] addWorkspaceResource:', error.message);
    return { success: false, error: 'Impossibile aggiungere la risorsa al workspace.' };
  }

  const resource = mapWorkspaceResourceRow(data);
  if (!resource) {
    return { success: false, error: 'Dati risorsa workspace non validi.' };
  }

  if (input.kind === 'suitcase' && !(await isWorkspaceOwner(workspaceId, actorId))) {
    try {
      await notifyWorkspaceSuitcaseAdded(workspaceId, actorId, input.resourceId);
    } catch (notificationError) {
      console.error('[workspaceResourceService] notifyWorkspaceSuitcaseAdded:', notificationError);
    }
  }

  return { success: true, resource };
}

export async function removeWorkspaceResource(
  workspaceId: string,
  ownerId: string,
  workspaceResourceId: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isWorkspaceOwner(workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario del workspace può rimuovere risorse.' };
  }

  const { data, error } = await supabase
    .from('workspace_resources')
    .delete()
    .eq('id', workspaceResourceId)
    .eq('workspace_id', workspaceId)
    .select('id');

  if (error) {
    console.error('[workspaceResourceService] removeWorkspaceResource:', error.message);
    return { success: false, error: 'Impossibile rimuovere la risorsa dal workspace.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Collegamento non trovato.' };
  }

  return { success: true };
}

export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, user_id, created_at, profiles(name, slug, avatar_url)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[workspaceResourceService] listWorkspaceMembers:', error.message);
    return [];
  }

  return (data as MemberWithProfileRow[] | null)
    ?.map(mapWorkspaceMemberWithProfile)
    .filter((member): member is WorkspaceMemberWithProfile => member !== null) ?? [];
}

export async function listWorkspaceResourcePermissions(
  workspaceId: string
): Promise<WorkspaceResourcePermission[]> {
  const { data, error } = await supabase
    .from('workspace_resource_permissions')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[workspaceResourceService] listWorkspaceResourcePermissions:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapWorkspaceResourcePermissionRow)
    .filter((permission): permission is WorkspaceResourcePermission => permission !== null);
}

export async function setWorkspaceResourcePermission(
  workspaceId: string,
  ownerId: string,
  workspaceResourceId: string,
  userId: string,
  accessLevel: WorkspaceResourcePermissionEntry['accessLevel']
): Promise<{ success: boolean; error?: string }> {
  if (!(await isWorkspaceOwner(workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario del workspace può gestire i permessi.' };
  }
  if (!isWorkspaceResourceAccess(accessLevel)) {
    return { success: false, error: 'Livello di accesso non valido.' };
  }

  const workspace = await getWorkspace(workspaceId);
  if (!workspace || userId === workspace.ownerId) {
    return { success: false, error: 'Il proprietario del workspace ha accesso implicito.' };
  }

  const { error } = await supabase.from('workspace_resource_permissions').upsert(
    {
      workspace_id: workspaceId,
      workspace_resource_id: workspaceResourceId,
      user_id: userId,
      access_level: accessLevel,
    },
    { onConflict: 'workspace_resource_id,user_id' }
  );

  if (error) {
    console.error('[workspaceResourceService] setWorkspaceResourcePermission:', error.message);
    return { success: false, error: 'Impossibile aggiornare il permesso.' };
  }

  return { success: true };
}

export async function setWorkspaceResourcePermissionsForUser(
  workspaceId: string,
  ownerId: string,
  userId: string,
  permissions: WorkspaceResourcePermissionEntry[]
): Promise<{ success: boolean; error?: string }> {
  const resources = await listWorkspaceResources(workspaceId);
  const resourceByKey = new Map(
    resources.map((resource) => [`${resource.kind}:${resource.resourceId}`, resource])
  );

  for (const entry of permissions) {
    const linked = resourceByKey.get(`${entry.kind}:${entry.resourceId}`);
    if (!linked) {
      return { success: false, error: 'Risorsa non presente nel workspace.' };
    }
    const result = await setWorkspaceResourcePermission(
      workspaceId,
      ownerId,
      linked.id,
      userId,
      entry.accessLevel
    );
    if (!result.success) {
      return result;
    }
  }

  return { success: true };
}
