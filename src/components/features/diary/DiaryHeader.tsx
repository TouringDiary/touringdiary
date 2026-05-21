import { Z_DROPDOWN } from '@/constants/zIndex';
import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
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

interface DiaryHeaderProps {
    itinerary: Itinerary;
    user: User;
    savedProjects: Itinerary[];
    highlightDates: boolean;
    activeTab: 'all' | number;
    days: Date[];
    minDateStr: string;
    onSetName: (name: string) => void;
    onDateChange: (type: 'startDate' | 'endDate', val: string) => void;
    onLoadProject: (p: Itinerary) => void;
    onSaveAction: () => void;
    onSaveAs: () => void;
    onPrint: () => void;
    onClear: () => void;
    onPublish: () => void;
    onOpenAiPlanner?: () => void;
    onOpenRoadbook?: () => void;
    onOpenPackingList?: () => void;
    setActiveTab: (tab: 'all' | number) => void;
    onDeleteProject: (id: string) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
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

export const DiaryHeader: React.FC<DiaryHeaderProps> = ({
    itinerary, user, savedProjects, highlightDates, activeTab, days, minDateStr,
    onSetName, onDateChange, onLoadProject, onSaveAction, onSaveAs, onPrint, onClear, onPublish, onOpenAiPlanner, onOpenRoadbook, onOpenPackingList, setActiveTab, onDeleteProject,
    onUndo, onRedo, canUndo, canRedo
}) => {
    const { refreshItineraryData, syncCloudDrafts } = useItinerary(); 
    const { openModal } = useModal(); 
    
    const [saveMenuOpen, setSaveMenuOpen] = useState(false);
    const [loadMenuOpen, setLoadMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
    const prevItemsLength = useRef(itinerary.items.length);
    
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const titleConfig = useDynamicContent('diary_title', isMobile);
    
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const saveMenuRef = useRef<HTMLDivElement>(null);
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

    const isDirty = () => {
        const original = savedProjects.find(p => p.id === itinerary.id);
        if (!original) {
            return Boolean(
                itinerary.name ||
                itinerary.startDate ||
                itinerary.endDate ||
                itinerary.items.length > 0
            );
        }
        
        if (itinerary.name !== original.name) return true;
        if (itinerary.startDate !== original.startDate) return true;
        if (itinerary.endDate !== original.endDate) return true;
        if (itinerary.items.length !== original.items.length) return true;
        
        for (let i = 0; i < itinerary.items.length; i++) {
            const item = itinerary.items[i];
            const origItem = original.items[i];
            if (!origItem) return true;
            if (item.id !== origItem.id) return true;
            if (item.notes !== origItem.notes) return true;
            if (item.timeSlotStr !== origItem.timeSlotStr) return true;
            if (item.customIcon !== origItem.customIcon) return true;
        }
        return false;
    };

    const handleLoadProjectIntercept = (p: Itinerary) => {
        if (isDirty()) {
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) setSaveMenuOpen(false);
            if (loadMenuRef.current && !loadMenuRef.current.contains(event.target as Node)) setLoadMenuOpen(false);
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) setShareMenuOpen(false);
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsContainerRef.current) tabsContainerRef.current.scrollBy({ left: direction === 'left' ? -100 : 100, behavior: 'smooth' });
    };
    
    const handleRefreshData = async () => {
        setIsRefreshing(true);
        await refreshItineraryData();
        setTimeout(() => setIsRefreshing(false), 800);
        setLoadMenuOpen(false);
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
        onSaveAction();
        setSaveMenuOpen(false);
    };

    const handleSaveAs = () => {
        if (isGuest) {
            openModal('auth');
            return;
        }
        onSaveAs();
        setSaveMenuOpen(false);
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
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Pencil className="w-[16.5px] h-[16.5px] text-amber-500" />
                        <h3 className={`${titleConfig.style} leading-none whitespace-nowrap`}>
                            {titleConfig.text || (isMobile ? 'Diario' : 'Diario di Viaggio')}
                        </h3>
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
                    handleRefreshData={handleRefreshData}
                    isRefreshing={isRefreshing}
                    isSyncing={isSyncing}
                    savedProjects={savedProjects}
                    onLoadProject={handleLoadProjectIntercept}
                    handleDeleteClick={handleDeleteClick}
                    saveMenuOpen={saveMenuOpen}
                    setSaveMenuOpen={setSaveMenuOpen}
                    saveMenuRef={saveMenuRef}
                    isGuest={isGuest}
                    openModal={openModal}
                    handleSave={handleSave}
                    handleSaveAs={handleSaveAs}
                    handleExportClick={handleExportClick}
                    shareMenuOpen={shareMenuOpen}
                    setShareMenuOpen={setShareMenuOpen}
                    shareMenuRef={shareMenuRef}
                    onClear={onClear}
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



