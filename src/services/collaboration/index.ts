export { resolveCollaborationLiveConfig } from './collaborationLiveConfig';
export {
  getCollaborationNotificationPrefs,
  shouldDeliverCollaborationNotification,
  updateCollaborationNotificationPrefs,
} from './collaborationNotificationPrefsService';
export type {
  SharingProfileOverview,
  SharingProfileResourceRow,
} from './collaborationProfileService';
export { loadSharingProfileOverview } from './collaborationProfileService';

export {
  resolveUserIdByEmail,
  resolveUserIdByUsername,
  searchUsersForCollaborationInvite,
} from './collaborationUserSearchService';
export { fetchCollaborativeDiaryIdsForMember } from './diaryCollaborationService';
export {
  getDiaryEditLockHolder,
  releaseDiaryEditLock,
  tryAcquireDiaryEditLock,
} from './diaryLockService';
export {
  listCollaborationEventsForResource,
  listCollaborationEventsForWorkspace,
  recordCollaborationDomainEvent,
} from './domainEventService';
export {
  acceptFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
  rejectFriendRequest,
  removeFriend,
  searchUsersForFriendRequest,
  sendFriendRequest,
} from './friendService';
export type { ResolvePermissionOptions } from './permissionService';
export {
  canUserDeleteResource,
  canUserManageCollaboration,
  canUserModifyResource,
  isResourceShared,
  resolveResourcePermission,
} from './permissionService';
export {
  duplicateSharedResourceForOwner,
  savePersonalCopyFromWorkspace,
} from './personalShareService';
export type { InviteTarget, ResourceInviteResult } from './resourceInviteService';
export {
  acceptResourceInvite,
  getResourceInvite,
  listPendingInvitesForUser,
  listResourceInvites,
  rejectResourceInvite,
  resendResourceInvite,
  revokeResourceInvite,
  sendResourceInvite,
} from './resourceInviteService';
export type { SetSharedResourceMemberResult } from './sharedResourceAclService';
export {
  countSharedResourceMembers,
  getSharedResourceMember,
  listSharedResourceMembers,
  removeSharedResourceMember,
  setSharedResourceMember,
} from './sharedResourceAclService';

export {
  getSharedResourceEditLockHolder,
  getSharedResourceEditLockState,
  refreshSharedResourceEditLock,
  releaseSharedResourceEditLock,
  tryAcquireSharedResourceEditLock,
} from './sharedResourceLockService';
export type { RegisterShareableResourceResult } from './sharedResourceService';
export {
  deleteShareableResource,
  ensureShareableResource,
  getShareableResource,
  registerShareableResource,
  updateShareableResourceMode,
} from './sharedResourceService';
export { areUsersBlocked, blockUser, listBlockedUserIds, unblockUser } from './userBlockService';
export {
  deleteWorkspaceAttachment,
  listWorkspaceAttachments,
  resolveStorageLimitsConfig,
  uploadWorkspaceAttachment,
} from './workspaceAttachmentService';
export {
  blueprintCandidatesToLabels,
  materializeWorkspaceComposition,
  type ResolveWorkspaceCompositionBlueprintInput,
  type ResolveWorkspaceCompositionCatalogFromViaggioInput,
  type ResolveWorkspaceCompositionCatalogInput,
  resolveWorkspaceCompositionBlueprint,
  resolveWorkspaceCompositionCatalog,
  resolveWorkspaceCompositionCatalogFromViaggio,
  rollbackDuplicatedCompositionResources,
  type WorkspaceCompositionShareIntent,
} from './workspaceComposition';
export type {
  CreateWorkspaceWithCompositionResult,
  WorkspaceCompositionResource,
  WorkspaceMemberPermissionDraft,
} from './workspaceCompositionService';
export {
  addResourceToExistingWorkspace,
  createWorkspaceFromResource,
  createWorkspaceWithComposition,
  isResourceInWorkspace,
  listWorkspaceComposition,
  listWorkspacesContainingResource,
  suggestWorkspaceCompositionFromResource,
} from './workspaceCompositionService';
export {
  isCollaborationEngineEnabled,
  isSharedResourceKindEnabled,
  resolveWorkspaceEngineConfig,
} from './workspaceEngineConfigService';
export type { WorkspaceInviteResult } from './workspaceInviteService';
export {
  acceptWorkspaceInvite,
  getWorkspaceInvite,
  listIncomingWorkspaceInvitesForUser,
  listOutgoingWorkspaceInvitesForUser,
  listPendingWorkspaceInvitesForUser,
  listWorkspaceInvites,
  rejectWorkspaceInvite,
  removeWorkspaceMember,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  sendWorkspaceInvite,
  updateWorkspaceInvitePermissions,
} from './workspaceInviteService';
export { syncSharedResourceAccessFromWorkspacePermission } from './workspaceMemberAclSync';
export { leaveWorkspace } from './workspaceMemberService';
export type {
  CollaborationUserProfileSummary,
  WorkspaceResourceLabel,
} from './workspaceResourcePresentation';
export {
  buildWorkspaceResourceLabelMap,
  fetchCollaborationUserProfiles,
  findWorkspaceResourceLabel,
  resolveWorkspaceResourceLabels,
} from './workspaceResourcePresentation';
export type {
  AddWorkspaceResourceInput,
  WorkspaceResourceResult,
} from './workspaceResourceService';
export {
  addWorkspaceResource,
  getWorkspaceResourceAccessForUser,
  listWorkspaceMembers,
  listWorkspaceResourcePermissions,
  listWorkspaceResources,
  removeWorkspaceResource,
  setWorkspaceResourcePermission,
  setWorkspaceResourcePermissionsForUser,
} from './workspaceResourceService';
export type { CreateWorkspaceInput, CreateWorkspaceResult } from './workspaceService';
export {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceMemberCounts,
  getWorkspaceNamesByIds,
  isWorkspaceMember,
  isWorkspaceOwner,
  listWorkspacesForUser,
  MAX_OWNED_WORKSPACES_PER_USER,
  OWNED_WORKSPACE_LIMIT_MESSAGE,
  updateWorkspace,
} from './workspaceService';
