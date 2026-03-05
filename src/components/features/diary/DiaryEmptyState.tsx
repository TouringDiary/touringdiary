
import React, { useState, useEffect } from 'react';
import { Footprints, PlusCircle, Sparkles } from 'lucide-react';
import { useDynamicContent } from '../../../hooks/useDynamicContent';

interface DiaryEmptyStateProps {
    isDraggingOver?: boolean;
}

export const DiaryEmptyState = ({ isDraggingOver }: DiaryEmptyStateProps) => {
    // COSTANTI MATEMATICHE PER GRIGLIA SFONDO (Background è 1.75rem = h-7)
    // Ogni elemento DEVE essere un multiplo esatto di h-7 per non sfasare le righe successive.
    const ROW_H = "h-7";       // 1.75rem (Singola riga)
    const DOUBLE_ROW = "h-14"; // 3.5rem  (Doppia riga)
    const TRIPLE_ROW = "h-[5.25rem]"; // 5.25rem (Tripla riga)

    // Classe base per centrare il contenuto nel "rigo"
    const CENTERED_ROW = "w-full flex items-center justify-center relative"; 
    
    // Rilevamento Mobile
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Hooks Design System
    const badgeConfig = useDynamicContent('diary_badge', isMobile);
    const quoteConfig = useDynamicContent('diary_quote', isMobile);
    const ctaConfig = useDynamicContent('diary_cta', isMobile);
    const footerConfig = useDynamicContent('diary_footer', isMobile);

    return (
        <div className="min-h-full flex flex-col items-center pointer-events-none select-none w-full pb-8">
             
             {/* 1. SPAZIO INIZIALE (1 RIGA) */}
             <div className={ROW_H}></div>

             {/* 2. BADGE GRATIS (2 RIGHE) */}
             {/* Usiamo 2 righe per dare aria sopra e sotto senza rompere il ritmo */}
             <div className={`${DOUBLE_ROW} ${CENTERED_ROW}`}>
                <div className="relative group cursor-default pointer-events-auto">
                    <span className="relative inline-flex items-center gap-2 px-6 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse border border-orange-300">
                        <Sparkles className="w-3.5 h-3.5 text-white"/>
                        <span className={`${badgeConfig.style} leading-none`}>
                            {badgeConfig.text || 'GRATIS'}
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-white"/>
                    </span>
                </div>
             </div>
             
             {/* 3. SPAZIO (1 RIGA) */}
             <div className={ROW_H}></div>
             
             {/* 4. QUOTE (2 RIGHE) */}
             {/* Forziamo 2 righe per accomodare testi lunghi mantenendo l'allineamento */}
             <div className={`${DOUBLE_ROW} ${CENTERED_ROW} px-4 text-center items-end pb-2`}>
                <h3 className={`${quoteConfig.style} leading-none whitespace-pre-line`}>
                    {quoteConfig.text || 'Ogni viaggio lo vivi tre volte:\nquando lo sogni, quando lo vivi e quando lo ricordi.'}
                </h3>
             </div>
             
             {/* 5. SPAZIO (1 RIGA) */}
             <div className={ROW_H}></div>
             
             {/* 6. ICONA (3 RIGHE) */}
             <div className={`${TRIPLE_ROW} ${CENTERED_ROW} shrink-0`}>
                 <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-400/40 flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-inner">
                     <Footprints className="w-8 h-8 text-slate-400" />
                 </div>
             </div>

             {/* 7. SPAZIO (1 RIGA) */}
             <div className={ROW_H}></div>
             
             {/* 8. CTA PRINCIPALE (1 RIGA) */}
             <div className={`${ROW_H} ${CENTERED_ROW}`}>
                 <p className={`${ctaConfig.style} leading-none pt-1`}>
                    {ctaConfig.text || 'ANNOTA QUI IL TUO SOGNO'}
                 </p>
             </div>
             
             {/* 9. SPAZIO (1 RIGA) */}
             <div className={ROW_H}></div>

             {/* 10. FOOTER ISTRUZIONI (1 RIGA) */}
             <div className={`${ROW_H} ${CENTERED_ROW}`}>
                <div className="w-full max-w-md flex items-center justify-center">
                    <p className={`${footerConfig.style} leading-none text-center whitespace-pre-line pt-1`}>
                        {footerConfig.text || 'Trascina qui le tappe'}
                    </p>
                </div>
             </div>
             
             {/* Drop Zone Overlay (Appare solo durante il drag) */}
             {isDraggingOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/50 z-20 backdrop-blur-[1px]">
                    <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold uppercase tracking-widest text-sm border-2 border-white/50 whitespace-nowrap flex items-center gap-3 animate-bounce">
                        <PlusCircle className="w-6 h-6"/> Rilascia per aggiungere
                    </div>
                </div>
             )}
        </div>
    );
};
