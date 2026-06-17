import { useCallback } from 'react';
import { Suitcase, SuitcaseItem, SuitcaseRejection } from '@/types/suitcase';
import { UndoAction } from '@/hooks/useUndoStack';
import { ToastVariant } from '@/types/toast';
import { removeRejectionAsync, removeRejectionByNameAsync } from '@/services/suitcase/suitcaseRejectionsService';
import {
  isDraftWorkspaceId,
  isDraftItemId,
  removeDraftLocalRejectionById,
  removeDraftLocalRejectionByName,
} from '@/utils/guestSuitcaseHelper';
import type { CategoryDeleteModalTarget } from './useFloatingPanelModals';
import {
  computeCategoryDeleteUpdates,
  computeCategoryRestoreUpdates,
  createCategoryDeleteSnapshot,
  getItemsRemovedByCategoryDelete,
  type CategoryDeleteSnapshot,
} from '@/utils/suitcaseCategoryDelete';

interface ItemActionsProps {
  activeTabId: string | null;
  updateItem: (id: string, updates: Partial<SuitcaseItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  rejectItem: (suitcaseId: string, item: SuitcaseItem) => Promise<void>;
  addItem: (suitcaseId: string, name: string, category: string, metadata?: Partial<SuitcaseItem>) => Promise<any>;
  updateSuitcase: (suitcaseId: string, updates: Partial<Suitcase>) => Promise<void>;
  getActiveSuitcase: () => Suitcase | undefined;
  handleStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  pushAction: (action: UndoAction) => void;
  fetchUserSuitcases: () => Promise<void> | void;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
  fetchBlacklist?: () => Promise<void>;
  triggerBlacklistFlash?: () => void;
}

export const useSuitcaseItemActions = ({
  activeTabId,
  updateItem,
  deleteItem,
  rejectItem,
  addItem,
  updateSuitcase,
  getActiveSuitcase,
  handleStateSync,
  pushAction,
  fetchUserSuitcases,
  showToast,
  fetchBlacklist,
  triggerBlacklistFlash
}: ItemActionsProps) => {

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
              item.id && !isDraftItemId(item.id) && !item.id.startsWith('temp-')
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

      for (const item of removedItems) {
        await addItem(suitcaseId, item.name, item.category, {
          is_checked: item.is_checked,
          is_ai_suggestion: item.is_ai_suggestion,
          quantity: item.quantity,
          ai_suggestion_context: item.ai_suggestion_context,
          suggested_at: item.suggested_at,
        });
      }
    },
    [addItem, updateSuitcase]
  );

  const handleUpdateItemConfirmed = useCallback(async (itemId: string, updates: Partial<SuitcaseItem>, currentItem: SuitcaseItem) => {
    try {
      if (updates.is_checked !== undefined) {
        // 1. Persistenza DB
        await updateItem(itemId, updates);
        
        // 2. Forza refresh dati dal database PRIMA del sync
        await fetchUserSuitcases();

        // 3. Preparazione azione per logica locale
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

        // 4. Aggiornamento stato locale (Sync post-conferma)
        handleStateSync(action, false, activeTabId);

        // 5. Registrazione nello stack Undo
        console.log("[UndoStack] registering action:", action);
        pushAction(action);
      } else if (updates.accepted_from_ai === true) {
        // 1. Persistenza DB (accepted_from_ai=true, is_ai_suggestion=false)
        await updateItem(itemId, updates);
        
        // 2. Refresh dati
        await fetchUserSuitcases();

        // 3. Sync locale immediato
        const action: UndoAction = {
          id: itemId,
          type: 'update',
          payload: {
            field: 'accepted_from_ai',
            previousValue: false,
            newValue: true,
            // Includiamo anche is_ai_suggestion nel sync locale se necessario
            extraUpdates: { is_ai_suggestion: false }
          },
          label: currentItem.name,
          timestamp: Date.now()
        };
        handleStateSync(action, false, activeTabId);

        // 4. Feedback visivo
        showToast("Oggetto aggiunto", "L'oggetto è stato aggiunto alla valigia.", 'success');
      } else {
        await updateItem(itemId, updates);
        await fetchUserSuitcases();
      }
    } catch (err) {
      console.error("Update failed:", err);
      fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, updateItem, handleStateSync, pushAction, fetchUserSuitcases]);

  const handleDeleteItemConfirmed = useCallback(async (itemToDelete: SuitcaseItem) => {
    try {
      const id = itemToDelete.id;
      
      // 1. Persistenza DB
      if (itemToDelete.is_ai_suggestion && activeTabId) {
        await rejectItem(activeTabId, itemToDelete);
        // Dopo un rifiuto, aggiorniamo anche la blacklist locale e attiviamo il flash
        if (fetchBlacklist) await fetchBlacklist();
        if (triggerBlacklistFlash) triggerBlacklistFlash();
        showToast("Oggetto spostato nei rifiutati", "L'oggetto non verrà più suggerito per questa valigia.", 'success');
      } else {
        await deleteItem(id);
      }
      
      // 2. Forza refresh dati dal database
      await fetchUserSuitcases();

      const action: UndoAction = {
        id,
        type: 'delete',
        payload: { ...itemToDelete },
        label: itemToDelete.name,
        timestamp: Date.now(),
        // Command Pattern per gestire la coerenza della blacklist durante Undo/Redo
        ...(itemToDelete.is_ai_suggestion ? {
          inverse: async (payload) => {
            await addItem(activeTabId!, payload.name, payload.category, { ...payload, id: payload.id });
            if (activeTabId && isDraftWorkspaceId(activeTabId)) {
              removeDraftLocalRejectionByName(activeTabId, payload.name);
            } else {
              await removeRejectionByNameAsync(activeTabId!, payload.name);
            }
            handleStateSync(action, true, activeTabId);
            if (fetchBlacklist) await fetchBlacklist();
            showToast(`Suggerimento ripristinato: ${payload.name}`, undefined, 'success');
          },
          apply: async (payload) => {
            // 1. Riesegui il reject (aggiunge a blacklist e rimuove da valigia)
            await rejectItem(activeTabId!, payload);
            // 2. Sincronizza lo stato locale e UI
            handleStateSync(action, false, activeTabId);
            if (fetchBlacklist) await fetchBlacklist();
            showToast(`Suggerimento rimosso: ${payload.name}`, undefined, 'destructive');
          }
        } : {})
      };

      // 3. Aggiornamento stato locale (Sync)
      handleStateSync(action, false, activeTabId);

      // 4. Registrazione nello stack Undo
      console.log("[UndoStack] registering action:", action);
      pushAction(action);
    } catch (err) {
      console.error("Delete failed:", err);
      fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, deleteItem, rejectItem, addItem, handleStateSync, pushAction, fetchUserSuitcases, fetchBlacklist, showToast]);

  const handleAddItemConfirmed = useCallback(async (suitcaseId: string, name: string, category: string) => {
    try {
      // 1. Persistenza DB
      const res = await addItem(suitcaseId, name, category); 
      if (res) {
        // 2. Forza refresh dati dal database
        await fetchUserSuitcases();

        const action: UndoAction = {
          id: res.id,
          type: 'add',
          payload: { ...res },
          label: name,
          timestamp: Date.now()
        };

        // 3. Aggiornamento stato locale (Sync)
        handleStateSync(action, false, activeTabId);

        // 4. Registrazione nello stack Undo
        console.log("[UndoStack] registering action:", action);
        pushAction(action);
        return res;
      }
    } catch (err) {
      console.error("Add item failed:", err);
      fetchUserSuitcases();
      throw err;
    }
  }, [activeTabId, addItem, handleStateSync, pushAction, fetchUserSuitcases]);

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
        await fetchUserSuitcases();
        if (fetchBlacklist) await fetchBlacklist();

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
            if (fetchBlacklist) await fetchBlacklist();
            showToast(`Oggetto rimosso: ${payload.name}`, undefined, 'destructive');
          },
          apply: async (payload) => {
            await addItem(activeTabId!, payload.name, payload.category, {
              ...payload,
              id: payload.id,
              is_ai_suggestion: true,
            });
            if (activeTabId && isDraftWorkspaceId(activeTabId)) {
              removeDraftLocalRejectionByName(activeTabId, payload.name);
            } else {
              await removeRejectionByNameAsync(activeTabId!, payload.name);
            }
            handleStateSync(action, false, activeTabId);
            if (fetchBlacklist) await fetchBlacklist();
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
      if (fetchBlacklist) await fetchBlacklist();
      showToast("Suggerimenti riattivati", "L'oggetto potrà essere nuovamente proposto dai suggerimenti AI.", 'success');
    } catch (err) {
      console.error("Remove from blacklist failed:", err);
      showToast("Errore durante la rimozione", "Riprova più tardi", 'destructive');
    }
  }, [activeTabId, fetchBlacklist, showToast]);

  const handleDeleteCategoryConfirmed = useCallback(
    async (target: CategoryDeleteModalTarget) => {
      if (!activeTabId) return;
      const suitcase = getActiveSuitcase();
      if (!suitcase) return;

      const snapshot = createCategoryDeleteSnapshot(suitcase, target);

      try {
        await persistCategoryDelete(activeTabId, suitcase, target);
        await fetchUserSuitcases();

        const action: UndoAction = {
          id: `category-${target.id}`,
          payload: snapshot,
          label: target.name,
          timestamp: Date.now(),
          inverse: async (payload: CategoryDeleteSnapshot) => {
            await persistCategoryRestore(activeTabId, payload);
            await fetchUserSuitcases();
            showToast(
              `Categoria ripristinata: ${payload.target.name}`,
              undefined,
              'success'
            );
          },
          apply: async (payload: CategoryDeleteSnapshot) => {
            const currentSuitcase = getActiveSuitcase();
            if (!currentSuitcase) return;
            await persistCategoryDelete(activeTabId, currentSuitcase, payload.target);
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
      getActiveSuitcase,
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
    handleDeleteCategoryConfirmed,
    handleRestoreFromBlacklist,
    handleRemoveFromBlacklist
  };
};
