import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { addSuitcaseItemsBulkAsync } from '@/services/suitcaseService';
import { saveGuestSuitcase } from '@/utils/guestSuitcaseHelper';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';

interface ActionsProps {
  currentUser: User | null;
  itineraryId: string | null;
  onClose: () => void;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  setViewMode: (v: 'selector' | 'editor') => void;
  setIsClosing: (v: boolean) => void;
  fetchLinkedIds: () => Promise<void>;
  fetchUserSuitcases: () => void;
  createSuitcase: (itId: string | null, userId: string, title: string) => Promise<Suitcase | null>;
  cloneSuitcase: (tempId: string, itId: string | null, userId: string, title?: string) => Promise<string>;
  linkSuitcaseToTrip: (itId: string, scId: string, userId: string) => Promise<void>;
  unlinkSuitcase: (itId: string, scId: string) => Promise<void>;
  deleteSuitcase: (scId: string) => Promise<void>;
  updateSuitcase: (scId: string, updates: Partial<Suitcase>) => Promise<void>;
  globalTemplates: Suitcase[];
  linkedSuitcaseIds: string[];
  mergedSuggestedItems: SuitcaseItem[];
  suggestedTemplates: Suitcase[];
  setIsMerging: (v: boolean) => void;
  setSaveStatus: (v: string | null) => void;
  setAutoOpenNewCategory: (v: boolean) => void;
  activeSuitcase: Suitcase | undefined;
  // State from external hooks
  suitcaseToDelete: string | null;
  setSuitcaseToDelete: (id: string | null) => void;
  suitcaseToUnlink: string | null;
  setSuitcaseToUnlink: (id: string | null) => void;
  isDeleting: boolean;
  setIsDeleting: (v: boolean) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (v: boolean) => void;
  tempTitle: string;
  setTempTitle: (v: string) => void;
  newSuitcaseId: string | null;
  setNewSuitcaseId: (id: string | null) => void;
  isNewSuitcaseSession: boolean;
  setIsNewSuitcaseSession: (v: boolean) => void;
  setShowAssociationModal: (v: boolean) => void;
}

