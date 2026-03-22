// MODIFICA: rimosso genericDescStyle basato su chiave inesistente

import React from 'react';
import { JourneyPhase } from '@/types/index';
import { useJourneyPhase } from '@/hooks/useJourneyPhase';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useDynamicContent } from '@/hooks/useDynamicContent'; 
import { useItinerary } from '@/context/ItineraryContext'; 
import { useGps } from '@/context/GpsContext'; 
import { useUser } from '@/context/UserContext'; 
import { useUI } from '@/context/UIContext';

interface NarrativeCompassProps {
    activeCityId: string | null;
}

const PHASES: JourneyPhase[] = ['SCOPERTA', 'SELEZIONE', 'PIANIFICA', 'LIVE', 'RICORDA'];

export const NarrativeCompass = ({ activeCityId }: NarrativeCompassProps) => {
    const currentPhase = useJourneyPhase(activeCityId);
    
    const { itinerary } = useItinerary();
    const { userLocation } = useGps();
    const { user } = useUser();
    const { isMobile } = useUI();
    
    const containerStyle = useDynamicStyles('journey_container');
    const baseTextStyle = useDynamicStyles('journey_text_base');
    const activeTextStyle = useDynamicStyles('journey_text_active');
    const mobileTextStyle = useDynamicStyles('journey_text_mobile');
    
    const mobileDotStyle = useDynamicStyles('journey_dot_mobile');
    const dividerStyle = useDynamicStyles('journey_divider'); 
    
    // 🔥 FIX: uso baseTextStyle come fallback generico
    const genericDescStyle = baseTextStyle;

    const contentScoperta = useDynamicContent('journey_desc_scoperta', isMobile);
    const contentSelezione = useDynamicContent('journey_desc_selezione', isMobile);
    const contentPianificaEmpty = useDynamicContent('journey_desc_pianifica_empty', isMobile);
    const contentLiveInactive = useDynamicContent('journey_desc_live_inactive', isMobile);
    const contentRicordaGuest = useDynamicContent('journey_desc_ricorda_guest', isMobile);
    const contentRicordaUser = useDynamicContent('journey_desc_ricorda_user', isMobile);
    
    const currentIndex = PHASES.indexOf(currentPhase);

    const getPhaseConfig = (phase: JourneyPhase) => {
        let text = "";
        let style = genericDescStyle;

        switch (phase) {
            case 'SCOPERTA':
                text = contentScoperta.text || "Esplora le mete migliori";
                if (contentScoperta.style) style = contentScoperta.style;
                break;
                
            case 'SELEZIONE':
                text = contentSelezione.text || "Scegli cosa visitare";
                if (contentSelezione.style) style = contentSelezione.style;
                break;
                
            case 'PIANIFICA':
                if (itinerary.items.length > 0) {
                    text = `${itinerary.items.length} tappe nel diario`;
                    if (contentPianificaEmpty.style) style = contentPianificaEmpty.style; 
                } else {
                    text = contentPianificaEmpty.text || "Il diario è ancora vuoto";
                    if (contentPianificaEmpty.style) style = contentPianificaEmpty.style;
                }
                break;
                
            case 'LIVE':
                if (userLocation) {
                    text = "Navigazione GPS attiva";
                    if (contentLiveInactive.style) style = contentLiveInactive.style;
                } else {
                    text = contentLiveInactive.text || "Attiva GPS per dintorni";
                    if (contentLiveInactive.style) style = contentLiveInactive.style;
                }
                break;
                
            case 'RICORDA':
                if (user.role !== 'guest') {
                    const template = contentRicordaUser.text || "Bentornato, {name}";
                    text = template.replace('{name}', user.name);
                    if (contentRicordaUser.style) style = contentRicordaUser.style;
                } else {
                    text = contentRicordaGuest.text || "Accedi per salvare i ricordi";
                    if (contentRicordaGuest.style) style = contentRicordaGuest.style;
                }
                break;
        }

        return { text, style };
    };

    const currentConfig = getPhaseConfig(currentPhase);

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center pointer-events-none select-none ${containerStyle}`}>
            
            <div className="hidden md:flex items-center h-full">
                {PHASES.map((phase, idx) => {
                    const isActive = phase === currentPhase;
                    const { text: phaseText, style: phaseStyle } = getPhaseConfig(phase);
                    
                    return (
                        <React.Fragment key={phase}>
                            <div className="flex flex-col items-center justify-center group pointer-events-auto h-full px-3 transition-all">
                                
                                <div className="relative mb-0.5">
                                    <span 
                                        className={`
                                            transition-all duration-500 ease-out cursor-default z-10 block leading-none
                                            ${isActive ? activeTextStyle : baseTextStyle}
                                            ${isActive ? 'scale-110' : 'group-hover:opacity-80'}
                                        `}
                                    >
                                        {phase}
                                    </span>
                                    
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 blur-xl rounded-full -z-10 animate-pulse w-full h-full"></div>
                                    )}
                                </div>
                                
                                <span 
                                    className={`
                                        text-center whitespace-nowrap leading-tight transition-all duration-500
                                        ${phaseStyle}
                                        ${isActive 
                                            ? 'opacity-100 translate-y-0' 
                                            : 'opacity-60 group-hover:opacity-100'
                                        }
                                    `}
                                >
                                    {phaseText}
                                </span>
                            </div>

                            {idx < PHASES.length - 1 && (
                                <div className="flex flex-col justify-center h-full pb-1">
                                    <span className={`${dividerStyle} text-3xl font-thin opacity-30 select-none`}>
                                        |
                                    </span>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="md:hidden flex flex-col items-center justify-center gap-1 animate-in fade-in slide-in-from-top-2 duration-500">
                <span className={`${mobileTextStyle} drop-shadow-md`}>
                    {currentPhase}
                </span>
                
                <span className={`${currentConfig.style} opacity-80`}>
                     {currentConfig.text}
                </span>

                <div className="flex items-center gap-1.5 mt-1">
                    {PHASES.map((_, idx) => {
                        const isActive = idx === currentIndex;
                        return (
                            <div 
                                key={idx}
                                className={`
                                    rounded-full transition-all duration-500 ease-out shadow-sm
                                    ${mobileDotStyle}
                                    ${isActive 
                                        ? 'w-6 h-1.5 opacity-100' 
                                        : 'w-1.5 h-1.5 opacity-40'
                                    }
                                `}
                            />
                        );
                    })}
                </div>
            </div>

        </div>
    );
};