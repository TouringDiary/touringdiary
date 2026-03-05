
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, MapPinOff, ImageOff, ShieldAlert, CheckCircle, RefreshCw, Loader2, Clock, Edit3, Filter, X } from 'lucide-react';
import { getAnomalies } from '../../../services/observatoryService';
import { getPoisByCityId, getPoisByCityIds } from '../../../services/city/poiService';
import { saveSinglePoi } from '../../../services/city/poi/poiWrite'; 
import { AnomalyRecord, PointOfInterest } from '../../../types/index';
import { ScheduleMatrix } from './ScheduleMatrix';
import { analyzeSchedule } from '../../../utils/scheduleUtils'; 
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { AdminPoiModal } from '../AdminPoiModal';
import { useAdminData } from '../../../hooks/useAdminData'; 

interface Props {
    geoFilter: { continent: string, nation: string, region: string, zone: string, city: string };
    cityStatusFilter: string;
    poiStatusFilter: string;
    suspicionTypeFilter: string[];
    activeFiltersCount: number;
    onOpenFilter: () => void;
}

export const AnomalyInspector = ({ 
    geoFilter, cityStatusFilter, poiStatusFilter, suspicionTypeFilter, 
    activeFiltersCount, onOpenFilter 
}: Props) => {
    const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
    const [fullPois, setFullPois] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);
    
    // Editor State
    const [editingPoi, setEditingPoi] = useState<PointOfInterest | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const { cities: cityManifest } = useAdminData();

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch lista leggera anomalie (aumentato limit per avere più dati su cui filtrare)
            const rawAnomalies = await getAnomalies(500); 
            setAnomalies(rawAnomalies);

            if (rawAnomalies.length > 0) {
                // 2. Ottimizzazione: Se c'è un filtro città attivo, carica solo i POI di quella città
                let relevantPois: PointOfInterest[] = [];
                
                if (geoFilter.city) {
                    const cityPois = await getPoisByCityId(geoFilter.city);
                    relevantPois = cityPois.filter(p => rawAnomalies.some(a => a.id === p.id));
                } else {
                    const uniqueCityIds = Array.from(new Set(rawAnomalies.map(a => a.city_id)));
                    const poisData = await getPoisByCityIds(uniqueCityIds);
                    relevantPois = poisData.filter(p => rawAnomalies.some(a => a.id === p.id));
                }

                setFullPois(relevantPois);
            } else {
                setFullPois([]);
            }

        } catch (e) {
            console.error("Errore caricamento anomalie:", e);
        } finally {
            setLoading(false);
        }
    };

    // Ricarica quando cambia il filtro città per ottimizzare la fetch
    useEffect(() => {
        loadData();
    }, [geoFilter.city]);

    // Logica di filtro combinata (Tipo Anomalia + Geografia + Stati)
    const filteredItems = useMemo(() => {
        return fullPois.filter(poi => {
            // 1. FILTRO TIPO ANOMALIA (Tasti Rapidi)
            if (filterType !== 'all') {
                if (filterType === 'no_gps' && (poi.coords.lat !== 0 && poi.coords.lng !== 0)) return false;
                if (filterType === 'no_image' && poi.imageUrl) return false;
                if (filterType === 'low_trust' && poi.aiReliability !== 'low') return false;
                
                if (filterType === 'suspicious_hours') {
                    const analysis = analyzeSchedule(poi);
                    if (!analysis.isSuspicious) return false;
                }
            }
            
            // 2. FILTRO SOSPETTO ORARI (Dettagliato)
            // Se sono attivi filtri specifici sugli orari, verifica che l'analisi corrisponda
            if (suspicionTypeFilter.length > 0) {
                 const analysis = analyzeSchedule(poi);
                 
                 // Se non è sospetto, scartalo (stiamo filtrando per sospetti)
                 if (!analysis.isSuspicious && !suspicionTypeFilter.includes('estimated')) return false;

                 // Controllo match specifico
                 const reason = analysis.suspicionReason?.toLowerCase() || '';
                 const matches = suspicionTypeFilter.some(type => {
                     if (type === 'monday_open') return reason.includes('lunedì');
                     if (type === 'weekend_closed') return reason.includes('weekend');
                     if (type === 'missing_hours') return reason.includes('mancanti');
                     if (type === 'always_open') return reason.includes('7/7');
                     if (type === 'estimated') return poi.openingHours?.isEstimated;
                     return false;
                 });
                 
                 if (!matches) return false;
            }
            
            // 3. FILTRO GEOGRAFICO
            const cityData = cityManifest.find(c => c.id === poi.cityId);
            
            if (geoFilter.city && poi.cityId !== geoFilter.city) return false;
            
            if (geoFilter.continent || geoFilter.nation || geoFilter.region || geoFilter.zone) {
                if (!cityData) return false;
                if (geoFilter.zone && cityData.zone !== geoFilter.zone) return false;
                if (geoFilter.region && cityData.adminRegion !== geoFilter.region) return false;
                if (geoFilter.nation && cityData.nation !== geoFilter.nation) return false;
                if (geoFilter.continent && cityData.continent !== geoFilter.continent) return false;
            }
            
            // 4. FILTRO STATO POI
            if (poiStatusFilter !== 'all') {
                const pStatus = poi.status || 'published';
                if (pStatus !== poiStatusFilter) return false;
            }

            // 5. FILTRO STATO CITTÀ
            if (cityStatusFilter !== 'all') {
                if (!cityData) return false;
                
                if (cityStatusFilter === 'published') {
                    if (cityData.status !== 'published') return false;
                } else if (cityStatusFilter === 'draft') {
                    const isDraft = cityData.status !== 'published' && cityData.status !== 'restored' && cityData.hasGeneratedContent;
                    if (!isDraft) return false;
                } else if (cityStatusFilter === 'missing') {
                    const isMissing = cityData.status !== 'published' && cityData.status !== 'restored' && !cityData.hasGeneratedContent;
                    if (!isMissing) return false;
                }
            }
            
            return true;
        });
    }, [fullPois, filterType, geoFilter, cityStatusFilter, poiStatusFilter, suspicionTypeFilter, cityManifest]);

    const handleEdit = (poi: PointOfInterest) => {
        setEditingPoi(poi);
        setIsEditorOpen(true);
    };

    const handleSave = async (updatedPoi: PointOfInterest) => {
        if (!updatedPoi.cityId) { alert("Errore critico: ID Città mancante."); return; }
        setIsSaving(true);
        try {
            await saveSinglePoi(updatedPoi, updatedPoi.cityId);
            setIsEditorOpen(false);
            setEditingPoi(null);
            await loadData();
        } catch (e) {
            alert("Errore salvataggio.");
        } finally {
            setIsSaving(false);
        }
    };

    const getCityNameForPoi = (poi: PointOfInterest) => {
        const city = cityManifest.find(c => c.id === poi.cityId);
        return city?.name || "Sconosciuta";
    };

    const AnomalyBadge = ({ type }: { type: string }) => {
        switch(type) {
            case 'no_gps': return <span className="text-[9px] font-black uppercase bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1"><MapPinOff className="w-3 h-3"/> No GPS</span>;
            case 'missing_image': return <span className="text-[9px] font-black uppercase bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1"><ImageOff className="w-3 h-3"/> No Foto</span>;
            case 'low_reliability': return <span className="text-[9px] font-black uppercase bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Low Trust</span>;
            case 'short_desc': return <span className="text-[9px] font-black uppercase bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1">Testo Breve</span>;
            default: return <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Check</span>;
        }
    };
    
    const activeFilterLabel = geoFilter.city 
        ? `Città: ${getCityNameForPoi({ cityId: geoFilter.city } as any)}` 
        : geoFilter.zone 
            ? `Zona: ${geoFilter.zone}` 
            : `Filtri Attivi`;

    return (
        <div className="flex flex-col h-full space-y-6">
            
            {/* MODALI */}
            {isEditorOpen && editingPoi && (
                <AdminPoiModal isOpen={true} onClose={() => setIsEditorOpen(false)} onSave={handleSave} poi={editingPoi} cityName={getCityNameForPoi(editingPoi)} />
            )}
            
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-900/20 rounded-lg text-red-500 border border-red-500/20"><AlertTriangle className="w-6 h-6"/></div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">Ispettore Anomalie</h3>
                        <p className="text-xs text-slate-400 font-medium">{isSaving ? 'Salvataggio...' : `Rilevati ${anomalies.length} problemi totali`}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                    
                    {/* FILTRO AVANZATO DRAWER TRIGGER */}
                    <button 
                        onClick={onOpenFilter}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        <Filter className="w-3.5 h-3.5"/> 
                        {activeFiltersCount > 0 ? activeFilterLabel : 'Filtri Avanzati'}
                        {activeFiltersCount > 0 && <span className="bg-white text-indigo-600 px-1.5 rounded-full text-[9px] min-w-[1.2rem] text-center ml-1">{activeFiltersCount}</span>}
                    </button>

                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
                         <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Tutti</button>
                         <button onClick={() => setFilterType('no_gps')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'no_gps' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}><MapPinOff className="w-3 h-3"/> No GPS</button>
                         <button onClick={() => setFilterType('no_image')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'no_image' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}><ImageOff className="w-3 h-3"/> No Foto</button>
                         <button onClick={() => setFilterType('suspicious_hours')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'suspicious_hours' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}><Clock className="w-3 h-3"/> Orari</button>
                    </div>
                    
                    <button onClick={loadData} disabled={loading || isSaving} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading || isSaving ? 'animate-spin' : ''}`}/>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT: SPLIT VIEW */}
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                <div className="p-3 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Lista Priorità ({filteredItems.length})
                    </h4>
                    {activeFiltersCount > 0 && <span className="text-[9px] text-indigo-400 font-bold uppercase flex items-center gap-1"><Filter className="w-3 h-3"/> Filtro Attivo</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/>
                            <span className="text-xs text-slate-500 font-bold uppercase">Analisi DB in corso...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-20 text-center text-slate-500 italic text-sm border border-dashed border-slate-800 rounded-xl m-4 flex flex-col items-center gap-2">
                            <CheckCircle className="w-8 h-8 text-emerald-500 opacity-50"/>
                            <div>Nessuna anomalia trovata con i filtri attuali.</div>
                        </div>
                    ) : (
                        filteredItems.map(poi => {
                            const anomalyRecord = anomalies.find(a => a.id === poi.id);
                            const anomalyType = anomalyRecord?.anomaly_type || 'unknown';
                            const cityName = getCityNameForPoi(poi);

                            return (
                                <div key={poi.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all group flex gap-3 cursor-pointer relative overflow-hidden" onClick={() => handleEdit(poi)}>
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-black relative">
                                        <ImageWithFallback src={poi.imageUrl} className="w-full h-full object-cover opacity-80" alt={poi.name}/>
                                        {anomalyType === 'missing_image' && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><ImageOff className="w-6 h-6 text-orange-500"/></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-white truncate pr-2">{poi.name}</h4>
                                            <AnomalyBadge type={anomalyType}/>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{poi.address || 'Indirizzo mancante'}</p>
                                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-900/10 px-1.5 rounded border border-indigo-500/20">{cityName}</span>
                                        </div>
                                        
                                        <ScheduleMatrix poi={poi} compact={true} />
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:scale-110 transition-transform">
                                            <Edit3 className="w-4 h-4"/>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
