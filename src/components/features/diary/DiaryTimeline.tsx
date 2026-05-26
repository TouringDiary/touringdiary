import { Z_DROPDOWN } from '@/constants/zIndex';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Itinerary, ItineraryItem, PointOfInterest, CitySummary } from '@/types';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { DiaryDay } from './DiaryDay';

export interface DiaryTimelineProps {
    itinerary: Itinerary;
    days: Date[];
    activeTab: 'all' | number;
    userLocation: { lat: number; lng: number } | null;
    highlightedItemId: string | null;
    editingTimeId: string | null;
    iconPickerOpen: string | null;
    colorPickerOpen: number | null;
    isMobile: boolean;
    dayRefs: React.RefObject<{[key: number]: HTMLDivElement | null}>;
    itemRefs: React.RefObject<{[key: string]: HTMLDivElement | null}>;
    cityManifest?: CitySummary[];
    onCityClick: (id: string) => void;
    onAddNote: (idx: number) => void;
    onColorPickerToggle: (idx: number | null) => void;
    onColorSelect: (idx: number, cls: string) => void;
    onViewDetail: (poi: PointOfInterest) => void;
    onRemoveItem: (id: string) => void;
    onRemoveSingle?: (id: string) => void;
    onTimeChange: (id: string, time: string, dayIdx: number) => void;
    onSetEditingTime: (id: string | null) => void;
    onIconClick: (id: string | null) => void;
    onIconSelect: (id: string, iconKey: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onDayDrop: (e: React.DragEvent, dayIdx: number, time?: string) => void;
    onItemDrop: (e: React.DragEvent, dayIdx: number, time: string) => void;
    onMobileMoveClick: (item: ItineraryItem) => void;
    onCreateMemo: (item: ItineraryItem) => void;
    onMemoClick: (id: string) => void;
}

export const DiaryTimeline: React.FC<DiaryTimelineProps> = (props) => {
    const [daySelectorOpen, setDaySelectorOpen] = useState<'note' | 'palette' | null>(null);
    const [cityTooltipOpen, setCityTooltipOpen] = useState(false);
    const [visibleCitiesCount, setVisibleCitiesCount] = useState(10);
    const { getText: getPopoverMsg } = useSystemMessage('popover_select_day_for_action');
    const noteAnchorRef = useRef<HTMLDivElement>(null);
    const paletteAnchorRef = useRef<HTMLDivElement>(null);
    const cityDotsAnchorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const dotsGhostRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleCityTooltipEnter = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setCityTooltipOpen(true);
    };

