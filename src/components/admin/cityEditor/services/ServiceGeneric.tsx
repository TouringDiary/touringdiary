
import React, { useState, useEffect } from 'react';
import { Plus, MinusCircle, Save, Loader2, Eye } from 'lucide-react';
import { useCityEditor } from '../../../../context/CityEditorContext';
import { getCityServices, saveCityService, deleteCityService } from '../../../../services/cityService';
import { getServicesConfig, SERVICE_TYPE_MAPPING, getBoxIdForType } from '../../../../constants/services';
import { getSafeServiceType } from '../../../../utils/common';
import { ServiceAiHunter } from '../../../modals/cityInfo/ServiceAiHunter';
import { suggestCityItems } from '../../../../services/ai';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

export const ServiceGeneric = () => {
    const { city, triggerPreview, reloadCurrentCity } = useCityEditor();
    
    // Recupera config dinamica
    const SERVICE_BOXES = getServicesConfig();
    
    // Data State
    const [servicesList, setServicesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // AI Hunter State (Renamed to match standard)
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [serviceResults, setServiceResults] = useState<any[]>([]);
    const [serviceQuery, setServiceQuery] = useState('');
    const [discoveryCount, setDiscoveryCount] = useState(3);
    const [serviceTarget, setServiceTarget] = useState('generic');
    
    // Delete State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        if (city?.id) loadData();
    }, [city?.id, city?.updatedAt]);

    const loadData = async () => {
        if (!city?.id) return;
        setIsLoading(true);
        try {
            const data = await getCityServices(city.id);
            // Filtra solo quelli non tour_operator/agency
            const general = data.filter(i => i.type !== 'tour_operator' && i.type !== 'agency')
                                .sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setServicesList(general);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    // CRUD Operations
    const handleAddService = async (boxId: string) => {
        const defaultType = SERVICE_TYPE_MAPPING[boxId]?.types[0]?.val || 'other';
        const temp = { name: 'Nuovo Servizio', type: defaultType, contact: '', category: 'Utilità', description: '', url: '', address: '', orderIndex: servicesList.length + 1 };
        await saveCityService(city!.id, temp);
        loadData();
        reloadCurrentCity();
    };

    const handleSave = async (item: any) => {
        await saveCityService(city!.id, item);
        loadData();
    };

    const handleUpdate = (id: string, field: string, val: any) => {
        setServicesList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteCityService(deleteTarget.id);
        setDeleteTarget(null);
        loadData();
        reloadCurrentCity();
    };
    
    const handleReorder = async (id: string, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1) return;
        
        const list = [...servicesList];
        const itemIndex = list.findIndex(i => i.id === id);
        if (itemIndex === -1) return;
        
        const [item] = list.splice(itemIndex, 1);
        const insertIndex = Math.min(Math.max(0, newRank - 1), list.length);
        list.splice(insertIndex, 0, item);
        
        const updated = list.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setServicesList(updated);
        
        for (const p of updated) await saveCityService(city!.id, p);
    };

    const getServicesForBox = (boxId: string) => {
        return servicesList
            .filter(s => getBoxIdForType(s.type) === boxId)
            .sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    };

    // AI Hunter Logic
    const handleDiscovery = async () => {
        setIsDiscovering(true); // FIXED: Using standardized setter
        let finalContext = '';
        if (serviceTarget !== 'generic') {
             const targetLabel = SERVICE_BOXES.find(b => b.id === serviceTarget)?.label;
             if (targetLabel) finalContext = `Trova SOLO servizi di tipo: ${targetLabel}. `;
        }
        
        try {
            const existingNames = servicesList.map(i => i.name);
            const results = await suggestCityItems(city!.name, 'services', existingNames, finalContext + serviceQuery, discoveryCount);
            setServiceResults(results);
        } catch(e) { console.error(e); }
        finally { setIsDiscovering(false); } // FIXED
    };

    const handleImport = async (item: any) => {
        if (item.type) item.type = getSafeServiceType(item.type);
        await saveCityService(city!.id, { ...item, orderIndex: servicesList.length + 1 });
        setServiceResults(prev => prev.filter(x => x.name !== item.name));
        loadData();
        reloadCurrentCity();
    };

    if (isLoading) return <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;

    return (
        <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl">
            <DeleteConfirmationModal 
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Elimina Servizio"
                message={`Eliminare "${deleteTarget?.name}"?`}
            />
            
            {/* Header con Anteprima */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg">Servizi Essenziali</h3>
                <button 
                    // UPDATED: Passa 'services' e la lista corrente
                    onClick={() => triggerPreview('services', 'Servizi Pubblici', servicesList)} 
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                >
                    <Eye className="w-4 h-4"/> Anteprima
                </button>
            </div>

            <ServiceAiHunter 
                serviceTarget={serviceTarget} onServiceTargetChange={setServiceTarget}
                discoveryCount={discoveryCount} onDiscoveryCountChange={setDiscoveryCount}
                serviceQuery={serviceQuery} onServiceQueryChange={setServiceQuery}
                discoveringServices={isDiscovering} // FIXED: Passing state correctly
                onDiscovery={handleDiscovery}
                serviceResults={serviceResults} onImport={handleImport}
                onRemoveResult={(name) => setServiceResults(prev => prev.filter(x => x.name !== name))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SERVICE_BOXES.map((box) => (
                    <div key={box.id} className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col h-[350px] overflow-hidden">
                        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-2 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <box.icon className={`w-4 h-4 ${box.color}`}/>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide truncate max-w-[120px]">{box.label}</span>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={() => handleAddService(box.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-md text-[10px] font-bold uppercase flex items-center gap-1">
                                    <Plus className="w-3 h-3"/> Nuovo
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {getServicesForBox(box.id).map((svc, idx) => (
                                // FIX: Use robust key (id or unique string)
                                <div key={svc.id || `svc-item-${box.id}-${idx}`} className="bg-slate-900 p-3 rounded-lg border border-slate-800 group relative hover:border-slate-700 transition-colors flex gap-2 items-start">
                                    <div className="w-8 shrink-0">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={svc.orderIndex || idx + 1} 
                                            onChange={(e) => handleReorder(svc.id!, e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-white text-xs font-bold py-1"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-end gap-2 mb-2 border-b border-slate-800 pb-1">
                                                <button onClick={() => handleSave(svc)} className="text-emerald-500 hover:text-white p-1 hover:bg-slate-800 rounded"><Save className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => setDeleteTarget({ id: svc.id!, name: svc.name })} className="text-slate-600 hover:text-red-500 p-1 hover:bg-slate-800 rounded"><MinusCircle className="w-3.5 h-3.5"/></button>
                                        </div>
                                        <div className="mb-2">
                                                <select 
                                                    value={svc.type} 
                                                    onChange={(e) => handleUpdate(svc.id!, 'type', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 uppercase font-bold text-left"
                                                >
                                                    {Object.entries(SERVICE_TYPE_MAPPING).map(([key, rawGroup]) => {
                                                        const group = rawGroup as { label: string; types: { val: string; label: string }[] };
                                                        return (
                                                            <optgroup key={key} label={group.label}>
                                                                {group.types.map(t => (
                                                                    <option key={t.val} value={t.val}>{t.label}</option>
                                                                ))}
                                                            </optgroup>
                                                        );
                                                    })}
                                                </select>
                                        </div>
                                        <input value={svc.name} onChange={e => handleUpdate(svc.id!, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none text-xs border-b border-transparent focus:border-blue-500 pb-0.5 mb-1 text-left" placeholder="Nome..."/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
