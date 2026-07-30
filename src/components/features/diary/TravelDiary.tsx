import React, { useMemo, useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { CheckCircle, Trophy, RefreshCw } from 'lucide-react';
import { PointOfInterest, User, CitySummary } from '@/types';
import { getDaysArray } from '@/utils/common';
import { useItinerary } from '@/context/ItineraryContext';
import { diaryHandlesKeyboardShortcuts, useFocusMode } from '@/focus';
import { useModal } from '@/context/ModalContext';
import { useDiaryLogic } from '@/hooks/useDiaryLogic';
import { isNotesTab } from '@/domain/diary/diaryActiveTab';
import { DiaryHeader } from './DiaryHeader';
import { DiaryTimeline } from './DiaryTimeline';
import { DiaryEmptyState } from './DiaryEmptyState';
import { DiaryModals } from './DiaryModals';
import { SuitcaseToast } from './packing_list/SuitcaseFloatingPanel/components/SuitcaseToast';
import { useDiaryPoiCatalogUpdatePrompt } from '@/hooks/useDiaryPoiCatalogUpdatePrompt';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { getDiaryFlagGradient } from './nationFlag';
import { CollaborationLiveProvider } from '@/context/CollaborationLiveContext';
import { useCollaborationLive } from '@/context/CollaborationLiveContext';
import { useResourcePermission } from '@/hooks/useResourcePermission';
import { isDiaryPersisted } from '@/utils/suitcaseAssociation';
import { fetchDiariesByIds } from '@/services/community/itineraryService';
import { CollaborationLiveBar } from '@/components/collaboration/live/CollaborationLiveBar';
import { CollaborationLockBanner } from '@/components/collaboration/live/CollaborationLockBanner';
import { useAreRewardsEnabled } from '@/hooks/useAreRewardsEnabled';
import { REWARDS_FREEZE_XP_NOTICE } from '@/domain/gamification/rewardsGate';

const DiaryNotesPanel = React.lazy(() =>
    import('./notes/DiaryNotesPanel').then((module) => ({ default: module.DiaryNotesPanel })),
);

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

export const TravelDiary = (props: TravelDiaryProps) => {
    // Editor del Diario (Resource). Aggregate Root = Viaggio (`activeViaggioId` in context).
    // Il save cloud crea/collega il Viaggio via `saveUserDraft` — non trattare `itinerary.id` come patrimonio.
    const { itinerary, savedProjects, loadProject } = useItinerary();
    const isGuest = props.user.role === 'guest';
    const { permission } = useResourcePermission(
        itinerary.id ? 'diary' : null,
        itinerary.id ?? null,
        isGuest ? null : props.user.id
    );
    const canModify = permission?.capabilities.canModifyContent ?? true;
    const isPersisted = isDiaryPersisted(itinerary, savedProjects);
    const [wantsEdit, setWantsEdit] = useState(true);
    const autoSaveRef = useRef<() => Promise<void>>(async () => undefined);
    const isDirtyRef = useRef(false);

    useEffect(() => {
        setWantsEdit(true);
    }, [itinerary.id]);

    const handleRemoteRefresh = useCallback(async () => {
        if (!itinerary.id || isDirtyRef.current) return;
        const diaries = await fetchDiariesByIds([itinerary.id]);
        if (diaries[0]) {
            loadProject(diaries[0]);
        }
    }, [itinerary.id, loadProject]);

    return (
        <CollaborationLiveProvider
            kind="diary"
            resourceId={itinerary.id ?? null}
            resourceTitle={itinerary.name}
            userId={isGuest ? null : props.user.id}
            userDisplayName={props.user.name ?? 'Utente'}
            canModifyContent={canModify && isPersisted}
            isEditSessionActive={canModify && isPersisted && wantsEdit}
            onAutoSaveBeforeLockRelease={async () => {
                await autoSaveRef.current();
            }}
            onExitEditMode={() => setWantsEdit(false)}
            onRemoteContentRefresh={handleRemoteRefresh}
        >
            <TravelDiaryContent
                {...props}
                autoSaveRef={autoSaveRef}
                isDirtyRef={isDirtyRef}
                wantsEdit={wantsEdit}
                onRetryEdit={() => setWantsEdit(true)}
            />
        </CollaborationLiveProvider>
    );
};

interface TravelDiaryContentProps extends TravelDiaryProps {
    autoSaveRef: React.MutableRefObject<() => Promise<void>>;
    isDirtyRef: React.MutableRefObject<boolean>;
    wantsEdit: boolean;
    onRetryEdit: () => void;
}

const TravelDiaryContent = ({
    user, onViewDetail, onDayDrop, onPrint, onCityClick,
    userLocation, onOpenAiPlanner, onUserUpdate, onOpenRoadbook, cityManifest,
    autoSaveRef, isDirtyRef, onRetryEdit,
}: TravelDiaryContentProps) => {
    const {
        itinerary, savedProjects, highlightDates, highlightedItemId,
        state, setters, actions,
    } = useDiaryLogic({ user, onUserUpdate, onDayDropProp: onDayDrop });
    const rewardsEnabled = useAreRewardsEnabled();

    const collaborationLive = useCollaborationLive();

    useEffect(() => {
        autoSaveRef.current = async () => {
            if (state.documentSave.needsNameForSave()) return;
            await state.documentSave.save();
        };
    }, [autoSaveRef, state.documentSave]);

    // documentSave.isDirty è già phaseHasUnsavedChanges(phase) in useDiaryDocumentSave (include saving).
    isDirtyRef.current = state.documentSave.isDirty;

    const { setItinerary } = useItinerary();

    const poiCatalogUpdate = useDiaryPoiCatalogUpdatePrompt({
        itinerary,
        savedProjects,
        setItinerary,
    });

    const { openModal } = useModal();
    const { overlayKind, workspaceId } = useFocusMode();

    const dayRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const notesScrollTopRef = useRef(0);
    const wasNotesTabRef = useRef(false);

    const isNotesActive = isNotesTab(state.activeTab);
    // Montato al primo accesso al TAB NOTE e mai riportato a false: evita lo smontaggio
    // dell'editor Tiptap/ProseMirror così cursore, selezione e scroll interno restano intatti.
    const [notesPanelMounted, setNotesPanelMounted] = useState(false);

    useEffect(() => {
        if (isNotesActive && !notesPanelMounted) {
            setNotesPanelMounted(true);
        }
    }, [isNotesActive, notesPanelMounted]);

    useEffect(() => {
        const scrollEl = scrollAreaRef.current;
        let frameId: number | undefined;

        if (wasNotesTabRef.current && !isNotesActive && scrollEl) {
            notesScrollTopRef.current = scrollEl.scrollTop;
        }

        if (!wasNotesTabRef.current && isNotesActive && scrollEl) {
            frameId = requestAnimationFrame(() => {
                scrollEl.scrollTop = notesScrollTopRef.current;
            });
        }

        wasNotesTabRef.current = isNotesActive;

        return () => {
            if (frameId !== undefined) cancelAnimationFrame(frameId);
        };
    }, [isNotesActive]);

    const minDateStr = new Date().toISOString().split('T')[0];

    const days = useMemo(() => {
        if (!itinerary.startDate || !itinerary.endDate) return [];
        return getDaysArray(itinerary.startDate, itinerary.endDate);
    }, [itinerary.startDate, itinerary.endDate]);

    // Bandiera dinamica: colori della nazione dominante tra i POI del diario (default Italia).
    const flagGradient = useMemo(
        () => getDiaryFlagGradient(itinerary, cityManifest),
        [itinerary, cityManifest]
    );

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
            if (!diaryHandlesKeyboardShortcuts({ overlayKind, workspaceId })) return;

            const target = e.target as HTMLElement;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
            const inDiaryNotesEditor = target.closest('[data-diary-notes-editor]') !== null;
            const isNativeEditableTarget =
                ['INPUT', 'TEXTAREA'].includes(target.tagName) ||
                (target.isContentEditable && !inDiaryNotesEditor);

            const isUndo = cmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey;
            const isRedo =
                (cmdOrCtrl && e.key.toLowerCase() === 'y') ||
                (isMac && cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z');

            if (isUndo || isRedo) {
                if (isNativeEditableTarget) return;
                e.preventDefault();
                if (isUndo) setters.performUndo();
                else setters.performRedo();
                return;
            }

            if (isNativeEditableTarget) return;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setters, overlayKind, workspaceId]);

    return (
        <div ref={containerRef} className="isolate h-full flex flex-col rounded-sm shadow-xl overflow-hidden border border-slate-600 relative group/diary bg-[#e7e5e4] select-none">
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
                userId={user.id}
                isGuest={user.role === 'guest'}
            />

            {state.toastMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-900 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 max-w-md">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                        <div>
                            <p className="font-bold text-sm">{state.toastMessage.title}</p>
                            <p className="text-xs text-slate-400">
                                Hai guadagnato <span className="text-amber-400 font-bold">+{state.toastMessage.xp} XP</span>
                            </p>
                            {state.toastMessage.xp > 0 && !rewardsEnabled && (
                                <p className="text-[10px] text-indigo-300 mt-0.5 leading-snug">
                                    {REWARDS_FREEZE_XP_NOTICE.headline}
                                </p>
                            )}
                        </div>
                        <Trophy className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
                    </div>
                </div>
            )}

            <SuitcaseToast visible={state.diaryToast.visible} message={state.diaryToast.message} />

            <DeleteConfirmationModal
                isOpen={poiCatalogUpdate.isOpen}
                onClose={poiCatalogUpdate.dismissPrompt}
                onConfirm={() => { void poiCatalogUpdate.confirmPrompt(); }}
                title="Aggiornamenti disponibili"
                message={'Sono disponibili aggiornamenti per alcuni luoghi presenti in questo diario.\nVuoi aggiornare i dati mantenendo invariati i tuoi appunti e le tue note personali?'}
                confirmLabel="Aggiorna"
                cancelLabel="Non ora"
                variant="info"
                isDeleting={poiCatalogUpdate.isApplying}
                loadingLabel="Aggiornamento..."
                icon={<RefreshCw className="w-8 h-8 text-indigo-500" />}
            />

            {/* Barra "bandiera": colori della nazione dei POI del diario (default Italia).
                Resa come singolo gradient con stop netti — robusta e identica su desktop/mobile
                (il color-scheme:dark globale evita l'auto-dark del bianco sui browser mobile). */}
            <div
                className="h-[4px] w-full shadow-sm shrink-0"
                style={{ backgroundImage: flagGradient }}
                role="presentation"
            />

            {(collaborationLive.isEnabled || collaborationLive.lockBlockedMessage) && (
                <div className="px-3 md:px-4 py-2 space-y-2 bg-[#e7e5e4] border-b border-stone-300/80 shrink-0">
                    {collaborationLive.isEnabled && (
                        <CollaborationLiveBar
                            peers={collaborationLive.presencePeers}
                            editingStatusMessage={collaborationLive.editingStatusMessage}
                        />
                    )}
                    {collaborationLive.lockBlockedMessage && (
                        <CollaborationLockBanner
                            message={collaborationLive.lockBlockedMessage}
                            onRetry={() => {
                                onRetryEdit();
                                void collaborationLive.retryAcquireLock();
                            }}
                        />
                    )}
                </div>
            )}

            <DiaryHeader
                itinerary={itinerary}
                user={user}
                popoverBoundaryRef={containerRef}
                savedProjects={savedProjects}
                highlightDates={highlightDates}
                activeTab={state.activeTab}
                days={days}
                minDateStr={minDateStr}
                onSetName={(name) => {
                    if (state.collaborationReadOnly) return;
                    setters.setItinerary((prev) => ({ ...prev, name }));
                }}
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
                onPublishRequest={actions.handleRequestPublish}
                onConfirmPublish={() => void actions.handlePublish()}
                publishModalOpen={state.publishModalOpen}
                onPublishModalClose={() => setters.setPublishModalOpen(false)}
                isPublishing={state.isPublishing}
                isAlreadyPublished={state.isAlreadyPublished}
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
                ref={scrollAreaRef}
                className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto relative diary-grid-bg transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
                onDragEnter={actions.handleDragEnter}
                onDragLeave={actions.handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={actions.handleDrop}
            >
                {days.length > 0 ? (
                    <>
                        {notesPanelMounted && (
                            // Montato una sola volta (preserva editor/focus); `hidden` è solo CSS —
                            // nessun observer o polling aggiuntivo: Tiptap resta idle finché non c'è input.
                            <div
                                className={`w-full min-w-0 h-full flex flex-col min-h-0 max-w-full md:max-w-5xl md:mx-auto select-text ${isNotesActive ? '' : 'hidden'}`}
                                aria-hidden={!isNotesActive}
                            >
                                <Suspense fallback={null}>
                                    <DiaryNotesPanel
                                        isActive={isNotesActive}
                                        notesState={itinerary.diaryNotes}
                                        onNotesStateChange={actions.handleDiaryNotesChange}
                                    />
                                </Suspense>
                            </div>
                        )}
                        {!isNotesActive && (
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
                            onTransportSelect={actions.onTransportSelect}
                            onNoteChange={actions.onNoteChange}
                            onDayDrop={actions.handleDayDrop}
                            onItemDrop={(e, idx, time) => actions.handleDayDrop(e, idx, time)}
                            onMobileMoveClick={setters.setItemToMove}
                            cityManifest={cityManifest}
                            onCreateMemo={actions.toggleItemType}
                            onMemoClick={actions.handleMemoClick}
                        />
                        )}
                    </>
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
