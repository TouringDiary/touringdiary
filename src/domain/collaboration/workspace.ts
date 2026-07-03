import type { ResourceInviteStatus } from './resourceInvite';
import type { SharedResourceKind, WorkspaceResourceAccess } from './sharedResource';

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
}

export interface WorkspaceMemberWithProfile extends WorkspaceMember {
  userName: string;
  userSlug?: string;
  userAvatarUrl?: string;
}

export interface WorkspaceResource {
  id: string;
  workspaceId: string;
  kind: SharedResourceKind;
  resourceId: string;
  addedBy: string;
  createdAt: string;
}

export interface WorkspaceResourcePermission {
  id: string;
  workspaceId: string;
  workspaceResourceId: string;
  userId: string;
  accessLevel: WorkspaceResourceAccess;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceResourcePermissionEntry {
  kind: SharedResourceKind;
  resourceId: string;
  accessLevel: WorkspaceResourceAccess;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  inviterId: string;
  inviteeId: string;
  status: ResourceInviteStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  permissions: WorkspaceResourcePermissionEntry[];
}

export function isWorkspaceResourceAccess(value: string): value is WorkspaceResourceAccess {
  return value === 'none' || value === 'viewer' || value === 'collaborator';
}

export function workspaceResourceKey(kind: SharedResourceKind, resourceId: string): string {
  return `${kind}:${resourceId}`;
}
