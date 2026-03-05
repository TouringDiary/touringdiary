
import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, User, ShieldCheck, AlertTriangle } from 'lucide-react';
import { GEO_CONFIG } from '../../../constants/geoConfig';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: { peopleCount: number; runPoiDeepScan: boolean }) => void;
    cityName: string;
}

export const CompleteCityModal = ({ isOpen, onClose, onConfirm, cityName }: Props) => {
    const [peopleCount, setPeopleCount] = useState(10);
    const [runPoiDeepScan, setRunPoiDeepScan] = useState(false);

    // Gestione ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border-2 border-indigo-500/50 p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
                
                {/* STANDARD RED CLOSE BUTTON */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg z-50">
                    <X className="w-5 h-5"/>
                </button>
                
                <div className="flex flex-col items-center text-center gap-4 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Wand2 className="w-10 h-10 text-white animate-pulse"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white mb-1">Completa Città (AI)</h3>
                        <p className="text-slate-400 text-sm">
                            Orchestrazione totale per <strong>{cityName || GEO_CONFIG.DEFAULT_CITY_NAME}</strong>.
                        </p>
                    </div>
                </div>

                <div className="space-y-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                    
                    {/* PERSONAGGI */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400"><User className="w-5 h-5"/></div>
                            <div className="text-left">
                                <span className="text-sm font-bold text-white block">Personaggi Famosi</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quantità da generare</span>
                            </div>
                        </div>
                        <select 
                            value={peopleCount}
                            onChange={(e) => setPeopleCount(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm outline-none focus:border-indigo-500"
                        >
                            <option value={5}>5 Persone</option>
                            <option value={10}>10 Persone</option>
                            <option value={15}>15 Persone</option>
                        </select>
                    </div>

                    <div className="h-px bg-slate-800 w-full"></div>

                    {/* POI DEEP SCAN */}
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${runPoiDeepScan ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <ShieldCheck className="w-5 h-5"/>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm font-bold transition-colors ${runPoiDeepScan ? 'text-white' : 'text-slate-400'}`}>Bonifica POI (Pro)</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={runPoiDeepScan} onChange={e => setRunPoiDeepScan(e.target.checked)} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Esegue una verifica profonda (Gemini Pro + Search) su tutti i POI in bozza recuperati da OSM. 
                                <br/>
                                <span className="text-amber-500 font-bold flex items-center gap-1 mt-1">
                                    <AlertTriangle className="w-3 h-3"/> Richiede tempo e quota API.
                                </span>
                            </p>
                        </div>
                    </div>

                </div>

                <button 
                    onClick={() => onConfirm({ peopleCount, runPoiDeepScan })}
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                    <Wand2 className="w-5 h-5"/> Avvia Processo Completo
                </button>
            </div>
        </div>
    );
};
