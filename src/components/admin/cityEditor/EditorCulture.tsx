
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Eye, Plus, Trash2, Award, Sparkles, Loader2, Wand2, X, RefreshCw, ChevronDown, ChevronUp, Calendar, Check, ScrollText, FileText, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { suggestCityItems, generateCitySection } from '../../../services/ai';
import { AiFieldHelper } from '../AiFieldHelper'; 
import { getCityPeople, saveCityPerson, deleteCityPerson, saveCityDetails } from '../../../services/cityService';
import { FamousPerson } from '../../../types/index';
// IMPORT MODALE
import { CultureCornerModal } from '../../modals/CultureCornerModal';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

const DEFAULT_MASTER_PATRON = "https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg";

export const EditorCulture = () => {
    const { city, updateDetailField, triggerPreview, setCityDirectly, reloadCurrentCity } = useCityEditor();
    
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
    const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
    const [aiContextQuery, setAiContextQuery] = useState('');
    const [discoveryCount, setDiscoveryCount] = useState<number>(3); 
    const [patronStrategy, setPatronStrategy] = useState('');
    
    // ASYNC STATE FOR PEOPLE
    const [peopleList, setPeopleList] = useState<FamousPerson[]>([]);
    const [isLoadingPeople, setIsLoadingPeople] = useState(false);
    
    // PREVIEW MODAL STATE
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewInitialId, setPreviewInitialId] = useState<string | undefined>(undefined);

    // CONFIRM MODALS STATE
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (city?.id) {
            loadPeople();
        }
    }, [city?.id]);

    const loadPeople = () => {
         if (!city?.id) return;
         setIsLoadingPeople(true);
         getCityPeople(city.id).then(data => {
            // Sort by order_index (if available, else fallback)
            const sorted = data.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setPeopleList(sorted);
            setIsLoadingPeople(false);
         });
    };
    
    const openPreview = (personId?: string) => {
        // Sincronizza i dati locali con il city context per assicurarsi che il modale veda i dati aggiornati
        // (Il modale legge da city.details.famousPeople)
        const updatedDetails = { ...city!.details, famousPeople: peopleList };
        setCityDirectly({ ...city!, details: updatedDetails });
        
        setPreviewInitialId(personId);
        setPreviewModalOpen(true);
    };

    if (!city) return null;

    const handleRegeneratePage = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!city.name) { alert("Inserisci il nome della città!"); return; }
        setShowRegenerateConfirm(true);
    };

    const confirmRegeneratePage = async () => {
        setShowRegenerateConfirm(false);
        setGenerating('full_page');
        try {
            // 1. DELETE EXISTING PEOPLE FROM DB
            const existingPeople = await getCityPeople(city.id);
            await Promise.all(existingPeople.map(p => deleteCityPerson(p.id!)));
            
            // 2. REGENERATE CONTENT
            const [historyData, patronData, peopleSuggestions] = await Promise.all([
                generateCitySection(city.name, 'history'),
                generateCitySection(city.name, 'patron'),
                suggestCityItems(city.name, 'people', [], '', 5)
            ]);

            // 3. APPLY TO CITY STATE
            const updatedDetails = { ...city.details };
            updatedDetails.historySnippet = historyData.historySnippet || '';
            updatedDetails.historyFull = historyData.historyFull || '';
            
            if (patronData.patron) {
                 updatedDetails.patronDetails = { ...updatedDetails.patronDetails, ...patronData.patron, imageUrl: DEFAULT_MASTER_PATRON };
                 updatedDetails.patron = patronData.patron.name;
            }

            // 4. SAVE NEW PEOPLE TO DB
            let orderIdx = 0;
            for (const person of peopleSuggestions) {
                 // FORCE DRAFT STATUS FOR NEW AI ITEMS & Set Order
                 await saveCityPerson(city.id, { ...person, status: 'draft', orderIndex: orderIdx++ });
            }
            
            // 5. SAVE CITY DETAILS
            await saveCityDetails({ ...city, details: updatedDetails });

            // 6. WAIT & RELOAD
            await new Promise(r => setTimeout(r, 1000));
            
            // Reload Context (Important!)
            await reloadCurrentCity();
            // Reload Local List
            loadPeople();

            alert("Pagina Cultura rigenerata con successo! I dati sono aggiornati.");

        } catch (e: any) {
             console.error(e);
             alert(`Errore rigenerazione: ${e.message}`);
        } finally {
            setGenerating(null);
        }
    };

    const handleRegenerateSpecific = async (target: 'snippet' | 'full' | 'patron', instructions: string = '') => {
        if (!city.name) { alert("Inserisci il nome della città!"); return; }
        setGenerating(target);
        try {
            const data = await generateCitySection(city.name, 'history', instructions);
            
            if (target === 'snippet' && data.historySnippet) updateDetailField('historySnippet', data.historySnippet);
            if (target === 'full' && data.historyFull) updateDetailField('historyFull', data.historyFull);
            if (target === 'patron' && data.patron && data.patron.name) {
                const newPatronDetails = {
                    ...data.patron,
                    imageUrl: city.details.patronDetails?.imageUrl || '' 
                };
                updateDetailField('patronDetails', newPatronDetails);
                updateDetailField('patron', data.patron.name);
            }

        } catch (e) {
            alert("Errore generazione AI.");
        } finally {
            setGenerating(null);
        }
    };

    const handleDiscovery = async () => {
        setIsDiscovering(true);
        try {
            const existingNames = peopleList.map(p => p.name);
            const results = await suggestCityItems(city.name, 'people', existingNames, aiContextQuery, discoveryCount);
            setDiscoveryResults(results);
        } catch (e) {
            alert("AI momentaneamente occupata.");
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleImportPerson = async (person: any) => {
        const newPerson = {
            ...person,
            lifespan: person.lifespan || '', quote: person.quote || '', famousWorks: person.famousWorks || [], relatedPlaces: person.relatedPlaces || [], fullBio: person.fullBio || person.bio || '', privateLife: person.privateLife || '', collaborations: person.collaborations || [], awards: person.awards || [], careerStats: person.careerStats || [],
            status: 'draft', // Import always as draft
            orderIndex: peopleList.length + 1
        };
        
        // Save to DB immediately
        const saved = await saveCityPerson(city.id, newPerson);
        if (saved) {
            // Re-fetch standardized from DB return
            const mappedSaved: FamousPerson = {
                id: saved.id, name: saved.name, role: saved.role, bio: saved.bio, imageUrl: saved.image_url,
                fullBio: saved.full_bio, quote: saved.quote, lifespan: saved.lifespan, status: saved.status,
                orderIndex: saved.order_index
            };
            setPeopleList(prev => [...prev, mappedSaved]);
            setDiscoveryResults(prev => prev.filter(p => p.name !== person.name));
            reloadCurrentCity();
        }
    };
    
    const handleAddManualPerson = async () => {
        const tempPerson = {
             name: 'Nuovo Personaggio', role: 'Artista', bio: '', imageUrl: 'https://images.unsplash.com/photo-1555626040-3b731de3a81c?q=80&w=400', relatedPlaces: [], famousWorks: [], fullBio: '', privateLife: '', awards: [], collaborations: [], careerStats: [], status: 'draft', orderIndex: peopleList.length + 1
        };
        const saved = await saveCityPerson(city.id, tempPerson);
        if(saved) {
             const mappedSaved: FamousPerson = {
                id: saved.id, name: saved.name, role: saved.role, bio: saved.bio, imageUrl: saved.image_url,
                fullBio: saved.full_bio, quote: saved.quote, lifespan: saved.lifespan, status: saved.status, orderIndex: saved.order_index
            };
            setPeopleList(prev => [...prev, mappedSaved]);
            setExpandedPersonId(saved.id);
            reloadCurrentCity();
        }
    };

    const handleUpdatePerson = (id: string, field: keyof FamousPerson, value: any) => {
        setPeopleList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const handleSavePerson = async (person: FamousPerson) => {
        await saveCityPerson(city.id, person);
        loadPeople();
        reloadCurrentCity();
    };

    const handleDeletePerson = async (id: string) => {
        setPersonToDelete(id);
    };

    const confirmDeletePerson = async () => {
        if (!personToDelete) return;
        const id = personToDelete;
        await deleteCityPerson(id);
        setPeopleList(prev => prev.filter(p => p.id !== id));
        reloadCurrentCity();
        setPersonToDelete(null);
    };

    const toggleStatus = async (person: FamousPerson) => {
        const newStatus: 'published' | 'draft' = person.status === 'published' ? 'draft' : 'published';
        // Aggiornamento ottimistico locale
        const updatedLocal: FamousPerson[] = peopleList.map(p => p.id === person.id ? { ...p, status: newStatus } : p);
        setPeopleList(updatedLocal);
        // Salvataggio effettivo
        await saveCityPerson(city.id, { ...person, status: newStatus });
        reloadCurrentCity();
    };

    const handleReorderPerson = async (id: string, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1) return;
        const index = newRank - 1;

        const currentList = [...peopleList];
        const itemIndex = currentList.findIndex(p => p.id === id);
        if (itemIndex === -1) return;
        if (index >= currentList.length) return; 

        // Rimuovi e reinserisci
        const [item] = currentList.splice(itemIndex, 1);
        currentList.splice(index, 0, item);

        // Ricalcola indici e salva
        const updatedList = currentList.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setPeopleList(updatedList);

        // Salva DB in background (Promise.all)
        // Idealmente endpoint batch, qui loop
        for (const p of updatedList) {
             await saveCityPerson(city.id, p);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in">
             
             {/* ANTEPRIMA MODALE */}
             {previewModalOpen && (
                 <CultureCornerModal 
                    isOpen={true} 
                    onClose={() => setPreviewModalOpen(false)} 
                    city={city} 
                    onAddToItinerary={() => {}} 
                    initialPersonId={previewInitialId}
                />
             )}

             <DeleteConfirmationModal
                isOpen={showRegenerateConfirm}
                onClose={() => setShowRegenerateConfirm(false)}
                onConfirm={confirmRegeneratePage}
                title="Rigenera Pagina Cultura"
                message="ATTENZIONE: Questo cancellerà STORIA, PATRONO e TUTTI I PERSONAGGI dal database per poi rigenerarli. Continuare?"
                confirmLabel="Rigenera Tutto"
                variant="danger"
             />

             <DeleteConfirmationModal
                isOpen={personToDelete !== null}
                onClose={() => setPersonToDelete(null)}
                onConfirm={confirmDeletePerson}
                title="Elimina Personaggio"
                message="Sei sicuro di voler eliminare questo personaggio definitivamente?"
                confirmLabel="Elimina"
                variant="danger"
             />

             <div className="col-span-1 lg:col-span-2 flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500"><BookOpen className="w-5 h-5"/></div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Storia & Cultura</h2>
                </div>
                 <button 
                    onClick={handleRegeneratePage} 
                    disabled={generating === 'full_page'}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
                >
                    {generating === 'full_page' ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    RIGENERA PAGINA
                </button>
            </div>

            <div className="space-y-6 md:space-y-8">
                {/* STORIA IN BREVE */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2"><ScrollText className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Storia Breve</h3>
                        <button onClick={() => triggerPreview('snippet', 'Anteprima Intro')} className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"><Eye className="w-4 h-4"/></button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-4 italic">Snippet introduttivo (2-3 frasi) usato come "Intro" nella pagina storia.</p>
                    <textarea rows={4} value={city.details.historySnippet} onChange={e => updateDetailField('historySnippet', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 md:p-4 text-white text-sm resize-none"/>
                    <AiFieldHelper 
                        contextLabel={`storia brevissima di ${city.name}`}
                        onApply={t => updateDetailField('historySnippet', t)}
                        currentValue={city.details.historySnippet} 
                        fieldId="city_history_short"
                    />
                </div>

                {/* STORIA COMPLETA */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Storia Completa</h3>
                        <button onClick={() => triggerPreview('history', 'Storia Completa')} className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"><Eye className="w-4 h-4"/></button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-4 italic">Testo lungo e dettagliato, sarà formattato automaticamente.</p>
                    <textarea rows={12} value={city.details.historyFull} onChange={e => updateDetailField('historyFull', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 md:p-4 text-white text-sm resize-none"/>
                    <AiFieldHelper 
                        contextLabel={`storia completa di ${city.name}`}
                        onApply={t => updateDetailField('historyFull', t)}
                        currentValue={city.details.historyFull} 
                        fieldId="city_history_full"
                    />
                </div>
            </div>
            
            <div className="space-y-6 md:space-y-8">
                {/* PERSONAGGI ILLUSTRI */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Personaggi Famosi</h3>
                        <div className="flex gap-2">
                            <button onClick={() => openPreview()} className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors" title="Anteprima Lista"><Eye className="w-4 h-4"/></button>
                            <button onClick={handleAddManualPerson} className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> <span className="hidden md:inline">Manuale</span></button>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/20">
                         <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-indigo-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4"/> Discovery AI</h4>
                                
                                <div className="flex items-center gap-2">
                                     <select 
                                        value={discoveryCount} 
                                        onChange={(e) => setDiscoveryCount(parseInt(e.target.value))}
                                        className="w-16 bg-slate-950 border border-indigo-500/50 text-white text-[10px] font-bold rounded px-2 py-1 outline-none"
                                     >
                                         <option value={1}>1</option>
                                         <option value={3}>3</option>
                                         <option value={5}>5</option>
                                         <option value={10}>10</option>
                                     </select>
                                    <button onClick={handleDiscovery} disabled={isDiscovering} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 transition-all">
                                        {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} Suggerisci
                                    </button>
                                </div>
                            </div>
                            <input value={aiContextQuery} onChange={(e) => setAiContextQuery(e.target.value)} placeholder="Cosa cerchi? (es. Pittori del 700...)" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"/>
                        </div>
                        {discoveryResults.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                {discoveryResults.map((p, i) => (
                                    <div key={i} className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 relative group">
                                        <div className="flex items-center gap-3"><img src={p.imageUrl} className="w-8 h-8 rounded-full object-cover"/><div className="min-w-0"><div className="font-bold text-white text-xs truncate">{p.name}</div><div className="text-[9px] text-slate-400 truncate">{p.role}</div></div></div>
                                        <button onClick={() => handleImportPerson(p)} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"><Check className="w-3 h-3"/> Importa (Bozza)</button>
                                        <button onClick={() => setDiscoveryResults(prev => prev.filter(x => x.name !== p.name))} className="absolute top-1 right-1 text-slate-600 hover:text-white"><X className="w-3 h-3"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                        {isLoadingPeople ? <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500"/></div> : 
                        peopleList.map((p, idx) => {
                             const isExpanded = expandedPersonId === p.id;
                             const isPublished = p.status === 'published';
                             return (
                                <div key={p.id || idx} className={`bg-slate-900 rounded-xl border transition-all ${isExpanded ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800'}`}>
                                    <div className="p-3 md:p-4 flex gap-3 items-center group">
                                        {/* INPUT ORDINE DINAMICO */}
                                        <div className="w-16 shrink-0">
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={p.orderIndex || idx + 1} 
                                                onChange={(e) => handleReorderPerson(p.id!, e.target.value)}
                                                onBlur={() => reloadCurrentCity()} // Force DB Sync
                                                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg text-center text-white text-lg font-black py-2 focus:border-indigo-500 outline-none shadow-inner"
                                            />
                                        </div>

                                        <div className="flex gap-3 items-center flex-1 cursor-pointer" onClick={() => setExpandedPersonId(isExpanded ? null : p.id!)}>
                                            <img src={p.imageUrl} alt={p.name} className={`w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-slate-700 ${!isPublished ? 'grayscale opacity-60' : ''}`}/>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                                                    {isPublished ? <span className="text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Online</span> : <span className="text-[9px] bg-amber-900/30 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Bozza</span>}
                                                </div>
                                                <p className="text-[10px] md:text-xs text-slate-400 truncate">{p.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openPreview(p.id!); }} 
                                                className="p-1.5 md:p-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded transition-colors"
                                                title="Anteprima Utente"
                                            >
                                                <Eye className="w-4 h-4"/>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeletePerson(p.id!); }} className="p-1.5 md:p-2 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded"><Trash2 className="w-4 h-4"/></button>
                                            <button onClick={() => setExpandedPersonId(isExpanded ? null : p.id!)} className="p-1">
                                                {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-400"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-3 md:px-4 pb-4 border-t border-slate-800/50 pt-4 space-y-4 bg-slate-900/50 rounded-b-xl">
                                            
                                            {/* STATUS TOGGLE */}
                                            <div className="flex justify-between items-center mb-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Stato Visibilità</span>
                                                <button onClick={() => toggleStatus(p)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-600 text-white hover:bg-amber-500'}`}>
                                                    {isPublished ? 'PUBBLICATO' : 'BOZZA (NASCOSTO)'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input value={p.name} onChange={e => handleUpdatePerson(p.id!, 'name', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full" placeholder="Nome Completo"/>
                                                <input value={p.role} onChange={e => handleUpdatePerson(p.id!, 'role', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm w-full" placeholder="Ruolo"/>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="relative"><Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500"/><input value={p.lifespan || ''} onChange={e => handleUpdatePerson(p.id!, 'lifespan', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 pl-9 text-slate-300 text-xs w-full" placeholder="Periodo (es. 1898-1967)"/></div>
                                                <input value={p.imageUrl} onChange={e => handleUpdatePerson(p.id!, 'imageUrl', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-xs w-full" placeholder="URL Immagine"/>
                                            </div>
                                            <textarea rows={2} value={p.bio} onChange={e => handleUpdatePerson(p.id!, 'bio', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-300 text-xs resize-none" placeholder="Bio breve..."/>
                                            <textarea rows={6} value={p.fullBio || ''} onChange={e => handleUpdatePerson(p.id!, 'fullBio', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-xs resize-none font-serif" placeholder="Biografia estesa..."/>
                                            
                                            <div className="flex justify-end pt-2">
                                                <button onClick={() => handleSavePerson(p)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1"><Save className="w-3 h-3"/> Salva Modifiche</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                </div>

                {/* SANTO PATRONO - AGGIORNATO */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500"/> Santo Patrono</h3>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => handleRegenerateSpecific('patron', patronStrategy)} 
                                disabled={!!generating} 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all"
                            >
                                {generating === 'patron' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                Genera Contenuto (Pro)
                            </button>
                            <button onClick={() => triggerPreview('patron', 'Santo Patrono')} className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700"><Eye className="w-4 h-4"/></button>
                         </div>
                    </div>
                    
                    <div className="mb-4">
                        <AiFieldHelper 
                            contextLabel="storia del santo patrono" 
                            onApply={(val) => setPatronStrategy(val)} 
                            mode="text" 
                            currentValue={patronStrategy} 
                            initialPrompt="Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare."
                            defaultPrompts={['Scrivi come un romanziere storico: avvincente, non scolastico. Focalizzati sui miracoli e sulla devozione popolare.']}
                            fieldId="patron_strategy" 
                            isStrategyConfig={true}
                        />
                    </div>
                    
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome Santo</label><input value={city.details.patronDetails?.name || city.details.patron || ''} onChange={e => { updateDetailField('patron', e.target.value); const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' }; updateDetailField('patronDetails', { ...currentDetails, name: e.target.value }); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="Es. San Gennaro"/></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data Celebrazione</label><input value={city.details.patronDetails?.date || ''} onChange={e => { const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' }; updateDetailField('patronDetails', { ...currentDetails, date: e.target.value }); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="19 Settembre"/></div>
                        </div>

                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Storia / Culto</label><textarea rows={6} value={city.details.patronDetails?.history || ''} onChange={e => { const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' }; updateDetailField('patronDetails', { ...currentDetails, history: e.target.value }); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm leading-relaxed" placeholder="Breve storia del culto..."/></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
