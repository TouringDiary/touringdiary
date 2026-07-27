/**
 * Bootstrap / refresh / duplicate-target — solo CollaborationShareModal.
 * Lo stato resta nel modal; qui solo callback + effect di apertura.
 */
import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type {
  SharedResource,
  SharedResourceKind,
  SharedResourceMemberWithProfile,
  SharingMode,
  ResourceInvite,
} from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';
import {
  createDefaultCompositionDraft,
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  getShareableResource,
  listResourceInvites,
  listSharedResourceMembers,
  listWorkspacesForUser,
  resolveWorkspaceCompositionBlueprint,
} from '@/services/collaboration';
import { duplicateSharedResourceForOwner } from '@/services/collaboration/personalShareService';
import type {
  ModalView,
  PendingInvite,
  ShareIntent,
  SharePath,
  WizardStep,
  WorkspacePendingInvite,
} from './collaborationSharePresentation';
import {
  loadCreateWorkspaceCatalog,
  loadViaggioWorkspaceCatalog,
} from './collaborationShareLoaders';
import type { WorkspacePickedElement } from './WorkspaceShareWizardSteps';

export interface CollaborationShareBootstrapInput {
  isOpen: boolean;
  userId: string;
  kind?: SharedResourceKind;
  shareKind: SharedResourceKind;
  shareResourceId: string;
  resourceTitle: string;
  preselectedDiaryId?: string;
  workspaceId?: string;
  viaggioId?: string;
  viaggioTitle?: string;
  isCreateEntry: boolean;
  isFromViaggioEntry: boolean;
  isAddElementEntry: boolean;
  hasAppliedShareDuplicate: boolean;
  effectiveResourceId: string;
  isOpenRef: MutableRefObject<boolean>;
  effectiveResourceIdRef: MutableRefObject<string>;
  asyncGenerationRef: MutableRefObject<number>;
  compositionExpansionGenRef: MutableRefObject<number>;
  setShareKind: Dispatch<SetStateAction<SharedResourceKind>>;
  setView: Dispatch<SetStateAction<ModalView>>;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
  setSharePath: Dispatch<SetStateAction<SharePath>>;
  setSharingMode: Dispatch<SetStateAction<SharingMode>>;
  setShareIntent: Dispatch<SetStateAction<ShareIntent>>;
  setEffectiveResourceId: Dispatch<SetStateAction<string>>;
  setHasAppliedShareDuplicate: Dispatch<SetStateAction<boolean>>;
  setSharedResource: Dispatch<SetStateAction<SharedResource | null>>;
  setMembers: Dispatch<SetStateAction<SharedResourceMemberWithProfile[]>>;
  setInvites: Dispatch<SetStateAction<ResourceInvite[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setPendingInvites: Dispatch<SetStateAction<PendingInvite[]>>;
  setWorkspaceName: Dispatch<SetStateAction<string>>;
  setWorkspaceDescription: Dispatch<SetStateAction<string>>;
  setCompositionBlueprint: Dispatch<SetStateAction<WorkspaceCompositionBlueprint | null>>;
  setCompositionDraft: Dispatch<SetStateAction<WorkspaceCompositionDraft | null>>;
  setUserWorkspaces: Dispatch<
    SetStateAction<Awaited<ReturnType<typeof listWorkspacesForUser>>>
  >;
  setPickedElement: Dispatch<SetStateAction<WorkspacePickedElement | null>>;
  setIsExpandingCompositionDiary: Dispatch<SetStateAction<boolean>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setWorkspacePendingInvites: Dispatch<SetStateAction<WorkspacePendingInvite[]>>;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
}

export function useCollaborationShareBootstrap(input: CollaborationShareBootstrapInput) {
  const {
    isOpen,
    userId,
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
    compositionExpansionGenRef,
  } = input;

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
  }, [asyncGenerationRef, effectiveResourceIdRef, isOpenRef]);

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
  }, [
    compositionExpansionGenRef,
    setActionError,
    setCompositionBlueprint,
    setCompositionDraft,
    setIsExpandingCompositionDiary,
    setPendingInvites,
    setPickedElement,
    setSearchQuery,
    setSelectedWorkspaceId,
    setWorkspacePendingInvites,
  ]);

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

      const workspaces = await listWorkspacesForUser(userId);
      if (isAsyncStale(generation, originResourceId)) return;

      setUserWorkspaces(workspaces);
    },
    [
      asyncGenerationRef,
      isAsyncStale,
      isCreateEntry,
      resourceTitle,
      setCompositionBlueprint,
      setCompositionDraft,
      setUserWorkspaces,
      setWorkspaceName,
      userId,
    ]
  );

  const initializeCreateWorkspaceFlow = useCallback(
    async (generation: number) => {
      setView('wizard');
      setWizardStep('workspace_setup');
      setSharePath('create_workspace');
      setSharingMode('collaborative');
      setShareIntent('duplicate_and_share');
      setWorkspaceName(
        isFromViaggioEntry
          ? (viaggioTitle?.trim() || 'Workspace da Viaggio')
          : ''
      );
      setWorkspaceDescription('');

      const bootstrap = isFromViaggioEntry && viaggioId?.trim()
        ? await loadViaggioWorkspaceCatalog(
            userId,
            viaggioId.trim(),
            generation,
            isAsyncStale,
            preselectedDiaryId?.trim(),
          )
        : await loadCreateWorkspaceCatalog(
            userId,
            generation,
            isAsyncStale,
            preselectedDiaryId?.trim(),
          );
      if (!bootstrap) return;

      setCompositionBlueprint(bootstrap.blueprint);
      setCompositionDraft(bootstrap.draft);
      setUserWorkspaces(bootstrap.workspaces);
    },
    [
      isAsyncStale,
      isFromViaggioEntry,
      preselectedDiaryId,
      setCompositionBlueprint,
      setCompositionDraft,
      setShareIntent,
      setSharePath,
      setSharingMode,
      setUserWorkspaces,
      setView,
      setWizardStep,
      setWorkspaceDescription,
      setWorkspaceName,
      userId,
      viaggioId,
      viaggioTitle,
    ]
  );

  const initializeAddElementFlow = useCallback(
    async (generation: number) => {
      setView('wizard');
      setWizardStep('pick_element');
      setSharePath('add_workspace');
      setSharingMode('collaborative');
      setShareIntent('duplicate_and_share');
      setPickedElement(null);

      const bootstrap = await loadCreateWorkspaceCatalog(userId, generation, isAsyncStale);
      if (!bootstrap) return;

      setCompositionBlueprint(bootstrap.blueprint);
      setCompositionDraft(null);
      setUserWorkspaces(bootstrap.workspaces);
    },
    [
      isAsyncStale,
      setCompositionBlueprint,
      setCompositionDraft,
      setPickedElement,
      setShareIntent,
      setSharePath,
      setSharingMode,
      setUserWorkspaces,
      setView,
      setWizardStep,
      userId,
    ]
  );

  const resolveShareTargetResourceId = useCallback(async (): Promise<string | null> => {
    if (hasAppliedShareDuplicate) {
      return effectiveResourceId;
    }

    const duplicateResult = await duplicateSharedResourceForOwner(
      shareKind,
      effectiveResourceId,
      userId
    );
    if (duplicateResult.success === false) {
      setActionError(duplicateResult.error);
      return null;
    }

    setEffectiveResourceId(duplicateResult.copiedResourceId);
    effectiveResourceIdRef.current = duplicateResult.copiedResourceId;
    setHasAppliedShareDuplicate(true);
    return duplicateResult.copiedResourceId;
  }, [
    effectiveResourceId,
    effectiveResourceIdRef,
    hasAppliedShareDuplicate,
    setActionError,
    setEffectiveResourceId,
    setHasAppliedShareDuplicate,
    shareKind,
    userId,
  ]);

  const refreshCollaborationState = useCallback(
    async (generation = asyncGenerationRef.current, loadResourceId = effectiveResourceIdRef.current) => {
      setIsLoading(true);
      setError(null);
      try {
        const resource = await getShareableResource(shareKind, loadResourceId);
        if (isAsyncStale(generation, loadResourceId)) return;

        const memberList = resource ? await listSharedResourceMembers(resource.id) : [];
        if (isAsyncStale(generation, loadResourceId)) return;

        const inviteList = await listResourceInvites(shareKind, loadResourceId, userId);
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
    [
      asyncGenerationRef,
      effectiveResourceIdRef,
      isAsyncStale,
      setError,
      setInvites,
      setIsLoading,
      setMembers,
      setPendingInvites,
      setSharePath,
      setSharingMode,
      setSharedResource,
      setView,
      setWizardStep,
      shareKind,
      userId,
    ]
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
    kind,
    setShareKind,
    setEffectiveResourceId,
    setHasAppliedShareDuplicate,
    setIsLoading,
    setError,
    effectiveResourceIdRef,
    asyncGenerationRef,
  ]);

  return {
    isAsyncStale,
    loadWorkspaceWizardData,
    resolveShareTargetResourceId,
    refreshCollaborationState,
  };
}
