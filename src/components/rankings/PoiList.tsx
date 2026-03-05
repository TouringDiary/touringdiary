
import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { PointOfInterest, RankedItemMixin } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PoiListProps {
    pois: (PointOfInterest & RankedItemMixin)[];
    onClick: (poi: PointOfInterest) => void;
}

export const PoiList: React.FC<PoiListProps> = ({ pois, onClick }) => {
    return (
        <div className="space-y-3 p-6">
            {pois.map((poi, idx) => (
                <div key={poi.id} onClick={() => onClick(poi)} className="flex items-center gap-4 bg-slate-900/50 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 transition-colors group cursor-pointer hover:border-indigo-500/50">
                    <div className="w-10 text-center font-black text-slate-500 text-lg group-hover:text-white transition-colors">#{idx + 1}</div>
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        <ImageWithFallback src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate group-hover:text-indigo-400 transition-colors text-base">{poi.name}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-bold tracking-wide mt-1 truncate">
                             <MapPin className="w-3 h-3 text-slate-600"/>
                             {poi.hierarchy}
                        </div>
                    </div>
                    <div className="text-right px-2">
                        <div className="flex items-center gap-1 text-emerald-400 font-black text-sm justify-end bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Users className="w-3.5 h-3.5"/> {poi.votes}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase mt-1">Voti Reali</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
