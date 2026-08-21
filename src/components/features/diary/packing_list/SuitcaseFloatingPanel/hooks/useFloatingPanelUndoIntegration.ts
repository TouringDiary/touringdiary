import type { UndoAction } from '@/hooks/useUndoStack';
import type { UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import type { SuitcaseItem } from '@/types/suitcase';

import type { ToastVariant } from '@/types/toast';

interface UndoIntegrationProps {
  updateItem: (id: string, updates: UpdateSuitcaseItemDto) => Promise<void>;
  addItem: (
    suitcaseId: string,
    name: string,
    category: string,
    metadata?: Partial<SuitcaseItem>,
  ) => Promise<SuitcaseItem | undefined>;
  deleteItem: (id: string) => Promise<void>;
  fetchUserSuitcases: () => Promise<void> | void;
  setHighlightItemId: (id: string | null) => void;
  activeTabId: string | null;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
  handleStateSync: (action: UndoAction, inverse: boolean, suitcaseId: string | null) => void;
  checkDuplicateItem: (
    id: string,
    name: string,
    category: string,
    suitcaseId: string | null,
    isUndo?: boolean,
  ) => boolean;
  stack: {
    pushAction: (action: UndoAction) => void;
    undo: () => UndoAction | null;
    redo: () => UndoAction | null;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export const useFloatingPanelUndoIntegration = ({
  updateItem,
  addItem,
  deleteItem,
  fetchUserSuitcases,
  setHighlightItemId,
  activeTabId,
  showToast,
  handleStateSync,
  checkDuplicateItem,
  stack,
}: UndoIntegrationProps) => {
  return stack;
};
