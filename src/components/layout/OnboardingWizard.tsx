
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowRight, Loader2, Power } from 'lucide-react';
import { getSystemMessagesAsync, SystemMessageTemplate, BubbleArrowDirection } from '../../services/communicationService';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; 
import { MascotSvg } from '../common/MascotSvg';

interface Props {
    onComplete: () => void;
    onSkip: () => void;
    isMobile: boolean;
}

export const getBubbleArrowClass = (direction: BubbleArrowDirection) => {
    switch (direction) {
        case 'top': return '-top-3 left-1/2 -translate-x-1/2 rotate-45';
        case 'top-start': return '-top-3 left-6 rotate-45';
        case 'top-end': return '-top-3 right-6 rotate-45';
        
        case 'bottom': return '-bottom-3 left-1/2 -translate-x-1/2 rotate-45';
        case 'bottom-start': return '-bottom-3 left-6 rotate-45';
        case 'bottom-end': return '-bottom-3 right-6 rotate-45';
        
        case 'left': return 'top-1/2 -left-3 -translate-y-1/2 rotate-45';
        case 'left-start': return 'top-6 -left-3 rotate-45';
        case 'left-end': return 'bottom-6 -left-3 rotate-45';
        
        case 'right': return 'top-1/2 -right-3 -translate-y-1/2 rotate-45';
        case 'right-start': return 'top-6 -right-3 rotate-45';
        case 'right-end': return 'bottom-6 -right-3 rotate-45';
        
        default: return '-bottom-3 left-1/2 -translate-x-1/2 rotate-45';
    }
};

