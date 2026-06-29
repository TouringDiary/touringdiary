import React, { createContext, useContext, ReactNode } from 'react';
import { useDiaryInteractions } from '../hooks/features/useDiaryInteractions';
import { useUI } from './UIContext';
import { useNavigation } from './useNavigation';
import { ItineraryItem, PointOfInterest } from '../types/index';

interface DiaryInteractionContextType {
    confirmAddToItinerary: (pendingPoi: PointOfInterest, dayIndex: number, timeSlotStr: string) => void;
    handleSmartDrop: (dayIndex: number, dataStr: string, targetTime?: string) => void;
    handleItemMoveOrEditRequest: (item: ItineraryItem, targetDayIndex: number, targetTime: string, forceSwap?: boolean) => void;
    resolveConflict: (item: ItineraryItem, dayIdx: number, conflictingItem: ItineraryItem, action: 'changeTime' | 'swap', newTime?: string, swapTimes?: { itemTime: string; conflictTime: string }) => void;
    resolveDuplicate: (poi: PointOfInterest, dayIdx: number, timeSlot: string, existingItem: ItineraryItem, action: 'add' | 'replace') => void;
}

export const DiaryInteractionContext = createContext<DiaryInteractionContextType | undefined>(undefined);

export const DiaryInteractionProvider = ({ children }: { children?: ReactNode }) => {
    const navigationContext = useNavigation();
    const uiContext = useUI();

    // ✅ hook chiamato correttamente
    const interactions = useDiaryInteractions(
        navigationContext.activeCityId,
        uiContext.setMobileDiaryFullScreen
    );

    return (
        <DiaryInteractionContext.Provider value={interactions}>
            {children}
        </DiaryInteractionContext.Provider>
    );
};
