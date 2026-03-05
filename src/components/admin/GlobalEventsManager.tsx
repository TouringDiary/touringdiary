
import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, Filter, Bot, Star, Loader2, RefreshCw, TrendingUp, Info, Eye, CheckSquare, Square, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getGlobalEventsPaginated, analyzeEventWithAi, updateEventMetadata, toggleCityEventBadge } from '../../services/globalEventsService';
import { PaginationControls } from '../common/PaginationControls';
import { StarRating } from '../common/StarRating';
import { formatVisitors } from '../../utils/common';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

export const GlobalEventsManager = () => {
    // DATA STATE
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
    
    const { styles } = useAdminStyles();
    
    // LOAD CACHE
    const eventList = getCachedSetting<any[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST);
    const EVENT_CANONICAL_LIST = eventList || [];

    // FILTERS & SORT
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(''); 
    const [seasonFilter, setSeasonFilter] = useState('');
    const [periodFilter, setPeriodFilter] = useState(''); 
    const [holidayFilter, setHolidayFilter] = useState('');
    const [sortKey, setSortKey] = useState<'date' | 'name' | 'city' | 'rating' | 'category'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState('');
    const [togglingBadgeId, setTogglingBadgeId] = useState<string | null>(null);
    const [showConfirmBulk, setShowConfirmBulk] = useState(false);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const res = await getGlobalEventsPaginated({
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: searchTerm,
                category: categoryFilter, 
                season: seasonFilter,
                period: periodFilter,
                holiday: holidayFilter,
                sortBy: sortKey,
                sortDir: sortDir
            });
            setEvents(res.data);
            setPagination(prev => ({ ...prev, total: res.count }));
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [pagination.page, searchTerm, categoryFilter, seasonFilter, periodFilter, holidayFilter, sortKey, sortDir]);

    const handleSort = (key: 'date' | 'name' | 'city' | 'rating' | 'category') => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAllPage = () => {
        const allOnPage = events.map(e => e.id);
        const allSelected = allOnPage.every(id => selectedIds.has(id));
        const newSet = new Set(selectedIds);
        if (allSelected) { allOnPage.forEach(id => newSet.delete(id)); } 
        else { allOnPage.forEach(id => newSet.add(id)); }
        setSelectedIds(newSet);
    };

    const handleAnalyze = async (event: any) => {
        setAnalyzingId(event.id);
        try {
            const aiData = await analyzeEventWithAi(event.name, event.city_name);
            if (aiData) {
                await updateEventMetadata(event.id, aiData);
                setEvents(prev => prev.map(e => e.id === event.id ? { ...e, metadata: aiData } : e));
            }
        } catch (e) { alert("Errore analisi AI"); } 
        finally { setAnalyzingId(null); }
    };

    const handleBulkAnalyze = async () => {
        if (selectedIds.size === 0) return;
        setShowConfirmBulk(true);
    };

    const executeBulkAnalyze = async () => {
        setShowConfirmBulk(false);
        setIsBulkAnalyzing(true);
        const idsToProcess = Array.from(selectedIds);
        let processed = 0;
        for (const id of idsToProcess) {
            const event = events.find(e => e.id === id);
            if (!event) continue;
            setBulkProgress(`Analisi ${processed + 1}/${idsToProcess.length}: ${event.name}...`);
            try {
                const aiData = await analyzeEventWithAi(event.name, event.city_name);
                if (aiData) {
                    await updateEventMetadata(event.id, aiData);
                    setEvents(prev => prev.map(e => e.id === id ? { ...e, metadata: aiData } : e));
                }
                await new Promise(r => setTimeout(r, 500)); 
            } catch (e) { console.error(e); }
            processed++;
        }
        setIsBulkAnalyzing(false);
        setBulkProgress('');
        setSelectedIds(new Set());
        alert("Analisi massiva completata!");
    };

    const handleBadgeToggle = async (cityId: string, currentBadge: string | null) => {
        setTogglingBadgeId(cityId);
        try {
            const newBadge = currentBadge === 'event' ? null : 'event';
            await toggleCityEventBadge(cityId, newBadge);
            setEvents(prev => prev.map(e => e.city_id === cityId ? { ...e, city_badge: newBadge } : e));
        } catch (e) { alert("Errore"); } 
        finally { setTogglingBadgeId(null); }
    };
    
    const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const SEASONS = ['Primavera', 'Estate', 'Autunno', 'Inverno'];
    const HOLIDAYS = [ { label: 'Natale & Capodanno', value: 'natale' }, { label: 'Pasqua', value: 'pasqua' }, { label: 'Carnevale', value: 'carnevale' }, { label: 'Ferragosto', value: 'ferragosto' }, { label: 'Halloween', value: 'halloween' }, { label: 'Ponti', value: 'ponti_primavera' }, { label: 'Immacolata', value: 'immacolata' } ];

    const SortHeader = ({ label, colKey }: { label: string, colKey: typeof sortKey }) => (
        <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort(colKey)}>
            {label}
            {sortKey === colKey ? (
                sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-500"/> : <ChevronDown className="w-3 h-3 text-amber-500"/>
            ) : (
                <ArrowUpDown className="w-3 h-3 opacity-30"/>
            )}
        </div>
    );

    const allSelected = events.length > 0 && events.every(e => selectedIds.has(e.id));

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in relative">
            <DeleteConfirmationModal 
                isOpen={showConfirmBulk}
                onClose={() => setShowConfirmBulk(false)}
                onConfirm={executeBulkAnalyze}
                title="Analisi Massiva AI"
                message={`Vuoi analizzare ${selectedIds.size} eventi con l'AI?`}
                confirmLabel="Analizza"
                variant="info"
            />
            <div className="flex justify-between items-center shrink-0 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-600 rounded-xl shadow-lg"><CalendarDays className="w-8 h-8 text-white" /></div>
                    <div><h2 className={styles.admin_page_title}>Centro Controllo Eventi</h2><p className={styles.admin_page_subtitle}>Monitoraggio globale, analisi AI e gestione priorità</p></div>
                </div>
                {selectedIds.size > 0 ? (
                     <div className="flex items-center gap-3 bg-indigo-900/40 border border-indigo-500/50 px-4 py-2 rounded-xl animate-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-indigo-200">{selectedIds.size} selezionati</span>
                        <button onClick={handleBulkAnalyze} disabled={isBulkAnalyzing} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2 shadow-lg disabled:opacity-50">
                            {isBulkAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Bot className="w-3.5 h-3.5"/>}
                            {isBulkAnalyzing ? 'Analisi...' : 'Analizza con AI'}
                        </button>
                     </div>
                ) : (
                    <button onClick={loadEvents} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/></button>
                )}
            </div>
            
            {isBulkAnalyzing && <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-3 justify-center text-xs text-amber-400 font-mono animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> {bulkProgress}</div>}

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row gap-3 items-center shrink-0">
                <div className="relative flex-1 w-full"><Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500"/><input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPagination(p => ({...p, page: 1})); }} placeholder="Cerca evento, città..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-rose-500 outline-none"/></div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPagination(p => ({...p, page: 1})); }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-rose-500 outline-none cursor-pointer font-bold">
                        <option value="">Tutte le Categorie</option>
                        {EVENT_CANONICAL_LIST.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                    <select value={holidayFilter} onChange={e => { setHolidayFilter(e.target.value); setPagination(p => ({...p, page: 1})); }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-rose-500 outline-none cursor-pointer font-bold"><option value="">Tutte le Festività</option>{HOLIDAYS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}</select>
                    <select value={seasonFilter} onChange={e => { setSeasonFilter(e.target.value); setPagination(p => ({...p, page: 1})); }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-rose-500 outline-none cursor-pointer"><option value="">Tutte le Stagioni</option>{SEASONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 text-[9px] uppercase tracking-wider font-bold sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
                                <th className="px-3 py-3 w-10 text-center"><button onClick={toggleAllPage} className="opacity-70 hover:opacity-100">{allSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5"/>}</button></th>
                                <th className="px-3 py-3 w-64 text-left"><SortHeader label="Evento" colKey="name"/></th>
                                <th className="px-3 py-3 w-32 text-center border-l border-slate-800"><SortHeader label="Categoria" colKey="category"/></th>
                                <th className="px-3 py-3 w-32 text-center border-l border-slate-800"><SortHeader label="Periodo" colKey="date"/></th>
                                <th className="px-3 py-3 w-40 border-l border-slate-800"><SortHeader label="Luogo" colKey="city"/></th>
                                <th className="px-3 py-3 w-28 text-center border-l border-slate-800"><SortHeader label="AI Stats" colKey="rating"/></th>
                                <th className="px-3 py-3 border-l border-slate-800">Descrizione (Hover)</th>
                                <th className="px-3 py-3 w-32 text-right border-l border-slate-800">Home Page</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {events.map((ev, idx) => {
                                const metadata = ev.metadata || {};
                                const hasAnalysis = !!metadata.rating;
                                const isBadgeActive = ev.city_badge === 'event';
                                const isUpdatingBadge = togglingBadgeId === ev.city_id;
                                const isSelected = selectedIds.has(ev.id);

                                return (
                                    <tr key={ev.id || `evt-${idx}`} className={`transition-colors group text-xs ${isSelected ? 'bg-indigo-900/10 hover:bg-indigo-900/20' : 'hover:bg-slate-800/40'}`}>
                                        <td className="px-3 py-2.5 align-middle text-center"><button onClick={() => toggleSelection(ev.id)} className="opacity-50 hover:opacity-100">{isSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5"/>}</button></td>
                                        <td className="px-3 py-2.5 align-middle"><div className="font-bold text-white truncate max-w-[240px]" title={ev.name}>{ev.name}</div></td>
                                        <td className="px-3 py-2.5 align-middle text-center border-l border-slate-800/50"><span className="text-[9px] bg-rose-900/20 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">{ev.category}</span></td>
                                        <td className="px-3 py-2.5 align-middle text-center border-l border-slate-800/50"><span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{ev.date}</span></td>
                                        <td className="px-3 py-2.5 align-middle border-l border-slate-800/50"><div className="font-bold text-indigo-300 truncate max-w-[150px]">{ev.city_name}</div></td>
                                        <td className="px-3 py-2.5 align-middle text-center border-l border-slate-800/50">{hasAnalysis ? (<div className="flex flex-col items-center gap-0.5"><div className="flex items-center gap-1 text-amber-500 font-bold leading-none"><span>{metadata.rating}</span> <Star className="w-2.5 h-2.5 fill-current"/></div><span className="text-[9px] text-slate-500 font-mono leading-none">~{formatVisitors(metadata.visitors)}</span></div>) : (<button onClick={() => handleAnalyze(ev)} disabled={analyzingId === ev.id || isBulkAnalyzing} className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded transition-colors">{analyzingId === ev.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Bot className="w-3 h-3"/>}</button>)}</td>
                                        <td className="px-3 py-2.5 align-middle border-l border-slate-800/50"><p className="text-[10px] text-slate-400 italic truncate max-w-xs cursor-help" title={metadata.summary || ev.description}>"{metadata.summary || ev.description || 'Nessuna descrizione.'}"</p></td>
                                        <td className="px-3 py-2.5 align-middle text-right border-l border-slate-800/50"><div className="flex justify-end"><button onClick={() => handleBadgeToggle(ev.city_id, ev.city_badge)} disabled={isUpdatingBadge} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-sm whitespace-nowrap ${isBadgeActive ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-600 hover:text-white'}`}>{isUpdatingBadge ? <Loader2 className="w-3 h-3 animate-spin"/> : (isBadgeActive ? <TrendingUp className="w-3 h-3"/> : <Eye className="w-3 h-3"/>)} {isBadgeActive ? 'Evidenza' : 'Metti Home'}</button></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <PaginationControls currentPage={pagination.page} maxPage={Math.ceil(pagination.total / pagination.pageSize)} onNext={() => setPagination(p => ({...p, page: p.page + 1}))} onPrev={() => setPagination(p => ({...p, page: Math.max(1, p.page - 1)}))} totalItems={pagination.total} />
            </div>
        </div>
    );
};
