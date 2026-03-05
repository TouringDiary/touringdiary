
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Plus, MessageSquare, Star, ArrowUpLeft, Pencil } from 'lucide-react';
import { PointOfInterest, User } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { StarRating } from '../../common/StarRating';
import { getUnifiedReviews } from '../../../services/communityService';

interface PoiImageSectionProps {
    poi: PointOfInterest;
    isFlipped: boolean;
    setIsFlipped: (v: boolean) => void;
    onToggleItinerary: (poi: PointOfInterest) => void;
    isInItinerary: boolean;
    user: User;
    onOpenAuth: () => void;
    onOpenReview: () => void;
}

export const PoiImageSection = ({ 
    poi, isFlipped, setIsFlipped, onToggleItinerary, isInItinerary, 
    user, onOpenAuth, onOpenReview 
}: PoiImageSectionProps) => {
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [allReviews, setAllReviews] = useState<any[]>([]);

    const images = useMemo(() => poi.gallery && poi.gallery.length > 0 ? poi.gallery : [poi.imageUrl], [poi]);

    useEffect(() => {
        const loadDynamicReviews = async () => {
            const dynamic = await getUnifiedReviews();
            const approvedDynamic = dynamic.filter(r => r.poiId === poi.id && r.status === 'approved');
            const combined = [...(poi.reviews || []), ...approvedDynamic];
            setAllReviews(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        };
        loadDynamicReviews();
    }, [poi.id, poi.reviews]);

    // Safety rating check
    const displayRating = (poi.rating || 0).toFixed(1);

    return (
        <div className="relative w-full h-full perspective-1000 bg-black">
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* FRONT: IMAGE & MAIN ACTIONS */}
                <div className="absolute inset-0 backface-hidden">
                    <ImageWithFallback 
                        src={images[currentImageIndex]} 
                        alt={poi.name} 
                        category={poi.category} 
                        className="w-full h-full object-cover opacity-90"
                        priority={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
                    
                    {/* ADD TO ITINERARY BUTTON (Top Right) */}
                    <div className="absolute top-4 right-4 z-30">
                        <button 
                            onClick={() => onToggleItinerary(poi)} 
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform hover:scale-105 active:scale-95 border ${isInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}
                        >
                            {isInItinerary ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
                            {isInItinerary ? 'Aggiunto' : 'Aggiungi'}
                        </button>
                    </div>

                    {/* RATING & REVIEWS BUTTON (Bottom Left) */}
                    <div className="absolute bottom-6 left-6 flex items-end gap-4 text-white z-20">
                        <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[70px] shadow-2xl">
                            <span className="text-2xl font-black leading-none">{displayRating}</span>
                            <StarRating value={poi.rating || 0} size="w-3 h-3" showValue={false}/>
                        </div>
                        <button 
                            onClick={() => setIsFlipped(true)} 
                            className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center gap-2 border border-indigo-400 backdrop-blur-md mb-1"
                        >
                            <MessageSquare className="w-3.5 h-3.5"/> RECENSIONI
                        </button>
                    </div>

                    {/* SLIDER CONTROLS */}
                    {images.length > 1 && (
                        <div className="absolute inset-x-4 top-1/2 -translate-x-1/2 flex justify-between pointer-events-none z-20">
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p-1+images.length)%images.length); }} className="p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 pointer-events-auto transition-all"><ChevronLeft className="w-6 h-6"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p+1)%images.length); }} className="p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 pointer-events-auto transition-all"><ChevronRight className="w-6 h-6"/></button>
                        </div>
                    )}
                </div>

                {/* BACK: REVIEWS PANEL */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 flex flex-col border-t border-slate-800">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b0f1a] shrink-0">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-amber-500"/> Recensioni</h3>
                        <button onClick={() => setIsFlipped(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                            <ArrowUpLeft className="w-3.5 h-3.5 text-amber-500"/> TORNA FOTO
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-950/50">
                        {allReviews.length > 0 ? allReviews.map((rev, idx) => (
                            <div key={idx} className="bg-[#0b0f1a] p-4 rounded-xl border border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400">{rev.author.charAt(0)}</div>
                                        <div><span className="text-sm font-bold text-white block">{rev.author}</span><div className="flex gap-0.5 mt-0.5"><StarRating value={rev.rating} size="w-2.5 h-2.5"/></div></div>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-mono">{new Date(rev.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-300 italic leading-relaxed pl-2 border-l-2 border-slate-700">{rev.text}</p>
                            </div>
                        )) : <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 opacity-40"><MessageSquare className="w-10 h-10"/><p className="text-xs italic">Nessun commento.</p></div>}
                    </div>
                    <div className="p-4 border-t border-slate-800 bg-slate-900">
                        <button onClick={() => { if(!user || user.role==='guest') onOpenAuth(); else onOpenReview(); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg flex items-center justify-center gap-2 border border-emerald-500 transition-all">
                            <Pencil className="w-4 h-4"/> Scrivi Recensione
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
