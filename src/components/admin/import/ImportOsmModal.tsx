
import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, MapPin, Layers, Maximize, CheckCircle, Terminal } from 'lucide-react';
import { fetchOsmData } from '../../../services/importService';
import { saveStagingBatch } from '../../../services/stagingService';
import { CitySummary } from '../../../types/index';
import { CloseButton } from '../../common/CloseButton';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city: CitySummary;
    onSuccess: () => void;
}

const CATEGORIES = [
    { id: 'monument', label: 'Monumenti & Cultura' },
    { id: 'food', label: 'Ristorazione (Food)' },
    { id: 'hotel', label: 'Hotel & Ospitalità' },
    { id: 'nature', label: 'Natura & Parchi' },
    { id: 'leisure', label: 'Svago & Tempo Libero' },
    { id: 'shop', label: 'Shopping' },
    { id: 'services', label: 'Servizi Utili (Trasporti/Farmacie)' }
];

export const ImportOsmModal = ({ isOpen, onClose, city, onSuccess }: Props) => {
    const [radius, setRadius] = useState(0); // 0 = Intera Città (Default Migliore)
    
    // MODIFICA: Seleziona tutte le categorie di default
    const [selectedCats, setSelectedCats] = useState<string[]>(CATEGORIES.map(c => c.id));
    
    const [isFetching, setIsFetching] = useState(false);
    
    // LOG STATE
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogView, setShowLogView] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // ESC Key Listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showLogView) {
                    // Se siamo nel report finale, chiudi tutto e refresh
                    onSuccess();
                    onClose();
                } else if (!isFetching) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isFetching, showLogView, onSuccess]);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isOpen) return null;

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    };

    const toggleCat = (id: string) => {
        setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handleImport = async () => {
        if (selectedCats.length === 0) {
            alert("Seleziona almeno una categoria.");
            return;
        }

        setIsFetching(true);
        setShowLogView(true);
        setLogs([]); // Reset logs
        let totalImported = 0;

        try {
            addLog(`Avvio importazione per ${city.name}...`, 'info');

            for (const cat of selectedCats) {
                addLog(`Scarico categoria: ${cat}...`, 'info');
                
                // 1. Fetch da OSM (Overpass API)
                const rawData = await fetchOsmData(city.coords.lat, city.coords.lng, radius, cat, city.name);
                
                if (rawData.length > 0) {
                    addLog(`Trovati ${rawData.length} elementi grezzi. Salvataggio in Staging...`, 'info');
                    // 2. Salvataggio nel DB Staging
                    const result = await saveStagingBatch(city.id, rawData);
                    if (!result.error) {
                        addLog(`Salvati ${result.inserted} item per ${cat}.`, 'success');
                        totalImported += result.inserted;
                    } else {
                        addLog(`Errore salvataggio ${cat}: ${result.error.message}`, 'error');
                    }
                } else {
                    addLog(`Nessun elemento trovato per ${cat}.`, 'info');
                }
                
                // Pausa per non spammare l'API
                await new Promise(r => setTimeout(r, 500));
            }

            addLog(`TERMINATO. Totale importati: ${totalImported}.`, 'success');

        } catch (e: any) {
            console.error(e);
            addLog(`ERRORE CRITICO: ${e.message}`, 'error');
        } finally {
            setIsFetching(false);
        }
    };

    const handleCloseFinal = () => {
        onSuccess(); // Trigger refresh dashboard
        onClose();
    };

    // VISTA 2: LOG CONSOLE
    if (showLogView) {
        return (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                            {isFetching ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500"/> : <CheckCircle className="w-5 h-5 text-emerald-500"/>}
                            {isFetching ? 'Importazione in corso...' : 'Importazione Completata'}
                        </h3>
                    </div>
                    
                    <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.includes('ERRORE') ? 'text-red-400' : log.includes('Salvati') || log.includes('TERMINATO') ? 'text-emerald-400' : 'text-slate-400'} border-b border-white/5 pb-1`}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                        <button 
                            onClick={handleCloseFinal} 
                            disabled={isFetching}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all"
                        >
                            {isFetching ? 'Attendere...' : 'OK, Chiudi e Aggiorna'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // VISTA 1: CONFIGURAZIONE
    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Download className="w-5 h-5 text-indigo-500"/> Importa da OpenStreetMap
                    </h3>
                    <CloseButton onClose={onClose} />
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* INFO CITTÀ */}
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400"><MapPin className="w-5 h-5"/></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Target</p>
                            <p className="text-white font-bold">{city.name}</p>
                        </div>
                    </div>

                    {/* RAGGIO */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase flex justify-between items-center">
                            Area di Ricerca
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${radius === 0 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-white border-slate-600'}`}>
                                {radius === 0 ? 'INTERA CITTÀ (CONFINI)' : `${radius} METRI DAL CENTRO`}
                            </span>
                        </label>
                        <div className="relative pt-1">
                            <input 
                                type="range" 
                                min="0" 
                                max="10000" 
                                step="500" 
                                value={radius} 
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            {radius === 0 && (
                                <div className="absolute top-6 left-0 right-0 text-center animate-in fade-in">
                                    <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                                        <Maximize className="w-3 h-3"/> Cerca in tutti i confini comunali
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase mt-2">
                            <span>0 (Tutta)</span>
                            <span>10km (Vasta)</span>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800 w-full"></div>

                    {/* CATEGORIE */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5"/> Categorie da scaricare
                            </label>
                            <button 
                                onClick={() => setSelectedCats(CATEGORIES.map(c => c.id))}
                                className="text-[9px] text-indigo-400 hover:text-white uppercase font-bold"
                            >
                                Seleziona Tutte
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCat(cat.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedCats.includes(cat.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                >
                                    <span className="text-xs font-bold uppercase">{cat.label}</span>
                                    {selectedCats.includes(cat.id) && <div className="w-2 h-2 rounded-full bg-white shadow"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-800 bg-[#0f172a]">
                    <button 
                        onClick={handleImport}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4"/> Avvia Download
                    </button>
                </div>

            </div>
        </div>
    );
};
