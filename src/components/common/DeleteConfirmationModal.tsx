
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    variant?: 'danger' | 'info' | 'success'; 
    icon?: React.ReactNode;
}

export const DeleteConfirmationModal = ({ 
    isOpen, onClose, onConfirm, title, message, isDeleting = false,
    confirmLabel = "Elimina", cancelLabel = "Annulla", variant = 'danger', icon
}: DeleteConfirmationModalProps) => {
    
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

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
        }
    }[variant];

    const IconComponent = icon ? () => <>{icon}</> : config.defaultIcon;

    // FIX: Uso createPortal per "bucare" qualsiasi contenitore (es. UserDashboard) e apparire in cima
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className={`bg-slate-900 border p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 ${variant === 'danger' ? 'border-red-500/50' : variant === 'info' ? 'border-indigo-500/50' : 'border-emerald-500/50'}`}>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${config.iconBg}`}>
                        <div className={`${config.iconColor} ${isDeleting ? 'animate-spin' : 'animate-pulse'}`}>
                             {isDeleting ? <Loader2 className="w-8 h-8"/> : <IconComponent className="w-8 h-8"/>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display">{title}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
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
                            disabled={isDeleting}
                            className={`flex-1 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs uppercase ${config.btnBg}`}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : (!icon && variant === 'danger' ? <Trash2 className="w-4 h-4"/> : null)}
                            {isDeleting ? 'Attendere...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
