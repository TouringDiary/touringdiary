import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ModalView, WizardStep } from './collaborationSharePresentation';

export interface CollaborationWizardFooterProps {
  view: ModalView;
  wizardStep: WizardStep;
  isSubmitting: boolean;
  onClose: () => void;
  onPathContinue: () => void;
  onModeContinue: () => void;
  onSendInvites: () => void;
  onBack: () => void;
  onUseSimpleShare: () => void;
}

export const CollaborationWizardFooter: React.FC<CollaborationWizardFooterProps> = ({
  view,
  wizardStep,
  isSubmitting,
  onClose,
  onPathContinue,
  onModeContinue,
  onSendInvites,
  onBack,
  onUseSimpleShare,
}) => (
  <div className="p-5 border-t border-slate-800 flex flex-wrap gap-2 justify-end shrink-0">
    {view === 'wizard' ? (
      <>
        {wizardStep === 'workspace_notice' ? (
          <>
            <button
              type="button"
              onClick={onUseSimpleShare}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Usa condivisione semplice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white"
            >
              Chiudi
            </button>
          </>
        ) : (
          <>
            {wizardStep !== 'path' && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white"
              >
                Indietro
              </button>
            )}
            {wizardStep === 'path' && (
              <button
                type="button"
                onClick={onPathContinue}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Continua
              </button>
            )}
            {wizardStep === 'mode' && (
              <button
                type="button"
                onClick={onModeContinue}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Continua
              </button>
            )}
            {wizardStep === 'invite' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSendInvites}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Invia inviti
              </button>
            )}
          </>
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
