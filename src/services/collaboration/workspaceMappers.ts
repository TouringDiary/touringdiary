import type {
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMemberWithProfile,
  WorkspaceResource,
  WorkspaceResourcePermission,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import {
  isResourceInviteStatus,
  isSharedResourceKind,
  isWorkspaceResourceAccess,
} from '@/domain/collaboration';
import type { Database } from '@/types/supabase';

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceMemberRow = Database['public']['Tables']['workspace_members']['Row'];
type WorkspaceResourceRow = Database['public']['Tables']['workspace_resources']['Row'];
type WorkspaceResourcePermissionRow =
  Database['public']['Tables']['workspace_resource_permissions']['Row'];
type WorkspaceInviteRow = Database['public']['Tables']['workspace_invites']['Row'];
type WorkspaceInvitePermissionRow =
  Database['public']['Tables']['workspace_invite_permissions']['Row'];

export type MemberWithProfileRow = WorkspaceMemberRow & {
  profiles: { name: string; slug: string | null; avatar_url: string | null } | null;
};

export function mapWorkspaceRow(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description ?? undefined,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWorkspaceMemberRow(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function mapWorkspaceMemberWithProfile(
  row: MemberWithProfileRow
): WorkspaceMemberWithProfile | null {
  const member = mapWorkspaceMemberRow(row);
  if (!row.profiles?.name) return null;
  return {
    ...member,
    userName: row.profiles.name,
    userSlug: row.profiles.slug ?? undefined,
    userAvatarUrl: row.profiles.avatar_url ?? undefined,
  };
}

export function mapWorkspaceResourceRow(row: WorkspaceResourceRow): WorkspaceResource | null {
  if (!isSharedResourceKind(row.kind)) {
    console.error('[workspaceMappers] kind non valido:', row.kind);
    return null;
  }
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    kind: row.kind,
    resourceId: row.resource_id,
    addedBy: row.added_by,
    createdAt: row.created_at,
  };
}

export function mapWorkspaceResourcePermissionRow(
  row: WorkspaceResourcePermissionRow
): WorkspaceResourcePermission | null {
  if (!isWorkspaceResourceAccess(row.access_level)) {
    console.error('[workspaceMappers] access_level non valido:', row.access_level);
    return null;
  }
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceResourceId: row.workspace_resource_id,
    userId: row.user_id,
    accessLevel: row.access_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWorkspaceInvitePermissionRow(
  row: WorkspaceInvitePermissionRow
): WorkspaceResourcePermissionEntry | null {
  if (!isSharedResourceKind(row.kind)) {
    console.error('[workspaceMappers] invite permission kind non valido:', row.kind);
    return null;
  }
  if (!isWorkspaceResourceAccess(row.access_level)) {
    console.error('[workspaceMappers] invite permission access non valido:', row.access_level);
    return null;
  }
  return {
    kind: row.kind,
    resourceId: row.resource_id,
    accessLevel: row.access_level,
  };
}

export function mapWorkspaceInviteRow(
  row: WorkspaceInviteRow,
  permissions: WorkspaceResourcePermissionEntry[]
): WorkspaceInvite | null {
  if (!isResourceInviteStatus(row.status)) {
    console.error('[workspaceMappers] invite status non valido:', row.status);
    return null;
  }
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at ?? undefined,
    permissions,
  };
}
