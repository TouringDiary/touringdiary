import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface ConfirmClearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmClearModal = ({ isOpen, onClose, onConfirm }: ConfirmClearModalProps) => {
    // FETCH TESTI DB
    const { getText } = useSystemMessage('modal_clear_diary');
    const msg = getText();

    useGlobalModalEscape(isOpen, onClose);


    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in pointer-events-auto flex items-center justify-center p-4" onClick={onClose} style={{ zIndex: Z_OVERLAY }}>
            <div
                className="relative bg-slate-900 w-full max-w-sm rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className="top-4 right-4"
                />

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-red-500/10 rounded-full mb-4">
                        <Trash2 className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">
                        {msg.title || 'Svuotare il Diario?'}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                        {msg.body || 'Questa azione cancellerà tutte le tappe, le date e il nome del viaggio. Non potrai annullare questa operazione.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Svuota Tutto
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};



