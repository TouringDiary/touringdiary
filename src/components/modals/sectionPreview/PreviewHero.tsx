
import React, { useMemo, useState } from 'react';
import { ArrowRight, Flower, Sun, Leaf, Snowflake, Info, X, Quote } from 'lucide-react';
import { CityDetails } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { formatVisitors } from '../../../utils/common';

interface PreviewHeroProps {
    city: any; // Può essere CityDetails o Generic Item (Guide, Service)
    onExplore: (id: string) => void;
    className?: string;
}

export const PreviewHero = ({ city, onExplore, className }: PreviewHeroProps) => {
    const [showDescModal, setShowDescModal] = useState(false);
    
    // UI FALLBACK LOGIC - NO MOCK DATA
    const displaySeasonalVisitors = useMemo(() => {
        if (!city) return null;
        
        // Se esistono dati reali, usali.
        if (city.details?.seasonalVisitors && (city.details.seasonalVisitors.summer > 0)) {
            return city.details.seasonalVisitors;
        }
        
        // Se c'è solo il totale visitatori, calcola una distribuzione statistica basata su quello REALE
        if (typeof city.visitors === 'number' && city.visitors > 0) {
            return {
                spring: Math.round(city.visitors * 0.30),
                summer: Math.round(city.visitors * 0.40),
                autumn: Math.round(city.visitors * 0.20),
                winter: Math.round(city.visitors * 0.10)
            };
        }
        
        // SE NON CI SONO DATI, RITORNA NULL. NON INVENTARE NUMERI.
        return null;
    }, [city]);

    const heroImage = city.details?.heroImage || city.imageUrl || '';
    const subtitle = city.details?.subtitle || city.role || city.category || 'Dettaglio';
    const description = city.description || city.bio || "Nessuna descrizione disponibile.";

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            <ImageWithFallback 
                src={heroImage} 
                alt={city.name} 
                className="w-full h-full object-cover transition-transform duration-[40s] group-hover:scale-105"
                priority={true} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            
            {/* CITY NAME & SUBTITLE */}
            <div className="absolute top-4 left-4 md:left-6 z-20 max-w-[65%]">
                <h1 className="text-2xl md:text-5xl font-display font-bold text-white mb-1 drop-shadow-xl leading-none">{city.name}</h1>
                <p className="text-slate-300 font-serif italic text-xs md:text-base drop-shadow-md opacity-90 leading-tight">{subtitle}</p>
            </div>
            
            {/* EXPLORE BUTTON */}
            <div className="absolute top-4 right-4 md:right-6 z-20">
                <button 
                    onClick={() => onExplore(city.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 md:py-2 md:px-4 rounded-lg shadow-xl shadow-black/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 text-[10px] uppercase tracking-wider border border-blue-400/50"
                >
                    DETTAGLI <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5"/>
                </button>
            </div>

            {/* DESCRIPTION / QUOTE - FULL WIDTH BOTTOM */}
            <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-auto flex items-end gap-2 w-full max-w-[95%]">
                <button 
                    onClick={() => setShowDescModal(true)}
                    className="shrink-0 p-1.5 bg-slate-800/80 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-slate-700 transition-colors shadow-lg"
                >
                    <Info className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                </button>
                <p 
                    className="text-white/95 font-serif italic text-[11px] md:text-lg leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-shadow line-clamp-2 cursor-pointer w-full"
                    onClick={() => setShowDescModal(true)}
                >
                    "{description}"
                </p>
            </div>
            
            {/* SEASONAL VISITORS WIDGET (ONLY IF DATA EXISTS) */}
            {displaySeasonalVisitors && (
                <div className="absolute top-14 right-4 md:top-auto md:bottom-4 md:right-6 z-20 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-4 animate-in slide-in-from-right-4 duration-700">
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-0.5 group/season">
                            <div className="p-1 md:p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 group-hover/season:scale-110 transition-transform"><Flower className="w-3 h-3 md:w-3.5 md:h-3.5"/></div>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-white leading-none">{formatVisitors(displaySeasonalVisitors.spring)}</span>
                        </div>
                        <div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-0.5 group/season">
                            <div className="p-1 md:p-1.5 rounded-full bg-amber-500/20 text-amber-400 group-hover/season:scale-110 transition-transform"><Sun className="w-3 h-3 md:w-3.5 md:h-3.5"/></div>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-white leading-none">{formatVisitors(displaySeasonalVisitors.summer)}</span>
                        </div>
                        <div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-0.5 group/season">
                            <div className="p-1 md:p-1.5 rounded-full bg-orange-500/20 text-orange-400 group-hover/season:scale-110 transition-transform"><Leaf className="w-3 h-3 md:w-3.5 md:h-3.5"/></div>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-white leading-none">{formatVisitors(displaySeasonalVisitors.autumn)}</span>
                        </div>
                        <div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-0.5 group/season">
                            <div className="p-1 md:p-1.5 rounded-full bg-cyan-500/20 text-cyan-400 group-hover/season:scale-110 transition-transform"><Snowflake className="w-3 h-3 md:w-3.5 md:h-3.5"/></div>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-white leading-none">{formatVisitors(displaySeasonalVisitors.winter)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* DESCRIPTION MODAL OVERLAY */}
            {showDescModal && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDescModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl relative shadow-2xl max-w-sm" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowDescModal(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
                        <div className="mb-2 text-amber-500"><Quote className="w-6 h-6 fill-current opacity-50 transform rotate-180"/></div>
                        <p className="text-slate-200 font-serif italic text-sm leading-relaxed text-justify max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {description}
                        </p>
                        <div className="mt-4 text-center">
                             <button onClick={() => setShowDescModal(false)} className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Chiudi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
