
import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, CheckSquare, Square, Trash2, FileDown, Loader2, RefreshCw, Wand2, Plus, Target, ImageOff, CheckCircle, AlertTriangle, X, Bot, ScanSearch, Pencil, Filter, Globe, Layers, AlertOctagon, RotateCcw, Zap } from 'lucide-react';
import { CitySummary, User, CityDeleteOptions } from '../../../types/index';

// --- FIX CRITICO IMPORT ---
import { deleteCity } from '../../../services/city/cityLifecycleService';
import { updateCityBadge, updateCityHomeOrder } from '../../../services/city/cityUpdateService';
// --------------------------

import { PaginationControls } from '../../common/PaginationControls';
import { BadgeType } from '../../../types/index';
import { useAdminExport } from '../../../hooks/useAdminExport';
import { CityGeneratorModal } from './CityGeneratorModal';
import { ProcessLogModal } from './ProcessLogModal';
import { DeleteCityOptionsModal } from './DeleteCityOptionsModal'; 
import { CompleteCityModal } from './CompleteCityModal'; // NEW IMPORT
import { useCityGenerator } from '../../../hooks/useCityGenerator';
import { GeoCascadingFilters } from './GeoCascadingFilters';

interface CitiesListTabProps {
    list: any; // Type from useCityList hook
    onEdit: (id: string) => void;
    currentUser?: User;
}

const BADGE_OPTIONS: { value: BadgeType | '', label: string, color: string }[] = [
    { value: '', label: '-', color: 'text-slate-500' },
    { value: 'event', label: 'EVENTI', color: 'text-rose-500 font-bold' },
    { value: 'trend', label: 'TREND', color: 'text-blue-500 font-bold' },
    { value: 'season', label: 'STAGIONE', color: 'text-emerald-500 font-bold' },
    { value: 'editor', label: 'EDITOR', color: 'text-purple-500 font-bold' },
    { value: 'destination', label: 'DESTINAZIONE TOP', color: 'text-indigo-500 font-bold' }
];

const ORDER_OPTIONS = [
    { value: 0, label: '-' },
    { value: 1, label: 'CARD 1' },
    { value: 2, label: 'CARD 2' },
    { value: 3, label: 'CARD 3' },
    { value: 4, label: 'CARD 4' }
];

