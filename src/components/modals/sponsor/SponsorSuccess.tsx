
import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSystemMessage } from '../../../hooks/useSystemMessage';

interface SponsorSuccessProps {
    contactName: string;
    isGuest: boolean;
    adminEmail: string;
    onClose: () => void;
}

export const SponsorSuccess = ({ contactName, isGuest, adminEmail, onClose }: SponsorSuccessProps) => {
    // Recupera il messaggio dal DB usando la chiave
    const { getText, loading } = useSystemMessage('sponsor_success');
    // Passa le variabili per la sostituzione
    const message = getText({ contactName });

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 bg-[#020617]">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            
            {loading ? (
                 <Loader2 className="w-8 h-8 text-slate-500 animate-spin"/>
            ) : (
                <div>
                    <h3 className="text-3xl font-display font-bold text-white mb-3">{message.title || 'Richiesta Inviata!'}</h3>
                    <div className="text-slate-400 max-w-md mx-auto text-base leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: message.body || `<p class="mb-4">Grazie <strong>${contactName}</strong>!</p><p>La tua richiesta è stata ricevuta correttamente.</p>` }} />
                        
                        {isGuest && (
                            <p className="text-emerald-400 font-bold mt-4 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30">
                                Accedi con la tua email ({adminEmail}) e la password scelta per gestire il tuo profilo.
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            <button onClick={onClose} className="bg-slate-800 p-4 rounded-xl text-white font-bold uppercase tracking-wider hover:bg-slate-700 border border-slate-700">
                Chiudi
            </button>
        </div>
    );
};
