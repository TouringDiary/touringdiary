import { useCallback, useMemo } from 'react';
import type { SharingMode } from '@/domain/collaboration';
import {
  countSelectedResources,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  resolveWizardStepsForContext,
  resolveWizardNextStep,
  resolveWizardPreviousStep,
  type SharePath,
  type WizardEntryMode,
  type WizardStep,
} from './collaborationSharePresentation';

export interface UseCollaborationWizardNavigationInput {
  entryMode: WizardEntryMode;
  sharePath: SharePath;
  sharingMode: SharingMode;
  compositionDraft: WorkspaceCompositionDraft | null;
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  isSubmitting: boolean;
  setActionError: (error: string | null) => void;
}

export function useCollaborationWizardNavigation({
  entryMode,
  sharePath,
  sharingMode,
  compositionDraft,
  wizardStep,
  setWizardStep,
  isSubmitting,
  setActionError,
}: UseCollaborationWizardNavigationInput) {
  const isCreateEntry = entryMode === 'create_workspace';

  const skipShareIntent =
    isCreateEntry &&
    compositionDraft !== null &&
    countSelectedResources(compositionDraft) === 0;

  const wizardSteps = useMemo(
    () =>
      resolveWizardStepsForContext({
        entryMode,
        sharePath,
        sharingMode,
        skipShareIntent,
      }),
    [entryMode, sharePath, sharingMode, skipShareIntent]
  );

  const canShowWizardBack = wizardSteps.length > 0 && wizardSteps[0] !== wizardStep;

  const goToNextWizardStep = useCallback(() => {
    const next = resolveWizardNextStep(wizardSteps, wizardStep);
    if (next) setWizardStep(next);
  }, [wizardSteps, wizardStep, setWizardStep]);

  const handleWizardBack = useCallback(() => {
    if (isSubmitting) return;
    setActionError(null);
    const previous = resolveWizardPreviousStep(wizardSteps, wizardStep);
    if (previous) setWizardStep(previous);
  }, [isSubmitting, setActionError, wizardSteps, wizardStep, setWizardStep]);

  return {
    skipShareIntent,
    wizardSteps,
    canShowWizardBack,
    goToNextWizardStep,
    handleWizardBack,
  };
}
