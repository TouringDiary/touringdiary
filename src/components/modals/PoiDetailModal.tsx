
import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, ThumbsUp, ShoppingCart, Navigation, Loader2, Box, TrendingUp, X, Phone, Mail, Globe, Check, Plus, User, Bus, Settings, Star } from 'lucide-react';
import { PointOfInterest, User as UserType } from '../../types/index';
import { openMap, open3DView, getPoiColorStyle, getSubCategoryLabel } from '../../utils/common';
import { calculateDistance } from '../../services/geo';
import { useInteraction } from '../../context/InteractionContext';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { CloseButton } from '../common/CloseButton';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';

// Imported Sub-Components
import { PoiImageSection as GallerySection } from './poiDetail/PoiImageSection'; // Rename for clarity
import { PoiInfoSection as TextSection } from './poiDetail/PoiInfoSection';

interface PoiDetailModalProps {
    poi: PointOfInterest;
    onClose: () => void;
    onToggleItinerary: (poi: PointOfInterest) => void;
    isInItinerary: boolean;
    onOpenReview: () => void;
    userLocation: { lat: number; lng: number } | null;
    onSuggestEdit?: (poiName: string) => void; 
    onOpenShop?: (poi: PointOfInterest) => void;
    user: UserType;
    onOpenAuth: () => void;
    initialView?: 'details' | 'reviews'; 
}

export const PoiDetailModal = ({ 
    poi, onClose, onToggleItinerary, isInItinerary, onOpenReview, 
    userLocation, onSuggestEdit, onOpenShop, user, onOpenAuth, initialView = 'details' 
}: PoiDetailModalProps) => {
    
    // --- 1. DETERMINA TIPO VISTA (BUSINESS VS STANDARD) ---
    const isResource = poi.resourceType || (poi.category === 'leisure' && poi.subCategory === 'agency');
    
    if (isResource) {
        return <BusinessView {...{ poi, onClose, onToggleItinerary, isInItinerary }} />;
    }

    return <StandardView {...{ poi, onClose, onToggleItinerary, isInItinerary, onOpenReview, userLocation, onSuggestEdit, onOpenShop, user, onOpenAuth, initialView }} />;
};

