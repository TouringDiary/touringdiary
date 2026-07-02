import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { User } from '@/types/users';
import type {
  CollaborativeMemberRole,
  ResourceInvite,
  SharedResource,
  SharedResourceKind,
  SharedResourceMemberWithProfile,
  SharingMode,
} from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import {
  ensureShareableResource,
  getShareableResource,
  listResourceInvites,
  listSharedResourceMembers,
  removeSharedResourceMember,
  resendResourceInvite,
  revokeResourceInvite,
  searchUsersForCollaborationInvite,
  sendResourceInvite,
  setSharedResourceMember,
  updateShareableResourceMode,
} from '@/services/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { CollaborationManagementView } from './CollaborationManagementView';
import { CollaborationShareWizard } from './CollaborationShareWizard';
import { CollaborationWizardFooter } from './CollaborationWizardFooter';
import {
  getWizardStepTitle,
  type ModalView,
  type PendingInvite,
  type SharePath,
  type WizardStep,
} from './collaborationSharePresentation';

export interface CollaborationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  kind: SharedResourceKind;
  resourceId: string;
  resourceTitle: string;
}

export const CollaborationShareModal: React.FC<CollaborationShareModalProps> = ({
  isOpen,
  onClose,
  user,
  kind,
  resourceId,
  resourceTitle,
}) => {
  const [view, setView] = useState<ModalView>('wizard');
  const [wizardStep, setWizardStep] = useState<WizardStep>('path');
  const [sharePath, setSharePath] = useState<SharePath>('simple');
  const [sharingMode, setSharingMode] = useState<SharingMode>('collaborative');
  const [sharedResource, setSharedResource] = useState<SharedResource | null>(null);
  const [members, setMembers] = useState<SharedResourceMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<ResourceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollaborationUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CollaborativeMemberRole>('collaborator');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const kindLabel = getSharedResourceKindLabel(kind);
  const resourceLabel = resourceTitle.trim() || kindLabel;
  const wizardTitle = getWizardStepTitle(wizardStep);

  const refreshCollaborationState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resource = await getShareableResource(kind, resourceId);
      const memberList = resource ? await listSharedResourceMembers(resource.id) : [];
      const inviteList = await listResourceInvites(kind, resourceId, user.id);

      setSharedResource(resource);
      setMembers(memberList);
      setInvites(inviteList);

      const hasCollaboration =
        memberList.length > 0 ||
        inviteList.some((invite) =>
          ['pending', 'accepted', 'rejected'].includes(invite.status)
        );

      if (hasCollaboration) {
        setView('management');
        if (resource?.sharingMode) setSharingMode(resource.sharingMode);
      } else {
        setView('wizard');
        setWizardStep('path');
        setSharePath('simple');
        setSharingMode(resource?.sharingMode ?? 'collaborative');
        setPendingInvites([]);
      }
    } catch (loadError) {
      console.error('[CollaborationShareModal] refresh:', loadError);
      setError('Impossibile caricare lo stato della condivisione.');
    } finally {
      setIsLoading(false);
    }
  }, [kind, resourceId, user.id]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setSearchResults([]);
    setActionError(null);
    setPendingInvites([]);
    refreshCollaborationState();
  }, [isOpen, refreshCollaborationState]);

  useEffect(() => {
    if (!isOpen) return;
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
          ...pendingInvites.map((invite) => invite.userId),
          ...members.map((member) => member.userId),
          ...invites
            .filter((invite) => invite.status === 'pending')
            .map((invite) => invite.inviteeId),
        ]);
        setSearchResults(results.filter((result) => !excluded.has(result.id)));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, isOpen, user.id, pendingInvites, members, invites]);

  useGlobalModalEscape(isOpen, onClose);

  const handlePathContinue = () => {
    setActionError(null);
    if (sharePath === 'simple') {
      setWizardStep('mode');
      return;
    }
    setWizardStep('workspace_notice');
  };

  const handleModeContinue = () => {
    setActionError(null);
    setWizardStep('invite');
  };

  const handleWizardBack = () => {
    setActionError(null);
    if (wizardStep === 'invite') setWizardStep('mode');
    else if (wizardStep === 'mode') setWizardStep('path');
  };

  const handleUseSimpleShare = () => {
    setSharePath('simple');
    setWizardStep('mode');
  };

  const handleAddPendingInvite = (result: CollaborationUserSearchResult) => {
    setPendingInvites((current) => [
      ...current,
      {
        userId: result.id,
        name: result.name,
        slug: result.slug,
        role: selectedRole,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemovePendingInvite = (userId: string) => {
    setPendingInvites((current) => current.filter((invite) => invite.userId !== userId));
  };

  const handleSendInvites = async () => {
    if (pendingInvites.length === 0) {
      setActionError('Aggiungi almeno un utente da invitare.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const registerResult = await ensureShareableResource(
        kind,
        resourceId,
        user.id,
        sharingMode
      );
      if (registerResult.success !== true) {
        setActionError(registerResult.error);
        return;
      }

      if (registerResult.resource.sharingMode !== sharingMode) {
        const modeResult = await updateShareableResourceMode(
          registerResult.resource.id,
          user.id,
          sharingMode
        );
        if (!modeResult.success) {
          setActionError(modeResult.error ?? 'Impossibile aggiornare la modalità.');
          return;
        }
      }

      for (const pending of pendingInvites) {
        const result = await sendResourceInvite(
          user.id,
          kind,
          resourceId,
          { userId: pending.userId },
          pending.role
        );
        if (result.success !== true) {
          setActionError(result.error);
          return;
        }
      }

      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberUserId: string, role: CollaborativeMemberRole) => {
    if (!sharedResource) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await setSharedResourceMember(
        sharedResource.id,
        user.id,
        memberUserId,
        role
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeMember = async (memberUserId: string) => {
    if (!sharedResource) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await removeSharedResourceMember(sharedResource.id, user.id, memberUserId);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile revocare l\'accesso.');
        return;
      }
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await revokeResourceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await resendResourceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSharingModeChange = async (mode: SharingMode) => {
    if (!sharedResource || sharedResource.sharingMode === mode) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await updateShareableResourceMode(sharedResource.id, user.id, mode);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile aggiornare la modalità.');
        return;
      }
      setSharingMode(mode);
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagementInvite = async (target: CollaborationUserSearchResult) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await sendResourceInvite(
        user.id,
        kind,
        resourceId,
        { userId: target.id },
        selectedRole
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setSearchQuery('');
      setSearchResults([]);
      await refreshCollaborationState();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="collaboration-share-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
        style={{ zIndex: Z_MODAL }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
              Condividi
            </p>
            <h2 id="collaboration-share-title" className="text-lg font-bold text-white truncate">
              {view === 'management' ? 'Gestione collaborazione' : wizardTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {kindLabel}: {resourceLabel}
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">Caricamento...</p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : view === 'wizard' ? (
            <CollaborationShareWizard
              wizardStep={wizardStep}
              sharePath={sharePath}
              sharingMode={sharingMode}
              selectedRole={selectedRole}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              pendingInvites={pendingInvites}
              onSharePathChange={setSharePath}
              onSharingModeChange={setSharingMode}
              onSelectedRoleChange={setSelectedRole}
              onSearchQueryChange={setSearchQuery}
              onAddPendingInvite={handleAddPendingInvite}
              onRemovePendingInvite={handleRemovePendingInvite}
            />
          ) : (
            <CollaborationManagementView
              sharedResource={sharedResource}
              members={members}
              invites={invites}
              selectedRole={selectedRole}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSubmitting={isSubmitting}
              canChangeSharingMode={kind === 'suitcase'}
              onSharingModeChange={handleSharingModeChange}
              onSelectedRoleChange={setSelectedRole}
              onSearchQueryChange={setSearchQuery}
              onRoleChange={handleRoleChange}
              onRevokeMember={handleRevokeMember}
              onRevokeInvite={handleRevokeInvite}
              onResendInvite={handleResendInvite}
              onManagementInvite={handleManagementInvite}
            />
          )}

          {actionError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {!isLoading && !error && (
          <CollaborationWizardFooter
            view={view}
            wizardStep={wizardStep}
            isSubmitting={isSubmitting}
            onClose={onClose}
            onPathContinue={handlePathContinue}
            onModeContinue={handleModeContinue}
            onSendInvites={handleSendInvites}
            onBack={handleWizardBack}
            onUseSimpleShare={handleUseSimpleShare}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
