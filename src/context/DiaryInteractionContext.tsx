import React, { createContext, useContext, ReactNode } from 'react';
import { useDiaryInteractions } from '../hooks/features/useDiaryInteractions';
import { useUI } from './UIContext';
import { useNavigation } from './NavigationContext';
import { ItineraryItem, PointOfInterest } from '../types/index';

interface DiaryInteractionContextType {
    confirmAddToItinerary: (pendingPoi: PointOfInterest, dayIndex: number, timeSlotStr: string) => void;
    handleSmartDrop: (dayIndex: number, dataStr: string, targetTime?: string) => void;
    handleItemMoveOrEditRequest: (item: ItineraryItem, targetDayIndex: number, targetTime: string, forceSwap?: boolean) => void;
    resolveConflict: (item: ItineraryItem, dayIdx: number, conflictingItem: ItineraryItem, action: 'changeTime' | 'swap', newTime?: string) => void;
    resolveDuplicate: (poi: PointOfInterest, dayIdx: number, timeSlot: string, existingItem: ItineraryItem, action: 'add' | 'replace') => void;
}

const DiaryInteractionContext = createContext<DiaryInteractionContextType | undefined>(undefined);

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

export const useDiaryInteractionsContext = () => {
    const context = useContext(DiaryInteractionContext);
    if (!context) throw new Error("useDiaryInteractionsContext must be used within DiaryInteractionProvider");
    return context;
};