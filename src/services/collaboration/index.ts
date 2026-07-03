export {
  ensureShareableResource,
  registerShareableResource,
  getShareableResource,
  updateShareableResourceMode,
  deleteShareableResource,
} from './sharedResourceService';

export {
  listSharedResourceMembers,
  getSharedResourceMember,
  setSharedResourceMember,
  removeSharedResourceMember,
  countSharedResourceMembers,
} from './sharedResourceAclService';

export {
  resolveResourcePermission,
  isResourceShared,
  canUserModifyResource,
  canUserDeleteResource,
  canUserManageCollaboration,
} from './permissionService';

export {
  sendResourceInvite,
  acceptResourceInvite,
  rejectResourceInvite,
  revokeResourceInvite,
  resendResourceInvite,
  getResourceInvite,
  listResourceInvites,
  listPendingInvitesForUser,
} from './resourceInviteService';

export {
  searchUsersForCollaborationInvite,
  resolveUserIdByEmail,
  resolveUserIdByUsername,
} from './collaborationUserSearchService';

export { blockUser, unblockUser, areUsersBlocked, listBlockedUserIds } from './userBlockService';

export {
  createWorkspace,
  getWorkspace,
  listWorkspacesForUser,
  updateWorkspace,
  isWorkspaceOwner,
  isWorkspaceMember,
} from './workspaceService';

export {
  listWorkspaceResources,
  addWorkspaceResource,
  removeWorkspaceResource,
  listWorkspaceMembers,
  listWorkspaceResourcePermissions,
  setWorkspaceResourcePermission,
  setWorkspaceResourcePermissionsForUser,
  getWorkspaceResourceAccessForUser,
} from './workspaceResourceService';

export {
  suggestWorkspaceCompositionFromResource,
  createWorkspaceWithComposition,
  createWorkspaceFromResource,
  addResourceToExistingWorkspace,
  isResourceInWorkspace,
  listWorkspacesContainingResource,
  listWorkspaceComposition,
} from './workspaceCompositionService';

export {
  sendWorkspaceInvite,
  acceptWorkspaceInvite,
  rejectWorkspaceInvite,
  revokeWorkspaceInvite,
  resendWorkspaceInvite,
  getWorkspaceInvite,
  listWorkspaceInvites,
  listPendingWorkspaceInvitesForUser,
  removeWorkspaceMember,
  updateWorkspaceInvitePermissions,
} from './workspaceInviteService';

export {
  fetchCollaborativeDiaryIdsForMember,
} from './diaryCollaborationService';

export {
  resolveWorkspaceResourceLabels,
  findWorkspaceResourceLabel,
  buildWorkspaceResourceLabelMap,
  fetchCollaborationUserProfiles,
} from './workspaceResourcePresentation';
export type {
  WorkspaceResourceLabel,
  CollaborationUserProfileSummary,
} from './workspaceResourcePresentation';

export {
  tryAcquireDiaryEditLock,
  releaseDiaryEditLock,
  getDiaryEditLockHolder,
} from './diaryLockService';

export {
  tryAcquireSharedResourceEditLock,
  refreshSharedResourceEditLock,
  releaseSharedResourceEditLock,
  getSharedResourceEditLockHolder,
  getSharedResourceEditLockState,
} from './sharedResourceLockService';

export { resolveCollaborationLiveConfig } from './collaborationLiveConfig';

export type { ResolvePermissionOptions } from './permissionService';
export type { RegisterShareableResourceResult } from './sharedResourceService';
export type { SetSharedResourceMemberResult } from './sharedResourceAclService';
export type { ResourceInviteResult, InviteTarget } from './resourceInviteService';
export type { CreateWorkspaceResult, CreateWorkspaceInput } from './workspaceService';
export type { WorkspaceResourceResult, AddWorkspaceResourceInput } from './workspaceResourceService';
export type {
  CreateWorkspaceWithCompositionResult,
  WorkspaceCompositionResource,
  WorkspaceMemberPermissionDraft,
} from './workspaceCompositionService';
export type { WorkspaceInviteResult } from './workspaceInviteService';
