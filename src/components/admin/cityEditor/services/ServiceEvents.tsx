
import React, { useState, useEffect } from 'react';
import { CalendarDays, Eye, Plus, Save, MinusCircle, Loader2, Wand2 } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { getCityEvents, saveCityEvent, deleteCityEvent } from '../../../../services/cityService';
import { suggestCityItems } from '../../../../services/ai';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { getSafeEventCategory } from '../../../../utils/common';
import { getCachedSetting, SETTINGS_KEYS } from '../../../../services/settingsService';

export const ServiceEvents = () => {
    const { city, triggerPreview, reloadCurrentCity } = useCityEditor();
    
    // LOAD FROM CACHE
    const eventList = getCachedSetting<any[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST);
    const EVENT_CANONICAL_LIST = eventList || [{ value: 'Festa Patronale', label: 'Festa Patronale' }];

    // Data State
    const [eventsList, setEventsList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
    const [aiQuery, setAiQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        if (city?.id) loadData();
    }, [city?.id, city?.updatedAt]);

    const loadData = async () => {
        if (!city?.id) return;
        setIsLoading(true);
        try {
            const data = await getCityEvents(city.id);
            setEventsList(data.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleAddEvent = async () => {
        const temp = { name: 'Nuovo Evento', date: '', category: 'Festa Patronale', description: '', location: '', coords: city!.coords, orderIndex: eventsList.length + 1 };
        await saveCityEvent(city!.id, temp);
        loadData();
        reloadCurrentCity();
    };

    const handleSaveEvent = async (event: any) => {
        await saveCityEvent(city!.id, event);
        loadData();
    };

    const handleUpdateEvent = (id: string, field: string, val: any) => {
        setEventsList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteCityEvent(deleteTarget.id);
        setDeleteTarget(null);
        loadData();
        reloadCurrentCity();
    };

    const handleReorder = async (id: string, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1) return;
        const list = [...eventsList];
        const itemIndex = list.findIndex(i => i.id === id);
        if (itemIndex === -1) return;
        const [item] = list.splice(itemIndex, 1);
        const insertIndex = Math.min(Math.max(0, newRank - 1), list.length);
        list.splice(insertIndex, 0, item);
        const updated = list.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setEventsList(updated);
        for (const p of updated) await saveCityEvent(city!.id, p);
    };
    
    const handleDiscovery = async () => {
        setIsDiscovering(true);
        try {
            const existingNames = eventsList.map(i => i.name);
            const results = await suggestCityItems(city!.name, 'events', existingNames, aiQuery, 3);
            setDiscoveryResults(results);
        } catch(e) { console.error(e); }
        finally { setIsDiscovering(false); }
    };

    const handleImport = async (item: any) => {
        if (item.category) item.category = getSafeEventCategory(item.category);
        await saveCityEvent(city!.id, { ...item, orderIndex: eventsList.length + 1 });
        setDiscoveryResults(prev => prev.filter(x => x.name !== item.name));
        loadData();
        reloadCurrentCity();
    };

    return (
        <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[600px]">
             <DeleteConfirmationModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Elimina Evento" message={`Eliminare "${deleteTarget?.name}"?`} />

            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><CalendarDays className="w-5 h-5 text-rose-500"/> Eventi</h3>
                <div className="flex gap-2">
                    <button onClick={() => triggerPreview('events', 'Eventi Locali', eventsList)} className="p-1.5 bg-slate-800 hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-400 border border-slate-700"><Eye className="w-4 h-4"/></button>
                    <button onClick={handleAddEvent} className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white shadow-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
            
            <div className="bg-rose-900/10 border border-rose-500/20 p-3 rounded-xl mb-4">
                 <div className="flex gap-2 mb-2">
                     <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Cerca eventi..." className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white"/>
                     <button onClick={handleDiscovery} disabled={isDiscovering} className="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                         {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI
                     </button>
                 </div>
                 {discoveryResults.length > 0 && (
                     <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                         {discoveryResults.map((res, idx) => (
                             <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                 <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                                 <button onClick={() => handleImport(res)} className="text-[9px] bg-slate-800 hover:bg-rose-600 text-white px-2 py-1 rounded">Importa</button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {isLoading ? <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500"/></div> :
                eventsList.map((evt, idx) => (
                    <div key={evt.id || `evt-item-${idx}`} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2">
                        <div className="w-12 shrink-0">
                            <input type="number" min="1" value={evt.orderIndex || idx + 1} onChange={(e) => handleReorder(evt.id, e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1"/>
                        </div>
                        <div className="flex-1">
                            <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => handleSaveEvent(evt)} className="text-emerald-500 hover:text-white p-1"><Save className="w-4 h-4"/></button>
                                    <button onClick={() => setDeleteTarget({ id: evt.id, name: evt.name })} className="text-slate-600 hover:text-red-500 p-1"><MinusCircle className="w-4 h-4"/></button>
                            </div>
                            <input value={evt.name} onChange={e => handleUpdateEvent(evt.id, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-rose-500 pb-1" placeholder="Nome Evento"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={evt.date} onChange={e => handleUpdateEvent(evt.id, 'date', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Data"/>
                                <select value={evt.category} onChange={e => handleUpdateEvent(evt.id, 'category', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full">
                                    {EVENT_CANONICAL_LIST.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
