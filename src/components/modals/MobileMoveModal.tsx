
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, ArrowRightLeft, CheckCircle, RefreshCw } from 'lucide-react';
import { ItineraryItem } from '../../types/index';

interface MobileMoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dayIndex: number, time: string, forceSwap?: boolean) => void;
    item: ItineraryItem;
    days: Date[];
    allItems: ItineraryItem[]; // Per controllare collisioni
}

export const MobileMoveModal = ({ isOpen, onClose, onConfirm, item, days, allItems }: MobileMoveModalProps) => {
    const [selectedDay, setSelectedDay] = useState<number>(item.dayIndex);
    const [selectedTime, setSelectedTime] = useState<string>(item.timeSlotStr);

    // Generate time slots (15 min intervals)
    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(timeStr);
        }
    }

    useEffect(() => {
        if (isOpen) {
            setSelectedDay(item.dayIndex);
            setSelectedTime(item.timeSlotStr);
        }
    }, [isOpen, item]);

    // Gestione ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Check if the currently selected target slot is occupied by another item
    const isTargetOccupied = allItems.some(i => 
        i.dayIndex === selectedDay && 
        i.timeSlotStr === selectedTime && 
        i.id !== item.id
    );

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(selectedDay, selectedTime, isTargetOccupied);
        onClose();
    };

    // Uso createPortal per garantire che il modale sia sempre sopra tutto (z-index reale rispetto al viewport)
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>

            <div className="relative bg-slate-900 w-full max-w-sm rounded-t-[2rem] sm:rounded-2xl border-t border-x border-slate-700 sm:border shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 pb-safe sm:pb-0 overflow-hidden">
                
                <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0f172a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-400"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-none">Sposta Tappa</h3>
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{item.poi.name}</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Day Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                            <Calendar className="w-3.5 h-3.5"/> Seleziona Giorno
                        </label>
                        <select 
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none text-base appearance-none shadow-inner cursor-pointer"
                        >
                            {days.map((d, idx) => (
                                <option key={idx} value={idx}>
                                    Giorno {idx + 1} - {d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time Selection with Occupied Logic */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                            <Clock className="w-3.5 h-3.5"/> Seleziona Orario
                        </label>
                        <select 
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className={`w-full bg-slate-950 border rounded-xl p-4 text-base appearance-none font-mono shadow-inner cursor-pointer outline-none ${isTargetOccupied ? 'border-amber-500 text-amber-500 font-bold' : 'border-slate-700 text-white focus:border-indigo-500'}`}
                        >
                            {timeSlots.map(t => {
                                const isOccupied = allItems.some(i => 
                                    i.dayIndex === selectedDay && 
                                    i.timeSlotStr === t && 
                                    i.id !== item.id // Non conta se stesso
                                );
                                
                                return (
                                    <option 
                                        key={t} 
                                        value={t} 
                                        className={isOccupied ? "text-amber-500 bg-slate-900 font-bold" : "text-white"}
                                    >
                                        {t} {isOccupied ? '(Occupato - Scambia)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {isTargetOccupied && (
                            <p className="text-[10px] text-amber-500 font-bold ml-1 animate-pulse">
                                Attenzione: Orario occupato. Conferma per invertire le tappe.
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={handleConfirm}
                        className={`w-full text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-sm uppercase tracking-widest mt-4 ${isTargetOccupied ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
                    >
                        {isTargetOccupied ? <RefreshCw className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} 
                        {isTargetOccupied ? 'Conferma e Inverti' : 'Conferma Spostamento'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
