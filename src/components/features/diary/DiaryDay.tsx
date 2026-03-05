
import React, { useState } from 'react';
import { StickyNote, Palette, PlusCircle, Briefcase } from 'lucide-react';
import { ItineraryItem, PointOfInterest } from '../../../types/index';
import { calculateDistance } from '../../../services/geo';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { ItineraryItemCard } from './ItineraryItemCard';
import { DiaryResourceCard } from './DiaryResourceCard';
import { DiaryMemoCard } from './DiaryMemoCard';

// COSTANTI UI LOCALI
const DAY_COLORS = [
    { id: 'default', class: 'bg-amber-600 text-white', label: 'Ambra (Default)' },
    { id: 'blue', class: 'bg-blue-600 text-white', label: 'Blu Mare' },
    { id: 'emerald', class: 'bg-emerald-600 text-white', label: 'Verde Natura' },
    { id: 'rose', class: 'bg-rose-600 text-white', label: 'Rosso Passione' },
    { id: 'slate', class: 'bg-slate-600 text-white', label: 'Grigio Urbano' },
];

interface DiaryDayProps {
    day: Date;
    dayIndex: number;
    items: ItineraryItem[]; // Già filtrati per questo giorno
    dayStyleClass?: string;
    isDraggingOver?: boolean; // Stato globale di drag dal parent
    isMobile: boolean;
    dayRefs: React.RefObject<{[key: number]: HTMLDivElement | null}>;
    itemRefs: React.RefObject<{[key: string]: HTMLDivElement | null}>;
    
    // State Props passate dal genitore
    userLocation: { lat: number; lng: number } | null;
    highlightedItemId: string | null;
    editingTimeId: string | null;
    iconPickerOpen: string | null;
    colorPickerOpen: number | null;

    // Actions
    onAddNote: (idx: number) => void;
    onColorPickerToggle: (idx: number | null) => void;
    onColorSelect: (idx: number, cls: string) => void;
    onDayDrop: (e: React.DragEvent, dayIdx: number, time?: string) => void;
    
    // Item Actions (Pass-through)
    onCityClick: (id: string) => void;
    onViewDetail: (poi: PointOfInterest) => void;
    onRemoveItem: (id: string) => void;
    onRemoveSingle?: (id: string) => void;
    onTimeChange: (id: string, time: string, dayIdx: number) => void;
    onSetEditingTime: (id: string | null) => void;
    onIconClick: (id: string) => void;
    onIconSelect: (id: string, iconKey: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onItemDrop: (e: React.DragEvent, dayIdx: number, time: string) => void;
    onMobileMoveClick: (item: ItineraryItem) => void;
    onCreateMemo: (item: ItineraryItem) => void;
    onMemoClick: (id: string) => void;
}

export const DiaryDay: React.FC<DiaryDayProps> = ({
    day, dayIndex, items, dayStyleClass, isDraggingOver, isMobile, dayRefs, itemRefs,
    userLocation, highlightedItemId, editingTimeId, iconPickerOpen, colorPickerOpen,
    onAddNote, onColorPickerToggle, onColorSelect, onDayDrop,
    onViewDetail, onRemoveItem, onTimeChange, onSetEditingTime, onIconClick, onIconSelect, onNoteChange, onItemDrop, onMobileMoveClick, onCreateMemo, onMemoClick
}) => {
    
    // Connessione corretta allo stile configurato
    const dayLabelStyle = useDynamicStyles('diary_day_label', isMobile);
    const dayStyle = DAY_COLORS.find(c => c.class === dayStyleClass) || DAY_COLORS[0];

    // Stato locale per evidenziare la Drop Zone specifica
    const [isOverDropZone, setIsOverDropZone] = useState(false);

    // --- STEP 3: SEPARAZIONE TIMELINE / RISORSE ---
    const timelineItems = items.filter(i => !i.isResource).sort((a,b) => a.timeSlotStr.localeCompare(b.timeSlotStr));
    const resourceItems = items.filter(i => i.isResource);

    // --- LOGICA ZIG-ZAG INTELLIGENTE ---
    const calculateDayAlignments = (itemsList: ItineraryItem[]) => {
        const poiIndices = itemsList
            .map((item, idx) => (!item.isCustom && item.type !== 'memo' ? idx : -1))
            .filter(idx => idx !== -1);
            
        if (poiIndices.length <= 1) return itemsList.map(() => 'left');

        return itemsList.map((item, index) => {
            if (item.type === 'memo') return 'left'; 
            if (index <= poiIndices[0]) return 'left';
            let targetPoiIndexInArray = poiIndices.findIndex(pIdx => pIdx >= index);
            if (targetPoiIndexInArray === -1) {
                targetPoiIndexInArray = poiIndices.length;
            }
            return (targetPoiIndexInArray % 2 !== 0) ? 'left' : 'right';
        });
    };

    const alignments = calculateDayAlignments(timelineItems);

    // --- LOGICA DISTANZE ---
    const findLastValidPoiIndex = (list: ItineraryItem[], currentIndex: number) => {
        for (let i = currentIndex - 1; i >= 0; i--) {
            const item = list[i];
            if (!item.isCustom && item.type !== 'memo' && item.poi.coords && (item.poi.coords.lat !== 0 || item.poi.coords.lng !== 0)) {
                return i;
            }
        }
        return -1;
    };

    const getItemRowHeight = (item: ItineraryItem): number => {
        if (item.type === 'memo') return 2; // FIXED: 2 righe piene (h-14) per allineamento griglia
        const hasSecondRow = !!(item.poi.address || !item.isCustom || item.poi.visitDuration);
        return hasSecondRow ? 2 : 1;
    };

    const hasOpenPicker = timelineItems.some(item => item.id === iconPickerOpen) || colorPickerOpen === dayIndex;

    // HANDLERS PER LA DROP ZONE ESPLICITA
    const handleDropZoneEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverDropZone(true);
    };

