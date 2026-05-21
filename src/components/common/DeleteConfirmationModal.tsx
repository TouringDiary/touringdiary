import { Z_OVERLAY, Z_MODAL_NESTED } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { AlertTriangle, Trash2, Loader2, RefreshCw, CheckCircle } from 'lucide-react';

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
}

export const DeleteConfirmationModal = ({
    isOpen, onClose, onConfirm, title, message, isDeleting = false,
    confirmLabel = "Elimina", cancelLabel = "Annulla", variant = 'danger', icon,
    zIndex, children, confirmDisabled = false
}: DeleteConfirmationModalProps) => {

    if (!isOpen) return null;

    // Configurazione visuale in base alla variante
    const config = {
        danger: {
            iconBg: 'bg-red-500/20 border-red-500/50',
            iconColor: 'text-red-500',
            btnBg: 'bg-red-600 hover:bg-red-500',
            defaultIcon: AlertTriangle
        },
        info: {
            iconBg: 'bg-indigo-500/20 border-indigo-500/50',
            iconColor: 'text-indigo-500',
            btnBg: 'bg-indigo-600 hover:bg-indigo-500',
            defaultIcon: RefreshCw
        },
        success: {
            iconBg: 'bg-emerald-500/20 border-emerald-500/50',
            iconColor: 'text-emerald-500',
            btnBg: 'bg-emerald-600 hover:bg-emerald-500',
            defaultIcon: CheckCircle
        },
        warning: {
            iconBg: 'bg-amber-500/20 border-amber-500/50',
            iconColor: 'text-amber-500',
            btnBg: 'bg-amber-600 hover:bg-amber-500',
            defaultIcon: AlertTriangle
        }
    }[variant];

    const IconComponent = icon ? () => <>{icon}</> : config.defaultIcon;

    // FIX: Uso createPortal per "bucare" qualsiasi contenitore (es. UserDashboard) e apparire in cima
    return createPortal(
        <div
            className="td-modal-overlay bg-black/80 backdrop-blur-md animate-in fade-in p-4"
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div
                className={`relative bg-slate-900 border p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 ${variant === 'danger' ? 'border-red-500/50' : variant === 'info' ? 'border-indigo-500/50' : variant === 'warning' ? 'border-amber-500/50' : 'border-emerald-500/50'}`}
                style={{ zIndex: zIndex || Z_MODAL_NESTED }}
                onClick={(e) => e.stopPropagation()}
            >
                <CloseButton onClose={onClose} variant="primary" position="absolute" className="top-4 right-4" />
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${config.iconBg}`}>
                        <div className={`${config.iconColor} ${isDeleting ? 'animate-spin' : 'animate-pulse'}`}>
                            {isDeleting ? <Loader2 className="w-8 h-8" /> : <IconComponent className="w-8 h-8" />}
                        </div>
                    </div>
                    <div className="w-full">
                        <h3 className="text-xl font-bold text-white mb-2 font-display">{title}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
                        {/* Slot per contenuto extra (form input, banner, ecc.) */}
                        {children}
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-xs uppercase"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting || confirmDisabled}
                            className={`flex-1 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs uppercase ${config.btnBg} disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (!icon && variant === 'danger' ? <Trash2 className="w-4 h-4" /> : null)}
                            {isDeleting ? 'Attendere...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
