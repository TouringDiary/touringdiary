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
  Workspace,
  WorkspaceResourcePermissionEntry,
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
  sendResourceInvite,
  setSharedResourceMember,
  updateShareableResourceMode,
  suggestWorkspaceCompositionFromResource,
  createWorkspaceWithComposition,
  addResourceToExistingWorkspace,
  sendWorkspaceInvite,
  resolveWorkspaceCompositionBlueprint,
  resolveWorkspaceCompositionCatalog,
  materializeWorkspaceComposition,
  rollbackDuplicatedCompositionResources,
} from '@/services/collaboration';
import { duplicateSharedResourceForOwner } from '@/services/collaboration/personalShareService';
import type { WorkspaceCompositionResource } from '@/services/collaboration';
import {
  createDefaultCompositionDraft,
  countSelectedResources,
  draftToCompositionResources,
  validateWorkspaceCompositionDraft,
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
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
  buildDefaultWorkspaceInvitePermissions,
  mapWorkspaceInvitePermissionsToMaterialized,
  resolveCompositionResourceTitles,
  syncWorkspacePendingInvitePermissions,
} from './collaborationSharePresentation';
import type { WorkspacePickedElement } from './WorkspaceShareWizardSteps';
import { useCollaborationInviteSearch } from './useCollaborationInviteSearch';
import { useCollaborationWizardNavigation } from './useCollaborationWizardNavigation';

type WorkspaceList = Awaited<ReturnType<typeof listWorkspacesForUser>>;

type StepResult<T> = { success: true; value: T } | { success: false; error: string };

// =============================================================================
// Entry loaders composizione — due flussi distinti, due resolver distinti
//
// | Loader                    | Entry mode        | Resolver                              |
// |---------------------------|-------------------|---------------------------------------|
// | loadCreateWorkspaceCatalog| create_workspace  | resolveWorkspaceCompositionCatalog    |
// | loadWorkspaceWizardData   | share (+ share    | resolveWorkspaceCompositionBlueprint  |
// |                           |  path workspace)  |                                       |
// =============================================================================

/**
 * Entry loader — flusso «Crea Workspace» (`entryMode: 'create_workspace'`).
 * Carica catalogo personale + draft iniziale.
 * Restituisce `null` se la richiesta async non è più valida.
 */
async function loadCreateWorkspaceCatalog(
  userId: string,
  generation: number,
  isStale: (generation: number) => boolean,
  preselectedDiaryId?: string,
): Promise<{
  blueprint: WorkspaceCompositionBlueprint;
  draft: WorkspaceCompositionDraft;
  workspaces: WorkspaceList;
} | null> {
  const blueprint = await resolveWorkspaceCompositionCatalog({
    ownerId: userId,
    preselectedDiaryId,
  });
  if (isStale(generation)) return null;

  const draft = createDefaultCompositionDraft(blueprint);
  if (isStale(generation)) return null;

  const workspaces = await listWorkspacesForUser(userId);
  if (isStale(generation)) return null;

  return { blueprint, draft, workspaces };
}

// -----------------------------------------------------------------------------
// Composizione — merge draft e pipeline finalize create
// -----------------------------------------------------------------------------

/** Allinea la draft alla nuova blueprint, potando selezioni non più valide. */
function mergeCompositionDraftWithBlueprint(
  current: WorkspaceCompositionDraft | null,
  nextBlueprint: WorkspaceCompositionBlueprint,
  selectedDiaryId: string | null,
): WorkspaceCompositionDraft {
  const base = current ?? createDefaultCompositionDraft(nextBlueprint);
  const nextSuitcaseIds = new Set(
    [...base.selectedSuitcaseIds].filter((id) =>
      nextBlueprint.suitcases.candidates.some((candidate) => candidate.resourceId === id)
    )
  );
  const nextTemplateIds = new Set(
    [...base.selectedUserTemplateIds].filter((id) =>
      nextBlueprint.userTemplates.candidates.some((candidate) => candidate.resourceId === id)
    )
  );

  if (nextBlueprint.seed.kind === 'suitcase') {
    nextSuitcaseIds.add(nextBlueprint.seed.resourceId);
  }
  if (nextBlueprint.seed.kind === 'user_template') {
    nextTemplateIds.add(nextBlueprint.seed.resourceId);
  }

  return {
    ...base,
    selectedDiaryId,
    selectedSuitcaseIds: nextSuitcaseIds,
    selectedUserTemplateIds: nextTemplateIds,
  };
}

