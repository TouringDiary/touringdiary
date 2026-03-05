
import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Sun, Globe, Star, ArrowUpRight } from 'lucide-react';
import { CitySummary } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';

interface MiniCityCardProps {
    city: CitySummary;
    onClick: (id: string) => void;
    priority?: boolean;
}

const MiniCityCard: React.FC<MiniCityCardProps> = ({ city, onClick, priority = false }) => {
    return (
        <div onClick={() => onClick(city.id)} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 cursor-pointer group hover:border-amber-500/50 transition-all">
            <ImageWithFallback src={city.imageUrl} alt={city.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" priority={priority}/>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-2">
                <span className="text-sm md:text-base font-bold text-white block group-hover:text-amber-400 truncate">{city.name}</span>
            </div>
        </div>
    );
};

interface CuratedGridSectionProps {
    onCityClick: (id: string) => void;
    onExplore: (cities: CitySummary[], title: string, icon: React.ReactNode) => void;
    cityManifest: CitySummary[]; 
}

export const CuratedGridSection = ({ onCityClick, onExplore, cityManifest }: CuratedGridSectionProps) => {
    
    // RILEVAMENTO MOBILE PER TITOLI CATEGORIA
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    const catTitleStyle = useDynamicStyles('inspiration_title', isMobile);

    const getDisplayItems = (badge: string, count: number = 4) => {
        if (!cityManifest || cityManifest.length === 0) return [];
        
        const realItems = cityManifest.filter(c => c.specialBadge === badge);
        const displayItems = [...realItems];
        
        if (displayItems.length < count) {
            const fillers = cityManifest.filter(c => c.isFeatured && c.specialBadge !== badge && !displayItems.some(x => x.id === c.id));
            let i = 0;
            while (displayItems.length < count && i < fillers.length) {
                displayItems.push(fillers[i]);
                i++;
            }
        }
        
        return displayItems.slice(0, count);
    };

    const getModalList = (badge: string) => {
        const real = cityManifest.filter(c => c.specialBadge === badge);
        if (real.length >= 4) return real;
        return cityManifest.filter(c => c.isFeatured); 
    };

    const topDestCategory = { 
        title: 'Destinazioni Top', 
        badge: 'destination', 
        icon: Globe, 
        color: 'text-indigo-500', 
        border: 'border-indigo-500/30' 
    };

    const categories = [
        { title: 'Eventi in Arrivo', badge: 'event', icon: Calendar, color: 'text-rose-500', border: 'border-rose-500/30' },
        { title: 'Ideale Stagione', badge: 'season', icon: Sun, color: 'text-emerald-500', border: 'border-emerald-500/30' },
        { title: 'Trend del Mese', badge: 'trend', icon: Globe, color: 'text-blue-500', border: 'border-blue-500/30' },
        { title: 'Scelta Editoriale', badge: 'editor', icon: Star, color: 'text-purple-500', border: 'border-purple-500/30' },
    ];

    const topDestItems = getDisplayItems(topDestCategory.badge, 16);

    return (
        <div className="flex flex-col gap-6">
            {/* FULL WIDTH TOP DESTINATIONS BOX */}
            <div className={`bg-slate-900/50 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors w-full`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <topDestCategory.icon className={`w-3.5 h-3.5 ${topDestCategory.color}`}/>
                        <h3 className={`${catTitleStyle} uppercase tracking-wide`}>{topDestCategory.title}</h3>
                    </div>
                    <button 
                        onClick={() => onExplore(getModalList(topDestCategory.badge), topDestCategory.title, <topDestCategory.icon className={`w-5 h-5 ${topDestCategory.color}`}/>)}
                        className="group/arrow p-1 hover:bg-slate-800 rounded transition-colors"
                        title="Esplora sezione completa"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover/arrow:text-amber-500 transition-colors" />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {topDestItems.map((city, cIdx) => (
                         <div key={`${topDestCategory.badge}-${city.id}-${cIdx}`} className={`${cIdx >= 4 ? 'hidden md:block' : ''} ${cIdx >= 8 ? 'hidden lg:block' : ''}`}>
                            <MiniCityCard city={city} onClick={onCityClick} priority={cIdx < 4} />
                         </div>
                    ))}
                </div>
            </div>

            {/* EXISTING 4 CATEGORIES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, idx) => (
                    <div key={idx} className={`bg-slate-900/50 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors`}>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <cat.icon className={`w-3.5 h-3.5 ${cat.color}`}/>
                                <h3 className={`${catTitleStyle} uppercase tracking-wide`}>{cat.title}</h3>
                            </div>
                            <button 
                                onClick={() => onExplore(getModalList(cat.badge), cat.title, <cat.icon className={`w-5 h-5 ${cat.color}`}/>)}
                                className="group/arrow p-1 hover:bg-slate-800 rounded transition-colors"
                                title="Esplora sezione completa"
                            >
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover/arrow:text-amber-500 transition-colors" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {getDisplayItems(cat.badge).map((city, cIdx) => (
                                <MiniCityCard key={`${cat.badge}-${city.id}-${cIdx}`} city={city} onClick={onCityClick} priority={false} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
