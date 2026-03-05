
import React, { useState, useEffect } from 'react';
import { X, Send, MapPin, AlertTriangle, CheckCircle, Loader2, Trophy, Rocket, LogIn, Tag, Utensils, Sparkles, Pencil, CheckSquare, Square, Plus, Briefcase } from 'lucide-react';
import { SuggestionType, PointOfInterest, User as UserType } from '../../types/index';
import { addSuggestion } from '../../services/communityService';

interface SuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    cityId: string;
    cityName: string;
    user: UserType;
    onOpenAuth?: () => void; 
    initialType?: SuggestionType;
    prefilledName?: string;
    existingPois?: PointOfInterest[];
    isServiceContext?: boolean; // NEW PROP: Cambia le label per i servizi
}

export const SuggestionModal = ({ isOpen, onClose, cityId, cityName, user, onOpenAuth, initialType = 'new_place', prefilledName = '', existingPois = [], isServiceContext = false }: SuggestionModalProps) => {
    const isGuest = user.role === 'guest';
    const [activeType, setActiveType] = useState<SuggestionType>(initialType);
    
    // Form State
    const [formData, setFormData] = useState({ 
        title: prefilledName || '', 
        category: 'monument', 
        address: '', 
        description: '', 
        link: '' 
    });

    // Error Types State (Checkbox)
    const [errorTypes, setErrorTypes] = useState({
        name: false,
        location: false,
        hours: false,
        photo: false
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    const [duplicateWarningActive, setDuplicateWarningActive] = useState(false);
    const [matchedPoiName, setMatchedPoiName] = useState<string | null>(null);

    // LABELS DYNAMICHE
    const labelNew = isServiceContext ? "Nuovo Servizio" : "Nuovo Luogo";
    const labelEdit = isServiceContext ? "Modifica Servizio" : "Modifica Luogo";
    const labelName = isServiceContext ? "Nome del Servizio" : "Nome del Luogo";
    const labelPlaceholder = isServiceContext ? "Es: Bus 151, Taxi Napoli..." : "Es: Pizzeria Brandi";

    // UPDATED: Logic for description label
    const labelDescription = (isServiceContext && activeType === 'edit_info') 
        ? "Dettagli Modifica" 
        : (isServiceContext ? 'Dettagli Servizio' : 'Descrizione / Note sulla Modifica');

    // GESTIONE PRIORITARIA TASTO ESC (Simile ad AuthModal)
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onClose();
            }
        };
        // Usa { capture: true } per intercettare l'evento PRIMA che raggiunga il modale sottostante.
        window.addEventListener('keydown', handleEsc, { capture: true });
        return () => window.removeEventListener('keydown', handleEsc, { capture: true });
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setActiveType(initialType);
            setFormData({ 
                title: initialType === 'edit_info' && existingPois.length > 0 ? (prefilledName || existingPois[0].name) : (prefilledName || ''), 
                category: 'monument', 
                address: '', 
                description: '', 
                link: '' 
            });
            setErrorTypes({ name: false, location: false, hours: false, photo: false });
            setIsSuccess(false); 
            setFormError(null);
            setDuplicateWarningActive(false);
            setMatchedPoiName(null);
        }
    }, [isOpen, initialType, prefilledName, existingPois]);

    const toggleErrorType = (key: keyof typeof errorTypes) => {
        setErrorTypes(prev => ({ ...prev, [key]: !prev[key] }));
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError(null);

        // 1. Validazione Campi Base
        if (!formData.title.trim() || !formData.description.trim()) {
            setFormError("Nome e Descrizione sono obbligatori.");
            return;
        }

        if (!isServiceContext && !formData.address.trim()) {
             setFormError("L'indirizzo è obbligatorio per i luoghi.");
             return;
        }

        // 2. Validazione Specifica Modifica (Almeno un quadratino spuntato)
        if (activeType === 'edit_info') {
            const hasSelection = Object.values(errorTypes).some(v => v === true);
            if (!hasSelection) {
                setFormError("Seleziona almeno un dato errato da correggere.");
                return;
            }
        }

        // 3. Controllo duplicati (Solo per NUOVI LUOGHI)
        if (activeType === 'new_place' && !duplicateWarningActive && existingPois.length > 0) {
            const match = existingPois.find(p => 
                p.name.toLowerCase().trim() === formData.title.toLowerCase().trim() ||
                (formData.title.length > 5 && p.name.toLowerCase().includes(formData.title.toLowerCase().trim()))
            );

            if (match) {
                setMatchedPoiName(match.name);
                setDuplicateWarningActive(true);
                return; 
            }
        }

        setIsSubmitting(true);
        
        // Identifichiamo il poiId se siamo in modalità modifica
        let poiId = undefined;
        if (activeType === 'edit_info') {
            const matchedPoi = existingPois.find(p => p.name === formData.title);
            if (matchedPoi) poiId = matchedPoi.id;
        }

        addSuggestion({
            userId: user.id,
            userName: user.name,
            cityId: cityId,
            cityName: cityName,
            poiId: poiId,
            type: activeType,
            details: {
                title: formData.title,
                category: formData.category as any,
                description: formData.description,
                address: formData.address,
                ...(activeType === 'edit_info' ? { errorTypes } : {})
            }
        });

        await new Promise(r => setTimeout(r, 1200));
        setIsSubmitting(false); 
        setIsSuccess(true);
    };

    if (!isOpen) return null;

    const cleanFirstName = user.name.split(' ')[0].replace(/\(.*?\)/g, '').trim();

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4 pt-28 pb-10">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-slate-900 w-full max-w-lg h-full md:h-auto md:max-h-full md:rounded-[2.5rem] border-0 md:border border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 flex flex-col">
                
                <div className="p-5 md:px-8 md:py-6 border-b border-slate-800 bg-gradient-to-br from-[#0f172a] to-slate-900 shrink-0 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Rocket className="w-16 h-16 text-indigo-500"/></div>
                    <div className="relative z-10">
                        <h3 className="text-xl md:text-2xl font-display font-bold text-white leading-tight">
                            {isServiceContext ? 'Segnala Servizio' : 'Migliora la Guida'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Il tuo contributo vale <strong className="text-amber-500">+30 XP</strong> <span className="opacity-70">(salvo approvazione)</span>
                        </p>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-5 right-6 p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all shadow-2xl z-50 group scale-100"
                        title="Chiudi (ESC)"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform"/>
                    </button>
                </div>

                {isGuest ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-[#020617]">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-xl"><LogIn className="w-8 h-8 text-amber-500 opacity-50"/></div>
                        <div><h4 className="text-xl font-bold text-white mb-2">Accesso Richiesto</h4><p className="text-slate-400 text-xs">Esegui il login per suggerire modifiche.</p></div>
                        <button onClick={onOpenAuth} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs shadow-xl transition-all">ACCEDI ORA</button>
                    </div>
                ) : isSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-[#020617]">
                        <Trophy className="w-16 h-16 text-amber-500 animate-bounce"/>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-display font-bold text-white leading-none">Grazie {cleanFirstName}!</h4>
                            <p className="text-slate-400 text-base">Il team verificherà i dati al più presto.</p>
                        </div>
                        <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3.5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all transform hover:scale-105">CHIUDI</button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 md:px-8 custom-scrollbar bg-[#020617]">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {duplicateWarningActive && activeType === 'new_place' && (
                                <div className="p-4 bg-amber-900/40 border-2 border-amber-500 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 shadow-lg shadow-amber-950/50">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                                    <div>
                                        <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">Già esistente?</p>
                                        <p className="text-xs text-slate-100 leading-snug">
                                            Abbiamo trovato "<span className="font-bold text-white">{matchedPoiName}</span>" nella nostra guida. 
                                            Sei sicuro che sia diverso?
                                        </p>
                                        <p className="text-[9px] text-amber-200/70 mt-1.5 font-bold uppercase italic">Clicca di nuovo su INVIA per confermare.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tipologia Contributo *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveType('new_place')} 
                                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${activeType === 'new_place' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <Plus className="w-3.5 h-3.5"/>
                                        <span className="text-[11px] font-bold">{labelNew}</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveType('edit_info')} 
                                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${activeType === 'edit_info' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <Pencil className="w-3.5 h-3.5"/>
                                        <span className="text-[11px] font-bold">{labelEdit}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{labelName} *</label>
                                {activeType === 'edit_info' && existingPois.length > 0 ? (
                                    <select 
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none font-bold text-sm"
                                    >
                                        {existingPois.map(poi => (
                                            <option key={poi.id} value={poi.name}>{poi.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        className={`w-full bg-slate-900 border rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none font-bold text-sm transition-all ${duplicateWarningActive && activeType === 'new_place' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-700'}`} 
                                        value={formData.title} 
                                        onChange={e => { setFormData({...formData, title: e.target.value}); setDuplicateWarningActive(false); }} 
                                        placeholder={labelPlaceholder} 
                                        required
                                    />
                                )}
                            </div>

                            {/* QUADRATINI SELEZIONE ERRORI (Solo in modalità Edit) */}
                            {activeType === 'edit_info' && (
                                <div className="space-y-2 py-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cosa c'è di errato? *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'name', label: 'Nome' },
                                            { id: 'location', label: 'Luogo/Mappa' },
                                            { id: 'hours', label: 'Orario/Contatti' },
                                            { id: 'photo', label: 'Foto/Descrizione' }
                                        ].map(err => {
                                            const isSelected = errorTypes[err.id as keyof typeof errorTypes];
                                            return (
                                                <button 
                                                    key={err.id} 
                                                    type="button"
                                                    onClick={() => toggleErrorType(err.id as keyof typeof errorTypes)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${isSelected ? 'bg-indigo-900/30 border-indigo-500 text-indigo-100' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                                >
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400"/> : <Square className="w-4 h-4"/>}
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">{err.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    {isServiceContext ? 'Info di Contatto / Posizione' : 'Indirizzo / Posizione Corretta'} {isServiceContext ? '' : '*'}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
                                    <input 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 pl-10 text-white focus:border-indigo-500 outline-none placeholder-slate-600 text-sm" 
                                        value={formData.address} 
                                        onChange={e => setFormData({...formData, address: e.target.value})} 
                                        placeholder={isServiceContext ? "Es. Sito Web, Telefono o Fermata" : "Es: Via Chiaia 1, Napoli"} 
                                        required={!isServiceContext}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    {labelDescription} *
                                </label>
                                <textarea 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none h-20 resize-none leading-relaxed text-sm" 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    placeholder={isServiceContext ? "Descrivi il servizio, orari, frequenza..." : "Spiegaci brevemente cosa dobbiamo correggere..."} 
                                    required
                                />
                            </div>

                            {formError && <div className="p-2.5 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-[10px] flex items-center gap-2 animate-pulse font-bold uppercase tracking-tight"><X className="w-3.5 h-3.5"/> {formError}</div>}

                            <div className="pt-2">
                                <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px] ${duplicateWarningActive && activeType === 'new_place' ? 'bg-amber-600 hover:bg-amber-500 text-black' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
                                    {duplicateWarningActive && activeType === 'new_place' ? 'INVIA COMUNQUE' : 'INVIA SEGNALAZIONE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
