import React from 'react';
import { Loader2 } from 'lucide-react';
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

const PRIMARY_BUTTON_CLASS =
  'px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2';

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
      return { label: 'Continua', onClick: handlers.onWorkspaceSetupContinue };
    case 'workspace_composition':
      return { label: 'Continua', onClick: handlers.onWorkspaceCompositionContinue };
    case 'workspace_select':
      return {
        label: 'Collega al Workspace',
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
  const showBack =
    wizardStep !== 'path' &&
    !(wizardStep === 'workspace_setup' && sharePath === 'add_workspace');

  const isWorkspaceInviteStep = wizardStep === 'workspace_invite';

  const primaryAction = isWorkspaceInviteStep
    ? null
    : resolveWizardPrimaryAction(wizardStep, sharePath, isSubmitting, {
        onPathContinue,
        onModeContinue,
        onShareIntentContinue,
        onSendInvites,
        onWorkspaceSetupContinue,
        onWorkspaceCompositionContinue,
        onWorkspaceSelectContinue,
        onCreateWorkspace,
      });

  const workspaceInviteContinue = isWorkspaceInviteStep
    ? resolveWizardPrimaryAction('workspace_invite', sharePath, isSubmitting, {
        onPathContinue,
        onModeContinue,
        onShareIntentContinue,
        onSendInvites,
        onWorkspaceSetupContinue,
        onWorkspaceCompositionContinue,
        onWorkspaceSelectContinue,
        onCreateWorkspace,
      })
    : null;

  return (
    <div className="p-5 border-t border-slate-800 flex flex-wrap gap-2 justify-end shrink-0">
      {view === 'wizard' ? (
        <>
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white"
            >
              Indietro
            </button>
          )}

          {isWorkspaceInviteStep && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCreateWorkspaceLater}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 disabled:opacity-50"
            >
              Più tardi
            </button>
          )}

          {workspaceInviteContinue && (
            <button
              type="button"
              disabled={workspaceInviteContinue.disabled}
              onClick={workspaceInviteContinue.onClick}
              className={PRIMARY_BUTTON_CLASS}
            >
              {workspaceInviteContinue.showSpinner && <Loader2 className="w-4 h-4 animate-spin" />}
              {workspaceInviteContinue.label}
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
              className={PRIMARY_BUTTON_CLASS}
            >
              {primaryAction.showSpinner && <Loader2 className="w-4 h-4 animate-spin" />}
              {primaryAction.label}
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white"
        >
          Chiudi
        </button>
      )}
    </div>
  );
};
