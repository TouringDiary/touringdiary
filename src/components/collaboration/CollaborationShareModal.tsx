import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  listWorkspacesForUser,
  removeSharedResourceMember,
  resendResourceInvite,
  revokeResourceInvite,
  searchUsersForCollaborationInvite,
  sendResourceInvite,
  setSharedResourceMember,
  updateShareableResourceMode,
  suggestWorkspaceCompositionFromResource,
  createWorkspaceWithComposition,
  addResourceToExistingWorkspace,
  sendWorkspaceInvite,
  resolveWorkspaceResourceLabels,
} from '@/services/collaboration';
import { duplicateSharedResourceForOwner } from '@/services/collaboration/personalShareService';
import type { WorkspaceCompositionResource } from '@/services/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { CollaborationManagementView } from './CollaborationManagementView';
import { CollaborationShareWizard } from './CollaborationShareWizard';
import { CollaborationWizardFooter } from './CollaborationWizardFooter';
import {
  getWizardStepTitle,
  type ModalView,
  type PendingInvite,
  type ShareIntent,
  type SharePath,
  type WizardStep,
  type WorkspacePendingInvite,
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
  const [shareIntent, setShareIntent] = useState<ShareIntent>('duplicate_and_share');
  const [effectiveResourceId, setEffectiveResourceId] = useState(resourceId);
  const [hasAppliedShareDuplicate, setHasAppliedShareDuplicate] = useState(false);
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

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [suggestedComposition, setSuggestedComposition] = useState<WorkspaceCompositionResource[]>([]);
  const [compositionLabels, setCompositionLabels] = useState<WorkspaceResourceLabel[]>([]);
  const [selectedCompositionKeys, setSelectedCompositionKeys] = useState<Set<string>>(new Set());
  const [userWorkspaces, setUserWorkspaces] = useState<Awaited<ReturnType<typeof listWorkspacesForUser>>>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspacePendingInvites, setWorkspacePendingInvites] = useState<WorkspacePendingInvite[]>([]);

  const openCollaborationWorkspace = useOpenCollaborationWorkspace();

  const isOpenRef = useRef(isOpen);
  const effectiveResourceIdRef = useRef(resourceId);
  const asyncGenerationRef = useRef(0);
  const searchGenerationRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    effectiveResourceIdRef.current = effectiveResourceId;
  }, [effectiveResourceId]);

  const isAsyncStale = useCallback((generation: number, expectedResourceId?: string): boolean => {
    if (generation !== asyncGenerationRef.current) return true;
    if (!isOpenRef.current) return true;
    if (
      expectedResourceId !== undefined &&
      expectedResourceId !== effectiveResourceIdRef.current
    ) {
      return true;
    }
    return false;
  }, []);

  const resetWizardTransientState = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setActionError(null);
    setPendingInvites([]);
    setWorkspacePendingInvites([]);
    setSelectedWorkspaceId(null);
  }, []);

  const runSubmittingAction = useCallback(async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const kindLabel = getSharedResourceKindLabel(kind);
  const resourceLabel = resourceTitle.trim() || kindLabel;
  const wizardTitle = getWizardStepTitle(wizardStep, sharePath);

  const loadWorkspaceWizardData = useCallback(
    async (resourceIdOverride?: string, generation = asyncGenerationRef.current) => {
      const resourceIdForWizard = resourceIdOverride ?? effectiveResourceIdRef.current;
      const composition = await suggestWorkspaceCompositionFromResource(kind, resourceIdForWizard);
      if (isAsyncStale(generation, resourceIdForWizard)) return;

      setSuggestedComposition(composition);
      const labels = await resolveWorkspaceResourceLabels(composition);
      if (isAsyncStale(generation, resourceIdForWizard)) return;

      setCompositionLabels(labels);
      setSelectedCompositionKeys(
        new Set(composition.map((resource) => `${resource.kind}:${resource.resourceId}`))
      );
      setWorkspaceName(resourceTitle.trim() || getSharedResourceKindLabel(kind));

      const workspaces = await listWorkspacesForUser(user.id);
      if (isAsyncStale(generation, resourceIdForWizard)) return;

      setUserWorkspaces(workspaces);
    },
    [isAsyncStale, kind, resourceTitle, user.id]
  );

  const resolveShareTargetResourceId = useCallback(async (): Promise<string | null> => {
    if (shareIntent === 'share_current' || hasAppliedShareDuplicate) {
      return effectiveResourceId;
    }

    const duplicateResult = await duplicateSharedResourceForOwner(kind, effectiveResourceId, user.id);
    if (duplicateResult.success === false) {
      setActionError(duplicateResult.error);
      return null;
    }

    setEffectiveResourceId(duplicateResult.copiedResourceId);
    effectiveResourceIdRef.current = duplicateResult.copiedResourceId;
    setHasAppliedShareDuplicate(true);
    return duplicateResult.copiedResourceId;
  }, [effectiveResourceId, hasAppliedShareDuplicate, kind, shareIntent, user.id]);

  const refreshCollaborationState = useCallback(
    async (generation = asyncGenerationRef.current, loadResourceId = effectiveResourceIdRef.current) => {
      setIsLoading(true);
      setError(null);
      try {
        const resource = await getShareableResource(kind, loadResourceId);
        if (isAsyncStale(generation, loadResourceId)) return;

        const memberList = resource ? await listSharedResourceMembers(resource.id) : [];
        if (isAsyncStale(generation, loadResourceId)) return;

        const inviteList = await listResourceInvites(kind, loadResourceId, user.id);
        if (isAsyncStale(generation, loadResourceId)) return;

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
        if (isAsyncStale(generation, loadResourceId)) return;
        console.error('[CollaborationShareModal] refresh:', loadError);
        setError('Impossibile caricare lo stato della condivisione.');
      } finally {
        if (!isAsyncStale(generation, loadResourceId)) {
          setIsLoading(false);
        }
      }
    },
    [isAsyncStale, kind, user.id]
  );

  useEffect(() => {
    if (!isOpen) return;

    asyncGenerationRef.current += 1;
    const generation = asyncGenerationRef.current;

    setEffectiveResourceId(resourceId);
    effectiveResourceIdRef.current = resourceId;
    setHasAppliedShareDuplicate(false);
    resetWizardTransientState();
    void refreshCollaborationState(generation, resourceId);
  }, [isOpen, resourceId, refreshCollaborationState, resetWizardTransientState]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3 && !trimmed.includes('@')) {
      setSearchResults([]);
      return;
    }

    searchGenerationRef.current += 1;
    const searchGeneration = searchGenerationRef.current;

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersForCollaborationInvite(user.id, trimmed);
        if (searchGeneration !== searchGenerationRef.current || !isOpenRef.current) return;

        const excluded = new Set([
          user.id,
          ...pendingInvites.map((invite) => invite.userId),
          ...members.map((member) => member.userId),
          ...invites
            .filter((invite) => invite.status === 'pending')
            .map((invite) => invite.inviteeId),
          ...workspacePendingInvites.map((invite) => invite.userId),
        ]);
        setSearchResults(results.filter((result) => !excluded.has(result.id)));
      } finally {
        if (searchGeneration === searchGenerationRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, isOpen, user.id, pendingInvites, members, invites, workspacePendingInvites]);

  useGlobalModalEscape(isOpen, onClose);

  const handlePathContinue = async () => {
    setActionError(null);
    if (sharePath === 'simple') {
      setWizardStep('mode');
      return;
    }
    setWizardStep('share_intent');
  };

  const handleShareIntentContinue = async () => {
    setActionError(null);
    if (sharePath === 'create_workspace') {
      const targetId = await resolveShareTargetResourceId();
      if (!targetId) return;
      await loadWorkspaceWizardData(targetId, asyncGenerationRef.current);
      setWizardStep('workspace_setup');
      return;
    }
    if (sharePath === 'add_workspace') {
      const targetId = await resolveShareTargetResourceId();
      if (!targetId) return;
      const workspaces = await listWorkspacesForUser(user.id);
      setUserWorkspaces(workspaces);
      setWizardStep('workspace_select');
      return;
    }
    setWizardStep('invite');
  };

  const handleModeContinue = () => {
    setActionError(null);
    if (sharingMode === 'collaborative') {
      setWizardStep('share_intent');
      return;
    }
    setWizardStep('invite');
  };

  const handleWizardBack = () => {
    setActionError(null);
    if (wizardStep === 'invite') {
      setWizardStep(sharingMode === 'collaborative' ? 'share_intent' : 'mode');
    } else if (wizardStep === 'share_intent') {
      setWizardStep(sharePath === 'simple' ? 'mode' : 'path');
    } else if (wizardStep === 'mode') setWizardStep('path');
    else if (wizardStep === 'workspace_invite') setWizardStep('workspace_composition');
    else if (wizardStep === 'workspace_composition') setWizardStep('workspace_setup');
    else if (wizardStep === 'workspace_setup') setWizardStep('path');
    else if (wizardStep === 'workspace_select') setWizardStep('path');
  };

  const handleWorkspaceSetupContinue = () => {
    if (!workspaceName.trim()) {
      setActionError('Il nome del Workspace è obbligatorio.');
      return;
    }
    setActionError(null);
    setWizardStep('workspace_composition');
  };

  const handleWorkspaceCompositionContinue = () => {
    if (selectedCompositionKeys.size === 0) {
      setActionError('Seleziona almeno una risorsa per il Workspace.');
      return;
    }
    setActionError(null);
    setWizardStep('workspace_invite');
  };

  const handleWorkspaceSelectContinue = async () => {
    if (!selectedWorkspaceId) {
      setActionError('Seleziona un Workspace.');
      return;
    }
    await runSubmittingAction(async () => {
      const targetResourceId = await resolveShareTargetResourceId();
      if (!targetResourceId || !selectedWorkspaceId) return;

      const result = await addResourceToExistingWorkspace(selectedWorkspaceId, user.id, {
        kind,
        resourceId: targetResourceId,
      });
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile collegare la risorsa.');
        return;
      }
      onClose();
      openCollaborationWorkspace({ workspaceId: selectedWorkspaceId });
    });
  };

  const selectedComposition = useMemo(
    () =>
      suggestedComposition.filter((resource) =>
        selectedCompositionKeys.has(`${resource.kind}:${resource.resourceId}`)
      ),
    [suggestedComposition, selectedCompositionKeys]
  );

  const buildWorkspaceInvitePermissions = useCallback(
    () =>
      selectedComposition.map((resource) => ({
        kind: resource.kind,
        resourceId: resource.resourceId,
        accessLevel: 'collaborator' as const,
      })),
    [selectedComposition]
  );

  const handleToggleCompositionResource = (
    resourceKind: WorkspaceCompositionResource['kind'],
    resourceId: string
  ) => {
    const key = `${resourceKind}:${resourceId}`;
    setSelectedCompositionKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAddWorkspacePendingInvite = (result: CollaborationUserSearchResult) => {
    setWorkspacePendingInvites((current) => [
      ...current,
      {
        userId: result.id,
        name: result.name,
        slug: result.slug,
        permissions: buildWorkspaceInvitePermissions(),
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveWorkspacePendingInvite = (userId: string) => {
    setWorkspacePendingInvites((current) => current.filter((invite) => invite.userId !== userId));
  };

  const handleCreateWorkspace = async () => {
    if (selectedComposition.length === 0) {
      setActionError('Seleziona almeno una risorsa.');
      return;
    }

    await runSubmittingAction(async () => {
      const targetResourceId = await resolveShareTargetResourceId();
      if (!targetResourceId) return;

      const compositionForWorkspace =
        sharePath === 'create_workspace' && hasAppliedShareDuplicate
          ? selectedComposition.map((resource) =>
              resource.kind === kind && resource.resourceId === resourceId
                ? { kind, resourceId: targetResourceId }
                : resource
            )
          : selectedComposition;

      const createResult = await createWorkspaceWithComposition(user.id, {
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
        resources: compositionForWorkspace,
      });

      if (createResult.success !== true) {
        setActionError(createResult.error);
        return;
      }

      const workspace = createResult.workspace;

      for (const pending of workspacePendingInvites) {
        const inviteResult = await sendWorkspaceInvite(
          user.id,
          workspace.id,
          { userId: pending.userId },
          pending.permissions
        );
        if (inviteResult.success !== true) {
          setActionError(inviteResult.error);
          return;
        }
      }

      onClose();
      openCollaborationWorkspace({ workspaceId: workspace.id });
    });
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

    await runSubmittingAction(async () => {
      const targetResourceId =
        sharingMode === 'collaborative'
          ? await resolveShareTargetResourceId()
          : effectiveResourceId;
      if (!targetResourceId) return;

      const registerResult = await ensureShareableResource(
        kind,
        targetResourceId,
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
          targetResourceId,
          { userId: pending.userId },
          pending.role
        );
        if (result.success !== true) {
          setActionError(result.error);
          return;
        }
      }

      await refreshCollaborationState();
    });
  };

  const handleRoleChange = async (memberUserId: string, role: CollaborativeMemberRole) => {
    if (!sharedResource) return;
    await runSubmittingAction(async () => {
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
    });
  };

  const handleRevokeMember = async (memberUserId: string) => {
    if (!sharedResource) return;
    await runSubmittingAction(async () => {
      const result = await removeSharedResourceMember(sharedResource.id, user.id, memberUserId);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile revocare l\'accesso.');
        return;
      }
      await refreshCollaborationState();
    });
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await runSubmittingAction(async () => {
      const result = await revokeResourceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    });
  };

  const handleResendInvite = async (inviteId: string) => {
    await runSubmittingAction(async () => {
      const result = await resendResourceInvite(user.id, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    });
  };

  const handleSharingModeChange = async (mode: SharingMode) => {
    if (!sharedResource || sharedResource.sharingMode === mode) return;
    await runSubmittingAction(async () => {
      const result = await updateShareableResourceMode(sharedResource.id, user.id, mode);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile aggiornare la modalità.');
        return;
      }
      setSharingMode(mode);
      await refreshCollaborationState();
    });
  };

  const handleManagementInvite = async (target: CollaborationUserSearchResult) => {
    await runSubmittingAction(async () => {
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
    });
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
              shareIntent={shareIntent}
              selectedRole={selectedRole}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              pendingInvites={pendingInvites}
              workspaceName={workspaceName}
              workspaceDescription={workspaceDescription}
              suggestedComposition={suggestedComposition}
              compositionLabels={compositionLabels}
              selectedCompositionKeys={selectedCompositionKeys}
              userWorkspaces={userWorkspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              workspacePendingInvites={workspacePendingInvites}
              workspaceDefaultAccess="collaborator"
              onSharePathChange={setSharePath}
              onSharingModeChange={setSharingMode}
              onShareIntentChange={setShareIntent}
              onSelectedRoleChange={setSelectedRole}
              onSearchQueryChange={setSearchQuery}
              onAddPendingInvite={handleAddPendingInvite}
              onRemovePendingInvite={handleRemovePendingInvite}
              onWorkspaceNameChange={setWorkspaceName}
              onWorkspaceDescriptionChange={setWorkspaceDescription}
              onToggleCompositionResource={handleToggleCompositionResource}
              onSelectWorkspace={setSelectedWorkspaceId}
              onAddWorkspacePendingInvite={handleAddWorkspacePendingInvite}
              onRemoveWorkspacePendingInvite={handleRemoveWorkspacePendingInvite}
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
              canChangeSharingMode={kind === 'suitcase' || kind === 'diary'}
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
            sharePath={sharePath}
            isSubmitting={isSubmitting}
            onClose={onClose}
            onPathContinue={handlePathContinue}
            onModeContinue={handleModeContinue}
            onShareIntentContinue={() => void runSubmittingAction(handleShareIntentContinue)}
            onSendInvites={handleSendInvites}
            onWorkspaceSetupContinue={handleWorkspaceSetupContinue}
            onWorkspaceCompositionContinue={handleWorkspaceCompositionContinue}
            onWorkspaceSelectContinue={handleWorkspaceSelectContinue}
            onCreateWorkspace={handleCreateWorkspace}
            onBack={handleWizardBack}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
