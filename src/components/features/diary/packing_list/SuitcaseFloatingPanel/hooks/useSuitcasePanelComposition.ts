import { useCallback, useEffect } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUndoStack } from '@/hooks/useUndoStack';
import { buildProductAffiliateLink, buildAffiliateLink, getPartnerById, resolveBestPartner } from '@/services/partnerIntegrationService';
import { checkDuplicateItem } from '../utils/duplicateCheck';
import { useSuitcaseActions } from './useSuitcaseActions';
import { useSuitcaseEditorLogic } from './useSuitcaseEditorLogic';
import { useSuitcaseHiddenCategories } from './useSuitcaseHiddenCategories';
import { useSuitcaseItemActions } from './useSuitcaseItemActions';
import { useSuitcasePanelData } from './useSuitcasePanelData';
import { useSuitcaseUndo } from './useSuitcaseUndo';
import { useSuitcaseUndoHandlers } from './useSuitcaseUndoHandlers';
import { getSuitcaseItemProgress } from '../../suitcase/SuitcaseUtils';
import { useSuitcaseAssociationFlow } from './useSuitcaseAssociationFlow';
import { hasDraftWorkspaceInStorage, isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import { SUITCASE_MODIFIED_TOAST } from '@/types/toast';

interface UseSuitcasePanelCompositionOptions {
  itineraryId: string | null;
  cityType?: string;
  suitcaseId?: string | null;
  requestClose: () => void;
  registerCloseAttempt?: (handler: () => void) => void;
}

export function useSuitcasePanelComposition({
  itineraryId: propItineraryId,
  cityType,
  suitcaseId,
  requestClose,
  registerCloseAttempt,
}: UseSuitcasePanelCompositionOptions) {
  const data = useSuitcasePanelData(propItineraryId, cityType, suitcaseId);
  const { openModal } = useModal();

  const {
    pushAction,
    undo,
    redo,
    resetStack,
    canUndo,
    canRedo,
    hasPersistentUndo,
    beginExecution,
    endExecution,
    isExecuting,
  } = useUndoStack(30);

  const { activeTabId, setSelectedItemName, viewMode } = data.panelState;

  useEffect(() => {
    resetStack();
    setSelectedItemName(null);
  }, [activeTabId, resetStack, setSelectedItemName]);

  const hiddenCategories = useSuitcaseHiddenCategories({
    activeSuitcase: data.activeSuitcase,
    onUpdateCategoryVisibility: (patch) => {
      if (data.activeSuitcase?.id) {
        data.handleUpdateSuitcaseLocal(data.activeSuitcase.id, {
          ui_state: {
            ...data.activeSuitcase.ui_state,
            category_setup: patch.category_setup,
            hidden_category_ids: patch.hidden_category_ids,
          },
        });
      }
    },
  });

  useSuitcaseUndoHandlers({
    ...data.mutations,
    fetchUserSuitcases: data.fetchUserSuitcases,
    setHighlightItemId: data.panelState.setHighlightItemId,
    activeTabId: data.panelState.activeTabId,
    showToast: data.showToast,
    handleStateSync: data.handleStateSync,
    checkDuplicateItem: (id, name, cat, scId, isUndo) => checkDuplicateItem(
      id, name, cat, scId, data.panelState.activeTabId, data.userSuitcasesRef.current, isUndo
    ),
    stack: { pushAction, undo, redo, canUndo, canRedo },
  });

  const { performUndo, performRedo } = useSuitcaseUndo({
    undo,
    redo,
    isExecuting,
    beginExecution,
    endExecution,
    viewMode,
    ...data.mutations,
    fetchUserSuitcases: data.fetchUserSuitcases,
    setHighlightItemId: data.panelState.setHighlightItemId,
    activeSuitcaseId: activeTabId,
    onShowToast: data.showToast,
    onStateSync: data.handleStateSync,
    onCheckDuplicate: (id, name, cat, scId, isUndo) => checkDuplicateItem(
      id, name, cat, scId, data.panelState.activeTabId, data.userSuitcasesRef.current, isUndo
    ),
  });

  const itemActions = useSuitcaseItemActions({
    activeTabId: data.panelState.activeTabId,
    ...data.mutations,
    getActiveSuitcase: () => {
      const id = data.panelState.activeTabId;
      if (!id) return undefined;
      return (
        data.userSuitcasesRef.current.find((suitcase) => suitcase.id === id) ??
        data.globalTemplates.find((template) => template.id === id)
      );
    },
    handleStateSync: data.handleStateSync,
    pushAction,
    fetchUserSuitcases: data.fetchUserSuitcases,
    showToast: data.showToast,
    fetchBlacklist: data.fetchBlacklist,
    triggerBlacklistFlash: data.triggerBlacklistFlash,
  });

  const editorLogic = useSuitcaseEditorLogic({
    activeSuitcase: data.activeSuitcase,
    ...itemActions,
    modalState: data.modalState,
    panelState: data.panelState,
    showToast: data.showToast,
    pushAction,
  });

  const handleLogin = () => {
    requestAnimationFrame(() => {
      openModal('auth', {
        returnTo: 'packingList',
        returnProps: { itineraryId: propItineraryId },
      });
    });
  };

  const associationFlow = useSuitcaseAssociationFlow({
    itinerary: data.itinerary,
    savedProjects: data.savedProjects,
    itineraryId: data.itineraryId,
    isDiaryAssociable: data.isDiaryAssociable,
    currentUser: data.currentUser,
    userSuitcases: data.userSuitcases,
    guestSuitcase: data.guestSuitcase,
    saveProject: (name) => data.saveProject(name),
    persistGuestSuitcase: (userId, title) =>
      data.mutations.persistGuestSuitcase(userId, null, title),
    linkSuitcaseToTrip: data.mutations.linkSuitcaseToTrip,
    fetchLinkedIds: data.fetchLinkedIds,
    fetchUserSuitcases: data.fetchUserSuitcases,
    clearNewSuitcaseSession: data.panelState.clearNewSuitcaseSession,
    setShowAssociationModal: data.modalState.setShowAssociationModal,
    setActiveTabId: data.panelState.setActiveTabId,
    setViewMode: data.panelState.setViewMode,
    showToast: data.showToast,
    onLoginRequired: handleLogin,
  });

  const requestWorkspacePause = useCallback(() => {
    const m = data.modalState;
    if (m.showPauseWorkspaceModal) return;
    if (m.showAssociationModal) return;
    if (m.showDraftOverwriteModal) return;
    if (m.showCategorySetupModal) return;
    if (m.suitcaseToDelete !== null || m.suitcaseToUnlink !== null) return;
    if (m.itemToDelete !== null) return;
    if (m.categoryToDelete !== null) return;
    if (m.showBlacklistModal) return;
    if (associationFlow.linkModalOpen) return;

    const hasActiveEditingSession =
      hasDraftWorkspaceInStorage() ||
      (data.panelState.viewMode === 'editor' && data.panelState.activeTabId !== null);

    if (!hasActiveEditingSession) {
      requestClose();
      return;
    }

    m.setShowPauseWorkspaceModal(true);
  }, [
    associationFlow.linkModalOpen,
    data.modalState,
    data.panelState.activeTabId,
    data.panelState.viewMode,
    requestClose,
  ]);

  useEffect(() => {
    registerCloseAttempt?.(requestWorkspacePause);
  }, [registerCloseAttempt, requestWorkspacePause]);

  const handleConfirmWorkspacePause = useCallback(() => {
    data.modalState.setShowPauseWorkspaceModal(false);
    requestClose();
  }, [data.modalState, requestClose]);

  const handleCancelWorkspacePause = useCallback(() => {
    data.modalState.setShowPauseWorkspaceModal(false);
  }, [data.modalState]);

  const handleConfirmAssociateSaved = useCallback(async () => {
    const suitcaseId = data.modalState.suitcaseToAssociate;
    if (!suitcaseId) return;

    await associationFlow.requestAssociation(suitcaseId, {
      successNavigation: 'selector',
      successToast: {
        message: 'Valigia associata al diario',
        description: 'La valigia è stata spostata nella sezione Diario.',
      },
      onBeforeLinkModal: () => data.modalState.setSuitcaseToAssociate(null),
      onSuccess: () => {
        data.modalState.setSuitcaseToAssociate(null);
        data.panelState.setSourceTab('trip');
      },
    });
  }, [associationFlow, data.modalState, data.panelState]);

  const actions = useSuitcaseActions({
    ...data,
    ...data.panelState,
    ...data.modalState,
    ...data.mutations,
    requestClose: requestWorkspacePause,
    handleLinkExisting: associationFlow.handleLinkExisting,
  });

  const handleBackToSelector = useCallback(() => {
    const isExistingPersisted =
      activeTabId &&
      !isDraftWorkspaceId(activeTabId) &&
      !data.panelState.isNewSuitcaseSession;

    if (isExistingPersisted && hasPersistentUndo) {
      data.showToast(
        SUITCASE_MODIFIED_TOAST.message,
        SUITCASE_MODIFIED_TOAST.description,
        'success'
      );
    }

    actions.handleBackToSelector();
  }, [
    actions,
    activeTabId,
    data.panelState.isNewSuitcaseSession,
    data.showToast,
    hasPersistentUndo,
  ]);

  const isDataReady = !data.isLoadingUser && data.linkedSuitcaseIds !== null;
  const showLoadingShell = !isDataReady && data.panelState.viewMode === 'selector';

  const handleConfirmAssociation = async () => {
    if (!data.panelState.newSuitcaseId || !data.itineraryId || !data.currentUser) return;
    if (actions.isTemplateDraftSession) return;
    await associationFlow.requestAssociation(data.panelState.newSuitcaseId, {
      successNavigation: 'selector',
      closeAssociationModal: true,
    });
  };

  const handleSaveOnly = async () => {
    if (!data.panelState.newSuitcaseId || !data.currentUser) return;
    const wasDraft = isDraftWorkspaceId(data.panelState.newSuitcaseId);
    const isTemplateDraft = actions.isTemplateDraftSession;
    try {
      if (wasDraft) {
        const persisted = await data.mutations.persistGuestSuitcase(
          data.currentUser.id,
          null
        );
        if (!persisted) {
          throw new Error(isTemplateDraft ? 'Impossibile salvare il template.' : 'Impossibile salvare la valigia.');
        }
      }
      await data.fetchUserSuitcases();
      data.panelState.clearNewSuitcaseSession();
      data.modalState.setShowAssociationModal(false);
      data.panelState.setViewMode('selector');
      data.panelState.setActiveTabId(null);
      data.showToast(
        isTemplateDraft ? 'Template salvato' : wasDraft ? 'Valigia salvata' : SUITCASE_MODIFIED_TOAST.message,
        isTemplateDraft
          ? 'È ora disponibile nel tab Template.'
          : wasDraft
            ? 'È ora disponibile tra le tue valigie personali.'
            : SUITCASE_MODIFIED_TOAST.description,
        'success'
      );
    } catch (e) {
      console.error('Error saving suitcase:', e);
      data.showToast(
        'Salvataggio non riuscito',
        isTemplateDraft
          ? 'Non è stato possibile salvare il template. Riprova.'
          : 'Non è stato possibile salvare la valigia. Riprova.',
        'destructive'
      );
    }
  };

  const handleLinkBuild = useCallback((providerId: string, productId: string) => {
    const integrations = data.configs.partner_integrations || {};
    const partner = getPartnerById(integrations, providerId);
    return partner ? buildProductAffiliateLink(partner, productId) : '';
  }, [data.configs.partner_integrations]);

  const handleLinkBuildSearch = useCallback((query: string, category?: string) => {
    const integrations = data.configs.partner_integrations || {};
    const bestPartner = resolveBestPartner(integrations, { category });
    if (bestPartner) return buildAffiliateLink(bestPartner, { query });
    return `https://www.amazon.it/s?k=${encodeURIComponent(query)}`;
  }, [data.configs.partner_integrations]);

  const {
    checked: checkedCount,
    total: totalCount,
    percentage: progressPerc,
  } = getSuitcaseItemProgress(data.activeSuitcase?.suitcase_items);

  const panelInsetStyle: React.CSSProperties = {
    left: (!data.panelState.isMobile && data.isSidebarOpen)
      ? 'var(--active-sidebar-width, 30rem)'
      : (!data.panelState.isMobile ? '5rem' : '0px'),
    right: (!data.panelState.isMobile && !data.isSidebarOpen) ? '5rem' : '0px',
  };

  return {
    data,
    actions,
    itemActions,
    editorLogic,
    hiddenCategories,
    showLoadingShell,
    handleConfirmAssociation,
    handleSaveOnly,
    handleLogin,
    associationFlow,
    handleLinkBuild,
    handleLinkBuildSearch,
    totalCount,
    checkedCount,
    progressPerc,
    panelInsetStyle,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    handleBackToSelector,
    handleConfirmWorkspacePause,
    handleCancelWorkspacePause,
    handleConfirmAssociateSaved,
  };
}

export type SuitcasePanelComposition = ReturnType<typeof useSuitcasePanelComposition>;
