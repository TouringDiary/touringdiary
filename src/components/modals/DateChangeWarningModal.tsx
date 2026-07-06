import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useSystemMessage } from '../../hooks/useSystemMessage';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface DateChangeWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    lostDaysCount: number;
}

export const DateChangeWarningModal = ({ isOpen, onClose, onConfirm, lostDaysCount }: DateChangeWarningModalProps) => {
    const { getText } = useSystemMessage('modal_date_warning');
    const msg = getText({ count: lostDaysCount });

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
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-amber-500/50`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="date-change-warning-title"
                aria-describedby="date-change-warning-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className="p-4 bg-amber-500/20 rounded-full mb-4 animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-amber-500" aria-hidden />
                    </div>
                    <h3 id="date-change-warning-title" className={`${modalTitleShell} mb-2`}>
                        {msg.title || 'Attenzione: Modifica Date'}
                    </h3>
                    <p id="date-change-warning-desc" className={`${modalSubtitleShell} leading-relaxed whitespace-pre-line mb-4`}>
                        {msg.body || `Riducendo la durata del viaggio, perderai le tappe inserite negli ultimi ${lostDaysCount} giorni che verranno rimossi.`}
                    </p>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 w-full mb-6">
                        <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                            <Trash2 className="w-3 h-3 text-red-400" />
                            Questa operazione è irreversibile.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-700"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={() => { onConfirm(); onClose(); }}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" /> Procedi comunque
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
