import React from 'react';
import { Loader2 } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import type { ModalView, SharePath, WizardStep } from './collaborationSharePresentation';

export interface CollaborationWizardFooterProps {
  view: ModalView;
  wizardStep: WizardStep;
  sharePath: SharePath;
  isSubmitting: boolean;
  onClose: () => void;
  onPathContinue: () => void;
  onModeContinue: () => void;
  onShareIntentContinue: () => void;
  onSendInvites: () => void;
  onWorkspaceSetupContinue: () => void;
  onWorkspaceCompositionContinue: () => void;
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
    | 'onWorkspaceSelectContinue'
    | 'onCreateWorkspace'
  >
): WizardPrimaryAction | null {
  const isWorkspacePath = sharePath === 'create_workspace' || sharePath === 'add_workspace';

  switch (wizardStep) {
    case 'path':
      return { label: 'Continua', onClick: handlers.onPathContinue };
    case 'mode':
      return { label: 'Continua', onClick: handlers.onModeContinue };
    case 'share_intent':
      return {
        label: 'Continua',
        onClick: handlers.onShareIntentContinue,
        disabled: isSubmitting,
        showSpinner: isSubmitting,
      };
    case 'invite':
      if (isWorkspacePath) return null;
      return {
        label: 'Invia inviti',
        onClick: handlers.onSendInvites,
        disabled: isSubmitting,
        showSpinner: isSubmitting,
      };
    case 'workspace_setup':
      return { label: 'Continua', onClick: handlers.onWorkspaceSetupContinue, disabled: isSubmitting };
    case 'workspace_composition':
      return {
        label: 'Continua',
        onClick: handlers.onWorkspaceCompositionContinue,
        disabled: isSubmitting,
      };
    case 'workspace_select':
      return {
        label: 'Collega',
        onClick: handlers.onWorkspaceSelectContinue,
        disabled: isSubmitting,
        showSpinner: isSubmitting,
      };
    case 'workspace_invite':
      return {
        label: 'Continua',
        onClick: handlers.onCreateWorkspace,
        disabled: isSubmitting,
        showSpinner: isSubmitting,
      };
    default:
      return null;
  }
}

export const CollaborationWizardFooter: React.FC<CollaborationWizardFooterProps> = ({
  view,
  wizardStep,
  sharePath,
  isSubmitting,
  onClose,
  onPathContinue,
  onModeContinue,
  onShareIntentContinue,
  onSendInvites,
  onWorkspaceSetupContinue,
  onWorkspaceCompositionContinue,
  onWorkspaceSelectContinue,
  onCreateWorkspace,
  onCreateWorkspaceLater,
  onBack,
}) => {
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel);

  const showBack =
    wizardStep !== 'path' &&
    !(wizardStep === 'workspace_setup' && sharePath === 'add_workspace');

  const primaryAction = resolveWizardPrimaryAction(wizardStep, sharePath, isSubmitting, {
    onPathContinue,
    onModeContinue,
    onShareIntentContinue,
    onSendInvites,
    onWorkspaceSetupContinue,
    onWorkspaceCompositionContinue,
    onWorkspaceSelectContinue,
    onCreateWorkspace,
  });

  const showCancelOnPath = view === 'wizard' && wizardStep === 'path';

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
