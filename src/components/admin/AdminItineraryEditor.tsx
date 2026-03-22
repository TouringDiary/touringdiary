
import React, { useState, useEffect, useMemo } from 'react';
import { Save, ArrowLeft, Plus, Trash2, MapPin, Calendar, Clock, Search, GripVertical, AlertCircle, CheckCircle, Image as ImageIcon, Layout, List, Eye, EyeOff, Bot, Sparkles, X, AlertTriangle, Loader2 } from 'lucide-react';
import { PremadeItinerary, PointOfInterest } from '../../types/index';
import { savePremadeItinerary, getFilteredCommunityItinerariesAsync } from '../../services/communityService';
import { getCityDetails } from '../../services/cityService';
import { AdminImageInput } from './AdminImageInput';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { getAiClient } from '../../services/ai/aiClient';

interface Props {
    itineraryId: string | 'new';
    onBack: () => void;
}

// Internal Interface for Editor State
interface EditorItem {
    id: string; // internal temp ID
    cityId: string; // ADDED: Mandatory context
    dayIndex: number;
    timeSlotStr: string;
    poi: PointOfInterest;
    note: string;
}

const DEFAULT_ITINERARY: PremadeItinerary = {
    id: '',
    title: '',
    description: '',
    durationDays: 3,
    coverImage: '',
    imageLicense: 'public',
    imageCredit: '',
    status: 'draft', // DEFAULT TO DRAFT
    tags: [], // EMPTY TAGS BY DEFAULT
    difficulty: 'Moderato',
    type: 'official',
    rating: 0,
    votes: 0,
    continent: 'Europa',
    nation: 'Italia',
    region: 'Campania',
    zone: 'Napoli & Vesuvio',
    mainCity: 'Napoli',
    items: []
};

