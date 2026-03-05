
import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

interface GpsAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const GpsAlertModal = ({ isOpen, onClose, onConfirm }: GpsAlertModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
                {/* STANDARD RED CLOSE BUTTON */}
                <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                    <X className="w-5 h-5"/>
                </button>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Navigation className="w-8 h-8 text-blue-500 animate-pulse"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display">Attiva Posizione</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Per mostrarti cosa c'è qui intorno, abbiamo bisogno di sapere dove sei.
                        </p>
                        <div className="mt-3 bg-indigo-900/20 border border-indigo-500/30 p-2 rounded-lg">
                            <p className="text-xs text-indigo-300 font-bold uppercase tracking-wide">
                                Il browser ti chiederà conferma
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        <MapPin className="w-4 h-4"/> Consenti Accesso GPS
                    </button>
                </div>
            </div>
        </div>
    );
};
