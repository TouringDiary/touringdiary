
import React, { useState, useEffect } from 'react';
import { Map, ScanSearch, Microscope, Loader2, X, Save, Bot, Pencil, CheckCircle, Plus } from 'lucide-react';
import { CitySummary, AiCitySuggestion, CityDeleteOptions } from '../../../types/index';
import { GeoCascadingFilters } from './GeoCascadingFilters';
import { RegionalAnalysisModal } from './RegionalAnalysisModal';
import { CityAuditModal } from './CityAuditModal'; 
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { DeleteCityOptionsModal } from './DeleteCityOptionsModal'; // IMPORTATO MODALE OPZIONI
import { ZoneCard } from './ZoneCard';
import { useStrategicMap } from '../../../hooks/admin/useStrategicMap'; 
import { deleteCity } from '../../../services/city/cityLifecycleService'; // Direct import to avoid circular dependency issues if any
import { saveManifestItem } from '../../../services/city/cityUpdateService';
import { removeZoneSuggestion } from '../../../services/zoneService'; 
import { clearCacheKey } from '../../../services/city/cityCache'; // IMPORT CLEAR CACHE

// --- COMPONENTE LEGENDA AGGIORNATO ---
const AdminLegend = () => (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl mt-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center text-[10px] uppercase font-bold text-slate-400">
            {/* STATI */}
            <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div> Online (Pubblicati)</span>
                <span className="flex items-center gap-1.5 text-amber-500"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]"></div> Bozza (Presenti, non pubbl.)</span>
                <span className="flex items-center gap-1.5 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]"></div> Ripristinato (Ghost)</span>
                <span className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]"></div> Mancante (Solo suggerimento AI)</span>
            </div>
            
            {/* AZIONI ALLINEATE AI TASTI */}
            <div className="flex flex-wrap gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto">
                <span className="flex items-center gap-1.5" title="Generazione Nuova Città"><Bot className="w-3.5 h-3.5 text-purple-400"/> + Città AI - Corpo</span>
                <span className="flex items-center gap-1.5" title="Analisi specifica per singola zona"><Microscope className="w-3.5 h-3.5 text-indigo-400"/> + Città AI - Zona Turistica</span>
                <span className="flex items-center gap-1.5" title="Arricchimento Dati"><ScanSearch className="w-3.5 h-3.5 text-indigo-400"/> Cerca POI</span>
                <span className="flex items-center gap-1.5" title="Gestione Manuale"><Pencil className="w-3.5 h-3.5 text-slate-400"/> Edit</span>
            </div>
        </div>
    </div>
);

// --- COMPONENTE MODALE RINOMINA INTERNO ---
interface RenameZoneModalProps {
    isOpen: boolean;
    currentName: string;
    onClose: () => void;
    onConfirm: (newName: string) => void;
    isProcessing: boolean;
}