export const AdminItineraryEditor = ({ itineraryId, onBack }: Props) => {
    const [formData, setFormData] = useState<PremadeItinerary>(DEFAULT_ITINERARY);
    const [editorItems, setEditorItems] = useState<EditorItem[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'timeline'>('general');
    const [availablePois, setAvailablePois] = useState<PointOfInterest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // NEW: Validazione AI & Immagine
    const [isImageValid, setIsImageValid] = useState(true);
    const [validationModal, setValidationModal] = useState<{ isOpen: boolean, loading: boolean, report: string | null } >({ isOpen: false, loading: false, report: null });

    // Load Data
    useEffect(() => {
        const load = async () => {
            // 1. Load POI Database (Simulated from major cities)
            const citiesToLoad = ['napoli', 'sorrento', 'positano', 'amalfi', 'caserta', 'salerno'];
            let allPois: PointOfInterest[] = [];
            
            for (const cityId of citiesToLoad) {
                const cityData = await getCityDetails(cityId);
                if (cityData?.details.allPois) {
                    allPois = [...allPois, ...cityData.details.allPois];
                }
            }
            setAvailablePois(allPois);

            // 2. Load Itinerary if Editing
            if (itineraryId !== 'new') {
                const allItineraries = await getFilteredCommunityItinerariesAsync({});
                const existing = allItineraries.find(i => i.id === itineraryId);
                if (existing) {
                    setFormData(existing);
                    
                    // Hydrate Items
                    const hydratedItems: EditorItem[] = existing.items.map(item => {
                        const foundPoi = allPois.find(p => p.id === item.poiId);
                        return {
                            id: Math.random().toString(36).substr(2, 9),
                            // Map cityId from itinerary item
                            cityId: item.cityId,
                            dayIndex: item.dayIndex,
                            timeSlotStr: item.timeSlotStr,
                            poi: foundPoi || { 
                                id: item.poiId, 
                                name: item.fallbackName || 'POI Sconosciuto', 
                                category: 'discovery', 
                                description: '',
                                imageUrl: '', 
                                rating: 0, votes: 0, coords: {lat:0, lng:0}, address: '' 
                            },
                            note: item.note || ''
                        };
                    });
                    setEditorItems(hydratedItems);
                }
            } else {
                // FORCE CLEAN STATE FOR NEW
                setFormData({ ...DEFAULT_ITINERARY, id: `it_${Date.now()}`, tags: [], status: 'draft' });
                setEditorItems([]);
            }
        };
        load();
    }, [itineraryId]);

    const handleSave = async () => {
        // VALIDATION: Cannot Publish Empty Itinerary OR Missing Tags
        if (formData.status === 'published') {
            if (editorItems.length === 0) {
                alert("Non puoi pubblicare un itinerario vuoto! Aggiungi almeno una tappa nella Timeline o salvalo come Bozza.");
                return;
            }
            if (formData.tags.length === 0) {
                alert("OBBLIGATORIO: Devi inserire almeno un TAG per pubblicare l'itinerario (es. 'Arte', 'Mare').");
                return;
            }
        }

        setIsSaving(true);
        
        // 1. Map EditorItems back to Itinerary.items structure
        const finalItems = editorItems.map(item => ({
            dayIndex: item.dayIndex,
            timeSlotStr: item.timeSlotStr,
            poiId: item.poi.id,
            // Include mandatory cityId
            cityId: item.cityId,
            fallbackName: item.poi.name,
            note: item.note
        }));

        const finalItinerary: PremadeItinerary = {
            ...formData,
            items: finalItems
        };

        // 2. Call Service to Save (Persistent LocalStorage)
        const success = await savePremadeItinerary(finalItinerary);
        setIsSaving(false);
        if (success) {
            alert("Itinerario salvato con successo!");
            onBack();
        } else {
            alert("Errore durante il salvataggio.");
        }
    };

    // --- AI VALIDATION LOGIC ---
    const requestPublicStatus = async () => {
        if (formData.status === 'published') return; // Already published

        if (editorItems.length === 0) {
            alert("Aggiungi delle tappe prima di richiedere la pubblicazione.");
            return;
        }

        setValidationModal({ isOpen: true, loading: true, report: null });

        try {
            // FIX: Uso il client centralizzato
            const ai = getAiClient();
            
            // Costruiamo un JSON semplificato dell'itinerario per l'AI
            const itineraryContext = {
                title: formData.title,
                days: formData.durationDays,
                declaredDifficulty: formData.difficulty,
                currentTags: formData.tags,
                hasCoverImage: !!formData.coverImage,
                city: formData.mainCity,
                schedule: editorItems.map(i => ({
                    day: i.dayIndex + 1,
                    time: i.timeSlotStr,
                    name: i.poi.name,
                    category: i.poi.category
                }))
            };

            const prompt = `Sei un supervisore editoriale di "Touring Diary". Devi validare questo itinerario prima della pubblicazione.
            
            ITINERARIO:
            ${JSON.stringify(itineraryContext, null, 2)}

            REGOLE DI VALIDAZIONE (Sii severo ma costruttivo):
            1. ANALISI TITOLO: Il titolo "${formData.title}" è accattivante e descrive bene il contenuto? Suggerisci un'alternativa se è troppo generico.
            2. ANALISI DIFFICOLTÀ: L'utente ha indicato difficoltà "${formData.difficulty}". Contando le tappe e gli spostamenti, è corretto? (es. troppe tappe = Intenso).
            3. ASSET: Verifica se è presente l'immagine di copertina (hasCoverImage: ${formData.coverImage ? 'true' : 'false'}). Se manca, segnalalo come ERRORE.
            4. SUGGERIMENTO TAG: Analizza le tappe (es. musei = Arte, ristoranti = Cibo) e suggerisci 5 tag pertinenti da aggiungere.
            
            5. LOGICA TIMELINE: 
               - Start/End Points (Hotel/Stazione) presenti?
               - Buchi temporali o sovrapposizioni?

            Rispondi con un report HTML (usa <ul>, <li>, <b>).
            - Usa ❌ per problemi bloccanti (es. no immagine, timeline vuota).
            - Usa ⚠️ per avvisi (es. difficoltà errata, titolo debole).
            - Usa 💡 per i suggerimenti (Tag, Titolo migliore).
            - Usa ✅ se una sezione è perfetta.
            
            NON ESSERE TROPPO PROLISSO. Vai al sodo.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setValidationModal({ isOpen: true, loading: false, report: response.text || "Nessun report generato." });

        } catch (e: any) {
            console.error("AI Validation Error", e);
            setValidationModal({ isOpen: true, loading: false, report: `⚠️ Errore di connessione AI: ${e.message}. Verifica manuale consigliata.` });
        }
    };

    const confirmPublish = () => {
        // Double check tags here just in case, though button logic handles it
        if (formData.tags.length === 0) {
            alert("Non puoi procedere: Devi aggiungere dei Tag prima di pubblicare.");
            return;
        }
        updateField('status', 'published');
        setValidationModal({ isOpen: false, loading: false, report: null });
    };

    const cancelPublish = () => {
        setValidationModal({ isOpen: false, loading: false, report: null });
        // Stay in draft
    };

    const updateField = (field: keyof PremadeItinerary, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addItemToDay = (poi: PointOfInterest, dayIndex: number) => {
        const newItem: EditorItem = {
            id: Math.random().toString(36).substr(2, 9),
            // Use cityId from POI if available, otherwise fallback to mainCity
            cityId: poi.cityId || formData.mainCity.toLowerCase(),
            dayIndex,
            timeSlotStr: '09:00', // Default time
            poi: poi,
            note: ''
        };
        setEditorItems(prev => [...prev, newItem].sort((a,b) => a.timeSlotStr.localeCompare(b.timeSlotStr)));
    };

    const updateItem = (id: string, field: keyof EditorItem, value: any) => {
        setEditorItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setEditorItems(prev => prev.filter(item => item.id !== id));
    };

    // Filter POIs for Sidebar
    const filteredPois = useMemo(() => {
        return availablePois.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.category.includes(searchTerm.toLowerCase())
        );
    }, [availablePois, searchTerm]);

    const handleDragStart = (e: React.DragEvent, poi: PointOfInterest) => {
        e.dataTransfer.setData('application/json', JSON.stringify(poi));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = (e: React.DragEvent, dayIndex: number) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data && data.id) {
                addItemToDay(data as PointOfInterest, dayIndex);
            }
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    // Computed Validation for Save Button
    // BLOCK IF: Published AND (Empty Timeline OR Empty Tags OR Invalid Image)
    const isPublishingInvalid = formData.status === 'published' && (editorItems.length === 0 || formData.tags.length === 0);
    const isSaveDisabled = isSaving || !formData.title || !isImageValid || isPublishingInvalid;

    const saveButtonTitle = isPublishingInvalid 
        ? "Mancano i TAG o la Timeline per pubblicare!" 
        : isImageValid ? "Salva modifiche" : "Immagine non valida";

    return (
        // LAYOUT FISSO: Aggiornato offset left per nuove misure
        // fixed inset-0 ma con left-[30rem] su desktop (lg) e left-[35rem] su 2xl
        // Z-Index 40 per stare sopra al contenuto dashboard standard ma sotto a modali/overlay
        <div className="fixed inset-0 lg:left-[30rem] 2xl:left-[35rem] z-40 bg-slate-950 flex flex-col animate-in fade-in slide-in-from-bottom-4 transition-[left] duration-300">
            
            {/* HEADER FISSO IN ALTO */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700">
                        <ArrowLeft className="w-5 h-5"/>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white font-display">
                            {itineraryId === 'new' ? 'Nuovo Itinerario' : 'Modifica Itinerario'}
                        </h2>
                        <div className="text-xs text-slate-500 font-mono">
                            {formData.id} • {activeTab === 'general' ? 'Dati Generali' : 'Pianificazione'}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 items-center">
                    
                    {/* STATUS TOGGLE MOVED HERE */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 mr-2">
                        <button 
                            onClick={() => updateField('status', 'draft')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 transition-colors ${formData.status === 'draft' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <EyeOff className="w-3.5 h-3.5"/> Bozza
                        </button>
                        <button 
                            onClick={requestPublicStatus}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 transition-colors ${formData.status === 'published' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-900'}`}
                        >
                            <Eye className="w-3.5 h-3.5"/> Pubblico
                        </button>
                    </div>

                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button onClick={() => setActiveTab('general')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'general' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Generali</button>
                        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'timeline' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Timeline</button>
                    </div>
                    {/* SAVE BUTTON: Disabled if conditions met */}
                    <button 
                        onClick={handleSave} 
                        disabled={isSaveDisabled} 
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all border border-transparent disabled:border-slate-700"
                        title={saveButtonTitle}
                    >
                        <Save className="w-4 h-4"/> {isSaving ? 'Salvataggio...' : 'Salva'}
                    </button>
                </div>
            </div>

            {/* CONTENT AREA (SCROLLABLE BELOW HEADER) */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                
                {/* TAB: GENERAL DATA */}
                {activeTab === 'general' && (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar max-w-5xl mx-auto w-full">
                        <div className="space-y-8">
                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-indigo-500"/> Informazioni Base
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Titolo Itinerario</label>
                                            <input value={formData.title} onChange={e => updateField('title', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" placeholder="Es. Napoli in 3 Giorni"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Città Principale</label>
                                            <input value={formData.mainCity} onChange={e => updateField('mainCity', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="Es. Napoli"/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Durata (Giorni)</label>
                                                <input type="number" min="1" max="10" value={formData.durationDays} onChange={e => updateField('durationDays', parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"/>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Difficoltà</label>
                                                <select value={formData.difficulty} onChange={e => updateField('difficulty', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                                                    <option value="Relax">Relax</option>
                                                    <option value="Moderato">Moderato</option>
                                                    <option value="Intenso">Intenso</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipologia</label>
                                            <select value={formData.type} onChange={e => updateField('type', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                                                <option value="official">Ufficiale (Touring Diary)</option>
                                                <option value="community">Community (Utente)</option>
                                                <option value="ai">Smart Trends (AI)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex justify-between">
                                                Tag (Separati da virgola)
                                                {isPublishingInvalid && <span className="text-red-500 animate-pulse text-[10px]">RICHIESTO</span>}
                                            </label>
                                            <input 
                                                value={formData.tags.join(', ')} 
                                                onChange={e => updateField('tags', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))} 
                                                className={`w-full bg-slate-950 border rounded-lg p-3 text-white ${isPublishingInvalid ? 'border-red-500' : 'border-slate-700'}`} 
                                                placeholder="Es. Arte, Cibo, Relax..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Autore (Opzionale)</label>
                                            <input value={formData.author || ''} onChange={e => updateField('author', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrizione Completa</label>
                                    <textarea rows={4} value={formData.description} onChange={e => updateField('description', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white resize-none"/>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-amber-500"/> Media & Copertina
                                </h3>
                                {/* BUGFIX: Collegati correttamente imageCredit e imageLicense */}
                                <AdminImageInput 
                                    imageUrl={formData.coverImage} 
                                    imageCredit={formData.imageCredit}
                                    imageLicense={formData.imageLicense}
                                    category={'discovery'}
                                    onChange={(data) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            coverImage: data.imageUrl,
                                            imageCredit: data.imageCredit,
                                            imageLicense: data.imageLicense
                                        }));
                                    }}
                                    onValidityChange={setIsImageValid}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: TIMELINE */}
                {activeTab === 'timeline' && (
                    <div className="flex-1 flex overflow-hidden">
                        {/* SIDEBAR POIS */}
                        <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 z-20 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                <input 
                                    type="text" 
                                    placeholder="Cerca luoghi..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                {filteredPois.map(poi => (
                                    <div 
                                        key={poi.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, poi)}
                                        className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-colors group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <img src={poi.imageUrl} alt={poi.name} className="w-10 h-10 rounded object-cover bg-slate-700 shrink-0"/>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{poi.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{poi.category}</div>
                                            </div>
                                            <GripVertical className="w-4 h-4 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* MAIN TIMELINE */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0f172a]">
                            <div className="max-w-3xl mx-auto space-y-8">
                                {Array.from({ length: formData.durationDays }).map((_, dayIdx) => {
                                    const dayItems = editorItems.filter(i => i.dayIndex === dayIdx);
                                    
                                    return (
                                        <div 
                                            key={dayIdx} 
                                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[150px]"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, dayIdx)}
                                        >
                                            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Calendar className="w-4 h-4"/> Giorno {dayIdx + 1}
                                            </h4>
                                            
                                            {dayItems.length === 0 ? (
                                                <div className="border-2 border-dashed border-slate-800 rounded-xl h-24 flex items-center justify-center text-slate-600 text-xs italic">
                                                    Trascina qui i luoghi dalla sidebar
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dayItems.map((item) => (
                                                        <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex gap-4 items-start group">
                                                            <div className="w-20 pt-1">
                                                                <input 
                                                                    type="time" 
                                                                    value={item.timeSlotStr} 
                                                                    onChange={(e) => updateItem(item.id, 'timeSlotStr', e.target.value)}
                                                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white w-full text-center font-mono"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-white text-sm truncate">{item.poi.name}</div>
                                                                <input 
                                                                    value={item.note} 
                                                                    onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                                                                    placeholder="Note opzionali..." 
                                                                    className="bg-transparent border-b border-transparent focus:border-slate-600 text-xs text-slate-400 w-full mt-1 outline-none placeholder:text-slate-600"
                                                                />
                                                            </div>
                                                            <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Validation Modal */}
            {validationModal.isOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl border border-indigo-500/50 p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Bot className="w-6 h-6 text-indigo-500"/> Validazione Editoriale AI
                            </h3>
                            {!validationModal.loading && (
                                <button onClick={cancelPublish} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                            )}
                        </div>

                        {validationModal.loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin"/>
                                <p className="text-slate-400 animate-pulse text-sm">Analisi itinerario in corso...</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: validationModal.report || '' }} />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={cancelPublish} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold uppercase">Correggi</button>
                                    <button onClick={confirmPublish} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-xs font-bold uppercase shadow-lg flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4"/> Pubblica Comunque
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
