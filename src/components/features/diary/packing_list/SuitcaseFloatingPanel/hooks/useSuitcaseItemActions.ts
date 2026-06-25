import { useCallback } from 'react';
import { Suitcase, SuitcaseItem, SuitcaseRejection } from '@/types/suitcase';
import { UndoAction } from '@/hooks/useUndoStack';
import { ToastVariant } from '@/types/toast';
import type { AddSuitcaseItemMetadata, UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import { removeRejectionAsync, removeRejectionByNameAsync } from '@/services/suitcase/suitcaseRejectionsService';
import {
  isDraftWorkspaceId,
  removeDraftLocalRejectionById,
  removeDraftLocalRejectionByName,
} from '@/utils/guestSuitcaseHelper';
import { isEphemeralItemId } from '@/utils/runtimeItemId';
import { getCategoryId, normalizeCategoryName } from '@/domain/packing/packingCategories';
import { ensureUiStateForPersist } from '@/domain/packing/categorySetup';
import {
  appendItemToDisplayOrder,
  cloneItemDisplayOrder,
  getItemDisplayOrder,
  isSameItemDisplayOrder,
  moveItemBetweenCategoriesInOrder,
  removeItemFromDisplayOrder,
  swapItemsInCategoryOrder,
} from '@/domain/packing/itemDisplayOrder';
import type { CategoryDeleteModalTarget } from './useFloatingPanelModals';
import {
  computeCategoryDeleteUpdates,
  computeCategoryRestoreUpdates,
  createCategoryDeleteSnapshot,
  getItemsRemovedByCategoryDelete,
  type CategoryDeleteSnapshot,
} from '@/utils/suitcaseCategoryDelete';

function toAddItemMetadata(
  item: Pick<
    SuitcaseItem,
    | 'id'
    | 'is_checked'
    | 'is_ai_suggestion'
    | 'quantity'
    | 'ai_suggestion_context'
    | 'suggested_at'
    | 'accepted_from_ai'
  >
): AddSuitcaseItemMetadata {
  return {
    id: item.id,
    is_checked: item.is_checked,
    is_ai_suggestion: item.is_ai_suggestion,
    quantity: item.quantity,
    ai_suggestion_context: item.ai_suggestion_context,
    suggested_at: item.suggested_at,
    accepted_from_ai: item.accepted_from_ai,
  };
}

function createRuntimeSuitcaseItem(
  suitcaseId: string,
  name: string,
  category: string,
  metadata: AddSuitcaseItemMetadata = {}
): SuitcaseItem {
  const itemId =
    metadata.id && isEphemeralItemId(metadata.id)
      ? metadata.id
      : `draft-item-${Date.now()}`;
  return {
    id: itemId,
    suitcase_id: suitcaseId,
    name,
    category: normalizeCategoryName(category),
    is_checked: metadata.is_checked ?? false,
    is_ai_suggestion: metadata.is_ai_suggestion ?? false,
    quantity: metadata.quantity ?? 1,
    ai_suggestion_context: metadata.ai_suggestion_context ?? null,
    suggested_at: metadata.suggested_at ?? null,
    accepted_from_ai: metadata.accepted_from_ai ?? false,
  };
}

function withItemDisplayOrderUiState(
  suitcase: Suitcase,
  itemDisplayOrder: ReturnType<typeof getItemDisplayOrder>
) {
  return ensureUiStateForPersist({
    ...suitcase,
    ui_state: {
      ...suitcase.ui_state,
      hidden_category_ids: suitcase.ui_state?.hidden_category_ids ?? [],
      item_display_order: itemDisplayOrder,
    },
  });
}

interface ItemActionsProps {
  activeTabId: string | null;
  updateItem: (id: string, updates: UpdateSuitcaseItemDto) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  rejectItem: (suitcaseId: string, item: SuitcaseItem) => Promise<void>;
  addItem: (suitcaseId: string, name: string, category: string, metadata?: AddSuitcaseItemMetadata) => Promise<SuitcaseItem | undefined>;
  updateSuitcase: (suitcaseId: string, updates: Partial<Suitcase>) => Promise<void>;
  getActiveSuitcase: () => Suitcase | undefined;
  getSuitcaseById?: (id: string) => Suitcase | undefined;
  handleStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  pushAction: (action: UndoAction) => void;
  fetchUserSuitcases: () => Promise<void> | void;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
  fetchBlacklist?: (options?: { force?: boolean }) => Promise<void>;
  triggerBlacklistFlash?: () => void;
  checkDuplicateItem: (
    id: string,
    name: string,
    category: string,
    suitcaseId: string | null,
    isUndo?: boolean
  ) => boolean;
  /** Document save model: mutations stay local until flush. */
  onDocumentDirty?: () => void;
  onSuitcaseLocalUpdate?: (suitcaseId: string, updates: Partial<Suitcase>) => void;
}

export const useSuitcaseItemActions = ({
  activeTabId,
  updateItem,
  deleteItem,
  rejectItem,
  addItem,
  updateSuitcase,
  getActiveSuitcase,
  getSuitcaseById,
  handleStateSync,
  pushAction,
  fetchUserSuitcases,
  showToast,
  fetchBlacklist,
  triggerBlacklistFlash,
  checkDuplicateItem,
  onDocumentDirty,
  onSuitcaseLocalUpdate,
}: ItemActionsProps) => {

  const applyDocumentMutation = useCallback(
    async (
      action: UndoAction,
      persistFn?: () => Promise<void>
    ) => {
      handleStateSync(action, false, activeTabId);
      if (onDocumentDirty) {
        onDocumentDirty();
        pushAction(action);
        return;
      }
      if (persistFn) await persistFn();
      await fetchUserSuitcases();
      pushAction(action);
    },
    [activeTabId, fetchUserSuitcases, handleStateSync, onDocumentDirty, pushAction]
  );

  const persistItemDisplayOrder = useCallback(
    async (suitcase: Suitcase, itemDisplayOrder: ReturnType<typeof getItemDisplayOrder>) => {
      const mergedUiState = withItemDisplayOrderUiState(suitcase, itemDisplayOrder);
      if (onDocumentDirty && onSuitcaseLocalUpdate) {
        onSuitcaseLocalUpdate(suitcase.id, { ui_state: mergedUiState });
        return;
      }
      await updateSuitcase(suitcase.id, { ui_state: mergedUiState });
    },
    [onDocumentDirty, onSuitcaseLocalUpdate, updateSuitcase]
  );

  const persistCategoryDelete = useCallback(
    async (suitcaseId: string, suitcase: Suitcase, target: CategoryDeleteSnapshot['target']) => {
      const updates = computeCategoryDeleteUpdates(suitcase, target);
      const removedItems = getItemsRemovedByCategoryDelete(suitcase, target);

      if (isDraftWorkspaceId(suitcaseId)) {
        await updateSuitcase(suitcaseId, updates);
        return;
      }

      await Promise.all(
        removedItems
          .filter(
            (item) =>
              item.id && !isEphemeralItemId(item.id) && !item.id.startsWith('temp-')
          )
          .map((item) => deleteItem(item.id))
      );

      const metadataUpdates: Partial<Suitcase> = {};
      if (updates.custom_categories !== undefined) {
        metadataUpdates.custom_categories = updates.custom_categories;
      }
      if (updates.ui_state !== undefined) {
        metadataUpdates.ui_state = updates.ui_state;
      }
      if (Object.keys(metadataUpdates).length > 0) {
        await updateSuitcase(suitcaseId, metadataUpdates);
      }
    },
    [deleteItem, updateSuitcase]
  );

  const persistCategoryRestore = useCallback(
    async (suitcaseId: string, snapshot: CategoryDeleteSnapshot) => {
      const updates = computeCategoryRestoreUpdates(snapshot);
      const removedItems = snapshot.previousItems.filter(
        (item) => item.category === snapshot.target.name
      );

      if (isDraftWorkspaceId(suitcaseId)) {
        await updateSuitcase(suitcaseId, updates);
        return;
      }

      await updateSuitcase(suitcaseId, {
        custom_categories: updates.custom_categories,
        ui_state: updates.ui_state,
      });

      await Promise.all(
        removedItems.map((item) =>
          addItem(suitcaseId, item.name, item.category, toAddItemMetadata(item))
        )
      );
    },
    [addItem, updateSuitcase]
  );

  const handleUpdateItemConfirmed = useCallback(async (itemId: string, updates: UpdateSuitcaseItemDto, currentItem: SuitcaseItem) => {
    try {
      if (updates.is_checked !== undefined) {
        const action: UndoAction = {
          id: itemId,
          type: 'update',
          payload: {
            field: 'is_checked',
            previousValue: !!currentItem.is_checked,
            newValue: !!updates.is_checked
          },
          label: currentItem.name,
          timestamp: Date.now()
        };

        await applyDocumentMutation(action, () => updateItem(itemId, updates));
      } else if (updates.quantity !== undefined) {
        const clampedQty = Math.max(1, updates.quantity ?? 1);
        const action: UndoAction = {
          id: itemId,
          type: 'update',
          payload: {
            field: 'quantity',
            previousValue: currentItem.quantity ?? 1,
            newValue: clampedQty,
          },
          label: currentItem.name,
          timestamp: Date.now(),
        };

        await applyDocumentMutation(action, () => updateItem(itemId, { quantity: clampedQty }));
      } else if (updates.accepted_from_ai === true) {
        const action: UndoAction = {
          id: itemId,
          type: 'update',
          payload: {
            field: 'accepted_from_ai',
            previousValue: !!currentItem.accepted_from_ai,
            newValue: true,
            extraUpdates: { is_ai_suggestion: false },
            inverseExtraUpdates: { is_ai_suggestion: true },
          },
          label: currentItem.name,
          timestamp: Date.now()
        };
        await applyDocumentMutation(action, () => updateItem(itemId, updates));
        if (!onDocumentDirty) {
          showToast("Oggetto aggiunto", "L'oggetto è stato aggiunto alla valigia.", 'success');
        }
      } else if (updates.category !== undefined) {
        const newCategory = normalizeCategoryName(updates.category);
        const previousCategory = normalizeCategoryName(currentItem.category);
        if (newCategory === previousCategory) return;

        const suitcase = getActiveSuitcase();
        if (!suitcase || !activeTabId) return;

        const isDuplicate = checkDuplicateItem(
          itemId,
          currentItem.name,
          newCategory,
          activeTabId,
          false
        );
        if (isDuplicate) {
          showToast(`"${currentItem.name}" è già presente in ${newCategory}`, undefined, 'destructive');
          return;
        }

        const sourceCategoryId = getCategoryId(previousCategory, suitcase.custom_categories);
        const destCategoryId = getCategoryId(newCategory, suitcase.custom_categories);
        const previousItemDisplayOrder = cloneItemDisplayOrder(getItemDisplayOrder(suitcase));
        const newItemDisplayOrder = moveItemBetweenCategoriesInOrder(
          previousItemDisplayOrder,
          sourceCategoryId,
          destCategoryId,
          currentItem.name
        );

        const action: UndoAction = {
          id: itemId,
          type: 'update',
          payload: {
            field: 'category',
            previousValue: previousCategory,
            newValue: newCategory,
            previousItemDisplayOrder,
            newItemDisplayOrder,
          },
          label: currentItem.name,
          timestamp: Date.now(),
        };

        if (onDocumentDirty) {
          handleStateSync(action, false, activeTabId);
          if (onSuitcaseLocalUpdate) {
            onSuitcaseLocalUpdate(suitcase.id, {
              ui_state: withItemDisplayOrderUiState(suitcase, newItemDisplayOrder),
            });
          }
          onDocumentDirty();
          pushAction(action);
          showToast(`${currentItem.name} spostato in ${newCategory}.`, undefined, 'success');
          return;
        }

        await Promise.all([
          updateItem(itemId, { category: newCategory }),
          persistItemDisplayOrder(suitcase, newItemDisplayOrder),
        ]);
        await fetchUserSuitcases();

        handleStateSync(action, false, activeTabId);
        pushAction(action);
        showToast(`${currentItem.name} spostato in ${newCategory}.`, undefined, 'success');
      } else {
        await updateItem(itemId, updates);
        await fetchUserSuitcases();
      }
    } catch (err) {
      console.error("Update failed:", err);
      void fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, updateItem, updateSuitcase, handleStateSync, pushAction, fetchUserSuitcases, showToast, checkDuplicateItem, getActiveSuitcase, persistItemDisplayOrder, onDocumentDirty, onSuitcaseLocalUpdate]);

  const handleDeleteItemConfirmed = useCallback(async (itemToDelete: SuitcaseItem) => {
    try {
      const id = itemToDelete.id;
      const suitcase = getActiveSuitcase();

      const action: UndoAction = {
        id,
        type: 'delete',
        payload: { ...itemToDelete },
        label: itemToDelete.name,
        timestamp: Date.now(),
        ...(itemToDelete.is_ai_suggestion ? {
          inverse: async (payload) => {
            await addItem(activeTabId!, payload.name, payload.category, toAddItemMetadata(payload));
            if (activeTabId && isDraftWorkspaceId(activeTabId)) {
              removeDraftLocalRejectionByName(activeTabId, payload.name);
            } else {
              await removeRejectionByNameAsync(activeTabId!, payload.name);
            }
            handleStateSync(action, true, activeTabId);
            if (fetchBlacklist) await fetchBlacklist({ force: true });
            showToast(`Suggerimento ripristinato: ${payload.name}`, undefined, 'success');
          },
          apply: async (payload) => {
            await rejectItem(activeTabId!, payload);
            handleStateSync(action, false, activeTabId);
            if (fetchBlacklist) await fetchBlacklist({ force: true });
            showToast(`Suggerimento rimosso: ${payload.name}`, undefined, 'destructive');
          }
        } : {})
      };

      if (onDocumentDirty) {
        if (suitcase && activeTabId && onSuitcaseLocalUpdate) {
          const categoryId = getCategoryId(itemToDelete.category, suitcase.custom_categories);
          const nextOrder = removeItemFromDisplayOrder(
            getItemDisplayOrder(suitcase),
            categoryId,
            itemToDelete.name
          );
          onSuitcaseLocalUpdate(suitcase.id, {
            ui_state: withItemDisplayOrderUiState(suitcase, nextOrder),
          });
        }
        handleStateSync(action, false, activeTabId);
        onDocumentDirty();
        pushAction(action);
        if (itemToDelete.is_ai_suggestion && activeTabId) {
          // Le rejection sono entità indipendenti: vanno persistite subito,
          // anche nel percorso document-dirty, perché non fanno parte del
          // payload di salvataggio della valigia.
          try {
            await rejectItem(activeTabId, itemToDelete);
          } catch (e) {
            console.error('[handleDeleteItemConfirmed] rejection persist failed:', e);
          }
          if (fetchBlacklist) await fetchBlacklist({ force: true });
          if (triggerBlacklistFlash) triggerBlacklistFlash();
          showToast("Oggetto spostato nei rifiutati", "L'oggetto non verrà più suggerito per questa valigia.", 'success');
        }
        return;
      }

      if (suitcase && activeTabId) {
        const categoryId = getCategoryId(itemToDelete.category, suitcase.custom_categories);
        const nextOrder = removeItemFromDisplayOrder(
          getItemDisplayOrder(suitcase),
          categoryId,
          itemToDelete.name
        );
        await persistItemDisplayOrder(suitcase, nextOrder);
      }

      if (itemToDelete.is_ai_suggestion && activeTabId) {
        await rejectItem(activeTabId, itemToDelete);
        if (fetchBlacklist) await fetchBlacklist({ force: true });
        if (triggerBlacklistFlash) triggerBlacklistFlash();
        showToast("Oggetto spostato nei rifiutati", "L'oggetto non verrà più suggerito per questa valigia.", 'success');
      } else {
        await deleteItem(id);
      }

      await fetchUserSuitcases();
      handleStateSync(action, false, activeTabId);
      pushAction(action);
    } catch (err) {
      console.error("Delete failed:", err);
      void fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, deleteItem, rejectItem, addItem, handleStateSync, pushAction, fetchUserSuitcases, fetchBlacklist, showToast, getActiveSuitcase, persistItemDisplayOrder, triggerBlacklistFlash, onDocumentDirty, onSuitcaseLocalUpdate]);

  const handleAddItemConfirmed = useCallback(async (
    suitcaseId: string,
    name: string,
    category: string,
    metadata?: AddSuitcaseItemMetadata
  ) => {
    try {
      const suitcase = getActiveSuitcase();

      if (onDocumentDirty) {
        const res = createRuntimeSuitcaseItem(suitcaseId, name, category, metadata);
        const action: UndoAction = {
          id: res.id,
          type: 'add',
          payload: { ...res },
          label: name,
          timestamp: Date.now(),
        };

        handleStateSync(action, false, activeTabId);

        if (suitcase && onSuitcaseLocalUpdate) {
          const categoryId = getCategoryId(category, suitcase.custom_categories);
          const nextOrder = appendItemToDisplayOrder(
            getItemDisplayOrder(suitcase),
            categoryId,
            name
          );
          onSuitcaseLocalUpdate(suitcaseId, {
            ui_state: withItemDisplayOrderUiState(suitcase, nextOrder),
          });
        }

        onDocumentDirty();
        pushAction(action);
        return res;
      }

      const res = await addItem(suitcaseId, name, category, metadata);
      if (res) {
        if (suitcase) {
          const categoryId = getCategoryId(category, suitcase.custom_categories);
          const nextOrder = appendItemToDisplayOrder(
            getItemDisplayOrder(suitcase),
            categoryId,
            name
          );
          await persistItemDisplayOrder(
            { ...suitcase, suitcase_items: [...(suitcase.suitcase_items ?? []), res] },
            nextOrder
          );
        }

        await fetchUserSuitcases();

        const action: UndoAction = {
          id: res.id,
          type: 'add',
          payload: { ...res },
          label: name,
          timestamp: Date.now()
        };

        handleStateSync(action, false, activeTabId);
        pushAction(action);
        return res;
      }
    } catch (err) {
      console.error("Add item failed:", err);
      void fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, addItem, handleStateSync, pushAction, fetchUserSuitcases, getActiveSuitcase, persistItemDisplayOrder, onDocumentDirty, onSuitcaseLocalUpdate]);

  const handleSwapItemsInCategory = useCallback(
    async (
      categoryId: string,
      draggedName: string,
      targetName: string,
      visibleNamesInOrder: string[]
    ) => {
      const suitcase = getActiveSuitcase();
      if (!suitcase || !activeTabId) return;

      const previousOrder = cloneItemDisplayOrder(getItemDisplayOrder(suitcase));
      const nextOrder = swapItemsInCategoryOrder(
        previousOrder,
        categoryId,
        draggedName,
        targetName,
        visibleNamesInOrder
      );

      if (isSameItemDisplayOrder(previousOrder, nextOrder)) return;

      if (onDocumentDirty && onSuitcaseLocalUpdate) {
        onSuitcaseLocalUpdate(suitcase.id, {
          ui_state: withItemDisplayOrderUiState(suitcase, nextOrder),
        });
        onDocumentDirty();
        return;
      }

      await persistItemDisplayOrder(suitcase, nextOrder);
      await fetchUserSuitcases();
    },
    [activeTabId, fetchUserSuitcases, getActiveSuitcase, onDocumentDirty, onSuitcaseLocalUpdate, persistItemDisplayOrder]
  );

  const handleRestoreFromBlacklist = useCallback(async (rejection: SuitcaseRejection) => {
    if (!activeTabId) return;
    try {
      // 1. Aggiungi alla valigia (ripristiniamo come suggerimento AI)
      const res = await addItem(activeTabId, rejection.name, rejection.category, {
        ai_suggestion_context: rejection.ai_suggestion_context,
        is_ai_suggestion: true
      });
      
      if (res) {
        if (isDraftWorkspaceId(activeTabId)) {
          removeDraftLocalRejectionById(rejection.id);
        } else {
          await removeRejectionAsync(rejection.id);
        }

        // 3. Refresh dati
        await Promise.all([
          Promise.resolve(fetchUserSuitcases()),
          ...(fetchBlacklist ? [fetchBlacklist({ force: true })] : []),
        ]);

        // 4. Registrazione Undo (Simmetrica al Reject)
        const action: UndoAction = {
          id: res.id,
          type: 'add',
          payload: { ...res },
          label: res.name,
          timestamp: Date.now(),
          inverse: async (payload) => {
            // Undo del Restore = Reject (rimuovi da valigia + aggiungi a blacklist)
            await rejectItem(activeTabId!, payload);
            handleStateSync(action, true, activeTabId);
            if (fetchBlacklist) await fetchBlacklist({ force: true });
            showToast(`Oggetto rimosso: ${payload.name}`, undefined, 'destructive');
          },
          apply: async (payload) => {
            await addItem(activeTabId!, payload.name, payload.category, {
              ...toAddItemMetadata(payload),
              is_ai_suggestion: true,
            });
            if (activeTabId && isDraftWorkspaceId(activeTabId)) {
              removeDraftLocalRejectionByName(activeTabId, payload.name);
            } else {
              await removeRejectionByNameAsync(activeTabId!, payload.name);
            }
            handleStateSync(action, false, activeTabId);
            if (fetchBlacklist) await fetchBlacklist({ force: true });
            showToast(`Oggetto ripristinato: ${payload.name}`, undefined, 'success');
          },
        };

        handleStateSync(action, false, activeTabId);
        pushAction(action);
        
        showToast("Oggetto aggiunto", "L'oggetto è stato reinserito nella valigia.", 'success');
      }
    } catch (err) {
      console.error("Restore from blacklist failed:", err);
      showToast("Errore durante il ripristino", "Riprova più tardi", 'destructive');
    }
  }, [activeTabId, addItem, rejectItem, handleStateSync, pushAction, fetchUserSuitcases, fetchBlacklist, showToast]);

  const handleRemoveFromBlacklist = useCallback(async (rejectionId: string, name: string) => {
    try {
      if (activeTabId && isDraftWorkspaceId(activeTabId)) {
        removeDraftLocalRejectionById(rejectionId);
      } else {
        await removeRejectionAsync(rejectionId);
      }
      if (fetchBlacklist) await fetchBlacklist({ force: true });
      showToast("Suggerimenti riattivati", "L'oggetto potrà essere nuovamente proposto dai suggerimenti AI.", 'success');
    } catch (err) {
      console.error("Remove from blacklist failed:", err);
      showToast("Errore durante la rimozione", "Riprova più tardi", 'destructive');
    }
  }, [activeTabId, fetchBlacklist, showToast]);

  const handleDeleteCategoryConfirmed = useCallback(
    async (target: CategoryDeleteModalTarget) => {
      const suitcaseId = target.suitcaseId ?? activeTabId;
      if (!suitcaseId) return;
      const suitcase = getSuitcaseById?.(suitcaseId);
      if (!suitcase) return;

      const snapshot = createCategoryDeleteSnapshot(suitcase, target);

      try {
        await persistCategoryDelete(suitcaseId, suitcase, target);
        await fetchUserSuitcases();

        const action: UndoAction = {
          id: `category-${target.id}`,
          payload: snapshot,
          label: target.name,
          timestamp: Date.now(),
          inverse: async (payload: CategoryDeleteSnapshot) => {
            await persistCategoryRestore(suitcaseId, payload);
            await fetchUserSuitcases();
            showToast(
              `Categoria ripristinata: ${payload.target.name}`,
              undefined,
              'success'
            );
          },
          apply: async (payload: CategoryDeleteSnapshot) => {
            const currentSuitcase = getSuitcaseById?.(suitcaseId);
            if (!currentSuitcase) return;
            await persistCategoryDelete(suitcaseId, currentSuitcase, payload.target);
            await fetchUserSuitcases();
            showToast(
              `Categoria eliminata: ${payload.target.name}`,
              undefined,
              'destructive'
            );
          },
        };

        pushAction(action);
        showToast(
          `Categoria eliminata: ${target.name}`,
          target.itemCount > 0
            ? `${target.itemCount} oggett${target.itemCount === 1 ? 'o rimosso' : 'i rimossi'}.`
            : undefined,
          'destructive'
        );
      } catch (err) {
        console.error('Delete category failed:', err);
        await fetchUserSuitcases();
        showToast(
          'Eliminazione non riuscita',
          'Non è stato possibile eliminare la categoria. Riprova.',
          'destructive'
        );
        throw err;
      }
    },
    [
      activeTabId,
      fetchUserSuitcases,
      getSuitcaseById,
      persistCategoryDelete,
      persistCategoryRestore,
      pushAction,
      showToast,
    ]
  );

  return {
    handleUpdateItemConfirmed,
    handleDeleteItemConfirmed,
    handleAddItemConfirmed,
    handleSwapItemsInCategory,
    handleDeleteCategoryConfirmed,
    handleRestoreFromBlacklist,
    handleRemoveFromBlacklist
  };
};
