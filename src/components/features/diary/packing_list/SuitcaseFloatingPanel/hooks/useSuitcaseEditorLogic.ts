import { useCallback } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import { UndoAction } from '@/hooks/useUndoStack';

interface EditorLogicProps {
  activeSuitcase: Suitcase | null;
  handleUpdateItemConfirmed: (itemId: string, updates: Partial<SuitcaseItem>, currentItem: SuitcaseItem) => Promise<void>;
  handleDeleteItemConfirmed: (itemToDelete: SuitcaseItem) => Promise<void>;
  handleAddItemConfirmed: (suitcaseId: string, name: string, category: string) => Promise<any>;
  modalState: any;
  panelState: any;
  showToast: (message: string) => void;
  pushAction: (action: UndoAction) => void;
}

export const useSuitcaseEditorLogic = ({
  activeSuitcase,
  handleUpdateItemConfirmed,
  handleDeleteItemConfirmed,
  handleAddItemConfirmed,
  modalState,
  panelState,
  showToast,
  pushAction
}: EditorLogicProps) => {

  const onUpdateItem = useCallback(async (itemId: string, updates: Partial<SuitcaseItem>) => {
    if (!activeSuitcase) return;
    const item = activeSuitcase.suitcase_items?.find(i => i.id === itemId);
    if (!item) return;

    if (updates.is_checked !== undefined) {
      panelState.setHighlightItemId(itemId);
      await handleUpdateItemConfirmed(itemId, updates, item);
    } else {
      await handleUpdateItemConfirmed(itemId, updates, item);
    }
  }, [activeSuitcase, handleUpdateItemConfirmed, panelState]);

  const onDeleteItem = useCallback((id: string) => {
    if (!activeSuitcase) return;
    const item = activeSuitcase.suitcase_items?.find(i => i.id === id);
    if (item) {
      modalState.setItemToDelete(item);
    }
  }, [activeSuitcase, modalState]);

  const onAddItem = useCallback(async (cat: string, name: string) => {
    if (!activeSuitcase) return;

    const isDuplicate = activeSuitcase.suitcase_items?.some(i => 
      normalizeItemName(i.name) === normalizeItemName(name) && i.category === cat
    );

    if (isDuplicate) {
      showToast(`"${name}" è già presente in ${cat}`);
      return;
    }

    await handleAddItemConfirmed(activeSuitcase.id, name, cat);
  }, [activeSuitcase, handleAddItemConfirmed, showToast]);

  const onSelectItem = useCallback((name: string | null) => {
    pushAction({
      id: name || 'none',
      type: 'selection',
      payload: {
        previousValue: panelState.selectedItemName,
        newValue: name,
        setter: panelState.setSelectedItemName
      },
      label: name || panelState.selectedItemName || 'Oggetto'
    });
    panelState.setSelectedItemName(name);
  }, [panelState, pushAction]);

  return {
    onUpdateItem,
    onDeleteItem,
    onAddItem,
    onSelectItem
  };
};
