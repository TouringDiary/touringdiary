
import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Navigation, Star, ThumbsUp, Plus, Crosshair, Award, GripHorizontal, Check, Box, ShoppingCart, Edit3, Loader2, TrendingUp, Coins } from 'lucide-react';
import { PointOfInterest, User } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { calculateDistance } from '../../../services/geo';
import { openMap, open3DView, getPoiColorStyle, getSubCategoryLabel } from '../../../utils/common';
import { StarRating } from '../../common/StarRating';
import { useInteraction } from '../../../context/InteractionContext';
import { useVirtualWindow } from '../../../hooks/useVirtualWindow';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles'; 

// NEW: Standard Price Level Indicator (5 Euro Symbols)
const PriceLevelIndicator = ({ level }: { level?: number }) => {
    // Standard always shows 5 slots
    const MAX_LEVEL = 5;
    // Default level if missing is 0 (all gray)
    const activeLevel = level || 0;

    return (
        <div className="flex gap-0.5 items-center justify-center h-full" title={`Livello Prezzo: ${activeLevel}/${MAX_LEVEL}`}>
            {[...Array(MAX_LEVEL)].map((_, index) => {
                const isActive = index < activeLevel;
                
                // UNIFORMATO COLORE A QUELLO INTERNO (AMBER/ORANGE) SU RICHIESTA UTENTE
                const activeClass = 'text-amber-500'; 

                return (
                    <span 
                        key={index} 
                        className={`text-[10px] font-black leading-none ${isActive ? activeClass : 'text-slate-800'}`}
                    >
                        €
                    </span>
                );
            })}
        </div>
    );
};

