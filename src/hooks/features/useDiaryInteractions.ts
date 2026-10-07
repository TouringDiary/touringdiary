import { LAYOUT } from '@/constants/layout';
import {
  pushDiaryAddAction,
  pushDiaryDeleteAction,
  useDiaryUndoBridge,
} from '@/context/DiaryUndoBridgeContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { stampItineraryItemAuthor } from '@/domain/diary/diaryAuthorTracking';
import {
  isDiaryMoveDragPayload,
  parseDiaryDropPointOfInterest,
} from '@/domain/diary/diaryDropPayload';
import { isDiaryResourcePoi } from '@/domain/diary/diaryResource';
import { randomUUID } from '@/utils/runtimeId';
import type { ItineraryItem, PointOfInterest } from '../../types/index';

export const useDiaryInteractions = (
  activeCityId: string | null,
  setMobileDiaryFullScreen: (v: boolean) => void,
) => {
  const { itinerary, setItinerary, setHighlightedItemId, addItem, removeItem, findFreeSlot } =
    useItinerary();
  const { openModal, closeModal } = useModal();
  const { user } = useUser();
  const { pushAction: pushDiaryUndo } = useDiaryUndoBridge();
  const authorId = user?.role !== 'guest' ? user?.id : undefined;

  const stampNewItem = (item: ItineraryItem): ItineraryItem =>
    stampItineraryItemAuthor(item, authorId);

  const commitNewItem = (item: ItineraryItem) => {
    const stamped = stampNewItem(item);
    pushDiaryAddAction(pushDiaryUndo, stamped);
    addItem(stamped);
  };

  /** Add nuovo: solo cityId del POI o città attiva di navigazione. */
  const resolveDiaryItemCityId = (poi: PointOfInterest): string | null => {
    if (poi.cityId) return poi.cityId;
    if (activeCityId) return activeCityId;
    return null;
  };

  /**
   * Duplicate/replace: non far sovrascrivere il contesto dell'item esistente da activeCityId.
   * Priorità: poi.cityId → existingItem.cityId → activeCityId.
   */
  const resolveDuplicateItemCityId = (
    poi: PointOfInterest,
    existingItem: ItineraryItem,
  ): string | null => {
    if (poi.cityId) return poi.cityId;
    if (existingItem.cityId) return existingItem.cityId;
    if (activeCityId) return activeCityId;
    return null;
  };

  // 1. ADD ITEM LOGIC (Button Click)
  /** @returns true se l'item è stato aggiunto; false se apre duplicate/conflict o non fa nulla. */
  const confirmAddToItinerary = (
    pendingPoi: PointOfInterest,
    dayIndex: number,
    timeSlotStr: string,
  ): boolean => {
    // Check Duplicate
    const existingItem = itinerary.items.find((i) => i.poi.id === pendingPoi.id);
    if (existingItem) {
      openModal('duplicate', {
        duplicate: { poi: pendingPoi, dayIndex, timeSlotStr, existingItem },
      });
      return false;
    }

    const targetCityId = resolveDiaryItemCityId(pendingPoi);
    if (!targetCityId) {
      console.error(
        '[useDiaryInteractions] Impossibile aggiungere al diario: cityId assente su POI e nessuna città attiva',
      );
      return false;
    }

    const isResource = isDiaryResourcePoi(pendingPoi);

    const newItem: ItineraryItem = {
      id: randomUUID(),
      poi: pendingPoi,
      cityId: targetCityId,
      dayIndex,
      timeSlotStr,
      completed: false,
      isResource: isResource, // Auto-flag
    };

    // Check Conflict (Solo se NON è una risorsa, le risorse non hanno conflitti orari)
    const conflict = !isResource
      ? itinerary.items.find(
          (i) => !i.isResource && i.dayIndex === dayIndex && i.timeSlotStr === timeSlotStr,
        )
      : undefined;

    if (conflict) {
      openModal('conflict', {
        conflict: {
          item: newItem,
          targetDayIndex: dayIndex,
          targetTime: timeSlotStr,
          conflictingItem: conflict,
        },
      });
      return false;
    }

    commitNewItem(newItem);
    closeModal();
    if (window.innerWidth < LAYOUT.BREAKPOINTS.MD) setMobileDiaryFullScreen(true);
    return true;
  };

  // 2. MOVE / EDIT REQUEST (Internal Logic)
  const handleItemMoveOrEditRequest = (
    item: ItineraryItem,
    targetDayIndex: number,
    targetTime: string,
    forceSwap: boolean = false,
  ) => {
    // No change check
    if (item.dayIndex === targetDayIndex && item.timeSlotStr === targetTime) return;

    // Resources don't conflict
    if (item.isResource) {
      setItinerary((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === item.id ? { ...i, dayIndex: targetDayIndex } : i)),
      }));
      return;
    }

    const conflict = itinerary.items.find(
      (i) =>
        !i.isResource &&
        i.id !== item.id &&
        i.dayIndex === targetDayIndex &&
        i.timeSlotStr === targetTime,
    );

    if (conflict) {
      if (forceSwap) {
        // Swap Logic
        setItinerary((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id
              ? { ...i, dayIndex: targetDayIndex, timeSlotStr: targetTime }
              : i.id === conflict.id
                ? { ...i, dayIndex: item.dayIndex, timeSlotStr: item.timeSlotStr }
                : i,
          ),
        }));
      } else {
        openModal('conflict', {
          conflict: { item, targetDayIndex, targetTime, conflictingItem: conflict },
        });
      }
    } else {
      // Clean Move
      setItinerary((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, dayIndex: targetDayIndex, timeSlotStr: targetTime } : i,
        ),
      }));
      setHighlightedItemId(item.id);
    }
  };

  // 3. SMART DROP HANDLER
  const handleSmartDrop = (dayIndex: number, dataStr: string, targetTime?: string) => {
    try {
      const data: unknown = JSON.parse(dataStr);

      // CASE A: Moving Existing Item
      if (isDiaryMoveDragPayload(data)) {
        const item = itinerary.items.find((i) => i.id === data.id);
        if (item)
          handleItemMoveOrEditRequest(
            item,
            dayIndex,
            targetTime || item.timeSlotStr,
            data.forceSwap,
          );
        return;
      }

      // CASE B: Dropping New POI (producer: JSON.stringify(PointOfInterest))
      const poi = parseDiaryDropPointOfInterest(data);
      if (!poi) {
        console.error('Drop error: payload non riconosciuto come POI o MOVE_ITEM');
        return;
      }

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
      console.error('Drop error', e);
    }
  };

  // 4. RESOLVE CONFLICT (From Modal)
  const resolveConflict = (
    item: ItineraryItem,
    dayIdx: number,
    conflictingItem: ItineraryItem,
    action: 'changeTime' | 'swap',
    newTime?: string,
    swapTimes?: { itemTime: string; conflictTime: string },
  ) => {
    if (action === 'swap') {
      const itemExists = itinerary.items.some((i) => i.id === item.id);
      if (itemExists) {
        // Orari di destinazione scelti dall'utente; fallback allo scambio "secco" (comportamento storico).
        const itemTime = swapTimes?.itemTime ?? conflictingItem.timeSlotStr;
        const conflictTime = swapTimes?.conflictTime ?? item.timeSlotStr;
        setItinerary((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id
              ? { ...i, dayIndex: dayIdx, timeSlotStr: itemTime }
              : i.id === conflictingItem.id
                ? { ...i, dayIndex: item.dayIndex, timeSlotStr: conflictTime }
                : i,
          ),
        }));
      } else {
        alert("Impossibile scambiare con un elemento non ancora in lista. Usa 'Cambia Orario'.");
      }
    } else if (action === 'changeTime' && newTime) {
      const itemExists = itinerary.items.some((i) => i.id === item.id);

      if (itemExists) {
        setItinerary((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, dayIndex: dayIdx, timeSlotStr: newTime } : i,
          ),
        }));
      } else {
        const itemToAdd = { ...item, timeSlotStr: newTime };
        commitNewItem(itemToAdd);
      }
    }
    closeModal();
  };

  // 5. RESOLVE DUPLICATE (From Modal)
  const resolveDuplicate = (
    poi: PointOfInterest,
    dayIdx: number,
    timeSlot: string,
    existingItem: ItineraryItem,
    action: 'add' | 'replace',
  ) => {
    // Modal globale: preserva il cityId dell'item esistente se il POI non ne ha uno.
    const targetCityId = resolveDuplicateItemCityId(poi, existingItem);
    if (!targetCityId) {
      console.error(
        '[useDiaryInteractions] Impossibile risolvere duplicato: nessuna sorgente reale di cityId',
      );
      // Modal resta aperto (onClose utente) — niente item inventato.
      return;
    }

    const isResource = isDiaryResourcePoi(poi);

    if (action === 'replace') {
      pushDiaryDeleteAction(pushDiaryUndo, existingItem);
      removeItem(existingItem.id);
      const newItem: ItineraryItem = {
        id: randomUUID(),
        poi: poi,
        cityId: targetCityId,
        dayIndex: dayIdx,
        timeSlotStr: timeSlot,
        completed: false,
        isResource,
      };
      commitNewItem(newItem);
    } else {
      const newItem: ItineraryItem = {
        id: `${randomUUID()}_dup`,
        poi: poi,
        cityId: targetCityId,
        dayIndex: dayIdx,
        timeSlotStr: timeSlot,
        completed: false,
        isResource,
      };
      commitNewItem(newItem);
    }
    closeModal();
  };

  return {
    confirmAddToItinerary,
    handleSmartDrop,
    handleItemMoveOrEditRequest,
    resolveConflict,
    resolveDuplicate,
  };
};
