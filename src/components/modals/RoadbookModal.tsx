
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Map as MapIcon, Printer, Footprints, Train, Car, ArrowRight, RefreshCw, Save, Trash2, Edit3, Plus, Coins, Navigation, Route, Loader2, Bot, MapPin, Sparkles, Receipt, Bus, Ticket, Flag, Clock, Utensils, PieChart, Timer, Landmark, ShoppingBag, Sun, Music, Download } from 'lucide-react';
import { Itinerary, RoadbookDay, RoadbookSegment } from '../../types/index';
import { generateRoadbook } from '../../services/ai/aiPlanner';
import { useItinerary } from '../../context/ItineraryContext';
import { GenerationLoader } from './AiItineraryModal';
import { calculateDistance } from '../../services/geo';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; 
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { pdf } from '@react-pdf/renderer';
import FileSaver from 'file-saver';
import { RoadbookDocument } from '../pdf/RoadbookDocument';
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    itinerary: Itinerary;
    activeCityName: string;
}

export const RoadbookModal = ({ isOpen, onClose, itinerary, activeCityName }: Props) => {
    const [localRoadbook, setLocalRoadbook] = useState<RoadbookDay[]>(itinerary.roadbook || []);
    const { updateRoadbook } = useItinerary();
    const logoBase64 = useLogoRasterizer();
    
    const [loading, setLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [segmentToDelete, setSegmentToDelete] = useState<{dayIdx: number, segIdx: number} | null>(null);

    // --- DYNAMIC STYLES ---
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    
    const h1Style = useDynamicStyles('roadbook_h1', isMobile);
    const subStyle = useDynamicStyles('roadbook_sub', isMobile);
    const dayNumStyle = useDynamicStyles('roadbook_day_num', isMobile);
    const poiTitleStyle = useDynamicStyles('roadbook_poi_title', isMobile);

    // Pattern useRef per stabilizzare il listener
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLocalRoadbook(itinerary.roadbook || []);
        }
    }, [isOpen, itinerary.roadbook]);

    const locationMap = useMemo(() => {
        const map = new Map<string, { lat: number, lng: number }>();
        itinerary.items.forEach(item => {
            if (item.poi && item.poi.coords && (item.poi.coords.lat !== 0 || item.poi.coords.lng !== 0)) {
                map.set(item.poi.name.trim().toLowerCase(), item.poi.coords);
            }
        });
        return map;
    }, [itinerary.items]);

    const getDistanceBetween = (from: string, to: string) => {
        const c1 = locationMap.get(from.trim().toLowerCase());
        const c2 = locationMap.get(to.trim().toLowerCase());
        
        if (c1 && c2) {
            const dist = calculateDistance(c1.lat, c1.lng, c2.lat, c2.lng);
            if (dist > 0) return dist;
        }
        return null;
    };

    const handleGenerate = async () => {
        if (itinerary.items.length < 2) {
            setError("Aggiungi almeno 2 tappe per generare un percorso.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const sortedItems = [...itinerary.items].sort((a,b) => 
                a.dayIndex - b.dayIndex || a.timeSlotStr.localeCompare(b.timeSlotStr)
            );
            
            const data = await generateRoadbook(sortedItems, activeCityName);
            setLocalRoadbook(data);
            updateRoadbook(data); 
        } catch (e) {
            console.error(e);
            setError("Errore nella generazione del percorso. Riprova.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveChanges = () => {
        updateRoadbook(localRoadbook);
        setIsEditing(false);
    };
    
    const handlePrint = async () => {
        if (!localRoadbook || localRoadbook.length === 0) return;
        setIsGeneratingPdf(true);
        try {
            const blob = await pdf(
                <RoadbookDocument 
                    itinerary={itinerary} 
                    roadbook={localRoadbook} 
                    activeCityName={activeCityName} 
                    logoBase64={logoBase64}
                    summaryData={summary}
                />
            ).toBlob();
            
            let namePart = itinerary.name || 'Viaggio';
            namePart = namePart.replace(/[\\/:*?"<>|]/g, '');
            FileSaver.saveAs(blob, `Roadbook-${namePart}.pdf`);
        } catch (e: any) {
            console.error("Errore salvataggio PDF Roadbook:", e);
            alert("Errore durante la generazione del PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const updateSegment = (dayIdx: number, segIdx: number, field: keyof RoadbookSegment, value: string) => {
        setLocalRoadbook(prev => {
            const newBook = [...prev];
            const day = { ...newBook[dayIdx] };
            const segments = [...day.segments];
            segments[segIdx] = { ...segments[segIdx], [field]: value };
            day.segments = segments;
            newBook[dayIdx] = day;
            return newBook;
        });
    };

    const deleteSegment = (dayIdx: number, segIdx: number) => {
        setSegmentToDelete({ dayIdx, segIdx });
    };

    const confirmDeleteSegment = () => {
        if (!segmentToDelete) return;
        const { dayIdx, segIdx } = segmentToDelete;
        setLocalRoadbook(prev => {
            const newBook = [...prev];
            const day = { ...newBook[dayIdx] };
            day.segments = day.segments.filter((_, i) => i !== segIdx);
            newBook[dayIdx] = day;
            return newBook;
        });
        setSegmentToDelete(null);
    };

    const addManualSegment = (dayIdx: number) => {
        setLocalRoadbook(prev => {
            const newBook = [...prev];
            const day = { ...newBook[dayIdx] };
            const newSeg: RoadbookSegment = {
                from: "Punto A", to: "Punto B", fromAddress: "", toAddress: "",
                transportMode: "walk", duration: "10 min", instructions: "Nuova istruzione...", tips: "", 
                transportCost: "", ticketCost: "", foodCost: ""
            };
            day.segments = [...(day.segments || []), newSeg];
            newBook[dayIdx] = day;
            return newBook;
        });
    };

    const getTransportIcon = (mode: string) => {
        switch(mode) {
            case 'walk': return <Footprints className="w-5 h-5 text-emerald-600"/>;
            case 'transit': return <Train className="w-5 h-5 text-amber-600"/>;
            case 'car': return <Car className="w-5 h-5 text-blue-600"/>;
            default: return <ArrowRight className="w-5 h-5 text-slate-500"/>;
        }
    };

    const cleanLocationName = (name: string) => {
        if (!name) return "";
        return name.replace(/^Punto di Partenza\s*[\(:-]?\s*/i, '').replace(/\)$/, '').trim();
    };
    
    // --- CALCOLO TOTALI DETTAGLIATI (PARSER ROBUSTO) ---
    const summary = useMemo(() => {
        let totalSegments = 0;
        let totalTransportCost = 0;
        let totalTicketCost = 0;
        let totalFoodCost = 0;
        let totalWalkingMinutes = 0;
        let totalTransitMinutes = 0;
        
        // Counter Categories
        const catCounts: Record<string, number> = { monument: 0, food: 0, nature: 0, leisure: 0, shopping: 0 };

        // Parse Helper Costs
        const parseCost = (str?: string) => {
            if (!str) return 0;
            const match = str.match(/(\d+[.,]\d+)/); 
            if (match) return parseFloat(match[0].replace(',', '.'));
            const matchInt = str.match(/(\d+)/);
            if (matchInt) return parseFloat(matchInt[0]);
            return 0;
        };

        // Parse Helper Time (min)
        const parseMinutes = (str: string) => {
            if (!str) return 0;
            let total = 0;
            const hMatch = str.match(/(\d+)\s*h/i);
            const mMatch = str.match(/(\d+)\s*min/i);
            if (hMatch) total += parseInt(hMatch[1]) * 60;
            if (mMatch) total += parseInt(mMatch[1]);
            return total;
        };

        localRoadbook.forEach(day => {
            day.segments.forEach(seg => {
                totalSegments++;
                totalTransportCost += parseCost(seg.transportCost);
                totalTicketCost += parseCost(seg.ticketCost);
                totalFoodCost += parseCost(seg.foodCost);     
                
                const mins = parseMinutes(seg.duration);
                if (seg.transportMode === 'walk') totalWalkingMinutes += mins;
                else totalTransitMinutes += mins;
            });
        });

        // Conta Categorie (da Itinerary Items originali per accuratezza)
        itinerary.items.forEach(item => {
            if (item.poi && item.poi.category) {
                const cat = item.poi.category;
                if (cat === 'monument') catCounts.monument++;
                else if (cat === 'food') catCounts.food++;
                else if (cat === 'nature') catCounts.nature++;
                else if (cat === 'leisure') catCounts.leisure++;
                else if (cat === 'shop') catCounts.shopping++;
            }
        });

        return { 
            totalSegments, 
            totalTransportCost, 
            totalTicketCost, 
            totalFoodCost, 
            totalWalkingMinutes, 
            totalTransitMinutes,
            catCounts 
        };
    }, [localRoadbook, itinerary.items]);

    const formatTimePretty = (mins: number) => {
        if (mins === 0) return '0 min';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm print:p-0 print:bg-white print:z-auto print:absolute">
            
            {loading && <GenerationLoader onCancel={() => setLoading(false)} />}
            
            <DeleteConfirmationModal
                isOpen={segmentToDelete !== null}
                onClose={() => setSegmentToDelete(null)}
                onConfirm={confirmDeleteSegment}
                title="Elimina Passaggio"
                message="Sei sicuro di voler eliminare questo passaggio dal roadbook?"
            />

            <div className="relative bg-slate-50 w-full max-w-5xl h-full md:h-[95vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden print:h-auto print:max-w-none print:shadow-none print:rounded-none">
                
                {/* HEADER MODALE */}
                <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <MapIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-wide">Smart Roadbook</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Guida Logistica {isEditing ? '(Modifica)' : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {localRoadbook.length > 0 && (
                            <>
                                <button onClick={handleGenerate} disabled={loading} className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600 font-bold text-xs uppercase flex items-center gap-1 border border-transparent hover:border-indigo-100 transition-all" title="Rigenera da zero">
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                                </button>
                                {isEditing ? (
                                     <button onClick={handleSaveChanges} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-md">
                                        <Save className="w-4 h-4"/> Salva
                                     </button>
                                ) : (
                                     <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all border border-slate-300">
                                        <Edit3 className="w-4 h-4"/> Modifica
                                     </button>
                                )}
                                <button onClick={handlePrint} disabled={isGeneratingPdf} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} SCARICA PDF
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-6 h-6"/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 custom-scrollbar print:overflow-visible print:bg-white">
                    {/* INTESTAZIONE STAMPA */}
                    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className={h1Style || "text-4xl font-display font-black text-slate-900 uppercase"}>Touring Diary</h1>
                                <p className={subStyle || "text-sm font-bold text-slate-500 uppercase tracking-widest mt-1"}>Guida Logistica Personalizzata</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-slate-900">{activeCityName}</div>
                                <div className="text-xs text-slate-500">{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {localRoadbook.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto print:hidden">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                                <MapIcon className="w-12 h-12 text-indigo-600"/>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Genera il tuo percorso</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                L'intelligenza artificiale calcolerà percorsi, tempi, distanze e costi stimati per ogni tappa.
                            </p>
                            <button onClick={handleGenerate} disabled={loading} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Bot className="w-5 h-5"/>}
                                {loading ? 'Elaborazione Percorsi...' : 'Genera Roadbook con AI'}
                            </button>
                            {error && <p className="mt-4 text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-12 pb-20">
                            {localRoadbook.map((day, idx) => {
                                const dayItems = itinerary.items.filter(i => i.dayIndex === day.dayIndex).sort((a,b) => a.timeSlotStr.localeCompare(b.timeSlotStr));
                                
                                return (
                                    <div key={idx} className="break-inside-avoid">
                                        {/* DAY HEADER */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex items-center justify-center rounded-xl shadow-lg border-2 border-slate-700 bg-slate-900 w-12 h-12 ${dayNumStyle || 'text-white font-black text-xl'}`}>{day.dayIndex + 1}</div>
                                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Giorno {day.dayIndex + 1}</h3>
                                            </div>
                                            {isEditing && (
                                                <button onClick={() => addManualSegment(idx)} className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                                    <Plus className="w-3 h-3"/> Aggiungi Step
                                                </button>
                                            )}
                                        </div>
                                        <div className="h-px w-full bg-slate-300 mb-6"></div>

                                        <div className="space-y-4">
                                            {day.segments?.map((segment, sIdx) => {
                                                const dist = getDistanceBetween(segment.from, segment.to);
                                                const startTime = dayItems[sIdx]?.timeSlotStr || "--:--";
                                                const endTime = dayItems[sIdx + 1]?.timeSlotStr || "--:--";
                                                const isFirstOfTrip = idx === 0 && sIdx === 0;
                                                const isLastOfDay = sIdx === day.segments.length - 1;
                                                const labelStart = isFirstOfTrip ? "PUNTO DI PARTENZA" : "PARTENZA";
                                                const labelEnd = isLastOfDay ? "PUNTO DI ARRIVO" : "ARRIVO";
                                                const cleanFrom = cleanLocationName(segment.from);

                                                return (
                                                    <div key={sIdx} className="mb-12 relative group break-inside-avoid bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                                        {isEditing && <button onClick={() => deleteSegment(idx, sIdx)} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-500 rounded-full hover:bg-red-200 shadow-sm border border-red-200 z-20"><Trash2 className="w-3.5 h-3.5"/></button>}
                                                        
                                                        {/* HEADER SEGMENTO */}
                                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                                                            {/* PARTENZA */}
                                                            <div className="flex items-center gap-3 w-full md:w-1/3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0"><MapPin className="w-5 h-5"/></div>
                                                                <div className="min-w-0">
                                                                    {isEditing ? (
                                                                        <div className="space-y-1"><input className="font-bold text-slate-900 border-b border-slate-300 focus:border-indigo-500 outline-none w-full bg-transparent" value={segment.from} onChange={(e) => updateSegment(idx, sIdx, 'from', e.target.value)} placeholder="Luogo Partenza"/><input className="text-xs text-slate-500 border-b border-slate-200 focus:border-indigo-500 outline-none w-full bg-transparent" value={segment.fromAddress || ''} onChange={(e) => updateSegment(idx, sIdx, 'fromAddress', e.target.value)} placeholder="Indirizzo"/></div>
                                                                    ) : (
                                                                        <>
                                                                            <h4 className={`truncate mb-1 ${poiTitleStyle || 'font-black text-slate-900 text-base leading-tight'}`}>{cleanFrom}</h4>
                                                                            <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{labelStart}</span><span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 rounded">{startTime}</span></div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* DIRECTION ARROW & ICON */}
                                                            <div className="flex flex-col items-center justify-center text-slate-400 w-full md:w-auto -mt-2 md:mt-0 relative">
                                                                <div className="flex items-center gap-2 text-indigo-400 relative">
                                                                    {getTransportIcon(segment.transportMode)}
                                                                    <div className="h-0.5 w-20 md:w-32 bg-indigo-100 relative flex items-center justify-center"><div className="absolute bg-white px-2 text-[9px] font-black uppercase text-slate-500 border border-slate-100 rounded-full shadow-sm z-10 whitespace-nowrap">{segment.duration}</div><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div></div>
                                                                    <ArrowRight className="w-4 h-4"/>
                                                                </div>
                                                                {dist !== null && <div className="text-[9px] font-mono font-bold mt-1 text-emerald-600">{dist} km</div>}
                                                            </div>

                                                            {/* ARRIVO */}
                                                            <div className="flex items-center gap-3 w-full md:w-1/3 justify-end text-right">
                                                                <div className="min-w-0">
                                                                    {isEditing ? (
                                                                        <div className="space-y-1"><input className="font-bold text-slate-900 border-b border-slate-300 focus:border-indigo-500 outline-none w-full bg-transparent text-right" value={segment.to} onChange={(e) => updateSegment(idx, sIdx, 'to', e.target.value)} placeholder="Luogo Arrivo"/><input className="text-xs text-slate-500 border-b border-slate-200 focus:border-indigo-500 outline-none w-full bg-transparent text-right" value={segment.toAddress || ''} onChange={(e) => updateSegment(idx, sIdx, 'toAddress', e.target.value)} placeholder="Indirizzo"/></div>
                                                                    ) : (
                                                                        <>
                                                                            <h4 className={`truncate mb-1 ${poiTitleStyle || 'font-black text-slate-900 text-base leading-tight'}`}>{segment.to}</h4>
                                                                            <div className="flex items-center gap-2 justify-end"><span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 rounded">{endTime}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{labelEnd}</span></div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg"><Flag className="w-5 h-5 fill-current"/></div>
                                                            </div>
                                                        </div>

                                                        {/* BODY CONTENT */}
                                                        <div className="pl-4 border-l-2 border-slate-100 ml-4">
                                                            <div className="flex gap-2 mb-3">
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">{segment.transportMode === 'walk' ? 'A Piedi' : segment.transportMode === 'transit' ? 'Mezzi Pubblici' : 'Taxi / Auto'}</span>
                                                            </div>
                                                            {isEditing ? <textarea className="w-full text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 border border-slate-200 rounded p-2 focus:border-indigo-500 outline-none resize-y min-h-[60px]" value={segment.instructions} onChange={(e) => updateSegment(idx, sIdx, 'instructions', e.target.value)}/> : <p className="text-slate-700 text-sm leading-relaxed font-medium">{segment.instructions}</p>}
                                                            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                                                                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Bus className="w-3.5 h-3.5 text-blue-500"/><span className="font-bold uppercase text-[9px] tracking-wide">Trasporto:</span> {isEditing ? <input value={segment.transportCost || ''} onChange={e => updateSegment(idx, sIdx, 'transportCost', e.target.value)} className="bg-transparent border-b border-slate-300 w-16 outline-none text-center" placeholder="€..."/> : <span className="font-mono">{segment.transportCost || '--'}</span>}</div>
                                                                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Utensils className="w-3.5 h-3.5 text-amber-500"/><span className="font-bold uppercase text-[9px] tracking-wide">Cibo:</span> {isEditing ? <input value={segment.foodCost || ''} onChange={e => updateSegment(idx, sIdx, 'foodCost', e.target.value)} className="bg-transparent border-b border-slate-300 w-16 outline-none text-center" placeholder="€..."/> : <span className="font-mono">{segment.foodCost || '--'}</span>}</div>
                                                                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Ticket className="w-3.5 h-3.5 text-indigo-500"/><span className="font-bold uppercase text-[9px] tracking-wide">Biglietto:</span> {isEditing ? <input value={segment.ticketCost || ''} onChange={e => updateSegment(idx, sIdx, 'ticketCost', e.target.value)} className="bg-transparent border-b border-slate-300 w-16 outline-none text-center" placeholder="€..."/> : <span className="font-mono">{segment.ticketCost || '--'}</span>}</div>
                                                            </div>
                                                            {(segment.tips || isEditing) && <div className="mt-3 flex gap-2 items-start text-xs text-amber-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500"/>{isEditing ? <input className="w-full bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none text-amber-800 placeholder-amber-800/50" value={segment.tips || ''} onChange={(e) => updateSegment(idx, sIdx, 'tips', e.target.value)} placeholder="Tips o note aggiuntive..."/> : <span className="italic">{segment.tips}</span>}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* RIEPILOGO FINALE COMPATTATO E RIDISEGNATO */}
                            <div className="mt-12 break-inside-avoid animate-in slide-in-from-bottom-6">
                                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl print:bg-white print:text-black print:border-2 print:border-slate-200">
                                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4 print:border-slate-300">
                                        <div className="p-2.5 bg-white text-slate-900 rounded-xl shadow-lg print:bg-slate-200"><Receipt className="w-6 h-6"/></div>
                                        <h3 className="text-xl font-black uppercase tracking-wide">Riepilogo Viaggio</h3>
                                    </div>

                                    {/* GRID PRINCIPALE - ORDINE AGGIORNATO E COMPATTATO */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        
                                        {/* COLONNA 1: ESPERIENZE */}
                                        <div className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700/50 flex flex-col h-full relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                 <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500"><PieChart className="w-4 h-4"/></div>
                                                 <h4 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Esperienze</h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                {[
                                                    { label: 'Cultura', icon: Landmark, color: 'text-purple-400', bg: 'bg-purple-900/30', count: summary.catCounts.monument },
                                                    { label: 'Gusto', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-900/30', count: summary.catCounts.food },
                                                    { label: 'Natura', icon: Sun, color: 'text-emerald-400', bg: 'bg-emerald-900/30', count: summary.catCounts.nature },
                                                    { label: 'Svago', icon: Music, color: 'text-cyan-400', bg: 'bg-cyan-900/30', count: summary.catCounts.leisure },
                                                ].map((cat, i) => (
                                                    <div key={i} className={`p-2.5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 ${cat.bg} hover:scale-105 transition-transform`}>
                                                        <cat.icon className={`w-4 h-4 ${cat.color} mb-1`}/>
                                                        <span className="text-[9px] uppercase font-bold text-slate-300 opacity-80">{cat.label}</span>
                                                        <span className="text-xl font-black text-white leading-none drop-shadow-md">{cat.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* COLONNA 2: MOBILITÀ */}
                                        <div className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700/50 flex flex-col h-full relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                 <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><Route className="w-4 h-4"/></div>
                                                 <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Mobilità</h4>
                                            </div>
                                            
                                            <div className="flex flex-col gap-3 flex-1 justify-center">
                                                 <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                                                     <div className="flex items-center gap-3">
                                                         <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400"><Footprints className="w-4 h-4"/></div>
                                                         <span className="text-xs font-bold text-slate-300">A Piedi</span>
                                                     </div>
                                                     <span className="text-xl font-mono font-black text-white">{formatTimePretty(summary.totalWalkingMinutes)}</span>
                                                 </div>
                                                 
                                                 <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                                                     <div className="flex items-center gap-3">
                                                         <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><Bus className="w-4 h-4"/></div>
                                                         <span className="text-xs font-bold text-slate-300">Mezzi / Auto</span>
                                                     </div>
                                                     <span className="text-xl font-mono font-black text-white">{formatTimePretty(summary.totalTransitMinutes)}</span>
                                                 </div>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-white/10 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest mt-auto">
                                                 Totale spostamenti: <span className="text-white">{summary.totalSegments}</span>
                                            </div>
                                        </div>

                                        {/* COLONNA 3: BUDGET */}
                                        <div className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700/50 flex flex-col h-full relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                 <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Coins className="w-4 h-4"/></div>
                                                 <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Budget Stimato</h4>
                                            </div>
                                            
                                            <div className="space-y-2.5 flex-1">
                                                <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                                                    <span className="text-slate-300 print:text-slate-600 flex items-center gap-2"><Bus className="w-3 h-3 text-blue-500"/> Trasporti</span>
                                                    <span className="font-mono font-bold text-base">€ {summary.totalTransportCost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                                                    <span className="text-slate-300 print:text-slate-600 flex items-center gap-2"><Ticket className="w-3 h-3 text-indigo-500"/> Ingressi</span>
                                                    <span className="font-mono font-bold text-base">€ {summary.totalTicketCost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                                                    <span className="text-slate-300 print:text-slate-600 flex items-center gap-2"><Utensils className="w-3 h-3 text-amber-500"/> Cibo</span>
                                                    <span className="font-mono font-bold text-base">€ {summary.totalFoodCost.toFixed(2)}</span>
                                                </div>
                                                
                                                <div className="mt-auto pt-4 flex flex-col items-center justify-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">TOTALE GENERALE</span>
                                                    <span className="text-3xl font-black text-emerald-400 print:text-emerald-600 drop-shadow-lg">€ {(summary.totalTransportCost + summary.totalTicketCost + summary.totalFoodCost).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <p className="text-[7px] text-slate-600 italic text-center mt-3 uppercase font-bold tracking-wider">*Stima approssimativa basata su medie.</p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="hidden print:block mt-10 pt-4 border-t border-slate-300 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                            <Sparkles className="w-3 h-3"/> Generato con Gemini AI per Touring Diary
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
