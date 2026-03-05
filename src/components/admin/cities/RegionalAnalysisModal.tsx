import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, CheckCircle, Database, Plus, Check, Brain, Globe, CheckSquare, Square, Terminal, Microscope, TrendingUp, AlertTriangle, Sliders, Info, ScanSearch, MapPin, Utensils, Bed, ShoppingBag, Music, Sun, RefreshCw, Layers, PauseCircle } from 'lucide-react';

import { generateRegionalAnalysis, generateZoneAnalysis } from '../../../services/ai/generators/cityContentGenerator';
import { suggestNewPois, verifyPoisBatch } from '../../../services/ai/generators/poiGenerator';

import { importRegionalData } from '../../../services/city/cityLifecycleService';
import { saveSinglePoi } from '../../../services/city/poi/poiWrite';
import { getFullManifestAsync } from '../../../services/city/cityReadService';

import { AiZoneSuggestion, PointOfInterest } from '../../../types/index';
import { formatVisitors } from '../../../utils/common';
import { getCorrectCategory } from '../../../services/ai/utils/taxonomyUtils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    regionName: string;
    existingZones: string[];
    existingCityNames: string[];
    onSuccess: () => void;
    onMagicGenerate?: (name: string, poiCount: number) => void;
    targetZone?: string; 
}

const CATEGORY_CONFIGS = [
    { id: 'monument', label: 'Destinazioni', icon: MapPin, color: 'text-violet-400', default: 5 },
    { id: 'food', label: 'Sapori', icon: Utensils, color: 'text-orange-400', default: 5 },
    { id: 'nature', label: 'Natura', icon: Sun, color: 'text-emerald-400', default: 5 },
    { id: 'hotel', label: 'Alloggi', icon: Bed, color: 'text-blue-400', default: 5 },
    { id: 'shop', label: 'Shopping', icon: ShoppingBag, color: 'text-pink-400', default: 5 },
    { id: 'leisure', label: 'Svago', icon: Music, color: 'text-cyan-400', default: 5 },
];

