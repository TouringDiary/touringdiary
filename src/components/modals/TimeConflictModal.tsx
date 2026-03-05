
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, ArrowDown, Clock, MapPin } from 'lucide-react';
import { ItineraryItem } from '../../types/index';

interface TimeConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newTime: string) => void;
    onSwap: () => void;
    item: ItineraryItem;
    targetDayIndex: number;
    conflictingItem: ItineraryItem;
    existingItemsInTargetDay: ItineraryItem[];
}

export const TimeConflictModal = ({ isOpen, onClose, onConfirm, onSwap, item, targetDayIndex, conflictingItem, existingItemsInTargetDay }: TimeConflictModalProps) => {
    const [selectedTime, setSelectedTime] = useState<string>('09:00');

    // Generate time slots (15 min intervals)
    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(timeStr);
        }
    }

    // ESC Key Listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
             <div className="relative bg-[#0f172a] w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                
                {/* HEADER */}
                <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-start gap-4">
                         <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse"/>
                         </div>
                         <div>
                            <h3 className="text-2xl font-display font-black text-white leading-none mb-1">Conflitto Orario</h3>
                            <p className="text-sm text-slate-400 font-medium">Spostamento tappa</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg -mt-2 -mr-2"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* ALERT BANNER */}
                    <div className="flex items-center justify-center mb-6">
                        <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-900/50 animate-bounce">
                            Orario Occupato!
                        </span>
                    </div>

                    {/* BOX VISUAL COMPARISON (Raggruppato come richiesto) */}
                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner space-y-1">
                        
                        {/* 1. TAPPA NEL DIARIO (OCCUPANTE) */}
                        <div className="bg-slate-900 border-l-4 border-red-500 rounded-r-xl p-4 shadow-lg relative opacity-60">
                            <div className="absolute top-2 right-2 text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-950/30 px-2 py-0.5 rounded">
                                Nel Diario
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-mono font-bold text-slate-400">{conflictingItem.timeSlotStr}</div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-300 text-sm truncate">{conflictingItem.poi.name}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Giorno {targetDayIndex + 1}</p>
                                </div>
                            </div>
                        </div>

                        {/* CONNECTOR */}
                        <div className="flex items-center justify-center py-2 relative z-10">
                            <div className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700 shadow-sm flex items-center gap-1">
                                <ArrowDown className="w-3 h-3"/> SOSTITUIRE CON <ArrowDown className="w-3 h-3"/>
                            </div>
                        </div>

                        {/* 2. TAPPA NUOVA (SPOSTAMENTO) */}
                        <div className="bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl p-4 shadow-xl relative border border-y-0 border-r-0 ring-1 ring-indigo-500/20">
                            <div className="absolute top-2 right-2 text-[9px] font-black text-indigo-400 uppercase tracking-wider bg-indigo-950/30 px-2 py-0.5 rounded">
                                Tappa Nuova
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-mono font-bold text-white">{item.timeSlotStr}</div>
                                <div className="w-px h-8 bg-indigo-500/50"></div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white text-base truncate">{item.poi.name}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-bold uppercase mt-0.5">
                                        <MapPin className="w-3 h-3"/> Inserimento
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTION 1: SWAP */}
                    <div className="mt-6 mb-8">
                        <button 
                            onClick={onSwap} 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-3 group active:scale-95 border border-indigo-400/20"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform"/>
                            Sostituisci (Scambia le tappe)
                        </button>
                        
                        {/* TEXT OUTSIDE BOX & INCREASED SIZE */}
                        <p className="text-center text-slate-400 text-sm font-medium mt-3 px-2 leading-relaxed">
                            La tappa esistente verrà spostata al posto di quella che stai trascinando.
                        </p>
                    </div>

                    {/* DIVIDER */}
                    <div className="relative flex items-center py-2 mb-6">
                         <div className="flex-grow border-t border-slate-700"></div>
                         <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Oppure cambia orario</span>
                         <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    {/* ACTION 2: CHANGE TIME */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                            <select 
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-mono font-bold focus:border-amber-500 focus:outline-none appearance-none cursor-pointer"
                            >
                                {timeSlots.map(time => {
                                    const conflict = existingItemsInTargetDay.find(i => i.timeSlotStr === time && i.id !== item.id);
                                    return (
                                        <option key={time} value={time} disabled={!!conflict} className={conflict ? "text-slate-600 bg-slate-900 italic" : "text-white font-bold"}>
                                            {time} {conflict ? `(Occupato)` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <button onClick={() => onConfirm(selectedTime)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 rounded-xl transition-colors border border-slate-700 uppercase text-xs tracking-wider">
                            Conferma
                        </button>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
                     <button onClick={onClose} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors py-2">
                        Annulla Operazione
                     </button>
                </div>

             </div>
        </div>
    );
};
