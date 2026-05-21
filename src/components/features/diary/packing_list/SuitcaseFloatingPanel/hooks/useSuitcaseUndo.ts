import { useEffect, useCallback, useRef } from 'react';
import { UndoAction } from '@/hooks/useUndoStack';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

interface UndoProps {
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  updateItem: (id: string, updates: Partial<SuitcaseItem>) => Promise<void>;
  addItem: (suitcaseId: string, name: string, category: string, metadata?: Partial<SuitcaseItem>) => Promise<any>;
  deleteItem: (id: string) => Promise<void>;
  fetchUserSuitcases: () => Promise<void> | void;
  setHighlightItemId: (id: string | null) => void;
  activeSuitcaseId: string | null;
  onShowToast: (message: string) => void;
  onStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  onCheckDuplicate: (id: string, name: string, category: string, suitcaseId: string | null, isUndo?: boolean) => boolean;
  isExecuting: () => boolean;
  beginExecution: () => void;
  endExecution: () => void;
}

export const useSuitcaseUndo = ({
  undo,
  redo,
  updateItem,
  addItem,
  deleteItem,
  fetchUserSuitcases,
  setHighlightItemId,
  activeSuitcaseId,
  onShowToast,
  onStateSync,
  onCheckDuplicate,
  isExecuting,
  beginExecution,
  endExecution
}: UndoProps) => {
  // Riferimenti persistenti per evitare stale closures nel listener
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  const executeAction = useCallback(async (action: UndoAction, inverse: boolean) => {
    console.log("[useSuitcaseUndo] Executing action:", action.type, "Inverse:", inverse, "ID:", action.id);
    beginExecution();
    try {
      // 1. Priorità Esecuzione: Command Pattern > Legacy
      if (inverse && action.inverse) {
        await action.inverse(action.payload);
        return;
      } else if (!inverse && action.apply) {
        await action.apply(action.payload);
        return;
      }

      // 2. Esecuzione Asincrona (Persistenza) Legacy
      if (action.type === 'update') {
        const val = inverse ? action.payload.previousValue : action.payload.newValue;
        await updateItem(action.id, { [action.payload.field]: val });
        
        // Sincronizzazione stato solo DOPO conferma DB
        onStateSync(action, inverse, activeSuitcaseId);
        
        setHighlightItemId(action.id);
        
        if (action.payload.field === 'is_checked') {
          const state = val ? "selezionato" : "rimosso";
          onShowToast(`${action.label} è stato ${state}`);
        } else {
          onShowToast(`${action.label} aggiornato`);
        }
      } 
      else if (action.type === 'selection') {
        const val = inverse ? action.payload.previousValue : action.payload.newValue;
        if (action.payload.setter && typeof action.payload.setter === 'function') {
          action.payload.setter(val);
        }
        onShowToast(val ? `Selezionato: ${action.label}` : `Selezione di ${action.label} rimossa`);
        return; 
      }
      else if (action.type === 'add') {
        if (inverse) {
          await deleteItem(action.id);
          onStateSync(action, inverse, activeSuitcaseId);
          onShowToast(`Oggetto rimosso: ${action.label}`);
        } else if (activeSuitcaseId) {
          const isDuplicate = onCheckDuplicate(action.id, action.label || '', action.payload.category, activeSuitcaseId, true);

          if (!isDuplicate) {
            await addItem(activeSuitcaseId, action.label || '', action.payload.category, { ...action.payload, id: action.id });
            onStateSync(action, inverse, activeSuitcaseId);
            onShowToast(`Oggetto ripristinato: ${action.label}`);
          }
        }
      }
      else if (action.type === 'delete') {
        if (inverse) {
          if (activeSuitcaseId) {
            const isDuplicate = onCheckDuplicate(action.id, action.label || '', action.payload.category, activeSuitcaseId, true);

            if (!isDuplicate) {
              await addItem(activeSuitcaseId, action.label || '', action.payload.category, { ...action.payload, id: action.id });
              onStateSync(action, inverse, activeSuitcaseId);
              onShowToast(`Oggetto ripristinato: ${action.label}`);
            }
          }
        } else {
          await deleteItem(action.id);
          onStateSync(action, inverse, activeSuitcaseId);
          onShowToast(`Oggetto eliminato: ${action.label}`);
        }
      }
      
      // Sincronizzazione atomica già gestita da onStateSync post-conferma
    } catch (err) {
      console.error("Action execution failed:", err);
      onShowToast("Errore durante l'operazione");
      fetchUserSuitcases(); 
    } finally {
      endExecution();
    }
  }, [
    activeSuitcaseId, onStateSync, onCheckDuplicate, 
    updateItem, setHighlightItemId, onShowToast, deleteItem, 
    addItem, fetchUserSuitcases, beginExecution, endExecution
  ]);

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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      console.log("[UndoListener] keydown detected:", e.key, "ctrl:", e.ctrlKey);
      // Evita trigger durante inserimento testo
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // UNDO: CTRL+Z or CMD+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        console.log("[UndoListener] CTRL+Z detected");
        await performUndo();
      }
      
      // REDO: CTRL+Y or CMD+Y or CTRL+SHIFT+Z
      const isRedo = ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
                     ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z');
      
      if (isRedo) {
        e.preventDefault();
        console.log("[UndoListener] Redo Shortcut detected");
        await performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  return {
    performUndo,
    performRedo
  };
};
