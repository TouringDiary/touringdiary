
import React, { useState } from 'react';
import { RefreshCw, Trash2, AlertTriangle, X, CheckSquare, Square, CheckCircle } from 'lucide-react';

interface RegenerateConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedStatuses: string[]) => void;
    cityName: string;
}

export const RegenerateConfirmModal = ({ isOpen, onClose, onConfirm, cityName }: RegenerateConfirmModalProps) => {
    const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['needs_check', 'draft']));

    const toggleStatus = (status: string) => {
        const newSet = new Set(selectedStatuses);
        if (newSet.has(status)) newSet.delete(status);
        else newSet.add(status);
        setSelectedStatuses(newSet);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5"/>
                </button>
                
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <RefreshCw className="w-8 h-8 text-red-500 animate-spin-slow"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display">Rigenerazione Totale POI</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Questa operazione <strong className="text-red-400">ELIMINERÀ DEFINITIVAMENTE</strong> i POI esistenti per <strong className="text-white">{cityName}</strong> e chiederà all'IA di rigenerarli da zero.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Seleziona cosa cancellare:</p>
                    
                    {[
                        { id: 'needs_check', label: 'Da Bonificare (Consigliato)', color: 'text-red-400' },
                        { id: 'draft', label: 'Bozze AI (Consigliato)', color: 'text-amber-400' },
                        { id: 'published', label: 'POI Pubblicati (Attenzione!)', color: 'text-emerald-400' }
                    ].map(opt => (
                        <div 
                            key={opt.id}
                            onClick={() => toggleStatus(opt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedStatuses.has(opt.id) ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                            <span className={`text-xs font-bold uppercase ${opt.color}`}>{opt.label}</span>
                            {selectedStatuses.has(opt.id) ? <CheckSquare className="w-5 h-5 text-red-500"/> : <Square className="w-5 h-5 text-slate-600"/>}
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">
                        Annulla
                    </button>
                    <button 
                        onClick={() => onConfirm(Array.from(selectedStatuses))} 
                        disabled={selectedStatuses.size === 0}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4"/> Cancella e Rigenera
                    </button>
                </div>
            </div>
        </div>
    );
};
