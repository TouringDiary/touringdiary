import { Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  discardLabel?: string;
  showDiscard?: boolean;
  isProcessing?: boolean;
  onSaveAndExit: () => void | Promise<void>;
  onDiscard?: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  title = 'Modifiche non salvate',
  message = 'Hai modifiche non salvate. Vuoi salvarle prima di uscire?',
  confirmLabel = 'Salva ed esci',
  cancelLabel = 'Annulla',
  discardLabel = 'Esci senza salvare',
  showDiscard = true,
  isProcessing = false,
  onSaveAndExit,
  onDiscard,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="td-modal-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      style={{ zIndex: Z_MODAL }}
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClose={onCancel} variant="primary" position="absolute" className="top-4 right-4" />
        <div className="flex flex-col items-center text-center gap-4">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-slate-400 whitespace-pre-line">{message}</p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void onSaveAndExit()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm"
            >
              {isProcessing ? 'Salvataggio...' : confirmLabel}
            </button>
            {showDiscard && onDiscard && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={onDiscard}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm border border-slate-700"
              >
                {discardLabel}
              </button>
            )}
            <button
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="w-full text-slate-500 hover:text-slate-300 font-bold py-2 text-sm"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
