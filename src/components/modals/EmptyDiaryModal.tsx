
import React, { useEffect } from 'react';
import { X, Printer, MapPin, LogIn, AlertTriangle } from 'lucide-react';
import { User } from '../../types/index';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface EmptyDiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAuth: () => void;
    user: User;
}

export const EmptyDiaryModal = ({ isOpen, onClose, onOpenAuth, user }: EmptyDiaryModalProps) => {
    
    // TESTI DINAMICI DAL DB
    const { getText: getEmptyMsg } = useSystemMessage('empty_diary_state');
    const emptyMsg = getEmptyMsg();

    // Gestione ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isGuest = !user || user.role === 'guest';

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="relative bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95">
                
                {/* STANDARD RED CLOSE BUTTON */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg z-50"
                    title="Chiudi (ESC)"
                >
                    <X className="w-5 h-5"/>
                </button>

                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-6">
                    <Printer className="w-10 h-10 text-amber-500"/>
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {emptyMsg.title}
                </h3>
                
                <div className="text-slate-300 text-sm leading-relaxed mb-6">
                    <div dangerouslySetInnerHTML={{ __html: emptyMsg.body }} />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-full mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/>
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">Come iniziare?</p>
                            <p className="text-xs text-slate-400">Esplora le città e clicca sul tasto <strong>"+"</strong> nelle schede dei luoghi per aggiungerli al diario.</p>
                        </div>
                    </div>
                </div>

                {isGuest && (
                    <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 w-full mb-6 text-left flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/>
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">Consiglio Importante</p>
                            <p className="text-xs text-emerald-200/80">
                                Stai navigando come Ospite. Se chiudi il browser, perderai il tuo lavoro. 
                                <button onClick={() => { onClose(); onOpenAuth(); }} className="text-white underline font-bold ml-1 hover:text-emerald-300">Accedi o Registrati</button> per salvare il tour nel cloud.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex w-full gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700"
                    >
                        Ho Capito
                    </button>
                    {isGuest && (
                        <button 
                            onClick={() => { onClose(); onOpenAuth(); }} 
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4"/> Accedi
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
