
import React, { useState, useEffect } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface SaveAsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    currentName: string;
}

export const SaveAsModal = ({ isOpen, onClose, onConfirm, currentName }: SaveAsModalProps) => {
    const [name, setName] = useState(currentName);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // FETCH TESTI DB
    const { getText } = useSystemMessage('modal_save_as');
    const msg = getText();

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

    const handleSaveClick = () => {
        if (!name.trim()) return;
        
        if (name === currentName) {
            setShowConfirm(true);
        } else {
            onConfirm(name);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 rounded-lg">
                            <Save className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display">
                                {msg.title || 'Salva con nome'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {msg.body || 'Dai un nome al tuo itinerario'}
                            </p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-5 h-5"/></button>
                </div>

                {showConfirm ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-amber-950/50 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-amber-500 font-bold mb-1">Sovrascrivere il diario?</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Stai salvando con lo stesso nome ("{name}"). Questo sovrascriverà il diario esistente. Vuoi procedere?
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={() => onConfirm(name)}
                                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                            >
                                Sovrascrivi
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Nome Viaggio</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
                                placeholder="Es. Vacanze Estive 2025"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && name.trim()) {
                                        handleSaveClick();
                                    }
                                }}
                            />
                        </div>
                        
                        <button 
                            onClick={handleSaveClick}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                        >
                            Salva Progetto
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