export const OnboardingWizard = ({ onComplete, onSkip, isMobile }: Props) => {
    // STATE
    const [steps, setSteps] = useState<SystemMessageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isGuideOn, setIsGuideOn] = useState(true); // Default ON
    
    // UI State
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isStepReady, setIsStepReady] = useState(false);
    
    // Position States (inizializzati al centro)
    const [mascotPos, setMascotPos] = useState({ x: 50, y: 50 });
    const [bubblePos, setBubblePos] = useState({ x: 50, y: 30 }); 
    const [bubbleArrow, setBubbleArrow] = useState<BubbleArrowDirection>('bottom');
    
    // Animation States
    const [isExiting, setIsExiting] = useState(false);
    const [exitScale, setExitScale] = useState(1); // Per rimpicciolire all'uscita
    
    // Refs
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Dynamic Styles
    const titleStyle = useDynamicStyles('onboarding_title', isMobile);
    const textStyle = useDynamicStyles('onboarding_text', isMobile);
    
    // --- 1. CARICAMENTO DATI DINAMICO (DB DRIVEN) ---
    useEffect(() => {
        const loadSteps = async () => {
            setIsLoading(true);
            try {
                // Fetch di TUTTI i messaggi (aggira la cache del singolo hook)
                const allMessages = await getSystemMessagesAsync();
                
                // Filtra solo quelli di tipo 'onboarding'
                let onboardingSteps = allMessages.filter(m => m.type === 'onboarding');
                
                // SEPARAZIONE NETTA:
                // Se Mobile: prendi SOLO quelli marcati mobile
                // Se Desktop: prendi SOLO quelli marcati desktop
                if (isMobile) {
                    onboardingSteps = onboardingSteps.filter(step => step.deviceTarget === 'mobile');
                } else {
                    onboardingSteps = onboardingSteps.filter(step => step.deviceTarget === 'desktop');
                }

                // Ordina per chiave (step_0, step_1, etc.) per garantire la sequenza
                onboardingSteps.sort((a, b) => {
                    // Estrae i numeri dalle chiavi (es. "onboarding_step_2" -> 2)
                    const numA = parseInt(a.key.replace(/\D/g, '') || '0');
                    const numB = parseInt(b.key.replace(/\D/g, '') || '0');
                    return numA - numB;
                });

                setSteps(onboardingSteps);
            } catch (e) {
                console.error("Errore caricamento guida:", e);
                onSkip(); // Fallback in caso di errore critico
            } finally {
                setIsLoading(false);
            }
        };
        loadSteps();
    }, [isMobile]); // Ricarica se cambia device

    const currentStep = steps[currentStepIndex];

    // --- 2. GESTIONE SEQUENZA E POSIZIONAMENTO ---
    useEffect(() => {
        if (!currentStep || isExiting) return;

        // Reset immediato per transizione pulita
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsStepReady(false);
        setTargetRect(null);
        
        // Recupera configurazione specifica dal DB
        // La struttura salvata dall'admin è garantita in `uiConfig`
        // IMPORTANTE: Qui leggiamo la config specifica per il device corrente
        const config = isMobile ? currentStep.uiConfig?.mobile : currentStep.uiConfig?.desktop;
        
        // Determina ID Elemento Target (per scroll e highlight)
        const targetId = config?.targetId || '';

        // Funzione per applicare le coordinate visuali (Mascotte & Bubble)
        const applyVisuals = () => {
            if (config && config.mascot && config.bubble) {
                // USA STRETTAMENTE I DATI DB
                setMascotPos(config.mascot);
                setBubblePos(config.bubble);
                if (config.arrowDirection) setBubbleArrow(config.arrowDirection);
            } else {
                // Fallback centro schermo (solo se config manca del tutto)
                setMascotPos({ x: 50, y: 50 });
                setBubblePos({ x: 50, y: 30 });
                setBubbleArrow('bottom');
            }
            setIsStepReady(true);
        };

        // Logica di Esecuzione Step
        const executeStep = () => {
            // Se c'è un target ID, cerchiamo di scrollarci e evidenziarlo
            if (targetId) {
                // Eventi speciali per aprire UI nascoste (es. Diario Mobile)
                if (targetId.includes('mobile-diary')) {
                    window.dispatchEvent(new Event('onboarding-force-open-diary'));
                } else {
                    if (isMobile) window.dispatchEvent(new Event('onboarding-force-close-diary'));
                }

                // Piccolo delay per permettere al DOM di aggiornarsi (es. apertura modale)
                timerRef.current = setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        // FIX: Scroll allineato in alto (start) per evitare overlapping con mascotte
                        // Usa 'start' per portare l'elemento in cima alla view
                        el.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: isMobile ? 'start' : 'center',
                            inline: 'center'
                        });
                        
                        // Calcola rettangolo per il box lampeggiante
                        const rect = el.getBoundingClientRect();
                        
                        // Se l'admin ha disabilitato il box esplicitamente, non mostrarlo
                        if (config?.targetBox?.active !== false) {
                            setTargetRect(rect);
                        }
                    } else {
                        console.warn(`[Tour] Elemento target #${targetId} non trovato nel DOM.`);
                    }
                    applyVisuals();
                }, 800); // Delay aumentato a 800ms per permettere scroll completo
            } else {
                // Step puramente narrativo (nessun target)
                if (isMobile) window.dispatchEvent(new Event('onboarding-force-close-diary'));
                applyVisuals();
            }
        };

        executeStep();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };

    }, [currentStepIndex, currentStep, isMobile, isExiting]);

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            triggerExitSequence();
        }
    };

    // TRIGGER EXIT ANIMATION (Verso tasto hamburger in alto a destra)
    const triggerExitSequence = () => {
        // Coordinate approssimative del tasto menu hamburger (Top Right)
        // x: ~95%, y: ~5%
        const exitX = 92;
        const exitY = 6;

        // 1. Sposta mascotte e bubble verso l'angolo
        setMascotPos({ x: exitX, y: exitY });
        setBubblePos({ x: exitX - 5, y: exitY + 5 }); // Leggero offset per il fumetto
        
        // 2. Rimpicciolisci
        setExitScale(0); 

        // 3. Fade out e chiusura effettiva
        if (isMobile) window.dispatchEvent(new Event('onboarding-force-close-diary'));
        setIsExiting(true);
        
        setTimeout(() => { 
            if (isGuideOn) onComplete(); 
            else onSkip(); 
        }, 700); // Attendi animazione CSS
    };

    // Gestione Switch ON/OFF
    const toggleGuide = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !isGuideOn;
        setIsGuideOn(newState);
        
        if (!newState) {
            // Se spento, avvia uscita verso hamburger
            triggerExitSequence();
        }
    };

    if (isLoading) return null;
    if (steps.length === 0) return null;

    const parsedBody = currentStep.bodyTemplate.replace(/{name}/g, 'Viaggiatore');
    const parsedTitle = currentStep.titleTemplate || currentStep.label;

    return (
        <div 
            className={`fixed inset-0 z-[99999] overflow-hidden font-sans transition-opacity duration-700 ${isExiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            onClick={(e) => { if(e.target === e.currentTarget && !isExiting) triggerExitSequence(); }}
        >
            {/* BACKDROP - Sparisce subito all'uscita */}
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`} />

            {/* HIGHLIGHT BOX */}
            {targetRect && isStepReady && !isExiting && (
                <div 
                    className="absolute border-4 border-amber-400 rounded-xl shadow-[0_0_100px_rgba(251,191,36,0.6)] transition-all duration-500 pointer-events-none animate-pulse z-10"
                    style={{ 
                        // FIX: OFFSET AUMENTATO ( -10px ) per farlo salire visivamente come richiesto
                        top: targetRect.top - 10, 
                        left: targetRect.left - 5, 
                        width: targetRect.width + 10, 
                        height: targetRect.height + 15 
                    }}
                />
            )}

            {/* UI ELEMENTS (MASCOTTE & BUBBLE) */}
            <div className={`absolute w-full h-full pointer-events-none`} onClick={(e) => e.stopPropagation()}>
                
                {/* MASCOTTE */}
                <div 
                    className={`absolute pointer-events-auto cursor-pointer hover:scale-110 z-30 transition-all duration-700 ease-in-out`}
                    style={{ 
                        top: `${mascotPos.y}%`, 
                        left: `${mascotPos.x}%`, 
                        transform: `translate(-50%, -50%) scale(${isExiting ? 0.1 : 1})`,
                        width: isMobile ? '90px' : '130px', 
                        height: isMobile ? '90px' : '130px',
                        opacity: isExiting ? 0 : 1
                    }}
                    onClick={handleNext}
                >
                    <MascotSvg className="w-full h-full" />
                </div>

                {/* FUMETTO */}
                <div 
                    className={`absolute transition-all duration-700 ease-in-out pointer-events-auto z-40 cursor-default`}
                    style={{ 
                        top: `${bubblePos.y}%`, 
                        left: `${bubblePos.x}%`, 
                        transform: `translate(-50%, -50%) scale(${isExiting ? 0.1 : 1})`,
                        opacity: isExiting ? 0 : 1
                    }}
                >
                    <div className={`bg-white text-slate-900 rounded-3xl shadow-2xl relative p-6 border-4 border-indigo-500/20 ${isMobile ? 'w-[85vw] max-w-[340px]' : 'w-96'}`}>
                        
                        {/* TOGGLE SWITCH ON/OFF SOPRA AL MODALE */}
                        <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-slate-900/90 backdrop-blur-md rounded-full p-1 pl-3 pr-1 flex items-center gap-3 pointer-events-auto border border-white/10 shadow-xl">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isGuideOn ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {isGuideOn ? 'Guida Attiva' : 'Guida Off'}
                                </span>
                                <button 
                                    onClick={toggleGuide}
                                    className={`w-10 h-6 rounded-full p-1 transition-colors relative ${isGuideOn ? 'bg-emerald-600' : 'bg-slate-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isGuideOn ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>

                        <div className={`absolute w-6 h-6 bg-white border-l border-t border-slate-100 ${getBubbleArrowClass(bubbleArrow)}`}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className={`${titleStyle || 'font-display font-black text-indigo-600 text-2xl'}`}>{parsedTitle}</h3>
                                <button onClick={triggerExitSequence} className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X className="w-4 h-4"/></button>
                            </div>
                            
                            <p className={`${textStyle || 'text-slate-600 text-sm font-medium leading-relaxed mb-6'}`}>{parsedBody}</p>
                            
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex gap-1">
                                    {steps.map((_, idx) => (
                                        <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentStepIndex ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                                <button onClick={handleNext} className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${isMobile ? 'px-3 py-1 text-[9px]' : 'px-6 py-2 text-xs'}`}>
                                    {currentStepIndex === steps.length - 1 ? 'Inizia' : 'Avanti'} <ArrowRight className="w-3.5 h-3.5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
