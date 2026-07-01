import React, { useState, useEffect, useRef } from 'react';
import { 
    MapPin, Navigation, Landmark, Utensils, Bed, ShoppingBag, Sun, Scan, Music, 
    ArrowRightLeft, Trash2, Clock, X, Route,
    // Nuove icone per diversificazione
    StickyNote, Plane, Train, Car, Bus, Anchor, Coffee, Camera, Trees, Footprints
} from 'lucide-react';
import { ItineraryItem, PointOfInterest, PoiCategory } from '@/types';
import { calculateDistance } from '@/services/geo';
import { openMap } from '@/utils/common';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { useBelowLg } from '@/hooks/ui/useBelowLg';
import { TL_LINE_X, TL_RAIL_W, TL_ARC_REACH } from './timelineLayout';


// COSTANTE ALTEZZA RIGA (h-7 di Tailwind = 1.75rem)
const ROW_HEIGHT_REM = 1.75;

// MAPPING ICONE DIVERSIFICATE E PULITE
const CUSTOM_ICONS: Record<string, React.ElementType> = {
    'note': StickyNote,      
    'plane': Plane,          
    'train': Train,          
    'car': Car,              
    'bus': Bus,              
    'ship': Anchor,          
    'walk': Footprints,      
    'bed': Bed,
    'food': Utensils,
    'coffee': Coffee,        
    'monument': Landmark,
    'camera': Camera,        
    'nature': Trees,         
    'shop': ShoppingBag,
    'music': Music,
};

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const getCategoryIcon = (category: PoiCategory, cls = "w-4 h-4") => {
    switch (category) {
        case 'monument': return <Landmark className={cls} />;
        case 'food': return <Utensils className={cls} />;
        case 'hotel': return <Bed className={cls} />;
        case 'shop': return <ShoppingBag className={cls} />;
        case 'nature': return <Sun className={cls} />;
        case 'discovery': return <Scan className={cls} />;
        case 'leisure': return <Music className={cls} />;
        default: return <MapPin className={cls} />;
    }
};

// --- MEZZI DI TRASPORTO (scelta manuale per ogni spostamento) ---
interface TransportMode { key: string; emoji: string; label: string; }
const TRANSPORT_MODES: TransportMode[] = [
    { key: 'walk',      emoji: '🚶', label: 'A piedi' },
    { key: 'bike',      emoji: '🚲', label: 'Bicicletta' },
    { key: 'scooter',   emoji: '🛵', label: 'Scooter' },
    { key: 'motorbike', emoji: '🏍️', label: 'Moto' },
    { key: 'car',       emoji: '🚗', label: 'Auto' },
    { key: 'taxi',      emoji: '🚕', label: 'Taxi' },
    { key: 'bus',       emoji: '🚌', label: 'Autobus' },
    { key: 'train',     emoji: '🚆', label: 'Treno' },
    { key: 'subway',    emoji: '🚇', label: 'Metropolitana' },
    { key: 'tram',      emoji: '🚋', label: 'Tram' },
    { key: 'ferry',     emoji: '🚤', label: 'Traghetto' },
    { key: 'boat',      emoji: '⛵', label: 'Barca' },
    { key: 'plane',     emoji: '✈️', label: 'Aereo' },
];

const getTransportMode = (key?: string): TransportMode | undefined =>
    key ? TRANSPORT_MODES.find(m => m.key === key) : undefined;

// Distanza in stile diario: "850 m", "3,1 km", "25 km", "740 km"
const formatTimelineDistance = (km: number | null): string => {
    if (km === null || km <= 0) return '';
    if (km < 1) {
        const meters = Math.max(10, Math.round((km * 1000) / 10) * 10);
        return `${meters} m`;
    }
    if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
    return `${Math.round(km)} km`;
};