export const RegionalAnalysisModal = ({ isOpen, onClose, regionName, existingZones, existingCityNames, onSuccess, onMagicGenerate, targetZone }: Props) => {
    const [step, setStep] = useState<'config' | 'analyzing' | 'review' | 'importing' | 'enriching' | 'success'>('config');
    const [analysisResult, setAnalysisResult] = useState<AiZoneSuggestion[]>([]);
    
    // Config State
    const [minVisitors, setMinVisitors] = useState<number>(50000); 
    
    // Global Count State (DEFAULT 0)
    const [globalCount, setGlobalCount] = useState<number>(0);

    // Initial state all 0
    const [poiCounts, setPoiCounts] = useState<Record<string, number>>({
        monument: 0, food: 0, nature: 0, hotel: 0, shop: 0, leisure: 0
    });

    const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
    const [importedStats, setImportedStats] = useState({ zones: 0, cities: 0, pois: 0 });
    const [importLogs, setImportLogs] = useState<string[]>([]);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    
    // ERROR STATE
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const [enrichProgress, setEnrichProgress] = useState({ 
        currentCityIndex: 0, 
        totalCities: 0, 
        currentCityName: '',
        currentCategory: '',
        poisFoundInCat: 0
    });
    
    const [dbCitiesMap, setDbCitiesMap] = useState<Map<string, { id: string, visitors: number }>>(new Map());

    useEffect(() => {
        if (isOpen) {
            setStep('config');
            setErrorMsg(null);
            setIsQuotaExceeded(false);
            // Reset counts to default 0
            setGlobalCount(0);
            setPoiCounts({
                monument: 0, food: 0, nature: 0, hotel: 0, shop: 0, leisure: 0
            });
            
            // INTELLIGENT DEFAULT THRESHOLD
            if (targetZone) {
                setMinVisitors(5000); // 5k per Micro
            } else {
                setMinVisitors(50000); // 50k per Macro Regionale
            }

            getFullManifestAsync().then(cities => {
                const map = new Map<string, { id: string, visitors: number }>();
                cities.forEach(c => {
                    if (c && c.name) {
                        map.set(c.name.toLowerCase().trim(), { id: c.id, visitors: c.visitors || 0 });
                    }
                });
                setDbCitiesMap(map);
            });
        }
    }, [isOpen, targetZone]);

    const handlePoiCountChange = (catId: string, val: number) => {
        setPoiCounts(prev => ({ ...prev, [catId]: val }));
    };

    const handleGlobalCountChange = (val: number) => {
        setGlobalCount(val);
        const newCounts: Record<string, number> = {};
        CATEGORY_CONFIGS.forEach(cat => {
            newCounts[cat.id] = val;
        });
        setPoiCounts(newCounts);
    };

    const runAnalysis = async () => {
        setStep('analyzing');
        setErrorMsg(null);
        const mapToUse = dbCitiesMap;
        try {
            let result;
            if (targetZone) {
                // Micro Analisi (Zona specifica)
                result = await generateZoneAnalysis(targetZone, regionName, [], minVisitors);
            } else {
                // Macro Analisi (Regione intera)
                result = await generateRegionalAnalysis(regionName, existingZones, minVisitors);
            }

            if (result && result.zones && result.zones.length > 0) {
                setAnalysisResult(result.zones);
                const initialSelected = new Set<string>();
                let autoUpdateCount = 0;

                result.zones.forEach(z => {
                    if (!z.mainCities) return;
                    
                    z.mainCities.forEach(c => {
                        if (!c || !c.name) return;
                        
                        const dbEntry = mapToUse.get(c.name.toLowerCase().trim());
                        if (!dbEntry) {
                            initialSelected.add(c.name);
                        } else if (dbEntry.visitors === 0 && c.visitors > 0) {
                            initialSelected.add(c.name);
                            autoUpdateCount++;
                        }
                    });
                });
                
                setSelectedCities(initialSelected);
                setStep('review');
            } else {
                // Gestione errore strutturato
                setErrorMsg("L'AI ha restituito un risultato vuoto. Prova ad abbassare la soglia visitatori o cambia zona.");
                setStep('config');
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg(`Errore AI: ${e.message}`);
            setStep('config');
        }
    };

    const toggleCitySelection = (cityName: string) => {
        const newSet = new Set(selectedCities);
        if (newSet.has(cityName)) newSet.delete(cityName);
        else newSet.add(cityName);
        setSelectedCities(newSet);
    };

    const toggleSelectAll = () => {
        const allCitiesInResult = new Set<string>();
        analysisResult.forEach(z => {
            z.mainCities.forEach(c => {
                if (c && c.name) allCitiesInResult.add(c.name);
            });
        });

        if (selectedCities.size === allCitiesInResult.size) {
            setSelectedCities(new Set());
        } else {
            setSelectedCities(allCitiesInResult);
        }
    };

    const areAllSelected = useMemo(() => {
        let total = 0;
        analysisResult.forEach(z => {
            total += (z.mainCities?.length || 0);
        });
        return total > 0 && selectedCities.size === total;
    }, [analysisResult, selectedCities]);

    const handleImport = async () => {
        if (selectedCities.size === 0) {
            alert("Seleziona almeno una città da importare.");
            return;
        }
        
        setStep('importing');
        setIsQuotaExceeded(false);

        try {
            const selectedList = Array.from<string>(selectedCities);
            
            // FASE 1: CREAZIONE STRUTTURA
            const stats = await importRegionalData(analysisResult, selectedList, regionName);
            
            setImportLogs(prev => [...prev, ...stats.logs]);
            
            // FASE 2: ARR-ICCHIMENTO POI (LOGICA HUNTER TOP-TIER)
            const itemsToProcess = stats.createdItems || [];
            
            const hasCounts = Object.values(poiCounts).some((c: number) => c > 0);
            
            if (itemsToProcess.length > 0 && hasCounts) {
                setStep('enriching');
                setEnrichProgress({ currentCityIndex: 0, totalCities: itemsToProcess.length, currentCityName: '', currentCategory: '', poisFoundInCat: 0 });
                
                let totalPoisFound = 0;
                let quotaHit = false; 

                for (let i = 0; i < itemsToProcess.length; i++) {
                    if (quotaHit) break;

                    const cityItem = itemsToProcess[i];
                    
                    setEnrichProgress(prev => ({ ...prev, currentCityIndex: i + 1, currentCityName: cityItem.name }));
                    setImportLogs(prev => [...prev, `[Enrichment] Avvio "Hunter Top-Tier" per: ${cityItem.name}`]);

                    try {
                        for (const cat of CATEGORY_CONFIGS) {
                            if (quotaHit) break;

                            const countNeeded = poiCounts[cat.id] || 0;
                            if (countNeeded <= 0) continue;

                            setEnrichProgress(prev => ({ ...prev, currentCategory: cat.label, poisFoundInCat: 0 }));

                            let highQualitySaved = 0;
                            let attempt = 0;
                            const maxAttempts = 2; 
                            
                            let sessionExclusions: string[] = []; 

                            while (highQualitySaved < countNeeded && attempt < maxAttempts) {
                                attempt++;
                                await new Promise(r => setTimeout(r, 2000));
                                
                                const searchBatchSize = Math.max(4, countNeeded - highQualitySaved + 2); 
                                
                                if (attempt > 1) {
                                    setImportLogs(prev => [...prev, `[${cityItem.name}] ${cat.label}: Trovati solo ${highQualitySaved}/${countNeeded} Top. Avvio tentativo ${attempt}...`]);
                                }

                                try {
                                    const rawPois = await suggestNewPois(
                                        cityItem.name, 
                                        sessionExclusions, 
                                        `Trova i luoghi PIÙ IMPORTANTI e FAMOSI per la categoria '${cat.label}'.`, 
                                        searchBatchSize, 
                                        cat.id
                                    );

                                    if (!rawPois || rawPois.length === 0) break;

                                    sessionExclusions = [...sessionExclusions, ...rawPois.map((p: any) => p.name)];

                                    const verifiedPois = await verifyPoisBatch(
                                        rawPois, 
                                        cityItem.name, 
                                        { lat: 0, lng: 0 } 
                                    );

                                    let batchSavedCount = 0;
                                    let discardedCount = 0;

                                    for (const verified of verifiedPois) {
                                        if (verified.status === 'invalid' || verified.status === 'duplicate') {
                                            discardedCount++;
                                            continue;
                                        }

                                        if (verified.tourismInterest !== 'high') {
                                            discardedCount++;
                                            continue;
                                        }
                                        
                                        const hasCoords = verified.coords && verified.coords.lat !== 0;
                                        if (!hasCoords) {
                                            discardedCount++;
                                            continue;
                                        }
                                        
                                        const correctCategory = getCorrectCategory(verified.subCategory || 'generic', verified.category || cat.id, verified.name);
                                        
                                        const newPoi: PointOfInterest = {
                                            id: `top_tier_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                                            name: verified.name,
                                            category: correctCategory as any,
                                            subCategory: verified.subCategory, 
                                            description: verified.description || `Eccellenza verificata per ${cat.label}`,
                                            imageUrl: '', 
                                            coords: verified.coords,
                                            rating: 0, votes: 0,
                                            address: verified.address || `${cityItem.name}, Italia`,
                                            cityId: cityItem.id,
                                            status: 'draft', 
                                            dateAdded: new Date().toISOString(),
                                            aiReliability: 'high', 
                                            tourismInterest: 'high',
                                            priceLevel: verified.priceLevel || 2,
                                            openingHours: {
                                                days: verified.openingDays || ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
                                                morning: verified.openingHours || "09:00 - 20:00",
                                                afternoon: "",
                                                isEstimated: verified.isEstimated
                                            },
                                            lastVerified: new Date().toISOString()
                                        };
                                        
                                        await saveSinglePoi(newPoi, cityItem.id);
                                        batchSavedCount++;
                                        totalPoisFound++;
                                    }
                                    
                                    highQualitySaved += batchSavedCount;
                                    setEnrichProgress(prev => ({ ...prev, poisFoundInCat: highQualitySaved }));

                                    if (highQualitySaved >= countNeeded) {
                                        break;
                                    }

                                } catch (innerError: any) {
                                    const errMsg = innerError.message || JSON.stringify(innerError);
                                    if (errMsg.includes('429') || errMsg.includes('QUOTA') || errMsg.includes('RESOURCE_EXHAUSTED')) {
                                        console.warn("QUOTA EXCEEDED DURING LOOP");
                                        setImportLogs(prev => [...prev, `⚠️ Quota API Esaurita. Salvataggio parziale e stop.`]);
                                        setIsQuotaExceeded(true);
                                        quotaHit = true; 
                                        break; 
                                    }
                                    throw innerError; 
                                }
                            }
                            
                            if (!quotaHit) await new Promise(r => setTimeout(r, 4000));
                        }

                    } catch (err) {
                        console.error(`Errore enrichment per ${cityItem.name}`, err);
                        setImportLogs(prev => [...prev, `[Error] Fallita ricerca POI per ${cityItem.name}`]);
                    }
                    await new Promise(r => setTimeout(r, 1000)); 
                }
                
                setImportedStats({ zones: stats.createdZones, cities: stats.createdCities, pois: totalPoisFound });
            } else {
                setImportedStats({ zones: stats.createdZones, cities: stats.createdCities, pois: 0 });
            }

            setStep('success');
            
        } catch (e: any) {
            console.error(e);
            setErrorMsg(`Errore critico durante l'importazione: ${e.message || 'Sconosciuto'}`);
            setStep('review');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
                
                <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40">
                            {targetZone ? <Microscope className="w-6 h-6 text-white"/> : <Brain className="w-6 h-6 text-white"/>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
                                {targetZone ? 'Micro Analisi Zona' : 'Macro Intelligence'} <span className="text-slate-500">|</span> {targetZone || regionName}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Analisi Territoriale AI (Gemini Pro)</p>
                        </div>
                    </div>
                    {step !== 'importing' && step !== 'enriching' && (
                        <button onClick={() => { if(step==='success') onSuccess(); onClose(); }} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-6 h-6"/>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative">
                    
                    {step === 'config' && (
                        <div className="h-full overflow-y-auto custom-scrollbar p-8">
                            <div className="text-center space-y-2 mb-8">
                                <h4 className="text-2xl font-bold text-white">Configurazione Analisi</h4>
                                <p className="text-slate-400 max-w-md mx-auto text-sm">
                                    Definisci i criteri di ricerca per le città e quanti contenuti generare per ciascuna.
                                </p>
                            </div>

                            {/* ERROR MESSAGE BOX */}
                            {errorMsg && (
                                <div className="max-w-4xl mx-auto mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0"/>
                                    <div>
                                        <h5 className="text-red-400 font-bold uppercase text-xs mb-1">Errore Analisi</h5>
                                        <p className="text-red-200 text-sm leading-relaxed">{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl h-fit">
                                    <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-indigo-400"/> Filtri Territoriali
                                    </h5>
                                    <div className="mb-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                            Soglia Visitatori Annuali
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="500000" 
                                                step="1000" 
                                                value={minVisitors}
                                                onChange={(e) => setMinVisitors(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-mono font-bold w-28 text-center text-sm">
                                                {formatVisitors(minVisitors)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-lg flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/>
                                        <p className="text-xs text-indigo-200 leading-snug">
                                            L'AI cercherà solo città/borghi con affluenza stimata superiore a questa soglia.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                    <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-emerald-400"/> Densità Contenuti (Target TOP)
                                    </h5>
                                    <div className="mb-4 pb-4 border-b border-slate-800">
                                        <label className="text-[10px] text-indigo-300 font-black uppercase tracking-widest block mb-2">Impostazione Globale</label>
                                        <div className="flex items-center justify-between bg-indigo-900/20 p-2 rounded-lg border border-indigo-500/30">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-indigo-400"/>
                                                <span className="text-xs font-bold text-white uppercase">Tutte le Categorie</span>
                                            </div>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="20" 
                                                value={globalCount}
                                                onChange={(e) => handleGlobalCountChange(parseInt(e.target.value))}
                                                className="w-12 bg-slate-950 border border-indigo-500 rounded text-center text-white text-xs font-bold py-1 focus:border-indigo-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">POI minimi per categoria</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {CATEGORY_CONFIGS.map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <cat.icon className={`w-4 h-4 ${cat.color}`}/>
                                                    <span className="text-xs font-bold text-slate-300 uppercase">{cat.label}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="20" 
                                                        value={poiCounts[cat.id]}
                                                        onChange={(e) => handlePoiCountChange(cat.id, parseInt(e.target.value))}
                                                        className="w-12 bg-slate-950 border border-slate-700 rounded text-center text-white text-xs font-bold py-1 focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center mt-8">
                                <button 
                                    onClick={runAnalysis}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95"
                                >
                                    <Brain className="w-5 h-5"/> Avvia Scansione AI
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                <Globe className="w-24 h-24 text-indigo-400 animate-pulse relative z-10"/>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-white">
                                    {targetZone ? `Scansione Profonda: ${targetZone}` : 'Analisi Satellitare in Corso...'}
                                </h4>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Sto analizzando il territorio e calcolando le stime.
                                </p>
                            </div>
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="h-full flex flex-col">
                            {errorMsg && (
                                <div className="p-4 bg-red-900/20 border-b border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4"/> {errorMsg}
                                </div>
                            )}

                            <div className="p-4 bg-indigo-900/10 border-b border-indigo-500/20 flex justify-between items-center shrink-0">
                                <span className="text-xs text-indigo-300 font-medium">Seleziona le città da importare.</span>
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-xs font-bold text-slate-300"
                                >
                                    {areAllSelected ? <CheckSquare className="w-4 h-4 text-indigo-500"/> : <Square className="w-4 h-4"/>}
                                    {areAllSelected ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {analysisResult.map((zone, idx) => (
                                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-800/50">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">{zone.name}</h4>
                                                <p className="text-xs text-slate-400 italic">{zone.description}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {existingZones.includes(zone.name) ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Zona Esistente</span> : <span className="text-amber-500 flex items-center gap-1"><Plus className="w-3 h-3"/> Nuova Zona</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {zone.mainCities.map((city, cIdx) => {
                                                const normalizedName = city && city.name ? city.name.toLowerCase().trim() : '';
                                                const dbEntry = normalizedName ? dbCitiesMap.get(normalizedName) : undefined;
                                                const exists = !!dbEntry;
                                                const isSelected = selectedCities.has(city.name);
                                                const needsUpdate = exists && dbEntry.visitors === 0 && city.visitors > 0;
                                                
                                                if (!city.name) return null; 
                                                
                                                return (
                                                    <div 
                                                        key={cIdx} 
                                                        className={`p-3 rounded-xl border flex flex-col gap-2 relative transition-all group cursor-pointer ${exists ? 'bg-slate-900 border-slate-700 opacity-80' : isSelected ? 'bg-indigo-900/20 border-indigo-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                                        onClick={() => toggleCitySelection(city.name)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className={`font-bold text-sm block ${exists ? 'text-slate-300' : 'text-white'}`}>{city.name}</span>
                                                                {city.visitors > 0 && <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5"><TrendingUp className="w-2.5 h-2.5"/> ~{formatVisitors(city.visitors)}</span>}
                                                                {needsUpdate && <span className="text-[8px] text-amber-500 font-bold uppercase block mt-1 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5"/> STATS MANCANTI</span>}
                                                            </div>
                                                            {exists ? (
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : 'text-emerald-500'}`}>
                                                                    {isSelected ? <RefreshCw className="w-3 h-3 animate-pulse"/> : <Database className="w-4 h-4"/>}
                                                                </div>
                                                            ) : (
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white"/>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{city.reason}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                                <div className="text-xs text-slate-400">
                                    Selezionati: <strong className="text-white">{selectedCities.size}</strong> elementi
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep('config')} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-colors flex items-center gap-2">Indietro</button>
                                    <button 
                                        onClick={handleImport} 
                                        disabled={selectedCities.size === 0}
                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Database className="w-4 h-4"/> Importa e Arricchisci (Pro)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin"/>
                            <h3 className="text-xl font-bold text-white">Creazione Città...</h3>
                            <p className="text-slate-400 text-sm">Sto creando gli scheletri nel database.</p>
                        </div>
                    )}

                    {step === 'enriching' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-6 animate-in fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
                                <ScanSearch className="w-20 h-20 text-amber-500 animate-pulse relative z-10"/>
                            </div>
                            <div className="w-full max-w-md">
                                <h3 className="text-2xl font-bold text-white mb-2">Bonifica Dati (Top-Tier Hunter)</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    Città: <strong>{enrichProgress.currentCityName}</strong><br/>
                                    Sto cercando SOLO le eccellenze.
                                </p>
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">
                                        <span>Avanzamento</span>
                                        <span className="text-white">{enrichProgress.currentCityIndex} / {enrichProgress.totalCities}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 mb-4">
                                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(enrichProgress.currentCityIndex / enrichProgress.totalCities) * 100}%` }}></div>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center text-xs text-indigo-300 font-mono bg-slate-900/50 p-2 rounded-lg">
                                        <Loader2 className="w-3 h-3 animate-spin"/> 
                                        Cercando: {enrichProgress.currentCategory || 'Avvio...'} 
                                        {enrichProgress.poisFoundInCat > 0 && <span className="text-emerald-400">({enrichProgress.poisFoundInCat} TOP trovati)</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-6">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-2xl">
                                {isQuotaExceeded ? <PauseCircle className="w-12 h-12 text-amber-500"/> : <CheckCircle className="w-12 h-12 text-emerald-500"/>}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    {isQuotaExceeded ? 'Processo Interrotto (Quota)' : 'Audit & Enrichment Completato'}
                                </h3>
                                <p className="text-slate-300 text-lg">
                                    {isQuotaExceeded 
                                        ? `Abbiamo salvato ${importedStats.pois} POI prima che finisse la quota.`
                                        : `Importati con successo ${importedStats.pois} nuovi Punti di Interesse (Solo Top-Tier).`
                                    }
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    {isQuotaExceeded 
                                        ? "Riprova più tardi per completare le altre categorie."
                                        : "I dati sono stati normalizzati e classificati per affidabilità."
                                    }
                                </p>
                            </div>
                            <button onClick={onClose} className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-colors">
                                Chiudi
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};