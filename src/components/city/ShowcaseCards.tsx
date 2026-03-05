
import React, { useState, useEffect } from 'react';
import { Plus, Star, Award, GripHorizontal, ThumbsUp, Check, MapPin, Navigation } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { getPoiCategoryLabel, getSubCategoryLabel, isPoiNew, getPoiColorStyle } from '../../utils/common';
import { StarRating } from '../common/StarRating';
import { useItinerary } from '../../context/ItineraryContext';
import { calculateDistance } from '../../services/geo';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { AdPlaceholder } from '../common/AdPlaceholder';

// --- TYPES ---
interface UniversalCardProps {
    poi: PointOfInterest;
    onOpenDetail: (poi: PointOfInterest) => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onLike?: (poi: PointOfInterest) => void;
    isLiked?: boolean;
    userLocation?: { lat: number; lng: number } | null;
    
    // Variant Props
    variant?: 'horizontal' | 'vertical';
    fluid?: boolean;
    verticalStretch?: boolean;
}

// --- SUB-COMPONENTS ---

// Indicatore Prezzo (€€€€)
const PriceLevelIndicator = ({ level }: { level?: number }) => {
    const MAX_LEVEL = 5;
    const activeLevel = level || 0;
    return (
        <div className="flex gap-0.5 items-center justify-center h-full" title={`Livello Prezzo: ${activeLevel}/${MAX_LEVEL}`}>
            {[...Array(MAX_LEVEL)].map((_, index) => (
                <span key={index} className={`text-[10px] font-black leading-none ${index < activeLevel ? 'text-amber-500' : 'text-slate-800'}`}>€</span>
            ))}
        </div>
    );
};

// Action Buttons Row (Like, Add, Drag Handle)
const ActionRow = ({ poi, onLike, isLiked, onAdd, inItinerary, isMobile, variant }: any) => (
    <div className={`absolute z-50 flex items-center gap-1.5 pointer-events-auto ${variant === 'horizontal' ? 'bottom-2 right-2' : 'bottom-1 right-0 p-2'}`} onClick={e => e.stopPropagation()}>
        {variant === 'horizontal' && (
            <div className="hidden lg:flex p-1.5 rounded-lg bg-black/40 text-slate-500 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal className="w-4 h-4 group-hover:text-amber-500 transition-colors"/>
            </div>
        )}
        <button 
            type="button"
            onClick={e => { e.stopPropagation(); onLike && onLike(poi); }}
            className={`p-1.5 rounded-lg shadow-lg border transition-all flex items-center justify-center w-7 h-7 active:scale-90 ${isLiked ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/60 border-white/10 text-slate-300 hover:text-white'}`}
        >
            <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`}/>
        </button>
        <button 
            type="button"
            onClick={e => { e.stopPropagation(); onAdd(poi); }}
            className={`p-1.5 rounded-lg shadow-lg border transition-all flex items-center justify-center w-7 h-7 active:scale-90 ${inItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}
        >
            {inItinerary ? <Check className="w-3.5 h-3.5"/> : <Plus className="w-3.5 h-3.5"/>}
        </button>
    </div>
);

