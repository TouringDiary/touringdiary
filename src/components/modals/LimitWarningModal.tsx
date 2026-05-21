import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';

interface LimitWarningModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onUpgrade: () => void;
    onStop: () => void;
}

export const LimitWarningModal: React.FC<LimitWarningModalProps> = ({ isOpen, onContinue, onUpgrade, onStop }) => {
    
    useGlobalModalEscape(isOpen, onStop);

    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in pointer-events-auto" style={{ zIndex: Z_OVERLAY }} onClick={onStop}>
            <div 
                className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <CloseButton 
                    onClose={onStop}
                    variant="primary"
                    position="absolute"
                    className="top-6 right-6"
                />

                <div className="text-white text-center">
                    <div className="flex justify-center mb-6 text-amber-500">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-3 font-display uppercase tracking-wide">Attenzione: Limite Quota</h2>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Hai raggiunto il limite di utilizzo giornaliero consigliato. 
                        Vuoi continuare utilizzando i tuoi crediti mensili o passare a un piano superiore?
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={onContinue} 
                            className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all text-[11px] uppercase tracking-widest shadow-lg active:scale-95"
                        >
                            Continua (Usa Quota Mensile)
                        </button>
                        <button 
                            onClick={onUpgrade} 
                            className="w-full py-4 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                        >
                            Passa a Premium
                        </button>
                        <button 
                            onClick={onStop} 
                            className="w-full py-3 px-4 border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-white font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest mt-2"
                        >
                            Smetti ora
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};




