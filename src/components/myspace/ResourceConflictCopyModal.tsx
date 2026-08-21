import { AlertTriangle } from 'lucide-react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

export type ResourceConflictKind = 'diary' | 'suitcase';

interface Props {
  isOpen: boolean;
  kind: ResourceConflictKind;
  onClose: () => void;
  onConfirmCopy: () => void;
  busy?: boolean;
}

const MESSAGES: Record<ResourceConflictKind, string> = {
  diary:
    'Questo diario è già associato ad un altro Viaggio. Verrà creata una copia indipendente da associare al Viaggio selezionato.',
  suitcase:
    'Questa valigia è già associata ad un altro Viaggio o Diario. Verrà creata una copia indipendente da associare al nuovo Viaggio.',
};

export const ResourceConflictCopyModal: React.FC<Props> = ({
  isOpen,
  kind,
  onClose,
  onConfirmCopy,
  busy,
}) => {
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle);

  useGlobalModalEscape(isOpen && !busy, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell} !items-center`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      {!busy ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
          onClick={onClose}
        />
      ) : null}
      <div
        className={`relative ${containerShell} max-w-md outline-none`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-conflict-copy-title"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
          withEscape={false}
          disabled={!!busy}
        />
        <div className={`${bodyShell} min-h-0`}>
          <div className="flex items-center gap-3 mb-4 pr-10">
            <div className="p-2 bg-amber-600/20 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" aria-hidden />
            </div>
            <h3 id="resource-conflict-copy-title" className={modalTitleShell}>
              Crea una copia
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">{MESSAGES[kind]}</p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirmCopy}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {busy ? 'Copia in corso…' : 'Crea copia e associa'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
