
import React from 'react';
import { Paperclip, Link2, Trash2 } from 'lucide-react';
import { ItineraryItem } from '../../../types/index';

interface DiaryMemoCardProps {
    item: ItineraryItem;
    onMemoClick: (linkedId: string) => void;
    onRemove: (id: string) => void;
    onSetEditingTime: (id: string | null) => void;
    isMobile: boolean;
    editingTimeId: string | null;
    onTimeChange: (id: string, time: string) => void;
}

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

export const DiaryMemoCard: React.FC<DiaryMemoCardProps> = ({ 
    item, onMemoClick, onRemove, onSetEditingTime, isMobile, editingTimeId, onTimeChange 
}) => {
    
    // LAYOUT RIGIDO PER ALLINEAMENTO GRIGLIA
    // Deve rispecchiare ItineraryItemCard:
    // 1. Spaziatore Sx (Linea Rossa): w-14
    // 2. Colonna Icona: w-10
    // 3. Colonna Orario: w-12
    // 4. Colonna Contenuto: Flex-1

    return (
        <div className="flex w-full min-h-[1.75rem] group relative z-10 mb-1 items-start">
            
            {/* 1. SPAZIATORE SX (Salta la colonna KM/Linea) */}
            <div className="w-14 shrink-0"></div>

            {/* 2. COLONNA ICONA (Allineata con icone POI) */}
            <div className="w-10 flex justify-center shrink-0 pt-1">
                <Paperclip className="w-4 h-4 text-slate-400 transform -rotate-45"/>
            </div>

            {/* 3. COLONNA ORARIO & CONTENUTO */}
            <div className="flex-1 flex items-start gap-0 min-w-0">
                
                {/* 3a. ORARIO */}
                <div className="w-12 flex justify-center shrink-0 pt-0.5">
                     {editingTimeId === item.id ? (
                        <select 
                            autoFocus 
                            className="bg-white border border-indigo-500 rounded text-[10px] font-mono px-0 py-0 outline-none w-10 text-center shadow-lg h-5"
                            value={item.timeSlotStr} 
                            onChange={(e) => { onTimeChange(item.id, e.target.value); onSetEditingTime(null); }} 
                            onBlur={() => onSetEditingTime(null)}
                        >
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    ) : (
                        <button 
                            onClick={() => onSetEditingTime(item.id)} 
                            className="text-[10px] font-mono font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {item.timeSlotStr || '--:--'}
                        </button>
                    )}
                </div>

                {/* 3b. CARD MEMO (ELEGANT SOFT STYLE) */}
                <div 
                    onClick={() => item.linkedResourceId && onMemoClick(item.linkedResourceId)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group/card ml-1 relative overflow-hidden"
                >
                    <div className="w-0.5 h-full absolute left-0 top-0 bg-indigo-400/50"></div>
                    
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-serif italic text-slate-600 truncate">
                            Nota: <span className="font-semibold text-slate-800 not-italic">{item.poi.name}</span>
                        </span>
                        {item.linkedResourceId && <Link2 className="w-3 h-3 text-indigo-300"/>}
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover/card:opacity-100"
                        title="Rimuovi Memo"
                    >
                        <Trash2 className="w-3 h-3"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