    const handleDropZoneLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverDropZone(false);
    };

    const handleDropZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverDropZone(false);
        onDayDrop(e, dayIndex); // Aggiunta generica al giorno
    };

    // ALTEZZA RIGA BASE
    const ROW_H = 'h-[1.75rem]'; // ~28px (h-7)

    return (
        <div 
            ref={(el) => { if(dayRefs.current) dayRefs.current[dayIndex] = el; }} 
            className={`relative pb-0 mb-7 transition-all rounded-xl overflow-hidden ${hasOpenPicker ? 'z-[60]' : 'z-0'}`}
        >
            {/* HEADER GIORNO: Altezza fissa h-7 (1 RIGA esatta) */}
            <div className={`flex items-center justify-center gap-2 ${ROW_H} border-b w-full box-border rounded-t-xl transition-colors border-stone-300 bg-[#e7e5e4]`}>
                <button onClick={() => onAddNote(dayIndex)} className="p-1 hover:bg-stone-300/50 rounded-full text-stone-500 transition-colors" title="Aggiungi Nota">
                    <StickyNote className="w-3 h-3"/>
                </button>
                
                {/* Etichetta Giorno Compatta */}
                <div className={`px-4 h-[1.25rem] rounded-full shadow-sm flex items-center justify-center gap-2 ${dayStyle.class}`}>
                    <span className={`${dayLabelStyle} leading-none pt-0.5 whitespace-nowrap text-[10px]`}>
                        {day.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })} • Giorno {dayIndex + 1}
                    </span>
                </div>
                
                <div className="relative">
                    <button onClick={() => onColorPickerToggle(colorPickerOpen === dayIndex ? null : dayIndex)} className="p-1 hover:bg-stone-300/50 rounded-full text-stone-500 transition-colors" title="Cambia Colore">
                        <Palette className="w-3 h-3"/>
                    </button>
                    {colorPickerOpen === dayIndex && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 shadow-xl rounded-lg p-2 flex gap-1 z-[100] animate-in zoom-in-95 origin-top-right">
                            {DAY_COLORS.map(c => (
                                <button key={c.id} onClick={() => onColorSelect(dayIndex, c.class)} className={`w-6 h-6 rounded-full border border-stone-300 hover:scale-110 transition-transform ${c.class.split(' ')[0]}`} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CONTAINER LISTA ITEMS: NO GAP per allineamento griglia */}
            <div className="pt-0 px-2 flex flex-col gap-0 bg-transparent">
                {timelineItems.map((item, idx) => {
                    if (item.type === 'memo') {
                        return (
                            <DiaryMemoCard 
                                key={item.id}
                                item={item}
                                onMemoClick={onMemoClick}
                                onRemove={onRemoveItem}
                                isMobile={isMobile}
                                onSetEditingTime={onSetEditingTime}
                                editingTimeId={editingTimeId}
                                onTimeChange={(id, time) => onTimeChange(id, time, dayIndex)}
                            />
                        );
                    }

                    let dist = null; 
                    const lastValidIndex = findLastValidPoiIndex(timelineItems, idx);
                    
                    if (!item.isCustom && item.poi.coords && (item.poi.coords.lat !== 0 || item.poi.coords.lng !== 0) && lastValidIndex >= 0) {
                        const lastValidItem = timelineItems[lastValidIndex];
                        const d = calculateDistance(lastValidItem.poi.coords.lat, lastValidItem.poi.coords.lng, item.poi.coords.lat, item.poi.coords.lng); 
                        if (d >= 0) dist = d; 
                    }

                    const prevItem = timelineItems[idx - 1];
                    const isBridge = !!prevItem && prevItem.type !== 'memo';
                    const prevItemRows = prevItem ? getItemRowHeight(prevItem) : 0; 

                    return (
                        <ItineraryItemCard 
                            innerRef={(el: any) => { if(itemRefs.current) itemRefs.current[item.id] = el; }} 
                            key={item.id} 
                            item={item} 
                            dayIndex={dayIndex} 
                            distanceFromPrev={dist} 
                            isBridge={isBridge}     
                            prevItemRows={prevItemRows} 
                            connectorRows={prevItemRows} 
                            userLocation={userLocation} 
                            isHighlighted={highlightedItemId === item.id} 
                            editingTimeId={editingTimeId} 
                            iconPickerOpen={iconPickerOpen} 
                            isMobile={isMobile} 
                            onMobileMoveClick={onMobileMoveClick} 
                            onSetEditingTime={onSetEditingTime} 
                            onTimeChange={onTimeChange} 
                            onIconClick={onIconClick} 
                            onIconSelect={onIconSelect} 
                            onViewDetail={onViewDetail} 
                            onRemove={onRemoveItem} 
                            onNoteChange={onNoteChange} 
                            onItemDrop={onItemDrop} 
                            itemIndex={idx}
                            alignSide={alignments[idx]} 
                        />
                    );
                })}
            </div>

            {/* DROP ZONE ESPLICITA SEMPRE VISIBILE (1 RIGA H-7) */}
            <div 
                className={`
                    w-full flex items-center justify-center transition-all duration-300 ${ROW_H} border-2 border-dashed
                    ${isOverDropZone 
                        ? 'border-indigo-600 bg-indigo-200 text-indigo-900 shadow-inner scale-[1.01]' 
                        : 'border-indigo-400/70 bg-indigo-100/50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-500'
                    }
                `}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                onDragEnter={handleDropZoneEnter}
                onDragLeave={handleDropZoneLeave}
                onDrop={handleDropZoneDrop}
            >
                <div className="flex items-center gap-2 pointer-events-none select-none">
                    <PlusCircle className={`w-3.5 h-3.5 ${isOverDropZone ? 'animate-bounce' : ''}`}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">
                        {isOverDropZone ? 'Rilascia qui' : 'Nuova Tappa'}
                    </span>
                </div>
            </div>

            {/* RESOURCE DOCK (FOOTER) - STRICT ALIGNMENT */}
            {resourceItems.length > 0 && (
                <div className="w-full relative z-10 bg-transparent">
                     
                     {/* HEADER SEZIONE RISORSE (1 Riga h-7) - MODIFICATO CON BORDO SUPERIORE NERO TRATTEGGIATO */}
                     <div className={`flex items-center justify-center gap-2 ${ROW_H} border-t border-dashed border-black/40`}>
                         <Briefcase className="w-3.5 h-3.5 text-stone-600"/>
                         <span className="text-[9px] font-black uppercase text-stone-700 tracking-widest pt-0.5">CONTATTI</span>
                     </div>
                     
                     {/* Lista Risorse (Ogni card è h-14 = 2 righe) */}
                     <div className="flex flex-col">
                         {resourceItems.map(item => (
                             <DiaryResourceCard 
                                key={item.id} 
                                item={item}
                                onViewDetail={onViewDetail}
                                onCreateMemo={onCreateMemo}
                                onRemove={onRemoveItem}
                             />
                         ))}
                     </div>
                </div>
            )}
        </div>
    );
};
