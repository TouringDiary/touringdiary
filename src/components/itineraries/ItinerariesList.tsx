
import React, { useState, useEffect } from 'react';
import { Globe, Award, User, Bot, Heart, Lightbulb } from 'lucide-react';
import { PremadeItinerary, User as UserType } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { getUserItineraryLikes, toggleItineraryLike } from '../../services/communityService';

interface Props {
    user?: UserType;
    itineraries: PremadeItinerary[];
    onSelect: (itinerary: PremadeItinerary) => void;
    selectedId?: string | null;
    onUpdateData: () => void;
}

export const ItinerariesList = ({ user, itineraries, onSelect, selectedId, onUpdateData }: Props) => {
    const [likedItems, setLikedItems] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchLikes = async () => {
            if (user) {
                const likes = await getUserItineraryLikes(user.id);
                setLikedItems(likes);
            }
        };
        fetchLikes();
    }, [user, itineraries]);

    const handleLike = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!user || user.role === 'guest') { alert("Accedi per salvare nei preferiti!"); return; }
        await toggleItineraryLike(id, user.id);
        onUpdateData();
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]">
            {itineraries.length > 0 ? itineraries.map(itinerary => {
                const isLiked = likedItems.includes(itinerary.id);
                const isSelected = selectedId === itinerary.id;
                return (
                    <div key={itinerary.id} onClick={() => onSelect(itinerary)} className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:shadow-xl ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-900/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
                        <div className="h-32 relative overflow-hidden">
                            <ImageWithFallback src={itinerary.coverImage} alt={itinerary.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            <div className="absolute top-2 left-2 z-20">
                                <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded backdrop-blur-sm border uppercase tracking-wide flex items-center gap-1 ${itinerary.type === 'official' ? 'bg-amber-600/90 border-amber-500' : itinerary.type === 'community' ? 'bg-blue-600/90 border-blue-500' : 'bg-purple-600/90 border-purple-500'}`}>
                                    {itinerary.type === 'official' && <Award className="w-2.5 h-2.5"/>}
                                    {itinerary.type === 'community' && <User className="w-2.5 h-2.5"/>}
                                    {itinerary.type === 'ai' && <Bot className="w-2.5 h-2.5"/>}
                                    {itinerary.type === 'official' ? 'TOURING DIARY' : itinerary.type === 'community' ? 'COMMUNITY' : 'SMART TRENDS'}
                                </span>
                            </div>
                            <div className="absolute top-2 right-2 z-20">
                                <button onClick={(e) => handleLike(e, itinerary.id)} className="p-1.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-colors group/heart">
                                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white group-hover/heart:text-rose-400'}`}/>
                                </button>
                            </div>
                            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                                <span className="text-[9px] font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded uppercase tracking-wide">{itinerary.durationDays === 1 ? '1 GIORNO' : `${itinerary.durationDays} GIORNI`}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${itinerary.difficulty === 'Relax' ? 'bg-emerald-500/90 text-black' : itinerary.difficulty === 'Intenso' ? 'bg-rose-500/90 text-white' : 'bg-amber-500/90 text-black'}`}>{itinerary.difficulty}</span>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-white text-base leading-tight group-hover:text-indigo-400 transition-colors pr-2 line-clamp-2">{itinerary.title}</h3>
                                <div className="flex flex-col items-end shrink-0"><StarRating value={itinerary.rating} size="w-2.5 h-2.5" /><span className="text-[9px] text-slate-500 font-mono mt-0.5">{itinerary.votes} voti</span></div>
                            </div>
                            {itinerary.author && <div className="text-[9px] text-indigo-400 mb-1 font-bold">by {itinerary.author}</div>}
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2"><Globe className="w-3 h-3"/> {itinerary.mainCity}</div>
                            <div className="flex flex-wrap gap-1 mt-2">{itinerary.tags.slice(0,3).map(t => <span key={t} className="text-[9px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase">{t}</span>)}</div>
                        </div>
                    </div>
                );
            }) : <div className="text-center py-20 text-slate-500 italic">Nessun itinerario trovato.</div>}
        </div>
    );
};
