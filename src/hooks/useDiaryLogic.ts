
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useItinerary } from '@/context/ItineraryContext';
import { publishUserItinerary, isDiaryPublishedToCommunity } from '../services/dataService';
import { User, ItineraryItem, Itinerary } from '../types/index';
import type { DiaryNotesState } from '../types/models/DiaryNotes';
import { useUndoStack } from './useUndoStack';
import { useDiaryUndo } from './useDiaryUndo';
import { useDiaryDocumentSave } from './save/useDiaryDocumentSave';
import { GUEST_SAVE_MESSAGE } from '@/domain/save/documentSaveTypes';
import type { SaveUserDraftViaggioOptions } from '@/types/resourceAssociation';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { LAYOUT } from '@/constants/layout';
import type { DiaryActiveTab } from '@/domain/diary/diaryActiveTab';
import { isDiaryPersisted } from '@/utils/suitcaseAssociation';
import { useCollaborationLive, useCollaborationReadOnly } from '@/context/CollaborationLiveContext';
import { stampItineraryItemAuthor } from '@/domain/diary/diaryAuthorTracking';
import { getDiaryNotesUndoGrouping } from '@/domain/diary/diaryNotesState';
import { randomUUID } from '@/utils/runtimeId';

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

    const isGuest = user.role === 'guest';
    const collaborationReadOnly = useCollaborationReadOnly();
    const collaborationLive = useCollaborationLive();

    const guardCollaborativeWrite = useCallback(() => {
        if (collaborationReadOnly) return true;
        collaborationLive.notifyLocalActivity();
        return false;
    }, [collaborationLive, collaborationReadOnly]);

    // --- LOCAL STATE ---
    const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
    const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);
    const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DiaryActiveTab>('all');
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

    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
    
    // Feedback State
    const [toastMessage, setToastMessage] = useState<{title: string, xp: number} | null>(null);
    const [diaryToast, setDiaryToast] = useState<{ message: string; visible: boolean }>({
        message: "",
        visible: false
    });
    const diaryToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const xpToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showDiaryToast = useCallback((message: string) => {
        if (diaryToastTimeoutRef.current) clearTimeout(diaryToastTimeoutRef.current);
        setDiaryToast({ message, visible: true });
        diaryToastTimeoutRef.current = setTimeout(() => {
            setDiaryToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // Toast XP/Memo: stesso pattern gestito (ref + cleanup) del DiaryToast, niente timer orfani.
    const showXpToast = useCallback((payload: { title: string; xp: number }, duration: number) => {
        if (xpToastTimeoutRef.current) clearTimeout(xpToastTimeoutRef.current);
        setToastMessage(payload);
        xpToastTimeoutRef.current = setTimeout(() => setToastMessage(null), duration);
    }, []);

    // --- UNDO/REDO STACK ---
    const { pushAction, undo, redo, canUndo, canRedo, beginExecution, endExecution, isExecuting, resetStack } = useUndoStack<any>(50);
    const { performUndo: diaryPerformUndo, performRedo: diaryPerformRedo } = useDiaryUndo({
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

    const performUndo = useCallback(async () => {
        if (guardCollaborativeWrite()) return false;
        return diaryPerformUndo();
    }, [diaryPerformUndo, guardCollaborativeWrite]);

    const performRedo = useCallback(async () => {
        if (guardCollaborativeWrite()) return false;
        return diaryPerformRedo();
    }, [diaryPerformRedo, guardCollaborativeWrite]);

    const documentSave = useDiaryDocumentSave({
        itinerary,
        savedProjects,
        isGuest,
        userId: user?.id ?? null,
        saveProject,
        onSaveAsNavigate: () => {
            resetStack();
        },
    });

    // --- EFFECTS ---

    useEffect(() => {
        const checkMobile = () => {
             setIsMobile(window.innerWidth < LAYOUT.BREAKPOINTS.MD);
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
            if (xpToastTimeoutRef.current) {
                clearTimeout(xpToastTimeoutRef.current);
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
    const handleSaveProject = useCallback(async (
        nameOverride?: string,
        isSaveAs?: boolean,
        viaggioOptions?: SaveUserDraftViaggioOptions,
    ): Promise<string | null> => {
        try {
            if (isGuest) return null;
            if (isSaveAs && nameOverride) {
                if (viaggioOptions !== undefined) {
                    const id = await saveProject(nameOverride, true, viaggioOptions);
                    if (id) resetStack();
                    return id;
                }
                return await documentSave.saveAs(nameOverride);
            }
            if (documentSave.needsNameForSave() && !nameOverride) {
                return null;
            }
            return await documentSave.save({ name: nameOverride });
        } catch (e: unknown) {
            console.error('Save error:', e);
            return null;
        }
    }, [documentSave, isGuest, saveProject, resetStack]);

    const handleDateChange = useCallback((type: 'startDate' | 'endDate', newValue: string) => {
        if (guardCollaborativeWrite()) return;
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
    }, [itinerary.startDate, itinerary.endDate, itinerary.items, setItinerary, guardCollaborativeWrite]);

    const confirmDateChange = useCallback(() => {
        if (guardCollaborativeWrite()) return;
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
    }, [warningModal, setItinerary, guardCollaborativeWrite]);

    const handleAddNote = useCallback((dayIndex: number, skipUndo = false) => {
        if (guardCollaborativeWrite()) return;
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
    }, [setItinerary, setHighlightedItemId, pushAction, guardCollaborativeWrite]);

    const handleRemoveItem = useCallback((id: string, skipUndo = false) => {
        if (guardCollaborativeWrite()) return;
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
    }, [itinerary.items, removeItem, pushAction, guardCollaborativeWrite]);

    const handleTimeChange = useCallback((id: string, time: string, dayIdx: number) => {
        if (guardCollaborativeWrite()) return;
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
    }, [itinerary.items, setItinerary, setHighlightedItemId, pushAction, guardCollaborativeWrite]);

    const handleIconSelect = useCallback((id: string, icon: string) => {
        if (guardCollaborativeWrite()) return;
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
    }, [itinerary.items, setItinerary, pushAction, guardCollaborativeWrite]);

    const handleTransportSelect = useCallback((id: string, mode: string) => {
        if (guardCollaborativeWrite()) return;
        const newValue = mode || undefined;
        const item = itinerary.items.find(i => i.id === id);
        if (item && item.transportMode !== newValue) {
            pushAction({
                id,
                type: 'update',
                payload: {
                    field: 'transportMode',
                    newValue,
                    previousValue: item.transportMode
                },
                label: 'Mezzo di trasporto'
            });
        }
        setItinerary(prev => ({
            ...prev,
            items: prev.items.map(i => i.id === id ? { ...i, transportMode: newValue } : i)
        }));
    }, [itinerary.items, setItinerary, pushAction, guardCollaborativeWrite]);

    const handleNoteChange = useCallback((id: string, text: string) => {
        if (guardCollaborativeWrite()) return;
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
    }, [itinerary.items, setItinerary, pushAction, guardCollaborativeWrite]);

    const handleDiaryNotesChange = useCallback((notesState: DiaryNotesState) => {
        if (guardCollaborativeWrite()) return;

        const previousValue = itinerary.diaryNotes ?? null;
        if (snapshotsEqual(previousValue, notesState)) return;

        const { merge, groupId } = getDiaryNotesUndoGrouping(previousValue, notesState);

        // Per editing con merge, pushAction conserva il previousValue della prima azione
        // del gruppo: digitazione rapida resta corretta anche se itinerary non è ancora
        // ridisegnato tra un onUpdate e il successivo.
        pushAction({
            id: merge ? groupId : `diary-notes-${randomUUID()}`,
            type: 'diaryNotes',
            payload: {
                previousValue,
                newValue: notesState,
            },
            label: 'Note di viaggio',
            merge,
            groupId,
        });

        setItinerary((prev) =>
            snapshotsEqual(prev.diaryNotes ?? null, notesState)
                ? prev
                : { ...prev, diaryNotes: notesState },
        );
    }, [itinerary.diaryNotes, setItinerary, pushAction, guardCollaborativeWrite]);

    const guardedUpdateDayStyle = useCallback((dayIndex: number, className: string) => {
        if (guardCollaborativeWrite()) return;
        updateDayStyle(dayIndex, className);
    }, [guardCollaborativeWrite, updateDayStyle]);

    const handleLoadProject = useCallback((project: Itinerary) => {
        loadProject(project);
        resetStack();
    }, [loadProject, resetStack]);

    const handleDeleteProject = useCallback((id: string) => {
        if (guardCollaborativeWrite()) return;
        return deleteProject(id);
    }, [deleteProject, guardCollaborativeWrite]);

    const handleClearItinerary = useCallback(() => {
        if (guardCollaborativeWrite()) return;
        clearItinerary();
        resetStack();
    }, [clearItinerary, resetStack, guardCollaborativeWrite]);

    const handlePublish = async () => {
        if (user.role === 'guest' || !itinerary.items.length || !itinerary.name) {
            console.warn("Accedi e dai un nome al viaggio per pubblicare.");
            return;
        }
        setIsPublishing(true);
        try {
            const result = await publishUserItinerary(itinerary, user);
            if (result.alreadyPublished) {
                setIsAlreadyPublished(true);
                showDiaryToast('Questo diario è già stato pubblicato nella Community.');
                return;
            }
            if (result.success && result.updatedUser) {
                if (onUserUpdate) onUserUpdate(result.updatedUser);
                setIsAlreadyPublished(true);
                setPublishModalOpen(false);
                const xp = result.xpAwarded ?? 0;
                // XP Toast e Diary Toast sono intenzionalmente indipendenti: il primo
                // comunica la ricompensa gamification, il secondo conferma l'esito
                // dell'operazione. Entrambi devono convivere.
                showXpToast({ title: 'Itinerario Pubblicato!', xp }, 4000);
                showDiaryToast('Diario pubblicato correttamente nella Community.');
            }
        } catch (error) {
            console.error('[useDiaryLogic] Errore durante la pubblicazione del diario:', error);
            showDiaryToast('Pubblicazione non riuscita.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRequestPublish = useCallback(() => {
        if (user.role === 'guest') return;
        if (isAlreadyPublished) return;
        if (!isDiaryPersisted(itinerary, savedProjects)) {
            alert('Salva il diario prima di pubblicarlo nella Community.');
            return;
        }
        setPublishModalOpen(true);
    }, [user.role, isAlreadyPublished, itinerary, savedProjects]);

    useEffect(() => {
        if (!itinerary.id || user.role === 'guest') {
            setIsAlreadyPublished(false);
            return;
        }
        let cancelled = false;
        isDiaryPublishedToCommunity(itinerary.id).then((published) => {
            if (!cancelled) setIsAlreadyPublished(published);
        });
        return () => { cancelled = true; };
    }, [itinerary.id, user.role]);
    
    // MEMO LOGIC START
    
    const handleOpenMemoConfig = useCallback((resourceItem: ItineraryItem) => {
        setMemoTargetItem(resourceItem);
    }, []);

    const handleConfirmAddMemo = useCallback((dayIndex: number, timeSlotStr: string) => {
        if (guardCollaborativeWrite()) return;
        if (!memoTargetItem) return;
        
        const newMemo: ItineraryItem = stampItineraryItemAuthor({
            id: `memo-${Date.now()}`,
            cityId: memoTargetItem.cityId,
            dayIndex,
            timeSlotStr,
            poi: memoTargetItem.poi, 
            type: 'memo',
            linkedResourceId: memoTargetItem.id, 
            isResource: false 
        }, user?.role !== 'guest' ? user?.id : undefined);
        
        addItem(newMemo);
        setMemoTargetItem(null);
        showXpToast({ title: 'Memo aggiunto al diario!', xp: 0 }, 2000);
    }, [memoTargetItem, addItem, showXpToast, user?.id, user?.role, guardCollaborativeWrite]);
    
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
        if (guardCollaborativeWrite()) return;
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
    }, [onDayDropProp, guardCollaborativeWrite]);

    const handleContainerDrop = useCallback((e: React.DragEvent) => {
        if (guardCollaborativeWrite()) return;
        e.preventDefault(); 
        let data = e.dataTransfer.getData('application/json'); 
        if (!data) data = e.dataTransfer.getData('text/plain');
        if(data) onDayDropProp(0, data); 
        dragCounter.current = 0;
        setIsDraggingOver(false);
    }, [onDayDropProp, guardCollaborativeWrite]);

    const handleDayDrop = useCallback((e: React.DragEvent, idx: number, time?: string) => {
        if (guardCollaborativeWrite()) return;
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
        } catch {}

        onDayDropProp(idx, dataStr, time); 
        setIsDraggingOver(false); 
        dragCounter.current = 0;
        
        // Aggiorniamo l'azione di move con il nuovo stato dopo il drop
        // Nota: onDayDropProp è asincrono o causa re-render. 
        // È meglio catturare lo stato in useDiaryUndo confrontando gli array.
    }, [onDayDropProp, itinerary.items, guardCollaborativeWrite]);

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
            canUndo: canUndo && documentSave.phase !== 'saving',
            canRedo: canRedo && documentSave.phase !== 'saving',
            documentSave,
            guestSaveMessage: GUEST_SAVE_MESSAGE,
            collaborationReadOnly,
            publishModalOpen,
            isPublishing,
            isAlreadyPublished,
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
            setPublishModalOpen,
            performUndo,
            performRedo
        },

        // Logic Actions
        actions: {
            removeItem: handleRemoveItem,
            updateDayStyle: guardedUpdateDayStyle,
            saveProject: handleSaveProject, // WRAPPED!
            loadProject: handleLoadProject,
            deleteProject: handleDeleteProject,
            clearItinerary: handleClearItinerary,
            handleDateChange,
            confirmDateChange, 
            handleAddNote,
            handlePublish,
            handleRequestPublish,
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
            onTransportSelect: handleTransportSelect,
            onNoteChange: handleNoteChange,
            handleDiaryNotesChange,
        }
    };
};
