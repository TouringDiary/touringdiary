import { supabase } from '@/services/supabaseClient';
import type { WorkspaceInvite, WorkspaceResourcePermissionEntry } from '@/domain/collaboration';
import {
  mapWorkspaceInvitePermissionRow,
  mapWorkspaceInviteRow,
} from './workspaceMappers';

export async function fetchInvitePermissions(
  inviteId: string
): Promise<WorkspaceResourcePermissionEntry[]> {
  const { data, error } = await supabase
    .from('workspace_invite_permissions')
    .select('*')
    .eq('invite_id', inviteId);

  if (error) {
    console.error('[workspaceInviteService] fetchInvitePermissions:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapWorkspaceInvitePermissionRow)
    .filter((entry): entry is WorkspaceResourcePermissionEntry => entry !== null);
}

export async function loadWorkspaceInvite(inviteId: string): Promise<WorkspaceInvite | null> {
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceInviteService] loadWorkspaceInvite:', error.message);
    return null;
  }
  if (!data) return null;

  const permissions = await fetchInvitePermissions(inviteId);
  return mapWorkspaceInviteRow(data, permissions);
}

export async function restoreWorkspaceInvitePermissions(
  inviteId: string,
  permissions: WorkspaceResourcePermissionEntry[]
): Promise<void> {
  if (!permissions.length) return;
  await supabase.from('workspace_invite_permissions').insert(
    permissions.map((entry) => ({
      invite_id: inviteId,
      kind: entry.kind,
      resource_id: entry.resourceId,
      access_level: entry.accessLevel,
    }))
  );
}

export async function rollbackWorkspaceMembership(
  workspaceId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('workspace_resource_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
}
