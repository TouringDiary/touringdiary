import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface DateChangeWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    lostDaysCount: number;
}

export const DateChangeWarningModal = ({ isOpen, onClose, onConfirm, lostDaysCount }: DateChangeWarningModalProps) => {
    // FETCH TESTI DB CON VARIABILI
    const { getText } = useSystemMessage('modal_date_warning');
    const msg = getText({ count: lostDaysCount });

    // ESC Key Management
    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto" style={{ zIndex: Z_OVERLAY }} onClick={onClose}>
            <div 
                className="relative bg-slate-900 w-full max-w-md rounded-2xl border border-amber-500/50 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 pointer-events-auto"
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
                    <div className="p-4 bg-amber-500/20 rounded-full mb-4 animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-amber-500"/>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">
                        {msg.title || 'Attenzione: Modifica Date'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {msg.body || `Riducendo la durata del viaggio, perderai le tappe inserite negli ultimi ${lostDaysCount} giorni che verranno rimossi.`}
                    </p>
                    <div className="mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 w-full">
                        <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                            <Trash2 className="w-3 h-3 text-red-400"/>
                            Questa operazione è irreversibile.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onClose} 
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-700"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-4 h-4"/> Procedi comunque
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};



