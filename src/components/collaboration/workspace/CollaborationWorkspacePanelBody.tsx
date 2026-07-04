import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { User } from '@/types/users';
import type {
  WorkspaceResourcePermissionEntry,
  WorkspaceResourceAccess,
} from '@/domain/collaboration';
import { workspaceResourceKey } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { useWorkspaceDashboard } from '@/hooks/useWorkspaceDashboard';
import { useWorkspaceResourceNavigation } from '@/hooks/useWorkspaceResourceNavigation';
import {
  removeWorkspaceResource,
  removeWorkspaceMember,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  searchUsersForCollaborationInvite,
  sendWorkspaceInvite,
  setWorkspaceResourcePermissionsForUser,
} from '@/services/collaboration';
import {
  WORKSPACE_PANEL_TAB_LABELS,
  type WorkspacePanelTab,
} from './workspacePresentation';
import { WorkspaceResourcesSection } from './WorkspaceResourcesSection';
import { WorkspaceMembersSection } from './WorkspaceMembersSection';
import { WorkspaceInvitesSection } from './WorkspaceInvitesSection';
import { CollaborationActivityFeed } from '@/components/collaboration/live/CollaborationActivityFeed';
import { WorkspaceAttachmentsSection } from './WorkspaceAttachmentsSection';

export interface CollaborationWorkspacePanelBodyProps {
  workspaceId: string;
  user: User;
  requestClose: () => void;
}

export const CollaborationWorkspacePanelBody: React.FC<CollaborationWorkspacePanelBodyProps> = ({
  workspaceId,
  user,
  requestClose,
}) => {
  const dashboard = useWorkspaceDashboard(workspaceId, user.id);
  const { openResource } = useWorkspaceResourceNavigation();

  const [activeTab, setActiveTab] = useState<WorkspacePanelTab>('resources');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollaborationUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3 && !trimmed.includes('@')) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersForCollaborationInvite(user.id, trimmed);
        const excluded = new Set([
          user.id,
          dashboard.workspace?.ownerId,
          ...dashboard.members.map((member) => member.userId),
          ...dashboard.invites
            .filter((invite) => invite.status === 'pending')
            .map((invite) => invite.inviteeId),
        ]);
        setSearchResults(results.filter((result) => !excluded.has(result.id)));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, user.id, dashboard.workspace?.ownerId, dashboard.members, dashboard.invites]);

  const buildDefaultPermissions = useCallback(
    (accessLevel: WorkspaceResourceAccess = 'collaborator'): WorkspaceResourcePermissionEntry[] =>
      dashboard.resources.map((resource) => ({
        kind: resource.kind,
        resourceId: resource.resourceId,
        accessLevel,
      })),
    [dashboard.resources]
  );

  const runSubmittingAction = useCallback(async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleRemoveResource = async (workspaceResourceId: string) => {
    if (!dashboard.workspace) return;
    await runSubmittingAction(async () => {
      const result = await removeWorkspaceResource(
        dashboard.workspace!.id,
        user.id,
        workspaceResourceId
      );
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile rimuovere la risorsa.');
        return;
      }
      await dashboard.refresh();
    });
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!dashboard.workspace) return;
    await runSubmittingAction(async () => {
      const result = await removeWorkspaceMember(dashboard.workspace!.id, user.id, memberUserId);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile rimuovere il membro.');
        return;
      }
      await dashboard.refresh();
    });
  };

  const handleUpdateMemberPermissions = async (
    memberUserId: string,
    permissions: WorkspaceResourcePermissionEntry[]
  ) => {
    if (!dashboard.workspace) return;
    await runSubmittingAction(async () => {
      const result = await setWorkspaceResourcePermissionsForUser(
        dashboard.workspace!.id,
        user.id,
        memberUserId,
        permissions
      );
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile aggiornare i permessi.');
        return;
      }
      await dashboard.refresh();
    });
  };

  const handleInviteUser = async (target: CollaborationUserSearchResult) => {
    if (!dashboard.workspace || dashboard.resources.length === 0) {
      setActionError('Aggiungi almeno una risorsa prima di invitare utenti.');
      return;
    }
    await runSubmittingAction(async () => {
      const result = await sendWorkspaceInvite(
        user.id,
        dashboard.workspace!.id,
        { userId: target.id },
        buildDefaultPermissions('collaborator')
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('invites');
      await dashboard.refresh();
    });
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await runSubmittingAction(async () => {
      const result = await revokeWorkspaceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await dashboard.refresh();
    });
  };

  const handleResendInvite = async (inviteId: string) => {
    await runSubmittingAction(async () => {
      const result = await resendWorkspaceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await dashboard.refresh();
    });
  };

  const handleOpenResource = async (kind: WorkspaceResourcePermissionEntry['kind'], resourceId: string) => {
    await openResource(kind, resourceId);
  };

  if (dashboard.isLoading && !dashboard.workspace) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Caricamento workspace...</p>
      </div>
    );
  }

  if (dashboard.error || !dashboard.workspace) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-200">{dashboard.error ?? 'Workspace non disponibile.'}</p>
        <button
          type="button"
          onClick={requestClose}
          className="text-sm text-slate-400 hover:text-white"
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">
            Workspace
          </p>
          <h2 className="text-lg font-bold text-white truncate">{dashboard.workspace.name}</h2>
          {dashboard.workspace.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {dashboard.workspace.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={requestClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          aria-label="Chiudi workspace"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <nav className="flex gap-1 px-4 py-2 border-b border-slate-800 shrink-0">
        {(['resources', 'members', 'invites', 'activity', 'attachments'] as WorkspacePanelTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            {WORKSPACE_PANEL_TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {activeTab === 'resources' && (
          <WorkspaceResourcesSection
            resources={dashboard.resources}
            resourceLabels={dashboard.resourceLabels}
            isOwner={dashboard.isOwner}
            isSubmitting={isSubmitting}
            onOpenResource={handleOpenResource}
            onRemoveResource={handleRemoveResource}
          />
        )}

        {activeTab === 'members' && (
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
            onRemoveMember={handleRemoveMember}
            onUpdateMemberPermissions={handleUpdateMemberPermissions}
          />
        )}

        {activeTab === 'invites' && dashboard.isOwner && (
          <WorkspaceInvitesSection
            invites={dashboard.invites}
            inviteeProfiles={dashboard.inviteeProfiles}
            resourceLabels={dashboard.resourceLabels}
            isSubmitting={isSubmitting}
            onRevokeInvite={handleRevokeInvite}
            onResendInvite={handleResendInvite}
          />
        )}

        {activeTab === 'invites' && !dashboard.isOwner && (
          <p className="text-sm text-slate-500">Solo il proprietario può gestire gli inviti.</p>
        )}

        {activeTab === 'activity' && (
          <CollaborationActivityFeed workspaceId={workspaceId} />
        )}

        {activeTab === 'attachments' && (
          <WorkspaceAttachmentsSection workspaceId={workspaceId} user={user} />
        )}

        {actionError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>
    </>
  );
};