const RenameZoneModal = ({ isOpen, currentName, onClose, onConfirm, isProcessing }: RenameZoneModalProps) => {
    const [newName, setNewName] = useState(currentName);

    const inputRef = React.useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                
                <h3 className="text-xl font-bold text-white mb-2">Rinomina Zona</h3>
                <p className="text-xs text-slate-400 mb-4">
                    Questa azione aggiornerà il nome della zona e <strong>tutte le città collegate</strong> nel database.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nuovo Nome</label>
                        <input 
                            ref={inputRef}
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-indigo-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && newName.trim() && onConfirm(newName)}
                        />
                    </div>
                    
                    <button 
                        onClick={() => onConfirm(newName)} 
                        disabled={isProcessing || !newName.trim() || newName === currentName} 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                        {isProcessing ? 'Aggiornamento...' : 'Conferma Modifica'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface StrategicMapTabProps {
    allCities: CitySummary[];
    onSelectCity: (id: string) => void;
    onMagicGenerate?: (name: string, poiCount: number) => void; 
    onDataChange?: () => Promise<void> | void; 
}

export const StrategicMapTab = ({ allCities, onSelectCity, onMagicGenerate, onDataChange }: StrategicMapTabProps) => {
    // 1. BUSINESS LOGIC (HOOK)
    const { 
        zoneData, 
        isLoading, 
        geoFilter, 
        setGeoFilter, 
        loadZones, 
        deleteZone, 
        renameZone, 
        zoneNames, 
        allCityNames 
    } = useStrategicMap(allCities);

    // 2. UI STATE
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [auditCity, setAuditCity] = useState<CitySummary | null>(null);
    const [deleteZoneTarget, setDeleteZoneTarget] = useState<string | null>(null);
    
    // Stato Cancellazione Città (Unificato)
    const [deleteCityTarget, setDeleteCityTarget] = useState<{ id?: string, name: string, type: 'real' | 'skeleton' | 'suggestion', zoneName: string } | null>(null);
    
    // Stato Cancellazione Suggerimento (Separato per chiarezza)
    const [deleteSuggestionTarget, setDeleteSuggestionTarget] = useState<{ name: string, zoneName: string } | null>(null);

    // Stato Rinomina
    const [renamingZoneName, setRenamingZoneName] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);

    // Stato Analisi Targetizzata (Singola Zona)
    const [targetZoneAnalysis, setTargetZoneAnalysis] = useState<string | null>(null);

    // 3. UI HANDLERS

    // --- HANDLER CANCELLAZIONE ZONA ---
    const handleZoneDeleteConfirm = async () => {
        if (!deleteZoneTarget) return;
        const success = await deleteZone(deleteZoneTarget);
        if (success) {
            setDeleteZoneTarget(null);
            if (onDataChange) await onDataChange(); 
        } else {
            alert("Errore eliminazione zona.");
        }
    };
    
    // --- HANDLER CANCELLAZIONE SUGGERIMENTO (AI) ---
    const handleDeleteSuggestionConfirm = async () => {
        if (!deleteSuggestionTarget) return;
        try {
            await removeZoneSuggestion(deleteSuggestionTarget.zoneName, deleteSuggestionTarget.name, geoFilter.region);
            await loadZones(); 
            setDeleteSuggestionTarget(null);
        } catch (e) {
            console.error("Errore rimozione suggerimento", e);
            alert("Errore durante la rimozione del suggerimento.");
        }
    };

    // --- HANDLER CANCELLAZIONE CITTÀ REALE ---
    const handleDeleteCityConfirm = async (options: CityDeleteOptions) => {
        if (!deleteCityTarget || !deleteCityTarget.id) return;
        
        try {
            await deleteCity(deleteCityTarget.id, options, deleteCityTarget.name); // Pass name for log
            await loadZones();
            if (onDataChange) await onDataChange();
            setDeleteCityTarget(null);
        } catch (e) {
            console.error("Errore cancellazione città:", e);
            alert("Errore durante l'eliminazione.");
        }
    };

    // Dispatcher per il tipo di eliminazione
    const handleDeleteRequest = (item: { id?: string, name: string, type: 'real' | 'skeleton' | 'suggestion', zoneName: string }) => {
        if (item.type === 'suggestion') {
            setDeleteSuggestionTarget({ name: item.name, zoneName: item.zoneName });
        } else if (item.id) {
            setDeleteCityTarget(item);
        }
    };
    
    // Handler collegato al modale rinomina
    const handleRenameConfirm = async (newName: string) => {
         if (!renamingZoneName) return;
         setIsRenaming(true);
         // FIX: Passiamo la regione corrente per identificare univocamente la zona
         const success = await renameZone(renamingZoneName, newName, geoFilter.region);
         
         if (!success) {
             alert("Errore durante la rinomina. Controlla la console o riprova.");
             setIsRenaming(false);
         } else {
             if (onDataChange) {
                 await onDataChange();
             }
             setRenamingZoneName(null);
             setIsRenaming(false);
         }
    };

    const handleImportMissing = (suggestion: AiCitySuggestion) => {
        if(onMagicGenerate) {
            onMagicGenerate(suggestion.name, 10);
        }
    };
    
    // Handler per analisi singola zona
    const handleAnalyzeZone = (zoneName: string) => {
        setTargetZoneAnalysis(zoneName);
        setShowAnalysisModal(true);
    };
    
    // Handler per analisi macro regionale (resetta target)
    const handleRegionalAnalysis = () => {
        setTargetZoneAnalysis(null);
        setShowAnalysisModal(true);
    };
    
    const handleCloseAnalysis = async () => {
        setShowAnalysisModal(false);
        setTargetZoneAnalysis(null);
        
        // 1. Invalida cache manifest per forzare il ricaricamento delle città appena importate
        clearCacheKey('manifest');
        
        // 2. Ricarica zone locali (suggestion aggiornati)
        await loadZones();
        
        // 3. Notifica al parent (CitiesManager) di ricaricare la lista globale
        if (onDataChange) {
            await onDataChange();
        }
    };

    // Handler per recuperare una città in stato "Restored"
    const [recoverCityTarget, setRecoverCityTarget] = useState<CitySummary | null>(null);

    const handleRecoverCity = async (city: CitySummary) => {
        setRecoverCityTarget(city);
    };

    const confirmRecoverCity = async () => {
        if (!recoverCityTarget) return;
        try {
            await saveManifestItem({ ...recoverCityTarget, status: 'draft' });
            if (onDataChange) await onDataChange();
        } catch (e) {
            console.error("Errore recover city", e);
            alert("Errore durante il ripristino della città.");
        } finally {
            setRecoverCityTarget(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 relative">
             {/* MODALE CANCELLAZIONE ZONA */}
             <DeleteConfirmationModal
                isOpen={!!deleteZoneTarget}
                onClose={() => setDeleteZoneTarget(null)}
                onConfirm={handleZoneDeleteConfirm}
                title="Elimina Zona"
                message={`Eliminare la zona "${deleteZoneTarget}"? Le città associate rimarranno ma senza zona.`}
             />
             
             {/* MODALE CANCELLAZIONE SUGGERIMENTO */}
             <DeleteConfirmationModal
                isOpen={!!deleteSuggestionTarget}
                onClose={() => setDeleteSuggestionTarget(null)}
                onConfirm={handleDeleteSuggestionConfirm}
                title="Rimuovi Suggerimento"
                message={`Vuoi rimuovere il suggerimento "${deleteSuggestionTarget?.name}" dalla lista dei mancanti?`}
                variant="danger"
             />

             {/* MODALE RECUPERO CITTÀ */}
             <DeleteConfirmationModal
                isOpen={!!recoverCityTarget}
                onClose={() => setRecoverCityTarget(null)}
                onConfirm={confirmRecoverCity}
                title="Ripristina Città"
                message={`Vuoi validare e ripristinare "${recoverCityTarget?.name}" come Bozza?`}
                confirmLabel="Ripristina"
                variant="info"
             />

             {/* MODALE OPZIONI CANCELLAZIONE CITTÀ (CON SCELTA ORFANI) */}
             <DeleteCityOptionsModal
                isOpen={!!deleteCityTarget}
                onClose={() => setDeleteCityTarget(null)}
                onConfirm={handleDeleteCityConfirm}
                cityName={deleteCityTarget?.name || ''}
            />
             
             {renamingZoneName && (
                 <RenameZoneModal 
                    isOpen={true}
                    currentName={renamingZoneName}
                    onClose={() => setRenamingZoneName(null)}
                    onConfirm={handleRenameConfirm}
                    isProcessing={isRenaming}
                 />
             )}
             
             {auditCity && (
                 <CityAuditModal 
                    isOpen={true} 
                    onClose={() => setAuditCity(null)} 
                    cityId={auditCity.id} 
                    cityName={auditCity.name} 
                />
             )}
             
             {showAnalysisModal && (
                <RegionalAnalysisModal 
                    isOpen={true}
                    onClose={handleCloseAnalysis}
                    regionName={geoFilter.region}
                    existingZones={zoneNames}
                    existingCityNames={allCityNames}
                    onSuccess={handleCloseAnalysis} // Chiamato quando si clicca "Chiudi Report & Aggiorna"
                    onMagicGenerate={onMagicGenerate}
                    targetZone={targetZoneAnalysis || undefined} // Passa la zona target se definita
                />
             )}

             {/* FILTRI */}
             <div className="flex justify-between items-start gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg shrink-0">
                 <GeoCascadingFilters cities={allCities} value={geoFilter} onChange={setGeoFilter} />
                 
                 <button 
                    onClick={handleRegionalAnalysis} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border border-indigo-400/50"
                >
                    <ScanSearch className="w-4 h-4"/> Analisi Regionale AI
                </button>
             </div>

             {/* ZONES GRID */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -mx-2">
                 {isLoading ? (
                     <div className="flex items-center justify-center h-64 text-slate-500 gap-3">
                         <Loader2 className="w-8 h-8 animate-spin"/>
                         <span className="text-xs font-bold uppercase tracking-widest">Caricamento Zone...</span>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {zoneData.map((z, idx) => (
                             <ZoneCard 
                                key={z.id || z.name || idx} // FIX CRITICO PER PREVENIRE CRASH SU ID UNDEFINED
                                zoneName={z.name}
                                cities={z.cities}
                                aiSuggestions={z.cleanSuggestions}
                                onSelectCity={onSelectCity}
                                onMagicGenerate={onMagicGenerate || (() => {})}
                                onRename={(name) => setRenamingZoneName(name)}
                                onDelete={(name) => setDeleteZoneTarget(name)}
                                onAuditCity={setAuditCity}
                                onImportMissing={handleImportMissing}
                                onRecoverCity={handleRecoverCity}
                                onAnalyzeZone={handleAnalyzeZone}
                                // NEW: Passiamo il gestore unificato per la cancellazione
                                onDeleteCityItem={handleDeleteRequest}
                             />
                         ))}
                     </div>
                 )}
                 {!isLoading && zoneData.length === 0 && (
                     <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                         <Map className="w-16 h-16 text-slate-700 mx-auto mb-4"/>
                         <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nessuna zona trovata in {geoFilter.region}.</p>
                         <button onClick={handleRegionalAnalysis} className="mt-4 text-indigo-400 hover:text-white underline text-xs">Avvia Analisi AI per creare zone</button>
                     </div>
                 )}
                 
                 <AdminLegend />
             </div>
        </div>
    );
};
