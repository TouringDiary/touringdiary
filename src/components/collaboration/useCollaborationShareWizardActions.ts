/**
 * Azioni step wizard + create/add workspace — solo CollaborationShareModal.
 */
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { SharedResourceKind } from '@/domain/collaboration';
import {
  countSelectedResources,
  draftToCompositionResources,
  validateWorkspaceCompositionDraft,
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  buildWorkspaceViaggioShellSettings,
  toWorkspaceSettingsBagViaggioShell,
} from '@/domain/collaboration/workspaceViaggioShell';
import {
  addResourceToExistingWorkspace,
  listWorkspacesForUser,
} from '@/services/collaboration';
import { duplicateSharedResourceForOwner } from '@/services/collaboration/personalShareService';
import type { ShareIntent, SharePath, WizardStep, WorkspacePendingInvite } from './collaborationSharePresentation';
import { finalizeCreateWorkspacePipeline } from './collaborationSharePipeline';
import type { WorkspacePickedElement } from './WorkspaceShareWizardSteps';

export function useCollaborationShareWizardActions(input: {
  userId: string;
  onClose: () => void;
  openCollaborationWorkspace: (target: { workspaceId: string }) => void;
  isCreateEntry: boolean;
  isFromViaggioEntry: boolean;
  isAddElementEntry: boolean;
  shareKind: SharedResourceKind;
  shareResourceId: string;
  sharePath: SharePath;
  shareIntent: ShareIntent;
  workspaceId?: string;
  viaggioId?: string;
  workspaceName: string;
  workspaceDescription: string;
  compositionDraft: WorkspaceCompositionDraft | null;
  compositionBlueprint: WorkspaceCompositionBlueprint | null;
  workspacePendingInvites: WorkspacePendingInvite[];
  selectedWorkspaceId: string | null;
  pickedElement: WorkspacePickedElement | null;
  asyncGenerationRef: MutableRefObject<number>;
  effectiveResourceIdRef: MutableRefObject<string>;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setUserWorkspaces: Dispatch<
    SetStateAction<Awaited<ReturnType<typeof listWorkspacesForUser>>>
  >;
  setShareKind: Dispatch<SetStateAction<SharedResourceKind>>;
  setEffectiveResourceId: Dispatch<SetStateAction<string>>;
  setHasAppliedShareDuplicate: Dispatch<SetStateAction<boolean>>;
  goToNextWizardStep: () => void;
  isAsyncStale: (generation: number, expectedResourceId?: string) => boolean;
  loadWorkspaceWizardData: (
    seedKind: SharedResourceKind,
    originResourceId: string,
    generation?: number
  ) => Promise<void>;
  resolveShareTargetResourceId: () => Promise<string | null>;
  runSubmittingAction: (action: () => Promise<void>) => Promise<void>;
}) {
  const {
    userId,
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
  } = input;

  /** Avanzamento condiviso per path create/add workspace. `true` = path gestito (anche se stale). */
  const advanceWorkspaceSharePath = async (): Promise<boolean> => {
    if (sharePath === 'create_workspace') {
      await loadWorkspaceWizardData(shareKind, shareResourceId, asyncGenerationRef.current);
      setWizardStep('workspace_setup');
      return true;
    }
    if (sharePath === 'add_workspace') {
      const generation = asyncGenerationRef.current;
      const workspaces = await listWorkspacesForUser(userId);
      if (isAsyncStale(generation)) return true;
      setUserWorkspaces(workspaces);
      setWizardStep('workspace_select');
      return true;
    }
    return false;
  };

  const handleAddElementToWorkspace = async () => {
    if (!workspaceId || !pickedElement) {
      setActionError('Workspace o elemento non disponibile.');
      return;
    }

    await runSubmittingAction(async () => {
      const duplicateResult = await duplicateSharedResourceForOwner(
        pickedElement.kind,
        pickedElement.resourceId,
        userId
      );
      if (duplicateResult.success === false) {
        setActionError(duplicateResult.error);
        return;
      }

      const result = await addResourceToExistingWorkspace(workspaceId, userId, {
        kind: pickedElement.kind,
        resourceId: duplicateResult.copiedResourceId,
      });
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile collegare l\'elemento.');
        return;
      }

      onClose();
      openCollaborationWorkspace({ workspaceId });
    });
  };

  const handlePathContinue = async () => {
    setActionError(null);
    if (sharePath === 'simple') {
      setWizardStep('mode');
      return;
    }
    await advanceWorkspaceSharePath();
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
    if (await advanceWorkspaceSharePath()) return;
    setWizardStep('invite');
  };

  const handleModeContinue = () => {
    setActionError(null);
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

      const result = await addResourceToExistingWorkspace(selectedWorkspaceId, userId, {
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
    if (isAddElementEntry) {
      void handleAddElementToWorkspace();
      return;
    }
    goToNextWizardStep();
  };

  const handleCreateWorkspace = async (options?: { skipInvites?: boolean }) => {
    const snapshot = {
      draft: compositionDraft,
      blueprint: compositionBlueprint,
      workspaceName,
      workspaceDescription,
      shareIntent,
      workspacePendingInvites,
    };

    if (!snapshot.draft || !snapshot.blueprint) {
      setActionError('Composizione non disponibile.');
      return;
    }

    const draft = snapshot.draft;
    const blueprint = snapshot.blueprint;

    const validationError = validateWorkspaceCompositionDraft(
      draft,
      blueprint,
      { allowEmpty: isCreateEntry }
    );
    if (validationError) {
      setActionError(validationError);
      return;
    }

    const invitesToSend = options?.skipInvites ? [] : [...snapshot.workspacePendingInvites];
    const hasSelectedResources = countSelectedResources(draft) > 0;
    const compositionOriginals = draftToCompositionResources(draft);
    const viaggioShellSettings =
      isFromViaggioEntry && viaggioId?.trim()
        ? toWorkspaceSettingsBagViaggioShell(
            buildWorkspaceViaggioShellSettings({
              sourceViaggioId: viaggioId.trim(),
              resources: compositionOriginals,
            }),
          )
        : undefined;

    await runSubmittingAction(async () => {
      const result = await finalizeCreateWorkspacePipeline({
        hasSelectedResources,
        ownerId: userId,
        shareIntent: snapshot.shareIntent,
        draft,
        blueprint,
        workspaceName: snapshot.workspaceName,
        workspaceDescription: snapshot.workspaceDescription.trim() || undefined,
        settings: viaggioShellSettings,
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

  return {
    handlePathContinue,
    handleShareIntentContinue,
    handleModeContinue,
    handleWorkspaceSetupContinue,
    handleWorkspaceCompositionContinue,
    handleWorkspaceSelectContinue,
    handlePickElementContinue,
    handleCreateWorkspace,
  };
}
