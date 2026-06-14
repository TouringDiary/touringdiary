
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useItinerary } from '@/context/ItineraryContext';
import { publishUserItinerary } from '../services/dataService';
import { User, ItineraryItem } from '../types/index';
import { useUndoStack, UndoAction } from './useUndoStack';
import { useDiaryUndo } from './useDiaryUndo';

interface UseDiaryLogicProps {
    user: User;
    onUserUpdate?: (user: User) => void;
    onDayDropProp: (dayIndex: number, data: string, targetTime?: string) => void;
}

export const useDiaryLogic = ({ user, onUserUpdate, onDayDropProp }: UseDiaryLogicProps) => {
    // Context Access
    const { 
        itinerary, setItinerary, removeItem, highlightDates, setHighlightDates, 
        highlightedItemId, setHighlightedItemId, updateDayStyle, saveProject, savedProjects, loadProject, clearItinerary, addItem, deleteProject 
    } = useItinerary();

    // --- LOCAL STATE ---
    const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
    const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);
    const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | number>('all');
    const [isMobile, setIsMobile] = useState(false);
    
    // Drag & Drop State
    const [itemToMove, setItemToMove] = useState<ItineraryItem | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);
    const pendingMoveActionRef = useRef<{ id: string, previousItems: ItineraryItem[] } | null>(null);

    // Modals State
    const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean, type: 'startDate' | 'endDate', value: string, lostCount: number } | null>(null);
    
    // MEMO STATE
    const [memoTargetItem, setMemoTargetItem] = useState<ItineraryItem | null>(null);
    
    // Feedback State
    const [toastMessage, setToastMessage] = useState<{title: string, xp: number} | null>(null);
    const [diaryToast, setDiaryToast] = useState<{ message: string; visible: boolean }>({
        message: "",
        visible: false
    });
    const diaryToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showDiaryToast = useCallback((message: string) => {
        if (diaryToastTimeoutRef.current) clearTimeout(diaryToastTimeoutRef.current);
        setDiaryToast({ message, visible: true });
        diaryToastTimeoutRef.current = setTimeout(() => {
            setDiaryToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // --- UNDO/REDO STACK ---
    const { pushAction, undo, redo, canUndo, canRedo, beginExecution, endExecution, isExecuting } = useUndoStack<any>(50);
    const { performUndo, performRedo } = useDiaryUndo({
        undo,
        redo,
        setItinerary,
        addItem,
        removeItem,
        showToast: showDiaryToast,
        isExecuting,
        beginExecution,
        endExecution
    });

    // --- EFFECTS ---

    useEffect(() => {
        const checkMobile = () => {
             setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Cleanup toast timeout on unmount
    useEffect(() => {
        return () => {
            if (diaryToastTimeoutRef.current) {
                clearTimeout(diaryToastTimeoutRef.current);
            }
        };
    }, []);

    // Reset tab when dates change
    useEffect(() => { setActiveTab('all'); }, [itinerary.startDate, itinerary.endDate]);

    // Capture Move Action Result
    useEffect(() => {
        if (pendingMoveActionRef.current) {
            const { id, previousItems } = pendingMoveActionRef.current;
            pushAction({
                id,
                type: 'move',
                payload: {
                    previousItems,
                    newItems: [...itinerary.items]
                },
                label: 'Spostamento'
            });
            pendingMoveActionRef.current = null;
        }
    }, [itinerary.items, pushAction]);

    // --- HANDLERS ---
    
    // Wrapper per Save Project per mostrare il modale di successo
    const handleSaveProject = useCallback(async (nameOverride?: string, isSaveAs?: boolean): Promise<string | null> => {
        try {
            const savedId = await saveProject(nameOverride, isSaveAs);
            if (savedId) {
                setToastMessage({ title: "Salvataggio completato!", xp: 0 });
            }
            return savedId;
        } catch (e: any) {
            console.error("Save error:", e);
            setToastMessage({ title: "Errore durante il salvataggio in cloud!", xp: 0 });
            // Timeout per far scomparire il messaggio di errore
            setTimeout(() => setToastMessage(null), 4000);
            return null;
        }
    }, [saveProject]);

    const handleDateChange = useCallback((type: 'startDate' | 'endDate', newValue: string) => {
        const currentStart = itinerary.startDate;
        const currentEnd = itinerary.endDate;
        
        if (!currentStart || !currentEnd) {
            setItinerary(prev => ({ ...prev, [type]: newValue }));
            return;
        }
        
        let newStart = type === 'startDate' ? newValue : currentStart;
        let newEnd = type === 'endDate' ? newValue : currentEnd;
        const dStart = new Date(newStart);
        const dEnd = new Date(newEnd);
        
        if (dStart > dEnd) return; 

        const msPerDay = 1000 * 60 * 60 * 24;
        const newDayCount = Math.ceil((dEnd.getTime() - dStart.getTime()) / msPerDay) + 1;
        
        const lostItems = itinerary.items.filter(i => i.dayIndex >= newDayCount);
        
        if (lostItems.length > 0) {
            const lostDaysSet = new Set(lostItems.map(i => i.dayIndex));
            setWarningModal({ isOpen: true, type, value: newValue, lostCount: lostDaysSet.size });
        } else {
            setItinerary(prev => ({ ...prev, [type]: newValue }));
        }
    }, [itinerary.startDate, itinerary.endDate, itinerary.items, setItinerary]);

    const confirmDateChange = useCallback(() => {
        if (!warningModal) return;
        
        const { type, value } = warningModal;
        
        setItinerary(prev => {
            const currentStart = type === 'startDate' ? value : prev.startDate;
            const currentEnd = type === 'endDate' ? value : prev.endDate;
            
            if (!currentStart || !currentEnd) return { ...prev, [type]: value };

            const dStart = new Date(currentStart);
            const dEnd = new Date(currentEnd);
            const msPerDay = 1000 * 60 * 60 * 24;
            const newDayCount = Math.ceil((dEnd.getTime() - dStart.getTime()) / msPerDay) + 1;

            const cleanItems = prev.items.filter(i => i.dayIndex < newDayCount);
            
            return {
                ...prev,
                [type]: value,
                items: cleanItems
            };
        });
        
        setWarningModal(null);
    }, [warningModal, setItinerary]);

    const handleAddNote = useCallback((dayIndex: number, skipUndo = false) => {
        const id = `note-${Date.now()}`;
        const newItem: ItineraryItem = {
            id, 
            cityId: 'custom', 
            dayIndex, 
            timeSlotStr: '', 
            isCustom: true, 
            customIcon: 'note',
            poi: { 
                id: `custom-${Date.now()}`, 
                name: 'Nuova Nota', 
                category: 'discovery', 
                description: '', 
                imageUrl: '', 
                rating: 0, 
                votes: 0, 
                coords: { lat: 0, lng: 0 }, 
                address: '' 
            }
        };

        if (!skipUndo) {
            pushAction({
                id,
                type: 'add',
                payload: newItem,
                label: 'Nuova Nota'
            });
        }

        setItinerary(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setHighlightedItemId(id);
    }, [setItinerary, setHighlightedItemId, pushAction]);

    const handleRemoveItem = useCallback((id: string, skipUndo = false) => {
        const itemToRemove = itinerary.items.find(i => i.id === id);
        if (itemToRemove && !skipUndo) {
            pushAction({
                id,
                type: 'delete',
                payload: itemToRemove,
                label: itemToRemove.poi?.name || 'Tappa'
            });
        }
        removeItem(id);
    }, [itinerary.items, removeItem, pushAction]);

    const handleTimeChange = useCallback((id: string, time: string, dayIdx: number) => {
        const item = itinerary.items.find(i => i.id === id);
        if (item && item.timeSlotStr !== time) {
            pushAction({
                id,
                type: 'update',
                payload: {
                    field: 'timeSlotStr',
                    newValue: time,
                    previousValue: item.timeSlotStr
                },
                label: 'Orario'
            });
        }
        setItinerary(prev => ({ 
            ...prev, 
            items: prev.items.map(i => i.id === id ? { ...i, timeSlotStr: time } : i) 
        })); 
        setHighlightedItemId(id);
    }, [itinerary.items, setItinerary, setHighlightedItemId, pushAction]);

    const handleIconSelect = useCallback((id: string, icon: string) => {
        const item = itinerary.items.find(i => i.id === id);
        if (item && item.customIcon !== icon) {
            pushAction({
                id,
                type: 'update',
                payload: {
                    field: 'customIcon',
                    newValue: icon,
                    previousValue: item.customIcon || 'note'
                },
                label: 'Icona'
            });
        }
        setItinerary(prev => ({
            ...prev, 
            items: prev.items.map(i => i.id === id ? { ...i, customIcon: icon } : i)
        })); 
        setIconPickerOpen(null);
    }, [itinerary.items, setItinerary, pushAction]);

    const handleNoteChange = useCallback((id: string, text: string) => {
        const item = itinerary.items.find(i => i.id === id);
        // Usiamo un piccolo debounce o controllo per evitare troppi push durante la digitazione?
        // Il requisito dice "modifica testo nota", tipicamente si pusha al blur o dopo pausa.
        // Ma qui il sistema Suitcase sembra pushare direttamente o tramite merge.
        //useUndoStack ha il merge logic.
        
        if (item && item.poi.description !== text) {
            pushAction({
                id,
                type: 'update',
                payload: {
                    field: 'poi.description',
                    newValue: text,
                    previousValue: item.poi.description
                },
                label: 'Nota',
                merge: true, // Permette di unire modifiche consecutive alla stessa nota
                groupId: `note-${id}`
            });
        }

        setItinerary(prev => ({
            ...prev, 
            items: prev.items.map(i => i.id === id ? { ...i, poi: { ...i.poi, description: text } } : i)
        }));
    }, [itinerary.items, setItinerary, pushAction]);

    const handlePublish = async () => {
        if (user.role === 'guest' || !itinerary.items.length || !itinerary.name) {
            console.warn("Accedi e dai un nome al viaggio per pubblicare.");
            return;
        }
        const result = await publishUserItinerary(itinerary, user);
        if (result.success && result.updatedUser) {
            if (onUserUpdate) onUserUpdate(result.updatedUser);
            setToastMessage({ title: 'Itinerario Pubblicato!', xp: 100 });
            // Qui lasciamo il timeout perché è un feedback rapido XP
            setTimeout(() => setToastMessage(null), 4000);
        }
    };
    
    // MEMO LOGIC START
    
    const handleOpenMemoConfig = useCallback((resourceItem: ItineraryItem) => {
        setMemoTargetItem(resourceItem);
    }, []);

    const handleConfirmAddMemo = useCallback((dayIndex: number, timeSlotStr: string) => {
        if (!memoTargetItem) return;
        
        const newMemo: ItineraryItem = {
            id: `memo-${Date.now()}`,
            cityId: memoTargetItem.cityId,
            dayIndex,
            timeSlotStr,
            poi: memoTargetItem.poi, 
            type: 'memo',
            linkedResourceId: memoTargetItem.id, 
            isResource: false 
        };
        
        addItem(newMemo);
        setMemoTargetItem(null);
        setToastMessage({ title: 'Memo aggiunto al diario!', xp: 0 });
        setTimeout(() => setToastMessage(null), 2000);
    }, [memoTargetItem, addItem]);
    
    const handleMemoClick = useCallback((linkedId: string) => {
        const el = document.getElementById(`resource-${linkedId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedItemId(linkedId);
            setTimeout(() => setHighlightedItemId(null), 2000); 
        }
    }, [setHighlightedItemId]);

    // MEMO LOGIC END

    // --- DRAG HANDLERS ---

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        if (e.dataTransfer.types.includes('application/json') || e.dataTransfer.types.includes('text/plain')) {
            if (dragCounter.current === 1) setIsDraggingOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Recupera i dati del POI trascinato
        const data = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        
        if (data) {
            // Se rilasciato nel contenitore generale (background), default al Giorno 0 (Primo Giorno)
            onDayDropProp(0, data);
        }

        dragCounter.current = 0;
        setIsDraggingOver(false);
    }, [onDayDropProp]);

    const handleContainerDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); 
        let data = e.dataTransfer.getData('application/json'); 
        if (!data) data = e.dataTransfer.getData('text/plain');
        if(data) onDayDropProp(0, data); 
        dragCounter.current = 0;
        setIsDraggingOver(false);
    }, [onDayDropProp]);

    const handleDayDrop = useCallback((e: React.DragEvent, idx: number, time?: string) => {
        let dataStr = e.dataTransfer.getData('application/json');
        if(!dataStr) dataStr = e.dataTransfer.getData('text/plain');
        
        // Se è un movimento interno, registriamo per undo
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'MOVE_ITEM' && data.id) {
                pendingMoveActionRef.current = {
                    id: data.id,
                    previousItems: [...itinerary.items]
                };
            }
        } catch (e) {}

        onDayDropProp(idx, dataStr, time); 
        setIsDraggingOver(false); 
        dragCounter.current = 0;
        
        // Aggiorniamo l'azione di move con il nuovo stato dopo il drop
        // Nota: onDayDropProp è asincrono o causa re-render. 
        // È meglio catturare lo stato in useDiaryUndo confrontando gli array.
    }, [onDayDropProp, itinerary.items]);

    return {
        // Data State from Context
        itinerary,
        savedProjects,
        highlightDates,
        highlightedItemId,
        
        // Local State
        state: {
            editingTimeId,
            colorPickerOpen,
            iconPickerOpen,
            activeTab,
            isMobile,
            itemToMove,
            saveAsModalOpen,
            clearModalOpen,
            warningModal,
            toastMessage,
            diaryToast,
            isDraggingOver,
            memoTargetItem,
            canUndo,
            canRedo
        },

        // Setters
        setters: {
            setItinerary,
            setEditingTimeId,
            setColorPickerOpen,
            setIconPickerOpen,
            setActiveTab,
            setItemToMove,
            setSaveAsModalOpen,
            setClearModalOpen,
            setWarningModal,
            setHighlightedItemId,
            setToastMessage,
            setMemoTargetItem,
            performUndo,
            performRedo
        },

        // Logic Actions
        actions: {
            removeItem: handleRemoveItem,
            updateDayStyle,
            saveProject: handleSaveProject, // WRAPPED!
            loadProject,
            deleteProject, 
            clearItinerary,
            handleDateChange,
            confirmDateChange, 
            handleAddNote,
            handlePublish,
            handleOpenMemoConfig, 
            handleConfirmAddMemo, 
            handleMemoClick, 
            toggleItemType: handleOpenMemoConfig, 
            handleDragEnter,
            handleDragLeave,
            handleDrop,
            handleContainerDrop,
            handleDayDrop,
            onTimeChange: handleTimeChange,
            onIconSelect: handleIconSelect,
            onNoteChange: handleNoteChange
        }
    };
};
