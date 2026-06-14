import { useState } from 'react';
import { SuitcaseItem } from '@/types/suitcase';

export const useFloatingPanelModals = () => {
  const [suitcaseToDelete, setSuitcaseToDelete] = useState<string | null>(null);
  const [suitcaseToUnlink, setSuitcaseToUnlink] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SuitcaseItem | null>(null);
  const [showAssociationModal, setShowAssociationModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showDraftOverwriteModal, setShowDraftOverwriteModal] = useState(false);
  const [showPauseWorkspaceModal, setShowPauseWorkspaceModal] = useState(false);
  const [showRecommendedSuitcaseModal, setShowRecommendedSuitcaseModal] = useState(false);
  /** intent: DRAFT_OVERWRITE_* oppure templateId in attesa dopo conferma sovrascrittura draft */
  const [draftOverwriteIntent, setDraftOverwriteIntent] = useState<string | null>(null);

  return {
    suitcaseToDelete, setSuitcaseToDelete,
    suitcaseToUnlink, setSuitcaseToUnlink,
    itemToDelete, setItemToDelete,
    showAssociationModal, setShowAssociationModal,
    isDeleting, setIsDeleting,
    showBlacklistModal, setShowBlacklistModal,
    showDraftOverwriteModal, setShowDraftOverwriteModal,
    showPauseWorkspaceModal, setShowPauseWorkspaceModal,
    showRecommendedSuitcaseModal, setShowRecommendedSuitcaseModal,
    draftOverwriteIntent, setDraftOverwriteIntent,
  };
};
