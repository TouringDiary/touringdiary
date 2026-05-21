
import { useContext } from 'react';
import { DiaryInteractionContext } from './DiaryInteractionContext';

export function useDiaryInteractionsContext() {
    const context = useContext(DiaryInteractionContext);
    if (!context) throw new Error("useDiaryInteractionsContext must be used within DiaryInteractionProvider");
    return context;
}
