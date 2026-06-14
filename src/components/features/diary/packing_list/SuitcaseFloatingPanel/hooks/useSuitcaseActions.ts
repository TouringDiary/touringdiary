import type { Dispatch, SetStateAction } from 'react';
import { User } from '@supabase/supabase-js';
import {
  getGuestSuitcase,
  hasDraftWorkspaceInStorage,
  isDraftWorkspaceId,
  abandonDraftWorkspace,
} from '@/utils/guestSuitcaseHelper';
import {
  createDraftWorkspace,
  createDraftWorkspaceFromTemplate,
  createDraftWorkspaceFromMergedItems,
  createDraftWorkspaceFromSuitcase,
  DRAFT_OVERWRITE_NEW_SUITCASE,
  DRAFT_OVERWRITE_NEW_TEMPLATE,
  DRAFT_OVERWRITE_SUGGESTED_TEMPLATES,
  DRAFT_OVERWRITE_SAVE_AS_TEMPLATE,
} from '@/hooks/suitcase/useSuitcaseCrud';
import { mergeTemplateItems } from '@/hooks/useSuitcaseSystem';
import { fetchClonedTemplateDetailsAsync } from '@/services/suitcaseService';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { SUITCASE_MODIFIED_TOAST, ToastVariant } from '@/types/toast';
import { isTdTemplate, isAssociableSuitcase, getDraftWorkspaceKind } from '@/utils/suitcaseDomain';

interface ActionsProps {
  currentUser: User | null;
  itineraryId: string | null;
  requestClose: () => void;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  setViewMode: (v: 'selector' | 'editor') => void;
  fetchLinkedIds: () => Promise<void>;
  fetchUserSuitcases: () => void | Promise<void>;
  setUserSuitcases: Dispatch<SetStateAction<Suitcase[]>>;
  createSuitcase: (itId: string | null, userId: string, title: string) => Promise<Suitcase | null>;
  cloneSuitcase: (tempId: string, itId: string | null, userId: string, title?: string) => Promise<string>;
  linkSuitcaseToTrip: (itId: string, scId: string, userId: string) => Promise<void>;
  unlinkSuitcase: (itId: string, scId: string) => Promise<void>;
  deleteSuitcase: (scId: string) => Promise<void>;
  updateSuitcase: (scId: string, updates: Partial<Suitcase>) => Promise<void>;
  globalTemplates: Suitcase[];
  userOwnedTemplates: Suitcase[];
  linkedSuitcaseIds: string[];
  mergedSuggestedItems: SuitcaseItem[];
  suggestedTemplates: Suitcase[];
  setIsMerging: (v: boolean) => void;
  setSaveStatus: (v: string | null) => void;
  setAutoOpenNewCategory: (v: boolean) => void;
  activeSuitcase: Suitcase | undefined;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
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
  isNewSuitcaseSession: boolean;
  beginNewSuitcaseSession: (suitcaseId: string) => void;
  clearNewSuitcaseSession: () => void;
  setShowAssociationModal: (v: boolean) => void;
  setShowDraftOverwriteModal: (v: boolean) => void;
  setShowRecommendedSuitcaseModal: (v: boolean) => void;
  draftOverwriteIntent: string | null;
  setDraftOverwriteIntent: (v: string | null) => void;
  handleLinkExisting: (suitcaseId: string) => Promise<void>;
}

