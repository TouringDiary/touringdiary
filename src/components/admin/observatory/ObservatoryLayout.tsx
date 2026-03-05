
import React, { useState, useEffect } from 'react';
import { Microscope, BarChart3, AlertOctagon, Copy, Loader2, RefreshCw } from 'lucide-react';
import { ObservatoryLegend } from './ObservatoryLegend';
import { CityStatsGrid } from './CityStatsGrid';
import { AnomalyInspector } from './AnomalyInspector'; 
import { DuplicateResolver } from './DuplicateResolver'; 
import { getObservatoryStats, getCityQualityMetrics } from '../../../services/observatoryService';
import { ObservatoryStats, CityQualityStats } from '../../../types/index';
import { useAdminData } from '../../../hooks/useAdminData'; 
import { ObservatoryFilterDrawer } from './ObservatoryFilterDrawer';

export const ObservatoryLayout = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'duplicates'>('overview');
    const [stats, setStats] = useState<ObservatoryStats | null>(null);
    const [cityMetrics, setCityMetrics] = useState<CityQualityStats[]>([]);
    const [loading, setLoading] = useState(true);
    
    // --- SHARED FILTER STATE ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [geoFilter, setGeoFilter] = useState({ continent: '', nation: '', region: '', zone: '', city: '' });
    const [cityStatusFilter, setCityStatusFilter] = useState('all');
    const [poiStatusFilter, setPoiStatusFilter] = useState('all');
    const [minQualityFilter, setMinQualityFilter] = useState(0);
    const [suspicionTypeFilter, setSuspicionTypeFilter] = useState<string[]>([]);
    
    const { cities: cityManifest } = useAdminData();

    const loadStats = async () => {
        setLoading(true);
        try {
            const statsPromise = getObservatoryStats().catch(e => null);
            const metricsPromise = getCityQualityMetrics().catch(e => []);
            
            const [aggStats, cityStats] = await Promise.all([statsPromise, metricsPromise]);
            
            setStats(aggStats);
            setCityMetrics(cityStats || []);
        } catch (e) {
            console.error("Critical error in Observatory load:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const activeFiltersCount = 
        Object.values(geoFilter).filter(Boolean).length + 
        (cityStatusFilter !== 'all' ? 1 : 0) + 
        (poiStatusFilter !== 'all' ? 1 : 0) +
        (minQualityFilter > 0 ? 1 : 0) +
        suspicionTypeFilter.length;

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in relative">
            
            {/* SHARED FILTER DRAWER */}
            <ObservatoryFilterDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                cities={cityManifest}
                geoFilter={geoFilter} setGeoFilter={setGeoFilter}
                cityStatus={cityStatusFilter} setCityStatus={setCityStatusFilter}
                poiStatus={poiStatusFilter} setPoiStatus={setPoiStatusFilter}
                minQuality={minQualityFilter} setMinQuality={setMinQualityFilter}
                suspicionTypes={suspicionTypeFilter} setSuspicionTypes={setSuspicionTypeFilter}
                activeTab={activeTab}
            />

            {/* HEADER */}
            <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-600 rounded-xl shadow-lg">
                        <Microscope className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-display">Osservatorio Dati</h2>
                        <p className="text-slate-400 text-sm">Analisi qualità, anomalie e integrità del database</p>
                    </div>
                </div>
                <button 
                    onClick={loadStats} 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                    title="Aggiorna Statistiche"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
                </button>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit shrink-0 gap-1 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <BarChart3 className="w-4 h-4"/> Panoramica
                </button>
                <button 
                    onClick={() => setActiveTab('anomalies')} 
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'anomalies' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <AlertOctagon className="w-4 h-4"/> Anomalie
                    {stats && stats.anomalies_total > 0 && <span className="bg-white text-red-600 px-1.5 rounded text-[9px]">{stats.anomalies_total}</span>}
                </button>
                <button 
                    onClick={() => setActiveTab('duplicates')} 
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'duplicates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <Copy className="w-4 h-4"/> Deduplica
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                
                {loading && activeTab === 'overview' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <Loader2 className="w-10 h-10 animate-spin text-cyan-500"/>
                        <p className="text-xs font-bold uppercase tracking-widest">Analisi Database in corso...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col gap-6 h-full">
                        
                        {activeTab === 'overview' && (
                            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                                {/* CARDS TOTALI */}
                                {stats && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 shrink-0">
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center gap-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">Totale Città</span>
                                            <span className="text-3xl font-display font-bold text-white">{stats.total_cities}</span>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center gap-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">Totale POI</span>
                                            <span className="text-3xl font-display font-bold text-white">{stats.total_pois}</span>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center gap-1">
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest truncate">Bozze Pendenti</span>
                                            <span className="text-3xl font-display font-bold text-amber-400">{stats.draft_pois}</span>
                                        </div>
                                        <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20 flex flex-col justify-center gap-1">
                                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest truncate">Problemi GPS (0,0)</span>
                                            <span className="text-3xl font-display font-bold text-white">{stats.missing_gps}</span>
                                        </div>
                                        <div className="bg-orange-900/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-center gap-1">
                                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest truncate">Foto Mancanti</span>
                                            <span className="text-3xl font-display font-bold text-white">{stats.missing_images}</span>
                                        </div>
                                    </div>
                                )}

                                {/* GRIGLIA MACRO */}
                                <div className="flex-1 min-h-0">
                                     {cityMetrics.length > 0 ? (
                                         <CityStatsGrid 
                                            data={cityMetrics} 
                                            geoFilter={geoFilter}
                                            cityStatusFilter={cityStatusFilter}
                                            minQualityFilter={minQualityFilter}
                                            activeFiltersCount={activeFiltersCount}
                                            onOpenFilter={() => setIsDrawerOpen(true)}
                                         />
                                     ) : (
                                         <div className="flex items-center justify-center h-full text-slate-500 italic bg-slate-900/50 rounded-2xl border border-slate-800">
                                             Nessun dato città disponibile. Verifica la connessione o esegui lo script SQL.
                                         </div>
                                     )}
                                </div>
                                
                                {/* LEGENDA */}
                                <div className="shrink-0 h-32">
                                     <ObservatoryLegend activeTab="overview" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'anomalies' && (
                            <div className="flex-1 flex gap-6 overflow-hidden">
                                <div className="flex-1 min-h-0">
                                    <AnomalyInspector 
                                        geoFilter={geoFilter}
                                        cityStatusFilter={cityStatusFilter}
                                        poiStatusFilter={poiStatusFilter}
                                        suspicionTypeFilter={suspicionTypeFilter}
                                        activeFiltersCount={activeFiltersCount}
                                        onOpenFilter={() => setIsDrawerOpen(true)}
                                    />
                                </div>
                                <div className="w-72 shrink-0 hidden xl:block">
                                    <ObservatoryLegend activeTab="anomalies" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'duplicates' && (
                            <DuplicateResolver 
                                cityManifest={cityManifest} 
                                geoFilter={geoFilter}
                                cityStatusFilter={cityStatusFilter}
                                activeFiltersCount={activeFiltersCount}
                                onOpenFilter={() => setIsDrawerOpen(true)}
                            />
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};
