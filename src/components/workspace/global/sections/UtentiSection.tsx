import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useWorkspaceDashboard } from '@/hooks/useWorkspaceDashboard';
import { useWorkspacePanelState } from '../WorkspacePanelContext';
import { WorkspaceMembersSection } from '@/components/collaboration/workspace/WorkspaceMembersSection';
import { WorkspaceInvitesSection } from '@/components/collaboration/workspace/WorkspaceInvitesSection';
import { WorkspaceBlockedUsersSubsection } from './WorkspaceBlockedUsersSubsection';
import {
  removeWorkspaceMember,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  searchUsersForCollaborationInvite,
  sendWorkspaceInvite,
  setWorkspaceResourcePermissionsForUser,
} from '@/services/collaboration';
import type {
  CollaborationUserSearchResult,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';

const INVITE_DEBOUNCE_MS = 250;

export const UtentiSection: React.FC = () => {
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspacePanelState();
  const dashboard = useWorkspaceDashboard(activeWorkspaceId, user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollaborationUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerId = user?.id;
  const workspaceId = dashboard.workspace?.id;

  const searchUsers = useCallback(async (query: string) => {
    if (!ownerId || !query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsersForCollaborationInvite(ownerId, query.trim());
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [ownerId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void searchUsers(searchQuery);
    }, INVITE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchUsers]);

  const handleInviteUser = async (target: CollaborationUserSearchResult) => {
    if (!ownerId || !workspaceId) return;
    if (dashboard.resources.length === 0) {
      setError('Non ci sono risorse nel workspace da condividere con l\'invitato.');
      return;
    }

    const permissions: WorkspaceResourcePermissionEntry[] = dashboard.resources.map((resource) => ({
      kind: resource.kind,
      resourceId: resource.resourceId,
      accessLevel: 'viewer',
    }));

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await sendWorkspaceInvite(ownerId, workspaceId, { userId: target.id }, permissions);
      if (result.success === true) {
        setSearchQuery('');
        setSearchResults([]);
        await dashboard.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!ownerId || !workspaceId) return;
    setIsSubmitting(true);
    try {
      const result = await removeWorkspaceMember(workspaceId, ownerId, userId);
      if (result.success) {
        await dashboard.refresh();
      } else {
        setError(result.error ?? 'Impossibile rimuovere il membro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMemberPermissions = async (
    userId: string,
    permissions: WorkspaceResourcePermissionEntry[]
  ) => {
    if (!ownerId || !workspaceId) return;
    setIsSubmitting(true);
    try {
      const result = await setWorkspaceResourcePermissionsForUser(workspaceId, ownerId, userId, permissions);
      if (result.success) {
        await dashboard.refresh();
      } else {
        setError(result.error ?? 'Impossibile aggiornare i permessi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!ownerId) return;
    setIsSubmitting(true);
    try {
      const result = await revokeWorkspaceInvite(ownerId, inviteId);
      if (result.success === true) {
        await dashboard.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!ownerId) return;
    setIsSubmitting(true);
    try {
      const result = await resendWorkspaceInvite(ownerId, inviteId);
      if (result.success === true) {
        await dashboard.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeWorkspaceId || !user || !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Seleziona un workspace per gestire gli utenti.
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-4 h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <WorkspaceMembersSection
          resources={dashboard.resources}
          resourceLabels={dashboard.resourceLabels}
          members={dashboard.members}
          permissions={dashboard.permissions}
          ownerProfile={dashboard.ownerProfile}
          isOwner={dashboard.isOwner}
          isSubmitting={isSubmitting}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSearchQueryChange={setSearchQuery}
          onInviteUser={handleInviteUser}
          onRequestRemoveMember={handleRemoveMember}
          onUpdateMemberPermissions={handleUpdateMemberPermissions}
        />

        {dashboard.isOwner && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <WorkspaceInvitesSection
              invites={dashboard.invites}
              inviteeProfiles={dashboard.inviteeProfiles}
              resourceLabels={dashboard.resourceLabels}
              isSubmitting={isSubmitting}
              onRequestRevokeInvite={handleRevokeInvite}
              onResendInvite={handleResendInvite}
            />
            <WorkspaceBlockedUsersSubsection
              invites={dashboard.invites}
              inviteeProfiles={dashboard.inviteeProfiles}
              resourceLabels={dashboard.resourceLabels}
              isSubmitting={isSubmitting}
              onResendInvite={handleResendInvite}
            />
          </div>
        )}
      </div>
    </div>
  );
};