export const useSuitcaseActions = ({
  currentUser,
  itineraryId,
  requestClose,
  activeTabId,
  setActiveTabId,
  setViewMode,
  fetchLinkedIds,
  fetchUserSuitcases,
  setUserSuitcases,
  createSuitcase,
  cloneSuitcase,
  linkSuitcaseToTrip,
  unlinkSuitcase,
  deleteSuitcase,
  updateSuitcase,
  globalTemplates,
  userOwnedTemplates,
  linkedSuitcaseIds,
  mergedSuggestedItems,
  suggestedTemplates,
  setIsMerging,
  setSaveStatus,
  setAutoOpenNewCategory,
  activeSuitcase,
  showToast,
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
  isNewSuitcaseSession,
  beginNewSuitcaseSession,
  clearNewSuitcaseSession,
  setShowAssociationModal,
  setShowDraftOverwriteModal,
  setShowRecommendedSuitcaseModal,
  draftOverwriteIntent,
  setDraftOverwriteIntent,
  handleLinkExisting
}: ActionsProps) => {

  const openNewSuitcaseEditor = (suitcase: Suitcase) => {
    setUserSuitcases((prev) => [
      suitcase,
      ...prev.filter((s) => !isDraftWorkspaceId(s.id) && s.id !== suitcase.id),
    ]);
    beginNewSuitcaseSession(suitcase.id);
    void fetchUserSuitcases();
  };

  const allResolvableTemplates = [...globalTemplates, ...userOwnedTemplates];

  const resolveTemplateDetails = async (templateId: string): Promise<Suitcase | null> => {
    const cached = allResolvableTemplates.find((t) => t.id === templateId);
    if (cached) return cached;
    return fetchClonedTemplateDetailsAsync(templateId);
  };

  const openTemplateAsDraftWorkspace = async (templateId: string) => {
    const template = await resolveTemplateDetails(templateId);
    if (!template) return;

    const userId = currentUser?.id || 'guest';
    const isGuest = userId === 'guest' || !currentUser;

    if (isGuest) {
      let newTitle = template.title;
      if (newTitle?.startsWith('Template ')) {
        newTitle = newTitle.replace('Template ', 'Valigia ');
      }
      await cloneSuitcase(templateId, null, userId, newTitle);
      const draftSc = getGuestSuitcase();
      if (draftSc) {
        await fetchUserSuitcases();
        openNewSuitcaseEditor(draftSc);
      }
      return;
    }

    const draft = createDraftWorkspaceFromTemplate(userId, template);
    openNewSuitcaseEditor(draft);
  };

  const openMergedTemplatesAsDraftWorkspace = async (templates: Suitcase[]) => {
    if (!currentUser || templates.length === 0) return;

    const mergedItems = mergeTemplateItems(templates);
    const names = templates.map((t) => t.title).join(' + ');
    const icon = templates[0]?.icon ?? '🎒';
    const draft = createDraftWorkspaceFromMergedItems(
      currentUser.id,
      `Valigia ${names}`,
      mergedItems,
      icon
    );
    openNewSuitcaseEditor(draft);
  };

  const createAndOpenNewSuitcase = async () => {
    const userId = currentUser?.id || 'guest';
    const isGuest = userId === 'guest' || !currentUser;

    if (isGuest) {
      const newSuitcase = await createSuitcase(null, userId, 'Nuova Valigia');
      if (newSuitcase) {
        openNewSuitcaseEditor(newSuitcase);
      }
      return;
    }

    const draft = createDraftWorkspace(userId, 'Nuova Valigia', '🎒', 'suitcase');
    openNewSuitcaseEditor(draft);
  };

  const createAndOpenNewTemplate = async () => {
    const userId = currentUser?.id || 'guest';
    const isGuest = userId === 'guest' || !currentUser;

    if (isGuest) {
      const newTemplate = await createSuitcase(null, userId, 'Nuovo Template');
      if (newTemplate) {
        openNewSuitcaseEditor(newTemplate);
      }
      return;
    }

    const draft = createDraftWorkspace(userId, 'Nuovo Template', '🎒', 'user_template');
    openNewSuitcaseEditor(draft);
  };

  const handleDiscardSuitcase = async () => {
    if (activeTabId && isDraftWorkspaceId(activeTabId)) {
      try {
        abandonDraftWorkspace();
        await fetchUserSuitcases();
        showToast(
          'Modifiche non salvate',
          'La bozza locale è stata abbandonata.',
          'success'
        );
      } catch (err) {
        console.error('Error abandoning draft workspace:', err);
        showToast(
          'Operazione non riuscita',
          'Non è stato possibile abbandonare la bozza. Riprova.',
          'destructive'
        );
        return;
      }
    }
    clearNewSuitcaseSession();
    setViewMode('selector');
    setActiveTabId(null);
  };

  const handleUseSuggestedTemplates = async () => {
    if (mergedSuggestedItems.length === 0 || !currentUser) return;
    setIsMerging(true);
    try {
      if (hasDraftWorkspaceInStorage()) {
        setDraftOverwriteIntent(DRAFT_OVERWRITE_SUGGESTED_TEMPLATES);
        setShowDraftOverwriteModal(true);
        return;
      }
      await openMergedTemplatesAsDraftWorkspace(suggestedTemplates);
    } finally {
      setIsMerging(false);
    }
  };

  const handleOpenRecommendedSuitcase = () => {
    if (!currentUser) {
      showToast(
        'Accesso richiesto',
        'Effettua il login per usare la Valigia Consigliata.',
        'destructive'
      );
      return;
    }
    setShowRecommendedSuitcaseModal(true);
  };

  const handleConfirmRecommendedSuitcase = async (selectedTemplates: Suitcase[]) => {
    if (!currentUser || selectedTemplates.length === 0) return;
    setIsMerging(true);
    try {
      if (hasDraftWorkspaceInStorage()) {
        setDraftOverwriteIntent(DRAFT_OVERWRITE_SUGGESTED_TEMPLATES);
        setShowDraftOverwriteModal(true);
        setShowRecommendedSuitcaseModal(false);
        return;
      }
      setShowRecommendedSuitcaseModal(false);
      await openMergedTemplatesAsDraftWorkspace(selectedTemplates);
    } finally {
      setIsMerging(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      if (hasDraftWorkspaceInStorage()) {
        setDraftOverwriteIntent(templateId);
        setShowDraftOverwriteModal(true);
        return;
      }
      await openTemplateAsDraftWorkspace(templateId);
    } catch (e) {
      console.error('Error opening template as draft workspace', e);
    }
  };

  const handleSaveAsTemplate = async (suitcaseId: string) => {
    if (!currentUser) return;

    const source = await fetchClonedTemplateDetailsAsync(suitcaseId);

    if (!source || !isAssociableSuitcase(source)) {
      showToast(
        'Operazione non disponibile',
        'Solo le valigie possono essere salvate come template.',
        'destructive'
      );
      return;
    }

    if (hasDraftWorkspaceInStorage()) {
      setDraftOverwriteIntent(`${DRAFT_OVERWRITE_SAVE_AS_TEMPLATE}:${suitcaseId}`);
      setShowDraftOverwriteModal(true);
      return;
    }

    const draft = createDraftWorkspaceFromSuitcase(
      currentUser.id,
      source,
      'user_template'
    );
    openNewSuitcaseEditor(draft);
  };

  const handleUnlink = async (suitcaseId: string) => {
    if (!itineraryId) return;
    await unlinkSuitcase(itineraryId, suitcaseId);
    await fetchLinkedIds();
    await fetchUserSuitcases();
    setSuitcaseToUnlink(null);
    showToast("Valigia rimossa dal diario", "La valigia resta salvata tra le tue valigie personali.", 'success');
  };

  const confirmDeleteSuitcase = async () => {
    if (!suitcaseToDelete) return;
    const wasDraft = isDraftWorkspaceId(suitcaseToDelete);
    setIsDeleting(true);
    try {
      if (linkedSuitcaseIds.includes(suitcaseToDelete)) {
        await unlinkSuitcase(itineraryId || '', suitcaseToDelete);
      }
      await deleteSuitcase(suitcaseToDelete);
      await fetchLinkedIds();
      await fetchUserSuitcases();
      setSuitcaseToDelete(null);
      if (activeTabId === suitcaseToDelete || newSuitcaseId === suitcaseToDelete) {
        clearNewSuitcaseSession();
        setViewMode('selector');
        setActiveTabId(null);
      }
      showToast(
        wasDraft ? 'Bozza eliminata' : 'Eliminato',
        wasDraft
          ? 'La workspace in pausa è stata rimossa.'
          : 'L\'elemento è stato eliminato dal tuo profilo.',
        'success'
      );
    } catch (err) {
      console.error('Error deleting suitcase:', err);
      showToast(
        'Eliminazione non riuscita',
        'Non è stato possibile eliminare. Riprova.',
        'destructive'
      );
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
    showToast(
      SUITCASE_MODIFIED_TOAST.message,
      SUITCASE_MODIFIED_TOAST.description,
      'success'
    );
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

  const handleContinueGuestWorkspace = () => {
    const draftSc = getGuestSuitcase();
    if (!draftSc?.id || !isDraftWorkspaceId(draftSc.id)) return;
    beginNewSuitcaseSession(draftSc.id);
    setViewMode('editor');
    setActiveTabId(draftSc.id);
  };

  const handleAddCategoryFromPreview = (id: string) => {
    const target = allResolvableTemplates.find((t) => t.id === id);
    if (target && isTdTemplate(target)) {
      showToast(
        'Template di sistema',
        'I template TD non sono modificabili. Usa «Usa template» per creare una valigia.',
        'neutral'
      );
      return;
    }

    clearNewSuitcaseSession();
    setActiveTabId(id);
    setViewMode('editor');
    setAutoOpenNewCategory(true);
  };

  const handleCreateNew = async () => {
    if (hasDraftWorkspaceInStorage()) {
      setDraftOverwriteIntent(DRAFT_OVERWRITE_NEW_SUITCASE);
      setShowDraftOverwriteModal(true);
      return;
    }
    await createAndOpenNewSuitcase();
  };

  const handleConfirmDraftOverwrite = async () => {
    setShowDraftOverwriteModal(false);
    const intent = draftOverwriteIntent;
    setDraftOverwriteIntent(null);

    const existing = getGuestSuitcase();
    if (existing?.id && isDraftWorkspaceId(existing.id)) {
      await deleteSuitcase(existing.id);
      await fetchUserSuitcases();
    }

    if (intent === DRAFT_OVERWRITE_NEW_TEMPLATE) {
      await createAndOpenNewTemplate();
      return;
    }
    if (intent === DRAFT_OVERWRITE_SUGGESTED_TEMPLATES) {
      await openMergedTemplatesAsDraftWorkspace(suggestedTemplates);
      return;
    }
    if (intent?.startsWith(`${DRAFT_OVERWRITE_SAVE_AS_TEMPLATE}:`)) {
      const suitcaseId = intent.split(':')[1];
      if (suitcaseId && currentUser) {
        const source = await fetchClonedTemplateDetailsAsync(suitcaseId);
        if (source) {
          const draft = createDraftWorkspaceFromSuitcase(
            currentUser.id,
            source,
            'user_template'
          );
          openNewSuitcaseEditor(draft);
        }
      }
      return;
    }
    if (intent && intent !== DRAFT_OVERWRITE_NEW_SUITCASE) {
      await openTemplateAsDraftWorkspace(intent);
      return;
    }
    await createAndOpenNewSuitcase();
  };

  const handleCreateTemplate = async () => {
    if (hasDraftWorkspaceInStorage()) {
      setDraftOverwriteIntent(DRAFT_OVERWRITE_NEW_TEMPLATE);
      setShowDraftOverwriteModal(true);
      return;
    }
    await createAndOpenNewTemplate();
  };

  const isTemplateDraftSession = activeSuitcase
    ? getDraftWorkspaceKind(activeSuitcase) === 'user_template'
    : false;

  return {
    handleClose: requestClose,
    handleDiscardSuitcase,
    handleUseSuggestedTemplates,
    handleOpenRecommendedSuitcase,
    handleConfirmRecommendedSuitcase,
    handleUseTemplate,
    handleSaveAsTemplate,
    handleLinkExisting,
    handleUnlink,
    confirmDeleteSuitcase,
    confirmUnlinkSuitcase,
    handleSaveSuitcaseTitle,
    startEditingTitle,
    handleAddCategoryFromPreview,
    handleCreateNew,
    handleConfirmDraftOverwrite,
    handleCreateTemplate,
    handleBackToSelector,
    handleContinueGuestWorkspace,
    isTemplateDraftSession,
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
    isNewSuitcaseSession
  };
};
