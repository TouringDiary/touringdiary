
import React, { useEffect, useState } from 'react';
import { Globe, MapPin, Sun, Camera, Users, AlertTriangle, Info, Calendar, Gift, Clock, Car, Megaphone } from 'lucide-react';
import { getNewsTickerItemsAsync } from '../../services/contentService';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { NewsTickerItem } from '../../types/index';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; // NEW

// Export per riutilizzo icone nell'admin
export const ICON_MAP: Record<string, React.ElementType> = {
    'globe': Globe, 'map': MapPin, 'sun': Sun, 'camera': Camera,
    'users': Users, 'alert': AlertTriangle, 'info': Info, 'calendar': Calendar,
    'gift': Gift, 'clock': Clock, 'car': Car, 'megaphone': Megaphone
};

interface NewsTickerProps {
    overrideSpeed?: number;
    overrideItems?: NewsTickerItem[];
    isVisible?: boolean; 
}

export const NewsTicker = ({ overrideSpeed, overrideItems, isVisible = true }: NewsTickerProps) => {
    const [newsItems, setNewsItems] = useState<NewsTickerItem[]>([]);
    const [speed, setSpeed] = useState(80); // Default 80s
    
    // DYNAMIC STYLES
    const labelStyle = useDynamicStyles('ticker_label', false); // Always desktop like (small)
    const textStyle = useDynamicStyles('ticker_text', false);

    useEffect(() => {
        // Se siamo in modalità anteprima (Admin), usa i props diretti
        if (overrideSpeed !== undefined && overrideItems !== undefined) {
            setSpeed(overrideSpeed);
            setNewsItems(overrideItems.filter(i => i.active));
            return;
        }

        // Altrimenti carica dal DB (Sito Pubblico)
        const load = async () => {
            const [items, config] = await Promise.all([
                getNewsTickerItemsAsync(),
                getSetting<{ duration: number }>('ticker_config')
            ]);
            
            // FIX: Filtro items validi per evitare undefined keys
            setNewsItems((items || []).filter(i => i && i.active && i.id));
            if (config && config.duration) {
                setSpeed(config.duration);
            }
        };
        load();
    }, [overrideSpeed, overrideItems]);

    if (newsItems.length === 0) return null;

    return (
        <div 
            className={`
                relative w-full h-8 bg-slate-900 border-b border-slate-800 z-[1100] flex items-center overflow-hidden shadow-md
                transition-all duration-500 ease-in-out
                ${isVisible ? 'mt-0 opacity-100' : '-mt-8 opacity-0 pointer-events-none'}
                md:mt-0 md:opacity-100 md:pointer-events-auto
            `}
        >
            <div className={`${labelStyle} bg-amber-600 px-3 h-full flex items-center justify-center z-20 shadow-lg flex-shrink-0 relative border-r border-amber-700`}>
                NEWS
            </div>
            
            <div className="flex-1 overflow-hidden h-full flex items-center relative bg-slate-950">
                <div 
                    className="inline-block whitespace-nowrap pl-[100%] animate-marquee will-change-transform"
                    style={{ animationDuration: `${speed}s` }}
                >
                    <div className="flex items-center h-full">
                        {newsItems.map((item, i) => {
                            const Icon = ICON_MAP[item.icon] || Globe;
                            // FIX: Usa una key composta robusta per evitare undefined
                            const uniqueKey = item.id || `ticker-item-${i}`;
                            return (
                                <span key={uniqueKey} className={`mx-10 ${textStyle} flex items-center gap-2.5`}>
                                    <Icon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"/> 
                                    <span dangerouslySetInnerHTML={{ __html: item.text || '' }} />
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes marquee { 
                    0% { transform: translate3d(0, 0, 0); } 
                    100% { transform: translate3d(-100%, 0, 0); } 
                }
                .animate-marquee { 
                    animation-name: marquee;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};
