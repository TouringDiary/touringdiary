import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { UndoAction } from '@/hooks/useUndoStack';
import type { ItineraryItem } from '@/types';

type DiaryUndoPush = (action: UndoAction) => void;

interface ActiveDiaryUndoStack {
  /** Identità dello stack Diario attivo (istanza + documento). */
  stackId: string;
  pushAction: DiaryUndoPush;
}

interface DiaryUndoBridgeValue {
  /**
   * Registra lo stack Diario attivo.
   * Il cleanup deve chiamare `unregisterStack(stackId)` — non azzera
   * una registrazione più recente con id diverso.
   */
  registerStack: (stackId: string, pushAction: DiaryUndoPush) => void;
  unregisterStack: (stackId: string) => void;
  /** Delega a pushAction dello stack Diario attivo, se presente. */
  pushAction: DiaryUndoPush;
}

const DiaryUndoBridgeContext = createContext<DiaryUndoBridgeValue | undefined>(undefined);

export const DiaryUndoBridgeProvider = ({ children }: { children?: ReactNode }) => {
  const activeRef = useRef<ActiveDiaryUndoStack | null>(null);

  const registerStack = useCallback((stackId: string, pushAction: DiaryUndoPush) => {
    activeRef.current = { stackId, pushAction };
  }, []);

  const unregisterStack = useCallback((stackId: string) => {
    if (activeRef.current?.stackId === stackId) {
      activeRef.current = null;
    }
  }, []);

  const pushAction = useCallback((action: UndoAction) => {
    activeRef.current?.pushAction(action);
  }, []);

  const value = useMemo(
    () => ({ registerStack, unregisterStack, pushAction }),
    [registerStack, unregisterStack, pushAction],
  );

  return (
    <DiaryUndoBridgeContext.Provider value={value}>{children}</DiaryUndoBridgeContext.Provider>
  );
};

export function useDiaryUndoBridge(): DiaryUndoBridgeValue {
  const ctx = useContext(DiaryUndoBridgeContext);
  if (!ctx) {
    throw new Error('useDiaryUndoBridge must be used within DiaryUndoBridgeProvider');
  }
  return ctx;
}

/**
 * Collega lo stack Undo del Diario montato al bridge.
 * `stackId` deve identificare l'istanza attiva (cambia con remount / documento).
 */
export function useRegisterDiaryUndoStack(stackId: string, pushAction: DiaryUndoPush): void {
  const { registerStack, unregisterStack } = useDiaryUndoBridge();
  useEffect(() => {
    registerStack(stackId, pushAction);
    return () => unregisterStack(stackId);
  }, [stackId, pushAction, registerStack, unregisterStack]);
}

/** Una sola entry `add` per mutazione utente (non usare durante Undo/Redo: isExecuting). */
export function pushDiaryAddAction(pushAction: DiaryUndoPush, item: ItineraryItem): void {
  pushAction({
    id: item.id,
    type: 'add',
    payload: item,
    label: item.poi?.name || 'Elemento',
  });
}

/** Una sola entry `delete` per mutazione utente (es. replace duplicato). */
export function pushDiaryDeleteAction(pushAction: DiaryUndoPush, item: ItineraryItem): void {
  pushAction({
    id: item.id,
    type: 'delete',
    payload: item,
    label: item.poi?.name || 'Elemento',
  });
}
