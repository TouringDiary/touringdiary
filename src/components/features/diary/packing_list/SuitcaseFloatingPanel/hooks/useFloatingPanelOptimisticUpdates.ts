import React, { useCallback } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';

export const useFloatingPanelStateSync = (setUserSuitcases: React.Dispatch<React.SetStateAction<Suitcase[]>>, activeTabId: string | null) => {
  const handleStateSync = useCallback((action: any, inverse: boolean, suitcaseId: string | null) => {
    const targetId = suitcaseId || activeTabId;
    if (!targetId) return;

    setUserSuitcases(prev => {
      return prev.map(suitcase => {
        if (suitcase.id !== targetId) return suitcase;

        const items = [...(suitcase.suitcase_items || [])];

        if (action.type === 'update') {
          const val = inverse ? action.payload.previousValue : action.payload.newValue;
          const extra = (!inverse && action.payload.extraUpdates) ? action.payload.extraUpdates : {};
          
          return {
            ...suitcase,
            suitcase_items: items.map(item => 
              item.id === action.id ? { ...item, [action.payload.field]: val, ...extra } : item
            )
          };
        }

        if (action.type === 'add') {
          if (inverse) { // Undo Add = Remove
            return {
              ...suitcase,
              suitcase_items: items.filter(item => item.id !== action.id)
            };
          } else { // Redo Add = Restore Add
            if (items.some(i => i.id === action.id)) return suitcase;
            return {
              ...suitcase,
              suitcase_items: [...items, { 
                id: action.id, 
                suitcase_id: suitcase.id,
                name: action.label,
                category: action.payload.category,
                is_checked: action.payload.is_checked || false,
                is_ai_suggestion: action.payload.is_ai_suggestion || false,
                quantity: action.payload.quantity || 1,
                ai_suggestion_context: action.payload.ai_suggestion_context || null,
                suggested_at: action.payload.suggested_at || null
              } as SuitcaseItem]
            };
          }
        }

        if (action.type === 'delete') {
          if (inverse) { // Undo Delete = Restore Item
            if (items.some(i => i.id === action.id)) return suitcase;
            return {
              ...suitcase,
              suitcase_items: [...items, { 
                id: action.id, 
                suitcase_id: suitcase.id,
                name: action.label,
                category: action.payload.category,
                is_checked: action.payload.is_checked || false,
                is_ai_suggestion: action.payload.is_ai_suggestion || false,
                quantity: action.payload.quantity || 1,
                ai_suggestion_context: action.payload.ai_suggestion_context || null,
                suggested_at: action.payload.suggested_at || null
              } as SuitcaseItem]
            };
          } else { // Redo Delete = Remove Item
            return {
              ...suitcase,
              suitcase_items: items.filter(item => item.id !== action.id)
            };
          }
        }

        return suitcase;
      });
    });
  }, [activeTabId, setUserSuitcases]);

  return { handleStateSync };
};
