
import React from 'react';
import { Crown, Medal, Maximize2 } from 'lucide-react';
import { CitySummary, RankedItemMixin } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatVisitors } from '../../utils/common';
import { StarRating } from '../common/StarRating';
import { CityAlgo } from '../../hooks/useRankingsLogic';

interface CityRowProps {
    item: CitySummary & RankedItemMixin;
    originalRank: number;
    type: CityAlgo;
    onNavigate: () => void;
    onZoom: (url: string) => void;
}

export const CityRow: React.FC<CityRowProps> = ({ 
    item, 
    originalRank, 
    type, 
    onNavigate, 
    onZoom 
}) => {
    const isPodium = originalRank <= 3;
    
    // Icona Rank
    let rankIcon = <span className="text-slate-500 font-mono font-bold">#{originalRank}</span>;
    if (originalRank === 1) rankIcon = <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400/20"/>;
    if (originalRank === 2) rankIcon = <Medal className="w-5 h-5 text-slate-300 fill-slate-300/20"/>;
    if (originalRank === 3) rankIcon = <Medal className="w-5 h-5 text-amber-700 fill-amber-700/20"/>;

    // Colore Riga
    const rowBg = isPodium ? 'bg-slate-900/50 hover:bg-slate-800' : 'hover:bg-slate-800/30';
    const borderClass = isPodium ? (originalRank === 1 ? 'border-l-4 border-l-yellow-500' : originalRank === 2 ? 'border-l-4 border-l-slate-400' : 'border-l-4 border-l-amber-700') : 'border-l-4 border-l-transparent';

    return (
        <tr className={`transition-colors cursor-pointer group border-b border-slate-800/50 ${rowBg} ${borderClass}`} onClick={onNavigate}>
            <td className="px-4 py-3 text-center w-16">
                <div className="flex justify-center items-center">{rankIcon}</div>
            </td>
            <td className="px-4 py-3 w-24">
                <div 
                    className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700 relative group/img cursor-zoom-in shadow-md"
                    onClick={(e) => { e.stopPropagation(); onZoom(item.imageUrl); }}
                >
                    <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110"/>
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                        <Maximize2 className="w-4 h-4 text-white drop-shadow-md"/>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">{item.name}</div>
            </td>
            <td className="px-4 py-3">
                <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 whitespace-nowrap">
                    {item.zone}
                </span>
            </td>
            <td className="px-4 py-3 hidden md:table-cell">
                <div className="flex flex-col text-[10px] text-slate-500 uppercase font-bold tracking-wide">
                    <span>{item.adminRegion}</span>
                    <span className="opacity-60">{item.nation}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                {item.specialBadge ? (
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider whitespace-nowrap
                        ${item.specialBadge === 'event' ? 'bg-rose-900/20 text-rose-400 border-rose-500/30' :
                          item.specialBadge === 'trend' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' :
                          item.specialBadge === 'season' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' :
                          item.specialBadge === 'destination' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'}
                    `}>
                        {item.specialBadge}
                    </span>
                ) : <span className="text-slate-700 text-xs">-</span>}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="font-mono font-bold text-slate-300 text-sm">
                    {formatVisitors(item.visitors)}
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end items-center gap-1.5">
                    <span className={`text-sm font-bold ${type === 'ai' ? 'text-emerald-400' : 'text-white'}`}>{item.rating.toFixed(1)}</span>
                    <StarRating value={item.rating} size="w-3 h-3" showValue={false} activeColor={type === 'ai' ? 'text-emerald-500' : 'text-amber-400'} fillColor={type === 'ai' ? 'fill-emerald-500' : 'fill-amber-400'}/>
                </div>
            </td>
        </tr>
    );
};
