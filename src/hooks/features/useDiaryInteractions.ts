
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext';
import { PointOfInterest, ItineraryItem } from '../../types/index';

export const useDiaryInteractions = (
    activeCityId: string | null,
    setMobileDiaryFullScreen: (v: boolean) => void
) => {
    const { itinerary, setItinerary, setHighlightedItemId, addItem, removeItem, findFreeSlot, setHighlightDates } = useItinerary();
    const { openModal, closeModal } = useModal();

    // 1. ADD ITEM LOGIC (Button Click)
    const confirmAddToItinerary = (pendingPoi: PointOfInterest, dayIndex: number, timeSlotStr: string) => {
        if (!pendingPoi) return;
        
        // Check Duplicate
        const existingItem = itinerary.items.find(i => i.poi.id === pendingPoi.id);
        if (existingItem) { 
            openModal('duplicate', { duplicate: { poi: pendingPoi, dayIndex, timeSlotStr, existingItem } }); 
            return; 
        }
        
        // AUTO-CLASSIFICAZIONE RISORSA (Diary 2.0)
        // Se è una guida, un operatore o un servizio, lo marchiamo come risorsa (footer) invece che tappa (timeline)
        const isResource = 
            pendingPoi.resourceType === 'guide' || 
            pendingPoi.resourceType === 'operator' || 
            pendingPoi.resourceType === 'service' ||
            // Fallback su categorie legacy/manuali
            (pendingPoi.category === 'leisure' && pendingPoi.subCategory === 'agency');

        // Create Item
        const targetCityId = pendingPoi.cityId || activeCityId || 'unknown';
        const newItem: ItineraryItem = { 
            id: Date.now().toString(), 
            poi: pendingPoi, 
            cityId: targetCityId, 
            dayIndex, 
            timeSlotStr, 
            completed: false,
            isResource: isResource // Auto-flag
        };
        
        // Check Conflict (Solo se NON è una risorsa, le risorse non hanno conflitti orari)
        const conflict = !isResource 
            ? itinerary.items.find(i => !i.isResource && i.dayIndex === dayIndex && i.timeSlotStr === timeSlotStr)
            : undefined;

        if (conflict) { 
            openModal('conflict', { conflict: { item: newItem, targetDayIndex: dayIndex, targetTime: timeSlotStr, conflictingItem: conflict } }); 
        } else { 
            addItem(newItem); 
            closeModal(); 
            if (window.innerWidth < 768) setMobileDiaryFullScreen(true); 
        }
    };

    // 2. MOVE / EDIT REQUEST (Internal Logic)
    const handleItemMoveOrEditRequest = (item: ItineraryItem, targetDayIndex: number, targetTime: string, forceSwap: boolean = false) => {
        // No change check
        if (item.dayIndex === targetDayIndex && item.timeSlotStr === targetTime) return;
        
        // Resources don't conflict
        if (item.isResource) {
             setItinerary(prev => ({ ...prev, items: prev.items.map(i => i.id === item.id ? { ...i, dayIndex: targetDayIndex } : i) }));
             return;
        }

        const conflict = itinerary.items.find(i => !i.isResource && i.id !== item.id && i.dayIndex === targetDayIndex && i.timeSlotStr === targetTime);
        
        if (conflict) {
            if (forceSwap) {
                // Swap Logic
                setItinerary(prev => ({ 
                    ...prev, 
                    items: prev.items.map(i => 
                        i.id === item.id ? { ...i, dayIndex: targetDayIndex, timeSlotStr: targetTime } : 
                        i.id === conflict.id ? { ...i, dayIndex: item.dayIndex, timeSlotStr: item.timeSlotStr } : i
                    )
                }));
            } else {
                openModal('conflict', { conflict: { item, targetDayIndex, targetTime, conflictingItem: conflict } });
            }
        } else { 
            // Clean Move
            setItinerary(prev => ({ ...prev, items: prev.items.map(i => i.id === item.id ? { ...i, dayIndex: targetDayIndex, timeSlotStr: targetTime } : i) })); 
            setHighlightedItemId(item.id); 
        }
    };

    // 3. SMART DROP HANDLER
    const handleSmartDrop = (dayIndex: number, dataStr: string, targetTime?: string) => {
        try {
            const data = JSON.parse(dataStr);
            
            // CASE A: Moving Existing Item
            if (data.type === 'MOVE_ITEM') {
                const item = itinerary.items.find(i => i.id === data.id);
                if(item) handleItemMoveOrEditRequest(item, dayIndex, targetTime || item.timeSlotStr, data.forceSwap);
                return;
            }
            
            // CASE B: Dropping New POI
            const poi = data as PointOfInterest;
            
            // FIX ROOT CAUSE: Se non ci sono date, apri il modale di configurazione invece di bloccare
            if (!itinerary.startDate || !itinerary.endDate) {
                openModal('add', { poi });
                return;
            }
            
            const timeSlotStr = targetTime || findFreeSlot(dayIndex); 
            
            if (timeSlotStr) {
                // Reuse existing add logic
                confirmAddToItinerary(poi, dayIndex, timeSlotStr);
            } else { 
                // No free slot found automatically -> Open Manual Modal
                openModal('add', { poi }); 
            }
        } catch (e) { 
            console.error("Drop error", e); 
        }
    };

    // 4. RESOLVE CONFLICT (From Modal)
    const resolveConflict = (item: ItineraryItem, dayIdx: number, conflictingItem: ItineraryItem, action: 'changeTime' | 'swap', newTime?: string) => {
        if (action === 'swap') {
            const itemExists = itinerary.items.some(i => i.id === item.id);
            if (itemExists) {
                setItinerary(prev => ({ 
                    ...prev, 
                    items: prev.items.map(i => 
                        i.id === item.id ? { ...i, dayIndex: dayIdx, timeSlotStr: conflictingItem.timeSlotStr } : 
                        i.id === conflictingItem.id ? { ...i, dayIndex: item.dayIndex, timeSlotStr: item.timeSlotStr } : i
                    )
                }));
            } else {
                alert("Impossibile scambiare con un elemento non ancora in lista. Usa 'Cambia Orario'.");
            }
        } else if (action === 'changeTime' && newTime) {
            const itemExists = itinerary.items.some(i => i.id === item.id);
            
            if (itemExists) {
                setItinerary(prev => ({ 
                    ...prev, 
                    items: prev.items.map(i => i.id === item.id ? { ...i, dayIndex: dayIdx, timeSlotStr: newTime } : i) 
                }));
            } else {
                const itemToAdd = { ...item, timeSlotStr: newTime };
                addItem(itemToAdd);
            }
        }
        closeModal();
    };

    // 5. RESOLVE DUPLICATE (From Modal)
    const resolveDuplicate = (poi: PointOfInterest, dayIdx: number, timeSlot: string, existingItem: ItineraryItem, action: 'add' | 'replace') => {
        // Ricalcola isResource anche qui per sicurezza
        const isResource = 
            poi.resourceType === 'guide' || 
            poi.resourceType === 'operator' || 
            poi.resourceType === 'service';

        if (action === 'replace') {
            removeItem(existingItem.id);
            const targetCityId = poi.cityId || activeCityId || 'unknown';
            const newItem: ItineraryItem = {
                id: Date.now().toString(),
                poi: poi,
                cityId: targetCityId,
                dayIndex: dayIdx,
                timeSlotStr: timeSlot,
                completed: false,
                isResource
            };
            addItem(newItem);
        } else {
            const targetCityId = poi.cityId || activeCityId || 'unknown';
            const newItem: ItineraryItem = {
                id: `${Date.now()}_dup`,
                poi: poi,
                cityId: targetCityId,
                dayIndex: dayIdx,
                timeSlotStr: timeSlot,
                completed: false,
                isResource
            };
            addItem(newItem);
        }
        closeModal();
    };

    return {
        confirmAddToItinerary,
        handleSmartDrop,
        handleItemMoveOrEditRequest,
        resolveConflict,
        resolveDuplicate
    };
};
