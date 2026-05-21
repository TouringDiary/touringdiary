import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export type UndoActionType = 'update' | 'add' | 'delete' | 'selection' | 'move';

export interface UndoAction<T = any> {
  id: string;
  type?: UndoActionType;
  payload: T;
  label?: string; // For toast notifications
  timestamp?: number;
  groupId?: string;
  merge?: boolean;
  apply?: (payload: any) => Promise<void>;
  inverse?: (payload: any) => Promise<void>;
}

interface UndoState<T> {
  history: UndoAction<T>[];
  pointer: number;
}

export function useUndoStack<T>(maxSize = 30) {
  const [state, setState] = useState<UndoState<T>>({
    history: [],
    pointer: -1
  });

  const isExecutingRef = useRef(false);

  const beginExecution = useCallback(() => {
    isExecutingRef.current = true;
  }, []);

  const endExecution = useCallback(() => {
    isExecutingRef.current = false;
  }, []);

  const isExecuting = useCallback(() => isExecutingRef.current, []);

  useEffect(() => {
    console.log("[UndoStack] Hook Instance Created (Mount)");
    return () => console.log("[UndoStack] Hook Instance Destroyed (Unmount)");
  }, []);

  // Mantieni un riferimento sincronizzato per letture immediate e stabili
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pushAction = useCallback((action: UndoAction<T>) => {
    if (isExecutingRef.current) return;
    
    // Immutabilità e Fallback Timestamp Automatica
    const safeAction = { 
      ...action, 
      timestamp: action.timestamp ?? Date.now() 
    };

    // Validazione Atomica Pro-Grade
    if (!safeAction.id || !(safeAction.type || (safeAction.apply && safeAction.inverse))) {
      console.warn("[UndoStack] Invalid or core-missing action rejected:", safeAction);
      return;
    }

    console.log("[UndoStack] pushAction:", safeAction);
    setState(prev => {
      // Inizia la nuova storia dal puntatore corrente (tronca rami redo)
      const newHistory = prev.history.slice(0, prev.pointer + 1);
      const last = newHistory[newHistory.length - 1];

      // Smart Merge Logic (consecutive actions with same groupId)
      if (safeAction.merge && last && last.merge && last.groupId === safeAction.groupId) {
        console.log("[UndoStack] Merging action into groupId:", safeAction.groupId);
        newHistory[newHistory.length - 1] = safeAction;
      } else {
        newHistory.push(safeAction);
      }
      
      let newPointer = newHistory.length - 1;
      
      // Gestione dimensione massima (Editor-Grade Overflow)
      if (newHistory.length > maxSize) {
        const overflow = newHistory.length - maxSize;
        newHistory.splice(0, overflow);
        newPointer -= overflow;
      }
      
      return {
        history: newHistory,
        pointer: newPointer
      };
    });
  }, [maxSize]);

  const undo = useCallback(() => {
    const current = stateRef.current;
    // Guardrail Deterministico Sincrono
    if (current.pointer < 0) return null;

    console.log("[UndoDebug] undo triggered from:", new Error().stack);
    const actionToReturn = current.history[current.pointer];
    
    setState(prev => {
      if (prev.pointer < 0) return prev;
      return {
        ...prev,
        pointer: prev.pointer - 1
      };
    });
    
    console.log("[UndoStack] undo returning action:", actionToReturn);
    return actionToReturn;
  }, []);

  const redo = useCallback(() => {
    const current = stateRef.current;
    // Guardrail Deterministico Sincrono
    if (current.pointer >= current.history.length - 1) return null;

    const nextPointer = current.pointer + 1;
    const actionToReturn = current.history[nextPointer];
    
    setState(prev => {
      const maxPointer = prev.history.length - 1;
      if (prev.pointer >= maxPointer) return prev;
      return {
        ...prev,
        pointer: prev.pointer + 1
      };
    });
    
    return actionToReturn;
  }, []);

  return useMemo(() => ({ 
    pushAction, 
    undo, 
    redo, 
    isExecuting,
    beginExecution,
    endExecution,
    canUndo: state.pointer >= 0, 
    canRedo: state.pointer < state.history.length - 1,
    historySize: state.history.length,
    currentPointer: state.pointer
  }), [pushAction, undo, redo, isExecuting, beginExecution, endExecution, state.pointer, state.history.length]);
}
