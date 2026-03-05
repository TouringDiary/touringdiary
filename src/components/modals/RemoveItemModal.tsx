
import React, { useEffect } from 'react';
import { X, Trash2, Calendar, CheckSquare } from 'lucide-react';
import { ItineraryItem } from '../../types/index';

interface RemoveItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ItineraryItem[];
    onRemoveSingle: (itemId: string) => void;
    onRemoveAll: () => void;
}

export const RemoveItemModal = ({ isOpen, onClose, items, onRemoveSingle, onRemoveAll }: RemoveItemModalProps) => {
    
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || items.length === 0) return null;

    const poiName = items[0].poi.name;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6">
                
                <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-full text-red-500">
                            <Trash2 className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-bold text-white">Rimuovi Tappa</h3>
                            <p className="text-xs text-slate-400">"{poiName}" è presente più volte</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-5 h-5"/></button>
                </div>

                <p className="text-sm text-slate-300 mb-4">
                    Quale istanza vuoi rimuovere dal tuo diario?
                </p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onRemoveSingle(item.id)}
                            className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-900 p-2 rounded-lg text-slate-400 group-hover:text-white">
                                    <Calendar className="w-4 h-4"/>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-sm">Giorno {item.dayIndex + 1}</div>
                                    <div className="text-xs text-slate-400 font-mono bg-slate-900 px-1.5 rounded inline-block mt-0.5">
                                        ore {item.timeSlotStr}
                                    </div>
                                </div>
                            </div>
                            <div className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold uppercase">
                                Rimuovi
                            </div>
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                    <button 
                        onClick={onRemoveAll}
                        className="w-full py-3 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckSquare className="w-4 h-4"/> Rimuovi tutte le ({items.length}) copie
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors"
                    >
                        Annulla
                    </button>
                </div>

            </div>
        </div>
    );
};
