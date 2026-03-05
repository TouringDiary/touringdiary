
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Check, Bed, RotateCw, MapPin, Navigation, ArrowRight, Calendar, Copy, Loader2, Award, User, Bot, Star, Globe, Clock, ArrowLeft, X } from 'lucide-react';
import { PremadeItinerary, PointOfInterest, User as UserType } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { calculateDistance } from '../../services/geo';
import { getCityDetails } from '../../services/cityService';
import { useItinerary } from '../../context/ItineraryContext';
import { PoiDetailModal } from '../modals/PoiDetailModal';
import { getGuestUser } from '../../services/userService';

const prettify = (str: string) => str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

interface Props {
    itinerary: PremadeItinerary;
    onBack: () => void;
    onImportConfirm: (customStays: any, startDate: string) => void;
    userLocation?: { lat: number; lng: number } | null;
    user?: UserType;
    onOpenAuth?: () => void;
}

export const ItineraryDetail = ({ itinerary, onBack, onImportConfirm, userLocation, user, onOpenAuth }: Props) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [customStays, setCustomStays] = useState<any>({});
    const [resolvedItems, setResolvedItems] = useState<any[]>([]);
    const [availableHotels, setAvailableHotels] = useState<PointOfInterest[]>([]);
    
    const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
    const [showDateConfig, setShowDateConfig] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const now = new Date();
    const minDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [startDate, setStartDate] = useState<string>(minDateStr);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const resolvePois = async () => {
            setIsLoading(true);
            setIsFlipped(false);
            setCustomStays({});
            setAvailableHotels([]);

            // Recupera i cityId univoci dalle tappe
            const uniqueCityIds = Array.from(new Set(itinerary.items.map(i => i.cityId || itinerary.mainCity.toLowerCase())));
            
            // Scarichiamo i dati delle città coinvolte
            // Safe call: handle partial failures
            const citiesDataResults = await Promise.all(uniqueCityIds.map(id => getCityDetails(id)));
            const allPoisMap = new Map();
            const foundHotels: PointOfInterest[] = [];
            
            citiesDataResults.forEach(city => {
                if (city && city.details && city.details.allPois) {
                    city.details.allPois.forEach(poi => {
                        allPoisMap.set(poi.id, poi);
                        if (poi.category === 'hotel' || poi.category as string === 'alloggi') {
                            foundHotels.push(poi);
                        }
                    });
                }
            });
            
            // Ordina gli hotel per rating
            setAvailableHotels(foundHotels.sort((a,b) => b.rating - a.rating));

            const newResolved = itinerary.items.map((item) => {
                const fullPoi = allPoisMap.get(item.poiId);
                // Safe check: if POI is not found, coordinates are 0,0
                const coords = fullPoi?.coords || { lat: 0, lng: 0 };
                return { ...item, coords, fullPoi };
            });
            
            setResolvedItems(newResolved);
            setIsLoading(false);
        };
        resolvePois();
    }, [itinerary.id]);

    const dayExtremes = useMemo(() => {
        const extremes: Record<number, { start?: any, end?: any }> = {};
        Array.from({ length: itinerary.durationDays }).forEach((_, dIdx) => {
            const dayItems = resolvedItems.filter(i => i.dayIndex === dIdx);
            if (dayItems.length > 0) extremes[dIdx] = { start: dayItems[0], end: dayItems[dayItems.length - 1] };
        });
        return extremes;
    }, [resolvedItems, itinerary.durationDays]);

    const assignStay = (dayIndex: number, type: 'start' | 'end', hotel: any) => setCustomStays((prev: any) => ({ ...prev, [dayIndex]: { ...prev[dayIndex], [type]: hotel } }));
    const clearStay = (dayIndex: number, type: 'start' | 'end') => setCustomStays((prev: any) => {
        const newState = { ...prev };
        if (newState[dayIndex]) {
            const newDay = { ...newState[dayIndex] };
            delete newDay[type];
            if (!newDay.start && !newDay.end) delete newState[dayIndex];
            else newState[dayIndex] = newDay;
        }
        return newState;
    });

    const handleImport = async () => {
        setIsImporting(true);
        await onImportConfirm(customStays, startDate);
        setIsImporting(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#020617] perspective-1000 relative">
             <div className={`relative flex-1 transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                 
                 <div className={`absolute inset-0 backface-hidden flex flex-col bg-[#020617] z-10 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                    <div className="relative h-64 shrink-0 overflow-hidden">
                        <ImageWithFallback 
                            src={itinerary.coverImage} 
                            alt={itinerary.title} 
                            className="w-full h-full object-cover"
                            priority={true}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent"></div>
                        <div className="absolute top-6 left-8 z-20 flex items-center gap-4">
                            <button onClick={onBack} className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-95 group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform"/>
                            </button>
                            <span className={`text-[10px] font-black text-white px-3 py-1 rounded-full backdrop-blur-md border uppercase tracking-widest flex items-center gap-2 shadow-2xl ${itinerary.type === 'official' ? 'bg-amber-600/80 border-amber-500' : 'bg-indigo-600/80 border-indigo-400'}`}>
                                {itinerary.type === 'official' ? <Award className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                                {itinerary.type === 'official' ? 'TOURING DIARY' : 'DIARIO COMMUNITY'}
                            </span>
                        </div>
                        <div className="absolute bottom-8 left-8 right-8">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] backdrop-blur-sm">
                                    {prettify(itinerary.zone)}
                                </span>
                                <div className="flex items-center gap-1.5 text-amber-400 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
                                    <Star className="w-4 h-4 fill-current"/>
                                    <span className="font-black text-sm">{itinerary.rating}</span>
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none tracking-tighter drop-shadow-2xl">{itinerary.title}</h2>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2 text-slate-200">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-400 shadow-lg">{(itinerary.author || 'U').charAt(0)}</div>
                                    <span className="text-sm font-bold tracking-wide">di <strong className="text-white">{itinerary.author || 'Utente Local'}</strong></span>
                                </div>
                                <div className="h-4 w-px bg-slate-700"></div>
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest"><Calendar className="w-4 h-4 text-amber-500"/> {itinerary.durationDays} Giorni</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:px-12 md:py-10 md:pr-96 custom-scrollbar bg-[#020617]">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin"/>
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Sincronizzazione tappe...</p>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-12 pb-32">
                                {Array.from({ length: itinerary.durationDays }).map((_, dayIdx) => {
                                    const dayItems = resolvedItems.filter(i => i.dayIndex === dayIdx);
                                    return (
                                        <div key={dayIdx} className="relative pl-16">
                                            <div className="absolute left-[30px] top-10 bottom-0 w-1 bg-gradient-to-b from-indigo-500/30 to-transparent rounded-full"></div>
                                            <div className="absolute left-0 top-0 w-16 h-16 rounded-3xl bg-slate-900 border-2 border-indigo-500 flex flex-col items-center justify-center shadow-2xl z-10">
                                                <span className="text-[8px] font-black text-indigo-400 uppercase leading-none mb-1">Giorno</span>
                                                <span className="text-2xl font-display font-black text-white leading-none">{dayIdx + 1}</span>
                                            </div>
                                            <div className="space-y-4 pt-4">
                                                {dayItems.length === 0 && <div className="p-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 text-slate-600 italic">Nessuna tappa.</div>}
                                                {dayItems.map((item, idx) => {
                                                    const nextItem = dayItems[idx + 1];
                                                    const distToNext = (item.coords.lat !== 0 && nextItem?.coords.lat !== 0) 
                                                        ? calculateDistance(item.coords.lat, item.coords.lng, nextItem.coords.lat, nextItem.coords.lng) 
                                                        : null;

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <div onClick={() => item.fullPoi && setPreviewPoi(item.fullPoi)} className="bg-slate-900/60 border border-slate-800 p-4 rounded-[2rem] flex items-center gap-5 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg">
                                                                <div className="w-16 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-5"><div className="text-lg font-mono font-black text-indigo-400 leading-none">{item.timeSlotStr}</div></div>
                                                                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-slate-800"><ImageWithFallback src={item.fullPoi?.imageUrl || ''} alt={item.fallbackName || ''} className="w-full h-full object-cover"/></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-white text-lg leading-tight truncate">{item.fallbackName || item.fullPoi?.name}</h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{prettify(item.cityId)}</span>
                                                                        {item.note && <span className="text-[10px] text-slate-400 italic truncate">"{item.note}"</span>}
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-all group-hover:translate-x-1"/>
                                                            </div>
                                                            {distToNext !== null && distToNext > 0 && (
                                                                <div className="ml-24 flex items-center gap-2 text-slate-500 animate-in fade-in slide-in-from-left-2">
                                                                    <div className="h-4 w-px bg-slate-800"></div>
                                                                    <Navigation className="w-3 h-3 text-indigo-500 transform rotate-45"/>
                                                                    <span className="text-[10px] font-mono font-black uppercase tracking-widest">{distToNext} km</span>
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* BACKSIDE: ALLOGGI */}
                 <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-[#020617] flex flex-col z-10 ${!isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                     <div className="flex justify-between items-center px-8 py-4 border-b border-slate-800 bg-[#0f172a] shrink-0">
                         <button onClick={() => setIsFlipped(false)} className="flex items-center gap-2 px-6 py-2.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-slate-700"><ChevronLeft className="w-4 h-4"/> Torna alla Timeline</button>
                         <button onClick={() => { setIsFlipped(false); setShowDateConfig(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all"><Check className="w-4 h-4"/> Conferma Alloggi</button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#020617]">
                         <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <h3 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tight">Logistic Alloggi</h3>
                                <p className="text-slate-400 text-base max-w-2xl mx-auto">Valuta la comodità degli alloggi reali in base alla distanza dalla prima e ultima tappa di ogni giornata.</p>
                            </div>
                            
                            {availableHotels.length === 0 ? (
                                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                                    Nessun hotel disponibile nelle città dell'itinerario.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {availableHotels.map((hotel: PointOfInterest) => (
                                        <div key={hotel.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden transition-all flex flex-col h-full shadow-2xl group hover:border-indigo-500/30">
                                            <div className="h-40 relative shrink-0">
                                                <ImageWithFallback src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" category="hotel"/>
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">{hotel.subCategory || 'Hotel'}</div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h4 className="text-xl font-bold text-white mb-1 leading-tight">{hotel.name}</h4>
                                                <div className="flex items-center gap-1.5 mb-6"><StarRating value={hotel.rating} size="w-3 h-3"/><span className="text-[10px] text-slate-500 font-bold">{hotel.rating}</span></div>
                                                <div className="space-y-3">
                                                    {Array.from({ length: itinerary.durationDays }).map((_, dIdx) => {
                                                        const extremes = dayExtremes[dIdx];
                                                        const distToStart = extremes?.start && extremes.start.coords.lat !== 0 ? calculateDistance(hotel.coords.lat, hotel.coords.lng, extremes.start.coords.lat, extremes.start.coords.lng) : null;
                                                        const distToEnd = extremes?.end && extremes.end.coords.lat !== 0 ? calculateDistance(hotel.coords.lat, hotel.coords.lng, extremes.end.coords.lat, extremes.end.coords.lng) : null;
                                                        const isStart = customStays[dIdx]?.start?.id === hotel.id;
                                                        const isEnd = customStays[dIdx]?.end?.id === hotel.id;
                                                        return (
                                                            <div key={dIdx} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giorno {dIdx+1}</span>
                                                                    <div className="flex gap-2">
                                                                        <button type="button" onClick={() => isStart ? clearStay(dIdx, 'start') : assignStay(dIdx, 'start', hotel)} className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${isStart ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>Start</button>
                                                                        <button type="button" onClick={() => isEnd ? clearStay(dIdx, 'end') : assignStay(dIdx, 'end', hotel)} className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${isEnd ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>End</button>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                                                        <div className="text-[7px] font-bold text-slate-600 uppercase mb-1">Dallo Start</div>
                                                                        <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1"><Navigation className="w-2.5 h-2.5 text-indigo-400 rotate-45"/> {distToStart !== null ? `${distToStart} km` : '--'}</div>
                                                                    </div>
                                                                    <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                                                        <div className="text-[7px] font-bold text-slate-600 uppercase mb-1">Al Rientro</div>
                                                                        <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1"><Navigation className="w-2.5 h-2.5 text-emerald-400 rotate-45"/> {distToEnd !== null ? `${distToEnd} km` : '--'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                     </div>
                 </div>
             </div>

             <div className="absolute bottom-8 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
                {showDateConfig ? (
                    <div className="bg-slate-900 border-2 border-indigo-500 rounded-[2.5rem] shadow-2xl p-8 w-full max-sm animate-in slide-in-from-bottom-6 pointer-events-auto relative">
                        <button onClick={() => setShowDateConfig(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3"><Calendar className="w-7 h-7 text-indigo-500"/> Date del viaggio</h3>
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 ml-1">Data Inizio</label><input type="date" min={minDateStr} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none"/></div>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleImport} disabled={isImporting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">{isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Copy className="w-5 h-5"/>} CLONA NEL DIARIO</button>
                                <button onClick={() => { setIsFlipped(true); setShowDateConfig(false); }} className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                    <Bed className="w-4 h-4"/> Modifica Alloggi
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col items-end gap-4 animate-in fade-in pointer-events-auto ${isFlipped ? 'hidden' : ''}`}>
                         <button onClick={() => setIsFlipped(true)} className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl text-indigo-400 hover:text-white px-8 py-4 rounded-full shadow-2xl border border-indigo-500/30 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                            <Bed className="w-5 h-5"/> {Object.keys(customStays).length > 0 ? 'Modifica Alloggi' : 'Personalizza Alloggi'}
                        </button>
                        <button onClick={() => { setShowDateConfig(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-6 rounded-[2.2rem] shadow-2xl shadow-indigo-900/60 font-black text-base uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105 active:scale-95 border-2 border-indigo-400/50">
                            <Copy className="w-6 h-6"/> Clona questo Viaggio
                        </button>
                    </div>
                )}
             </div>

             {previewPoi && (
                <PoiDetailModal 
                    poi={previewPoi} 
                    onClose={() => setPreviewPoi(null)} 
                    onToggleItinerary={() => {}} 
                    isInItinerary={false} 
                    onOpenReview={() => {}} 
                    /* Fix: removed redundant hasVoted prop */
                    userLocation={userLocation || null}
                    user={user || getGuestUser()}
                    onOpenAuth={onOpenAuth || (() => {})}
                />
            )}
        </div>
    );
};
