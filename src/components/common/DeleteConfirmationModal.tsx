import { Z_OVERLAY, Z_MODAL_NESTED } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { AlertTriangle, Trash2, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

/** Focus ring per container dialog focusabile — non incluso nel token shell Foundation. */
const MODAL_DIALOG_FOCUS =
    'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info' | 'success' | 'warning';
    icon?: React.ReactNode;
    zIndex?: number;
    /** Slot per contenuto extra (form, input, banner) all'interno della modale */
    children?: React.ReactNode;
    /** Disabilita il pulsante di conferma (es. validazione fallita) */
    confirmDisabled?: boolean;
    /** Override classi bg/hover del bottone conferma (es. chrome warning + azione emerald/red) */
    confirmClassName?: string;
    /** Icona nel bottone conferma quando !isDeleting */
    confirmIcon?: React.ReactNode;
    /** Testo bottone conferma durante loading (default: "Attendere...") */
    loadingLabel?: string;
}

export const DeleteConfirmationModal = ({
    isOpen, onClose, onConfirm, title, message, isDeleting = false,
    confirmLabel = "Elimina", cancelLabel = "Annulla", variant = 'danger', icon,
    zIndex, children, confirmDisabled = false,
    confirmClassName, confirmIcon, loadingLabel
}: DeleteConfirmationModalProps) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    if (!isOpen) return null;

    const config = {
        danger: {
            iconBg: 'bg-red-500/20 border-red-500/50',
            iconColor: 'text-red-500',
            btnBg: 'bg-red-600 hover:bg-red-500',
            defaultIcon: AlertTriangle,
            borderClass: 'border-red-500/50',
        },
        info: {
            iconBg: 'bg-indigo-500/20 border-indigo-500/50',
            iconColor: 'text-indigo-500',
            btnBg: 'bg-indigo-600 hover:bg-indigo-500',
            defaultIcon: RefreshCw,
            borderClass: 'border-indigo-500/50',
        },
        success: {
            iconBg: 'bg-emerald-500/20 border-emerald-500/50',
            iconColor: 'text-emerald-500',
            btnBg: 'bg-emerald-600 hover:bg-emerald-500',
            defaultIcon: CheckCircle,
            borderClass: 'border-emerald-500/50',
        },
        warning: {
            iconBg: 'bg-amber-500/20 border-amber-500/50',
            iconColor: 'text-amber-500',
            btnBg: 'bg-amber-600 hover:bg-amber-500',
            defaultIcon: AlertTriangle,
            borderClass: 'border-amber-500/50',
        }
    }[variant];

    const IconComponent = icon ? () => <>{icon}</> : config.defaultIcon;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div
                className={`${containerShell} max-w-sm ${MODAL_DIALOG_FOCUS} ${config.borderClass}`}
                style={{ zIndex: zIndex || Z_MODAL_NESTED }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-confirmation-title"
                aria-describedby="delete-confirmation-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />
                <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${config.iconBg}`}>
                        <div className={`${config.iconColor} ${isDeleting ? 'animate-spin' : 'animate-pulse'}`}>
                            {isDeleting ? <Loader2 className="w-8 h-8" aria-hidden /> : <IconComponent className="w-8 h-8" aria-hidden />}
                        </div>
                    </div>
                    <div className="w-full">
                        <h3 id="delete-confirmation-title" className={`${modalTitleShell} mb-2`}>{title}</h3>
                        <p id="delete-confirmation-desc" className={`${modalSubtitleShell} leading-relaxed whitespace-pre-line`}>
                            {message}
                        </p>
                        {children}
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-xs uppercase"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting || confirmDisabled}
                            className={`flex-1 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs uppercase ${confirmClassName ?? config.btnBg} disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (confirmIcon ?? (!icon && variant === 'danger' ? <Trash2 className="w-4 h-4" /> : null))}
                            {isDeleting ? (loadingLabel ?? 'Attendere...') : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
