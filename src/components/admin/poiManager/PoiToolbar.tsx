
import React, { useState } from 'react';
import { Layers, Landmark, Utensils, Bed, ShoppingBag, Music, Sun, Search, ArrowUpDown, Loader2, Sparkles, Bot, Plus, AlertTriangle, CheckSquare, Square, RefreshCw, Trash2, CheckCircle, Database, ImageOff, FileDown, Target, Archive, ListPlus, Calendar, Clock, Shield, Star, Filter, X, Wand2, ChevronDown, Check, Info, Coins, Zap } from 'lucide-react';
import { PointOfInterest, User } from '../../../types/index';
import { RegenerateConfirmModal } from './RegenerateConfirmModal'; 
import { useAdminExport } from '../../../hooks/useAdminExport'; 
import { AdminMultiSelect } from '../common/AdminMultiSelect'; 
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

interface PoiToolbarProps {
    state: {
        viewStatus: 'published' | 'draft' | 'needs_check' | 'all';
        activeCategory: string;
        searchTerm: string;
        filterSubCategory: string[];
        // MULTI-SELECT ARRAYS
        filterReliability: string[]; 
        filterInterest: string[];
        filterCreatedDates: string[];
        filterUpdatedDates: string[];
        filterPriceLevel: number[]; // NEW
        
        sortDir: 'asc' | 'desc';
        aiRequests: Record<string, number>;
        isGenerating: boolean;
        genStatus: string;
        isFixingTaxonomy: boolean;
        isBulkProcessing: boolean;
        selectedIds: Set<string>;
        pois: PointOfInterest[]; 
        allCityPois: PointOfInterest[]; 
        totalItems: number;
        pageSize: number;
        availableDates: { created: string[], updated: string[] }; // DATES DATA
    };
    counts: {
        getCategoryCount: (id: string, status?: 'published' | 'draft' | 'needs_check') => number;
        getTotalCategoryCount: (id: string) => number;
    };
    actions: {
        setViewStatus: (s: 'published' | 'draft' | 'needs_check' | 'all') => void;
        setCategory: (c: string) => void;
        setSearch: (s: string) => void;
        setFilterSubCategory: (s: string[]) => void;
        setFilterReliability: (r: string[]) => void; 
        setFilterInterest: (i: string[]) => void;
        setFilterCreatedDates: (d: string[]) => void;
        setFilterUpdatedDates: (d: string[]) => void;
        setFilterPriceLevel: (p: number[]) => void; // NEW
        
        toggleSort: () => void;
        openFilterDrawer: () => void;
        toggleAllPage: () => void;
        handleAiInputChange: (cat: string, val: string) => void;
        executeAiGeneration: (count?: number, cats?: {id:string, label:string}[]) => void; 
        executeDailyDeepScan: (cityName: string, currentUser?: User) => void; // NEW ACTION
        stopBulkProcess: () => void; // NEW ACTION
        
        fixTaxonomy: () => void;
        fixSelectedPois: () => void;
        openNewModal: () => void;
        refreshData: () => void; 
        openTaxonomy: () => void; 
        bulkResetImages: (user?: User) => void; 
        setPageSize: (size: number) => void;
        setPage: (p: number) => void;
        bulkStatusChange: (status: 'published' | 'draft') => void;
        bulkDelete: () => void;
        resetSelection: () => void;
        resetFiltersAndReload: () => void;
    };
    cityName?: string;
    cityId: string;
    currentUser?: User; 
}

