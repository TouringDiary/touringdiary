
import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, CalendarDays, Eye, Plus, MinusCircle, Check, X, Wand2, Loader2, Bus, Save, CheckCircle, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { useCityEditor } from '../../../context/CityEditorContext';
import { suggestCityItems, refineServiceData } from '../../../services/ai';
import { getCityEvents, saveCityEvent, deleteCityEvent, getCityServices, saveCityService, deleteCityService, getCityGuides, saveCityGuide, deleteCityGuide } from '../../../services/cityService';
import { getServicesConfig, SERVICE_TYPE_MAPPING, getBoxIdForType } from '../../../constants/services';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { getSafeServiceType, getSafeEventCategory } from '../../../utils/common';
import { useSystemMessage } from '../../../hooks/useSystemMessage'; 
import { ServiceAiHunter } from '../../modals/cityInfo/ServiceAiHunter';

export const EditorInfo = () => {
    const { city, triggerPreview, reloadCurrentCity } = useCityEditor();
    
    // Recupera config dinamica
    const SERVICE_BOXES = getServicesConfig();
    
    // --- LOCAL ASYNC DATA STATES ---
    const [guidesList, setGuidesList] = useState<any[]>([]);
    const [eventsList, setEventsList] = useState<any[]>([]);
    const [servicesList, setServicesList] = useState<any[]>([]);
    const [tourOperatorsList, setTourOperatorsList] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // AI & UI STATES
    const [discoveringGuides, setDiscoveringGuides] = useState(false);
    const [guideResults, setGuideResults] = useState<any[]>([]);
    const [guideQuery, setGuideQuery] = useState('');

    const [discoveringEvents, setDiscoveringEvents] = useState(false);
    const [eventResults, setEventResults] = useState<any[]>([]);
    const [eventQuery, setEventQuery] = useState('');
    
    const [discoveringOperators, setDiscoveringOperators] = useState(false);
    const [operatorResults, setOperatorResults] = useState<any[]>([]);
    const [operatorQuery, setOperatorQuery] = useState('');

    const [discoveringServices, setDiscoveringServices] = useState(false);
    const [serviceResults, setServiceResults] = useState<any[]>([]);
    const [serviceQuery, setServiceQuery] = useState('');
    
    const [discoveryCount, setDiscoveryCount] = useState<number>(3);
    const [serviceTarget, setServiceTarget] = useState<string>('generic'); 
    
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [genStatus, setGenStatus] = useState<string>('');
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);

    // SYSTEM MESSAGE HOOK (DB TEXT ONLY)
    const { getText: getRegenMessage } = useSystemMessage('city_regen_merge');
    const regenMsg = getRegenMessage();

    // LOAD DATA ON MOUNT
    const loadData = async () => {
        if (!city?.id) return;
        setIsLoadingData(true);
        try {
            const [g, e, s] = await Promise.all([
                getCityGuides(city.id),
                getCityEvents(city.id),
                getCityServices(city.id)
            ]);
            
            // Ordina per index se presente
            const sortedG = g.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            const sortedE = e.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            const sortedS = s.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));

            setGuidesList(sortedG);
            setEventsList(sortedE);
            
            // Split services into general and tour operators
            const generalServices = sortedS.filter(i => i.type !== 'tour_operator' && i.type !== 'agency');
            const ops = sortedS.filter(i => i.type === 'tour_operator' || i.type === 'agency');
            
            setServicesList(generalServices);
            setTourOperatorsList(ops);
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [city?.id]);
    
    if (!city) return null;

    // --- CORE LOGIC: MASSIVE REGENERATION (REAL IMPLEMENTATION) ---
    const handleRegenerateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!city.name) { alert("Inserisci il nome della città!"); return; }
        setShowConfirmRegen(true);
    };

    const executeRegeneration = async () => {
        setShowConfirmRegen(false);
        setGenerating(true);
        setGenStatus("Inizializzazione pulizia dati...");

        try {
            // NOTE: DO NOT DELETE EXISTING YET. WE MERGE FIRST.
            
            // 2. FASE DISCOVERY (FLASH) - RACCOLTA MATERIALE NUOVO
            setGenStatus("Discovery Veloce (Flash) - Raccolta nuovi dati...");
            
            // Existing Names to exclude from direct flash query to promote diversity
            const existG = guidesList.map(i => i.name);
            const existE = eventsList.map(i => i.name);
            const existO = tourOperatorsList.map(i => i.name);
            const existS = servicesList.map(i => i.name);

            const [rawGuides, rawEvents, rawOperators, rawServices] = await Promise.all([
                suggestCityItems(city.name, 'guides', existG, '', 5),
                suggestCityItems(city.name, 'events', existE, '', 5),
                suggestCityItems(city.name, 'tour_operators', existO, '', 4),
                suggestCityItems(city.name, 'services', existS, '', 8)
            ]);
            
            // 3. FASE REFINEMENT (GEMINI PRO) - MERGE, BONIFICA E GAP FILLING
            setGenStatus("Analisi Profonda (Gemini Pro): Merge, Bonifica e Gap Filling...");
            
            // Prepare mixed input for Pro
            const mixedInput = {
                guides: [...guidesList, ...rawGuides],
                events: [...eventsList, ...rawEvents],
                tour_operators: [...tourOperatorsList, ...rawOperators],
                services: [...servicesList, ...rawServices]
            };

            const refinedData = await refineServiceData(city.name, mixedInput);

            // 4. CANCELLAZIONE DATI OBSOLETI (SOLO ORA CHE ABBIAMO I NUOVI)
            setGenStatus("Sincronizzazione Database...");
            await Promise.all([
                ...guidesList.map(g => deleteCityGuide(g.id)),
                ...eventsList.map(e => deleteCityEvent(e.id)),
                ...servicesList.map(s => deleteCityService(s.id)),
                ...tourOperatorsList.map(t => deleteCityService(t.id))
            ]);

            // 5. SALVATAGGIO DATI PULITI
            setGenStatus("Salvataggio dati certificati...");
            const savePromises: Promise<any>[] = [];

            // SAVE GUIDES
            if (refinedData.guides && Array.isArray(refinedData.guides)) {
                refinedData.guides.forEach((g: any, i: number) => {
                    if (g && g.name) {
                        savePromises.push(saveCityGuide(city.id, { ...g, orderIndex: i + 1 }));
                    }
                });
            }

            // SAVE EVENTS
            if (refinedData.events && Array.isArray(refinedData.events)) {
                refinedData.events.forEach((e: any, i: number) => {
                    if (e && e.name) {
                        e.category = getSafeEventCategory(e.category || '');
                        savePromises.push(saveCityEvent(city.id, { ...e, orderIndex: i + 1 }));
                    }
                });
            }

            // SAVE OPERATORS
            if (refinedData.tour_operators && Array.isArray(refinedData.tour_operators)) {
                refinedData.tour_operators.forEach((op: any, i: number) => {
                    if (op && op.name) {
                        op.type = 'tour_operator';
                        savePromises.push(saveCityService(city.id, { ...op, orderIndex: i + 1 }));
                    }
                });
            }

            // SAVE SERVICES
            if (refinedData.services && Array.isArray(refinedData.services)) {
                refinedData.services.forEach((s: any, i: number) => {
                    if (s && s.name) {
                        s.type = getSafeServiceType(s.type || s.category || s.name || ''); 
                        savePromises.push(saveCityService(city.id, { ...s, orderIndex: i + 1 }));
                    }
                });
            }

            await Promise.all(savePromises);
            
            await reloadCurrentCity();
            await loadData();
            
            setSuccessMessage("Rigenerazione e Bonifica completate!");
            setTimeout(() => setSuccessMessage(null), 3000);
            
        } catch (err: any) {
            console.error("Errore rigenerazione:", err);
            setSuccessMessage(`Errore critico: ${err.message}`);
        } finally {
            setGenerating(false);
            setGenStatus('');
        }
    };

    const handleDiscovery = async (type: 'guides' | 'events' | 'services' | 'tour_operators') => {
        let setter: any, resultSetter: any, existing: any[], query: string;
        let finalContext = '';
        
        if (type === 'guides') { setter = setDiscoveringGuides; resultSetter = setGuideResults; existing = guidesList; query = guideQuery; } 
        else if (type === 'events') { setter = setDiscoveringEvents; resultSetter = setEventResults; existing = eventsList; query = eventQuery; }
        else if (type === 'tour_operators') { setter = setDiscoveringOperators; resultSetter = setOperatorResults; existing = tourOperatorsList; query = operatorQuery; }
        else { 
            setter = setDiscoveringServices; 
            resultSetter = setServiceResults; 
            existing = servicesList; 
            query = serviceQuery;
            if (serviceTarget !== 'generic') {
                const targetLabel = SERVICE_BOXES.find(b => b.id === serviceTarget)?.label;
                if (targetLabel) finalContext = `Trova SOLO servizi di tipo: ${targetLabel}. `;
            }
        }
        
        const currentDisplayed = (type === 'guides' ? guideResults : type === 'events' ? eventResults : type === 'tour_operators' ? operatorResults : serviceResults).map((i:any) => i.name);
        const allExcluded = [...existing.map((i:any) => i.name), ...currentDisplayed];

        setter(true);
        try {
            const results = await suggestCityItems(city.name, type, allExcluded, finalContext + query, discoveryCount);
            resultSetter(results);
        } catch(e) { console.error(e); }
        finally { setter(false); }
    };

    const handleImport = async (type: 'guides' | 'events' | 'services' | 'tour_operators', item: any) => {
        // Sanitizzazione anche per import singolo
        if (type === 'services' && item.type) {
             item.type = getSafeServiceType(item.type);
        }
        if (type === 'events' && item.category) {
            item.category = getSafeEventCategory(item.category);
        }
        
        if (type === 'tour_operators') item.type = 'tour_operator';

        if (type === 'guides') {
             const saved = await saveCityGuide(city.id, { ...item, orderIndex: guidesList.length + 1 });
             if(saved) setGuidesList(prev => [...prev, saved]);
             setGuideResults(prev => prev.filter(x => x.name !== item.name));
        } else if (type === 'events') {
             const saved = await saveCityEvent(city.id, { ...item, orderIndex: eventsList.length + 1 });
             if(saved) setEventsList(prev => [...prev, saved]);
             setEventResults(prev => prev.filter(x => x.name !== item.name));
        } else if (type === 'tour_operators') {
             const saved = await saveCityService(city.id, { ...item, orderIndex: tourOperatorsList.length + 1 });
             if(saved) {
                 setTourOperatorsList(prev => [...prev, saved]);
                 setSuccessMessage('Operatore importato!');
                 setTimeout(() => setSuccessMessage(null), 1500);
             }
             setOperatorResults(prev => prev.filter(x => x.name !== item.name));
        } else {
             const saved = await saveCityService(city.id, { ...item, orderIndex: servicesList.length + 1 });
             if(saved) setServicesList(prev => [...prev, saved]);
             setServiceResults(prev => prev.filter(x => x.name !== item.name));
        }
        reloadCurrentCity();
    };

    // REORDERING GENERICO
    const handleReorderItem = async (listType: 'guide' | 'event' | 'service' | 'operator', id: string, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1) return;
        const index = newRank - 1;

        let currentList: any[] = [];
        let setList: any;
        let saveFn: any;

        if (listType === 'guide') { currentList = [...guidesList]; setList = setGuidesList; saveFn = saveCityGuide; }
        else if (listType === 'event') { currentList = [...eventsList]; setList = setEventsList; saveFn = saveCityEvent; }
        else if (listType === 'service') { currentList = [...servicesList]; setList = setServicesList; saveFn = saveCityService; }
        else { currentList = [...tourOperatorsList]; setList = setTourOperatorsList; saveFn = saveCityService; }

        const itemIndex = currentList.findIndex(i => i.id === id);
        if (itemIndex === -1) return;
        if (index >= currentList.length) return; 

        // Rimuovi e reinserisci
        const [item] = currentList.splice(itemIndex, 1);
        currentList.splice(index, 0, item);

        // Ricalcola indici
        const updatedList = currentList.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setList(updatedList);

        // Salva DB
        for (const p of updatedList) {
             await saveFn(city.id, p);
        }
    };

    // MANUAL CRUD
    const handleAddGuide = async () => {
        const temp = { name: 'Nuova Guida', isOfficial: true, languages: ['IT'], specialties: [], orderIndex: guidesList.length + 1 };
        const saved = await saveCityGuide(city.id, temp);
        if(saved) {
             setGuidesList(prev => [...prev, saved]);
             reloadCurrentCity();
        }
    };
    const handleDeleteGuide = async (id: string) => {
        await deleteCityGuide(id);
        setGuidesList(prev => prev.filter(p => p.id !== id));
        reloadCurrentCity();
    };
    const handleUpdateGuide = (id: string, field: string, val: any) => {
        setGuidesList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };
    const handleSaveGuide = async (guide: any) => {
        await saveCityGuide(city.id, guide);
        setSuccessMessage("Guida salvata!");
        reloadCurrentCity();
    };

    // ... Simili per Eventi e Servizi ...
    const handleAddEvent = async () => {
        const temp = { name: 'Nuovo Evento', date: '', category: 'Festa Patronale', description: '', location: '', coords: city.coords, orderIndex: eventsList.length + 1 };
        const saved = await saveCityEvent(city.id, temp);
        if(saved) {
             setEventsList(prev => [...prev, saved]);
             reloadCurrentCity();
        }
    };
    const handleDeleteEvent = async (id: string) => {
        await deleteCityEvent(id);
        setEventsList(prev => prev.filter(p => p.id !== id));
        reloadCurrentCity();
    };
    const handleUpdateEvent = (id: string, field: string, val: any) => {
        setEventsList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };
    const handleSaveEvent = async (event: any) => {
        await saveCityEvent(city.id, event);
        setSuccessMessage("Evento salvato!");
        reloadCurrentCity();
    };

    const handleAddService = async (boxId: string) => {
        // ... (Default type logic)
        const defaultType = SERVICE_TYPE_MAPPING[boxId]?.types[0]?.val || 'other';
        const temp = { name: 'Nuovo Servizio', type: defaultType, contact: '', category: 'Utilità', description: '', url: '', address: '', orderIndex: servicesList.length + 1 };
        const saved = await saveCityService(city.id, temp);
        if(saved) {
             setServicesList(prev => [...prev, saved]);
             reloadCurrentCity();
        }
    };
    
    const handleAddTourOperator = async () => {
        const temp = { name: 'Nuova Agenzia', type: 'tour_operator', contact: '', category: 'Tour', description: '', url: '', address: '', orderIndex: tourOperatorsList.length + 1 };
        const saved = await saveCityService(city.id, temp);
        if(saved) {
             setTourOperatorsList(prev => [...prev, saved]);
             reloadCurrentCity();
        }
    }

    const handleDeleteService = async (id: string, isOperator: boolean = false) => {
        await deleteCityService(id);
        if (isOperator) setTourOperatorsList(prev => prev.filter(p => p.id !== id));
        else setServicesList(prev => prev.filter(p => p.id !== id));
        reloadCurrentCity();
    };
    
    const handleUpdateService = (id: string, field: string, val: any, isOperator: boolean = false) => {
        if (isOperator) setTourOperatorsList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
        else setServicesList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };
    
    const handleSaveService = async (service: any) => {
        await saveCityService(city.id, service);
        setSuccessMessage("Servizio salvato!");
        reloadCurrentCity();
    };

    const getServicesForBox = (boxId: string) => {
        // Ordina i servizi di questo box per index
        return servicesList
            .filter(s => getBoxIdForType(s.type) === boxId)
            .sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    };
    
    const EVENT_CATEGORIES = ["Festa Patronale", "Sagra", "Concerto", "Mostra D'Arte", "Mercatino", "Evento Religioso", "Festival Musicale", "Festival Internazionale", "Evento Sportivo", "Teatro", "Notte Bianca", "Altro"];

    if (isLoadingData) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in">
             
             {/* CONFIRMATION MODAL - NO FALLBACKS */}
             {showConfirmRegen && (
                <DeleteConfirmationModal 
                    isOpen={true}
                    onClose={() => setShowConfirmRegen(false)}
                    onConfirm={executeRegeneration}
                    // REQUIRING DB DATA TO DISPLAY TEXT
                    title={regenMsg.title} 
                    message={regenMsg.body ? regenMsg.body.replace(/\\n/g, '\n') : 'Procedere con la rigenerazione?'} 
                    confirmLabel="Procedi con Merge"
                    cancelLabel="Annulla"
                    variant="info"
                    icon={<RefreshCw className="w-8 h-8"/>}
                />
             )}

             {/* SUCCESS TOAST */}
             {successMessage && (
                <div className="fixed bottom-10 right-10 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 flex items-center gap-3 z-50">
                    <CheckCircle className="w-5 h-5"/> {successMessage}
                </div>
             )}

             <div className="flex justify-end border-b border-slate-800 pb-4">
                <button 
                    onClick={handleRegenerateClick} 
                    disabled={generating}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    {generating ? genStatus : 'RIGENERA PAGINA (MERGE & FIX)'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* GUIDE */}
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[500px] md:h-[600px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><UserCheck className="w-5 h-5 text-emerald-500"/> Guide</h3>
                        <div className="flex gap-2">
                            <button onClick={() => triggerPreview('guides', 'Guide Turistiche', guidesList)} className="p-1.5 bg-slate-800 hover:bg-emerald-900/30 rounded text-slate-400 hover:text-emerald-400 border border-slate-700"><Eye className="w-4 h-4"/></button>
                            <button onClick={handleAddGuide} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white shadow-lg"><Plus className="w-4 h-4"/></button>
                        </div>
                    </div>
                    
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-xl mb-4">
                         <div className="flex gap-2 mb-2">
                             <input value={guideQuery} onChange={e => setGuideQuery(e.target.value)} placeholder="Cerca guide..." className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white"/>
                             <button onClick={() => handleDiscovery('guides')} disabled={discoveringGuides} className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                 {discoveringGuides ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI
                             </button>
                         </div>
                         {guideResults.length > 0 && (
                             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                 {guideResults.map((res, idx) => (
                                     <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                         <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                                         <button onClick={() => handleImport('guides', res)} className="text-[9px] bg-slate-800 hover:bg-emerald-600 text-white px-2 py-1 rounded">Importa</button>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                    
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {guidesList.map((guide, idx) => (
                            <div key={guide.id} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2">
                                {/* ORDER INPUT */}
                                <div className="w-12 shrink-0">
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={guide.orderIndex || idx + 1} 
                                        onChange={(e) => handleReorderItem('guide', guide.id, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="absolute top-2 right-2 flex gap-1">
                                         <button onClick={() => handleSaveGuide(guide)} className="text-emerald-500 hover:text-white p-1"><Save className="w-4 h-4"/></button>
                                         <button onClick={() => handleDeleteGuide(guide.id)} className="text-slate-600 hover:text-red-500 p-1"><MinusCircle className="w-4 h-4"/></button>
                                    </div>
                                    <input value={guide.name} onChange={e => handleUpdateGuide(guide.id, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-emerald-500 pb-1" placeholder="Nome Guida"/>
                                    <div className="grid grid-cols-2 gap-2 mt-2"><input value={guide.phone || ''} onChange={e => handleUpdateGuide(guide.id, 'phone', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Telefono"/><input value={guide.email || ''} onChange={e => handleUpdateGuide(guide.id, 'email', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Email"/></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EVENTI */}
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[500px] md:h-[600px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><CalendarDays className="w-5 h-5 text-rose-500"/> Eventi</h3>
                        <div className="flex gap-2">
                            <button onClick={() => triggerPreview('events', 'Eventi Locali', eventsList)} className="p-1.5 bg-slate-800 hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-400 border border-slate-700"><Eye className="w-4 h-4"/></button>
                            <button onClick={handleAddEvent} className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white shadow-lg"><Plus className="w-4 h-4"/></button>
                        </div>
                    </div>
                    
                    <div className="bg-rose-900/10 border border-rose-500/20 p-3 rounded-xl mb-4">
                         <div className="flex gap-2 mb-2">
                             <input value={eventQuery} onChange={e => setEventQuery(e.target.value)} placeholder="Cerca eventi..." className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white"/>
                             <button onClick={() => handleDiscovery('events')} disabled={discoveringEvents} className="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                 {discoveringEvents ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI
                             </button>
                         </div>
                         {eventResults.length > 0 && (
                             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                 {eventResults.map((res, idx) => (
                                     <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                         <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                                         <button onClick={() => handleImport('events', res)} className="text-[9px] bg-slate-800 hover:bg-rose-600 text-white px-2 py-1 rounded">Importa</button>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {eventsList.map((evt, idx) => (
                            <div key={evt.id} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2">
                                <div className="w-12 shrink-0">
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={evt.orderIndex || idx + 1} 
                                        onChange={(e) => handleReorderItem('event', evt.id, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="absolute top-2 right-2 flex gap-1">
                                         <button onClick={() => handleSaveEvent(evt)} className="text-emerald-500 hover:text-white p-1"><Save className="w-4 h-4"/></button>
                                         <button onClick={() => handleDeleteEvent(evt.id)} className="text-slate-600 hover:text-red-500 p-1"><MinusCircle className="w-4 h-4"/></button>
                                    </div>
                                    <input value={evt.name} onChange={e => handleUpdateEvent(evt.id, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-rose-500 pb-1" placeholder="Nome Evento"/>
                                    <div className="grid grid-cols-2 gap-2"><input value={evt.date} onChange={e => handleUpdateEvent(evt.id, 'date', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Data"/><select value={evt.category} onChange={e => handleUpdateEvent(evt.id, 'category', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full">{EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEW ROW: TOUR OPERATOR */}
            <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base"><Bus className="w-5 h-5 text-cyan-500"/> Tour Operator & Agenzie</h3>
                    <div className="flex gap-2">
                         <button onClick={() => triggerPreview('tour_operators', 'Tour Operator', tourOperatorsList)} className="p-1.5 bg-slate-800 hover:bg-cyan-900/30 rounded text-slate-400 hover:text-cyan-400 border border-slate-700"><Eye className="w-4 h-4"/></button>
                         <button onClick={handleAddTourOperator} className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white shadow-lg"><Plus className="w-4 h-4"/></button>
                    </div>
                </div>
                
                <div className="bg-cyan-900/10 border border-cyan-500/20 p-3 rounded-xl mb-4">
                     <div className="flex gap-2 mb-2">
                         <input value={operatorQuery} onChange={e => setOperatorQuery(e.target.value)} placeholder="Cerca operatori..." className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white"/>
                         <button onClick={() => handleDiscovery('tour_operators')} disabled={discoveringOperators} className="bg-cyan-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                             {discoveringOperators ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI
                         </button>
                     </div>
                     {operatorResults.length > 0 && (
                         <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                             {operatorResults.map((res, idx) => (
                                 <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                     <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                                     <button onClick={() => handleImport('tour_operators', res)} className="text-[9px] bg-slate-800 hover:bg-cyan-600 text-white px-2 py-1 rounded">Importa</button>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {tourOperatorsList.map((op, idx) => (
                        <div key={op.id} className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2">
                            <div className="w-12 shrink-0">
                                <input 
                                    type="number" 
                                    min="1"
                                    value={op.orderIndex || idx + 1} 
                                    onChange={(e) => handleReorderItem('operator', op.id, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="absolute top-2 right-2 flex gap-1">
                                     <button onClick={() => handleSaveService(op)} className="text-emerald-500 hover:text-white p-1"><Save className="w-4 h-4"/></button>
                                     <button onClick={() => handleDeleteService(op.id, true)} className="text-slate-600 hover:text-red-500 p-1"><MinusCircle className="w-4 h-4"/></button>
                                </div>
                                <input value={op.name} onChange={e => handleUpdateService(op.id, 'name', e.target.value, true)} className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-cyan-500 pb-1" placeholder="Nome Agenzia"/>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={op.contact || ''} onChange={e => handleUpdateService(op.id, 'contact', e.target.value, true)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Telefono"/>
                                    <input value={op.url || ''} onChange={e => handleUpdateService(op.id, 'url', e.target.value, true)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full" placeholder="Sito Web"/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGA 2: GRIGLIA SERVIZI GENERICI (CON ORDINAMENTO) */}
            <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl">
                 
                 {/* Header con Anteprima */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">Servizi Essenziali</h3>
                    <button 
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
                    discoveringServices={discoveringServices} onDiscovery={() => handleDiscovery('services')}
                    serviceResults={serviceResults} onImport={(item) => handleImport('services', item)}
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
                                    <div key={svc.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 group relative hover:border-slate-700 transition-colors flex gap-2 items-start">
                                        <div className="w-8 shrink-0">
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={svc.orderIndex || idx + 1} 
                                                onChange={(e) => handleReorderItem('service', svc.id, e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded text-center text-white text-xs font-bold py-1"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-end gap-2 mb-2 border-b border-slate-800 pb-1">
                                                 <button onClick={() => handleSaveService(svc)} className="text-emerald-500 hover:text-white p-1 hover:bg-slate-800 rounded"><Save className="w-3.5 h-3.5"/></button>
                                                 <button onClick={() => handleDeleteService(svc.id)} className="text-slate-600 hover:text-red-500 p-1 hover:bg-slate-800 rounded"><MinusCircle className="w-3.5 h-3.5"/></button>
                                            </div>
                                            <div className="mb-2">
                                                 <select 
                                                     value={svc.type} 
                                                     onChange={(e) => handleUpdateService(svc.id, 'type', e.target.value)}
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
                                            <input value={svc.name} onChange={e => handleUpdateService(svc.id, 'name', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none text-xs border-b border-transparent focus:border-blue-500 pb-0.5 mb-1 text-left" placeholder="Nome..."/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
