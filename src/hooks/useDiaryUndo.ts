import { useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { UndoAction } from './useUndoStack';
import { Itinerary, ItineraryItem } from '@/types';
import type { DiaryNotesState } from '@/types/models/DiaryNotes';

interface DiaryUndoProps {
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  setItinerary: Dispatch<SetStateAction<Itinerary>>;
  addItem: (item: ItineraryItem) => void;
  removeItem: (id: string) => void;
  showToast: (message: string) => void;
  isExecuting: () => boolean;
  beginExecution: () => void;
  endExecution: () => void;
}

export const useDiaryUndo = ({
  undo,
  redo,
  setItinerary,
  addItem,
  removeItem,
  showToast,
  isExecuting,
  beginExecution,
  endExecution
}: DiaryUndoProps) => {
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  const executeAction = useCallback(async (action: UndoAction, inverse: boolean) => {
    beginExecution();
    try {
      if (inverse && action.inverse) {
        await action.inverse(action.payload);
        showToast("Operazione annullata");
        return;
      } else if (!inverse && action.apply) {
        await action.apply(action.payload);
        showToast(inverse ? "Operazione annullata" : "Operazione ripristinata");
        return;
      }

      const type = action.type;
      const payload = action.payload;

      switch (type) {
        case 'add':
          if (inverse) {
            removeItem(action.id);
            showToast("Operazione annullata");
          } else {
            addItem(payload as ItineraryItem);
            showToast("Operazione ripristinata");
          }
          break;

        case 'delete':
          if (inverse) {
            addItem(payload as ItineraryItem);
            showToast("Operazione annullata");
          } else {
            removeItem(action.id);
            showToast("Operazione ripristinata");
          }
          break;

        case 'update':
          const { field, newValue, previousValue } = payload;
          const val = inverse ? previousValue : newValue;
          
          setItinerary(prev => ({
            ...prev,
            items: prev.items.map(item => {
              if (item.id !== action.id) return item;
              
              // Handle nested fields like poi.description
              if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                  ...item,
                  [parent]: {
                    ...(item as any)[parent],
                    [child]: val
                  }
                };
              }
              
              return { ...item, [field]: val };
            })
          }));

          if (inverse) {
            showToast("Operazione annullata");
          } else {
            showToast("Operazione ripristinata");
          }
          break;

        case 'move':
          const moveVal = inverse ? payload.previousItems : payload.newItems;
          setItinerary(prev => ({ ...prev, items: moveVal }));
          
          if (inverse) showToast("Operazione annullata");
          else showToast("Operazione ripristinata");
          break;

        case 'diaryNotes': {
          const { newValue, previousValue } = payload as {
            newValue: DiaryNotesState | null;
            previousValue: DiaryNotesState | null;
          };
          const notesValue = inverse ? previousValue : newValue;
          setItinerary(prev => ({ ...prev, diaryNotes: notesValue }));
          if (inverse) showToast("Operazione annullata");
          else showToast("Operazione ripristinata");
          break;
        }

        default:
          console.warn("[useDiaryUndo] Unknown action type:", type);
      }
    } catch (err) {
      console.error("[useDiaryUndo] Action execution failed:", err);
      showToast("Errore durante l'operazione");
    } finally {
      endExecution();
    }
  }, [beginExecution, endExecution, addItem, removeItem, setItinerary, showToast]);

  const performUndo = useCallback(async () => {
    if (isExecuting()) return false;
    const action = undoRef.current();
    if (!action) return false;
    await executeAction(action, true);
    return true;
  }, [isExecuting, executeAction]);

  const performRedo = useCallback(async () => {
    if (isExecuting()) return false;
    const action = redoRef.current();
    if (!action) return false;
    await executeAction(action, false);
    return true;
  }, [isExecuting, executeAction]);

  return {
    performUndo,
    performRedo
  };
};
