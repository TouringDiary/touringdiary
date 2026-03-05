
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Heart, MapPin, User, Clock, Loader2 } from 'lucide-react';
import { PremadeItinerary, User as UserType } from '../../types/index';
import { getCommunityItinerariesAsync, toggleItineraryLike, getUserItineraryLikes } from '../../services/communityService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatDate } from '../../utils/common';

interface CommunityItinerariesTabProps {
    user: UserType;
    onViewItinerary?: (itinerary: PremadeItinerary) => void;
}

export const CommunityItinerariesTab = ({ user, onViewItinerary }: CommunityItinerariesTabProps) => {
    const [communityItineraries, setCommunityItineraries] = useState<PremadeItinerary[]>([]);
    const [likedItineraryIds, setLikedItineraryIds] = useState<string[]>([]);
    const [itinerarySearch, setItinerarySearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await getCommunityItinerariesAsync();
            setCommunityItineraries(data);
            if (user && user.id) {
                const likes = await getUserItineraryLikes(user.id);
                setLikedItineraryIds(likes);
            }
            setIsLoading(false);
        };
        load();
    }, [user]);

    const handleLikeItinerary = async (itineraryId: string) => {
        if (user.role === 'guest') {
            alert("Accedi per mettere like!");
            return;
        }
        const result = await toggleItineraryLike(itineraryId, user.id);
        
        // Aggiorniamo lo stato locale dei like
        if (result.liked) {
            setLikedItineraryIds(prev => [...prev, itineraryId]);
        } else {
            setLikedItineraryIds(prev => prev.filter(id => id !== itineraryId));
        }
        
        // Aggiorniamo anche il conteggio dei voti nell'elenco
        setCommunityItineraries(prev => prev.map(it => 
            it.id === itineraryId ? { ...it, votes: result.count } : it
        ));
    };

    const filteredItineraries = useMemo(() => {
        return communityItineraries.filter(it => 
            it.title.toLowerCase().includes(itinerarySearch.toLowerCase()) || 
            it.mainCity.toLowerCase().includes(itinerarySearch.toLowerCase())
        );
    }, [communityItineraries, itinerarySearch]);

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>;

    return (
        <div className="pb-10">
            <div className="mb-6 relative max-w-md mx-auto md:mx-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Cerca per città o titolo..." value={itinerarySearch} onChange={(e) => setItinerarySearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {filteredItineraries.length === 0 && <div className="col-span-full text-center text-slate-500 italic py-10">Nessun diario trovato.</div>}
                {filteredItineraries.map(it => {
                    const isLiked = likedItineraryIds.includes(it.id);
                    return (
                        <div key={it.id} onClick={() => onViewItinerary?.(it)} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-2xl cursor-pointer">
                            <div className="h-40 relative overflow-hidden">
                                <ImageWithFallback src={it.coverImage} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                <div className="absolute top-2 right-2 z-20">
                                     <button onClick={(e) => { e.stopPropagation(); handleLikeItinerary(it.id); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold shadow-lg transition-all ${isLiked ? 'bg-rose-600 text-white scale-110' : 'bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10'}`}>
                                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`}/> {it.votes}
                                     </button>
                                </div>
                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-md border border-white/10 flex items-center gap-1"><Calendar className="w-3 h-3"/> {it.durationDays} Giorni</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">{(it.author || 'U').charAt(0)}</div>
                                        <span className="text-xs text-slate-400 font-medium">di <strong className="text-slate-200">{it.author || 'Anonimo'}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                        <Clock className="w-2.5 h-2.5"/> {formatDate(it.date)}
                                    </div>
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1 leading-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{it.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> {it.mainCity} • {it.items.length} Tappe</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
