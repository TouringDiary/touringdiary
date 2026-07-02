import { Z_DROPDOWN } from '@/constants/zIndex';
import React, { useRef, useState, useEffect } from 'react';
import { AlertTriangle, Check, Cloud, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Itinerary, User } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { useDynamicContent } from '@/hooks/useDynamicContent'; 
import { useModal } from '@/context/ModalContext';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useSystemMessage } from '../../../hooks/useSystemMessage';


// SUB-COMPONENTS
import { DiaryHeaderToolbar } from './header/DiaryHeaderToolbar';
import { DiaryHeaderProjectInput } from './header/DiaryHeaderProjectInput';
import { DiaryHeaderDateRange } from './header/DiaryHeaderDateRange';
import { DiaryHeaderTabs } from './header/DiaryHeaderTabs';
import { DiaryHeaderInvalidDateModal } from './header/DiaryHeaderInvalidDateModal';

import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import type { DiaryActiveTab } from '@/domain/diary/diaryActiveTab';
import { formatItalianTime, formatItalianTimeWithSeconds } from '@/utils/dateFormatters';
import { useBelowLg } from '@/hooks/ui/useBelowLg';

interface DiaryHeaderProps {
    itinerary: Itinerary;
    user: User;
    savedProjects: Itinerary[];
    highlightDates: boolean;
    activeTab: DiaryActiveTab;
    days: Date[];
    minDateStr: string;
    onSetName: (name: string) => void;
    onDateChange: (type: 'startDate' | 'endDate', val: string) => void;
    onLoadProject: (p: Itinerary) => void;
    onSave: () => void;
    onSaveAs: () => void;
    savePhase: DocumentSavePhase;
    lastSavedAt: number | null;
    lastSaveError: string | null;
    autosaveEnabled: boolean;
    canUseAutosave: boolean;
    onAutosaveToggle: (enabled: boolean) => void;
    isDocumentDirty: boolean;
    onPrint: () => void;
    onClear: () => void;
    onPublish: () => void;
    onOpenAiPlanner?: () => void;
    onOpenRoadbook?: () => void;
    onOpenPackingList?: () => void;
    setActiveTab: (tab: DiaryActiveTab) => void;
    onDeleteProject: (id: string) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    popoverBoundaryRef?: React.RefObject<HTMLElement | null>;
}

const formatDateForDisplay = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

function getSaveBadgeLabel(
    phase: DocumentSavePhase,
    lastSavedAt: number | null,
    isMobile: boolean,
): string {
    switch (phase) {
        case 'error':
            return 'Errore di salvataggio';
        case 'saving':
            return isMobile ? '' : 'Salvataggio...';
        case 'dirty':
            return isMobile ? '...' : 'Da salvare';
        case 'synced':
            if (!lastSavedAt) return '';
            return isMobile
                ? formatItalianTime(lastSavedAt)
                : `Salvato alle ${formatItalianTimeWithSeconds(lastSavedAt)}`;
        default:
            return '';
    }
}

const SYNCED_LABEL_DURATION_MS = 5000;

