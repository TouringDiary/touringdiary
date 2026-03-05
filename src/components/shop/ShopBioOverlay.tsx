
import React, { useEffect, useRef } from 'react';
import { X, History, Quote, Award } from 'lucide-react';
import { ShopPartner } from '../../types/index';

interface ShopBioOverlayProps {
    shop: ShopPartner;
    onClose: () => void;
}

export const ShopBioOverlay: React.FC<ShopBioOverlayProps> = ({ shop, onClose }) => {
    
    // Pattern useRef per stabilizzare il listener
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { 
            if (e.key === 'Escape') {
                onCloseRef.current(); 
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="absolute inset-0 z-[50] bg-[#020617] flex flex-col animate-in slide-in-from-bottom-5 duration-500 overflow-hidden">
            <div className="flex justify-between items-center px-8 py-4 border-b border-slate-800 bg-[#0f172a] shrink-0">
                <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-amber-500"/>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">L'Eredità di {shop.name}</h3>
                </div>
                {/* STANDARD RED CLOSE BUTTON */}
                <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                    <X className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-2 pb-20 px-6 md:px-12 custom-scrollbar relative">
                <div className="absolute top-0 left-4 opacity-[0.03] pointer-events-none z-0">
                    <Quote className="w-64 h-64 md:w-96 md:h-96 text-amber-500 transform rotate-180"/>
                </div>

                <div className="max-w-4xl mx-auto space-y-4 relative z-10 mt-2">
                    <div className="space-y-2">
                        <span className="text-amber-500 font-serif italic text-2xl md:text-3xl block leading-tight">
                            "Custodiamo il tempo per regalarvi l'autenticità di una terra senza eguali."
                        </span>
                        <div className="h-px w-12 bg-amber-500/50"></div>
                    </div>

                    <div className="prose prose-invert prose-lg max-w-none mt-0">
                        <style>{`
                            .bio-content::first-letter {
                                float: left;
                                font-size: 4rem;
                                line-height: 0.8;
                                font-weight: bold;
                                color: #f59e0b;
                                padding-right: 0.75rem;
                                padding-top: 0.25rem;
                                font-family: 'Playfair Display', serif;
                            }
                        `}</style>
                        <p className="bio-content text-slate-300 font-serif text-base md:text-xl leading-relaxed whitespace-pre-line text-justify italic mt-0">
                            {shop.description || "Storia non ancora disponibile."}
                        </p>
                    </div>

                    <div className="pt-6 flex flex-col md:flex-row gap-6 items-center border-t border-slate-800/50">
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-white font-display font-bold text-xl mb-1">Impegno per l'Eccellenza</h4>
                            <p className="text-slate-400 text-xs italic leading-relaxed">Scegliamo solo materie prime certificate e lavorazioni che rispettano i cicli naturali e le tradizioni secolari.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-900 px-6 py-3 rounded-[2rem] border border-slate-800 shrink-0">
                            <Award className="w-8 h-8 text-amber-500"/>
                            <div>
                                <div className="text-white font-black text-[9px] uppercase tracking-widest">Qualità TDS</div>
                                <div className="text-slate-500 text-[8px] uppercase font-bold">Partner d'Eccellenza</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-center shrink-0">
                <button onClick={onClose} className="px-10 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-full border border-slate-800 transition-all active:scale-95 text-[9px]">
                    Torna alla Bottega
                </button>
            </div>
        </div>
    );
};
