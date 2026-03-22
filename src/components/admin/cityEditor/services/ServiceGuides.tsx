
import React, { useState, useEffect } from 'react';
import { UserCheck, Eye, Plus, Save, MinusCircle, Loader2, Wand2 } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { getCityGuides, saveCityGuide, deleteCityGuide } from '../../../../services/cityService';
import { suggestCityItems } from '../../../../services/ai';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

export const ServiceGuides = () => {
    const { city, triggerPreview, reloadCurrentCity } = useCityEditor();
    
    // Data State
    const [guidesList, setGuidesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // AI State (Standardized Name)
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
    const [aiQuery, setAiQuery] = useState('');
    
    // Delete State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        if (city?.id) loadData();
    }, [city?.id, city?.updatedAt]);

    const loadData = async () => {
        if (!city?.id) return;
        setIsLoading(true);
        try {
            const data = await getCityGuides(city.id);
            setGuidesList(data.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    // CRUD Operations
    const handleAddGuide = async () => {
        const temp = { name: 'Nuova Guida', isOfficial: true, languages: ['IT'], specialties: [], orderIndex: guidesList.length + 1 };
        await saveCityGuide(city!.id, temp);
        loadData();
        reloadCurrentCity();
    };

    const handleSaveGuide = async (guide: any) => {
        await saveCityGuide(city!.id, guide);
        loadData();
    };

    const handleUpdateGuide = (id: string, field: string, val: any) => {
        setGuidesList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteCityGuide(deleteTarget.id);
        setDeleteTarget(null);
        loadData();
        reloadCurrentCity();
    };

    const handleReorder = async (id: string, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1) return;
        
        const list = [...guidesList];
        const itemIndex = list.findIndex(i => i.id === id);
        if (itemIndex === -1) return;
        
        const [item] = list.splice(itemIndex, 1);
        const insertIndex = Math.min(Math.max(0, newRank - 1), list.length);
        list.splice(insertIndex, 0, item);
        
        // Update Indexes locally
        const updated = list.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setGuidesList(updated);
        
        // Save All to DB
        for (const p of updated) await saveCityGuide(city!.id, p);
    };

    // AI Logic
    const handleDiscovery = async () => {
        setIsDiscovering(true);
        try {
            const existingNames = guidesList.map(i => i.name);
            const results = await suggestCityItems(city!.name, 'guides', existingNames, aiQuery, 3);
            setDiscoveryResults(results);
        } catch(e) { console.error(e); }
        finally { setIsDiscovering(false); }
    };

    const handleImport = async (item: any) => {
        await saveCityGuide(city!.id, { ...item, orderIndex: guidesList.length + 1 });
        setDiscoveryResults(prev => prev.filter(x => x.name !== item.name));
        loadData();
        reloadCurrentCity();
    };

    return (
        <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[600px]">
            <DeleteConfirmationModal 
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Elimina Guida"
                message={`Eliminare "${deleteTarget?.name}"?`}
            />

            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><UserCheck className="w-5 h-5 text-emerald-500"/> Guide</h3>
                <div className="flex gap-2">
                    {/* UPDATED: Passa 'guides' come tipo specifico per aprire il CityInfoModal corretto */}
                    <button onClick={() => triggerPreview('guides', 'Guide Turistiche', guidesList)} className="p-1.5 bg-slate-800 hover:bg-emerald-900/30 rounded text-slate-400 hover:text-emerald-400 border border-slate-700"><Eye className="w-4 h-4"/></button>
                    <button onClick={handleAddGuide} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white shadow-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>

            {/* AI Discovery Box */}
            <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-xl mb-4">
                 <div className="flex gap-2 mb-2">
                     <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Cerca guide..." className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white"/>
                     <button onClick={handleDiscovery} disabled={isDiscovering} className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                         {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI
                     </button>
                 </div>
                 {discoveryResults.length > 0 && (
                     <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                         {discoveryResults.map((res, idx) => (
                             <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                 <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                                 <button onClick={() => handleImport(res)} className="text-[9px] bg-slate-800 hover:bg-emerald-600 text-white px-2 py-1 rounded">Importa</button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {isLoading ? <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500"/></div> : 
                guidesList.map((guide, idx) => (
                    // FIX: Robust key with fallback
                    <div key={guide.id || `guide-item-${idx}`} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2">
                        <div className="w-12 shrink-0">
                            <input 
                                type="number" 
                                min="1"
                                value={guide.orderIndex || idx + 1} 
                                onChange={(e) => handleReorder(guide.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => handleSaveGuide(guide)} className="text-emerald-500 hover:text-white p-1"><Save className="w-4 h-4"/></button>
                                    <button onClick={() => setDeleteTarget({ id: guide.id, name: guide.name })} className="text-slate-600 hover:text-red-500 p-1"><MinusCircle className="w-4 h-4"/></button>
                            </div>
                            <input value={guide.name} onChange={e => handleUpdateGuide(guide.id, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-emerald-500 pb-1" placeholder="Nome Guida"/>
                            <div className="grid grid-cols-2 gap-2 mt-2"><input value={guide.phone || ''} onChange={e => handleUpdateGuide(guide.id, 'phone', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Telefono"/><input value={guide.email || ''} onChange={e => handleUpdateGuide(guide.id, 'email', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Email"/></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
