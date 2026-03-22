
import React from 'react';
import { Itinerary, ItineraryItem, PointOfInterest, CitySummary } from '@/types';
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
    isDraggingOver?: boolean; 
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
    onIconClick: (id: string) => void;
    onIconSelect: (id: string, iconKey: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onDayDrop: (e: React.DragEvent, dayIdx: number, time?: string) => void;
    onItemDrop: (e: React.DragEvent, dayIdx: number, time: string) => void;
    onMobileMoveClick: (item: ItineraryItem) => void;
    onToggleItemType: (item: ItineraryItem) => void; // RENAMED in DiaryDay to onCreateMemo
    // NEW PROPS
    onCreateMemo: (item: ItineraryItem) => void;
    onMemoClick: (id: string) => void;
}

export const DiaryTimeline: React.FC<DiaryTimelineProps> = (props) => {
    
    // --- HELPER LOGICA GLOBALE ---

    const getCityDisplayName = (id: string) => {
        if (!id || id === 'unknown' || id === 'custom') return '';
        if (props.cityManifest) {
             const found = props.cityManifest.find(c => c.id === id);
             if (found) return found.name;
        }
        return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const uniqueCityIds = Array.from(new Set(props.itinerary.items.map(i => i.cityId))).filter(id => id !== 'unknown' && id !== 'custom') as string[];
    const start = props.itinerary.startDate ? new Date(props.itinerary.startDate) : null;
    const end = props.itinerary.endDate ? new Date(props.itinerary.endDate) : null;
    const dateSummary = (start && end) ? `${start.toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'})}-${end.toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'})} | ${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1}g` : "";

    return (
        <div className="min-h-full flex flex-col">
            
            {/* STICKY HEADER GLOBALE (Date & Città) */}
            <div className="sticky top-0 z-[40] h-7 w-full px-3 md:px-4 flex items-center justify-between bg-[#e7e5e4] border-b border-stone-300 shadow-sm flex-shrink-0 box-border">
                <div className="flex-1 min-w-0 mr-4">
                    <div className="flex gap-1 font-handwriting text-sm md:text-xl font-bold text-stone-800 truncate leading-none pt-0.5">
                        {uniqueCityIds.length > 0 ? uniqueCityIds.map((id, idx) => (
                            <span key={id} className="flex items-center">
                                <button onClick={() => props.onCityClick(id)} className="hover:underline hover:text-amber-600 transition-colors">
                                    {getCityDisplayName(id)}
                                </button>
                                {idx < uniqueCityIds.length - 1 && <span className="mr-1">,</span>}
                            </span>
                        )) : <span className="opacity-0">.</span>}
                    </div>
                </div>
                <span className="font-mono text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-tight leading-none flex-shrink-0">{dateSummary}</span>
            </div>

            {/* CONTENUTO GIORNI */}
            <div className="mt-7">
                {props.activeTab === 'all' ? props.days.map((day, idx) => (
                    <DiaryDay 
                        key={idx}
                        day={day}
                        dayIndex={idx}
                        items={props.itinerary.items.filter(i => i.dayIndex === idx)}
                        dayStyleClass={props.itinerary.dayStyles?.[idx]}
                        // Pass-through di tutte le props necessarie
                        {...props}
                    />
                )) : (typeof props.activeTab === 'number' && props.days[props.activeTab] ? (
                    <DiaryDay 
                        key={props.activeTab}
                        day={props.days[props.activeTab]}
                        dayIndex={props.activeTab}
                        items={props.itinerary.items.filter(i => i.dayIndex === props.activeTab)}
                        dayStyleClass={props.itinerary.dayStyles?.[props.activeTab]}
                        {...props}
                    />
                ) : null)}
            </div>
        </div>
    );
};
