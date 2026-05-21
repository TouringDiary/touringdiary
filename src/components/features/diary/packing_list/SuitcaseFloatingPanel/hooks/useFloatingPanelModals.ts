import { useState } from 'react';
import { SuitcaseItem } from '@/types/suitcase';

export const useFloatingPanelModals = () => {
  const [suitcaseToDelete, setSuitcaseToDelete] = useState<string | null>(null);
  const [suitcaseToUnlink, setSuitcaseToUnlink] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SuitcaseItem | null>(null);
  const [showAssociationModal, setShowAssociationModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return {
    suitcaseToDelete, setSuitcaseToDelete,
    suitcaseToUnlink, setSuitcaseToUnlink,
    itemToDelete, setItemToDelete,
    showAssociationModal, setShowAssociationModal,
    isLinking, setIsLinking,
    isDeleting, setIsDeleting
  };
};
