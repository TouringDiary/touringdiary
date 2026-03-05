
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, PenTool } from 'lucide-react';
import { CityDetails } from '../../types/index';

interface Props {
    city: CityDetails;
    onOpenCulture: () => void;
    onSuggestEdit?: () => void; 
}

export const CityHistory = ({ city, onOpenCulture, onSuggestEdit }: Props) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 mb-6 overflow-hidden">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-amber-900/20 p-2 rounded-lg text-amber-500">
                        <BookOpen className="w-5 h-5"/>
                    </div>
                    <h3 className="text-lg font-display font-bold text-white">Approfondimenti Storici</h3>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenCulture(); }}
                        className="text-xs font-bold text-amber-400 hover:text-white uppercase tracking-wide border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                        Angolo Cultura
                    </button>
                    {expanded ? <ChevronUp className="text-slate-500"/> : <ChevronDown className="text-slate-500"/>}
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800 animate-in slide-in-from-top-2">
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-serif">
                        <p>{city.details.historyFull || city.details.historySnippet}</p>
                    </div>
                    {onSuggestEdit && (
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSuggestEdit(); }}
                                className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-amber-400 transition-colors uppercase font-bold"
                            >
                                <PenTool className="w-3 h-3"/> Suggerisci Modifica
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
