
import React from 'react';
import { Award, Star, Check, Plus } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { useItinerary } from '../../context/ItineraryContext';

interface BottegaSponsorCardProps {
    poi: PointOfInterest;
    onAddToItinerary: (poi: PointOfInterest) => void;
}

export const BottegaSponsorCard: React.FC<BottegaSponsorCardProps> = ({ poi, onAddToItinerary }) => {
    const { itinerary } = useItinerary();
    const inItinerary = itinerary.items.some(i => i.poi.id === poi.id);
    const isGold = poi.tier === 'gold';

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`[DEBUG] Click su Add Bottega Card: ${poi.name}`);
        onAddToItinerary(poi);
    };

    const stopDrag = (e: any) => e.stopPropagation();

    return (
        <div className={`group relative w-full h-28 rounded-xl border overflow-hidden transition-all bg-slate-900 shadow-md ${isGold ? 'border-amber-500/60 hover:border-amber-400' : 'border-slate-200 hover:border-white shadow-white/5'}`}>
            <ImageWithFallback src={poi.imageUrl} alt={poi.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            <div className="absolute top-2 right-2 pointer-events-none">
                 <span className={`text-[7px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase border shadow-xl ${isGold ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black border-yellow-100 shadow-amber-500/30' : 'bg-gradient-to-r from-slate-200 via-white to-slate-400 text-slate-900 border-white/60 shadow-white/20'}`}>
                    <Award className="w-2 h-2"/> SPONSOR
                 </span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
                <div className="min-w-0 flex-1 pr-10">
                    <h5 className="text-white font-bold text-[9px] leading-tight truncate drop-shadow-md mb-0.5">{poi.name}</h5>
                    <StarRating value={poi.rating} size="w-2 h-2" showValue={false} />
                </div>
                
                <button 
                    type="button"
                    onClick={handleAdd}
                    onMouseDown={stopDrag}
                    onPointerDown={stopDrag}
                    className={`pointer-events-auto p-1.5 rounded-lg transition-all shadow-2xl border shrink-0 flex items-center justify-center w-8 h-8 cursor-pointer relative z-50 ${inItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white active:scale-90 hover:scale-105'}`}
                    title={inItinerary ? "Già Aggiunto" : "Aggiungi all'itinerario"}
                >
                    {inItinerary ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4 font-black"/>}
                </button>
            </div>
        </div>
    );
};