const DiaryHeaderSaveBadge: React.FC<{
    documentId: string;
    phase: DocumentSavePhase;
    lastSavedAt: number | null;
    lastError: string | null;
    isGuest: boolean;
    isMobile: boolean;
}> = ({ documentId, phase, lastSavedAt, lastError, isGuest, isMobile }) => {
    const [showSyncedLabel, setShowSyncedLabel] = useState(false);
    const prevLastSavedAtRef = useRef(lastSavedAt);
    const prevDocumentIdRef = useRef(documentId);

    useEffect(() => {
        if (lastSavedAt == null) return;
        if (prevLastSavedAtRef.current === lastSavedAt) return;

        prevLastSavedAtRef.current = lastSavedAt;
        setShowSyncedLabel(true);
        const timer = setTimeout(() => setShowSyncedLabel(false), SYNCED_LABEL_DURATION_MS);
        return () => clearTimeout(timer);
    }, [lastSavedAt]);

    useEffect(() => {
        if (prevDocumentIdRef.current === documentId) return;
        prevDocumentIdRef.current = documentId;
        if (phase !== 'synced' || lastSavedAt == null) return;

        prevLastSavedAtRef.current = lastSavedAt;
        setShowSyncedLabel(true);
        const timer = setTimeout(() => setShowSyncedLabel(false), SYNCED_LABEL_DURATION_MS);
        return () => clearTimeout(timer);
    }, [documentId, phase, lastSavedAt]);

    if (isGuest || phase === 'never_saved') return null;

    const isSaving = phase === 'saving';
    const isSynced = phase === 'synced';
    const isDirty = phase === 'dirty';
    const isError = phase === 'error';
    const badgeLabel = getSaveBadgeLabel(phase, lastSavedAt, isMobile);
    const showLabel =
        !!badgeLabel &&
        (isError || isDirty || (!isMobile && isSaving) || (isSynced && showSyncedLabel));
    const syncedTooltip =
        isSynced && lastSavedAt
            ? `Salvato alle ${formatItalianTimeWithSeconds(lastSavedAt)}`
            : undefined;
    const tooltip = isError ? (lastError ?? 'Errore di salvataggio') : syncedTooltip;

    return (
        <div
            className={`flex shrink-0 items-center rounded-full border py-1 text-[10px] font-bold tracking-wide shadow-sm ${
                showLabel ? 'gap-1.5 px-2' : 'px-1.5'
            } ${
                isError
                    ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                    : 'border-slate-700/70 bg-slate-800/70 text-slate-300'
            }`}
            role="status"
            aria-live="polite"
            title={tooltip}
            aria-label={tooltip ?? (showLabel ? badgeLabel : undefined)}
        >
            <span className="relative inline-flex" aria-hidden>
                <Cloud className={`w-4 h-4 ${isError ? 'text-rose-300' : 'text-slate-400'}`} />
                {isSaving && (
                    <RefreshCw className="absolute -right-1.5 -top-1.5 w-2.5 h-2.5 text-indigo-300 animate-spin" />
                )}
                {isSynced && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                        <Check className="h-2.5 w-2.5 shrink-0 text-white" strokeWidth={3} aria-hidden />
                    </span>
                )}
                {isError && (
                    <AlertTriangle className="absolute -right-1.5 -top-1.5 w-2.5 h-2.5 text-rose-300" />
                )}
                {isDirty && !isMobile && (
                    <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
            </span>
            {showLabel && (
                <span className="tabular-nums whitespace-nowrap">
                    {badgeLabel}
                </span>
            )}
        </div>
    );
};

export const DiaryHeader: React.FC<DiaryHeaderProps> = ({
    itinerary, user, savedProjects, highlightDates, activeTab, days, minDateStr,
    onSetName, onDateChange, onLoadProject, onSave, onSaveAs, savePhase, lastSavedAt, lastSaveError,
    autosaveEnabled, canUseAutosave, onAutosaveToggle, isDocumentDirty,
    onPrint, onClear, onPublish, onOpenAiPlanner, onOpenRoadbook, onOpenPackingList, setActiveTab, onDeleteProject,
    onUndo, onRedo, canUndo, canRedo, popoverBoundaryRef
}) => {
    const { syncCloudDrafts } = useItinerary(); 
    const { openModal } = useModal(); 
    
    const [loadMenuOpen, setLoadMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false); 
    const [shouldFlashRoadbook, setShouldFlashRoadbook] = useState(false);
    
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // FETCH TESTI DB
    const { getText: getDeleteMsg } = useSystemMessage('modal_delete_confirm');
    const { getText: getClearMsg } = useSystemMessage('modal_clear_diary');
    const { getText: getInvalidRangeMsg } = useSystemMessage('modal_invalid_date_range');
    const { getText: getUnsavedLoadMsg } = useSystemMessage('modal_unsaved_changes_load_diary');
    
    const [shouldFlashSuitcase, setShouldFlashSuitcase] = useState(false);

    const isMobile = useBelowLg();

    const titleConfig = useDynamicContent('diary_title', isMobile);
    
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const loadMenuRef = useRef<HTMLDivElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    // --- LOCAL STATE FOR DATE DISPLAY ---
    const [displayStartDate, setDisplayStartDate] = useState(formatDateForDisplay(itinerary.startDate));
    const [displayEndDate, setDisplayEndDate] = useState(formatDateForDisplay(itinerary.endDate));

    useEffect(() => {
        setDisplayStartDate(formatDateForDisplay(itinerary.startDate));
    }, [itinerary.startDate]);

    useEffect(() => {
        setDisplayEndDate(formatDateForDisplay(itinerary.endDate));
    }, [itinerary.endDate]);
    
    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>, type: 'startDate' | 'endDate') => {
        const displayValue = e.target.value.trim();
        if (!displayValue) {
            handleLocalDateChange(type, '');
            return;
        }
        const parts = displayValue.split('/');

        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const [day, month, year] = parts;
            const newDateStr = `${year}-${month}-${day}`;
            const newDate = new Date(newDateStr);
            if (!isNaN(newDate.getTime()) && newDate.getDate() === parseInt(day, 10)) {
                handleLocalDateChange(type, newDateStr);
                return;
            }
        }
        // If format is invalid, revert to the last valid value from props
        if (type === 'startDate') {
            setDisplayStartDate(formatDateForDisplay(itinerary.startDate));
        } else {
            setDisplayEndDate(formatDateForDisplay(itinerary.endDate));
        }
    };

    const handleLocalDateChange = (type: 'startDate' | 'endDate', val: string) => {
        // VALIDAZIONE BLOCCANTE: startDate > endDate
        if (type === 'startDate' && val && itinerary.endDate && val > itinerary.endDate) {
            setIsInvalidRangeModalOpen(true);
            setDisplayStartDate(formatDateForDisplay(itinerary.startDate));
            return;
        }

        onDateChange(type, val);
        
        if (type === 'startDate') {
            if (!val) {
                onDateChange('endDate', '');
            }
        }
    };

    const endMinDateStr = itinerary.startDate && itinerary.startDate > minDateStr ? itinerary.startDate : minDateStr;

    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
    const [dateToClear, setDateToClear] = useState<'startDate' | 'endDate' | null>(null);
    const [isInvalidRangeModalOpen, setIsInvalidRangeModalOpen] = useState(false);
    const [pendingProjectToLoad, setPendingProjectToLoad] = useState<Itinerary | null>(null);

    const handleLoadProjectIntercept = (p: Itinerary) => {
        if (isDocumentDirty) {
            setPendingProjectToLoad(p);
        } else {
            onLoadProject(p);
            setLoadMenuOpen(false);
        }
    };

    useEffect(() => {
        if (itinerary.items.length > 0) {
            setShouldFlashRoadbook(true);
            const timer = setTimeout(() => setShouldFlashRoadbook(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [itinerary.items.length]);

    useEffect(() => {
        if (itinerary.items.length > 0) {
            setShouldFlashSuitcase(true);
            const timer = setTimeout(() => setShouldFlashSuitcase(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [itinerary.items.length]);

    // Menu click-outside: handled by AnchoredPopover in DiaryHeaderProjectInput (portaled).

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsContainerRef.current) tabsContainerRef.current.scrollBy({ left: direction === 'left' ? -100 : 100, behavior: 'smooth' });
    };

    const handleLoadMenuOpen = () => {
        const newState = !loadMenuOpen;
        setLoadMenuOpen(newState);
        
        if (newState && user && user.role !== 'guest') {
            setIsSyncing(true);
            syncCloudDrafts(user.id).then(() => {
                setTimeout(() => setIsSyncing(false), 500);
            });
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await onDeleteProject(deleteTargetId);
            setDeleteTargetId(null);
        } catch (e) {
            alert("Errore durante la cancellazione");
        } finally {
            setIsDeleting(false);
        }
    };

    const isGuest = user.role === 'guest';
    const canPublish = itinerary.items.length > 0 && itinerary.name && !isGuest;

    const handleSave = () => {
        if (isGuest) {
            openModal('auth');
            return;
        }
        onSave();
    };

    const handleSaveAs = () => {
        if (isGuest) {
            openModal('auth');
            return;
        }
        onSaveAs();
    };

    const handleExportClick = () => {
        if (itinerary.items.length === 0) {
            openModal('emptyDiary');
        } else {
            openModal('exportOptions');
        }
    };

    const targetProjectName = savedProjects.find(p => p.id === deleteTargetId)?.name || 'questo diario';

    return (
        <div className="p-3 border-b border-stone-300 bg-slate-900 shadow-sm relative no-print-bg flex-shrink-0 transition-all" style={{ zIndex: Z_DROPDOWN }}>
            <DeleteConfirmationModal 
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title={getDeleteMsg().title || "Eliminare Diario?"}
                message={getDeleteMsg({ name: targetProjectName }).body || `Stai per cancellare definitivamente "${targetProjectName}". L'azione è irreversibile.`}
                isDeleting={isDeleting}
                variant="danger"
                icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse"/>}
            />

            <DeleteConfirmationModal
                isOpen={!!dateToClear}
                onClose={() => setDateToClear(null)}
                onConfirm={() => {
                    if (dateToClear) {
                        handleLocalDateChange(dateToClear, '');
                        setDateToClear(null);
                        setIsStartCalendarOpen(false);
                        setIsEndCalendarOpen(false);
                    }
                }}
                title={getClearMsg().title || "Pulisci diario"}
                message={getClearMsg().body || `Le tappe del diario verranno eliminate.\nLe modifiche non salvate andranno perse.\n\nVuoi procedere?`}
                isDeleting={false}
                variant="danger"
                confirmLabel="Elimina tutto"
                cancelLabel="Annulla"
                icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse"/>}
            />

            <DeleteConfirmationModal 
                isOpen={!!pendingProjectToLoad}
                onClose={() => setPendingProjectToLoad(null)}
                onConfirm={() => {
                    if (pendingProjectToLoad) {
                        onLoadProject(pendingProjectToLoad);
                        setPendingProjectToLoad(null);
                        setLoadMenuOpen(false);
                    }
                }}
                title={getUnsavedLoadMsg().title}
                message={getUnsavedLoadMsg().body}
                confirmLabel={getUnsavedLoadMsg().confirmLabel}
                cancelLabel={getUnsavedLoadMsg().cancelLabel}
                variant="warning"
                icon={<AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse"/>}
            />

            <DiaryHeaderInvalidDateModal 
                isOpen={isInvalidRangeModalOpen}
                onClose={() => setIsInvalidRangeModalOpen(false)}
                title={getInvalidRangeMsg().title || "Intervallo non valido"}
                body={getInvalidRangeMsg().body || "La data di inizio non può essere successiva alla data di fine."}
            />

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Pencil className="w-[16.5px] h-[16.5px] text-amber-500 shrink-0" />
                        <h3 className={`${titleConfig.style} leading-none min-w-0 truncate`}>
                            {titleConfig.text || (isMobile ? 'Diario' : 'Diario di Viaggio')}
                        </h3>
                        <DiaryHeaderSaveBadge
                            documentId={itinerary.id}
                            phase={savePhase}
                            lastSavedAt={lastSavedAt}
                            lastError={lastSaveError}
                            isGuest={isGuest}
                            isMobile={isMobile}
                        />
                    </div>

                    <DiaryHeaderToolbar 
                        onOpenPackingList={onOpenPackingList}
                        onOpenRoadbook={onOpenRoadbook}
                        onOpenAiPlanner={onOpenAiPlanner}
                        onPublish={onPublish}
                        canPublish={canPublish}
                        isGuest={isGuest}
                        shouldFlashSuitcase={shouldFlashSuitcase}
                        shouldFlashRoadbook={shouldFlashRoadbook}
                        itineraryItemsLength={itinerary.items.length}
                        openModal={openModal}
                    />
                </div>

                <DiaryHeaderProjectInput 
                    itinerary={itinerary}
                    onSetName={onSetName}
                    loadMenuOpen={loadMenuOpen}
                    handleLoadMenuOpen={handleLoadMenuOpen}
                    loadMenuRef={loadMenuRef}
                    isSyncing={isSyncing}
                    savedProjects={savedProjects}
                    onLoadProject={handleLoadProjectIntercept}
                    handleDeleteClick={handleDeleteClick}
                    isGuest={isGuest}
                    openModal={openModal}
                    onSave={handleSave}
                    onSaveAs={handleSaveAs}
                    onAutosaveToggle={onAutosaveToggle}
                    savePhase={savePhase}
                    autosaveEnabled={autosaveEnabled}
                    canUseAutosave={canUseAutosave}
                    handleExportClick={handleExportClick}
                    shareMenuOpen={shareMenuOpen}
                    setShareMenuOpen={setShareMenuOpen}
                    shareMenuRef={shareMenuRef}
                    onClear={onClear}
                    popoverBoundaryRef={popoverBoundaryRef}
                />

                <DiaryHeaderDateRange 
                    itinerary={itinerary}
                    displayStartDate={displayStartDate}
                    setDisplayStartDate={setDisplayStartDate}
                    handleDateBlur={handleDateBlur}
                    isStartCalendarOpen={isStartCalendarOpen}
                    setIsStartCalendarOpen={setIsStartCalendarOpen}
                    setIsEndCalendarOpen={setIsEndCalendarOpen}
                    minDateStr={minDateStr}
                    handleLocalDateChange={handleLocalDateChange}
                    setDateToClear={setDateToClear}
                    highlightDates={highlightDates}
                    displayEndDate={displayEndDate}
                    setDisplayEndDate={setDisplayEndDate}
                    isEndCalendarOpen={isEndCalendarOpen}
                    endMinDateStr={endMinDateStr}
                />
                
                {days.length > 0 && (
                    <DiaryHeaderTabs 
                        days={days}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        scrollTabs={scrollTabs}
                        tabsContainerRef={tabsContainerRef}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                )}
            </div>
        </div>
    );
};



