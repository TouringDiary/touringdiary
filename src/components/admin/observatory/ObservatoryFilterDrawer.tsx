
import React, { useEffect } from 'react';
import { X, Filter, RotateCcw, Check, Globe, MapPin, AlertOctagon, Layers, EyeOff, Eye, Activity, Clock, AlertTriangle } from 'lucide-react';
import { GeoCascadingFilters } from '../cities/GeoCascadingFilters';
import { CitySummary } from '../../../types/index';

interface GeoSelection {
    continent: string;
    nation: string;
    region: string;
    zone: string;
    city: string;
}

interface ObservatoryFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cities: CitySummary[];
    
    geoFilter: GeoSelection;
    setGeoFilter: (val: GeoSelection) => void;
    
    cityStatus: string;
    setCityStatus: (val: string) => void;
    
    poiStatus: string;
    setPoiStatus: (val: string) => void;

    // NEW: Filtri Qualità
    minQuality: number;
    setMinQuality: (val: number) => void;

    // NEW: Filtri Anomalie Specifiche
    suspicionTypes: string[];
    setSuspicionTypes: (val: string[]) => void;
    
    activeTab: 'overview' | 'anomalies' | 'duplicates';
}

export const ObservatoryFilterDrawer = ({ 
    isOpen, onClose, cities, 
    geoFilter, setGeoFilter,
    cityStatus, setCityStatus,
    poiStatus, setPoiStatus,
    minQuality, setMinQuality,
    suspicionTypes, setSuspicionTypes,
    activeTab
}: ObservatoryFilterDrawerProps) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleReset = () => {
        setGeoFilter({ continent: '', nation: '', region: '', zone: '', city: '' });
        setCityStatus('all');
        setPoiStatus('all');
        setMinQuality(0);
        setSuspicionTypes([]);
    };

    const toggleSuspicion = (type: string) => {
        if (suspicionTypes.includes(type)) {
            setSuspicionTypes(suspicionTypes.filter(t => t !== type));
        } else {
            setSuspicionTypes([...suspicionTypes, type]);
        }
    };

    // Calcolo filtri attivi (Visuale)
    const activeCount = 
        Object.values(geoFilter).filter(Boolean).length + 
        (cityStatus !== 'all' ? 1 : 0) + 
        (poiStatus !== 'all' ? 1 : 0) + 
        (minQuality > 0 ? 1 : 0) +
        suspicionTypes.length;

    return (
        <>
            {/* BACKDROP */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* DRAWER */}
            <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-[2010] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* HEADER */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
                            <Filter className="w-5 h-5 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">
                                Filtri Avanzati
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {activeTab === 'overview' ? 'Panoramica Città' : activeTab === 'duplicates' ? 'Deduplica' : 'Analisi Anomalie'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* SEZIONE 1: GEOGRAFIA (Sempre Visibile) */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Area Geografica</h4>
                        <GeoCascadingFilters 
                            cities={cities} 
                            value={geoFilter} 
                            onChange={setGeoFilter}
                            orientation="vertical" 
                        />
                    </div>

                    {/* SEZIONE 2: STATO CITTÀ (Visibile in Overview e Duplicates) */}
                    {(activeTab === 'overview' || activeTab === 'duplicates') && (
                        <div className="space-y-4">
                             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Stato Città (Parent)</h4>
                             
                             <div className="space-y-2">
                                 <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                                     <Globe className="w-3 h-3"/> Filtra per stato
                                 </label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => setCityStatus('all')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${cityStatus === 'all' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>Tutte</button>
                                     <button onClick={() => setCityStatus('published')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${cityStatus === 'published' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <Eye className="w-3 h-3"/> Online
                                     </button>
                                     <button onClick={() => setCityStatus('draft')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${cityStatus === 'draft' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <Layers className="w-3 h-3"/> Bozza
                                     </button>
                                     <button onClick={() => setCityStatus('missing')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${cityStatus === 'missing' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <AlertOctagon className="w-3 h-3"/> Mancante
                                     </button>
                                 </div>
                             </div>

                             {/* QUALITÀ DATI (Solo Overview) */}
                             {activeTab === 'overview' && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                                            <Activity className="w-3 h-3"/> Qualità Dati Minima
                                        </label>
                                        <span className="text-white font-mono font-bold text-xs">{minQuality}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={minQuality} 
                                        onChange={(e) => setMinQuality(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                                        <span>0% (Tutti)</span>
                                        <span>100% (Perfetti)</span>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {/* SEZIONE 3: STATO POI & ANOMALIE (Visibile in Anomalies) */}
                    {activeTab === 'anomalies' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Dettagli POI</h4>
                            
                            <div className="space-y-2">
                                 <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                                     <MapPin className="w-3 h-3"/> Stato Singolo POI
                                 </label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => setPoiStatus('all')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${poiStatus === 'all' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>Tutti</button>
                                     <button onClick={() => setPoiStatus('published')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${poiStatus === 'published' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <Eye className="w-3 h-3"/> Online
                                     </button>
                                     <button onClick={() => setPoiStatus('draft')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${poiStatus === 'draft' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <EyeOff className="w-3 h-3"/> Bozza
                                     </button>
                                     <button onClick={() => setPoiStatus('needs_check')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${poiStatus === 'needs_check' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                         <AlertOctagon className="w-3 h-3"/> Revisione
                                     </button>
                                 </div>
                             </div>

                             {/* DETTAGLIO SOSPENSIONI ORARIE */}
                             <div className="space-y-2 pt-2">
                                <label className="text-[9px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <Clock className="w-3 h-3"/> Tipologie Sospette
                                </label>
                                <p className="text-[9px] text-slate-500 italic mb-2">Filtra per tipo di incongruenza oraria.</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'monday_open', label: 'Museo Aperto Lunedì' },
                                        { id: 'weekend_closed', label: 'Ristorante Chiuso Weekend' },
                                        { id: 'missing_hours', label: 'Orari Mancanti' },
                                        { id: 'always_open', label: 'Aperto 7/7 (Sospetto)' },
                                        { id: 'estimated', label: 'Stimato da AI (Non Verificato)' }
                                    ].map(type => {
                                        const isSelected = suspicionTypes.includes(type.id);
                                        return (
                                            <button 
                                                key={type.id}
                                                onClick={() => toggleSuspicion(type.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase ${isSelected ? 'bg-red-900/30 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <AlertTriangle className={`w-3 h-3 ${isSelected ? 'text-red-500' : 'text-slate-600'}`}/>
                                                    {type.label}
                                                </span>
                                                {isSelected && <Check className="w-3 h-3"/>}
                                            </button>
                                        );
                                    })}
                                </div>
                             </div>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex items-center gap-3 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-lg py-3 rounded-xl transition-transform active:scale-95"
                    >
                        <Check className="w-4 h-4"/> Applica Filtri
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest border border-slate-700 rounded-xl"
                        title="Resetta Filtri"
                    >
                         <RotateCcw className="w-3.5 h-3.5"/>
                    </button>
                </div>
            </div>
        </>
    );
};
