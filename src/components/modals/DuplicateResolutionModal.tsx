
import React, { useEffect } from 'react';
import { Copy, RefreshCw, X, AlertCircle } from 'lucide-react';
import { ItineraryItem, PointOfInterest } from '../../types/index';

interface DuplicateResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDuplicate: () => void;
    onReplace: () => void;
    newItemPoi: PointOfInterest;
    existingItem: ItineraryItem;
    targetDayIndex: number;
    targetTime: string;
}

export const DuplicateResolutionModal = ({ isOpen, onClose, onAddDuplicate, onReplace, newItemPoi, existingItem, targetDayIndex, targetTime }: DuplicateResolutionModalProps) => {
    
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
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 w-full max-w-md rounded-2xl border border-amber-600/50 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-full flex-shrink-0">
                            <AlertCircle className="w-8 h-8 text-amber-500"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-bold text-white mb-1">Tappa già presente</h3>
                            <p className="text-sm text-slate-300">
                                Hai già inserito <strong className="text-white">{newItemPoi.name}</strong> nel tuo diario:
                            </p>
                            <div className="mt-2 bg-slate-800/50 p-2 rounded border border-slate-700 text-xs text-slate-400">
                                Giorno {existingItem.dayIndex + 1} alle {existingItem.timeSlotStr}
                            </div>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-5 h-5"/></button>
                </div>

                <div className="space-y-3">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest text-center mb-2">Cosa vuoi fare?</p>

                    <button 
                        onClick={onAddDuplicate}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 hover:border-blue-500 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Copy className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform"/>
                        <div className="text-left">
                            <div className="text-sm">Aggiungi Duplicato</div>
                            <div className="text-[10px] text-slate-400 font-normal">Mantieni entrambi nel diario</div>
                        </div>
                    </button>

                    <button 
                        onClick={onReplace}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center gap-3 group"
                    >
                        <RefreshCw className="w-5 h-5 text-emerald-500 group-hover:rotate-180 transition-transform"/>
                        <div className="text-left">
                            <div className="text-sm">Sposta qui (Rimuovi precedente)</div>
                            <div className="text-[10px] text-slate-400 font-normal">Inserisci al Giorno {targetDayIndex + 1}, {targetTime}</div>
                        </div>
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-sm font-medium transition-colors">
                        Annulla operazione
                    </button>
                </div>

            </div>
        </div>
    );
};