const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white max-w-md`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
);

// --- COMPONENTE LEGENDA RIUTILIZZATO E UNIFORMATO ---
const AdminLegend = () => (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl mt-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center text-[10px] uppercase font-bold text-slate-400">
            {/* STATI */}
            <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div> Online (Pubblicati)</span>
                <span className="flex items-center gap-1.5 text-amber-500"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]"></div> Bozza (Con Contenuti)</span>
                <span className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]"></div> Mancante (Scheletro)</span>
                <span className="flex items-center gap-1.5 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]"></div> Ripristinato</span>
            </div>
            
            {/* AZIONI ALLINEATE AI TASTI */}
            <div className="flex flex-wrap gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto">
                <span className="flex items-center gap-1.5" title="Generazione Nuova Città"><Bot className="w-3.5 h-3.5 text-purple-400"/> + Città AI - Corpo</span>
                <span className="flex items-center gap-1.5" title="Arricchimento Dati"><ScanSearch className="w-3.5 h-3.5 text-indigo-400"/> Cerca POI</span>
                <span className="flex items-center gap-1.5" title="Gestione Manuale"><Pencil className="w-3.5 h-3.5 text-slate-400"/> Edit</span>
            </div>
        </div>
    </div>
);

export const CitiesListTab = ({ list, onEdit, currentUser }: CitiesListTabProps) => {
    // GENERATOR HOOK
    const generator = useCityGenerator(list.forceReload);
    const { isExporting, exportTaxonomyCsv, exportGlobalPoisCsv } = useAdminExport();

    // UI STATE
    const [showAiModal, setShowAiModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false); // NEW STATE
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processingCityName, setProcessingCityName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [deleteReport, setDeleteReport] = useState<string | null>(null); 
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

    // NEW FILTER STATES - UNIFIED
    const [listTab, setListTab] = useState<'all' | 'published' | 'draft' | 'missing' | 'restored'>('all');
    const [geoFilter, setGeoFilter] = useState({ continent: '', nation: '', region: '', zone: '', city: '' });
    
    // Internal Pagination
    const [localPage, setLocalPage] = useState(1);
    const LOCAL_PAGE_SIZE = 15;

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        let data = list.effectiveCities as CitySummary[];

        // 1. Text Search (Nome o Zona) - Prioritario
        if (list.searchTerm) {
            const lower = list.searchTerm.toLowerCase();
            data = data.filter(c => c.name.toLowerCase().includes(lower) || c.zone.toLowerCase().includes(lower));
        }

        // 2. Geo Filters
        if (geoFilter.continent) data = data.filter(c => (c.continent || 'Europa') === geoFilter.continent);
        if (geoFilter.nation) data = data.filter(c => (c.nation || 'Italia') === geoFilter.nation);
        if (geoFilter.region) data = data.filter(c => (c.adminRegion || 'Campania') === geoFilter.region);
        
        // 3. Tab Status Filters
        if (listTab === 'published') {
            data = data.filter(c => c.status === 'published');
        } else if (listTab === 'restored') {
            data = data.filter(c => c.status === 'restored');
        } else if (listTab === 'draft') {
            data = data.filter(c => c.status !== 'published' && c.status !== 'restored' && c.hasGeneratedContent);
        } else if (listTab === 'missing') {
            data = data.filter(c => c.status !== 'published' && c.status !== 'restored' && !c.hasGeneratedContent);
        }

        // 4. Sorting
        data.sort((a, b) => {
            let valA = (a as any)[list.sortKey];
            let valB = (b as any)[list.sortKey];

            if (list.sortKey === 'createdAt' || list.sortKey === 'updatedAt') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return list.sortDir === 'asc' ? valA - valB : valB - valA;
            }
            
            const strA = String(valA || '').toLowerCase();
            const strB = String(valB || '').toLowerCase();
            return list.sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });

        return data;
    }, [list.effectiveCities, list.searchTerm, list.sortKey, list.sortDir, listTab, geoFilter]);

    // Internal Pagination Slice
    const paginatedData = useMemo(() => {
        const start = (localPage - 1) * LOCAL_PAGE_SIZE;
        return filteredData.slice(start, start + LOCAL_PAGE_SIZE);
    }, [filteredData, localPage]);

    React.useEffect(() => {
        setLocalPage(1);
    }, [listTab, geoFilter, list.searchTerm]);

    // --- HANDLERS ---

    const handleDeleteRequest = (city: { id: string, name: string }) => {
        setDeleteTarget(city);
    };

    const confirmDelete = async (options: CityDeleteOptions) => {
        if (!deleteTarget) return;
        try {
            await deleteCity(deleteTarget.id, options, deleteTarget.name); // PASS NAME HERE
            setDeleteReport(`[System] Città ${deleteTarget.name} eliminata con opzioni: ${JSON.stringify(options)}`);
            setDeleteTarget(null);
            list.forceReload(); 
            showToast("Operazione completata con successo", "success");
        } catch (e: any) {
            showToast(`Errore: ${e.message}`, 'error');
        }
    };

    const handleMagicAdd = async (name: string, poiCount: number) => {
        // Chiudi modale input
        setShowAiModal(false);
        // Setta nome per modale log
        setProcessingCityName(name); 
        // Apri modale log
        setShowProcessModal(true);
        
        // Esegui processo (usa hook)
        await generator.executeMagicAdd(name, poiCount, currentUser);
        
        // A fine processo il modale log si chiude o mostra successo, e ricarica la lista
        list.forceReload();
    };
    
    // NEW: HANDLER COMPLETA CITTÀ
    const handleCompleteCity = async (config: { peopleCount: number, runPoiDeepScan: boolean }) => {
        if (list.selectedIds.size !== 1) {
            alert("Seleziona UNA città da completare.");
            return;
        }
        const cityId = Array.from(list.selectedIds)[0] as string;
        const cityObj = list.effectiveCities.find((c: any) => c.id === cityId);
        
        if (!cityObj) return;

        setProcessingCityName(cityObj.name);
        setShowCompleteModal(false);
        setShowProcessModal(true);

        try {
            await generator.executeCompleteCity(cityId, cityObj.name, config, currentUser);
            list.setSelectedIds(new Set()); // Reset selection
        } catch(e: any) {
            console.error("Errore completamento", e);
        }
    };

    const handleFixStats = async () => {
        let targets = [];
        let mode = 'missing';

        if (list.selectedIds.size > 0) {
            targets = list.effectiveCities.filter((c: CitySummary) => list.selectedIds.has(c.id));
            mode = 'force';
        } else {
            targets = list.effectiveCities.filter((c: CitySummary) => !c.visitors || c.visitors === 0);
            mode = 'missing';
        }
        
        if (targets.length === 0) {
            showToast(mode === 'force' ? "Errore selezione." : "Nessuna città necessita fix.", 'error');
            return;
        }
        
        setProcessingCityName("Manutenzione Stats"); 
        setShowProcessModal(true);
        await generator.fixMissingStats(targets, mode);
        list.setSelectedIds(new Set());
    };

    const handleBadgeChange = async (cityId: string, newBadge: string) => {
        try {
            await updateCityBadge(cityId, newBadge || null);
            list.forceReload();
            showToast("Tipologia Badge aggiornata!", "success");
        } catch (e: any) {
            showToast(`Errore: ${e.message}`, "error");
        }
    };

    const handleHomeOrderChange = async (cityId: string, newOrder: string) => {
        try {
            const orderNum = parseInt(newOrder);
            await updateCityHomeOrder(cityId, orderNum === 0 ? null : orderNum);
            list.forceReload();
            showToast("Ordine Home Page aggiornato!", "success");
        } catch (e: any) {
            showToast(`Errore: ${e.message}`, "error");
        }
    };

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (list.sortKey !== colKey) return <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-20 ml-1 inline"/>;
        return list.sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/> : <ChevronDown className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/>;
    };

    const Th = ({ id, label, center = false }: { id: string, label: string, center?: boolean }) => (
        <th 
            className={`p-3 cursor-pointer hover:bg-slate-900 transition-colors border-r border-slate-800/50 last:border-r-0 whitespace-nowrap ${center ? 'text-center' : 'text-left'}`}
            onClick={() => list.handleSort(id)}
        >
            <div className={`flex items-center gap-1 ${center ? 'justify-center' : 'justify-between'}`}>
                <span>{label}</span>
                <SortIcon colKey={id}/>
            </div>
        </th>
    );
    
    const formatDate = (isoStr?: string) => {
        if (!isoStr) return <span className="text-slate-700 font-mono text-[9px]">--</span>;
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return <span className="text-slate-700 font-mono text-[9px]">Err</span>;
        return <span className="font-mono text-[10px] text-slate-400">{d.toLocaleDateString()}</span>;
    };

    const counts = {
        all: list.effectiveCities.length,
        published: list.effectiveCities.filter((c: CitySummary) => c.status === 'published').length,
        draft: list.effectiveCities.filter((c: CitySummary) => c.status !== 'published' && c.status !== 'restored' && c.hasGeneratedContent).length,
        missing: list.effectiveCities.filter((c: CitySummary) => c.status !== 'published' && c.status !== 'restored' && !c.hasGeneratedContent).length,
        restored: list.effectiveCities.filter((c: CitySummary) => c.status === 'restored').length
    };
    
    const selectedCityForCompletion = list.selectedIds.size === 1 ? list.effectiveCities.find((c:any) => c.id === Array.from(list.selectedIds)[0]) : null;

    return (
        <div className="space-y-4 flex flex-col h-full overflow-hidden">
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* MODALI */}
            <DeleteCityOptionsModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} cityName={deleteTarget?.name || ''} />
            
            {showAiModal && <CityGeneratorModal onClose={() => setShowAiModal(false)} onGenerate={handleMagicAdd} isGenerating={generator.isProcessing} />}

            {showCompleteModal && selectedCityForCompletion && (
                 <CompleteCityModal 
                     isOpen={true}
                     onClose={() => setShowCompleteModal(false)}
                     onConfirm={handleCompleteCity}
                     cityName={selectedCityForCompletion.name}
                 />
            )}

            {showProcessModal && (
                <ProcessLogModal 
                    isOpen={true} 
                    onClose={() => { setShowProcessModal(false); list.forceReload(); }} 
                    isProcessing={generator.isProcessing} 
                    logs={generator.processLog} 
                    reports={generator.stepReports}
                    cityName={processingCityName} 
                />
            )}
            
            {/* TOOLBAR */}
            <div className="flex flex-col gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 shrink-0 shadow-lg animate-in slide-in-from-right-4">
                
                {/* RIGA 1: AZIONI PRINCIPALI E RICERCA */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                         <div className="relative w-full lg:w-72 group">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-amber-500 transition-colors"/>
                            <input type="text" placeholder="Cerca città..." value={list.searchTerm} onChange={e => list.setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-[12px] text-white focus:border-amber-500 outline-none"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
                        
                        {/* TASTO COMPLETA CITTÀ (AI) - VISIBILE SOLO SE 1 CITTÀ SELEZIONATA */}
                        {list.selectedIds.size === 1 && (
                            <button 
                                onClick={() => setShowCompleteModal(true)} 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-black shadow-lg flex items-center gap-2 text-[11px] uppercase tracking-wider transition-all border border-indigo-500 animate-pulse"
                            >
                                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300"/> COMPLETA CITTÀ (AI)
                            </button>
                        )}
                        
                        {/* TASTO CITTÀ AI RIPRISTINATO */}
                        <button 
                            onClick={() => setShowAiModal(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 text-[11px] uppercase tracking-wider transition-all border border-purple-500"
                        >
                            <Bot className="w-4 h-4"/> + Città (AI)
                        </button>

                        <button onClick={() => onEdit('new')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 text-[11px] uppercase tracking-wider transition-all border border-emerald-500"><Plus className="w-4 h-4"/> + Città Manuale</button>
                        <button onClick={handleFixStats} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 text-[10px] uppercase tracking-wide transition-all border border-slate-700"><Target className="w-3.5 h-3.5"/> Fix Stats</button>
                        <button onClick={list.forceReload} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700 transition-all"><RefreshCw className="w-4 h-4"/></button>
                    </div>
                </div>

                {/* RIGA 2: FILTRI GEOGRAFICI A CASCATA */}
                <div className="pt-2 border-t border-slate-800/50">
                    <GeoCascadingFilters cities={list.effectiveCities} value={geoFilter} onChange={(v: any) => setGeoFilter({ ...geoFilter, ...v })} />
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                <button onClick={() => setListTab('all')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${listTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                    <Layers className="w-3 h-3"/> Tutte ({counts.all})
                </button>
                <button onClick={() => setListTab('published')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${listTab === 'published' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-emerald-400'}`}>
                    <Globe className="w-3 h-3"/> Online ({counts.published})
                </button>
                <button onClick={() => setListTab('draft')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${listTab === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-amber-400'}`}>
                    <Pencil className="w-3 h-3"/> Bozza ({counts.draft})
                </button>
                <button onClick={() => setListTab('restored')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${listTab === 'restored' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-purple-400'}`}>
                    <RotateCcw className="w-3 h-3"/> Ripristinato ({counts.restored})
                </button>
                <button onClick={() => setListTab('missing')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${listTab === 'missing' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-red-400'}`}>
                    <AlertOctagon className="w-3 h-3"/> Mancanti ({counts.missing})
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest font-black sticky top-0 z-20 border-b border-slate-800">
                                <th className="p-3 text-center border-r border-slate-800/50 w-[40px]"><button onClick={list.toggleAllPage}>{paginatedData.length > 0 && paginatedData.every((c: CitySummary) => list.selectedIds.has(c.id)) ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5 opacity-30"/>}</button></th>
                                <Th id="continent" label="Continente" />
                                <Th id="nation" label="Nazione" />
                                <Th id="adminRegion" label="Regione" />
                                <Th id="zone" label="Zona" />
                                <Th id="name" label="Città" />
                                <th className="p-3 text-center border-r border-slate-800/50 w-24 bg-slate-950/80 text-amber-500">POSIZIONE HOME</th>
                                <th className="p-3 text-left border-r border-slate-800/50 w-40 bg-slate-950/80">BADGE HOME</th>
                                <Th id="status" label="Stato" center />
                                <Th id="createdAt" label="Data Creazione" center />
                                <Th id="updatedAt" label="Ultimo Update" center />
                                <th className="p-3 text-right pr-4 sticky right-0 bg-[#0f172a] shadow-[-10px_0_15px_rgba(0,0,0,0.5)]">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {paginatedData.map((city: CitySummary) => {
                                const isSelected = list.selectedIds.has(city.id);
                                const isMissing = !city.hasGeneratedContent && city.status !== 'published' && city.status !== 'restored';
                                const isDraft = city.status !== 'published' && city.status !== 'restored' && city.hasGeneratedContent;
                                const isRestored = city.status === 'restored';

                                return (
                                    <tr key={city.id} className={`transition-colors group text-slate-300 ${isSelected ? 'bg-indigo-900/10' : 'hover:bg-slate-800/30'}`}>
                                        <td className="p-3 text-center border-r border-slate-800/30"><button onClick={() => list.toggleSelection(city.id)}>{isSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5 opacity-20"/>}</button></td>
                                        <td className="p-3 text-[10px] text-slate-400 border-r border-slate-800/30">{city.continent || 'Europa'}</td>
                                        <td className="p-3 text-[10px] text-slate-400 border-r border-slate-800/30">{city.nation}</td>
                                        <td className="p-3 text-[10px] text-slate-400 border-r border-slate-800/30">{city.adminRegion}</td>
                                        <td className="p-3 text-[10px] font-bold text-indigo-300 border-r border-slate-800/30">{city.zone}</td>
                                        <td className="p-3 font-black text-white text-[12px] group-hover:text-amber-400 transition-colors border-r border-slate-800/30">{city.name}</td>
                                        <td className="p-2 border-r border-slate-800/30 bg-slate-900/20 text-center">
                                             <select 
                                                value={city.homeOrder || 0} 
                                                onChange={(e) => handleHomeOrderChange(city.id, e.target.value)}
                                                className={`bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-[11px] font-black focus:border-amber-500 outline-none cursor-pointer w-full text-center ${city.homeOrder ? 'text-amber-400 border-amber-500/50' : 'text-slate-500'}`}
                                             >
                                                 {ORDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                             </select>
                                        </td>
                                        <td className="p-2 border-r border-slate-800/30 bg-slate-900/20">
                                             <div className="relative">
                                                 <select 
                                                    value={city.specialBadge || ''} 
                                                    onChange={(e) => handleBadgeChange(city.id, e.target.value)}
                                                    className={`w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-2 pr-1 text-[10px] font-black uppercase focus:border-amber-500 outline-none cursor-pointer ${
                                                        city.specialBadge === 'event' ? 'text-rose-400' :
                                                        city.specialBadge === 'trend' ? 'text-blue-400' :
                                                        city.specialBadge === 'season' ? 'text-emerald-400' :
                                                        city.specialBadge === 'editor' ? 'text-purple-400' :
                                                        city.specialBadge === 'destination' ? 'text-indigo-400' :
                                                        'text-slate-500'
                                                    }`}
                                                 >
                                                     {BADGE_OPTIONS.map(opt => <option key={opt.label} value={opt.value} className={opt.color}>{opt.label}</option>)}
                                                 </select>
                                             </div>
                                        </td>
                                        <td className="p-3 text-center border-r border-slate-800/30">
                                            {city.status === 'published' ? (
                                                <span className="text-[8px] bg-emerald-900/30 text-emerald-500 px-1.5 py-0.5 rounded-full font-black uppercase">Online</span>
                                            ) : isRestored ? (
                                                <span className="text-[8px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded-full font-black uppercase">Ripristinato</span>
                                            ) : isMissing ? (
                                                <span className="text-[8px] bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded-full font-black uppercase" title="Scheletro vuoto">Mancante</span>
                                            ) : (
                                                <span className="text-[8px] bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded-full font-black uppercase">Bozza</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center border-r border-slate-800/30 text-slate-500">{formatDate(city.createdAt)}</td>
                                        <td className="p-3 text-center border-r border-slate-800/30 bg-slate-900/30 text-white font-bold">{formatDate(city.updatedAt)}</td>
                                        <td className="p-3 text-right pr-2 sticky right-0 bg-[#0f172a] shadow-[-10px_0_15px_rgba(0,0,0,0.5)] group-hover:bg-[#1e293b]">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => onEdit(city.id)} className="bg-slate-800 hover:bg-indigo-600 text-white px-2 py-0.5 rounded-xl text-[10px] font-black border border-slate-700 uppercase transition-all shadow-md">Edit</button>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); handleDeleteRequest(city); }} 
                                                    className="text-slate-600 hover:text-red-500 p-1 hover:bg-slate-800 rounded transition-all"
                                                    title="Elimina Città"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <PaginationControls 
                currentPage={localPage} 
                maxPage={Math.ceil(filteredData.length / LOCAL_PAGE_SIZE)} 
                onNext={() => setLocalPage(p => p + 1)} 
                onPrev={() => setLocalPage(p => Math.max(1, p - 1))} 
                totalItems={filteredData.length} 
            />

            <AdminLegend />
        </div>
    );
};