export const useSuitcaseActions = ({
  currentUser,
  itineraryId,
  onClose,
  activeTabId,
  setActiveTabId,
  setViewMode,
  setIsClosing,
  fetchLinkedIds,
  fetchUserSuitcases,
  createSuitcase,
  cloneSuitcase,
  linkSuitcaseToTrip,
  unlinkSuitcase,
  deleteSuitcase,
  updateSuitcase,
  globalTemplates,
  linkedSuitcaseIds,
  mergedSuggestedItems,
  suggestedTemplates,
  setIsMerging,
  setSaveStatus,
  setAutoOpenNewCategory,
  activeSuitcase,
  suitcaseToDelete,
  setSuitcaseToDelete,
  suitcaseToUnlink,
  setSuitcaseToUnlink,
  isDeleting,
  setIsDeleting,
  isEditingTitle,
  setIsEditingTitle,
  tempTitle,
  setTempTitle,
  newSuitcaseId,
  setNewSuitcaseId,
  isNewSuitcaseSession,
  setIsNewSuitcaseSession,
  setShowAssociationModal
}: ActionsProps) => {

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 500);
  }, [onClose, setIsClosing]);

  const handleDiscardSuitcase = async () => {
    if (isNewSuitcaseSession && activeTabId) {
      await deleteSuitcase(activeTabId);
      await fetchUserSuitcases();
    }
    setViewMode('selector');
    setActiveTabId(null);
    setIsNewSuitcaseSession(false);
  };

  const handleUseSuggestedTemplates = async () => {
    if (mergedSuggestedItems.length === 0 || !currentUser) return;
    setIsMerging(true);
    try {
      const names = suggestedTemplates.map(t => t.title).join(' + ');
      const newSuitcase = await createSuitcase(null, currentUser.id, `Valigia ${names}`);

      if (newSuitcase) {
        const userId = currentUser.id;
        const rows: SuitcaseItem[] = mergedSuggestedItems.map((item, i) => ({
          id: userId === 'guest' ? `guest-item-${Date.now()}-${i}-${Math.random()}` : undefined,
          suitcase_id: newSuitcase.id,
          name: item.name,
          category: item.category,
          is_checked: false,
          is_ai_suggestion: false,
          quantity: 1
        }));

        if (userId === 'guest') {
          // Per guest, aggiorniamo il localStorage invece di Supabase
          saveGuestSuitcase({ ...newSuitcase, suitcase_items: rows });
        } else {
          await addSuitcaseItemsBulkAsync(rows);
        }

        await fetchUserSuitcases();
        setIsNewSuitcaseSession(true);
        setActiveTabId(newSuitcase.id);
        setViewMode('editor');
        setNewSuitcaseId(newSuitcase.id);
      }
    } finally {
      setIsMerging(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const template = globalTemplates.find(t => t.id === templateId);
      let newTitle = template?.title;
      if (newTitle?.startsWith('Template ')) {
        newTitle = newTitle.replace('Template ', 'Valigia ');
      }
      const userId = currentUser?.id || 'guest';
      const createdId = await cloneSuitcase(templateId, null, userId, newTitle);
      if (createdId) {
        await fetchUserSuitcases();
        setIsNewSuitcaseSession(true);
        setActiveTabId(createdId);
        setViewMode('editor');
        setNewSuitcaseId(createdId);
      }
    } catch (e) {
      console.error("Error cloning template", e);
    }
  };

  const handleLinkExisting = async (suitcaseId: string) => {
    if (!itineraryId || !currentUser) return;
    await linkSuitcaseToTrip(itineraryId, suitcaseId, currentUser.id);
    await fetchLinkedIds();
    await fetchUserSuitcases();
    setIsNewSuitcaseSession(false);
    setActiveTabId(suitcaseId);
    setViewMode('editor');
  };

  const handleUnlink = async (suitcaseId: string) => {
    if (!itineraryId) return;
    await unlinkSuitcase(itineraryId, suitcaseId);
    await fetchLinkedIds();
    await fetchUserSuitcases();
    if (activeTabId === suitcaseId) {
      setActiveTabId(null);
      setViewMode('selector');
    }
    setSuitcaseToUnlink(null);
  };

  const confirmDeleteSuitcase = async () => {
    if (!suitcaseToDelete) return;
    setIsDeleting(true);
    try {
      if (linkedSuitcaseIds.includes(suitcaseToDelete)) {
        await unlinkSuitcase(itineraryId || '', suitcaseToDelete);
      }
      await deleteSuitcase(suitcaseToDelete);
      await fetchLinkedIds();
      await fetchUserSuitcases();
      setSuitcaseToDelete(null);
      if (activeTabId === suitcaseToDelete) {
        setViewMode('selector');
        setActiveTabId(null);
        setIsNewSuitcaseSession(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmUnlinkSuitcase = async () => {
    if (!suitcaseToUnlink) return;
    setIsDeleting(true);
    try {
      await handleUnlink(suitcaseToUnlink);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSuitcaseTitle = async () => {
    if (!activeTabId || !tempTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    await updateSuitcase(activeTabId, { title: tempTitle.trim() });
    await fetchUserSuitcases();
    setIsEditingTitle(false);
    setSaveStatus("Titolo salvato");
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const startEditingTitle = () => {
    if (activeSuitcase) {
      setTempTitle(activeSuitcase.title);
      setIsEditingTitle(true);
    }
  };

  const handleBackToSelector = () => {
    if (isNewSuitcaseSession) {
      setShowAssociationModal(true);
    } else {
      setViewMode('selector');
      setAutoOpenNewCategory(false);
      setActiveTabId(null);
    }
  };

  const handleAddCategoryFromPreview = (id: string) => {
    setIsNewSuitcaseSession(false);
    setActiveTabId(id);
    setViewMode('editor');
    setAutoOpenNewCategory(true);
  };

  const handleCreateNew = async () => {
    const userId = currentUser?.id || 'guest';
    const newSuitcase = await createSuitcase(null, userId, `Nuova Valigia`);
    if (newSuitcase) {
      await fetchUserSuitcases();
      setIsNewSuitcaseSession(true);
      setActiveTabId(newSuitcase.id);
      setViewMode('editor');
      setNewSuitcaseId(newSuitcase.id);
    }
  };

  const handleCreateTemplate = async () => {
    const userId = currentUser?.id || 'guest';
    const newTemplate = await createSuitcase(null, userId, `Nuovo Template`);
    if (newTemplate) {
      await fetchUserSuitcases();
      setIsNewSuitcaseSession(true);
      setActiveTabId(newTemplate.id);
      setViewMode('editor');
      setNewSuitcaseId(newTemplate.id);
    }
  };

  return {
    handleClose,
    handleDiscardSuitcase,
    handleUseSuggestedTemplates,
    handleUseTemplate,
    handleLinkExisting,
    handleUnlink,
    confirmDeleteSuitcase,
    confirmUnlinkSuitcase,
    handleSaveSuitcaseTitle,
    startEditingTitle,
    handleAddCategoryFromPreview,
    handleCreateNew,
    handleCreateTemplate,
    handleBackToSelector,
    suitcaseToDelete,
    setSuitcaseToDelete,
    suitcaseToUnlink,
    setSuitcaseToUnlink,
    isDeleting,
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    newSuitcaseId,
    setNewSuitcaseId,
    isNewSuitcaseSession,
    setIsNewSuitcaseSession
  };
};