    const handleCityTooltipLeave = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setCityTooltipOpen(false);
        }, 150);
    };

    const scrollIntoDay = (idx: number) => {
        const ref = props.dayRefs.current?.[idx];
        if (ref) {
            // block: center garantisce che il giorno sia visibile anche con lo sticky header
            ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    // --- HELPER LOGICA GLOBALE ---

    const getCityDisplayName = (id: string) => {
        if (!id || typeof id !== 'string' || id === 'unknown' || id === 'custom') return '';
        if (id.startsWith('City ')) return ''; // Prevenzione assoluta rendering in UI
        if (props.cityManifest) {
             const found = props.cityManifest.find(c => String(c.id) === String(id));
             if (found) return found.name;
        }
        return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const activeItems = props.activeTab === 'all' 
        ? props.itinerary.items 
        : props.itinerary.items.filter(i => i.dayIndex === props.activeTab);

    const uniqueCityIds = Array.from(new Set(activeItems.map(i => {
           let cid = i.cityId;
           if (typeof cid === 'string' && cid.startsWith('City ') && i.poi?.cityId) {
               cid = i.poi.cityId;
           }
           return cid;
    })))
        .filter(id => {
            if (!id || typeof id !== 'string' || id === 'unknown' || id === 'custom') return false;
            if (id.startsWith('City ')) return false;
            return true;
        }) as string[];

    // --- SMART TRUNCATION LOGIC ---
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current || !ghostRef.current || !dotsGhostRef.current || uniqueCityIds.length === 0) return;
            
            const containerWidth = containerRef.current.offsetWidth;
            const ghostItems = ghostRef.current.querySelectorAll('.ghost-city-item');
            const dotsWidth = dotsGhostRef.current.offsetWidth;
            
            let currentWidth = 0;
            let count = 0;
            
            for (let i = 0; i < ghostItems.length; i++) {
                const itemWidth = (ghostItems[i] as HTMLElement).offsetWidth;
                const isLast = i === uniqueCityIds.length - 1;
                
                // Misurazione precisa: città + virgola/spazio + dots (se necessario)
                const neededWidth = currentWidth + itemWidth + (!isLast ? dotsWidth : 0);
                
                if (neededWidth > containerWidth) break;
                
                currentWidth += itemWidth;
                count++;
            }
            setVisibleCitiesCount(count || 1);
        };

        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) observer.observe(containerRef.current);
        handleResize();
        return () => observer.disconnect();
    }, [uniqueCityIds]);

    return (
        <div className="min-h-full flex flex-col">
            
            {/* ROW 1: HEADER INFORMATIVO (STICKY) */}
            <div className="sticky top-0 h-7 w-full px-3 md:px-4 flex items-center justify-between bg-[#e7e5e4] border-b border-stone-300 shadow-sm flex-shrink-0 box-border" style={{ zIndex: Z_DROPDOWN }}>
                
                {/* 1. CITTA' CON TRUNCATION INTELLIGENTE */}
                <div ref={containerRef} className="flex-1 min-w-0 mr-2 flex items-center relative h-full">
                    {/* GHOST RENDERER PER MISURAZIONE (NON VISIBILE) */}
                    <div ref={ghostRef} className="absolute invisible opacity-0 pointer-events-none flex whitespace-nowrap font-handwriting text-sm md:text-xl font-bold">
                        {uniqueCityIds.map((id, idx) => (
                            <span key={id} className="ghost-city-item px-1">
                                {getCityDisplayName(id)}{idx < uniqueCityIds.length - 1 ? ',' : ''}
                            </span>
                        ))}
                    </div>

                    {/* MISURATORE PUNTINI DYNAMICO */}
                    <div ref={dotsGhostRef} className="absolute invisible opacity-0 pointer-events-none font-handwriting text-sm md:text-xl font-bold whitespace-nowrap">
                        , + ...
                    </div>

                    <div className="flex items-center font-handwriting text-sm md:text-xl font-bold text-stone-800 leading-none pt-0.5 w-full">
                        {uniqueCityIds.length > 0 ? (
                            <>
                                <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                                    {uniqueCityIds.slice(0, visibleCitiesCount).map((id, idx) => (
                                        <span key={id} className="flex items-center flex-shrink-0">
                                            <button 
                                                onClick={() => props.onCityClick(id)} 
                                                className="hover:underline hover:text-amber-600 transition-colors"
                                            >
                                                {getCityDisplayName(id)}
                                            </button>
                                            {idx < Math.min(uniqueCityIds.length, visibleCitiesCount) - 1 && <span className="mr-1">,</span>}
                                        </span>
                                    ))}
                                </div>
                                {visibleCitiesCount < uniqueCityIds.length && (
                                    <div 
                                        ref={cityDotsAnchorRef}
                                        className="relative flex items-center flex-shrink-0 h-full"
                                        onMouseEnter={handleCityTooltipEnter}
                                        onMouseLeave={handleCityTooltipLeave}
                                    >
                                        <span className="cursor-help text-stone-400 hover:text-amber-600 ml-1">, + ...</span>
                                        <AnchoredPopover
                                            isOpen={cityTooltipOpen}
                                            onClose={() => setCityTooltipOpen(false)}
                                            anchorRef={cityDotsAnchorRef}
                                            align="right"
                                            role="tooltip"
                                            closeOnEscape={false}
                                            closeOnClickOutside={false}
                                            onMouseEnter={handleCityTooltipEnter}
                                            onMouseLeave={handleCityTooltipLeave}
                                            className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 min-w-[200px] max-w-[calc(100vw-2rem)] origin-top-right"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-sans mb-2">Tutte le tappe</p>
                                                {uniqueCityIds.map(id => (
                                                    <button 
                                                        key={id}
                                                        onClick={() => {
                                                            props.onCityClick(id);
                                                            setCityTooltipOpen(false);
                                                        }}
                                                        className="text-left text-sm text-slate-200 hover:text-amber-500 hover:bg-amber-500/10 px-2 py-1.5 rounded-lg transition-all block w-full"
                                                    >
                                                        {getCityDisplayName(id)}
                                                    </button>
                                                ))}
                                            </div>
                                        </AnchoredPopover>
                                    </div>
                                )}
                            </>
                        ) : (props.activeTab === 'all' ? <span>Itinerario</span> : null)}
                    </div>
                </div>

                {/* 2. DURATA VIAGGIO (ALLINEATA A DESTRA) */}
                <span className="font-mono text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-tight leading-none flex-shrink-0 ml-auto">
                    {props.days.length === 1 ? '1 GIORNO' : `${props.days.length} GIORNI`}
                </span>
            </div>

            {/* ROW 2: TOOLBAR AZIONI GIORNO (STICKY SOTTO LA PRIMA) */}
            <div 
                className="sticky top-[1.75rem] h-7 w-full px-3 md:px-4 flex items-center justify-end gap-3 bg-[#f5f5f4] border-b border-stone-200 shadow-sm flex-shrink-0 box-border"
                style={{ zIndex: Z_DROPDOWN }}
            >
                {/* NOTE ACTION */}
                <div ref={noteAnchorRef}>
                    <button 
                        onClick={() => {
                            if (props.activeTab !== 'all') {
                                props.onAddNote(props.activeTab);
                            } else {
                                setDaySelectorOpen(daySelectorOpen === 'note' ? null : 'note');
                            }
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white border border-stone-400 shadow-sm transition-all duration-150 cursor-pointer text-[12px] hover:scale-105 hover:border-amber-500 hover:bg-amber-50 active:scale-95"
                        title="Aggiungi Nota Giorno"
                    >
                        📝
                    </button>
                    <DaySelectorPopover 
                        isOpen={daySelectorOpen === 'note'}
                        onClose={() => setDaySelectorOpen(null)}
                        anchorRef={noteAnchorRef}
                        title={getPopoverMsg().title || "Seleziona Giorno"}
                        body={getPopoverMsg().body || "Scegli il giorno per la nota."}
                        days={props.days}
                        onSelect={(idx) => {
                            props.onAddNote(idx);
                            scrollIntoDay(idx);
                            setDaySelectorOpen(null);
                        }}
                    />
                </div>

                {/* PALETTE ACTION */}
                <div ref={paletteAnchorRef}>
                    <button 
                        onClick={() => {
                            if (props.activeTab !== 'all') {
                                props.onColorPickerToggle(props.colorPickerOpen === props.activeTab ? null : props.activeTab);
                            } else {
                                setDaySelectorOpen(daySelectorOpen === 'palette' ? null : 'palette');
                            }
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white border border-stone-400 shadow-sm transition-all duration-150 cursor-pointer text-[12px] hover:scale-105 hover:border-amber-500 hover:bg-amber-50 active:scale-95"
                        title="Cambia Colore Giorno"
                    >
                        🎨
                    </button>
                    <DaySelectorPopover 
                        isOpen={daySelectorOpen === 'palette'}
                        onClose={() => setDaySelectorOpen(null)}
                        anchorRef={paletteAnchorRef}
                        title={getPopoverMsg().title || "Seleziona Giorno"}
                        body={getPopoverMsg().body || "Scegli il giorno per il colore."}
                        days={props.days}
                        onSelect={(idx) => {
                            props.onColorPickerToggle(idx);
                            scrollIntoDay(idx);
                            setDaySelectorOpen(null);
                        }}
                    />
                </div>
            </div>

            {/* ROW 3: SPACER RIGA VUOTA (PER MANTENERE BASELINE) */}
            <div className="h-7 w-full flex-shrink-0" />


            {/* CONTENUTO GIORNI */}
            <div className="mt-0">
                {props.activeTab === 'all' ? props.days.map((day, idx) => (
                    <DiaryDay 
                        key={idx}
                        {...props}
                        day={day}
                        dayIndex={idx}
                        items={props.itinerary.items.filter(i => i.dayIndex === idx)}
                        dayStyleClass={props.itinerary.dayStyles?.[idx]}
                    />
                )) : (typeof props.activeTab === 'number' && props.days[props.activeTab] ? (
                    <DiaryDay 
                        key={props.activeTab}
                        {...props}
                        day={props.days[props.activeTab]}
                        dayIndex={props.activeTab}
                        items={props.itinerary.items.filter(i => i.dayIndex === props.activeTab)}
                        dayStyleClass={props.itinerary.dayStyles?.[props.activeTab]}
                    />
                ) : null)}
            </div>
        </div>
    );
};

interface DaySelectorPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement | null>;
    title: string;
    body: string;
    days: Date[];
    onSelect: (idx: number) => void;
}

const DaySelectorPopover: React.FC<DaySelectorPopoverProps> = ({ isOpen, onClose, anchorRef, title, body, days, onSelect }) => (
    <AnchoredPopover
        isOpen={isOpen}
        onClose={onClose}
        anchorRef={anchorRef}
        align="right"
        className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 min-w-[220px] max-w-[calc(100vw-2rem)] origin-top-right"
    >
        <h4 className="text-sm font-bold text-slate-100 mb-1">{title}</h4>
        <p className="text-[11px] text-slate-400 mb-4 leading-relaxed whitespace-pre-line">{body}</p>
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {days.map((_, idx) => (
                <button 
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-amber-600/20 text-slate-200 hover:text-amber-500 transition-all group"
                >
                    <span className="text-xs font-semibold">Giorno {idx + 1}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}
        </div>
    </AnchoredPopover>
);



