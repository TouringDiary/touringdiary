import { Z_MODAL, Z_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, FolderPlus, Loader2, Share2 } from 'lucide-react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
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
  listWorkspacesForUser,
  removeSharedResourceMember,
  revokeResourceInvite,
} from '@/services/collaboration';
import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import { CollaborationManagementView } from './CollaborationManagementView';
import { CollaborationShareWizard } from './CollaborationShareWizard';
import { CollaborationWizardFooter } from './CollaborationWizardFooter';
import { WizardStepIndicator } from './WizardStepIndicator';
import {
  type ModalView,
  type PendingInvite,
  type ShareIntent,
  type SharePath,
  type WizardEntryMode,
  type WizardStep,
  type WorkspacePendingInvite,
  isWorkspaceCreationEntryMode,
} from './collaborationSharePresentation';
import type { WorkspacePickedElement } from './WorkspaceShareWizardSteps';
import { useCollaborationInviteSearch } from './useCollaborationInviteSearch';
import { useCollaborationWizardNavigation } from './useCollaborationWizardNavigation';
import { useCollaborationShareBootstrap } from './useCollaborationShareBootstrap';
import { useCollaborationShareCompositionHandlers } from './useCollaborationShareCompositionHandlers';
import { useCollaborationShareResourceHandlers } from './useCollaborationShareResourceHandlers';
import { useCollaborationShareWizardActions } from './useCollaborationShareWizardActions';

// =============================================================================
// Orchestratore UI — stato locale + wiring; callback in hook locali coesi
// =============================================================================

export interface CollaborationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  entryMode?: WizardEntryMode;
  kind?: SharedResourceKind;
  resourceId?: string;
  resourceTitle?: string;
  preselectedDiaryId?: string;
  preselectedDiaryTitle?: string;
  workspaceId?: string;
  /** Richiesto per `workspace_from_viaggio`. */
  viaggioId?: string;
  viaggioTitle?: string;
}

