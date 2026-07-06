import { Z_OVERLAY } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface DiaryHeaderInvalidDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    body: string;
}

export const DiaryHeaderInvalidDateModal: React.FC<DiaryHeaderInvalidDateModalProps> = ({
    isOpen, onClose, title, body
}) => {
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
                className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-2 border-red-500`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="invalid-date-title"
                aria-describedby="invalid-date-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />
                <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                        <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" aria-hidden />
                    </div>
                    <div>
                        <h3 id="invalid-date-title" className={`${modalTitleShell} mb-2`}>
                            {title}
                        </h3>
                        <p id="invalid-date-desc" className={`${modalSubtitleShell} leading-relaxed whitespace-pre-line`}>
                            {body}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest shadow-lg"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
