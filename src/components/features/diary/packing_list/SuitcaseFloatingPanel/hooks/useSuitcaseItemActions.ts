import { useCallback } from 'react';
import { SuitcaseItem } from '@/types/suitcase';
import { UndoAction } from '@/hooks/useUndoStack';

interface ItemActionsProps {
  activeTabId: string | null;
  updateItem: (id: string, updates: Partial<SuitcaseItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addItem: (suitcaseId: string, name: string, category: string, metadata?: Partial<SuitcaseItem>) => Promise<any>;
  handleStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  pushAction: (action: UndoAction) => void;
  fetchUserSuitcases: () => Promise<void> | void;
}

export const useSuitcaseItemActions = ({
  activeTabId,
  updateItem,
  deleteItem,
  addItem,
  handleStateSync,
  pushAction,
  fetchUserSuitcases
}: ItemActionsProps) => {

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
      await deleteItem(id);
      
      // 2. Forza refresh dati dal database
      await fetchUserSuitcases();

      const action: UndoAction = {
        id,
        type: 'delete',
        payload: { ...itemToDelete },
        label: itemToDelete.name,
        timestamp: Date.now()
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
  }, [activeTabId, deleteItem, handleStateSync, pushAction, fetchUserSuitcases]);

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

  return {
    handleUpdateItemConfirmed,
    handleDeleteItemConfirmed,
    handleAddItemConfirmed
  };
};
