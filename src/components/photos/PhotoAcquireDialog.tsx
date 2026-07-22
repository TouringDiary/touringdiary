import { Z_POPOVER, Z_MODAL_NESTED } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageIcon } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface Props {
    isOpen: boolean;
    canCapture: boolean;
    onClose: () => void;
    onCapture: () => void;
    onGallery: () => void;
}

/**
 * Step 1 — acquire method (camera vs gallery). Kept small and focused (D-009).
 */
export const PhotoAcquireDialog: React.FC<Props> = ({
    isOpen,
    canCapture,
    onClose,
    onCapture,
    onGallery,
}) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    // Foundation pair (overlay + container) is a mobile bottom sheet:
    // overlay `items-end` + container `rounded-t-*` / `slide-in-from-bottom` / `pb-safe`.
    // Do NOT add `!items-center` — that creates a hybrid (floating sheet with empty space below).
    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell}`}
            style={{ zIndex: Z_POPOVER }}
            onClick={onClose}
            role="presentation"
        >
            <div
                className={`${containerShell} w-full max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL_NESTED }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="photo-acquire-title"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    withEscape={false}
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={`${headerShell} pr-12`}>
                    <div className="min-w-0">
                        <h3 id="photo-acquire-title" className={modalTitleShell}>
                            Pubblica Foto
                        </h3>
                        <p className={modalSubtitleShell}>Seleziona modalità di caricamento</p>
                    </div>
                </header>

                <div className={`${bodyShell} space-y-3 pb-6`}>
                    <button
                        type="button"
                        onClick={onCapture}
                        disabled={!canCapture}
                        title={
                            canCapture
                                ? 'Apri la fotocamera'
                                : 'Disponibile su smartphone e tablet'
                        }
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:bg-slate-950"
                    >
                        <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                            <Camera className="w-5 h-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold text-white">Scatta foto</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                                {canCapture ? 'Usa la fotocamera' : 'Non disponibile su desktop'}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onGallery}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-left"
                    >
                        <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                            <ImageIcon className="w-5 h-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold text-white">
                                Scegli dalla galleria
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                                Seleziona un’immagine dal dispositivo
                            </span>
                        </span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