export const CollaborationShareModal: React.FC<CollaborationShareModalProps> = ({
  isOpen,
  onClose,
  user,
  entryMode = 'share',
  kind,
  resourceId,
  resourceTitle = '',
  preselectedDiaryId,
  workspaceId,
  viaggioId,
  viaggioTitle,
}) => {
  const isCreateEntry = isWorkspaceCreationEntryMode(entryMode);
  const isFromViaggioEntry = entryMode === 'workspace_from_viaggio';
  const isAddElementEntry = entryMode === 'add_element_to_workspace';
  const [shareKind, setShareKind] = useState<SharedResourceKind>(kind ?? 'diary');
  const shareResourceId = resourceId ?? '';
  const [view, setView] = useState<ModalView>('wizard');
  const [wizardStep, setWizardStep] = useState<WizardStep>('path');
  const [sharePath, setSharePath] = useState<SharePath>('simple');
  const [sharingMode, setSharingMode] = useState<SharingMode>('collaborative');
  const [shareIntent, setShareIntent] = useState<ShareIntent>('duplicate_and_share');
  const [effectiveResourceId, setEffectiveResourceId] = useState(shareResourceId);
  const [hasAppliedShareDuplicate, setHasAppliedShareDuplicate] = useState(false);
  const [sharedResource, setSharedResource] = useState<SharedResource | null>(null);
  const [members, setMembers] = useState<SharedResourceMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<ResourceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<CollaborativeMemberRole>('collaborator');
  const [revokeMemberTarget, setRevokeMemberTarget] = useState<SharedResourceMemberWithProfile | null>(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState<ResourceInvite | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [compositionBlueprint, setCompositionBlueprint] =
    useState<WorkspaceCompositionBlueprint | null>(null);
  const [compositionDraft, setCompositionDraft] = useState<WorkspaceCompositionDraft | null>(null);
  const [isExpandingCompositionDiary, setIsExpandingCompositionDiary] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState<Awaited<ReturnType<typeof listWorkspacesForUser>>>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspacePendingInvites, setWorkspacePendingInvites] = useState<WorkspacePendingInvite[]>([]);
  const [pickedElement, setPickedElement] = useState<WorkspacePickedElement | null>(null);

  const openCollaborationWorkspace = useOpenCollaborationWorkspace();

  const isOpenRef = useRef(isOpen);
  const effectiveResourceIdRef = useRef(shareResourceId);
  const asyncGenerationRef = useRef(0);
  const compositionExpansionGenRef = useRef(0);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const headerIconBoxShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
  const headerIconGlyphShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const inviteIntroTextShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.bodyText, isMobile);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  useGlobalModalEscape(isOpen, handleClose);

  const excludedSearchUserIds = useMemo(
    () => [
      user.id,
      ...pendingInvites.map((invite) => invite.userId),
      ...members.map((member) => member.userId),
      ...invites
        .filter((invite) => invite.status === 'pending')
        .map((invite) => invite.inviteeId),
      ...workspacePendingInvites.map((invite) => invite.userId),
    ],
    [user.id, pendingInvites, members, invites, workspacePendingInvites]
  );

  const { searchResults, isSearching } = useCollaborationInviteSearch(
    user.id,
    isOpen,
    searchQuery,
    excludedSearchUserIds
  );

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    effectiveResourceIdRef.current = effectiveResourceId;
  }, [effectiveResourceId]);

  const runSubmittingAction = useCallback(async (action: () => Promise<void>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const kindLabel = getSharedResourceKindLabel(shareKind);
  const resourceLabel = resourceTitle.trim() || kindLabel;

  const {
    wizardSteps,
    canShowWizardBack,
    goToNextWizardStep,
    handleWizardBack,
  } = useCollaborationWizardNavigation({
    entryMode,
    sharePath,
    sharingMode,
    wizardStep,
    setWizardStep,
    isSubmitting,
    setActionError,
  });

  const {
    isAsyncStale,
    loadWorkspaceWizardData,
    resolveShareTargetResourceId,
    refreshCollaborationState,
  } = useCollaborationShareBootstrap({
    isOpen,
    userId: user.id,
    kind,
    shareKind,
    shareResourceId,
    resourceTitle,
    preselectedDiaryId,
    workspaceId,
    viaggioId,
    viaggioTitle,
    isCreateEntry,
    isFromViaggioEntry,
    isAddElementEntry,
    hasAppliedShareDuplicate,
    effectiveResourceId,
    isOpenRef,
    effectiveResourceIdRef,
    asyncGenerationRef,
    compositionExpansionGenRef,
    setShareKind,
    setView,
    setWizardStep,
    setSharePath,
    setSharingMode,
    setShareIntent,
    setEffectiveResourceId,
    setHasAppliedShareDuplicate,
    setSharedResource,
    setMembers,
    setInvites,
    setIsLoading,
    setError,
    setActionError,
    setPendingInvites,
    setWorkspaceName,
    setWorkspaceDescription,
    setCompositionBlueprint,
    setCompositionDraft,
    setUserWorkspaces,
    setPickedElement,
    setIsExpandingCompositionDiary,
    setSearchQuery,
    setWorkspacePendingInvites,
    setSelectedWorkspaceId,
  });

  const {
    compositionInviteElements,
    handleSelectCompositionDiary,
    handleToggleCompositionSuitcase,
    handleToggleCompositionUserTemplate,
    handleAddWorkspacePendingInvite,
    handleRemoveWorkspacePendingInvite,
    handleUpdateWorkspacePendingInvitePermission,
  } = useCollaborationShareCompositionHandlers({
    isCreateEntry,
    compositionBlueprint,
    compositionDraft,
    compositionExpansionGenRef,
    setCompositionBlueprint,
    setCompositionDraft,
    setIsExpandingCompositionDiary,
    setWorkspacePendingInvites,
    setSearchQuery,
  });

  const {
    handlePathContinue,
    handleShareIntentContinue,
    handleModeContinue,
    handleWorkspaceSetupContinue,
    handleWorkspaceCompositionContinue,
    handleWorkspaceSelectContinue,
    handlePickElementContinue,
    handleCreateWorkspace,
  } = useCollaborationShareWizardActions({
    userId: user.id,
    onClose,
    openCollaborationWorkspace,
    isCreateEntry,
    isFromViaggioEntry,
    isAddElementEntry,
    shareKind,
    shareResourceId,
    sharePath,
    shareIntent,
    workspaceId,
    viaggioId,
    workspaceName,
    workspaceDescription,
    compositionDraft,
    compositionBlueprint,
    workspacePendingInvites,
    selectedWorkspaceId,
    pickedElement,
    asyncGenerationRef,
    effectiveResourceIdRef,
    setWizardStep,
    setActionError,
    setUserWorkspaces,
    setShareKind,
    setEffectiveResourceId,
    setHasAppliedShareDuplicate,
    goToNextWizardStep,
    isAsyncStale,
    loadWorkspaceWizardData,
    resolveShareTargetResourceId,
    runSubmittingAction,
  });

  const {
    handleAddPendingInvite,
    handleRemovePendingInvite,
    handleSendInvites,
    handleRoleChange,
    handleResendInvite,
    handleSharingModeChange,
    handleManagementInvite,
  } = useCollaborationShareResourceHandlers({
    userId: user.id,
    shareKind,
    shareResourceId,
    sharingMode,
    sharedResource,
    selectedRole,
    pendingInvites,
    effectiveResourceId,
    setPendingInvites,
    setSearchQuery,
    setSharingMode,
    setActionError,
    runSubmittingAction,
    resolveShareTargetResourceId,
    refreshCollaborationState,
  });

  if (!isOpen) return null;

  const modalDescId = 'collaboration-share-desc';

  return createPortal(
    <>
      <DeleteConfirmationModal
        isOpen={revokeMemberTarget !== null}
        onClose={() => { if (!isSubmitting) setRevokeMemberTarget(null); }}
        onConfirm={() => {
          const target = revokeMemberTarget;
          if (!target || !sharedResource || isSubmitting) return;
          void runSubmittingAction(async () => {
            const result = await removeSharedResourceMember(
              sharedResource.id,
              user.id,
              target.userId
            );
            if (!result.success) {
              setActionError(result.error ?? "Impossibile revocare l'accesso.");
              return;
            }
            setRevokeMemberTarget(null);
            await refreshCollaborationState();
          });
        }}
        title="Revocare accesso?"
        message={
          revokeMemberTarget
            ? `Stai per revocare l'accesso di ${revokeMemberTarget.userName}.`
            : ''
        }
        confirmLabel="Revoca"
        isDeleting={isSubmitting}
        zIndex={Z_MODAL_NESTED}
      />
      <DeleteConfirmationModal
        isOpen={revokeInviteTarget !== null}
        onClose={() => { if (!isSubmitting) setRevokeInviteTarget(null); }}
        onConfirm={() => {
          const target = revokeInviteTarget;
          if (!target || isSubmitting) return;
          void runSubmittingAction(async () => {
            const result = await revokeResourceInvite(user.id, target.id);
            if (result.success !== true) {
              setActionError(result.error);
              return;
            }
            setRevokeInviteTarget(null);
            await refreshCollaborationState();
          });
        }}
        title="Revocare invito?"
        message="Stai per revocare questo invito in sospeso."
        confirmLabel="Revoca"
        isDeleting={isSubmitting}
        zIndex={Z_MODAL_NESTED}
      />
      <div
        className={`td-modal-overlay ${overlayShell}`}
        style={{ zIndex: Z_OVERLAY }}
        onClick={handleClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="collaboration-share-title"
          aria-describedby={modalDescId}
          className={`${containerShell} max-w-lg`}
          style={{ zIndex: Z_MODAL }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton
            onClose={handleClose}
            variant="primary"
            position="absolute"
            withEscape={false}
            disableIfDirty={isSubmitting}
            className={`${closeOffsetShell} z-local-overlay`}
          />
          <header className={headerShell}>
            <div className="flex items-center gap-4 pr-12 min-w-0 w-full">
              <div className={headerIconBoxShell}>
                {isCreateEntry ? (
                  <FolderPlus className={headerIconGlyphShell} aria-hidden />
                ) : isAddElementEntry ? (
                  <FolderPlus className={headerIconGlyphShell} aria-hidden />
                ) : (
                  <Share2 className={headerIconGlyphShell} aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <h2 id="collaboration-share-title" className={`${modalTitleShell} mb-1`}>
                  {isFromViaggioEntry
                    ? 'Workspace da Viaggio'
                    : isCreateEntry
                      ? 'Crea Workspace'
                      : isAddElementEntry
                        ? 'Aggiungi elemento'
                        : 'Condividi'}
                </h2>
                <p id={modalDescId} className={modalSubtitleShell}>
                  {isFromViaggioEntry
                    ? 'Seleziona le risorse da copiare nello spazio collaborativo'
                    : isCreateEntry
                      ? 'Configura il tuo spazio collaborativo'
                      : isAddElementEntry
                        ? 'Aggiungi un elemento personale al Workspace'
                        : resourceLabel}
                </p>
              </div>
            </div>
          </header>

          {view === 'wizard' && !isLoading && !error && (
            <WizardStepIndicator
              wizardStep={wizardStep}
              entryMode={entryMode}
              sharePath={sharePath}
              sharingMode={sharingMode}
            />
          )}

          <div className={`${bodyShell} flex-1 overflow-y-auto min-h-0 space-y-4`}>
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
              entryMode={entryMode}
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
              compositionBlueprint={compositionBlueprint}
              compositionDraft={compositionDraft}
              compositionInviteElements={compositionInviteElements}
              pickedElement={pickedElement}
              isExpandingCompositionDiary={isExpandingCompositionDiary}
              userWorkspaces={userWorkspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              workspacePendingInvites={workspacePendingInvites}
              inviteIntroClassName={inviteIntroTextShell}
              onSharePathChange={setSharePath}
              onSharingModeChange={setSharingMode}
              onShareIntentChange={setShareIntent}
              onSelectedRoleChange={setSelectedRole}
              onSearchQueryChange={setSearchQuery}
              isSubmitting={isSubmitting}
              onAddPendingInvite={handleAddPendingInvite}
              onRemovePendingInvite={handleRemovePendingInvite}
              onWorkspaceNameChange={setWorkspaceName}
              onWorkspaceDescriptionChange={setWorkspaceDescription}
              onSelectCompositionDiary={handleSelectCompositionDiary}
              onToggleCompositionSuitcase={handleToggleCompositionSuitcase}
              onToggleCompositionUserTemplate={handleToggleCompositionUserTemplate}
              onPickElement={setPickedElement}
              onSelectWorkspace={setSelectedWorkspaceId}
              onAddWorkspacePendingInvite={handleAddWorkspacePendingInvite}
              onRemoveWorkspacePendingInvite={handleRemoveWorkspacePendingInvite}
              onUpdateWorkspacePendingInvitePermission={handleUpdateWorkspacePendingInvitePermission}
            />
          ) : (
            <CollaborationManagementView
              sharedResource={sharedResource}
              members={members}
              invites={invites}
              selectedRole={selectedRole}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              isSubmitting={isSubmitting}
              canChangeSharingMode={shareKind === 'suitcase' || shareKind === 'diary'}
              onSharingModeChange={handleSharingModeChange}
              onSelectedRoleChange={setSelectedRole}
              onSearchQueryChange={setSearchQuery}
              onRoleChange={handleRoleChange}
              onRevokeMember={(memberUserId) => {
                const member = members.find((m) => m.userId === memberUserId);
                if (member) setRevokeMemberTarget(member);
              }}
              onRevokeInvite={(inviteId) => {
                const invite = invites.find((i) => i.id === inviteId);
                if (invite) setRevokeInviteTarget(invite);
              }}
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
            entryMode={entryMode}
            sharePath={sharePath}
            canShowBack={canShowWizardBack}
            isFirstWizardStep={wizardSteps[0] === wizardStep}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            onPathContinue={handlePathContinue}
            onModeContinue={handleModeContinue}
            onShareIntentContinue={() => void runSubmittingAction(handleShareIntentContinue)}
            onSendInvites={handleSendInvites}
            onWorkspaceSetupContinue={handleWorkspaceSetupContinue}
            onWorkspaceCompositionContinue={handleWorkspaceCompositionContinue}
            onPickElementContinue={handlePickElementContinue}
            onWorkspaceSelectContinue={handleWorkspaceSelectContinue}
            onCreateWorkspace={() => void handleCreateWorkspace()}
            onCreateWorkspaceLater={() => void handleCreateWorkspace({ skipInvites: true })}
            onBack={handleWizardBack}
          />
        )}
      </div>
    </div>
    </>,
    document.body
  );
};
