import { useCallback } from 'react';
import { Suitcase, SuitcaseItem, SuitcaseRejection } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import { UndoAction } from '@/hooks/useUndoStack';

import { ToastVariant } from '@/types/toast';

interface EditorLogicProps {
  activeSuitcase: Suitcase | null;
  handleUpdateItemConfirmed: (itemId: string, updates: Partial<SuitcaseItem>, currentItem: SuitcaseItem) => Promise<void>;
  handleDeleteItemConfirmed: (itemToDelete: SuitcaseItem) => Promise<void>;
  handleAddItemConfirmed: (suitcaseId: string, name: string, category: string, metadata?: Partial<SuitcaseItem>) => Promise<any>;
  handleRestoreFromBlacklist: (rejection: SuitcaseRejection) => Promise<void>;
  handleRemoveFromBlacklist: (rejectionId: string, name: string) => Promise<void>;
  modalState: any;
  panelState: any;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
  pushAction: (action: UndoAction) => void;
}

export const useSuitcaseEditorLogic = ({
  activeSuitcase,
  handleUpdateItemConfirmed,
  handleDeleteItemConfirmed,
  handleAddItemConfirmed,
  handleRestoreFromBlacklist,
  handleRemoveFromBlacklist,
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
      showToast(`"${name}" è già presente in ${cat}`, undefined, 'neutral');
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

  const onOpenBlacklist = useCallback(() => {
    modalState.setShowBlacklistModal(true);
  }, [modalState]);

  const onDeleteCategory = useCallback((category: { id: string; name: string; source: string }) => {
    if (!activeSuitcase) return;
    const itemCount =
      activeSuitcase.suitcase_items?.filter((item) => item.category === category.name).length ?? 0;
    modalState.setCategoryToDelete({
      id: category.id,
      name: category.name,
      source: category.source === 'user' ? 'user' : 'system',
      itemCount,
    });
  }, [activeSuitcase, modalState]);

  return {
    onUpdateItem,
    onDeleteItem,
    onAddItem,
    onSelectItem,
    onOpenBlacklist,
    onDeleteCategory,
    onRestoreFromBlacklist: handleRestoreFromBlacklist,
    onRemoveFromBlacklist: handleRemoveFromBlacklist
  };
};