const CATEGORY_TABS = [
    { id: 'all', label: 'Tutti', icon: Layers, color: 'text-slate-400', bg: 'bg-slate-800' },
    { id: 'monument', label: 'Destinazioni', icon: Landmark, color: 'text-violet-400', bg: 'bg-violet-900/20' },
    { id: 'food', label: 'Sapori', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    { id: 'hotel', label: 'Alloggi', icon: Bed, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { id: 'shop', label: 'Shopping', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-900/20' },
    { id: 'leisure', label: 'Svago', icon: Music, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
    { id: 'nature', label: 'Natura', icon: Sun, color: 'text-emerald-400', bg: 'bg-emerald-900/20' }
];

export const PoiToolbar: React.FC<PoiToolbarProps> = ({ state, counts, actions, cityName, cityId, currentUser }) => {
    const [showRegenModal, setShowRegenModal] = useState(false);
    const [showDeepScanConfirm, setShowDeepScanConfirm] = useState(false);
    const { isExporting, exportPoiCsv } = useAdminExport();

    // DISCOVERY STATE
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [discoveryCount, setDiscoveryCount] = useState(5);
    const [selectedDiscCats, setSelectedDiscoveryCats] = useState<string[]>(['monument']);

    const hiddenItemsCount = Math.max(0, state.totalItems - state.pois.length);
    const showLoadAllButton = state.totalItems > state.pois.length;
    const areAllSelected = state.pois.length > 0 && state.pois.every(p => state.selectedIds.has(p.id));

    const handleRegeneratePois = async (selectedStatuses: string[]) => {
        setShowRegenModal(false);
        alert("Funzionalità rigenerazione massiva in fase di implementazione.");
    };

    // Helper per formattare la data per l'etichetta
    const formatLabelDate = (isoDate: string) => {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}/${m}/${y}`;
    };

    const toggleDiscCat = (catId: string) => {
        if (selectedDiscCats.includes(catId)) {
            setSelectedDiscoveryCats(prev => prev.filter(c => c !== catId));
        } else {
            setSelectedDiscoveryCats(prev => [...prev, catId]);
        }
    };

    const runDiscovery = () => {
        if (selectedDiscCats.length === 0) { alert("Seleziona almeno una categoria."); return; }
        const catObjects = selectedDiscCats.map(cId => {
            const found = CATEGORY_TABS.find(t => t.id === cId);
            return { id: cId, label: found ? found.label : cId };
        });
        actions.executeAiGeneration(discoveryCount, catObjects);
        setIsDiscoveryOpen(false);
    };
    
    // NEW: Handler for Daily Deep Scan
    const handleDailyDeepScan = () => {
        if(!cityName) return;
        setShowDeepScanConfirm(true);
    };

    const confirmDailyDeepScan = () => {
        if(!cityName) return;
        actions.executeDailyDeepScan(cityName, currentUser);
        setShowDeepScanConfirm(false);
    };

    return (
        <div className="space-y-6">
            {showRegenModal && (<RegenerateConfirmModal isOpen={true} onClose={() => setShowRegenModal(false)} onConfirm={handleRegeneratePois} cityName={cityName || ''}/>)}
            
            <DeleteConfirmationModal
                isOpen={showDeepScanConfirm}
                onClose={() => setShowDeepScanConfirm(false)}
                onConfirm={confirmDailyDeepScan}
                title="Avviare la Bonifica Giornaliera Pro?"
                message="Il sistema processerà i POI non verificati (sequenzialmente) usando Gemini Pro + Google Search. Se finisce la quota, il processo si fermerà salvando i progressi (con flag 'High Reliability'). Potrai riprenderlo domani."
                confirmLabel="Avvia Bonifica"
                variant="info"
            />

            <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-indigo-500/20 shadow-lg">
                 <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-indigo-900/10 px-4 py-2 rounded-xl border border-indigo-500/30">
                         <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/40"><Bot className="w-4 h-4 text-white"/></div>
                         <div>
                             <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">AI Assistant</span>
                             <span className="text-xs text-white font-bold">{state.isBulkProcessing ? state.genStatus : 'Gestione Intelligente'}</span>
                         </div>
                    </div>
                    
                    {/* STOP BUTTON (Visible only when processing) */}
                    {state.isBulkProcessing && (
                        <button onClick={actions.stopBulkProcess} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase animate-pulse shadow-lg hover:bg-red-500 transition-colors">
                            STOP
                        </button>
                    )}
                 </div>

                 <div className="flex gap-2 w-full xl:w-auto justify-end">
                     {/* DAILY DEEP SCAN BUTTON */}
                     <button 
                        onClick={handleDailyDeepScan} 
                        disabled={state.isGenerating || state.isBulkProcessing} 
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-purple-900/20 border border-purple-500 disabled:opacity-50 transition-all active:scale-95"
                        title="Bonifica progressiva con Gemini Pro + Google Search"
                    >
                         {state.isBulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current"/>} 
                         Bonifica Pro (Daily)
                     </button>

                     <button onClick={() => actions.bulkResetImages(currentUser)} disabled={state.selectedIds.size === 0} className="bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-30">
                         <ImageOff className="w-3.5 h-3.5"/> Reset Img
                     </button>
                     <button onClick={() => exportPoiCsv(cityId)} disabled={isExporting} className="bg-slate-800 hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors">
                         {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileDown className="w-3.5 h-3.5"/>} EXPORT POI
                     </button>
                     <button onClick={actions.fixTaxonomy} disabled={state.isFixingTaxonomy} className="bg-slate-800 hover:bg-cyan-900/30 text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50">
                         {state.isFixingTaxonomy ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Target className="w-3.5 h-3.5"/>} Auto-Fix Tax
                     </button>
                     <button onClick={actions.openTaxonomy} className="bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors">
                         <Database className="w-3.5 h-3.5"/> Tassonomia
                     </button>
                 </div>
            </div>
            
            {/* ... REST OF COMPONENT ... */}
            
            {/* FLASH DISCOVERY PANEL - RESTORED & UPGRADED */}
            {isDiscoveryOpen && (
                <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 relative">
                    <button onClick={() => setIsDiscoveryOpen(false)} className="absolute top-2 right-2 p-1 text-emerald-400 hover:text-white rounded-full hover:bg-emerald-900/30"><X className="w-4 h-4"/></button>
                    
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-5 h-5 text-emerald-400"/>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Flash AI Discovery</h4>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Quali Categorie Cercare?</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {CATEGORY_TABS.filter(c => c.id !== 'all').map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => toggleDiscCat(cat.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${selectedDiscCats.includes(cat.id) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50'}`}
                                    >
                                        {selectedDiscCats.includes(cat.id) ? <CheckSquare className="w-3.5 h-3.5"/> : <Square className="w-3.5 h-3.5"/>}
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-auto flex flex-col gap-4">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Quantità per Categoria</label>
                                <select 
                                    value={discoveryCount} 
                                    onChange={e => setDiscoveryCount(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold outline-none focus:border-emerald-500"
                                >
                                    <option value={5}>5 Nuovi</option>
                                    <option value={10}>10 Nuovi</option>
                                    <option value={15}>15 Nuovi</option>
                                    <option value={20}>20 Nuovi</option>
                                </select>
                            </div>
                            <button 
                                onClick={runDiscovery}
                                disabled={state.isGenerating}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {state.isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                                Avvia Ricerca Flash
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[10px] text-emerald-200/70 italic flex gap-2 items-center">
                        <Info className="w-3 h-3"/> I risultati verranno aggiunti come "Bozza" (Draft). Usa poi "Bonifica Pro" per validarli.
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={actions.toggleAllPage}
                        className={`p-2 rounded-xl border transition-all shadow-sm shrink-0 ${areAllSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-500 hover:text-white'}`}
                        title="Seleziona/Deseleziona Tutti"
                    >
                        {areAllSelected ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                    </button>

                    <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto flex-1 md:flex-none">
                        {[
                            { id: 'all', label: 'TUTTI (ARCHIVIO)', icon: Archive, color: 'text-indigo-400' },
                            { id: 'published', label: 'Online', icon: CheckCircle, color: 'text-emerald-500' },
                            { id: 'draft', label: 'Bozze AI', icon: Layers, color: 'text-amber-500' },
                            { id: 'needs_check', label: 'Revisione', icon: AlertTriangle, color: 'text-red-500' }
                        ].map(st => {
                            const isActive = state.viewStatus === st.id;
                            return (
                                <button 
                                    key={st.id}
                                    onClick={() => actions.setViewStatus(st.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all whitespace-nowrap ${isActive ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <st.icon className={`w-3.5 h-3.5 ${isActive ? st.color : 'text-slate-600'}`}/>
                                    {st.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto items-center">
                     {/* GROUP: POI MANAGEMENT */}
                     
                     <button onClick={actions.fixSelectedPois} disabled={state.selectedIds.size === 0 || state.isGenerating} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-wide flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 border border-purple-500 disabled:border-slate-700 whitespace-nowrap">
                         {state.isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
                         {state.isGenerating ? 'Elaborazione...' : `Bonifica (${state.selectedIds.size})`}
                     </button>
                     
                    {/* BUTTON TO TOGGLE DISCOVERY PANEL (RENAMED) */}
                    <button 
                        onClick={() => setIsDiscoveryOpen(!isDiscoveryOpen)} 
                        disabled={state.isGenerating}
                        className={`px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all border whitespace-nowrap ${isDiscoveryOpen ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500' : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-500 border-emerald-500/30'}`}
                    >
                        <Wand2 className="w-4 h-4"/> 
                        {isDiscoveryOpen ? 'Chiudi Discovery' : 'NUOVO POI (AI)'}
                    </button>

                    <button onClick={actions.openNewModal} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all border border-indigo-500 whitespace-nowrap"><Plus className="w-4 h-4"/> Nuovo POI</button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex gap-2 min-w-max">
                    {CATEGORY_TABS.map(cat => {
                        const isActive = state.activeCategory === cat.id;
                        const count = counts.getCategoryCount(cat.id, state.viewStatus === 'all' ? undefined : state.viewStatus);
                        return (
                            <button 
                                key={cat.id}
                                onClick={() => actions.setCategory(cat.id)}
                                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl border transition-all min-w-[80px] ${isActive ? `${cat.bg} border-${cat.color.split('-')[1]}-500/50 ${cat.color} shadow-md` : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                            >
                                <cat.icon className="w-4 h-4"/>
                                <span className="text-[10px] font-black uppercase tracking-wide">{cat.label}</span>
                                <span className={`text-[9px] px-1.5 rounded-full ${isActive ? 'bg-black/20' : 'bg-slate-800'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                {/* FIRST ROW: SEARCH */}
                <div className="relative w-full group">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                    <input type="text" placeholder="Cerca nome, descrizione..." value={state.searchTerm} onChange={e => actions.setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-[12px] text-white focus:border-indigo-500 outline-none placeholder:text-slate-600"/>
                </div>

                {/* SECOND ROW: MULTI FILTERS */}
                <div className="flex flex-wrap items-center gap-2">
                    
                    {showLoadAllButton && (
                        <button onClick={() => { actions.setPageSize(state.totalItems + 100); actions.setPage(1); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide shadow-lg flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap border border-indigo-400">
                            <ListPlus className="w-3.5 h-3.5"/> Mostra Tutti ({hiddenItemsCount})
                        </button>
                    )}

                    {/* MULTI SELECTS */}
                    <AdminMultiSelect 
                        label="Affidabilità"
                        icon={<Shield className="w-3.5 h-3.5"/>}
                        selectedValues={state.filterReliability}
                        onChange={actions.setFilterReliability}
                        options={[
                            { value: 'high', label: 'High (Sicuri)', color: 'text-emerald-400' },
                            { value: 'medium', label: 'Medium (Probabili)', color: 'text-amber-400' },
                            { value: 'low', label: 'Low (Rischiosi)', color: 'text-red-400' },
                            { value: 'no_gps', label: 'No GPS (0,0)', color: 'text-red-500' },
                            { value: 'out_of_zone', label: 'INVALIDATO (Fuori Zona)', color: 'text-slate-400' },
                            { value: 'unknown', label: 'Non Definito', color: 'text-slate-500' },
                        ]}
                    />

                    <AdminMultiSelect 
                        label="Interesse"
                        icon={<Star className="w-3.5 h-3.5"/>}
                        selectedValues={state.filterInterest}
                        onChange={actions.setFilterInterest}
                        options={[
                            { value: 'high', label: 'Top (Imperdibile)', color: 'text-fuchsia-400' },
                            { value: 'medium', label: 'Medio (Popolare)', color: 'text-blue-400' },
                            { value: 'low', label: 'Basso (Nicchia)', color: 'text-slate-400' },
                            { value: 'unknown', label: 'Non Classificato', color: 'text-amber-500' },
                        ]}
                    />

                    {/* NEW: PRICE LEVEL FILTER */}
                    <AdminMultiSelect 
                        label="Fascia Prezzo"
                        icon={<Coins className="w-3.5 h-3.5"/>}
                        selectedValues={(state.filterPriceLevel || []).map(String)} 
                        onChange={(vals) => actions.setFilterPriceLevel(vals.map(Number))} 
                        options={[
                            { value: '1', label: '€ Economico', color: 'text-emerald-400' },
                            { value: '2', label: '€€ Medio', color: 'text-amber-400' },
                            { value: '3', label: '€€€ Costoso', color: 'text-orange-400' },
                            { value: '4', label: '€€€€ Lusso', color: 'text-rose-400' },
                        ]}
                    />

                    <AdminMultiSelect 
                        label="Creato Il"
                        icon={<Calendar className="w-3.5 h-3.5"/>}
                        selectedValues={state.filterCreatedDates}
                        onChange={actions.setFilterCreatedDates}
                        options={state.availableDates.created.map(d => ({ value: d, label: formatLabelDate(d) }))}
                        placeholder="Filtra per data creazione..."
                    />

                    <AdminMultiSelect 
                        label="Modificato Il"
                        icon={<Clock className="w-3.5 h-3.5"/>}
                        selectedValues={state.filterUpdatedDates}
                        onChange={actions.setFilterUpdatedDates}
                        options={state.availableDates.updated.map(d => ({ value: d, label: formatLabelDate(d) }))}
                        placeholder="Filtra per data modifica..."
                    />

                    {/* FILTRI EXTRA (DRAWER) - ALWAYS VISIBLE NOW */}
                    <button onClick={actions.openFilterDrawer} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap bg-indigo-600 text-white border-indigo-500 shadow-md`}>
                        <Filter className="w-3.5 h-3.5"/> Filtri Avanzati (!)
                    </button>
                    
                    {/* RESET */}
                    <button onClick={actions.resetFiltersAndReload} className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors" title="Reset filtri">
                         <X className="w-3.5 h-3.5"/>
                    </button>
                    
                    <div className="w-px h-6 bg-slate-800 mx-1"></div>
                    
                    {/* SORT */}
                    <button onClick={actions.toggleSort} className="flex items-center gap-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-[10px] font-bold text-white hover:bg-slate-800 transition-colors whitespace-nowrap">
                        <ArrowUpDown className="w-3 h-3 text-slate-400"/> {state.sortDir === 'desc' ? 'Recenti' : 'Vecchi'}
                    </button>
                </div>
            </div>
        </div>
    );
};