async function materializeSelectedComposition(input: {
  hasSelectedResources: boolean;
  ownerId: string;
  shareIntent: ShareIntent;
  draft: WorkspaceCompositionDraft;
  blueprint: WorkspaceCompositionBlueprint;
}): Promise<StepResult<WorkspaceCompositionResource[]>> {
  if (!input.hasSelectedResources) {
    return { success: true, value: [] };
  }

  const materializeResult = await materializeWorkspaceComposition({
    ownerId: input.ownerId,
    shareIntent: input.shareIntent,
    draft: input.draft,
    blueprint: input.blueprint,
  });

  if (materializeResult.success !== true) {
    return { success: false, error: materializeResult.error };
  }

  return { success: true, value: materializeResult.resources };
}

async function createWorkspaceFromMaterialized(input: {
  ownerId: string;
  name: string;
  description?: string;
  resources: WorkspaceCompositionResource[];
  rollbackDuplicatesOnFailure: boolean;
}): Promise<StepResult<Workspace>> {
  const createResult = await createWorkspaceWithComposition(input.ownerId, {
    name: input.name,
    description: input.description,
    resources: input.resources,
  });

  if (createResult.success !== true) {
    if (input.rollbackDuplicatesOnFailure) {
      await rollbackDuplicatedCompositionResources(input.resources);
    }
    return { success: false, error: createResult.error };
  }

  return { success: true, value: createResult.workspace };
}

async function sendPendingWorkspaceInvites(input: {
  ownerId: string;
  workspaceId: string;
  invites: WorkspacePendingInvite[];
  mapPermissions?: (
    permissions: WorkspaceResourcePermissionEntry[]
  ) => WorkspaceResourcePermissionEntry[];
}): Promise<StepResult<void>> {
  for (const pending of input.invites) {
    const permissions = input.mapPermissions
      ? input.mapPermissions(pending.permissions)
      : pending.permissions;

    const inviteResult = await sendWorkspaceInvite(
      input.ownerId,
      input.workspaceId,
      { userId: pending.userId },
      permissions
    );
    if (inviteResult.success !== true) {
      return { success: false, error: inviteResult.error };
    }
  }

  return { success: true, value: undefined };
}

