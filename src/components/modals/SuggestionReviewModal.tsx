
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, CheckCircle, XCircle, Clock, MapPin, AlertCircle, Loader2, Award, ShieldAlert, Edit3, Wand2, AlertOctagon, UserX, PenTool, Plus, AlertTriangle, Link as LinkIcon, Pencil, Calendar } from 'lucide-react';
import { SuggestionRequest, PointOfInterest, User } from '../../types/index';
import { getCityDetails } from '../../services/cityService';
import { applySuggestion, updateSuggestionStatus, getAllSuggestionsAsync } from '../../services/communityService';
import { getAiClient } from '../../services/ai/aiClient';
import { cleanJsonOutput } from '../../services/ai';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { CONFIG } from '../../config/env';

interface Props {
    suggestion: SuggestionRequest;
    onClose: () => void;
    onUpdate: () => void;
    onUserUpdate?: (user: User) => void;
}

const REJECTION_REASONS = [
    "Luogo già presente nel database",
    "Dati insufficienti o poco precisi",
    "Luogo inesistente o chiuso definitivamente",
    "Contenuto non appropriato",
    "Duplicato di un'altra segnalazione",
    "Altro (vedi nota)"
];

const SHOWCASE_DURATIONS = [
    { label: '1 Mese (Standard)', value: 1 },
    { label: '2 Mesi', value: 2 },
    { label: '3 Mesi (Speciale)', value: 3 },
    { label: 'Indefinito (Sempre Novità)', value: 99 }
];