const formatDurationCompact = (duration: string) => {
    if (!duration) return '';
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minsMatch = duration.match(/(\d+)\s*min/i);
    if (!hoursMatch && !minsMatch) return duration;
    let h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    let m = minsMatch ? parseInt(minsMatch[1]) : 0;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

interface ItineraryItemCardProps {
    item: ItineraryItem;
    dayIndex: number;
    distanceFromPrev: number | null;
    isBridge: boolean;
    prevItemRows: number; 
    userLocation: { lat: number; lng: number } | null;
    isHighlighted: boolean;
    editingTimeId: string | null;
    iconPickerOpen: string | null;
    isMobile: boolean;
    onSetEditingTime: (id: string | null) => void;
    onTimeChange: (id: string, time: string, dayIdx: number) => void;
    onIconClick: (id: string | null) => void;
    onIconSelect: (id: string, iconKey: string) => void;
    onTransportSelect: (id: string, mode: string) => void;
    onViewDetail: (poi: PointOfInterest) => void;
    onRemove: (id: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onItemDrop: (e: React.DragEvent, dayIdx: number, time: string) => void;
    onMobileMoveClick: (item: ItineraryItem) => void;
    innerRef: React.Ref<HTMLDivElement>;
    itemIndex: number;
    alignSide: 'left' | 'right';
    isFirstNode?: boolean;
    isLastNode?: boolean;
}

export const ItineraryItemCard: React.FC<ItineraryItemCardProps> = ({ 
    item, dayIndex, distanceFromPrev, prevItemRows, userLocation, isHighlighted, 
    editingTimeId, iconPickerOpen, isMobile,
    onSetEditingTime, onTimeChange, onIconClick, onIconSelect, onTransportSelect, onViewDetail, onRemove, onNoteChange, onItemDrop, onMobileMoveClick,
    innerRef, isFirstNode, isLastNode
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [transportOpen, setTransportOpen] = useState(false);
    const { getText: getDeleteText } = useSystemMessage('confirm_delete_diary_item');
    // Su mobile/tablet (sotto lg) la tappa si elimina con lo swipe (come Valigia/Template):
    // niente X inline, si riusa il componente condiviso SwipeToDelete.
    const isBelowLg = useBelowLg();

    // --- HOOKS STILI DINAMICI ---
    const timeSlotStyle = useDynamicStyles('diary_time_slot', isMobile);
    const poiNameStyle = useDynamicStyles('diary_poi_name', isMobile);
    const durationStyle = useDynamicStyles('diary_duration', isMobile);

    useEffect(() => {
        if (item.isCustom && (!item.poi.description || item.poi.description.trim() === '')) {
            setIsEditingNote(true);
        }
    }, [item.isCustom]); 

    const hasValidCoords =
        item.poi.coords &&
        (item.poi.coords.lat !== 0 || item.poi.coords.lng !== 0);

    let userDist = null;
    if (userLocation && hasValidCoords) {
        userDist = calculateDistance(userLocation.lat, userLocation.lng, item.poi.coords.lat, item.poi.coords.lng);
    }
    
    const handleDragStart = (e: React.DragEvent) => { if (isMobile) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'MOVE_ITEM', id: item.id })); e.dataTransfer.effectAllowed = 'copyMove'; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); onItemDrop(e, dayIndex, item.timeSlotStr || '09:00'); };
    const handleNoteKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); setIsEditingNote(false); } };

    const iconAnchorRef = useRef<HTMLDivElement>(null);
    const transportAnchorRef = useRef<HTMLButtonElement>(null);

    const rowHeightClass = "h-[1.75rem]";
    const showSecondRow = !!(item.poi.address || !item.isCustom || item.poi.visitDuration);

    // --- GEOMETRIA TIMELINE 3.0 ---
    // La linea verticale ospita SOLO le tappe (icona categoria al centro della card).
    // Lo spostamento "si stacca" dalla linea con un piccolo arco morbido verso sinistra.
    const safePrevRows = prevItemRows || 1;
    const myRows = showSecondRow ? 2 : 1;

    // Geometria orizzontale calcolata (vedi timelineLayout.ts): linea, raggio della curva
    // e larghezza del binario derivano dall'ingombro reale degli elementi.
    const LINE_X = TL_LINE_X;

    const nodeCenterRem = (myRows * ROW_HEIGHT_REM) / 2;               // centro verticale della tappa
    const prevCenterRem = -(safePrevRows * ROW_HEIGHT_REM) / 2;        // centro tappa precedente (sopra)
    const connectorPx = (nodeCenterRem - prevCenterRem) * 16;          // altezza dell'arco (px)
    const movementMidRem = (prevCenterRem + nodeCenterRem) / 2;        // punto medio fra le due tappe

    // Lo "spostamento" esiste solo se c'è un tragitto reale verso questa tappa.
    const hasMovement = distanceFromPrev !== null && distanceFromPrev > 0 && !item.isCustom;

    const transport = getTransportMode(item.transportMode);
    const distanceLabel = formatTimelineDistance(distanceFromPrev);

    const renderCustomIcon = (cls = "w-4 h-4 text-stone-600") => {
        const Icon = CUSTOM_ICONS[item.customIcon || 'note'] || StickyNote;
        return <Icon className={cls}/>;
    };
    
    const renderInfoBox = () => {
        return (
            <span className={`${durationStyle} leading-[1.75rem] text-center flex items-center justify-center gap-0.5 h-full`}>
                    <Clock className="w-2.5 h-2.5 opacity-60"/>
                {item.poi.visitDuration ? formatDurationCompact(item.poi.visitDuration) : '--'}
            </span>
        );
    };

    const deleteMsgData = getDeleteText({
        poiName: item.poi.name,
        timeSlot: item.timeSlotStr ? `delle ${item.timeSlotStr}` : '',
    });

    return (
        <SwipeToDelete onDelete={() => setShowDeleteConfirm(true)} label={item.isCustom ? "Elimina" : "Elimina tappa"} inlineLabel={item.isCustom} revealClassName="inset-y-[10%] rounded-xl">
        <div 
            ref={innerRef} 
            draggable={!isMobile} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop} 
            className={`group group/item relative transition-all flex 
                ${!isMobile ? 'cursor-grab active:cursor-grabbing hover:bg-black/5' : ''} 
                ${isDragOver ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-[1.02] z-floating-panel shadow-lg' : ''}
            `}
        >
            {/* FIX: HIGHLIGHT OVERLAY ABSOLUTE (FULL WIDTH) */}
            {/* Usiamo -left-2 e -right-2 per compensare il padding px-2 del contenitore padre (DiaryDay) */}
            {isHighlighted && (
                <>
                    {/* Background Layer */}
                    <div className="absolute -left-2 -right-2 top-0 bottom-0 bg-amber-100/60 pointer-events-none z-0"></div>
                    
                    {/* Border Layer (Solo Top e Bottom, niente verticali) */}
                    <div className="absolute -left-2 -right-2 top-0 bottom-0 border-y-[1px] border-amber-500/80 pointer-events-none z-dropdown shadow-[inset_0_0_6px_rgba(245,158,11,0.1)]"></div>
                </>
            )}

            {/* COLUMN 1: TIMELINE — larghezza calcolata; il contenuto inizia esattamente dopo */}
            <div
                className="shrink-0 relative overflow-visible z-floating-panel pointer-events-none"
                style={{ width: `${TL_RAIL_W}px` }}
            >
                {/* LINEA VERTICALE CONTINUA (riferimento principale).
                    Su desktop (lg) i nodi sono più piccoli e la linea è leggermente più scura,
                    così torna ben visibile fra una tappa e l'altra. */}
                <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-stone-300 lg:bg-stone-400 z-0" style={{ left: `${LINE_X}px` }} />

                {/* NODO INIZIALE */}
                {isFirstNode && (
                    <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-stone-400 ring-4 ring-[#e7e5e4] z-10" style={{ left: `${LINE_X}px` }} />
                )}

                {/* NODO FINALE */}
                {isLastNode && (
                    <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-stone-400 ring-4 ring-[#e7e5e4] z-10" style={{ left: `${LINE_X}px` }} />
                )}

                {/* SPOSTAMENTO — la curva parte dalla linea, esce a sinistra e SOSTIENE l'icona del mezzo;
                    la distanza vive SULLA linea, nel vuoto fra le due tappe (niente colonne extra) */}
                {hasMovement && (
                    <>
                        <svg
                            className="absolute overflow-visible z-10 pointer-events-none"
                            width={LINE_X}
                            height={connectorPx}
                            viewBox={`0 0 ${LINE_X} ${connectorPx}`}
                            fill="none"
                            style={{ left: 0, top: `${prevCenterRem}rem` }}
                        >
                            <path
                                d={`M ${LINE_X} ${connectorPx / 2 + 2} Q ${LINE_X} ${connectorPx / 2 - 12} ${LINE_X - TL_ARC_REACH} ${connectorPx / 2 - 12}`}
                                stroke="#a8a29e"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* ICONA MEZZO — appoggiata sull'estremità sinistra della curva */}
                        <button
                            ref={transportAnchorRef}
                            onClick={(e) => { e.stopPropagation(); setTransportOpen(o => !o); }}
                            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 z-20 w-[27px] h-[27px] lg:w-[23px] lg:h-[23px] rounded-full bg-[#f5f5f4] border border-stone-300 shadow-sm flex items-center justify-center transition-colors hover:border-amber-500 hover:bg-amber-50"
                            style={{ left: `${LINE_X - TL_ARC_REACH}px`, top: `calc(${movementMidRem}rem - 12px)` }}
                            title={transport ? `Mezzo: ${transport.label}` : 'Scegli il mezzo di trasporto'}
                        >
                            {transport
                                ? <span className="text-[12px] lg:text-[11px] leading-none">{transport.emoji}</span>
                                : <Route className="w-3 h-3 text-stone-400" />}
                        </button>

                        {/* DISTANZA — centrata SULLA linea verticale, fra le due tappe */}
                        <span
                            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 px-1 rounded bg-[#e7e5e4] text-[9px] md:text-[10px] font-semibold text-stone-500 leading-none whitespace-nowrap"
                            style={{ left: `${LINE_X}px`, top: `${movementMidRem}rem` }}
                        >
                            {distanceLabel}
                        </span>
                    </>
                )}

                {/* NODO "TAPPA RAGGIUNTA" — icona categoria, prominente, al centro delle due righe, SULLA linea */}
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    style={{ left: `${LINE_X}px`, top: `${nodeCenterRem}rem` }}
                >
                    {item.isCustom ? (
                        <div ref={iconAnchorRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onIconClick(iconPickerOpen === item.id ? null : item.id); }}
                                className="pointer-events-auto w-[27px] h-[27px] lg:w-[23px] lg:h-[23px] rounded-full bg-[#e7e5e4] border border-stone-300 shadow-sm flex items-center justify-center text-stone-700 transition-colors hover:text-amber-700 hover:border-amber-500"
                                title="Cambia icona"
                            >
                                {renderCustomIcon("w-3 h-3 text-stone-600")}
                            </button>
                            <AnchoredPopover
                                isOpen={iconPickerOpen === item.id}
                                onClose={() => onIconClick(null)}
                                anchorRef={iconAnchorRef}
                                align="left"
                                className="bg-[#f5f5f4] border border-stone-300 shadow-xl rounded-lg p-2 w-56"
                            >
                                <div className="flex justify-between items-center mb-2 px-1 border-b border-stone-200 pb-1">
                                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Icona Nota</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onIconClick(null); }}
                                        className="p-1 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-200"
                                        title="Chiudi"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.entries(CUSTOM_ICONS).map(([key, Icon]) => (
                                        <button key={key} onClick={() => onIconSelect(item.id, key)} className="p-2 hover:bg-stone-200 rounded text-stone-700 flex justify-center transition-colors items-center" title={key}>
                                            <Icon className="w-5 h-5"/>
                                        </button>
                                    ))}
                                </div>
                            </AnchoredPopover>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewDetail(item.poi); }}
                            className={`pointer-events-auto w-[27px] h-[27px] lg:w-[23px] lg:h-[23px] rounded-full bg-[#e7e5e4] border shadow-sm flex items-center justify-center transition-colors hover:text-amber-700 hover:border-amber-500 ${item.completed ? 'text-emerald-700 border-emerald-300' : 'text-stone-700 border-stone-300'}`}
                            title={item.poi.name}
                        >
                            {getCategoryIcon(item.poi.category, "w-3 h-3")}
                        </button>
                    )}
                </div>

                {/* POPOVER SCELTA MEZZO DI TRASPORTO */}
                {hasMovement && (
                    <AnchoredPopover
                        isOpen={transportOpen}
                        onClose={() => setTransportOpen(false)}
                        anchorRef={transportAnchorRef}
                        align="left"
                        className="bg-[#f5f5f4] border border-stone-300 shadow-xl rounded-lg p-2 w-56"
                    >
                        <div className="flex justify-between items-center mb-2 px-1 border-b border-stone-200 pb-1">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mezzo di trasporto</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setTransportOpen(false); }}
                                className="p-1 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-200"
                                title="Chiudi"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {TRANSPORT_MODES.map(m => (
                                <button
                                    key={m.key}
                                    onClick={() => { onTransportSelect(item.id, m.key); setTransportOpen(false); }}
                                    className={`h-9 rounded flex items-center justify-center text-lg leading-none transition-colors ${item.transportMode === m.key ? 'bg-amber-100 ring-1 ring-amber-400' : 'hover:bg-stone-200'}`}
                                    title={m.label}
                                >
                                    <span>{m.emoji}</span>
                                </button>
                            ))}
                        </div>
                        {item.transportMode && (
                            <button
                                onClick={() => { onTransportSelect(item.id, ''); setTransportOpen(false); }}
                                className="mt-2 w-full text-[10px] font-semibold text-stone-500 hover:text-stone-800 py-1.5 rounded hover:bg-stone-200 transition-colors uppercase tracking-wider"
                            >
                                Rimuovi mezzo
                            </button>
                        )}
                    </AnchoredPopover>
                )}
            </div>

            {/* COLUMN 2: CONTENUTO (orario · nome · indirizzo) */}
            <div className="flex-1 min-w-0 flex bg-transparent pointer-events-none z-floating-panel">

                {/* CONTENUTO (orario · nome · indirizzo).
                    Il bordo destro vive QUI, sul contenitore di tutte le righe, così risulta
                    continuo per l'intera altezza della tappa (2 righe per i POI, 1 per le note)
                    invece di apparire spezzato riga per riga. */}
                <div className="flex-1 min-w-0 flex flex-col border-r border-stone-300/40">
                    <div className={`${rowHeightClass} flex items-center relative z-floating-panel w-full`}>
                        
                        {/* TIME SLOT */}
                        <div className="w-12 flex flex-col items-center justify-center shrink-0 h-full z-floating-panel relative pointer-events-auto leading-[1.75rem] border-r border-stone-300/30">
                            {editingTimeId === item.id ? (
                                <select autoFocus className={`w-full bg-transparent text-stone-900 border-b border-stone-500 focus:outline-none p-0 h-full leading-[1.75rem] appearance-none text-center ${timeSlotStyle}`} value={item.timeSlotStr} onChange={(e) => { onTimeChange(item.id, e.target.value, dayIndex); onSetEditingTime(null); }} onBlur={() => onSetEditingTime(null)}><option value="" disabled>--:--</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                            ) : (
                                <button onClick={() => onSetEditingTime(item.id)} className={`${timeSlotStyle} leading-[1.75rem] flex items-center justify-center w-full h-full hover:text-amber-700`}>
                                    {item.timeSlotStr || <span className="text-stone-400 font-mono text-xs">--:--</span>}
                                </button>
                            )}
                        </div>

                        {/* POI NAME */}
                        <div className="flex-1 flex items-center min-w-0 pl-2 h-full relative overflow-hidden z-floating-panel pointer-events-auto">
                            {item.isCustom ? (
                                isEditingNote ? (
                                    <input 
                                        autoFocus
                                        className={`flex-1 bg-transparent text-stone-900 placeholder-stone-500 focus:outline-none leading-[1.75rem] border-b border-stone-400 h-full truncate ${poiNameStyle}`} 
                                        placeholder="Scrivi nota..." 
                                        value={item.poi.description} 
                                        onChange={(e) => onNoteChange(item.id, e.target.value)} 
                                        onKeyDown={handleNoteKeyDown}
                                        onBlur={() => setIsEditingNote(false)}
                                    />
                                ) : (
                                    <div 
                                        onClick={() => setIsEditingNote(true)}
                                        className={`flex-1 leading-[1.75rem] h-full flex items-center cursor-text truncate hover:text-stone-700 ${poiNameStyle}`}
                                    >
                                        {item.poi.description || <span className="text-stone-400 italic">Clicca per scrivere...</span>}
                                    </div>
                                )
                            ) : (
                                <h4 onClick={() => onViewDetail(item.poi)} className={`${poiNameStyle} truncate leading-[1.75rem] h-full flex items-center cursor-pointer hover:text-amber-700 transition-colors w-full`}>
                                    {item.poi.name}
                                </h4>
                            )}
                        </div>
                        
                        <div className={`flex items-center justify-end z-dropdown gap-1 shrink-0 pl-1 pointer-events-auto ${isMobile ? 'pr-11' : 'pr-1'}`}>
                            {userDist && (<div className="flex items-center gap-0.5 text-[8px] md:text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-1 rounded border border-emerald-500/30 whitespace-nowrap shrink-0"><Navigation className="w-2.5 h-2.5 fill-current transform rotate-45"/> {userDist}km</div>)}
                            {!isBelowLg && (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)} 
                                    className="opacity-0 group-hover:opacity-100 transition-all duration-150 p-1 text-stone-400 hover:text-red-500 cursor-pointer w-8 flex justify-center items-center pointer-events-auto" 
                                    title="Elimina Tappa"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {showSecondRow && (
                        <div className={`${rowHeightClass} flex items-center border-b border-stone-300/30 relative z-floating-panel w-full h-[1.75rem]`}>
                            <div className="w-12 shrink-0 flex items-center justify-center h-full pointer-events-auto border-r border-stone-300/30 bg-[#e7e5e4]/50">
                                {renderInfoBox()}
                            </div>
                            
                            <div className={`flex-1 flex items-center min-w-0 h-full overflow-hidden pl-2 pointer-events-auto ${isMobile ? 'pr-11' : 'pr-9'}`}>
                                {item.poi.address ? (
                                    <button 
                                        onClick={() => openMap(item.poi.coords.lat, item.poi.coords.lng)} 
                                        className="text-[10px] text-stone-500 text-left hover:text-amber-700 truncate leading-[1.75rem] h-full w-full font-medium"
                                    >
                                        {item.poi.address}
                                    </button>
                                ) : (
                                    <span className="text-[9px] text-stone-400 italic leading-[1.75rem] h-full flex items-center">Nessun indirizzo</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PULSANTE SPOSTA (mobile): posizionato in assoluto e centrato verticalmente
                sull'INTERO blocco (1 riga per le note, 2 per le tappe). Spostato leggermente a
                sinistra dal bordo destro così resta sempre staccato dalla barra grigia dello swipe. */}
            {isMobile && (
                <button
                    onClick={() => onMobileMoveClick(item)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-dropdown pointer-events-auto flex items-center justify-center w-7 h-6 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 active:scale-95 transition-all"
                    title="Sposta tappa in un altro giorno"
                >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
            )}

            {/* MODALE CONFERMA ELIMINAZIONE (DARK GLASS DESIGN) */}
            <DeleteConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    onRemove(item.id);
                    setShowDeleteConfirm(false);
                }}
                title={deleteMsgData.title}
                message={deleteMsgData.body}
                confirmLabel={deleteMsgData.confirmLabel}
                cancelLabel={deleteMsgData.cancelLabel}
                variant="danger"
                icon={<Trash2 className="w-8 h-8 text-red-500"/>}
            />
        </div>
        </SwipeToDelete>
    );
};



