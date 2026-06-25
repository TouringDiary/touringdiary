
import React from 'react';
import { MapPin } from 'lucide-react';
import { CitySummary } from '../../types/index';
import { calculateDistance } from '../../services/geo';
import { formatVisitors } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface CityCardProps {
    city: CitySummary;
    onClick: (cityId: string) => void;
    userLocation: { lat: number; lng: number } | null;
    forcedBadge?: string;
    className?: string;
    priority?: boolean; // NEW: Ottimizzazione LCP
}

const BADGE_MAP: Record<string, { text: string, style: string }> = {
    'event': { text: 'EVENTI IN ARRIVO', style: 'bg-rose-600 text-white border-b border-l border-rose-800' },
    'trend': { text: 'TREND DEL MESE', style: 'bg-blue-600 text-white border-b border-l border-blue-800' },
    'season': { text: 'STAGIONE IDEALE', style: 'bg-emerald-600 text-white border-b border-l border-emerald-800' },
    'editor': { text: 'SCELTA EDITORIALE', style: 'bg-purple-600 text-white border-b border-l border-purple-800' },
    'destination': { text: 'DESTINAZIONE TOP', style: 'bg-indigo-600 text-white border-b border-l border-indigo-800' },
};

const DNA_ICONS: Record<string, string> = {
    'mare': '🌊', 'montagna': '⛰️', 'laghi_fiumi': '💧',
    'cultura': '🏛️', 'borghi': '🏰', 'weekend': '✨',
    'monument': '🏛️', 'nature': '🌿', 'food': '🍷',
    'leisure': '🎉', 'hotel': '🏨', 'discovery': '🧭',
};

const CityDnaIcons = ({ types }: { types: string[] }) => (
    <div className="flex items-center gap-0.5 shrink-0" aria-label="DNA della città">
        {types.slice(0, 4).map((type, idx) => (
            <span key={idx} className="text-[10px] md:text-xs leading-none" title={type}>
                {DNA_ICONS[type] || '📍'}
            </span>
        ))}
        {types.length > 4 && (
            <span className="text-[8px] md:text-[9px] text-slate-500 font-bold leading-none" title={`+${types.length - 4} altre categorie`}>
                +{types.length - 4}
            </span>
        )}
    </div>
);

const VisitorMiniBadge = ({ visitors }: { visitors: number }) => (
    <div
        className="flex flex-col items-center justify-center leading-none bg-black/75 backdrop-blur-sm border border-white/15 rounded-br-lg px-1.5 py-0.5 shadow-lg"
        title={`${formatVisitors(visitors)} visite`}
    >
        <span className="text-[6px] md:text-[7px] uppercase text-slate-400 font-bold tracking-wide">Visite</span>
        <span className="text-[9px] md:text-[10px] font-mono font-bold text-amber-400 tabular-nums">{formatVisitors(visitors)}</span>
    </div>
);

const getBadgeConfig = (dbBadge?: string, forcedBadge?: string) => {
    if (forcedBadge) {
        const normForced = forcedBadge.toLowerCase();
        if (BADGE_MAP[normForced]) return BADGE_MAP[normForced];
        if (normForced.includes('trend')) return BADGE_MAP['trend'];
        if (normForced.includes('stagione')) return BADGE_MAP['season'];
        if (normForced.includes('editor')) return BADGE_MAP['editor'];
        if (normForced.includes('event')) return BADGE_MAP['event'];
        if (normForced.includes('destination') || normForced.includes('destinazione')) return BADGE_MAP['destination'];

        return { text: forcedBadge.toUpperCase(), style: 'bg-amber-500 text-slate-900 border-b border-l border-amber-600' };
    }
    if (dbBadge && BADGE_MAP[dbBadge]) return BADGE_MAP[dbBadge];
    return null;
};

export const CityCard: React.FC<CityCardProps> = ({ city, onClick, userLocation, forcedBadge, className, priority = false }) => {
    const isMobile = useMobileDetect();

    const cardTitleStyle = useDynamicStyles('city_card_title', isMobile);
    const cardSubStyle = useDynamicStyles('city_card_sub', isMobile);
    const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);

    const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, city.coords.lat, city.coords.lng) : null;
    const badge = getBadgeConfig(city.specialBadge, forcedBadge);

    const baseClasses = "flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden group cursor-pointer hover:border-amber-600/50 hover:shadow-2xl transition-all duration-300 relative flex flex-col";
    const dimensions = className || "w-[150px] md:w-[165px] lg:w-[145px] xl:w-[165px] h-[200px] md:h-[240px]";

    return (
        <div onClick={() => onClick(city.id)} className={`${baseClasses} ${dimensions}`}>
            <div className="h-[55%] overflow-hidden relative border-b border-slate-800">
                <ImageWithFallback
                    src={city.imageUrl}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[10%] group-hover:grayscale-0"
                    priority={priority}
                />
                <div className="absolute top-0 left-0 z-home-card-overlay">
                    <VisitorMiniBadge visitors={city.visitors} />
                </div>
                {badge && (
                    <div className="absolute top-0 right-0 z-home-card-overlay group-hover:scale-110 transition-transform origin-top-right">
                        <div className={`px-2 py-1 text-[8px] md:text-[9px] font-bold uppercase leading-tight text-center shadow-md rounded-bl-lg ${badge.style}`}>{badge.text}</div>
                    </div>
                )}
                {distance && (
                    <div className={`absolute bottom-1 right-1 bg-black px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/20 shadow-lg ${distanceBadgeStyle || 'text-[8px] md:text-[10px] font-bold text-slate-300'}`}><MapPin className="w-2.5 h-2.5 md:w-3 text-amber-500" /> {distance} km</div>
                )}
            </div>

            <div className="p-2 flex flex-col flex-1 justify-between bg-slate-900 relative">
                <div className="min-h-0 overflow-hidden flex flex-col justify-center h-full">
                    <h4 className={`${cardTitleStyle} group-hover:text-amber-400 transition-colors truncate w-full`}>
                        {city.name}
                    </h4>
                    <p className={`${cardSubStyle} mb-0.5 truncate mt-0.5`}>
                        {city.zone}
                    </p>
                    <p className="text-[9px] md:text-[9px] text-slate-400 font-medium opacity-80 truncate mt-0.5">{city.description}</p>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/50 mt-0.5 shrink-0 gap-1">
                    <StarRating value={city.rating} size="w-2.5 md:w-3 h-2.5 md:h-3" />
                    {city.cityTypes && city.cityTypes.length > 0 && (
                        <CityDnaIcons types={city.cityTypes} />
                    )}
                </div>
            </div>
        </div>
    );
};
