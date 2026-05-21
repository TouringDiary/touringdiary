import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { MapPinOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';


interface GpsErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    error: string;
    onRetry: () => void;
    isCritical?: boolean; // NEW: Indica se è un blocco sistema
}

export const GpsErrorModal = ({ isOpen, onClose, error, onRetry, isCritical = false }: GpsErrorModalProps) => {
    useGlobalModalEscape(isOpen, onClose);


    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in pointer-events-auto" style={{ zIndex: Z_OVERLAY }} onClick={onClose}>
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <CloseButton 
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className="top-3 right-3"
                />

                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg ${isCritical ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800 border-slate-600'}`}>
                        {isCritical ? <AlertTriangle className="w-8 h-8 text-red-500"/> : <MapPinOff className="w-8 h-8 text-slate-400"/>}
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display">
                            {isCritical ? 'Accesso GPS Negato' : 'Posizione non disponibile'}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {error}
                        </p>
                        
                        {isCritical && (
                            <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-left text-xs text-slate-400">
                                <p className="font-bold text-white mb-1 uppercase tracking-wide">Cosa controllare:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Lucchetto browser (accanto URL)</li>
                                    <li>Impostazioni Privacy del PC/Telefono</li>
                                    <li>Connessione Sicura (HTTPS)</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                        >
                            Chiudi
                        </button>
                        <button 
                            onClick={() => { onClose(); onRetry(); }}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4"/> Riprova
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};



