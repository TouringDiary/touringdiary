import { Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

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
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell} !items-center`}
      style={{ zIndex: Z_MODAL }}
      onClick={onCancel}
    >
      <div
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-amber-500/30`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-desc"
      >
        <CloseButton
          onClose={onCancel}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />
        <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
          <AlertTriangle className="w-10 h-10 text-amber-500" aria-hidden />
          <h3 id="unsaved-changes-title" className={modalTitleShell}>{title}</h3>
          <p id="unsaved-changes-desc" className={`${modalSubtitleShell} whitespace-pre-line`}>{message}</p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void onSaveAndExit()}
              className={`${btnPrimaryShell} w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 disabled:opacity-50`}
            >
              {isProcessing ? 'Salvataggio...' : confirmLabel}
            </button>
            {showDiscard && onDiscard && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={onDiscard}
                className={`${btnCancelShell} w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-slate-300 hover:border-slate-700 hover:bg-slate-700`}
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
