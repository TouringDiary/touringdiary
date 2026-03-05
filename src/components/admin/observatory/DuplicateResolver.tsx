
import React, { useState, useMemo } from 'react';
import { RefreshCw, ArrowRight, ArrowLeft, XCircle, CheckCircle, Search, AlertTriangle, GitMerge, MapPin, Filter, Layers } from 'lucide-react';
import { CitySummary, PointOfInterest } from '../../../types/index';
import { useDuplicateFinder, DuplicatePair } from '../../../hooks/admin/useDuplicateFinder';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Loader2 } from 'lucide-react';

interface DuplicateResolverProps {
    cityManifest: CitySummary[];
    geoFilter: { continent: string, nation: string, region: string, zone: string, city: string };
    cityStatusFilter: string;
    activeFiltersCount: number;
    onOpenFilter: () => void;
}

const PoiCardMini = ({ poi, label, colorClass }: { poi: PointOfInterest, label: string, colorClass: string }) => (
    <div className={`p-4 rounded-xl border-2 flex flex-col gap-3 h-full relative ${colorClass} bg-slate-900/50`}>
        <div className="absolute top-0 right-0 bg-slate-900 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest border-b border-l border-inherit">
            {label}
        </div>
        
        <div className="flex gap-4">
             <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black">
                 <ImageWithFallback src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover"/>
             </div>
             <div className="min-w-0 flex-1">
                 <h4 className="font-bold text-white text-sm truncate" title={poi.name}>{poi.name}</h4>
                 <div className="text-[10px] text-slate-400 mt-1 flex flex-col gap-0.5">
                     <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {poi.address || 'No Indirizzo'}</span>
                     <span className="font-mono opacity-70">{poi.coords.lat.toFixed(5)}, {poi.coords.lng.toFixed(5)}</span>
                 </div>
             </div>
        </div>
        
        <div className="text-[10px] text-slate-500 line-clamp-2 italic border-l-2 border-slate-700 pl-2">
            {poi.description || "Nessuna descrizione"}
        </div>
        
        {/* Chips */}
        <div className="flex gap-2 mt-auto">
             <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-bold uppercase text-slate-400">{poi.category}</span>
             <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-bold uppercase text-slate-400">{poi.status || 'pub'}</span>
        </div>
    </div>
);

export const DuplicateResolver = ({ 
    cityManifest, 
    geoFilter, cityStatusFilter, activeFiltersCount, onOpenFilter 
}: DuplicateResolverProps) => {
    
    // FILTRAGGIO CITTÀ NEL DROPDOWN
    const filteredManifest = useMemo(() => {
        let list = cityManifest;
        
        // Geo
        if (geoFilter.continent) list = list.filter(c => c.continent === geoFilter.continent);
        if (geoFilter.nation) list = list.filter(c => c.nation === geoFilter.nation);
        if (geoFilter.region) list = list.filter(c => c.adminRegion === geoFilter.region);
        if (geoFilter.zone) list = list.filter(c => c.zone === geoFilter.zone);
        
        // Status
        if (cityStatusFilter !== 'all') {
            if (cityStatusFilter === 'published') list = list.filter(c => c.status === 'published');
            else if (cityStatusFilter === 'draft') list = list.filter(c => c.status === 'draft' || c.status === 'needs_check');
            else if (cityStatusFilter === 'missing') list = list.filter(c => !c.hasGeneratedContent && c.status !== 'published');
        }
        
        return list.sort((a,b) => a.name.localeCompare(b.name));
    }, [cityManifest, geoFilter, cityStatusFilter]);

    const { 
        selectedCityId, setSelectedCityId, isScanning, scanProgress, 
        duplicates, isMerging, scanCity, handleMerge, handleIgnore 
    } = useDuplicateFinder(filteredManifest); // Passiamo la lista filtrata, anche se l'hook non la usa direttamente per logica, ma potrebbe

    // Mostra solo la prima coppia per volta (Queue Mode)
    const currentPair = duplicates[0];
    const isLoadingManifest = !cityManifest || cityManifest.length === 0;

    return (
        <div className="h-full flex flex-col animate-in fade-in">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg shrink-0 mb-6">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Seleziona Città ({filteredManifest.length})
                    </label>
                    <select 
                        value={selectedCityId} 
                        onChange={(e) => setSelectedCityId(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                        disabled={isLoadingManifest}
                    >
                        <option value="">{isLoadingManifest ? 'Caricamento...' : '-- Seleziona --'}</option>
                        {filteredManifest.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-end gap-3">
                    <button 
                        onClick={onOpenFilter}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        <Filter className="w-3.5 h-3.5"/> 
                        Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </button>

                    <button 
                        onClick={() => scanCity(selectedCityId)} 
                        disabled={!selectedCityId || isScanning}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold uppercase text-xs shadow-lg flex items-center gap-2 transition-all w-full md:w-auto justify-center"
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                        {isScanning ? `Scansione ${scanProgress}%` : 'Cerca Duplicati'}
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col">
                
                {!isScanning && duplicates.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <CheckCircle className="w-16 h-16 opacity-20 text-emerald-500"/>
                        <p className="text-sm font-medium">Nessun duplicato rilevato.</p>
                        <p className="text-xs opacity-70">Seleziona una città e avvia la scansione.</p>
                    </div>
                ) : !currentPair ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500"/>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* MATCH INFO HEADER */}
                        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500"/> Possibile Duplicato ({duplicates.length} rimanenti)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Score Similarità: <span className="text-amber-400 font-bold">{Math.round(currentPair.score)}%</span> • {currentPair.reasons.join(', ')}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleIgnore(currentPair.id)} 
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase"
                            >
                                Ignora (Sono Diversi)
                            </button>
                        </div>

                        {/* SPLIT VIEW */}
                        <div className="flex-1 flex flex-col lg:flex-row p-6 gap-8 items-center justify-center overflow-y-auto">
                            
                            {/* POI A */}
                            <div className="w-full lg:w-[45%]">
                                <PoiCardMini poi={currentPair.poiA} label="POI A (Originale?)" colorClass="border-blue-500/30" />
                            </div>

                            {/* ACTION COLUMN */}
                            <div className="flex flex-col gap-4 shrink-0 z-10">
                                <button 
                                    onClick={() => handleMerge(currentPair.poiA, currentPair.poiB, currentPair.id)}
                                    disabled={isMerging}
                                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    title="Mantieni A, Fondi B in A"
                                >
                                    <ArrowLeft className="w-6 h-6"/>
                                </button>
                                
                                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <GitMerge className="w-5 h-5 text-slate-500"/>
                                </div>

                                <button 
                                    onClick={() => handleMerge(currentPair.poiB, currentPair.poiA, currentPair.id)}
                                    disabled={isMerging}
                                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    title="Mantieni B, Fondi A in B"
                                >
                                    <ArrowRight className="w-6 h-6"/>
                                </button>
                            </div>

                            {/* POI B */}
                            <div className="w-full lg:w-[45%]">
                                <PoiCardMini poi={currentPair.poiB} label="POI B (Nuovo?)" colorClass="border-emerald-500/30" />
                            </div>

                        </div>
                        
                        {/* FOOTER INFO MERGE */}
                        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
                            <p>Il "Merge" sposterà foto e recensioni sull'elemento mantenuto e cancellerà l'altro. I campi vuoti verranno riempiti.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
