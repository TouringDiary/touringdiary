import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
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
import { useCollaborationInviteSearch } from '../useCollaborationInviteSearch';

const WORKSPACE_PANEL_TABS: WorkspacePanelTab[] = [
  'resources',
  'members',
  'invites',
  'activity',
  'attachments',
];

export interface CollaborationWorkspacePanelBodyProps {
  workspaceId: string;
  user: User;
  requestClose: () => void;
  registerCloseHandler: (handler: () => void) => void;
}

export const CollaborationWorkspacePanelBody: React.FC<CollaborationWorkspacePanelBodyProps> = ({
  workspaceId,
  user,
  requestClose,
  registerCloseHandler,
}) => {
  const dashboard = useWorkspaceDashboard(workspaceId, user.id);
  const { openResource } = useWorkspaceResourceNavigation();

  const isMobile = useMobileDetect();
  const sectionTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle, isMobile);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);

  const [activeTab, setActiveTab] = useState<WorkspacePanelTab>('resources');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [removeResourceTargetId, setRemoveResourceTargetId] = useState<string | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ userId: string; name: string } | null>(
    null
  );
  const [revokeInviteTargetId, setRevokeInviteTargetId] = useState<string | null>(null);

  const excludedSearchUserIds = useMemo(
    () => [
      user.id,
      dashboard.workspace?.ownerId,
      ...dashboard.members.map((member) => member.userId),
      ...dashboard.invites
        .filter((invite) => invite.status === 'pending')
        .map((invite) => invite.inviteeId),
    ].filter((id): id is string => Boolean(id)),
    [user.id, dashboard.workspace?.ownerId, dashboard.members, dashboard.invites]
  );

  const { searchResults, isSearching } = useCollaborationInviteSearch(
    user.id,
    Boolean(dashboard.workspace),
    searchQuery,
    excludedSearchUserIds
  );

  const hasPendingConfirm =
    removeResourceTargetId !== null ||
    removeMemberTarget !== null ||
    revokeInviteTargetId !== null;

  const guardedRequestClose = useCallback(() => {
    if (isSubmitting || hasPendingConfirm) return;
    requestClose();
  }, [isSubmitting, hasPendingConfirm, requestClose]);

  useEffect(() => {
    registerCloseHandler(guardedRequestClose);
  }, [registerCloseHandler, guardedRequestClose]);

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
    } catch (unexpectedError) {
      console.error('[CollaborationWorkspacePanelBody] action:', unexpectedError);
      setActionError('Si è verificato un errore imprevisto. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const handleRemoveResource = async (workspaceResourceId: string) => {
    if (!dashboard.workspace || isSubmitting) return;
    const workspace = dashboard.workspace;
    await runSubmittingAction(async () => {
      const result = await removeWorkspaceResource(
        workspace.id,
        user.id,
        workspaceResourceId
      );
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile rimuovere la risorsa.');
        return;
      }
      setRemoveResourceTargetId(null);
      await dashboard.refresh();
    });
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!dashboard.workspace || isSubmitting) return;
    const workspace = dashboard.workspace;
    await runSubmittingAction(async () => {
      const result = await removeWorkspaceMember(workspace.id, user.id, memberUserId);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile rimuovere il membro.');
        return;
      }
      setRemoveMemberTarget(null);
      await dashboard.refresh();
    });
  };

  const handleUpdateMemberPermissions = async (
    memberUserId: string,
    permissions: WorkspaceResourcePermissionEntry[]
  ) => {
    if (!dashboard.workspace || isSubmitting) return;
    const workspace = dashboard.workspace;
    await runSubmittingAction(async () => {
      const result = await setWorkspaceResourcePermissionsForUser(
        workspace.id,
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
    if (isSubmitting) return;
    const workspace = dashboard.workspace;
    await runSubmittingAction(async () => {
      const result = await sendWorkspaceInvite(
        user.id,
        workspace.id,
        { userId: target.id },
        buildDefaultPermissions('collaborator')
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setSearchQuery('');
      setActiveTab('invites');
      await dashboard.refresh();
    });
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (isSubmitting) return;
    await runSubmittingAction(async () => {
      const result = await revokeWorkspaceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setRevokeInviteTargetId(null);
      await dashboard.refresh();
    });
  };

  const handleResendInvite = async (inviteId: string) => {
    if (isSubmitting) return;
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

  const removeResourceLabel = useMemo(() => {
    if (!removeResourceTargetId) return '';
    const resource = dashboard.resources.find((r) => r.id === removeResourceTargetId);
    if (!resource) return 'questa risorsa';
    const label = dashboard.resourceLabels.find(
      (entry) =>
        workspaceResourceKey(entry.kind, entry.resourceId) ===
        workspaceResourceKey(resource.kind, resource.resourceId)
    );
    return label?.title ?? resource.kind;
  }, [removeResourceTargetId, dashboard.resources, dashboard.resourceLabels]);

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
          onClick={guardedRequestClose}
          className="text-sm text-slate-400 hover:text-white"
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmationModal
        isOpen={removeResourceTargetId !== null}
        onClose={() => { if (!isSubmitting) setRemoveResourceTargetId(null); }}
        onConfirm={() => {
          if (!removeResourceTargetId) return;
          void handleRemoveResource(removeResourceTargetId);
        }}
        title="Rimuovere risorsa?"
        message={`Stai per scollegare "${removeResourceLabel}" da questo workspace.`}
        confirmLabel="Rimuovi"
        isDeleting={isSubmitting}
        zIndex={Z_MODAL_NESTED}
      />
      <DeleteConfirmationModal
        isOpen={removeMemberTarget !== null}
        onClose={() => { if (!isSubmitting) setRemoveMemberTarget(null); }}
        onConfirm={() => {
          if (!removeMemberTarget) return;
          void handleRemoveMember(removeMemberTarget.userId);
        }}
        title="Rimuovere membro?"
        message={
          removeMemberTarget
            ? `Stai per rimuovere ${removeMemberTarget.name} dal workspace.`
            : ''
        }
        confirmLabel="Rimuovi"
        isDeleting={isSubmitting}
        zIndex={Z_MODAL_NESTED}
      />
      <DeleteConfirmationModal
        isOpen={revokeInviteTargetId !== null}
        onClose={() => { if (!isSubmitting) setRevokeInviteTargetId(null); }}
        onConfirm={() => {
          if (!revokeInviteTargetId) return;
          void handleRevokeInvite(revokeInviteTargetId);
        }}
        title="Revocare invito?"
        message="Stai per revocare questo invito al workspace."
        confirmLabel="Revoca"
        isDeleting={isSubmitting}
        zIndex={Z_MODAL_NESTED}
      />

      <header className="relative flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="min-w-0 pr-10">
          <p className={`${sectionTitleShell} text-indigo-400 mb-0.5`}>Workspace</p>
          <h2 className={`${modalTitleShell} truncate`}>{dashboard.workspace.name}</h2>
          {dashboard.workspace.description && (
            <p className={`${modalSubtitleShell} mt-0.5 line-clamp-2`}>
              {dashboard.workspace.description}
            </p>
          )}
        </div>
        <CloseButton
          onClose={guardedRequestClose}
          variant="ghost"
          position="absolute"
          withEscape={false}
          disableIfDirty={isSubmitting || hasPendingConfirm}
          className={`${closeOffsetShell} z-local-overlay`}
          title="Chiudi workspace"
        />
      </header>

      <nav
        className="flex gap-1 px-4 py-2 border-b border-slate-800 shrink-0 overflow-x-auto"
        role="tablist"
        aria-label="Sezioni workspace"
      >
        {WORKSPACE_PANEL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`workspace-tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`workspace-tabpanel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            {WORKSPACE_PANEL_TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        role="tabpanel"
        id={`workspace-tabpanel-${activeTab}`}
        aria-labelledby={`workspace-tab-${activeTab}`}
      >
        {activeTab === 'resources' && (
          <WorkspaceResourcesSection
            resources={dashboard.resources}
            resourceLabels={dashboard.resourceLabels}
            isOwner={dashboard.isOwner}
            isSubmitting={isSubmitting}
            onOpenResource={handleOpenResource}
            onRequestRemoveResource={setRemoveResourceTargetId}
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
            onRequestRemoveMember={(memberUserId) => {
              const member = dashboard.members.find((m) => m.userId === memberUserId);
              if (member) {
                setRemoveMemberTarget({ userId: member.userId, name: member.userName });
              }
            }}
            onUpdateMemberPermissions={handleUpdateMemberPermissions}
          />
        )}

        {activeTab === 'invites' && dashboard.isOwner && (
          <WorkspaceInvitesSection
            invites={dashboard.invites}
            inviteeProfiles={dashboard.inviteeProfiles}
            resourceLabels={dashboard.resourceLabels}
            isSubmitting={isSubmitting}
            onRequestRevokeInvite={setRevokeInviteTargetId}
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
          <WorkspaceAttachmentsSection
            workspaceId={workspaceId}
            user={user}
            isSubmitting={isSubmitting}
          />
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