// --- MAIN COMPONENT ---
export const UniversalCard: React.FC<UniversalCardProps> = ({ 
    poi, onOpenDetail, onAddToItinerary, onLike, isLiked, userLocation, 
    variant = 'vertical', fluid = false, verticalStretch = false 
}) => {
    
    // Context Hooks
    const { itinerary } = useItinerary();
    const inItinerary = itinerary.items.some(i => i.poi.id === poi.id);
    const ui = getPoiColorStyle(poi.category);
    
    // Responsive Logic
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const titleStyle = useDynamicStyles('poi_card_title', isMobile);
    const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);
    
    // Distance Calculation
    const distanceRel = (userLocation && poi.coords.lat !== 0) 
        ? calculateDistance(userLocation.lat, userLocation.lng, poi.coords.lat, poi.coords.lng) 
        : null;
    const showDistance = distanceRel !== null;

    // --- LAYOUT: HORIZONTAL (Top 5 Lists) ---
    if (variant === 'horizontal') {
        return (
            <div 
                draggable={!isMobile} 
                onDragStart={e => { if(!isMobile) e.dataTransfer.setData('application/json', JSON.stringify(poi)); }}
                onClick={() => onOpenDetail(poi)}
                className={`group relative h-36 md:h-44 w-full rounded-xl overflow-hidden border transition-all bg-slate-900 shadow-md hover:shadow-xl cursor-pointer ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''} ${poi.tier==='gold'?'border-amber-500':poi.tier==='silver'?'border-slate-300':'border-slate-800'}`}
            >
                <ImageWithFallback 
                    src={poi.imageUrl} 
                    alt={poi.name} 
                    category={poi.category}
                    size="medium" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
                
                {poi.isSponsored && <div className="absolute top-2 right-2"><span className={`text-[7px] font-black px-1.5 py-0.5 rounded border shadow-lg ${poi.tier==='gold'?'bg-amber-500 text-black border-amber-200':'bg-white text-slate-900 border-slate-200'}`}><Award className="w-2 h-2"/> SPONSOR</span></div>}
                
                {showDistance && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className={`flex items-center justify-center gap-0.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm whitespace-nowrap ${distanceBadgeStyle || 'text-[8px] font-black text-emerald-300'}`}>
                            <Navigation className="w-2 h-2 fill-current transform rotate-45"/> {distanceRel}km
                        </span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col items-start pr-12 w-full">
                    <StarRating value={poi.rating} size="w-3 h-3" />
                    <h4 className={`text-white font-bold leading-none group-hover:text-amber-400 transition-colors mt-1 truncate w-full pr-12 ${titleStyle || 'text-sm md:text-xl'}`}>
                        {poi.name}
                    </h4>
                    {poi.address && (
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[80%]">
                            <MapPin className="w-3 h-3 shrink-0" /> {poi.address}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                    <span className={`text-[8px] font-black uppercase h-4 px-2 rounded-sm border flex items-center leading-none ${ui.bg} ${ui.text} ${ui.border}`}>{getSubCategoryLabel(poi.subCategory || '')}</span>
                </div>

                <ActionRow poi={poi} onLike={onLike} isLiked={isLiked} onAdd={onAddToItinerary} inItinerary={inItinerary} isMobile={isMobile} variant="horizontal" />
            </div>
        );
    }

    // --- LAYOUT: VERTICAL (Grids & Sidebars) ---
    // Logica dimensionamento elastico
    const containerClasses = verticalStretch 
        ? 'h-full min-h-0 w-full' 
        : `${fluid ? 'w-full' : 'w-72 md:w-72'} h-36 md:h-44`;

    const imageContainerClasses = verticalStretch 
        ? 'flex-[0_0_50%] min-h-0' 
        : 'h-[60%]';

    return (
        <div 
            draggable={!isMobile}
            onDragStart={e => { if(!isMobile) e.dataTransfer.setData('application/json', JSON.stringify(poi)); }}
            onClick={() => onOpenDetail(poi)} 
            className={`group relative ${containerClasses} rounded-xl overflow-hidden transition-all bg-slate-900 shadow-md border flex flex-col cursor-pointer ${poi.tier==='gold'?'border-amber-500':poi.tier==='silver'?'border-slate-300':'border-slate-800'}`}
        >
            {/* IMMAGINE */}
            <div className={`relative ${imageContainerClasses} overflow-hidden bg-black shrink-0`}>
                <ImageWithFallback 
                    src={poi.imageUrl} 
                    alt={poi.name} 
                    category={poi.category}
                    size="small" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                
                {/* Badge Overlay */}
                <div className="absolute top-2 right-2 flex justify-end mb-1 z-20">
                    {poi.isSponsored ? (
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${poi.tier==='gold'?'bg-amber-500 text-black border-amber-300':'bg-white text-slate-900 border-slate-200'}`}>
                            <Award className="w-2 h-2 inline mr-0.5"/> SPONSOR
                        </span>
                    ) : isPoiNew(poi) && (
                        <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase border border-purple-400">Novità</span>
                    )}
                </div>

                {/* Distance Badge */}
                {showDistance && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className={`flex items-center justify-center gap-0.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm whitespace-nowrap ${distanceBadgeStyle || 'text-[8px] font-black text-emerald-300'}`}>
                            <Navigation className="w-2 h-2 fill-current transform rotate-45"/> {distanceRel}km
                        </span>
                    </div>
                )}
            </div>

            {/* CONTENUTO */}
            <div className="relative z-10 p-2 md:p-3 flex flex-col flex-1 min-h-0 justify-between">
                <div className="w-full min-h-0 flex-1">
                    <StarRating value={poi.rating} size="w-2.5 h-2.5" />
                    <h4 className={`text-white font-bold leading-tight mt-0.5 line-clamp-2 pr-2 ${titleStyle || 'text-sm md:text-lg'}`}>
                        {poi.name}
                    </h4>
                    {poi.address && (
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[90%]">
                             <MapPin className="w-2.5 h-2.5 shrink-0" /> {poi.address}
                        </div>
                    )}
                </div>

                {/* FOOTER CARD */}
                <div className="flex justify-between items-end mt-1 shrink-0 relative">
                    <div className="flex items-center gap-2">
                        {poi.priceLevel && (
                             <div className="bg-slate-950/50 border border-slate-800 rounded px-1.5 py-0.5">
                                <PriceLevelIndicator level={poi.priceLevel} />
                            </div>
                        )}
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-sm border ${ui.bg} ${ui.text} ${ui.border}`}>
                            {getSubCategoryLabel(poi.subCategory || '')}
                        </span>
                    </div>
                    
                    <ActionRow poi={poi} onLike={onLike} isLiked={isLiked} onAdd={onAddToItinerary} inItinerary={inItinerary} isMobile={isMobile} variant="vertical" />
                </div>
            </div>
        </div>
    );
};

// Export Compatibility Aliases
export const HorizontalCard = (props: UniversalCardProps) => <UniversalCard {...props} variant="horizontal" />;
export const CompactDiscoveryCard = (props: UniversalCardProps) => <UniversalCard {...props} variant="vertical" />;
export const VerticalCompactCard = (props: UniversalCardProps) => <UniversalCard {...props} variant="vertical" fluid={false} />;
