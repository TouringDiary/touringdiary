
import React from 'react';
import { Bookmark, Star } from 'lucide-react';
import { CitySummary } from '@/types';
import { formatVisitors } from '../../../utils/common';

export interface CategoryConfig {
    id: string;
    label: string;
    color: string;
    badge: string;
}

interface PreviewSidebarProps {
    cities: any[]; // Può essere CitySummary o CityGuide/Service
    selectedCityId: string | null;
    onSelectCity: (id: string) => void;
    activeCategory: CategoryConfig | null;
    className?: string;
}

export const PreviewSidebar = ({ cities, selectedCityId, onSelectCity, activeCategory, className }: PreviewSidebarProps) => {
    return (
        <div className={`flex flex-col overflow-hidden ${className}`}>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {cities.length > 0 ? cities.map(c => {
                    const isSelected = selectedCityId === c.id;
                    const activeColorClass = activeCategory ? activeCategory.color.replace('text-', 'border-l-') : 'border-l-amber-500';
                    const activeTextClass = activeCategory ? activeCategory.color : 'text-amber-500';
                    
                    // FIX CRITICO: Controllo se è una città reale o un servizio
                    // Le città hanno la proprietà 'visitors', i servizi no.
                    const isCity = typeof c.visitors !== 'undefined';
                    const subLabel = c.zone || c.role || c.category || c.type || '';

                    return (
                        <div 
                            key={c.id}
                            onClick={() => onSelectCity(c.id)}
                            className={`
                                group cursor-pointer px-3 py-3 rounded-lg border transition-all duration-200 relative overflow-hidden flex items-center justify-between
                                ${isSelected 
                                    ? `bg-slate-900/80 border-slate-700 ${activeColorClass} border-l-4` 
                                    : 'bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800 border-l-4 border-l-transparent'
                                }
                            `}
                        >
                            <div className="min-w-0 flex-1 mr-2">
                                <h4 className={`text-lg font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {c.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-slate-500 font-bold uppercase">{subLabel}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {isCity ? (
                                    <div className="flex flex-col items-end text-right">
                                        <span className={`text-sm font-mono font-black leading-none tracking-tight ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                            {formatVisitors(c.visitors)}
                                        </span>
                                        <div className={`flex flex-col items-end text-[6px] font-black uppercase tracking-widest leading-[0.9] mt-0.5 ${isSelected ? activeTextClass : 'text-slate-600 opacity-80'}`}>
                                            <span>Flusso</span>
                                            <span>Annuale</span>
                                        </div>
                                    </div>
                                ) : (
                                    // Fallback per Guide/Servizi (es. Rating o Icona)
                                     <div className="flex flex-col items-end text-right">
                                         {c.rating ? (
                                            <span className={`text-sm font-mono font-black leading-none tracking-tight flex items-center gap-1 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                {c.rating} <Star className="w-2 h-2 fill-current"/>
                                            </span>
                                         ) : null}
                                     </div>
                                )}
                                {isSelected && <Bookmark className={`w-4 h-4 fill-current flex-shrink-0 ${activeTextClass}`} />}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-4 text-center text-slate-500 text-xs italic">
                        Nessun elemento trovato.
                    </div>
                )}
            </div>
        </div>
    );
};
