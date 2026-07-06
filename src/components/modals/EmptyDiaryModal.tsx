import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { Printer, MapPin, LogIn, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { User } from '../../types/index';
import { useSystemMessage } from '../../hooks/useSystemMessage';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface EmptyDiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAuth: () => void;
    user: User;
}

export const EmptyDiaryModal = ({ isOpen, onClose, onOpenAuth, user }: EmptyDiaryModalProps) => {
    const { getText: getEmptyMsg } = useSystemMessage('empty_diary_state');
    const emptyMsg = getEmptyMsg();

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    const isGuest = !user || user.role === 'guest';

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="empty-diary-title"
                aria-describedby="empty-diary-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        <Printer className="w-10 h-10 text-amber-500" aria-hidden />
                    </div>

                    <h3 id="empty-diary-title" className={`${modalTitleShell} mb-3`}>
                        {emptyMsg.title}
                    </h3>

                    <div id="empty-diary-desc" className={`${modalSubtitleShell} mb-6 whitespace-pre-line`}>
                        <div dangerouslySetInnerHTML={{ __html: emptyMsg.body }} />
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-full mb-6 text-left">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" aria-hidden />
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">Come iniziare?</p>
                                <p className="text-xs text-slate-400">Esplora le città e clicca sul tasto <strong>"+"</strong> nelle schede dei luoghi per aggiungerli al diario.</p>
                            </div>
                        </div>
                    </div>

                    {isGuest && (
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 w-full mb-6 text-left flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">Consiglio Importante</p>
                                <p className="text-xs text-emerald-200/80">
                                    Stai navigando come Ospite. Se chiudi il browser, perderai il tuo lavoro.
                                    <button type="button" onClick={() => { onClose(); onOpenAuth(); }} className="text-white underline font-bold ml-1 hover:text-emerald-300">Accedi o Registrati</button> per salvare il tour nel cloud.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex w-full gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700"
                        >
                            Ho Capito
                        </button>
                        {isGuest && (
                            <button
                                type="button"
                                onClick={() => { onClose(); onOpenAuth(); }}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" /> Accedi
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
