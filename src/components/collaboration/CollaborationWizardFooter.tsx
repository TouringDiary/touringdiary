import React from 'react';
import { Loader2 } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import type { ModalView, SharePath, WizardEntryMode, WizardStep } from './collaborationSharePresentation';

export interface CollaborationWizardFooterProps {
  view: ModalView;
  wizardStep: WizardStep;
  entryMode: WizardEntryMode;
  sharePath: SharePath;
  canShowBack: boolean;
  isFirstWizardStep: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onPathContinue: () => void;
  onModeContinue: () => void;
  onShareIntentContinue: () => void;
  onSendInvites: () => void;
  onWorkspaceSetupContinue: () => void;
  onWorkspaceCompositionContinue: () => void;
  onPickElementContinue: () => void;
  onWorkspaceSelectContinue: () => void;
  onCreateWorkspace: () => void;
  onCreateWorkspaceLater: () => void;
  onBack: () => void;
}

interface WizardPrimaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  showSpinner?: boolean;
}

function resolveWizardPrimaryAction(
  wizardStep: WizardStep,
  entryMode: WizardEntryMode,
  sharePath: SharePath,
  isSubmitting: boolean,
  handlers: Pick<
    CollaborationWizardFooterProps,
    | 'onPathContinue'
    | 'onModeContinue'
    | 'onShareIntentContinue'
    | 'onSendInvites'
    | 'onWorkspaceSetupContinue'
    | 'onWorkspaceCompositionContinue'
    | 'onPickElementContinue'
    | 'onWorkspaceSelectContinue'
    | 'onCreateWorkspace'
  >
): WizardPrimaryAction | null {
  const isWorkspacePath = sharePath === 'create_workspace' || sharePath === 'add_workspace';
  const isAddElementEntry = entryMode === 'add_element_to_workspace';
  /** Busy: disabilita + spinner (azioni async di submit). */
  const submittingBusy = { disabled: isSubmitting, showSpinner: isSubmitting };
  /** Solo disabled (navigazione step, senza spinner). */
  const submittingDisabled = { disabled: isSubmitting };

  switch (wizardStep) {
    case 'path':
      return { label: 'Continua', onClick: handlers.onPathContinue };
    case 'mode':
      return { label: 'Continua', onClick: handlers.onModeContinue };
    case 'share_intent':
      return {
        label: isAddElementEntry ? 'Collega' : 'Continua',
        onClick: handlers.onShareIntentContinue,
        ...submittingBusy,
      };
    case 'invite':
      if (isWorkspacePath) return null;
      return {
        label: 'Invia inviti',
        onClick: handlers.onSendInvites,
        ...submittingBusy,
      };
    case 'workspace_setup':
      return {
        label: 'Continua',
        onClick: handlers.onWorkspaceSetupContinue,
        ...submittingDisabled,
      };
    case 'workspace_composition':
      return {
        label: 'Continua',
        onClick: handlers.onWorkspaceCompositionContinue,
        ...submittingDisabled,
      };
    case 'pick_element':
      return {
        label: isAddElementEntry ? 'Collega' : 'Continua',
        onClick: handlers.onPickElementContinue,
        ...submittingBusy,
      };
    case 'workspace_select':
      return {
        label: 'Collega',
        onClick: handlers.onWorkspaceSelectContinue,
        ...submittingBusy,
      };
    case 'workspace_invite':
      return {
        label: 'Continua',
        onClick: handlers.onCreateWorkspace,
        ...submittingBusy,
      };
    default:
      return null;
  }
}

export const CollaborationWizardFooter: React.FC<CollaborationWizardFooterProps> = ({
  view,
  wizardStep,
  entryMode,
  sharePath,
  canShowBack,
  isFirstWizardStep,
  isSubmitting,
  onClose,
  onPathContinue,
  onModeContinue,
  onShareIntentContinue,
  onSendInvites,
  onWorkspaceSetupContinue,
  onWorkspaceCompositionContinue,
  onPickElementContinue,
  onWorkspaceSelectContinue,
  onCreateWorkspace,
  onCreateWorkspaceLater,
  onBack,
}) => {
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel);

  const showBack = canShowBack;

  const primaryAction = resolveWizardPrimaryAction(wizardStep, entryMode, sharePath, isSubmitting, {
    onPathContinue,
    onModeContinue,
    onShareIntentContinue,
    onSendInvites,
    onWorkspaceSetupContinue,
    onWorkspaceCompositionContinue,
    onPickElementContinue,
    onWorkspaceSelectContinue,
    onCreateWorkspace,
  });

  const showCancelOnPath = view === 'wizard' && isFirstWizardStep;

  return (
    <div className={`${footerShell} shrink-0`}>
      <div className={footerActionsShell}>
        {view === 'wizard' ? (
          <>
            {showCancelOnPath && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className={btnCancelShell}
              >
                Annulla
              </button>
            )}

            {showBack && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onBack}
                className={btnCancelShell}
              >
                Indietro
              </button>
            )}

            {wizardStep === 'workspace_invite' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onCreateWorkspaceLater}
                className={btnCancelShell}
              >
                Più tardi
              </button>
            )}

            {primaryAction && (
              <button
                type="button"
                disabled={primaryAction.disabled}
                onClick={primaryAction.onClick}
                className={btnPrimaryShell}
              >
                {primaryAction.showSpinner && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                {primaryAction.label}
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className={btnCancelShell}
          >
            Chiudi
          </button>
        )}
      </div>
    </div>
  );
};
