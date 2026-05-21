import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { AlertCircle, Sparkles } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';

interface QuotaExceededModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyCredits: () => void;
    reason?: string;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({ isOpen, onClose, onBuyCredits, reason }) => {
    useGlobalModalEscape(isOpen, onClose);
    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in pointer-events-auto" style={{ zIndex: Z_OVERLAY }} onClick={onClose}>
            <div 
                className="bg-slate-900 border border-rose-500/30 rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 text-center relative animate-in zoom-in-95 duration-300 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <CloseButton 
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className="top-6 right-6"
                />

                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Quota Esaurita</h2>
                
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    {reason === 'DAILY_FREE_LIMIT' 
                        ? "Hai utilizzato tutti i crediti gratuiti per oggi. Vuoi continuare con un pacchetto extra?"
                        : "I tuoi crediti AI sono terminati. Ricarica ora per continuare a pianificare il tuo viaggio con l'intelligenza artificiale."
                    }
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={onBuyCredits}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group active:scale-95"
                    >
                        Ricarica Crediti
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                    </button>
                    
                    <button 
                        onClick={onClose}
                        className="w-full py-4 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-bold rounded-2xl transition-all text-xs uppercase tracking-widest"
                    >
                        Forse più tardi
                    </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-600">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Touring Diary AI Engine v4</span>
                </div>
            </div>
        </div>,
        document.body
    );
};




