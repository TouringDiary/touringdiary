import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';


export const ModalLoading = () => {
    return createPortal(
        <div className="td-modal-overlay pointer-events-auto flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: Z_MODAL_NESTED }}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <span className="text-slate-300 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Caricamento...
                </span>
            </div>
        </div>,
        document.body
    );
};



