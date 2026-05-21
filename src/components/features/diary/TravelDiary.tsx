import { Z_MODAL_NESTED, Z_MODAL, Z_FLOATING_PANEL } from '@/constants/zIndex';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Trophy } from 'lucide-react';
import { ItineraryItem, PointOfInterest, User, CitySummary } from '@/types';
import { getDaysArray } from '@/utils/common';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext'; // IMPORTA useModal
import { DateChangeWarningModal } from '../../modals/DateChangeWarningModal';
import { SaveAsModal } from '../../modals/SaveAsModal';
import { ConfirmClearModal } from '../../modals/ConfirmClearModal';
import { MobileMoveModal } from '../../modals/MobileMoveModal'; 
import { publishUserItinerary } from '@/services/dataService';

// Logic Hook
import { useDiaryLogic } from '@/hooks/useDiaryLogic';

// Modular Components
import { DiaryHeader } from './DiaryHeader';
import { DiaryTimeline } from './DiaryTimeline';
import { DiaryEmptyState } from './DiaryEmptyState';
import { DiaryModals } from './DiaryModals';
import { SuitcaseToast } from './packing_list/SuitcaseFloatingPanel/components/SuitcaseToast';

interface TravelDiaryProps {
    user: User;
    onViewDetail: (poi: PointOfInterest) => void;
    onDayDrop: (dayIndex: number, data: string, targetTime?: string) => void;
    onPrint: () => void;
    userLocation: { lat: number; lng: number } | null;
    onCityClick: (id: string) => void;
    onOpenAiPlanner?: () => void;
    onUserUpdate?: (user: User) => void;
    onOpenRoadbook?: () => void;
    cityManifest?: CitySummary[];
}