async function finalizeCreateWorkspacePipeline(input: {
  hasSelectedResources: boolean;
  ownerId: string;
  shareIntent: ShareIntent;
  draft: WorkspaceCompositionDraft;
  blueprint: WorkspaceCompositionBlueprint;
  workspaceName: string;
  workspaceDescription?: string;
  invitesToSend: WorkspacePendingInvite[];
  compositionOriginals: Array<{ kind: SharedResourceKind; resourceId: string }>;
}): Promise<StepResult<Workspace>> {
  const materialized = await materializeSelectedComposition({
    hasSelectedResources: input.hasSelectedResources,
    ownerId: input.ownerId,
    shareIntent: input.shareIntent,
    draft: input.draft,
    blueprint: input.blueprint,
  });
  if (materialized.success === false) {
    return { success: false, error: materialized.error };
  }

  const materializedResources = materialized.value;
  const created = await createWorkspaceFromMaterialized({
    ownerId: input.ownerId,
    name: input.workspaceName.trim(),
    description: input.workspaceDescription,
    resources: materializedResources,
    rollbackDuplicatesOnFailure:
      input.hasSelectedResources && input.shareIntent === 'duplicate_and_share',
  });
  if (created.success === false) {
    return { success: false, error: created.error };
  }

  const invitePermissionsMapper = input.hasSelectedResources
    ? (permissions: WorkspaceResourcePermissionEntry[]) =>
        mapWorkspaceInvitePermissionsToMaterialized(
          permissions,
          input.compositionOriginals,
          materializedResources
        )
    : undefined;

  const invitesSent = await sendPendingWorkspaceInvites({
    ownerId: input.ownerId,
    workspaceId: created.value.id,
    invites: input.invitesToSend,
    mapPermissions: invitePermissionsMapper,
  });
  if (invitesSent.success === false) {
    return { success: false, error: invitesSent.error };
  }

  return { success: true, value: created.value };
}

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
  preselectedDiaryTitle,
  workspaceId,
}) => {
  const isCreateEntry = entryMode === 'create_workspace';
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
    compositionExpansionGenRef.current += 1;
    setSearchQuery('');
    setActionError(null);
    setPendingInvites([]);
    setWorkspacePendingInvites([]);
    setSelectedWorkspaceId(null);
    setCompositionBlueprint(null);
    setCompositionDraft(null);
    setPickedElement(null);
    setIsExpandingCompositionDiary(false);
  }, []);

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
    skipShareIntent,
    wizardSteps,
    canShowWizardBack,
    goToNextWizardStep,
    handleWizardBack,
  } = useCollaborationWizardNavigation({
    entryMode,
    sharePath,
    sharingMode,
    compositionDraft,
    wizardStep,
    setWizardStep,
    isSubmitting,
    setActionError,
  });

  /**
   * Entry loader — flusso «Condividi» (`entryMode: 'share'`).
   * Espande blueprint da seed risorsa via `resolveWorkspaceCompositionBlueprint`.
   * Usato anche dal percorso share «Crea Workspace e Condividi» (non dal create dedicato).
   */
  const loadWorkspaceWizardData = useCallback(
    async (
      seedKind: SharedResourceKind,
      originResourceId: string,
      generation = asyncGenerationRef.current
    ) => {
      const blueprint = await resolveWorkspaceCompositionBlueprint({
        seed: { kind: seedKind, resourceId: originResourceId },
      });
      if (isAsyncStale(generation, originResourceId)) return;

      setCompositionBlueprint(blueprint);
      setCompositionDraft(createDefaultCompositionDraft(blueprint));
      setWorkspaceName(
        isCreateEntry
          ? ''
          : resourceTitle.trim() || getSharedResourceKindLabel(seedKind)
      );

      const workspaces = await listWorkspacesForUser(user.id);
      if (isAsyncStale(generation, originResourceId)) return;

      setUserWorkspaces(workspaces);
    },
    [isAsyncStale, isCreateEntry, resourceTitle, user.id]
  );

  // -----------------------------------------------------------------------------
  // Init — create_workspace dedicato (usa loadCreateWorkspaceCatalog)
  // -----------------------------------------------------------------------------

  const initializeCreateWorkspaceFlow = useCallback(
    async (generation: number) => {
      setView('wizard');
      setWizardStep('workspace_setup');
      setSharePath('create_workspace');
      setSharingMode('collaborative');
      setWorkspaceName('');
      setWorkspaceDescription('');

      const bootstrap = await loadCreateWorkspaceCatalog(
        user.id,
        generation,
        isAsyncStale,
        preselectedDiaryId?.trim(),
      );
      if (!bootstrap) return;

      setCompositionBlueprint(bootstrap.blueprint);
      setCompositionDraft(bootstrap.draft);
      setUserWorkspaces(bootstrap.workspaces);
    },
    [isAsyncStale, preselectedDiaryId, user.id]
  );

  const initializeAddElementFlow = useCallback(
    async (generation: number) => {
      setView('wizard');
      setWizardStep('pick_element');
      setSharePath('add_workspace');
      setSharingMode('collaborative');
      setShareIntent('duplicate_and_share');
      setPickedElement(null);

      const bootstrap = await loadCreateWorkspaceCatalog(user.id, generation, isAsyncStale);
      if (!bootstrap) return;

      setCompositionBlueprint(bootstrap.blueprint);
      setCompositionDraft(null);
      setUserWorkspaces(bootstrap.workspaces);
    },
    [isAsyncStale, user.id]
  );

  const resolveShareTargetResourceId = useCallback(async (): Promise<string | null> => {
    if (shareIntent === 'share_current' || hasAppliedShareDuplicate) {
      return effectiveResourceId;
    }

    const duplicateResult = await duplicateSharedResourceForOwner(
      shareKind,
      effectiveResourceId,
      user.id
    );
    if (duplicateResult.success === false) {
      setActionError(duplicateResult.error);
      return null;
    }

    setEffectiveResourceId(duplicateResult.copiedResourceId);
    effectiveResourceIdRef.current = duplicateResult.copiedResourceId;
    setHasAppliedShareDuplicate(true);
    return duplicateResult.copiedResourceId;
  }, [effectiveResourceId, hasAppliedShareDuplicate, shareIntent, shareKind, user.id]);

  const refreshCollaborationState = useCallback(
    async (generation = asyncGenerationRef.current, loadResourceId = effectiveResourceIdRef.current) => {
      setIsLoading(true);
      setError(null);
      try {
        const resource = await getShareableResource(shareKind, loadResourceId);
        if (isAsyncStale(generation, loadResourceId)) return;

        const memberList = resource ? await listSharedResourceMembers(resource.id) : [];
        if (isAsyncStale(generation, loadResourceId)) return;

        const inviteList = await listResourceInvites(shareKind, loadResourceId, user.id);
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
    [isAsyncStale, shareKind, user.id]
  );

  useEffect(() => {
    if (!isOpen) return;

    asyncGenerationRef.current += 1;
    const generation = asyncGenerationRef.current;

    resetWizardTransientState();

    if (kind) {
      setShareKind(kind);
    }

    if (isCreateEntry) {
      setEffectiveResourceId(preselectedDiaryId ?? '');
      effectiveResourceIdRef.current = preselectedDiaryId ?? '';
      setHasAppliedShareDuplicate(false);
      setIsLoading(true);
      setError(null);
      void (async () => {
        try {
          await initializeCreateWorkspaceFlow(generation);
        } catch (loadError) {
          if (!isAsyncStale(generation)) {
            console.error('[CollaborationShareModal] create init:', loadError);
            setError('Impossibile avviare la creazione del Workspace.');
          }
        } finally {
          if (!isAsyncStale(generation)) {
            setIsLoading(false);
          }
        }
      })();
      return;
    }

    if (isAddElementEntry) {
      if (!workspaceId) {
        setError('Workspace non disponibile.');
        setIsLoading(false);
        return;
      }
      setEffectiveResourceId('');
      effectiveResourceIdRef.current = '';
      setHasAppliedShareDuplicate(false);
      setIsLoading(true);
      setError(null);
      void (async () => {
        try {
          await initializeAddElementFlow(generation);
        } catch (loadError) {
          if (!isAsyncStale(generation)) {
            console.error('[CollaborationShareModal] add element init:', loadError);
            setError('Impossibile avviare l\'aggiunta dell\'elemento.');
          }
        } finally {
          if (!isAsyncStale(generation)) {
            setIsLoading(false);
          }
        }
      })();
      return;
    }

    if (!shareResourceId) return;

    setEffectiveResourceId(shareResourceId);
    effectiveResourceIdRef.current = shareResourceId;
    setHasAppliedShareDuplicate(false);
    void refreshCollaborationState(generation, shareResourceId);
  }, [
    isOpen,
    isCreateEntry,
    isAddElementEntry,
    preselectedDiaryId,
    shareResourceId,
    workspaceId,
    initializeCreateWorkspaceFlow,
    initializeAddElementFlow,
    isAsyncStale,
    refreshCollaborationState,
    resetWizardTransientState,
  ]);

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
    if (isAddElementEntry) {
      await handleAddElementToWorkspace();
      return;
    }
    if (isCreateEntry) {
      goToNextWizardStep();
      return;
    }
    if (sharePath === 'create_workspace') {
      await loadWorkspaceWizardData(shareKind, shareResourceId, asyncGenerationRef.current);
      setWizardStep('workspace_setup');
      return;
    }
    if (sharePath === 'add_workspace') {
      const targetId = await resolveShareTargetResourceId();
      if (!targetId) return;
      const generation = asyncGenerationRef.current;
      const workspaces = await listWorkspacesForUser(user.id);
      if (isAsyncStale(generation)) return;
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

  const handleWorkspaceSetupContinue = () => {
    if (!workspaceName.trim()) {
      setActionError('Il nome del Workspace è obbligatorio.');
      return;
    }
    setActionError(null);
    goToNextWizardStep();
  };

  const handleWorkspaceCompositionContinue = () => {
    if (!compositionDraft || !compositionBlueprint) {
      setActionError('Composizione non disponibile.');
      return;
    }
    const validationError = validateWorkspaceCompositionDraft(
      compositionDraft,
      compositionBlueprint,
      { allowEmpty: isCreateEntry }
    );
    if (validationError) {
      setActionError(validationError);
      return;
    }
    setActionError(null);
    goToNextWizardStep();
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
        kind: shareKind,
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

  const selectedComposition = useMemo((): WorkspaceCompositionResource[] => {
    if (!compositionDraft) return [];
    return draftToCompositionResources(compositionDraft);
  }, [compositionDraft]);

  const compositionInviteElements = useMemo(() => {
    if (!compositionBlueprint) return [];
    return resolveCompositionResourceTitles(compositionBlueprint, selectedComposition);
  }, [compositionBlueprint, selectedComposition]);

  useEffect(() => {
    setWorkspacePendingInvites((current) => {
      if (current.length === 0) return current;
      return syncWorkspacePendingInvitePermissions(current, selectedComposition);
    });
  }, [selectedComposition]);

  const buildWorkspaceInvitePermissions = useCallback(
    () => buildDefaultWorkspaceInvitePermissions(selectedComposition),
    [selectedComposition]
  );

  const refreshCompositionBlueprint = useCallback(
    async (seed: WorkspaceCompositionBlueprint['seed'], selectedDiaryId: string | null) => {
      const generation = ++compositionExpansionGenRef.current;

      setIsExpandingCompositionDiary(true);
      try {
        const nextBlueprint = await resolveWorkspaceCompositionBlueprint({
          seed,
          selectedDiaryId,
        });
        if (generation !== compositionExpansionGenRef.current) return;

        setCompositionBlueprint(nextBlueprint);
        setCompositionDraft((current) =>
          mergeCompositionDraftWithBlueprint(current, nextBlueprint, selectedDiaryId)
        );
      } finally {
        if (generation === compositionExpansionGenRef.current) {
          setIsExpandingCompositionDiary(false);
        }
      }
    },
    []
  );

  const handleSelectCompositionDiary = useCallback(
    (diaryId: string | null) => {
      if (isCreateEntry) {
        setCompositionDraft((current) =>
          current ? { ...current, selectedDiaryId: diaryId } : current
        );
        return;
      }

      if (!compositionBlueprint || compositionBlueprint.seed.kind === 'diary') return;
      void refreshCompositionBlueprint(compositionBlueprint.seed, diaryId);
    },
    [compositionBlueprint, isCreateEntry, refreshCompositionBlueprint]
  );

  const handleToggleCompositionSuitcase = useCallback((suitcaseId: string) => {
    setCompositionDraft((current) => {
      if (!current) return current;
      const next = new Set(current.selectedSuitcaseIds);
      if (next.has(suitcaseId)) next.delete(suitcaseId);
      else next.add(suitcaseId);
      return { ...current, selectedSuitcaseIds: next };
    });
  }, []);

  const handleToggleCompositionUserTemplate = useCallback((templateId: string) => {
    setCompositionDraft((current) => {
      if (!current) return current;
      const next = new Set(current.selectedUserTemplateIds);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return { ...current, selectedUserTemplateIds: next };
    });
  }, []);

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
  };

  const handleRemoveWorkspacePendingInvite = (userId: string) => {
    setWorkspacePendingInvites((current) => current.filter((invite) => invite.userId !== userId));
  };

  const handleUpdateWorkspacePendingInvitePermission = useCallback(
    (
      userId: string,
      kind: SharedResourceKind,
      resourceId: string,
      accessLevel: WorkspaceResourcePermissionEntry['accessLevel']
    ) => {
      setWorkspacePendingInvites((current) =>
        current.map((invite) => {
          if (invite.userId !== userId) return invite;

          const hasEntry = invite.permissions.some(
            (entry) => entry.kind === kind && entry.resourceId === resourceId
          );
          const permissions = hasEntry
            ? invite.permissions.map((entry) =>
                entry.kind === kind && entry.resourceId === resourceId
                  ? { ...entry, accessLevel }
                  : entry
              )
            : [...invite.permissions, { kind, resourceId, accessLevel }];

          return { ...invite, permissions };
        })
      );
    },
    []
  );

  const handlePickElementContinue = () => {
    if (!pickedElement) {
      setActionError('Seleziona un elemento da aggiungere.');
      return;
    }
    setShareKind(pickedElement.kind);
    setEffectiveResourceId(pickedElement.resourceId);
    effectiveResourceIdRef.current = pickedElement.resourceId;
    setHasAppliedShareDuplicate(false);
    setActionError(null);
    goToNextWizardStep();
  };

  const handleAddElementToWorkspace = async () => {
    if (!workspaceId || !pickedElement) {
      setActionError('Workspace o elemento non disponibile.');
      return;
    }

    await runSubmittingAction(async () => {
      const targetResourceId = await resolveShareTargetResourceId();
      if (!targetResourceId) return;

      const result = await addResourceToExistingWorkspace(workspaceId, user.id, {
        kind: pickedElement.kind,
        resourceId: targetResourceId,
      });
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile collegare l\'elemento.');
        return;
      }

      onClose();
      openCollaborationWorkspace({ workspaceId });
    });
  };

  const handleCreateWorkspace = async (options?: { skipInvites?: boolean }) => {
    const draftSnapshot = compositionDraft;
    const blueprintSnapshot = compositionBlueprint;
    const workspaceNameSnapshot = workspaceName;
    const workspaceDescriptionSnapshot = workspaceDescription;
    const shareIntentSnapshot = shareIntent;
    const workspacePendingInvitesSnapshot = workspacePendingInvites;

    if (!draftSnapshot || !blueprintSnapshot) {
      setActionError('Composizione non disponibile.');
      return;
    }

    const validationError = validateWorkspaceCompositionDraft(
      draftSnapshot,
      blueprintSnapshot,
      { allowEmpty: isCreateEntry }
    );
    if (validationError) {
      setActionError(validationError);
      return;
    }

    const invitesToSend = options?.skipInvites ? [] : [...workspacePendingInvitesSnapshot];
    const hasSelectedResources = countSelectedResources(draftSnapshot) > 0;
    const compositionOriginals = draftToCompositionResources(draftSnapshot);

    await runSubmittingAction(async () => {
      const result = await finalizeCreateWorkspacePipeline({
        hasSelectedResources,
        ownerId: user.id,
        shareIntent: shareIntentSnapshot,
        draft: draftSnapshot,
        blueprint: blueprintSnapshot,
        workspaceName: workspaceNameSnapshot,
        workspaceDescription: workspaceDescriptionSnapshot.trim() || undefined,
        invitesToSend,
        compositionOriginals,
      });
      if (result.success === false) {
        setActionError(result.error);
        return;
      }

      onClose();
      openCollaborationWorkspace({ workspaceId: result.value.id });
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
        shareKind,
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
          shareKind,
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
        shareKind,
        shareResourceId,
        { userId: target.id },
        selectedRole
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setSearchQuery('');
      await refreshCollaborationState();
    });
  };

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
                  {isCreateEntry
                    ? 'Crea Workspace'
                    : isAddElementEntry
                      ? 'Aggiungi elemento'
                      : 'Condividi'}
                </h2>
                <p id={modalDescId} className={modalSubtitleShell}>
                  {isCreateEntry
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
              skipShareIntent={skipShareIntent}
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
