import React, { useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Trophy } from 'lucide-react';
import { PointOfInterest, User, CitySummary } from '@/types';
import { getDaysArray } from '@/utils/common';
import { useItinerary } from '@/context/ItineraryContext';
import { diaryHandlesKeyboardShortcuts, useFocusMode } from '@/focus';
import { useModal } from '@/context/ModalContext';
import { useDiaryLogic } from '@/hooks/useDiaryLogic';
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
    userLocation, onOpenAiPlanner, onUserUpdate, onOpenRoadbook, cityManifest,
}: TravelDiaryProps) => {
    const {
        itinerary, savedProjects, highlightDates, highlightedItemId,
        state, setters, actions,
    } = useDiaryLogic({ user, onUserUpdate, onDayDropProp: onDayDrop });

    const { openModal } = useModal();
    const { overlayKind, workspaceId } = useFocusMode();

    const dayRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const containerRef = useRef<HTMLDivElement>(null);

    const minDateStr = new Date().toISOString().split('T')[0];

    const days = useMemo(() => {
        if (!itinerary.startDate || !itinerary.endDate) return [];
        return getDaysArray(itinerary.startDate, itinerary.endDate);
    }, [itinerary.startDate, itinerary.endDate]);

    const handleOpenPackingList = () => {
        openModal('packingList', { itineraryId: itinerary.id });
    };

    useEffect(() => {
        const preloadSuitcasePanelChunk = () => {
            void import('@/components/features/diary/packing_list/SuitcaseFloatingPanel');
        };

        if (typeof requestIdleCallback !== 'undefined') {
            const idleId = requestIdleCallback(preloadSuitcasePanelChunk, { timeout: 3000 });
            return () => cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(preloadSuitcasePanelChunk, 1500);
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
            if (!diaryHandlesKeyboardShortcuts({ overlayKind, workspaceId })) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            if (cmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                setters.performUndo();
            }

            if ((cmdOrCtrl && e.key.toLowerCase() === 'y') || (isMac && cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
                e.preventDefault();
                setters.performRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setters, overlayKind, workspaceId]);

    return (
        <div ref={containerRef} className="h-full flex flex-col rounded-sm shadow-xl overflow-hidden border border-slate-600 relative group/diary bg-[#e7e5e4] select-none">
            <style>{`
                .diary-grid-bg { background-image: linear-gradient(transparent calc(1.75rem - 1px), #d6d3d1 calc(1.75rem - 1px)); background-size: 100% 1.75rem; background-color: #e7e5e4; background-attachment: local; overscroll-behavior-y: contain; }
            `}</style>

            <DiaryModals
                state={state}
                setters={setters}
                actions={actions}
                itinerary={itinerary}
                days={days}
                onDayDrop={onDayDrop}
            />

            {state.toastMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-900 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                        <div>
                            <p className="font-bold text-sm">{state.toastMessage.title}</p>
                            <p className="text-xs text-slate-400">
                                Hai guadagnato <span className="text-amber-400 font-bold">+{state.toastMessage.xp} XP</span>
                            </p>
                        </div>
                        <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                    </div>
                </div>
            )}

            <SuitcaseToast visible={state.diaryToast.visible} message={state.diaryToast.message} />

            <div className="h-[4px] w-full flex shadow-sm shrink-0">
                <div className="h-full w-1/3 bg-[#009246]" />
                <div className="h-full w-1/3 bg-[#ffffff]" />
                <div className="h-full w-1/3 bg-[#ce2b37]" />
            </div>

            <DiaryHeader
                itinerary={itinerary}
                user={user}
                savedProjects={savedProjects}
                highlightDates={highlightDates}
                activeTab={state.activeTab}
                days={days}
                minDateStr={minDateStr}
                onSetName={(name) => setters.setItinerary(prev => ({ ...prev, name }))}
                onDateChange={actions.handleDateChange}
                onLoadProject={actions.loadProject}
                onSave={() => {
                    if (state.documentSave.needsNameForSave()) {
                        setters.setSaveAsModalOpen(true);
                    } else {
                        void state.documentSave.save();
                    }
                }}
                onSaveAs={() => setters.setSaveAsModalOpen(true)}
                savePhase={state.documentSave.phase}
                lastSavedAt={state.documentSave.lastSavedAt}
                lastSaveError={state.documentSave.lastError}
                autosaveEnabled={state.documentSave.autosaveEnabled}
                canUseAutosave={state.documentSave.canUseAutosave}
                onAutosaveToggle={state.documentSave.setAutosaveEnabled}
                isDocumentDirty={state.documentSave.isDirty}
                onPrint={onPrint}
                onClear={() => setters.setClearModalOpen(true)}
                onPublish={actions.handlePublish}
                onOpenAiPlanner={onOpenAiPlanner}
                onOpenRoadbook={onOpenRoadbook}
                onOpenPackingList={handleOpenPackingList}
                setActiveTab={setters.setActiveTab}
                onDeleteProject={actions.deleteProject}
                onUndo={setters.performUndo}
                onRedo={setters.performRedo}
                canUndo={state.canUndo}
                canRedo={state.canRedo}
            />

            <div
                className="flex-1 min-h-0 overflow-y-auto relative justify-center diary-grid-bg transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
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
                        onCreateMemo={actions.toggleItemType}
                        onMemoClick={actions.handleMemoClick}
                    />
                ) : (
                    <div
                        className={`h-full transition-colors duration-300 ${state.isDraggingOver ? 'bg-indigo-50/20' : ''}`}
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
