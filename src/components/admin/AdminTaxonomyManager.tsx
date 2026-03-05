import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Search, Save, RefreshCw, X, Edit2, CheckCircle, Loader2, FileDown, CalendarDays, MapPin } from 'lucide-react';
import { getTaxonomyRules, addTaxonomyRule, updateTaxonomyRule, deleteTaxonomyRule, TaxonomyRule } from '../../services/taxonomyService';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAdminExport } from '../../hooks/useAdminExport'; 
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

// OPZIONI PER POI
const POI_TAB_OPTIONS = [
    { value: 'destinazioni', label: 'Destinazioni (Monumenti)' },
    { value: 'sapori', label: 'Sapori (Cibo)' },
    { value: 'alloggi', label: 'Alloggi (Hotel)' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'svago', label: 'Svago & Nightlife' },
    { value: 'natura', label: 'Natura & Relax' },
    { value: 'novita', label: 'Novità' }
];

// OPZIONI PER EVENTI
const EVENT_TAB_OPTIONS = [
    { value: 'eventi', label: 'Eventi (Standard)' }
];

export const AdminTaxonomyManager = () => {
    const [rules, setRules] = useState<TaxonomyRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // FETCH EVENT OPTIONS FROM CACHE
    const eventList = getCachedSetting<any[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST);
    const EVENT_CATEGORY_OPTIONS = (eventList || []).map(e => ({ value: e.value, label: e.label }));
    
    // FETCH POI CATEGORIES DYNAMICALLY FROM CACHE
    const poiStructure = getCachedSetting<Record<string, any>>(SETTINGS_KEYS.POI_STRUCTURE);
    const POI_CATEGORY_OPTIONS = Object.keys(poiStructure || {}).map(key => ({
        value: key,
        label: key.charAt(0).toUpperCase() + key.slice(1) // Simple capitalisation fallback
    }));
    // Add missing options if DB is empty or partial
    if (POI_CATEGORY_OPTIONS.length === 0) {
        POI_CATEGORY_OPTIONS.push(
            { value: 'monument', label: 'Monument' },
            { value: 'food', label: 'Food' },
            { value: 'nature', label: 'Nature' },
            { value: 'leisure', label: 'Leisure' },
            { value: 'shop', label: 'Shop' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'discovery', label: 'Discovery' }
        );
    }

    const [activeContext, setActiveContext] = useState<'poi' | 'event'>('poi');
    const { exportTaxonomyCsv, isExporting } = useAdminExport();
    
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [term, setTerm] = useState('');
    const [cat, setCat] = useState('');
    const [sub, setSub] = useState('');
    const [tab, setTab] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, term: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadRules();
    }, [activeContext]);

    useEffect(() => {
        if (activeContext === 'poi') {
            setCat(POI_CATEGORY_OPTIONS[0]?.value || 'monument');
            setTab('destinazioni');
        } else {
            setCat('Festa Patronale');
            setTab('eventi');
        }
    }, [activeContext]);

    const loadRules = async () => {
        setIsLoading(true);
        const data = await getTaxonomyRules(activeContext);
        setRules(data);
        setIsLoading(false);
    };

    const resetForm = () => {
        setTerm('');
        setSub('');
        setFormMode('add');
        setEditingId(null);
        if (activeContext === 'poi') {
            setCat(POI_CATEGORY_OPTIONS[0]?.value || 'monument');
            setTab('destinazioni');
        } else {
            setCat('Festa Patronale');
            setTab('eventi');
        }
    };

    const handleEdit = (rule: TaxonomyRule) => {
        setTerm(rule.inputTerm);
        setCat(rule.category);
        setSub(rule.subCategory);
        setTab(rule.targetTab);
        setEditingId(rule.id);
        setFormMode('edit');
        const formEl = document.getElementById('taxonomy-form');
        if(formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!term) { alert("Inserisci il termine originale."); return; }
        const finalSub = sub || (activeContext === 'event' ? 'generic' : '');
        if (activeContext === 'poi' && !finalSub) { alert("Sottocategoria obbligatoria per POI."); return; }
        
        let success = false;
        if (formMode === 'add') {
             success = await addTaxonomyRule(term, cat, finalSub, tab, activeContext);
        } else if (formMode === 'edit' && editingId) {
             success = await updateTaxonomyRule(editingId, term, cat, finalSub, tab, activeContext);
        }

        if (success) {
            resetForm();
            loadRules();
        } else {
            alert("Errore salvataggio (forse termine duplicato nel contesto?)");
        }
    };

    const handleDeleteRequest = (rule: TaxonomyRule) => {
        setDeleteTarget({ id: rule.id, term: rule.inputTerm });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteTaxonomyRule(deleteTarget.id);
            setRules(prev => prev.filter(r => r.id !== deleteTarget.id));
            if (editingId === deleteTarget.id) resetForm();
            setDeleteTarget(null);
        } catch (e) {
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRules = rules.filter(r => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            r.inputTerm.toLowerCase().includes(lowerSearch) ||
            r.category.toLowerCase().includes(lowerSearch) ||
            r.subCategory.toLowerCase().includes(lowerSearch) ||
            r.targetTab.toLowerCase().includes(lowerSearch)
        );
    });

    const currentCatOptions = activeContext === 'poi' ? POI_CATEGORY_OPTIONS : EVENT_CATEGORY_OPTIONS;
    const currentTabOptions = activeContext === 'poi' ? POI_TAB_OPTIONS : EVENT_TAB_OPTIONS;

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in p-6 relative">
            <DeleteConfirmationModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Eliminare Regola?" message={`Stai per eliminare la mappatura per "${deleteTarget?.term}".`} isDeleting={isDeleting} />
             <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={loadRules} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white border border-slate-700"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/></button>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button onClick={() => setActiveContext('poi')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeContext === 'poi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><MapPin className="w-3.5 h-3.5"/> Luoghi (POI)</button>
                        <button onClick={() => setActiveContext('event')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeContext === 'event' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><CalendarDays className="w-3.5 h-3.5"/> Eventi</button>
                    </div>
                    <div className="relative w-72 ml-4"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Cerca regole...`} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 outline-none"/></div>
                </div>
                <div className="flex items-center gap-4"><button onClick={() => exportTaxonomyCsv(activeContext)} disabled={isExporting} className="bg-slate-800 hover:bg-emerald-900/30 text-slate-300 hover:text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors">{isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4"/>} Esporta CSV</button><div className="text-slate-500 text-xs font-mono">{filteredRules.length} Regole</div></div>
            </div>

            <div id="taxonomy-form" className={`p-5 rounded-2xl border shadow-xl transition-all ${formMode === 'edit' ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex justify-between items-center mb-4"><h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${formMode === 'edit' ? 'text-indigo-400' : 'text-slate-400'}`}>{formMode === 'edit' ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} {formMode === 'edit' ? 'Modifica Regola' : 'Nuova Regola'} <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-slate-500 ml-2">CONTESTO: {activeContext.toUpperCase()}</span></h3>{formMode === 'edit' && (<button onClick={resetForm} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg"><X className="w-3 h-3"/> Annulla</button>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Termine Originale (AI)</label><input value={term} onChange={e => setTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none font-bold" placeholder={activeContext === 'poi' ? 'Es. "Scavi", "Rovine"' : 'Es. "Patronale", "Processione"'}/></div>
                    <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Macro Categoria (DB)</label><select value={cat} onChange={e => setCat(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 outline-none cursor-pointer">{currentCatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                    <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Sottocategoria (DB)</label><input value={sub} onChange={e => setSub(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none font-mono" placeholder={activeContext === 'poi' ? 'Es. "archaeology"' : 'Es. "religious"'}/></div>
                    <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tab Destinazione (UI)</label><select value={tab} onChange={e => setTab(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 outline-none cursor-pointer font-bold">{currentTabOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                </div>
                <div className="mt-4 flex justify-end"><button onClick={handleSubmit} disabled={!term || (activeContext === 'poi' && !sub)} className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${formMode === 'edit' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>{formMode === 'edit' ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} {formMode === 'edit' ? 'Salva Modifiche' : 'Aggiungi Regola'}</button></div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-slate-800">
                            <tr><th className="p-4 w-1/4">Termine Originale (AI)</th><th className="p-4 w-1/5">Macro Cat. (DB)</th><th className="p-4 w-1/5">Sottocategoria (DB)</th><th className="p-4 w-1/5">Tab Destinazione (UI)</th><th className="p-4 text-right">Azioni</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {filteredRules.map(rule => (
                                <tr key={rule.id} className={`transition-colors ${editingId === rule.id ? 'bg-indigo-900/20' : 'hover:bg-slate-800/50'}`}>
                                    <td className="p-4 font-bold text-white">{rule.inputTerm}</td>
                                    <td className="p-4 text-slate-400 font-mono text-xs">{rule.category}</td>
                                    <td className="p-4 font-mono text-cyan-400 font-bold">{rule.subCategory}</td>
                                    <td className="p-4"><span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase border border-slate-700">{rule.targetTab}</span></td>
                                    <td className="p-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => handleEdit(rule)} className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteRequest(rule)} className="p-2 hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4"/></button></div></td>
                                </tr>
                            ))}
                            {filteredRules.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">Nessuna regola trovata nel contesto "{activeContext.toUpperCase()}".</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};