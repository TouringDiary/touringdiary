import { useEffect, useCallback, useRef } from 'react';
import { workspaceOwnsKeyboardShortcuts } from '@/focus/focusModeRegistry';
import { useFocusMode } from '@/focus';
import { UndoAction } from '@/hooks/useUndoStack';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import type { AddSuitcaseItemMetadata, UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import { ensureUiStateForPersist } from '@/domain/packing/categorySetup';

import { ToastVariant } from '@/types/toast';
import type { SuitcasePanelViewMode } from '../types/panelViewMode';

const UNDO_UPDATE_FIELDS = ['category', 'is_checked', 'quantity', 'accepted_from_ai'] as const;
type UndoUpdateField = (typeof UNDO_UPDATE_FIELDS)[number];

const isUndoUpdateField = (field: string): field is UndoUpdateField =>
  UNDO_UPDATE_FIELDS.some((f) => f === field);

const buildUndoItemUpdate = (
  field: UndoUpdateField,
  val: string | boolean | number,
  extra?: UpdateSuitcaseItemDto
): UpdateSuitcaseItemDto => {
  const base: UpdateSuitcaseItemDto = extra ? { ...extra } : {};
  switch (field) {
    case 'category':
      return typeof val === 'string' ? { ...base, category: val } : base;
    case 'is_checked':
      return typeof val === 'boolean' ? { ...base, is_checked: val } : base;
    case 'quantity':
      return typeof val === 'number' ? { ...base, quantity: val } : base;
    case 'accepted_from_ai':
      return typeof val === 'boolean' ? { ...base, accepted_from_ai: val } : base;
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
};

const toAddItemMetadata = (
  payload: SuitcaseItem,
  id: string
): AddSuitcaseItemMetadata => ({
  id,
  is_checked: payload.is_checked,
  is_ai_suggestion: payload.is_ai_suggestion,
  quantity: payload.quantity,
  ai_suggestion_context: payload.ai_suggestion_context,
  suggested_at: payload.suggested_at,
  accepted_from_ai: payload.accepted_from_ai,
});

interface UndoProps {
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  cancelUndo: () => void;
  cancelRedo: () => void;
  viewMode: SuitcasePanelViewMode;
  updateItem: (id: string, updates: UpdateSuitcaseItemDto) => Promise<void>;
  updateSuitcase: (suitcaseId: string, updates: Partial<Suitcase>) => Promise<void>;
  getActiveSuitcase: () => Suitcase | undefined;
  addItem: (
    suitcaseId: string,
    name: string,
    category: string,
    metadata?: AddSuitcaseItemMetadata
  ) => Promise<SuitcaseItem | undefined>;
  deleteItem: (id: string) => Promise<void>;
  fetchUserSuitcases: () => Promise<void> | void;
  setHighlightItemId: (id: string | null) => void;
  activeSuitcaseId: string | null;
  onShowToast: (message: string, description?: string, variant?: ToastVariant) => void;
  onStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  onCheckDuplicate: (id: string, name: string, category: string, suitcaseId: string | null, isUndo?: boolean) => boolean;
  isExecuting: () => boolean;
  beginExecution: () => void;
  endExecution: () => void;
}

export const useSuitcaseUndo = ({
  undo,
  redo,
  cancelUndo,
  cancelRedo,
  viewMode,
  updateItem,
  updateSuitcase,
  getActiveSuitcase,
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
  const { mode } = useFocusMode();

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const cancelUndoRef = useRef(cancelUndo);
  const cancelRedoRef = useRef(cancelRedo);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
    cancelUndoRef.current = cancelUndo;
    cancelRedoRef.current = cancelRedo;
  }, [undo, redo, cancelUndo, cancelRedo]);

  const restoreItemDisplayOrder = useCallback(
    async (action: UndoAction, inverse: boolean) => {
      const suitcase = getActiveSuitcase();
      if (!suitcase || !activeSuitcaseId) return;
      const order = inverse
        ? action.payload.previousItemDisplayOrder
        : action.payload.newItemDisplayOrder;
      if (!order) return;

      const mergedUiState = ensureUiStateForPersist({
        ...suitcase,
        ui_state: {
          ...suitcase.ui_state,
          hidden_category_ids: suitcase.ui_state?.hidden_category_ids ?? [],
          item_display_order: order,
        },
      });
      await updateSuitcase(activeSuitcaseId, { ui_state: mergedUiState });
    },
    [activeSuitcaseId, getActiveSuitcase, updateSuitcase]
  );

  const executeAction = useCallback(async (action: UndoAction, inverse: boolean) => {
    console.log("[useSuitcaseUndo] Executing action:", action.type, "Inverse:", inverse, "ID:", action.id);
    beginExecution();
    try {
      if (inverse && action.inverse) {
        await action.inverse(action.payload);
        return;
      } else if (!inverse && action.apply) {
        await action.apply(action.payload);
        return;
      }

      if (action.type === 'update') {
        const val = inverse ? action.payload.previousValue : action.payload.newValue;
        const extra = inverse ? action.payload.inverseExtraUpdates : action.payload.extraUpdates;
        const field = action.payload.field;

        if (!isUndoUpdateField(field)) {
          console.warn('[useSuitcaseUndo] Unsupported update field:', field);
          return;
        }

        if (field === 'category' && activeSuitcaseId) {
          const isDuplicate = onCheckDuplicate(
            action.id,
            action.label || '',
            val,
            activeSuitcaseId,
            true
          );

          if (isDuplicate) {
            onShowToast(`"${action.label}" è già presente in ${val}`, undefined, 'destructive');
            if (inverse) {
              cancelUndoRef.current();
            } else {
              cancelRedoRef.current();
            }
            return;
          }

          await updateItem(action.id, buildUndoItemUpdate(field, val, extra));
          await restoreItemDisplayOrder(action, inverse);
          await fetchUserSuitcases();
          onStateSync(action, inverse, activeSuitcaseId);
          setHighlightItemId(action.id);
          onShowToast(
            inverse
              ? `${action.label} riportato in ${val}.`
              : `${action.label} spostato in ${val}.`,
            undefined,
            'success'
          );
          return;
        }

        await updateItem(action.id, buildUndoItemUpdate(field, val, extra));

        onStateSync(action, inverse, activeSuitcaseId);

        setHighlightItemId(action.id);

        if (field === 'is_checked') {
          const state = val ? "selezionato" : "rimosso";
          onShowToast(`${action.label} è stato ${state}`, undefined, inverse ? 'destructive' : 'success');
        } else {
          onShowToast(`${action.label} aggiornato`, undefined, inverse ? 'destructive' : 'success');
        }
      }
      else if (action.type === 'selection') {
        const val = inverse ? action.payload.previousValue : action.payload.newValue;
        if (action.payload.setter && typeof action.payload.setter === 'function') {
          action.payload.setter(val);
        }
        onShowToast(
          val ? `Selezionato: ${action.label}` : `Selezione di ${action.label} rimossa`,
          undefined,
          inverse ? 'destructive' : 'success'
        );
        return;
      }
      else if (action.type === 'add') {
        if (inverse) {
          await deleteItem(action.id);
          onStateSync(action, inverse, activeSuitcaseId);
          onShowToast(`Oggetto rimosso: ${action.label}`, undefined, 'destructive');
        } else if (activeSuitcaseId) {
          const isDuplicate = onCheckDuplicate(action.id, action.label || '', action.payload.category, activeSuitcaseId, true);

          if (!isDuplicate) {
            await addItem(
              activeSuitcaseId,
              action.label || '',
              action.payload.category,
              toAddItemMetadata(action.payload, action.id)
            );
            onStateSync(action, inverse, activeSuitcaseId);
            onShowToast(`Oggetto ripristinato: ${action.label}`, undefined, 'success');
          } else {
            cancelRedoRef.current();
            onShowToast(`"${action.label}" è già presente in ${action.payload.category}`, undefined, 'neutral');
          }
        }
      }
      else if (action.type === 'delete') {
        if (inverse) {
          if (activeSuitcaseId) {
            const isDuplicate = onCheckDuplicate(action.id, action.label || '', action.payload.category, activeSuitcaseId, true);

            if (!isDuplicate) {
              await addItem(
              activeSuitcaseId,
              action.label || '',
              action.payload.category,
              toAddItemMetadata(action.payload, action.id)
            );
              onStateSync(action, inverse, activeSuitcaseId);
              onShowToast(`Oggetto ripristinato: ${action.label}`, undefined, 'success');
            } else {
              cancelUndoRef.current();
              onShowToast(`"${action.label}" è già presente in ${action.payload.category}`, undefined, 'neutral');
            }
          }
        } else {
          await deleteItem(action.id);
          onStateSync(action, inverse, activeSuitcaseId);
          onShowToast(`Oggetto eliminato: ${action.label}`, undefined, 'destructive');
        }
      }
    } catch (err) {
      console.error("Action execution failed:", err);
      onShowToast("Errore durante l'operazione", undefined, 'destructive');
      void fetchUserSuitcases();
    } finally {
      endExecution();
    }
  }, [
    activeSuitcaseId, onStateSync, onCheckDuplicate,
    updateItem, updateSuitcase, restoreItemDisplayOrder, setHighlightItemId, onShowToast, deleteItem,
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
    if (!workspaceOwnsKeyboardShortcuts(mode)) return;
    if (viewMode !== 'editor') return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        await performUndo();
      }

      const isRedo = ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
                     ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z');

      if (isRedo) {
        e.preventDefault();
        await performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, viewMode, performUndo, performRedo]);

  return {
    performUndo,
    performRedo
  };
};
