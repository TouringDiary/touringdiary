import { useState } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import type { CategoryDeleteTarget } from '@/utils/suitcaseCategoryDelete';
import type { DraftWorkspaceKind } from '@/types/suitcase';

export type CategoryDeleteModalTarget = CategoryDeleteTarget & {
  itemCount: number;
  suitcaseId?: string;
};

export interface PendingWorkspaceCreate {
  kind: DraftWorkspaceKind;
  title: string;
  icon: string;
}

export const useFloatingPanelModals = () => {
  const [suitcaseToDelete, setSuitcaseToDelete] = useState<string | null>(null);
  const [suitcaseToUnlink, setSuitcaseToUnlink] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SuitcaseItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDeleteModalTarget | null>(null);
  const [showAssociationModal, setShowAssociationModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showDraftOverwriteModal, setShowDraftOverwriteModal] = useState(false);
  const [showPauseWorkspaceModal, setShowPauseWorkspaceModal] = useState(false);
  const [showRecommendedSuitcaseModal, setShowRecommendedSuitcaseModal] = useState(false);
  const [showCategorySetupModal, setShowCategorySetupModal] = useState(false);
  const [pendingWorkspaceCreate, setPendingWorkspaceCreate] = useState<PendingWorkspaceCreate | null>(null);
  const [isCreatingFromConfiguration, setIsCreatingFromConfiguration] = useState(false);
  const [suitcaseToAssociate, setSuitcaseToAssociate] = useState<string | null>(null);
  /** intent: DRAFT_OVERWRITE_* oppure templateId in attesa dopo conferma sovrascrittura draft */
  const [draftOverwriteIntent, setDraftOverwriteIntent] = useState<string | null>(null);
  /** Sorgenti merge scelte dall'utente in attesa dopo conferma sovrascrittura draft */
  const [pendingMergeSources, setPendingMergeSources] = useState<Suitcase[] | null>(null);

  return {
    suitcaseToDelete, setSuitcaseToDelete,
    suitcaseToUnlink, setSuitcaseToUnlink,
    itemToDelete, setItemToDelete,
    categoryToDelete, setCategoryToDelete,
    showAssociationModal, setShowAssociationModal,
    isDeleting, setIsDeleting,
    showBlacklistModal, setShowBlacklistModal,
    showDraftOverwriteModal, setShowDraftOverwriteModal,
    showPauseWorkspaceModal, setShowPauseWorkspaceModal,
    showRecommendedSuitcaseModal, setShowRecommendedSuitcaseModal,
    showCategorySetupModal, setShowCategorySetupModal,
    pendingWorkspaceCreate, setPendingWorkspaceCreate,
    isCreatingFromConfiguration, setIsCreatingFromConfiguration,
    suitcaseToAssociate, setSuitcaseToAssociate,
    draftOverwriteIntent, setDraftOverwriteIntent,
    pendingMergeSources, setPendingMergeSources,
  };
};