// --- SUB-COMPONENT: BUSINESS VIEW (EX BUSINESS CARD MODAL) ---
const BusinessView = ({ poi, onClose, onToggleItinerary, isInItinerary }: any) => {
    const CONFIG: any = {
        guide: { gradient: 'from-indigo-600 to-purple-700', border: 'border-indigo-500/50', text: 'text-indigo-400', bg: 'bg-indigo-900/20', icon: User, label: 'Guida Turistica' },
        operator: { gradient: 'from-cyan-600 to-blue-700', border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-900/20', icon: Bus, label: 'Tour Operator' },
        service: { gradient: 'from-sky-600 to-blue-600', border: 'border-sky-500/50', text: 'text-sky-400', bg: 'bg-sky-900/20', icon: Settings, label: 'Servizio' },
        default: { gradient: 'from-slate-700 to-slate-900', border: 'border-slate-600', text: 'text-slate-400', bg: 'bg-slate-900', icon: Star, label: 'Partner' }
    };

    const type = poi.resourceType || 'default';
    const theme = CONFIG[type] || CONFIG.default;
    const ThemeIcon = theme.icon;

    // Handle ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className={`relative bg-[#0b0f1a] w-full max-w-sm rounded-[2.5rem] border-2 ${theme.border} shadow-2xl overflow-hidden flex flex-col`}>
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${theme.gradient} opacity-20`}></div>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-600 text-white rounded-full transition-colors z-50 backdrop-blur-sm"><X className="w-5 h-5"/></button>

                <div className="relative z-10 flex flex-col items-center pt-12 pb-8 px-6 text-center">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent mb-4 shadow-2xl">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-4 border-[#0b0f1a] relative">
                            {poi.imageUrl && !poi.imageUrl.includes('ui-avatars') ? (
                                <ImageWithFallback src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800"><ThemeIcon className={`w-12 h-12 ${theme.text}`}/></div>
                            )}
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${theme.bg} ${theme.text} ${theme.border}`}>{theme.label}</div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 leading-tight">{poi.name}</h2>
                    <div className="flex items-center gap-2 mb-6 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800"><StarRating value={poi.rating || 5} size="w-3.5 h-3.5"/><span className="text-xs font-bold text-slate-400">({poi.votes || 0})</span></div>
                    <div className="text-sm text-slate-300 font-serif italic leading-relaxed mb-8 px-2 line-clamp-4">"{poi.description || 'Nessuna descrizione disponibile.'}"</div>
                    
                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                        {poi.contactInfo?.phone && <a href={`tel:${poi.contactInfo.phone}`} className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-900/10 transition-colors group"><Phone className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 mb-1"/><span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">Chiama</span></a>}
                        {poi.contactInfo?.email && <a href={`mailto:${poi.contactInfo.email}`} className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 transition-colors group"><Mail className="w-5 h-5 text-slate-400 group-hover:text-blue-400 mb-1"/><span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">Email</span></a>}
                        {poi.contactInfo?.website && <a href={poi.contactInfo.website} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 transition-colors group col-span-2"><Globe className="w-5 h-5 text-slate-400 group-hover:text-purple-400 mb-1"/><span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">Visita Sito Web</span></a>}
                        {!poi.contactInfo?.phone && !poi.contactInfo?.email && !poi.contactInfo?.website && poi.address && <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 col-span-2"><MapPin className="w-5 h-5 text-slate-500 mb-1"/><span className="text-[10px] text-slate-400 text-center">{poi.address}</span></div>}
                    </div>

                    <button onClick={() => onToggleItinerary(poi)} className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isInItinerary ? 'bg-emerald-600 text-white' : `bg-gradient-to-r ${theme.gradient} text-white`}`}>
                        {isInItinerary ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {isInItinerary ? 'Salvato nel Diario' : 'Aggiungi al Diario'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: STANDARD VIEW (EX POI DETAIL MODAL) ---
const StandardView = ({ poi, onClose, onToggleItinerary, isInItinerary, onOpenReview, userLocation, onSuggestEdit, onOpenShop, user, onOpenAuth, initialView }: PoiDetailModalProps) => {
    const { hasUserVoted, toggleVote } = useInteraction();
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);
    const [isFlipped, setIsFlipped] = useState(initialView === 'reviews');
    const [isVoting, setIsVoting] = useState(false);
    const [localVotes, setLocalVotes] = useState(poi.votes || 0);

    const uiStyle = useMemo(() => getPoiColorStyle(poi.category), [poi.category]);
    const distance = (userLocation && poi.coords && poi.coords.lat !== 0) ? calculateDistance(userLocation.lat, userLocation.lng, poi.coords.lat, poi.coords.lng) : null;
    const isVoted = hasUserVoted(poi.id);

    const handleThumbClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || user.role === 'guest') { onOpenAuth(); return; }
        if (isVoting) return;
        setIsVoting(true);
        const newCount = await toggleVote(poi.id);
        if (newCount !== null) setLocalVotes(newCount);
        setIsVoting(false);
    };

    let interestColor = "bg-slate-800 text-slate-500 border-slate-700";
    let interestLabel = "N/C";
    if (poi.tourismInterest === 'high') { interestColor = "bg-yellow-950/40 text-yellow-400 border-yellow-500/40 shadow-[0_0_10px_rgba(250,204,21,0.1)]"; interestLabel = "TOP LEVEL"; }
    else if (poi.tourismInterest === 'medium') { interestColor = "bg-slate-800/60 text-slate-300 border-slate-400/40"; interestLabel = "MED"; }
    else if (poi.tourismInterest === 'low') { interestColor = "bg-orange-950/40 text-orange-400 border-orange-800/60"; interestLabel = "LOW LEVEL"; }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4">
            <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-5xl h-full md:max-h-[95vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                <div className="p-5 md:p-6 border-b border-slate-800 bg-[#0f172a] relative z-20 shrink-0">
                    <div className="absolute top-4 right-4 z-50"><CloseButton onClose={onClose} /></div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-6">
                        <div className="flex-1 min-w-0 flex flex-col justify-end gap-1">
                            <h2 className="text-xl md:text-3xl font-display font-bold text-white leading-tight truncate drop-shadow-md">{poi.name}</h2>
                            <div className="flex items-center gap-2 mb-1"><MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0"/><span className="text-slate-400 text-xs md:text-sm truncate">{poi.address || "Campania, Italia"}</span></div>
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/50">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-lg ${uiStyle.bg} ${uiStyle.text} ${uiStyle.border}`}>{getSubCategoryLabel(poi.subCategory || '')}</span>
                                {distance && <span className={`flex items-center gap-1 bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-500/30 whitespace-nowrap ${distanceBadgeStyle || 'text-[10px] font-black text-emerald-400'}`}><Navigation className="w-3 h-3 rotate-45 fill-current"/> {distance}km</span>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 items-end">
                            <div className={`hidden md:flex flex-col items-center justify-center px-3 py-1 rounded-xl border ${interestColor} mb-1 self-end`}><div className="flex items-center gap-1.5 font-black text-xs leading-none"><TrendingUp className="w-3 h-3"/> {interestLabel}</div></div>
                            <div className="flex items-center gap-2">
                                {poi.vatNumber && onOpenShop && <button onClick={() => { onOpenShop(poi); onClose(); }} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg transition-transform active:scale-95 border border-indigo-400" title="Vai alla Bottega"><ShoppingCart className="w-4 h-4"/></button>}
                                <button onClick={() => openMap(poi.coords.lat, poi.coords.lng, poi.name, poi.address)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"><MapPin className="w-3.5 h-3.5"/> Maps</button>
                                <button onClick={() => open3DView(poi.coords.lat, poi.coords.lng, poi.name, poi.address)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"><Box className="w-3.5 h-3.5"/> 3D</button>
                                <button onClick={handleThumbClick} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${isVoted ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}>{isVoting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-current' : ''}`}/>} {localVotes}</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    <div className="relative w-full bg-black shrink-0 h-[35vh] md:flex-[1.2] md:h-auto border-b border-slate-800 overflow-hidden">
                         <GallerySection poi={poi} isFlipped={isFlipped} setIsFlipped={setIsFlipped} onToggleItinerary={onToggleItinerary} isInItinerary={isInItinerary} user={user} onOpenAuth={onOpenAuth} onOpenReview={onOpenReview} />
                    </div>
                    <div className="flex-1 md:flex-1 min-h-0 bg-slate-900 overflow-hidden relative">
                        <TextSection poi={poi} onSuggestEdit={onSuggestEdit} />
                    </div>
                </div>
            </div>
        </div>
    );
};
