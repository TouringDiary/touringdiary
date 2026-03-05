
import React, { useState, useEffect } from 'react';
import { 
    MapPin, Navigation, Landmark, Utensils, Bed, ShoppingBag, Sun, Scan, Music, 
    MessageSquare, ArrowRightLeft, Trash2, Clock,
    // Nuove icone per diversificazione
    StickyNote, Plane, Train, Car, Bus, Anchor, Coffee, Camera, Trees, Footprints
} from 'lucide-react';
import { ItineraryItem, PointOfInterest, PoiCategory } from '../../../types/index';
import { calculateDistance } from '../../../services/geo';
import { openMap } from '../../../utils/common';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';

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

const getCategoryIcon = (category: PoiCategory) => {
    switch (category) {
        case 'monument': return <Landmark className="w-4 h-4" />;
        case 'food': return <Utensils className="w-4 h-4" />;
        case 'hotel': return <Bed className="w-4 h-4" />;
        case 'shop': return <ShoppingBag className="w-4 h-4" />;
        case 'nature': return <Sun className="w-4 h-4" />;
        case 'discovery': return <Scan className="w-4 h-4" />;
        case 'leisure': return <Music className="w-4 h-4" />;
        default: return <MapPin className="w-4 h-4" />;
    }
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
    connectorRows: number; 
    userLocation: { lat: number; lng: number } | null;
    isHighlighted: boolean;
    editingTimeId: string | null;
    iconPickerOpen: string | null;
    isMobile: boolean;
    onSetEditingTime: (id: string | null) => void;
    onTimeChange: (id: string, time: string, dayIdx: number) => void;
    onIconClick: (id: string) => void;
    onIconSelect: (id: string, iconKey: string) => void;
    onViewDetail: (poi: PointOfInterest) => void;
    onRemove: (id: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onItemDrop: (e: React.DragEvent, dayIdx: number, time: string) => void;
    onMobileMoveClick: (item: ItineraryItem) => void;
    innerRef: React.Ref<HTMLDivElement>;
    itemIndex: number;
    alignSide: string; 
}

export const ItineraryItemCard: React.FC<ItineraryItemCardProps> = ({ 
    item, dayIndex, distanceFromPrev, isBridge, prevItemRows, connectorRows, userLocation, isHighlighted, 
    editingTimeId, iconPickerOpen, isMobile,
    onSetEditingTime, onTimeChange, onIconClick, onIconSelect, onViewDetail, onRemove, onNoteChange, onItemDrop, onMobileMoveClick,
    innerRef, alignSide
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);

    // --- HOOKS STILI DINAMICI ---
    const timeSlotStyle = useDynamicStyles('diary_time_slot', isMobile);
    const poiNameStyle = useDynamicStyles('diary_poi_name', isMobile);
    const distanceStyle = useDynamicStyles('diary_distance', isMobile);
    const durationStyle = useDynamicStyles('diary_duration', isMobile);

    useEffect(() => {
        if (item.isCustom && (!item.poi.description || item.poi.description.trim() === '')) {
            setIsEditingNote(true);
        }
    }, [item.isCustom]); 

    let userDist = null;
    if (userLocation && item.poi.coords.lat !== 0) {
        userDist = calculateDistance(userLocation.lat, userLocation.lng, item.poi.coords.lat, item.poi.coords.lng);
    }
    
    const handleDragStart = (e: React.DragEvent) => { if (isMobile) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'MOVE_ITEM', id: item.id })); e.dataTransfer.effectAllowed = 'copyMove'; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); onItemDrop(e, dayIndex, item.timeSlotStr || '09:00'); };
    const handleNoteKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); setIsEditingNote(false); } };

    const rowHeightClass = "h-7"; 
    const showSecondRow = !!(item.poi.address || !item.isCustom || item.poi.visitDuration);
    
    // POSIZIONE ORIZZONTALE UNIFICATA (Linea + Badge)
    const horizontalPosition = alignSide === 'left' ? '30%' : '70%';

    const halfRow = ROW_HEIGHT_REM / 2; 
    const safePrevRows = prevItemRows || 1; 
    
    const hasBadge = distanceFromPrev !== null;
    
    // Calcolo altezza della riga di connessione (include lo spazio delle righe precedenti)
    const heightCalc = hasBadge 
        ? `calc(${safePrevRows * ROW_HEIGHT_REM}rem - ${halfRow}rem)` 
        : `calc(${safePrevRows * ROW_HEIGHT_REM}rem)`;

    const lineStyle: React.CSSProperties = {
        position: 'absolute',
        top: `calc(-${safePrevRows * ROW_HEIGHT_REM}rem + ${halfRow}rem)`, 
        height: heightCalc,
        left: horizontalPosition, // USO VARIABILE UNIFICATA
        transform: 'translateX(-50%)',
        zIndex: 0,
        borderLeftWidth: '2px', 
        borderLeftStyle: 'dashed',
        borderColor: '#ef4444', 
        pointerEvents: 'none'
    };
    
    const showLine = isBridge;

    const renderCustomIcon = () => {
        const Icon = CUSTOM_ICONS[item.customIcon || 'note'] || StickyNote;
        return <Icon className="w-5 h-5 text-stone-600"/>;
    };
    
    const renderInfoBox = () => {
        return (
            <span className={`${durationStyle} leading-none text-center flex items-center justify-center gap-0.5`}>
                    <Clock className="w-2.5 h-2.5 opacity-60"/>
                {item.poi.visitDuration ? formatDurationCompact(item.poi.visitDuration) : '--'}
            </span>
        );
    };

    return (
        <div 
            ref={innerRef} 
            draggable={!isMobile} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop} 
            className={`group/item relative transition-all flex 
                ${!isMobile ? 'cursor-grab active:cursor-grabbing hover:bg-black/5' : ''} 
                ${iconPickerOpen === item.id ? 'z-50' : 'z-0'} 
                ${isDragOver ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-[1.02] z-10 shadow-lg' : ''}
            `}
        >
            {/* FIX: HIGHLIGHT OVERLAY ABSOLUTE (FULL WIDTH) */}
            {/* Usiamo -left-2 e -right-2 per compensare il padding px-2 del contenitore padre (DiaryDay) */}
            {isHighlighted && (
                <>
                    {/* Background Layer */}
                    <div className="absolute -left-2 -right-2 top-0 bottom-0 bg-amber-100/60 pointer-events-none z-0"></div>
                    
                    {/* Border Layer (Solo Top e Bottom, niente verticali) */}
                    <div className="absolute -left-2 -right-2 top-0 bottom-0 border-y-[1px] border-amber-500/80 pointer-events-none z-20 shadow-[inset_0_0_6px_rgba(245,158,11,0.1)]"></div>
                </>
            )}

            {/* COLUMN 1: LINEA ROSSA, BADGE DISTANZA E DIVISORE LATERALE */}
            <div className="w-14 shrink-0 bg-stone-300/20 relative overflow-visible z-10">
                <div className="absolute right-0 top-0 bottom-0 w-px bg-blue-600 z-0"></div>
                
                {/* LINEA ROSSA TRATTEGGIATA */}
                {showLine && <div style={lineStyle}></div>}
                
                {/* BADGE DISTANZA - POSIZIONATO SULLA STESSA VERTICALE DELLA LINEA */}
                {distanceFromPrev !== null && (
                    <div 
                        className="absolute z-50 pointer-events-none" 
                        style={{ 
                            top: '0', 
                            left: horizontalPosition, // USO VARIABILE UNIFICATA: Segue sempre la linea
                            transform: `translate(-50%, -50%) rotate(-90deg)`
                        }}
                    >
                        <div className={`
                            bg-[#e7e5e4] border border-red-500 text-red-600
                            px-1 py-0.5 rounded-sm shadow-sm flex items-center justify-center 
                            leading-none whitespace-nowrap z-50
                            ${distanceStyle} 
                            ${distanceFromPrev > 50 ? 'bg-orange-100 text-orange-600 border-orange-500' : ''}
                        `}>
                            {distanceFromPrev} KM
                        </div>
                    </div>
                )}
            </div>
            
            {/* COLUMN 2: ICON + CONTENT */}
            <div className="flex-1 min-w-0 flex pointer-events-none z-10">
                
                {/* 2A. ICONA */}
                <div className="w-10 flex items-center justify-center relative z-20 pointer-events-auto border-r border-stone-300/30 shrink-0 bg-[#e7e5e4]/50 backdrop-blur-[1px]">
                     {item.isCustom ? (
                        <div className="relative">
                            <button onClick={() => onIconClick(item.id)} className="hover:text-amber-700 transition-colors text-stone-700 flex items-center justify-center bg-[#e7e5e4] rounded-full p-1.5 border border-stone-300 shadow-sm">
                                {renderCustomIcon()}
                            </button>
                            {iconPickerOpen === item.id && (
                                <div className="absolute top-full left-0 mt-1 bg-[#f5f5f4] border border-stone-300 shadow-xl rounded-lg p-2 grid grid-cols-5 gap-2 z-[60] w-56">
                                    {Object.entries(CUSTOM_ICONS).map(([key, Icon]) => (
                                        <button key={key} onClick={() => onIconSelect(item.id, key)} className="p-2 hover:bg-stone-200 rounded text-stone-700 flex justify-center transition-colors items-center" title={key}>
                                            <Icon className="w-6 h-6"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`flex items-center justify-center bg-[#e7e5e4] rounded-full p-1.5 border border-stone-300 shadow-sm ${item.completed ? 'text-emerald-700' : 'text-stone-700'}`}>
                            {getCategoryIcon(item.poi.category)}
                        </div>
                    )}
                </div>

                {/* 2B. CONTENT ROWS - SFONDO TRASPARENTE */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent">
                    <div className={`${rowHeightClass} flex items-center relative z-10 w-full`}>
                        
                        {/* TIME SLOT */}
                        <div className="w-12 flex flex-col items-center justify-center shrink-0 h-full z-10 relative pointer-events-auto leading-none border-r border-stone-300/30">
                            {editingTimeId === item.id ? (
                                <select autoFocus className={`w-full bg-transparent text-stone-900 border-b border-stone-500 focus:outline-none p-0 h-full leading-none appearance-none text-center ${timeSlotStyle}`} value={item.timeSlotStr} onChange={(e) => { onTimeChange(item.id, e.target.value, dayIndex); onSetEditingTime(null); }} onBlur={() => onSetEditingTime(null)}><option value="" disabled>--:--</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                            ) : (
                                <button onClick={() => onSetEditingTime(item.id)} className={`${timeSlotStyle} leading-none flex items-center justify-center w-full hover:text-amber-700`}>
                                    {item.timeSlotStr || <span className="text-stone-400 font-mono text-xs">--:--</span>}
                                </button>
                            )}
                        </div>

                        {/* POI NAME */}
                        <div className="flex-1 flex items-center min-w-0 pl-2 h-full relative overflow-hidden z-10 pointer-events-auto">
                            {item.isCustom ? (
                                isEditingNote ? (
                                    <input 
                                        autoFocus
                                        className={`flex-1 bg-transparent text-stone-900 placeholder-stone-500 focus:outline-none leading-none border-b border-stone-400 h-full truncate ${poiNameStyle}`} 
                                        placeholder="Scrivi nota..." 
                                        value={item.poi.description} 
                                        onChange={(e) => onNoteChange(item.id, e.target.value)} 
                                        onKeyDown={handleNoteKeyDown}
                                        onBlur={() => setIsEditingNote(false)}
                                    />
                                ) : (
                                    <div 
                                        onClick={() => setIsEditingNote(true)}
                                        className={`flex-1 leading-none h-full flex items-center cursor-text truncate hover:text-stone-700 ${poiNameStyle}`}
                                    >
                                        {item.poi.description || <span className="text-stone-400 italic">Clicca per scrivere...</span>}
                                    </div>
                                )
                            ) : (
                                <h4 onClick={() => onViewDetail(item.poi)} className={`${poiNameStyle} truncate leading-none cursor-pointer hover:text-amber-700 transition-colors w-full`}>
                                    {item.poi.name}
                                </h4>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-end z-20 gap-1 shrink-0 pl-1 pr-1 pointer-events-auto">
                            {userDist && (<div className="flex items-center gap-0.5 text-[8px] md:text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-1 rounded border border-emerald-500/30 whitespace-nowrap shrink-0"><Navigation className="w-2.5 h-2.5 fill-current transform rotate-45"/> {userDist}km</div>)}
                            {isMobile && (<button onClick={() => onMobileMoveClick(item)} className="p-1 text-indigo-500 hover:text-indigo-700 transition-colors w-8 flex justify-center border-r border-stone-300/50"><ArrowRightLeft className="w-3.5 h-3.5" /></button>)}
                            <button onClick={() => onRemove(item.id)} className="p-1 text-stone-400 hover:text-red-600 transition-colors w-8 flex justify-center"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                        </div>
                    </div>
                    
                    {showSecondRow && (
                        <div className={`${rowHeightClass} flex items-center border-b border-stone-300/30 relative z-10 w-full`}>
                            <div className="w-12 shrink-0 flex items-center justify-center h-full pointer-events-auto border-r border-stone-300/30 bg-[#e7e5e4]/50">
                                {renderInfoBox()}
                            </div>
                            
                            <div className="flex-1 flex items-center min-w-0 h-full overflow-hidden pl-2 pointer-events-auto pr-9">
                                {item.poi.address ? (
                                    <button 
                                        onClick={() => openMap(item.poi.coords.lat, item.poi.coords.lng)} 
                                        className="text-[10px] text-stone-500 text-left hover:text-amber-700 truncate leading-none w-full font-medium"
                                    >
                                        {item.poi.address}
                                    </button>
                                ) : (
                                    <span className="text-[9px] text-stone-400 italic">Nessun indirizzo</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
