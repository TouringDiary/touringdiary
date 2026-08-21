import type React from 'react';
import { useCallback } from 'react';
import type { UndoAction } from '@/hooks/useUndoStack';
import type { Suitcase, SuitcaseItem } from '@/types/suitcase';
import type { SuitcaseUndoPayload } from './useSuitcaseUndo';

const isSuitcaseUndoPayload = (payload: unknown): payload is SuitcaseUndoPayload =>
  typeof payload === 'object' && payload !== null;

export const useFloatingPanelStateSync = (
  setUserSuitcases: React.Dispatch<React.SetStateAction<Suitcase[]>>,
  activeTabId: string | null,
) => {
  const handleStateSync = useCallback(
    (action: UndoAction, inverse: boolean, suitcaseId: string | null) => {
      const targetId = suitcaseId || activeTabId;
      if (!targetId || !isSuitcaseUndoPayload(action.payload)) return;

      const payload = action.payload;

      setUserSuitcases((prev) => {
        return prev.map((suitcase) => {
          if (suitcase.id !== targetId) return suitcase;

          const items = [...(suitcase.suitcase_items || [])];

          if (action.type === 'update') {
            const field = payload.field;
            if (!field) return suitcase;
            const val = inverse ? payload.previousValue : payload.newValue;
            const extra = inverse
              ? (payload.inverseExtraUpdates ?? {})
              : (payload.extraUpdates ?? {});

            return {
              ...suitcase,
              suitcase_items: items.map((item) =>
                item.id === action.id ? { ...item, [field]: val, ...extra } : item,
              ),
            };
          }

          if (action.type === 'add') {
            if (inverse) {
              // Undo Add = Remove
              return {
                ...suitcase,
                suitcase_items: items.filter((item) => item.id !== action.id),
              };
            } else {
              // Redo Add = Restore Add
              if (items.some((i) => i.id === action.id)) return suitcase;
              return {
                ...suitcase,
                suitcase_items: [
                  ...items,
                  {
                    id: action.id,
                    suitcase_id: suitcase.id,
                    name: action.label,
                    category: payload.category,
                    is_checked: payload.is_checked ?? false,
                    is_ai_suggestion: payload.is_ai_suggestion ?? false,
                    quantity: payload.quantity ?? 1,
                    ai_suggestion_context: payload.ai_suggestion_context ?? null,
                    suggested_at: payload.suggested_at ?? null,
                    accepted_from_ai: payload.accepted_from_ai ?? false,
                  } as SuitcaseItem,
                ],
              };
            }
          }

          if (action.type === 'delete') {
            if (inverse) {
              // Undo Delete = Restore Item
              if (items.some((i) => i.id === action.id)) return suitcase;
              return {
                ...suitcase,
                suitcase_items: [
                  ...items,
                  {
                    id: action.id,
                    suitcase_id: suitcase.id,
                    name: action.label,
                    category: payload.category,
                    is_checked: payload.is_checked ?? false,
                    is_ai_suggestion: payload.is_ai_suggestion ?? false,
                    quantity: payload.quantity ?? 1,
                    ai_suggestion_context: payload.ai_suggestion_context ?? null,
                    suggested_at: payload.suggested_at ?? null,
                    accepted_from_ai: payload.accepted_from_ai ?? false,
                  } as SuitcaseItem,
                ],
              };
            } else {
              // Redo Delete = Remove Item
              return {
                ...suitcase,
                suitcase_items: items.filter((item) => item.id !== action.id),
              };
            }
          }

          return suitcase;
        });
      });
    },
    [activeTabId, setUserSuitcases],
  );

  return { handleStateSync };
};
