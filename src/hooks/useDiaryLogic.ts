
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useItinerary } from '../context/ItineraryContext';
import { publishUserItinerary } from '../services/dataService';
import { User, ItineraryItem } from '../types/index';

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

    // Modals State
    const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean, type: 'startDate' | 'endDate', value: string, lostCount: number } | null>(null);
    
    // MEMO STATE
    const [memoTargetItem, setMemoTargetItem] = useState<ItineraryItem | null>(null);
    
    // Feedback State
    const [toastMessage, setToastMessage] = useState<{title: string, xp: number} | null>(null);

    // --- EFFECTS ---

    useEffect(() => {
        const checkMobile = () => {
             setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset tab when dates change
    useEffect(() => { setActiveTab('all'); }, [itinerary.startDate, itinerary.endDate]);

    // --- HANDLERS ---
    
    // Wrapper per Save Project per mostrare il modale di successo
    const handleSaveProject = useCallback(async (nameOverride?: string, isSaveAs?: boolean) => {
        try {
            const success = await saveProject(nameOverride, undefined, isSaveAs);
            if (success) {
                setToastMessage({ title: "Salvataggio completato!", xp: 0 });
            }
            return success;
        } catch (e: any) {
            console.error("Save error:", e);
            setToastMessage({ title: "Errore durante il salvataggio in cloud!", xp: 0 });
            // Timeout per far scomparire il messaggio di errore
            setTimeout(() => setToastMessage(null), 4000);
            return false;
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

    const handleAddNote = useCallback((dayIndex: number) => {
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
        setItinerary(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setHighlightedItemId(id);
    }, [setItinerary, setHighlightedItemId]);

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
        let data = e.dataTransfer.getData('application/json');
        if(!data) data = e.dataTransfer.getData('text/plain');
        onDayDropProp(idx, data, time); 
        setIsDraggingOver(false); 
        dragCounter.current = 0;
    }, [onDayDropProp]);

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
            isDraggingOver,
            memoTargetItem
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
            setMemoTargetItem
        },

        // Logic Actions
        actions: {
            removeItem,
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
            handleDayDrop
        }
    };
};