export const SuggestionReviewModal = ({ suggestion, onClose, onUpdate, onUserUpdate }: Props) => {
    const [isApplying, setIsApplying] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isAiChecking, setIsAiChecking] = useState(false);
    
    const [localError, setLocalError] = useState<string | null>(null);
    const [duplicateFound, setDuplicateFound] = useState<{name: string, id: string} | null>(null);
    const [showRejectionOverlay, setShowRejectionOverlay] = useState(false);
    
    const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
    const [rejectionNote, setRejectionNote] = useState('');
    const [monthsInNew, setMonthsInNew] = useState(1);

    const [editData, setEditData] = useState({
        title: suggestion.details.title,
        description: suggestion.details.description,
        category: suggestion.details.category || 'monument',
        address: suggestion.details.address || '',
        openingHours: suggestion.details.openingHours || '',
        coords: suggestion.details.coords || { lat: 0, lng: 0 },
        adminNotes: suggestion.adminNotes || ''
    });

    const [currentPoi, setCurrentPoi] = useState<PointOfInterest | null>(null);
    const [allCityPois, setAllCityPois] = useState<PointOfInterest[]>([]);
    const [loadingCurrent, setLoadingCurrent] = useState(false);

    const isNewPlace = suggestion.type === 'new_place';

    const calculatedExpiryDate = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthsInNew);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    }, [monthsInNew]);

    const isGpsValid = editData.coords.lat !== 0 && editData.coords.lng !== 0;
    const isTitleValid = editData.title.trim().length > 3;
    const isAlreadyApproved = suggestion.status === 'approved';
    
    const canApply = isGpsValid && isTitleValid && !isAlreadyApproved && (!isNewPlace || !duplicateFound);
    const canPending = !isAlreadyApproved;

    useEffect(() => {
        setLoadingCurrent(true);
        getCityDetails(suggestion.cityId).then(city => {
            if (city) {
                setAllCityPois(city.details.allPois || []);
                if (suggestion.poiId) {
                    const poi = city.details.allPois.find(p => p.id === suggestion.poiId);
                    if (poi) setCurrentPoi(poi);
                }
            }
            setLoadingCurrent(false);
        });
    }, [suggestion]);
    
    // GESTIONE ESC STABILE CON REF
    const stateRef = useRef({ showRejectionOverlay, onClose });
    useEffect(() => { stateRef.current = { showRejectionOverlay, onClose }; }, [showRejectionOverlay, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); 

                if (stateRef.current.showRejectionOverlay) {
                    setShowRejectionOverlay(false); // Can safely call setter from here
                } else {
                    stateRef.current.onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, []);

    const handleAiDeepCheck = async () => {
        setIsAiChecking(true);
        setLocalError(null);
        setDuplicateFound(null);
        try {
            // FIX: Uso il client centralizzato
            const ai = getAiClient();
            const prompt = `Sei un verificatore di dati turistici per Touring Diary.
            L'utente ha segnalato questo luogo a ${suggestion.cityName}:
            Nome: "${editData.title}"
            Indirizzo: "${editData.address}"
            Descrizione: "${editData.description}"

            RISPONDI SOLO JSON:
            {
                "found": true,
                "title": "Nome Reale Corretto",
                "category": "monument/food/hotel/nature/leisure/discovery",
                "address": "Indirizzo completo",
                "openingHours": "09:00-20:00",
                "description": "Descrizione migliorata",
                "lat": 40.XXXX,
                "lng": 14.XXXX
            }`;

            const response = await ai.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: prompt });
            const result = JSON.parse(cleanJsonOutput(response.text || "{}"));
            
            if (result.found === false) {
                setLocalError("L'AI non ha trovato riscontri reali per questo luogo.");
                return;
            }

            const exists = allCityPois.find(p => 
                p.name.toLowerCase().trim() === result.title.toLowerCase().trim()
            );

            if (exists) {
                setDuplicateFound({ name: exists.name, id: exists.id });
                if (!suggestion.poiId) {
                    suggestion.poiId = exists.id;
                    setCurrentPoi(exists);
                }
            }

            setEditData(prev => ({
                ...prev,
                title: result.title || prev.title,
                category: result.category || prev.category,
                address: result.address || prev.address,
                openingHours: result.openingHours || prev.openingHours,
                description: result.description || prev.description,
                coords: { lat: result.lat || prev.coords.lat, lng: result.lng || prev.coords.lng }
            }));

        } catch (e: any) {
            setLocalError(`Errore controllo AI: ${e.message}`);
        } finally {
            setIsAiChecking(false);
        }
    };

    const handleApply = async () => {
        if (!canApply) return;
        setIsApplying(true);
        const result = await applySuggestion(suggestion.id, editData, monthsInNew);
        if (result.success) {
            onUpdate();
            onClose();
        }
        setIsApplying(false);
    };

    const confirmRejection = async () => {
        setIsRejecting(true);
        await updateSuggestionStatus(suggestion.id, 'rejected', editData.adminNotes, editData, {
            reason: rejectionReason,
            adminMessage: rejectionNote
        });
        onUpdate();
        onClose();
        setIsRejecting(false);
        setShowRejectionOverlay(false);
    };

    const handleSetPending = async () => {
        if (!canPending) return;
        setIsPending(true);
        await updateSuggestionStatus(suggestion.id, 'processing', editData.adminNotes, editData);
        onUpdate();
        onClose();
        setIsPending(false);
    };

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            
            {showRejectionOverlay && (
                <div className="absolute inset-0 z-[700] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/50 p-6 rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center gap-4 mb-6">
                            <div className="p-3 bg-red-900/30 rounded-full text-red-500">
                                <AlertOctagon className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Rifiuta Contributo</h3>
                            <p className="text-xs text-slate-400">Specifica il motivo. Verrà inviata una notifica all'utente.</p>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Motivazione Principale</label>
                                <select 
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                                >
                                    {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Messaggio per l'utente</label>
                                <textarea 
                                    value={rejectionNote} 
                                    onChange={e => setRejectionNote(e.target.value)}
                                    placeholder="Es: Grazie del contributo! Purtroppo il luogo è già presente..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-red-500 outline-none h-28 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectionOverlay(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all text-xs uppercase">Annulla</button>
                            <button onClick={confirmRejection} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg text-xs uppercase">Rifiuta e Invia</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-slate-900 w-full max-w-6xl h-full md:max-h-[90vh] md:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0f172a]">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl bg-slate-800 text-indigo-400`}><PenTool className="w-6 h-6"/></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Revisione Contributo</h3>
                            </div>
                            <p className="text-xs text-slate-400">Inviato da <strong className="text-indigo-400">{suggestion.userName}</strong> il {new Date(suggestion.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isNewPlace ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-blue-900/30 border-blue-500/50 text-blue-400'}`}>
                            {isNewPlace ? <Plus className="w-3.5 h-3.5"/> : <Pencil className="w-3.5 h-3.5"/>}
                            {isNewPlace ? 'Creazione Nuovo' : 'Correzione Dati'}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    <div className="flex-1 border-r border-slate-800 bg-slate-950/50 p-6 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Database Attuale</h4>
                        {loadingCurrent ? (
                            <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-slate-700"/></div>
                        ) : currentPoi ? (
                            <div className="space-y-6">
                                <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 relative grayscale opacity-50 shadow-inner">
                                    <ImageWithFallback src={currentPoi.imageUrl} className="w-full h-full object-cover" alt="Current POI"/>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="text-[10px] text-slate-600 font-bold uppercase">Nome</label><p className="text-slate-400 font-bold">{currentPoi.name}</p></div>
                                    <div><label className="text-[10px] text-slate-600 font-bold uppercase">Indirizzo</label><p className="text-slate-400 text-sm">{currentPoi.address}</p></div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-indigo-950/10 rounded-2xl border border-dashed border-indigo-900/30">
                                <Plus className="w-16 h-16 text-indigo-900 mb-4"/>
                                <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">Nuovo Luogo Proposto</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Dati Suggeriti (Modificabili)</h4>
                            <button onClick={handleAiDeepCheck} disabled={isAiChecking || isAlreadyApproved} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all transform active:scale-95">
                                {isAiChecking ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI Deep Check
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div><label className={`text-[10px] font-bold uppercase mb-1 block ${!isTitleValid ? 'text-red-500' : 'text-slate-500'}`}>Nome Luogo</label><input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className={`w-full bg-slate-950 border rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-bold ${!isTitleValid ? 'border-red-500' : 'border-slate-700'}`}/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Categoria</label>
                                    <select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-xs font-bold uppercase">
                                        <option value="monument">Monumenti</option>
                                        <option value="food">Sapori</option>
                                        <option value="hotel">Alloggi</option>
                                        <option value="nature">Natura</option>
                                        <option value="leisure">Svago</option>
                                        <option value="discovery">Novità / Altro</option>
                                    </select>
                                </div>
                                <div><label className={`text-[10px] font-bold uppercase mb-1 flex justify-between ${!isGpsValid ? 'text-red-500' : 'text-slate-500'}`}>GPS {!isGpsValid && <span className="animate-pulse">0,0 NON VALIDO</span>}</label><div className={`w-full bg-slate-950 border rounded-lg p-3 font-mono text-[10px] ${!isGpsValid ? 'border-red-500 text-red-400' : 'border-slate-700 text-emerald-400'}`}>{editData.coords.lat.toFixed(4)}, {editData.coords.lng.toFixed(4)}</div></div>
                            </div>
                            
                            <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Indirizzo Verificato</label><input value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"/></div>
                            <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Descrizione Editoriale</label><textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none focus:border-indigo-500 outline-none text-sm leading-relaxed"/></div>
                            <div className="pt-4 border-t border-slate-800"><label className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-2 mb-2"><Edit3 className="w-4 h-4"/> Note Interne Admin</label><textarea value={editData.adminNotes} onChange={e => setEditData({...editData, adminNotes: e.target.value})} placeholder="Annotazioni private..." className="w-full bg-slate-950 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-200 h-20 resize-none focus:border-indigo-500 outline-none"/></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => setShowRejectionOverlay(true)} disabled={isRejecting || isAlreadyApproved} className="flex-1 md:flex-none px-6 py-3 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase transition-all border border-red-900/30 flex items-center justify-center gap-2">{isRejecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4"/>} Rifiuta</button>
                        <button onClick={handleSetPending} disabled={isPending || !canPending} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all border flex items-center justify-center gap-2 ${canPending ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'}`}>{isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Clock className="w-4 h-4"/>} In Verifica</button>
                    </div>
                    <button onClick={handleApply} disabled={isApplying || !canApply} className={`w-full md:w-auto px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 ${canApply ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}>
                        {isApplying ? <Loader2 className="w-5 h-5 animate-spin"/> : <Award className="w-5 h-5 text-amber-300"/>} 
                        {isAlreadyApproved ? 'Già Applicato' : canApply ? 'Applica & Premia' : 'Dati Incompleti'}
                    </button>
                </div>
            </div>
        </div>
    );
};
