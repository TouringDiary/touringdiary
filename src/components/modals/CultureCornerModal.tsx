
import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Quote, MapPin, Plus, Star, Award, ArrowRight, Film, Sparkles, Clock, Heart, ChevronRight, Lightbulb, ScrollText, CheckCircle } from 'lucide-react';
import { CityDetails, FamousPerson, PointOfInterest } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { openMap } from '../../utils/common';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city: CityDetails;
    onAddToItinerary: (poi: PointOfInterest) => void;
    initialPersonId?: string;
}

export const CultureCornerModal = ({ isOpen, onClose, city, onAddToItinerary, initialPersonId }: Props) => {
    const [selectedPerson, setSelectedPerson] = useState<FamousPerson | null>(null);
    const selectedPersonRef = useRef<FamousPerson | null>(null);
    const [addedPlaces, setAddedPlaces] = useState<Set<string>>(new Set());

    // Derived state for list view
    const people = city.details.famousPeople || [];

    useEffect(() => {
        selectedPersonRef.current = selectedPerson;
    }, [selectedPerson]);

    useEffect(() => {
        if (isOpen && initialPersonId) {
            const target = city.details.famousPeople?.find(p => p.id === initialPersonId);
            if (target) setSelectedPerson(target);
        } else if (isOpen && !initialPersonId) {
            setSelectedPerson(null);
        }
        setAddedPlaces(new Set()); // Reset added state on open
    }, [isOpen, initialPersonId, city.details.famousPeople]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedPersonRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPerson(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isOpen, onClose]);

    const handleAddPlace = (e: React.MouseEvent, place: any) => {
        e.stopPropagation();
        const poi: PointOfInterest = {
            id: place.id || `rel-${Date.now()}`,
            name: place.name,
            description: place.notes || `Luogo legato a ${selectedPerson?.name}`,
            category: 'monument', // Default a monument
            imageUrl: selectedPerson?.imageUrl || '', 
            coords: place.coords,
            address: place.address,
            rating: 5,
            votes: 0,
            visitDuration: place.visitDuration || '1h',
            priceLevel: place.priceLevel || 1
        };
        onAddToItinerary(poi);
        setAddedPlaces(prev => new Set(prev).add(place.name));
    };

    // --- PREMIUM TEXT RENDERER CON PARSER "TITOLO:" INTELLIGENTE ---
    const renderSmartContent = (text: string) => {
        if (!text) return null;

        // 1. Pulizia iniziale
        const cleanText = text
            .replace(/\*\*/g, '')          // Via i bold markdown residui
            .replace(/^\s*[\*\-]\s+/gm, ''); // Via bullet points all'inizio riga

        const lines = cleanText.split('\n');
        
        return (
            <div className="space-y-4">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // CHECK NUOVO FORMATO "TITOLO: "
                    // Gestisce sia "TITOLO: Titolo\nTesto" che "TITOLO: Titolo. Testo" (Inline)
                    if (trimmed.toUpperCase().startsWith('TITOLO:')) {
                        // Rimuovi il prefisso "TITOLO:"
                        const contentWithoutPrefix = trimmed.substring(7).trim();
                        
                        // Cerca se c'è un punto che separa titolo e corpo (se l'AI ha messo tutto su una riga)
                        // Logica: Cerca il primo punto, esclamativo o interrogativo seguito da spazio o fine stringa.
                        // Usiamo una regex che cattura il primo "sentence ender"
                        const splitMatch = contentWithoutPrefix.match(/^(.+?)(\.|\!|\?)(\s+|$)(.*)/s);
                        
                        if (splitMatch && splitMatch[4].trim().length > 0) {
                            // CASO INLINE: "Le Origini. Ciro nasce a..."
                            // splitMatch[1] = "Le Origini"
                            // splitMatch[2] = "."
                            // splitMatch[4] = "Ciro nasce a..."
                            
                            const titlePart = splitMatch[1] + splitMatch[2]; // "Le Origini." (Manteniamo la punteggiatura se stilistica, oppure no)
                            const bodyPart = splitMatch[4]; // "Ciro nasce a..."
                            
                            // Visualizziamo Titolo e poi Paragrafo
                            return (
                                <React.Fragment key={`line-${idx}`}>
                                    <h3 className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit">
                                        {titlePart.replace(/[\.:]$/, '')} {/* Puliamo punto finale dal titolo per estetica */}
                                    </h3>
                                    <p className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">
                                        {bodyPart}
                                    </p>
                                </React.Fragment>
                            );
                        } else {
                            // CASO SOLO TITOLO (Il corpo è nella riga successiva)
                            return (
                                <h3 key={`line-${idx}`} className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit">
                                    {contentWithoutPrefix.replace(/[\.:]$/, '')}
                                </h3>
                            );
                        }
                    }

                    // Logica Fallback per vecchi formati (Titoli tutti maiuscoli)
                    const isOldSchoolTitle = trimmed.length > 3 && trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.endsWith('.');
                    
                    if (isOldSchoolTitle) {
                         return (
                            <h3 key={`line-${idx}`} className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit">
                                {trimmed.replace(/:$/, '')}
                            </h3>
                        );
                    }

                    // Paragrafo Standard
                    return (
                        <p key={`line-${idx}`} className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">
                            {trimmed}
                        </p>
                    );
                })}
            </div>
        );
    };

    if (!isOpen) return null;

    if (selectedPerson) {
        const hasStats = selectedPerson.careerStats && selectedPerson.careerStats.length > 0;
        
        return (
            <div className="fixed top-0 bottom-0 left-0 right-0 z-[2200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
                <div className="w-full h-full md:max-w-7xl md:h-[95vh] bg-[#0b0f1a] md:rounded-3xl relative flex flex-col md:flex-row overflow-hidden shadow-2xl md:border border-slate-800">
                    
                    {/* CLOSE DETAIL BUTTON */}
                    <button 
                        onClick={() => setSelectedPerson(null)} 
                        className="absolute top-6 right-6 z-50 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                    >
                        <X className="w-6 h-6"/>
                    </button>

                    {/* LEFT COLUMN: HERO IMAGE & KEY INFO */}
                    <div className="w-full md:w-[45%] lg:w-[40%] h-[40vh] md:h-full relative shrink-0">
                        <ImageWithFallback 
                            src={selectedPerson.imageUrl} 
                            alt={selectedPerson.name} 
                            className="w-full h-full object-cover grayscale brightness-75 contrast-125"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0b0f1a]"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-4 shadow-black drop-shadow-2xl">
                                {selectedPerson.name}
                            </h2>
                            <div className="flex flex-col gap-3 items-start">
                                <div className="inline-block bg-amber-500 text-black text-sm font-black uppercase tracking-[0.2em] px-4 py-1.5 shadow-lg transform -skew-x-12">
                                    {selectedPerson.role}
                                </div>
                                {selectedPerson.lifespan && (
                                    <div className="text-slate-300 font-mono text-base md:text-lg font-bold tracking-widest pl-1 border-l-2 border-amber-500/50">
                                        {selectedPerson.lifespan}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CONTENT SCROLLABLE */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0f1a] relative">
                        <div className="p-8 md:p-16 space-y-10 max-w-4xl mx-auto">
                            
                            {/* QUOTE */}
                            {selectedPerson.quote && (
                                <div className="relative pl-12 py-4 border-l-4 border-indigo-500 bg-indigo-900/10 rounded-r-xl pr-6 mt-6 md:mt-0">
                                    <Quote className="absolute top-4 left-4 w-6 h-6 text-indigo-400 opacity-50" />
                                    <p className="text-xl md:text-2xl font-serif italic text-indigo-100 leading-relaxed">
                                        "{selectedPerson.quote}"
                                    </p>
                                </div>
                            )}

                            {/* MAIN BIO CONTENT */}
                            <div className="space-y-6">
                                {renderSmartContent(selectedPerson.fullBio || selectedPerson.bio)}
                            </div>

                            {/* STATS - FIX LAYOUT OVERFLOW */}
                            {hasStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-8 border-y border-slate-800/50">
                                    {selectedPerson.careerStats!.map((stat, idx) => (
                                        <div key={idx} className="bg-slate-900/50 p-3 md:p-4 rounded-2xl border border-slate-800 text-center hover:border-amber-500/30 transition-colors flex flex-col items-center justify-center min-h-[90px]">
                                            {/* Usa break-words e leading-tight per gestire parole lunghe come 'Dinastia' */}
                                            <div className="text-lg md:text-xl lg:text-2xl font-black text-white font-display mb-1 break-words w-full leading-tight hyphens-auto">
                                                {stat.value}
                                            </div>
                                            <div className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-snug">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* RELATED PLACES - SEZIONE POTENZIATA */}
                             {selectedPerson.relatedPlaces && selectedPerson.relatedPlaces.length > 0 && (
                                <div className="space-y-8 pt-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-emerald-500"/> I Luoghi di {selectedPerson.name.split(' ')[0]}
                                        </h3>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedPerson.relatedPlaces.map((place, idx) => {
                                            const isAdded = addedPlaces.has(place.name);
                                            const price = place.priceLevel || 1;
                                            
                                            return (
                                                <div key={place.id || `place-${idx}`} className="group bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-900/10">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400">
                                                                <MapPin className="w-5 h-5"/>
                                                            </div>
                                                            <h4 className="font-bold text-white text-xl group-hover:text-indigo-400 transition-colors">{place.name}</h4>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => openMap(place.coords.lat, place.coords.lng)}
                                                            className="text-slate-400 text-sm hover:text-white hover:underline decoration-indigo-500 underline-offset-4 transition-all mb-3 flex items-center gap-2"
                                                        >
                                                            {place.address} <ArrowRight className="w-3 h-3 opacity-50"/>
                                                        </button>
                                                        
                                                        {place.notes && <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3 leading-relaxed">{place.notes}</p>}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-[10px] font-bold text-amber-500 tracking-widest bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">
                                                                {[...Array(price)].map((_, i) => <span key={i}>€</span>)}
                                                            </div>
                                                            {place.visitDuration && (
                                                                <div className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3"/> {place.visitDuration}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button 
                                                            onClick={(e) => handleAddPlace(e, place)}
                                                            disabled={isAdded}
                                                            className={`
                                                                flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 w-full md:w-auto justify-center
                                                                ${isAdded ? 'bg-emerald-600 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
                                                            `}
                                                        >
                                                            {isAdded ? <CheckCircle className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
                                                            {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[2000] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-6xl h-full md:max-h-[85vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#020617] z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20 text-white">
                            <Quote className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide leading-none">Angolo Cultura</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">I Grandi Personaggi di {city.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950 custom-scrollbar">
                    {people.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {people.map((person, idx) => (
                                <div key={idx} onClick={() => setSelectedPerson(person)} className="group cursor-pointer relative h-[400px] rounded-[2rem] overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-900/20">
                                    <ImageWithFallback 
                                        src={person.imageUrl} 
                                        alt={person.name} 
                                        className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
                                        <div className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 border-l-2 border-indigo-500">
                                            {person.role}
                                        </div>
                                        <h3 className="text-3xl font-display font-bold text-white leading-[0.9] mb-2 shadow-black drop-shadow-lg">
                                            {person.name}
                                        </h3>
                                        <p className="text-slate-300 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 italic">
                                            "{person.quote || person.bio}"
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                            Scopri Storia <ChevronRight className="w-3 h-3"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                            <BookOpen className="w-16 h-16"/>
                            <p className="text-sm font-medium italic">Nessun personaggio illustre ancora in archivio per questa città.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
