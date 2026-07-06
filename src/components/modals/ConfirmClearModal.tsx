import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useSystemMessage } from '../../hooks/useSystemMessage';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface ConfirmClearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmClearModal = ({ isOpen, onClose, onConfirm }: ConfirmClearModalProps) => {
    const { getText } = useSystemMessage('modal_clear_diary');
    const msg = getText();

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div
                className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-red-500/30`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-clear-title"
                aria-describedby="confirm-clear-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <Trash2 className="w-10 h-10 text-red-500" aria-hidden />
                    </div>
                    <h3 id="confirm-clear-title" className={`${modalTitleShell} mb-2`}>
                        {msg.title || 'Svuotare il Diario?'}
                    </h3>
                    <p id="confirm-clear-desc" className={`${modalSubtitleShell} leading-relaxed whitespace-pre-line mb-6`}>
                        {msg.body || 'Questa azione cancellerà tutte le tappe, le date e il nome del viaggio. Non potrai annullare questa operazione.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={() => { onConfirm(); onClose(); }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Svuota Tutto
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
