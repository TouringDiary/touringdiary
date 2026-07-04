import { supabase } from '@/services/supabaseClient';
import type { WorkspaceInvite, WorkspaceResourcePermissionEntry } from '@/domain/collaboration';
import {
  mapWorkspaceInvitePermissionRow,
  mapWorkspaceInviteRow,
} from './workspaceMappers';

export async function fetchInvitePermissions(
  inviteId: string
): Promise<WorkspaceResourcePermissionEntry[]> {
  const map = await fetchInvitePermissionsByInviteIds([inviteId]);
  return map.get(inviteId) ?? [];
}

export async function fetchInvitePermissionsByInviteIds(
  inviteIds: string[]
): Promise<Map<string, WorkspaceResourcePermissionEntry[]>> {
  const result = new Map<string, WorkspaceResourcePermissionEntry[]>();
  if (inviteIds.length === 0) return result;

  const { data, error } = await supabase
    .from('workspace_invite_permissions')
    .select('*')
    .in('invite_id', inviteIds);

  if (error) {
    console.error('[workspaceInvitePersistence] fetchInvitePermissionsByInviteIds:', error.message);
    return result;
  }

  for (const inviteId of inviteIds) {
    result.set(inviteId, []);
  }

  for (const row of data ?? []) {
    const entry = mapWorkspaceInvitePermissionRow(row);
    if (!entry) continue;
    const list = result.get(row.invite_id) ?? [];
    list.push(entry);
    result.set(row.invite_id, list);
  }

  return result;
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
