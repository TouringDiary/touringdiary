
import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { GEO_CONFIG } from '../../../constants/geoConfig';

interface Props {
    onClose: () => void;
    onGenerate: (name: string, poiCount: number) => void;
    isGenerating: boolean;
}

export const CityGeneratorModal = ({ onClose, onGenerate, isGenerating }: Props) => {
    const [name, setName] = useState('');
    const [poiCount, setPoiCount] = useState(10);

    // Gestione ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onGenerate(name, poiCount);
    };

    return (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                
                {/* STANDARD RED CLOSE BUTTON */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg z-50">
                    <X className="w-5 h-5"/>
                </button>
                
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <Wand2 className="w-8 h-8 text-indigo-500 animate-pulse"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display">Nuova Città AI</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            L'intelligenza artificiale genererà automaticamente storia, statistiche, patrono e Punti di Interesse in modalità sequenziale stabile.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nome Città</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder={`Es. ${GEO_CONFIG.DEFAULT_CITY_NAME}...`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none font-bold"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">POI per Categoria</label>
                        <select 
                            value={poiCount}
                            onChange={(e) => setPoiCount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                        >
                            <option value={5}>5 (Veloce)</option>
                            <option value={10}>10 (Standard)</option>
                            <option value={15}>15 (Completo)</option>
                            <option value={20}>20 (Massivo)</option>
                        </select>
                        <p className="text-[9px] text-slate-500 mt-1 italic">Verranno generate 6 categorie (Totale: {poiCount * 6} POI)</p>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">
                            Annulla
                        </button>
                        <button onClick={handleSubmit} disabled={!name.trim() || isGenerating} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>} Genera Tutto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