const PoiListItem = ({ poi, onOpenDetail, onOpenShop, onAddToItinerary, isItemInItinerary, referencePoint, userLocation, onSetReference, isMobile, onOpenAuth, onOpenReview, user, onAdminEdit }: any) => {
    const { hasUserVoted, toggleVote } = useInteraction();
    
    // DYNAMIC STYLES
    const titleStyle = useDynamicStyles('poi_card_title', isMobile);
    const descStyle = useDynamicStyles('poi_card_desc', isMobile);
    const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);
    
    const isVoted = hasUserVoted(poi.id);
    const inItinerary = isItemInItinerary(poi.id);
    const isAdmin = user && (user.role === 'admin_all' || user.role === 'admin_limited');
    
    // Stato Riferimento - Usa l'ID per confronto preciso
    const isRef = referencePoint && (referencePoint.id === poi.id || referencePoint.name === poi.name);
    const isGlobalRefActive = !!referencePoint;
    
    const [isVoting, setIsVoting] = useState(false);
    const [localVotes, setLocalVotes] = useState(poi.votes);
    const uiStyle = getPoiColorStyle(poi.category);

    // CALCOLO DISTANZE
    const distFromUser = (userLocation && poi.coords.lat !== 0) 
        ? calculateDistance(userLocation.lat, userLocation.lng, poi.coords.lat, poi.coords.lng) 
        : null;

    const distFromRef = (isGlobalRefActive && !isRef && poi.coords.lat !== 0)
        ? calculateDistance(referencePoint.lat, referencePoint.lng, poi.coords.lat, poi.coords.lng)
        : null;

    const handleThumbClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || user.role === 'guest') { onOpenAuth(); return; }
        if (isVoting) return;
        setIsVoting(true);
        const newCount = await toggleVote(poi.id);
        if (newCount !== null) setLocalVotes(newCount);
        setIsVoting(false);
    };

    const handleReviewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || user.role === 'guest') { onOpenAuth(); return; }
        onOpenReview(poi);
    };

    const sideBtnClass = "flex-1 flex flex-col items-center justify-center gap-1 transition-colors";
    const sideIconClass = "w-4 h-4 md:w-5 md:h-5";
    const sideLabelClass = "text-[7px] font-black uppercase";

    // PREMIUM METALS INTEREST BADGE
    let interestColor = "text-slate-500 border-slate-700 bg-slate-800/50";
    let interestLabel = "N/C";
    
    if (poi.tourismInterest === 'high') {
        // GOLD - TOP
        interestColor = "text-yellow-400 border-yellow-500/40 bg-yellow-950/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]";
        interestLabel = "TOP";
    } else if (poi.tourismInterest === 'medium') {
        // SILVER - MED
        interestColor = "text-slate-300 border-slate-400/40 bg-slate-800/60";
        interestLabel = "MED";
    } else if (poi.tourismInterest === 'low') {
        // BRONZE - LOW (Dark orange/brown mix)
        interestColor = "text-orange-400 border-orange-800/60 bg-orange-950/20";
        interestLabel = "LOW";
    }

    return (
        <div 
            draggable={!isMobile} 
            onDragStart={e => { if(isMobile) e.preventDefault(); else e.dataTransfer.setData('application/json', JSON.stringify(poi)); }}
            onClick={() => onOpenDetail(poi)}
            className={`bg-slate-900 rounded-2xl overflow-hidden flex h-36 md:h-44 group transition-all relative border ${poi.tier === 'gold' ? 'border-amber-500 shadow-amber-900/20' : 'border-slate-800 hover:border-slate-600 shadow-md'} cursor-pointer`}
        >
            {/* BARRA SX */}
            <div className="w-12 md:w-16 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
                <button onClick={e => { e.stopPropagation(); openMap(poi.coords.lat, poi.coords.lng, poi.name, poi.address); }} className={`${sideBtnClass} hover:bg-slate-800 text-slate-500 hover:text-amber-400 border-b border-slate-800`} title="Mappa">
                    <MapPin className={sideIconClass}/>
                    <span className={sideLabelClass}>MAPS</span>
                </button>
                <button onClick={e => { e.stopPropagation(); open3DView(poi.coords.lat, poi.coords.lng, poi.name, poi.address); }} className={`${sideBtnClass} hover:bg-slate-800 text-slate-500 hover:text-indigo-400 border-b border-slate-800`} title="Vista 3D">
                    <Box className={sideIconClass}/>
                    <span className={sideLabelClass}>3D</span>
                </button>
                
                {/* TASTO DA QUI / DISTANZA */}
                <button 
                    onClick={e => { 
                        e.stopPropagation(); 
                        onSetReference(e, poi); 
                    }} 
                    className={`
                        ${sideBtnClass}
                        ${isRef 
                            ? 'bg-blue-600 text-white border-blue-500' // Attivo
                            : isGlobalRefActive && distFromRef !== null
                                ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/30' // Mostra Distanza
                                : 'hover:bg-slate-800 text-slate-500 hover:text-blue-400' // Inattivo
                        }
                    `} 
                    title={isRef ? "Riferimento Attivo" : "Imposta come Riferimento"}
                >
                    {isRef ? (
                        <>
                            <Crosshair className={sideIconClass}/>
                            <span className={sideLabelClass}>ATTIVO</span>
                        </>
                    ) : (isGlobalRefActive && distFromRef !== null) ? (
                        <>
                            <Navigation className={`w-4 h-4 transform rotate-45 ${distanceBadgeStyle ? distanceBadgeStyle.split(' ').filter(c => c.startsWith('text-')).join(' ') : ''}`}/>
                            <span className={distanceBadgeStyle || sideLabelClass}>{distFromRef}KM</span>
                        </>
                    ) : (
                        <>
                            <Crosshair className={sideIconClass}/>
                            <span className={sideLabelClass}>DA QUI</span>
                        </>
                    )}
                </button>
            </div>

            {/* CENTRO */}
            <div className="flex-1 flex overflow-hidden">
                <div className="w-24 md:w-40 relative shrink-0 border-r border-slate-800/50">
                    <ImageWithFallback 
                        src={poi.imageUrl} 
                        alt={poi.name} 
                        category={poi.category} 
                        size="small" 
                        className="w-full h-full object-cover"
                    />
                    {poi.isSponsored && <div className="absolute top-2 left-2"><span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border shadow-lg ${poi.tier==='gold'?'bg-amber-500 text-black border-amber-300':'bg-white text-slate-900 border-slate-200'}`}><Award className="w-2.5 h-2.5"/> SPONSOR</span></div>}
                    
                    {distFromUser !== null && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-max max-w-[90%] pointer-events-none">
                            <span className={`flex items-center justify-center gap-0.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-lg whitespace-nowrap ring-1 ring-black/50 ${distanceBadgeStyle || 'text-[8px] md:text-[9px] font-black text-emerald-300'}`}>
                                <Navigation className="w-2 h-2 fill-current transform rotate-45"/> {distFromUser}km
                            </span>
                        </div>
                    )}
                    
                    <div className="absolute bottom-0 inset-x-0 p-1 bg-gradient-to-t from-black to-transparent flex justify-center items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-current"/><span className="text-[10px] font-bold text-white">{poi.rating}</span></div>
                </div>
                <div className="flex-1 p-3 flex flex-col min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                             <h4 className={`${titleStyle} truncate group-hover:text-amber-400 transition-colors leading-none`}>
                                 {poi.name}
                             </h4>
                             {poi.address && (
                                <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-slate-400 mt-1 truncate">
                                     <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" /> {poi.address}
                                </div>
                             )}
                             <div className="h-px w-full bg-gradient-to-r from-slate-800/0 via-slate-800 to-slate-800/0 mt-1 mb-2"></div>
                        </div>
                        
                        {/* RIGHT HEADER ACTIONS: Interest Badge & Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                             
                             {/* INTEREST BADGE (COMPACT h-5 matching footer style) */}
                             <div className={`hidden md:flex items-center gap-1.5 px-2 h-5 rounded border ${interestColor}`}>
                                 <TrendingUp className="w-3 h-3"/>
                                 <span className="text-[9px] font-black uppercase tracking-wider leading-none">{interestLabel}</span>
                             </div>

                             {isAdmin && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAdminEdit && onAdminEdit(poi); }} 
                                    className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all border border-slate-700 shadow-sm" 
                                    title="Modifica"
                                >
                                    <Edit3 className="w-3.5 h-3.5"/>
                                </button>
                             )}
                             {poi.vatNumber && onOpenShop && <button onClick={e => { e.stopPropagation(); onOpenShop(poi); }} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white border border-indigo-400 shadow-md"><ShoppingCart className="w-3.5 h-3.5"/></button>}
                        </div>
                    </div>
                    
                    {/* DYNAMIC DESCRIPTION STYLE APPLIED HERE */}
                    <p className={`${descStyle || 'text-[11px] md:text-sm text-slate-400 leading-relaxed italic'} line-clamp-2 mb-2`}>
                        "{poi.description || 'Nessuna descrizione.'}"
                    </p>
                    
                    <div className="mt-auto">
                        <div className="h-px w-full bg-gradient-to-r from-slate-800/0 via-slate-800 to-slate-800/0 mb-2"></div>
                        <div className="flex items-center justify-between">
                            
                            {/* LEFT SIDE: PRICE INDICATOR + SUB-CATEGORY BADGE */}
                            <div className="flex items-center gap-2 h-5">
                                {/* STANDARD PRICE INDICATOR (€€€€€) - UPDATED GOLD BORDER */}
                                <div className="bg-slate-950/50 border border-amber-500/50 rounded px-2 h-full flex items-center">
                                    <PriceLevelIndicator level={poi.priceLevel} />
                                </div>
                                
                                <span className={`text-[8px] md:text-[9px] font-black px-2 rounded border uppercase tracking-wider flex items-center h-full ${uiStyle.bg} ${uiStyle.text} ${uiStyle.border}`}>
                                    {getSubCategoryLabel(poi.subCategory || '')}
                                </span>
                            </div>

                            <div className="hidden lg:flex items-center gap-3">
                                {/* MOBILE INTEREST BADGE (If needed on small screens layout, though hidden lg) */}
                                <div className={`md:hidden flex items-center gap-1.5 px-2 h-5 rounded border ${interestColor}`}>
                                     <span className="text-[8px] font-black uppercase leading-none">{interestLabel}</span>
                                </div>

                                <div className="p-1 rounded transition-all text-slate-700 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:ring-1 group-hover:ring-cyan-500/50">
                                    <GripHorizontal className="w-5 h-5"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DX */}
            <div className="w-12 md:w-16 bg-[#0f172a] border-l border-slate-800 flex flex-col shrink-0">
                <button onClick={e => { e.stopPropagation(); onAddToItinerary(poi); }} className={`${sideBtnClass} border-b border-slate-800 ${inItinerary ? 'bg-emerald-900/20 text-emerald-500' : 'hover:bg-slate-800 text-slate-500 hover:text-emerald-400'}`} title="Aggiungi">
                    {inItinerary ? <Check className="w-4 h-4 md:w-5 md:h-5"/> : <Plus className="w-4 h-4 md:w-5 md:h-5"/>}
                    <span className={sideLabelClass}>ADD</span>
                </button>
                <button onClick={handleThumbClick} className={`${sideBtnClass} border-b border-slate-800 ${isVoted ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-400'}`} title="Voto">
                    {isVoting ? <Loader2 className="w-4 h-4 animate-spin"/> : <ThumbsUp className={`w-4 h-4 md:w-5 md:h-5 ${isVoted ? 'fill-current' : ''}`}/>}
                    <span className={sideLabelClass}>{localVotes}</span>
                </button>
                <button onClick={handleReviewClick} className={`${sideBtnClass} text-slate-500 hover:text-amber-400`} title="Valuta">
                    <Star className={sideIconClass}/>
                    <span className={sideLabelClass}>VALUTA</span>
                </button>
            </div>
        </div>
    );
};

interface CityGuideProps {
    pois: PointOfInterest[];
    sponsors: PointOfInterest[];
    userLocation: { lat: number; lng: number } | null;
    onAddToItinerary: (poi: PointOfInterest) => void;
    isItemInItinerary: (id: string) => boolean;
    referencePoint: { lat: number; lng: number; name: string; id?: string } | null;
    onSetReference: (e: React.MouseEvent, poi: PointOfInterest) => void;
    onOpenDetail: (poi: PointOfInterest) => void;
    onOpenShop: (poi: PointOfInterest) => void;
    onOpenSponsor: (type?: string) => void;
    isSidebarOpen?: boolean;
    user?: User;
    onOpenAuth: () => void;
    onOpenReview: (poi: PointOfInterest) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    onAdminEdit?: (poi: PointOfInterest) => void;
}

export const CityGuide = ({ 
    pois, sponsors, userLocation, onAddToItinerary, isItemInItinerary, 
    referencePoint, onSetReference, onOpenDetail, onOpenShop, onOpenSponsor,
    isSidebarOpen, user, onOpenAuth, onOpenReview, scrollContainerRef, onAdminEdit 
}: CityGuideProps) => {
    
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 1024);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const visiblePois = pois; 

    return (
        // RIDOTTO PADDING ORIZZONTALE SU MOBILE per allargare le card
        <div className="px-0 md:px-2 py-4 md:p-8">
             <div className="flex flex-col gap-6">
                {visiblePois.map(poi => (
                    <PoiListItem 
                        key={poi.id}
                        poi={poi}
                        onOpenDetail={onOpenDetail}
                        onOpenShop={onOpenShop}
                        onAddToItinerary={onAddToItinerary}
                        isItemInItinerary={isItemInItinerary}
                        referencePoint={referencePoint}
                        userLocation={userLocation}
                        onSetReference={onSetReference}
                        isMobile={isMobile}
                        onOpenAuth={onOpenAuth}
                        onOpenReview={onOpenReview}
                        user={user}
                        onAdminEdit={onAdminEdit}
                    />
                ))}
            </div>
             {pois.length === 0 && (
                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    Nessun luogo trovato.
                </div>
            )}
        </div>
    );
};
