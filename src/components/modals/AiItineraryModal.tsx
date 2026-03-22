
import React, { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, Lock, MapPinOff, AlertCircle, LogIn, Crown } from 'lucide-react';
import { useAiPlanner } from '@/context/AiPlannerContext'; 
import { User } from '../../types/index';
import { AiLoadingScreen, GenerationLoader } from '../aiPlanner/AiLoadingScreen';
import { AiPlannerForm } from '../aiPlanner/AiPlannerForm';
import { AiPlannerTimeline } from '../aiPlanner/AiPlannerTimeline';
import { useAiGeneration } from '../../hooks/useAiGeneration';
import { useModal } from '@/context/ModalContext'; 
import { useSystemMessage } from '../../hooks/useSystemMessage'; 
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; // NEW IMPORT

// Re-export loader for compatibility
export { AiLoadingScreen, GenerationLoader };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    defaultCity?: string;
    user?: User; 
}

export const AiItineraryModal = ({ isOpen, onClose, defaultCity = '', user }: Props) => {
    const { aiSession, updateAiSession, resetAiSession } = useAiPlanner();
    const { openModal } = useModal(); 
    
    // DB CONTENT FOR GUEST BLOCK
    const { getText: getBlockMessage } = useSystemMessage('guest_ai_block');
    const blockMsg = getBlockMessage();
    
    // DYNAMIC STYLES
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    
    const titleStyle = useDynamicStyles('planner_title', isMobile);

    const { 
        loading, setLoading, error, 
        showValidationAlert, setShowValidationAlert,
        showQuotaAlert, setShowQuotaAlert, quotaLimit,
        warningModal, handleConfirmWarning,
        errorModal, setErrorModal,
        generatePlan, applyPlanToItinerary,
        cancelGeneration 
    } = useAiGeneration({ user, onClose });

    // Gestione ESC (UI Only)
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => { 
            if (showValidationAlert || showQuotaAlert || warningModal || errorModal) return;
            if (e.key === 'Escape') onClose(); 
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, showValidationAlert, showQuotaAlert, warningModal, errorModal]);

    // Pre-fill City
    useEffect(() => {
        if (isOpen && !aiSession.destination && defaultCity) updateAiSession({ destination: defaultCity });
    }, [isOpen, defaultCity]);

    if (!isOpen) return null;

    // --- BLOCCO GUEST CON CONTENUTO DB ---
    const isGuest = !user || user.role === 'guest';
    if (isGuest) {
        return (
            <div className="fixed top-24 bottom-0 left-0 right-0 z-[2000] flex items-center justify-center p-0 md:p-4">
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
                
                <div className="relative bg-slate-900 w-full max-w-md p-8 rounded-[2rem] border border-indigo-500/30 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>

                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center border-4 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6">
                        <Lock className="w-10 h-10 text-indigo-400"/>
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-white mb-3">{blockMsg.title || 'Funzionalità Esclusiva'}</h3>
                    {/* Render HTML content from DB safely */}
                    <div className="text-slate-300 text-sm leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: blockMsg.body || "Il Magic Planner AI è riservato agli utenti registrati." }} />
                    
                    <button 
                        onClick={() => { onClose(); openModal('auth'); }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase tracking-wide text-xs"
                    >
                        <LogIn className="w-4 h-4"/> Accedi o Registrati
                    </button>
                    
                    <p className="text-[10px] text-slate-500 mt-4">La registrazione è gratuita e richiede meno di 1 minuto.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[2000] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
            
            {/* 1. VALIDATION ALERT */}
            {showValidationAlert && (
                <div className="absolute inset-0 z-[2500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-amber-500 p-8 md:p-10 rounded-[2rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 text-center flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center border-4 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                            <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse"/>
                        </div>
                        <div>
                            <h3 className="text-3xl font-display font-black text-white mb-3 tracking-wide">Dati Mancanti</h3>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Per generare l'itinerario perfetto, abbiamo bisogno di sapere <strong className="text-white border-b-2 border-amber-500">dove</strong> vuoi andare e <strong className="text-white border-b-2 border-amber-500">quando</strong>.
                            </p>
                        </div>
                        <button onClick={() => setShowValidationAlert(false)} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-lg py-4 rounded-2xl transition-transform active:scale-95 uppercase tracking-widest shadow-xl">
                            Ho Capito
                        </button>
                    </div>
                </div>
            )}

            {/* 2. QUOTA EXCEEDED ALERT (AGGIORNATO) */}
            {showQuotaAlert && (
                <div className="absolute inset-0 z-[2500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-red-500 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                            <Lock className="w-10 h-10 text-red-500"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white mb-2 tracking-wide">Crediti Smart Esauriti</h3>
                            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                L'analisi profonda dell'itinerario richiede crediti <strong>Gemini Pro (Smart)</strong>. 
                                Hai raggiunto il tuo limite giornaliero di <strong className="text-red-400">{quotaLimit}</strong> crediti.
                            </p>
                            
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                                <p><strong>Vuoi continuare senza limiti?</strong><br/>
                                Passa al piano <strong>Traveler Pro</strong> per sbloccare l'AI avanzata illimitata.</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <button 
                                onClick={() => { setShowQuotaAlert(false); onClose(); openModal('upgrade'); }} 
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase text-xs tracking-widest"
                            >
                                <Crown className="w-4 h-4 fill-current"/> Upgrade a Pro
                            </button>
                            <button 
                                onClick={() => setShowQuotaAlert(false)} 
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-xs uppercase"
                            >
                                Attendi domani
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. WARNING MODAL */}
            {warningModal && (
                 <div className="absolute inset-0 z-[2500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-yellow-500 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center border-4 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                            <MapPinOff className="w-10 h-10 text-yellow-500 animate-pulse"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white mb-3 tracking-wide">{warningModal.title}</h3>
                            <p className="text-base text-slate-300 leading-relaxed">
                                {warningModal.message}
                            </p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => handleConfirmWarning(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors uppercase tracking-wide">
                                Annulla
                            </button>
                            <button onClick={() => handleConfirmWarning(true)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-colors uppercase tracking-wide shadow-lg">
                                Procedi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. ERROR MODAL */}
            {errorModal && (
                 <div className="absolute inset-0 z-[2500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-red-500 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                            <AlertCircle className="w-10 h-10 text-red-500"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white mb-3 tracking-wide">{errorModal.title}</h3>
                            <p className="text-base text-slate-300 leading-relaxed font-mono text-xs bg-black/50 p-3 rounded-lg border border-red-900/50 break-words whitespace-pre-wrap">
                                {errorModal.message}
                            </p>
                        </div>
                        <button onClick={() => setErrorModal(null)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 uppercase tracking-widest shadow-xl">
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

            <div className="relative bg-slate-900 w-full max-w-2xl h-full md:max-h-[92vh] md:rounded-[2rem] border-0 md:border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                
                {/* UPDATED: Pass cancelGeneration handler to Loader */}
                {loading && <AiLoadingScreen onCancel={cancelGeneration} />}

                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md shrink-0 z-40 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-xl shadow-indigo-900/40">
                            <Sparkles className="w-6 h-6 text-white animate-pulse"/>
                        </div>
                        <div>
                            {/* DYNAMIC TITLE */}
                            <h3 className={titleStyle || "text-xl font-display font-bold text-white uppercase tracking-wider"}>Magic Planner AI</h3>
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Touring Diary Intelligence</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900 relative">
                    {!aiSession.generatedPlan ? (
                        <AiPlannerForm 
                            onGenerate={generatePlan} 
                            isLoading={loading} 
                            error={error} 
                            user={user} 
                        />
                    ) : (
                        <AiPlannerTimeline 
                            onApply={applyPlanToItinerary} 
                            onReset={resetAiSession} 
                            activeStyles={[aiSession.style]}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
