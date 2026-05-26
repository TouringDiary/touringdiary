import { useCallback } from 'react';
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

interface UseSuitcasePanelCompositionOptions {
  itineraryId: string | null;
  cityType?: string;
  suitcaseId?: string | null;
  requestClose: () => void;
}

export function useSuitcasePanelComposition({
  itineraryId: propItineraryId,
  cityType,
  suitcaseId,
  requestClose,
}: UseSuitcasePanelCompositionOptions) {
  const data = useSuitcasePanelData(propItineraryId, cityType, suitcaseId);
  const { openModal } = useModal();

  const { pushAction, undo, redo, canUndo, canRedo, beginExecution, endExecution, isExecuting } = useUndoStack(30);

  const hiddenCategories = useSuitcaseHiddenCategories({
    activeSuitcase: data.activeSuitcase,
    onUpdateHiddenCategoryIds: (newIds) => {
      if (data.activeSuitcase?.id) {
        data.handleUpdateSuitcaseLocal(data.activeSuitcase.id, {
          ui_state: { ...data.activeSuitcase.ui_state, hidden_category_ids: newIds },
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
    ...data.mutations,
    fetchUserSuitcases: data.fetchUserSuitcases,
    setHighlightItemId: data.panelState.setHighlightItemId,
    activeSuitcaseId: data.panelState.activeTabId,
    onShowToast: data.showToast,
    onStateSync: data.handleStateSync,
    onCheckDuplicate: (id, name, cat, scId, isUndo) => checkDuplicateItem(
      id, name, cat, scId, data.panelState.activeTabId, data.userSuitcasesRef.current, isUndo
    ),
  });

  const itemActions = useSuitcaseItemActions({
    activeTabId: data.panelState.activeTabId,
    ...data.mutations,
    handleStateSync: data.handleStateSync,
    pushAction,
    fetchUserSuitcases: data.fetchUserSuitcases,
  });

  const editorLogic = useSuitcaseEditorLogic({
    activeSuitcase: data.activeSuitcase,
    ...itemActions,
    modalState: data.modalState,
    panelState: data.panelState,
    showToast: data.showToast,
    pushAction,
  });

  const actions = useSuitcaseActions({
    ...data,
    ...data.panelState,
    ...data.modalState,
    ...data.mutations,
    requestClose,
  });

  const isDataReady = !data.isLoadingUser && data.linkedSuitcaseIds !== null;
  const showLoadingShell = !isDataReady && data.panelState.viewMode === 'selector';

  const handleConfirmAssociation = async () => {
    if (!data.panelState.newSuitcaseId || !data.itineraryId || !data.currentUser) return;
    data.modalState.setIsLinking(true);
    try {
      let finalId = data.panelState.newSuitcaseId;
      if (finalId.startsWith('guest-suitcase-')) {
        const persisted = await data.mutations.persistGuestSuitcase(data.currentUser.id, data.itineraryId);
        if (persisted) finalId = persisted.id;
      } else {
        await data.mutations.linkSuitcaseToTrip(data.itineraryId, finalId, data.currentUser.id);
      }
      await data.fetchLinkedIds();
      await data.fetchUserSuitcases();
      data.panelState.setNewSuitcaseId(null);
      data.modalState.setShowAssociationModal(false);
      data.panelState.setViewMode('selector');
      data.panelState.setActiveTabId(null);
    } catch (e) {
      console.error('Error confirming association:', e);
    } finally {
      data.modalState.setIsLinking(false);
    }
  };

  const handleSaveOnly = async () => {
    if (!data.panelState.newSuitcaseId || !data.currentUser) return;
    try {
      if (data.panelState.newSuitcaseId.startsWith('guest-suitcase-')) {
        await data.mutations.persistGuestSuitcase(data.currentUser.id, null);
      }
      await data.fetchUserSuitcases();
      data.panelState.setNewSuitcaseId(null);
      data.modalState.setShowAssociationModal(false);
      data.panelState.setViewMode('selector');
      data.panelState.setActiveTabId(null);
    } catch (e) {
      console.error('Error saving suitcase:', e);
    }
  };

  const handleLogin = () => {
    requestAnimationFrame(() => {
      openModal('auth', {
        returnTo: 'packingList',
        returnProps: { itineraryId: propItineraryId },
      });
    });
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

  const totalCount = data.activeSuitcase?.suitcase_items?.length || 0;
  const checkedCount = data.activeSuitcase?.suitcase_items?.filter((item) => item.is_checked).length || 0;
  const progressPerc = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

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
  };
}

export type SuitcasePanelComposition = ReturnType<typeof useSuitcasePanelComposition>;
