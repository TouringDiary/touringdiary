
import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, AlertTriangle, Download, Database, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { performCityAudit } from '../../../services/ai/generators/poiGenerator';
import { saveSinglePoi, getPoisByCityId } from '../../../services/cityService';
import { AuditPoiResult, PointOfInterest } from '../../../types/index';
import { getCorrectCategory, resolveCategoryFromDict } from '../../../services/ai/utils/taxonomyUtils';
import { getTaxonomyDictionary } from '../../../services/taxonomyService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cityId: string;
    cityName: string;
}

// Helper locale per pulizia indirizzi
const cleanAddress = (addr: string, cityName: string): string => {
    if (!addr) return `${cityName}, Italia`;
    let clean = addr.trim();
    // Rimuovi nazione se ridondante
    clean = clean.replace(', Italia', '').replace(', Italy', '');
    // Rimuovi CAP se all'inizio
    clean = clean.replace(/^\d{5}\s+/, '');
    return clean;
};

export const CityAuditModal = ({ isOpen, onClose, cityId, cityName }: Props) => {
    const [step, setStep] = useState<'analyzing' | 'review' | 'success'>('analyzing');
    const [results, setResults] = useState<AuditPoiResult[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [importCount, setImportCount] = useState(0);
    const [existingPois, setExistingPois] = useState<PointOfInterest[]>([]);
    
    // Cache Tassonomia
    const [taxonomyDict, setTaxonomyDict] = useState<Record<string, { cat: string, sub: string }>>({});

    useEffect(() => {
        if (isOpen) {
            // 0. Pre-load taxonomy rules for enrichment
            getTaxonomyDictionary('poi').then(setTaxonomyDict);
            startAudit();
        }
    }, [isOpen]);

    const startAudit = async () => {
        setStep('analyzing');
        try {
            // 1. Fetch Existing Data (for fingerprinting)
            const dbPois = await getPoisByCityId(cityId);
            setExistingPois(dbPois);

            // 2. AI Audit
            const auditData = await performCityAudit(cityName, dbPois);
            setResults(auditData);
            
            // 3. Pre-select MISSING items only
            const initialSelection = new Set<number>();
            auditData.forEach((item, idx) => {
                if (item.matchStatus === 'missing') {
                    initialSelection.add(idx);
                }
            });
            setSelectedIndices(initialSelection);
            
            setStep('review');
        } catch (e) {
            console.error(e);
            alert("Errore audit: riprova.");
            onClose();
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const handleImport = async () => {
        const toImport = results.filter((_, idx) => selectedIndices.has(idx));
        if (toImport.length === 0) return;

        let count = 0;
        for (const item of toImport) {
            // --- FASE 4: DATA ENRICHMENT CORE ---
            
            // 1. Tassonomia Avanzata (DB Priority > Heuristic)
            // Cerca prima nel dizionario DB usando il nome o la categoria grezza
            const dbMatch = resolveCategoryFromDict(item.name, taxonomyDict) || resolveCategoryFromDict(item.category, taxonomyDict);
            
            let finalCategory = '';
            let finalSubCategory = '';

            if (dbMatch) {
                // Match Tassonomia DB trovato
                finalCategory = dbMatch.cat;
                finalSubCategory = dbMatch.sub;
            } else {
                // Fallback Euristico (Smart Guess)
                // Se l'AI ha dato una categoria generica (es. "museum"), proviamo a mapparla
                // getCorrectCategory usa regole statiche potenti
                finalCategory = getCorrectCategory(item.category, 'discovery', item.name); // Passiamo la "category" AI come subCategory hint
                
                // Se la categoria AI era specifica (es. museum), usiamola come subCategory
                if (finalCategory === 'monument' && ['museum', 'church', 'square'].includes(item.category)) {
                    finalSubCategory = item.category;
                }
            }

            // 2. Standardizzazione Indirizzo
            const standardizedAddress = cleanAddress(item.address, cityName);

            const newPoi: PointOfInterest = {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                name: item.name,
                category: (finalCategory || 'discovery') as any,
                subCategory: finalSubCategory as any,
                description: item.reason, // Usiamo la "reason" dell'audit come descrizione iniziale
                address: standardizedAddress,
                coords: { lat: item.lat, lng: item.lng },
                cityId: cityId,
                status: 'draft', // Sempre Draft per sicurezza
                aiReliability: 'medium', // Audit + Enrichment = Medium Reliability
                tourismInterest: 'high', // Se è uscito nell'Audit dei "Must-See", è High
                rating: 0, 
                votes: 0, 
                imageUrl: '', // Lasciamo vuoto per ora, sarà il placeholder a coprire
                lastVerified: new Date().toISOString()
            };
            
            await saveSinglePoi(newPoi, cityId);
            count++;
        }
        setImportCount(count);
        setStep('success');
        
        // Trigger global refresh
        window.dispatchEvent(new CustomEvent('refresh-city-data', { detail: { cityId } }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40">
                            <Search className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
                                Micro Intelligence <span className="text-slate-500">|</span> {cityName}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Gap Analysis & Enrichment (Fase 4)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden relative">
                    
                    {step === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                <Search className="w-24 h-24 text-indigo-400 animate-pulse relative z-10"/>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-white">Analisi Micro-Territoriale in Corso...</h4>
                                <p className="text-slate-400 max-w-md mx-auto">L'AI sta identificando i "Must-See" e li sta confrontando geometricamente con il database esistente.</p>
                            </div>
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="h-full flex flex-col">
                            <div className="grid grid-cols-12 flex-1 min-h-0 bg-[#020617]">
                                {/* HEADER TABLE */}
                                <div className="col-span-12 bg-slate-950 border-b border-slate-800 p-3 grid grid-cols-12 gap-4 text-[10px] font-black uppercase text-slate-500 tracking-widest sticky top-0 z-10">
                                    <div className="col-span-1 text-center">Importa</div>
                                    <div className="col-span-4">Proposta AI</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-5">Corrispondenza DB (Fingerprint)</div>
                                </div>
                                
                                <div className="col-span-12 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {results.map((item, idx) => {
                                        const isSelected = selectedIndices.has(idx);
                                        const isMatch = item.matchStatus !== 'missing';
                                        
                                        // Trova il POI DB corrispondente per mostrare info
                                        const dbMatch = isMatch ? existingPois.find(p => p.id === item.matchedDbId) : null;

                                        // Anteprima della categoria che verrà assegnata (Smart Guess)
                                        const previewCatMatch = resolveCategoryFromDict(item.name, taxonomyDict) || resolveCategoryFromDict(item.category, taxonomyDict);
                                        const previewLabel = previewCatMatch ? `DB: ${previewCatMatch.cat}/${previewCatMatch.sub}` : `AI: ${item.category}`;

                                        return (
                                            <div key={idx} className={`grid grid-cols-12 gap-4 p-3 rounded-lg items-center border transition-all ${isMatch ? 'bg-slate-900/30 border-slate-800 opacity-60' : isSelected ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                                                
                                                <div className="col-span-1 flex justify-center">
                                                    {!isMatch && (
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected} 
                                                            onChange={() => toggleSelection(idx)}
                                                            className="w-5 h-5 rounded border-slate-600 accent-indigo-500 cursor-pointer"
                                                        />
                                                    )}
                                                </div>

                                                <div className="col-span-4">
                                                    <div className="font-bold text-white text-sm">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 truncate">{item.reason}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] px-1.5 rounded ${previewCatMatch ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'}`}>
                                                            {previewLabel}
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 font-mono">{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 flex justify-center">
                                                    {item.matchStatus === 'missing' && (
                                                        <span className="bg-red-900/20 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3"/> Mancante
                                                        </span>
                                                    )}
                                                    {item.matchStatus === 'geo_match' && (
                                                        <span className="bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1" title={`Distanza: ${item.matchedDistance}m`}>
                                                            <MapPin className="w-3 h-3"/> Geo Match ({item.matchedDistance}m)
                                                        </span>
                                                    )}
                                                    {item.matchStatus === 'name_match' && (
                                                        <span className="bg-amber-900/20 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                            <Database className="w-3 h-3"/> Name Match
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="col-span-5 pl-4 border-l border-slate-800 border-dashed">
                                                    {dbMatch ? (
                                                        <div className="opacity-80">
                                                            <div className="font-bold text-slate-300 text-xs flex items-center gap-2">
                                                                <CheckCircle className="w-3 h-3 text-emerald-500"/>
                                                                {dbMatch.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5">{dbMatch.address}</div>
                                                            <div className="text-[9px] text-slate-600 mt-1 font-mono">ID: {dbMatch.id}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-600 text-xs italic flex items-center gap-2">
                                                            <ArrowRight className="w-3 h-3 opacity-50"/> Nessuna corrispondenza trovata
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                                <div className="text-xs text-slate-400">
                                    Selezionati: <strong className="text-white">{selectedIndices.size}</strong> nuovi POI
                                </div>
                                <button 
                                    onClick={handleImport} 
                                    disabled={selectedIndices.size === 0}
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4"/> Importa e Arricchisci
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-6">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-2xl">
                                <CheckCircle className="w-12 h-12 text-emerald-500"/>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Audit & Enrichment Completato</h3>
                                <p className="text-slate-300 text-lg">
                                    Importati con successo <strong className="text-emerald-400">{importCount}</strong> nuovi Punti di Interesse.
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    I dati sono stati normalizzati (Indirizzi, Categorie) e salvati come "Draft".
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
