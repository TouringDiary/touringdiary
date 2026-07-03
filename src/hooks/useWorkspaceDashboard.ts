import { useCallback, useEffect, useState } from 'react';
import type {
  Workspace,
  WorkspaceInvite,
  WorkspaceMemberWithProfile,
  WorkspaceResource,
  WorkspaceResourcePermission,
} from '@/domain/collaboration';
import {
  getWorkspace,
  isWorkspaceOwner,
  listWorkspaceInvites,
  listWorkspaceMembers,
  listWorkspaceResourcePermissions,
  listWorkspaceResources,
} from '@/services/collaboration';
import {
  fetchCollaborationUserProfiles,
  resolveWorkspaceResourceLabels,
  type CollaborationUserProfileSummary,
  type WorkspaceResourceLabel,
} from '@/services/collaboration/workspaceResourcePresentation';

export interface WorkspaceDashboardState {
  workspace: Workspace | null;
  resources: WorkspaceResource[];
  resourceLabels: WorkspaceResourceLabel[];
  members: WorkspaceMemberWithProfile[];
  invites: WorkspaceInvite[];
  inviteeProfiles: Record<string, CollaborationUserProfileSummary>;
  ownerProfile?: CollaborationUserProfileSummary;
  permissions: WorkspaceResourcePermission[];
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EMPTY_INVITEE_PROFILES: Record<string, CollaborationUserProfileSummary> = {};

function clearDashboardDerivedState(setters: {
  setWorkspace: (value: Workspace | null) => void;
  setResources: (value: WorkspaceResource[]) => void;
  setResourceLabels: (value: WorkspaceResourceLabel[]) => void;
  setMembers: (value: WorkspaceMemberWithProfile[]) => void;
  setInvites: (value: WorkspaceInvite[]) => void;
  setInviteeProfiles: (value: Record<string, CollaborationUserProfileSummary>) => void;
  setOwnerProfile: (value: CollaborationUserProfileSummary | undefined) => void;
  setPermissions: (value: WorkspaceResourcePermission[]) => void;
  setIsOwner: (value: boolean) => void;
}): void {
  setters.setWorkspace(null);
  setters.setResources([]);
  setters.setResourceLabels([]);
  setters.setMembers([]);
  setters.setInvites([]);
  setters.setInviteeProfiles(EMPTY_INVITEE_PROFILES);
  setters.setOwnerProfile(undefined);
  setters.setPermissions([]);
  setters.setIsOwner(false);
}

export function useWorkspaceDashboard(
  workspaceId: string | null | undefined,
  userId: string | undefined
): WorkspaceDashboardState {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [resourceLabels, setResourceLabels] = useState<WorkspaceResourceLabel[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteeProfiles, setInviteeProfiles] = useState<
    Record<string, CollaborationUserProfileSummary>
  >(EMPTY_INVITEE_PROFILES);
  const [ownerProfile, setOwnerProfile] = useState<CollaborationUserProfileSummary | undefined>();
  const [permissions, setPermissions] = useState<WorkspaceResourcePermission[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetDerivedState = useCallback(() => {
    clearDashboardDerivedState({
      setWorkspace,
      setResources,
      setResourceLabels,
      setMembers,
      setInvites,
      setInviteeProfiles,
      setOwnerProfile,
      setPermissions,
      setIsOwner,
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!workspaceId || !userId) {
      resetDerivedState();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedWorkspace = await getWorkspace(workspaceId);
      if (!loadedWorkspace) {
        resetDerivedState();
        setError('Workspace non trovato.');
        return;
      }

      const [loadedResources, loadedMembers, ownerFlag] = await Promise.all([
        listWorkspaceResources(workspaceId),
        listWorkspaceMembers(workspaceId),
        isWorkspaceOwner(workspaceId, userId),
      ]);

      const composition = loadedResources.map((resource) => ({
        kind: resource.kind,
        resourceId: resource.resourceId,
      }));
      const labels = await resolveWorkspaceResourceLabels(composition);

      const [loadedInvites, loadedPermissions] = ownerFlag
        ? await Promise.all([
            listWorkspaceInvites(workspaceId, userId),
            listWorkspaceResourcePermissions(workspaceId),
          ])
        : [[], [] as WorkspaceResourcePermission[]];

      const profileIds = new Set<string>([loadedWorkspace.ownerId]);
      for (const invite of loadedInvites) {
        profileIds.add(invite.inviteeId);
      }
      const profiles = await fetchCollaborationUserProfiles([...profileIds]);

      setWorkspace(loadedWorkspace);
      setResources(loadedResources);
      setResourceLabels(labels);
      setMembers(loadedMembers);
      setInvites(loadedInvites);
      setPermissions(loadedPermissions);
      const inviteeProfileMap: Record<string, CollaborationUserProfileSummary> = {};
      for (const invite of loadedInvites) {
        const profile = profiles[invite.inviteeId];
        if (profile) {
          inviteeProfileMap[invite.inviteeId] = profile;
        }
      }
      setInviteeProfiles(inviteeProfileMap);
      setOwnerProfile(profiles[loadedWorkspace.ownerId]);
      setIsOwner(ownerFlag);
    } catch (loadError) {
      console.error('[useWorkspaceDashboard] refresh:', loadError);
      resetDerivedState();
      setError('Impossibile caricare il workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, userId, resetDerivedState]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    workspace,
    resources,
    resourceLabels,
    members,
    invites,
    inviteeProfiles,
    ownerProfile,
    permissions,
    isOwner,
    isLoading,
    error,
    refresh,
  };
}