export const TravelDiary = ({ 
    user, onViewDetail, onDayDrop, onPrint, onCityClick, 
    userLocation, onOpenAiPlanner, onUserUpdate, onOpenRoadbook, cityManifest 
}: TravelDiaryProps) => {
    
    // --- USE CUSTOM HOOK (THE BRAIN) ---
    const { 
        itinerary, savedProjects, highlightDates, highlightedItemId,
        state, setters, actions 
    } = useDiaryLogic({ user, onUserUpdate, onDayDropProp: onDayDrop });

    const { openModal } = useModal(); // CHIAMA useModal

    // --- VIEW REFS (UI ONLY) ---
    const dayRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
    const itemRefs = useRef<{[key: string]: HTMLDivElement | null}>({}); 
    const containerRef = useRef<HTMLDivElement>(null);
    
    const minDateStr = new Date().toISOString().split('T')[0];

    const days = useMemo(() => {
        if (!itinerary.startDate || !itinerary.endDate) return [];
        return getDaysArray(itinerary.startDate, itinerary.endDate);
    }, [itinerary.startDate, itinerary.endDate]);

    // Funzione per aprire il modale della packing list
    const handleOpenPackingList = () => {
        openModal('packingList', { itineraryId: itinerary.id });
    };

    const { activeModal } = useModal();

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Guard: don't trigger if focus is in input/textarea
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

            // Guard: don't trigger if any modal is open (except packingList if we wanted, but let's stick to user requirement)
            // Requirement: "focus NON è dentro modali aperti"
            if (activeModal && activeModal !== 'packingList') return; 

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            // Undo: Ctrl+Z or Cmd+Z
            if (cmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                setters.performUndo();
            }

            // Redo: Ctrl+Y or Cmd+Y or Cmd+Shift+Z
            if ((cmdOrCtrl && e.key.toLowerCase() === 'y') || (isMac && cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
                e.preventDefault();
                setters.performRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setters, activeModal]);

    return (
        <div ref={containerRef} className="h-full flex flex-col rounded-sm shadow-xl overflow-hidden border border-slate-600 relative group/diary bg-[#e7e5e4] select-none">
            <style>{`
                .diary-grid-bg { background-image: linear-gradient(transparent calc(1.75rem - 1px), #d6d3d1 calc(1.75rem - 1px)); background-size: 100% 1.75rem; background-color: #e7e5e4; background-attachment: local; overscroll-behavior-y: contain; }
            `}</style>
            
            {/* MODALS EXTRACTED */}
            <DiaryModals 
                state={state}
                setters={setters}
                actions={actions}
                itinerary={itinerary}
                days={days}
                onDayDrop={onDayDrop}
            />

            {state.toastMessage && (
                <div 
                    className="absolute top-20 left-1/2 -translate-x-1/2 animate-in slide-in-from-top-4 fade-in duration-300"
                    style={{ zIndex: Z_MODAL_NESTED }}
                >
                    <div className="bg-slate-900 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500"/></div>
                        <div><p className="font-bold text-sm">{state.toastMessage.title}</p><p className="text-xs text-slate-400">Hai guadagnato <span className="text-amber-400 font-bold">+{state.toastMessage.xp} XP</span></p></div>
                        <Trophy className="w-5 h-5 text-amber-500 animate-bounce"/>
                    </div>
                </div>
            )}

            <SuitcaseToast visible={state.diaryToast.visible} message={state.diaryToast.message} />

            <div className="h-[4px] w-full flex shadow-sm flex-shrink-0" style={{ zIndex: Z_FLOATING_PANEL }}>
                <div className="h-full w-1/3 bg-[#009246]"></div><div className="h-full w-1/3 bg-[#ffffff]"></div><div className="h-full w-1/3 bg-[#ce2b37]"></div>
            </div>

            <DiaryHeader 
                itinerary={itinerary} 
                user={user} 
                savedProjects={savedProjects} 
                highlightDates={highlightDates} 
                activeTab={state.activeTab} 
                days={days} 
                minDateStr={minDateStr}
                onSetName={(name) => setters.setItinerary(prev => ({...prev, name}))} 
                onDateChange={actions.handleDateChange} 
                onLoadProject={actions.loadProject} 
                onSaveAction={() => { if(!itinerary.name) setters.setSaveAsModalOpen(true); else actions.saveProject(); }} 
                onSaveAs={() => setters.setSaveAsModalOpen(true)} 
                onPrint={onPrint} 
                onClear={() => setters.setClearModalOpen(true)} 
                onPublish={actions.handlePublish} 
                onOpenAiPlanner={onOpenAiPlanner}
                onOpenRoadbook={onOpenRoadbook}
                onOpenPackingList={handleOpenPackingList} // COLLEGA LA FUNZIONE
                setActiveTab={setters.setActiveTab}
                onDeleteProject={actions.deleteProject} 
                onUndo={setters.performUndo}
                onRedo={setters.performRedo}
                canUndo={state.canUndo}
                canRedo={state.canRedo}
            />

            <div 
                className="flex-1 overflow-y-auto relative z-floating-panel justify-center diary-grid-bg transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]" 
                onDragEnter={actions.handleDragEnter}
                onDragLeave={actions.handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={actions.handleDrop}
            >
                {days.length > 0 ? (
                    <DiaryTimeline 
                        itinerary={itinerary} 
                        days={days} 
                        activeTab={state.activeTab} 
                        userLocation={userLocation} 
                        highlightedItemId={highlightedItemId} 
                        editingTimeId={state.editingTimeId} 
                        iconPickerOpen={state.iconPickerOpen} 
                        colorPickerOpen={state.colorPickerOpen} 
                        isMobile={state.isMobile} 
                        dayRefs={dayRefs} 
                        itemRefs={itemRefs} 
                        isDraggingOver={state.isDraggingOver}
                        onCityClick={onCityClick} 
                        onAddNote={actions.handleAddNote} 
                        onColorPickerToggle={setters.setColorPickerOpen} 
                        onColorSelect={(idx, cls) => { actions.updateDayStyle(idx, cls); setters.setColorPickerOpen(null); }} 
                        onViewDetail={onViewDetail} 
                        onRemoveItem={actions.removeItem} 
                        onTimeChange={actions.onTimeChange} 
                        onSetEditingTime={setters.setEditingTimeId} 
                        onIconClick={setters.setIconPickerOpen} 
                        onIconSelect={actions.onIconSelect} 
                        onNoteChange={actions.onNoteChange} 
                        onDayDrop={actions.handleDayDrop} 
                        onItemDrop={(e, idx, time) => actions.handleDayDrop(e, idx, time)} 
                        onMobileMoveClick={setters.setItemToMove}
                        cityManifest={cityManifest}
                        onToggleItemType={actions.toggleItemType} 
                    />
                ) : (
                    <div 
                        className={`h-full transition-all duration-300 ${state.isDraggingOver ? 'bg-indigo-50/20' : ''}`}
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={actions.handleContainerDrop}
                    >
                        <DiaryEmptyState isDraggingOver={state.isDraggingOver} />
                    </div>
                )}
            </div>
        </div>
    );
};



