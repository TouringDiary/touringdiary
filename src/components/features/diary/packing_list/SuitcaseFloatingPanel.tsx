import { Z_MODAL } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { buildProductAffiliateLink, buildAffiliateLink, getPartnerById, resolveBestPartner } from '@/services/partnerIntegrationService';
import { useUndoStack } from '@/hooks/useUndoStack';

// Modular Components
import { SuitcaseHeader } from './suitcase/SuitcaseHeader';
import { SuitcaseDashboard } from './suitcase/SuitcaseDashboard';
import { SuitcaseEditorView } from './suitcase/SuitcaseEditorView';
import { SuitcaseModals } from './SuitcaseFloatingPanel/components/SuitcaseModals';
import { SuitcaseToast } from './SuitcaseFloatingPanel/components/SuitcaseToast';
import { useSuitcasePanelData } from './SuitcaseFloatingPanel/hooks/useSuitcasePanelData';
import { useSuitcaseUndoHandlers } from './SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers';
import { useSuitcaseItemActions } from './SuitcaseFloatingPanel/hooks/useSuitcaseItemActions';
import { useSuitcaseEditorLogic } from './SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic';
import { useSuitcaseActions } from './SuitcaseFloatingPanel/hooks/useSuitcaseActions';
import { useSuitcaseUndo } from './SuitcaseFloatingPanel/hooks/useSuitcaseUndo';
import { checkDuplicateItem } from './SuitcaseFloatingPanel/utils/duplicateCheck';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import { useModal } from '@/context/ModalContext';
import { useNavigation } from '@/context/useNavigation';

interface Props {
  itineraryId: string | null;
  onClose: () => void;
  cityType?: string;
  suitcaseId?: string | null;
}

export const SuitcaseFloatingPanel: React.FC<Props> = ({ itineraryId: propItineraryId, onClose, cityType, suitcaseId }) => {
  // Stato di montaggio per evitare crash SSR (createPortal richiede document.body)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const data = useSuitcasePanelData(propItineraryId, cityType, suitcaseId);
  const { activeModal, openModal } = useModal();
  const { viewMode } = useNavigation();

  // PROBLEMA 2 — Chiusura automatica in Admin
  React.useEffect(() => {
    if (viewMode === 'admin') {
      onClose();
    }
  }, [viewMode, onClose]);

  const { pushAction, undo, redo, canUndo, canRedo, beginExecution, endExecution, isExecuting } = useUndoStack(30);

  const [showHiddenCategories, setShowHiddenCategories] = React.useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("showHiddenCategories") : null;
    return saved ? JSON.parse(saved) : false;
  });

  React.useEffect(() => {
    localStorage.setItem("showHiddenCategories", JSON.stringify(showHiddenCategories));
  }, [showHiddenCategories]);

  const [isEyeFlashing, setIsEyeFlashing] = React.useState(false);
  const flashTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const hiddenCategoriesLogic = useHiddenCategories(
    data.activeSuitcase?.id,
    data.activeSuitcase?.ui_state?.hidden_category_ids || [],
    (newIds) => {
      if (data.activeSuitcase?.id) {
        data.handleUpdateSuitcaseLocal(data.activeSuitcase.id, {
          ui_state: { ...data.activeSuitcase.ui_state, hidden_category_ids: newIds }
        });
      }
    }
  );

  const toggleCategoryWithFlash = React.useCallback((id: string) => {
    const wasHidden = hiddenCategoriesLogic.isHidden(id);
    hiddenCategoriesLogic.toggleCategory(id);

    if (!wasHidden) {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      setIsEyeFlashing(true);
      flashTimeoutRef.current = setTimeout(() => setIsEyeFlashing(false), 2000);
    }
  }, [hiddenCategoriesLogic]);

  const enhancedHiddenCategoriesLogic = React.useMemo(() => ({
    ...hiddenCategoriesLogic,
    toggleCategory: toggleCategoryWithFlash
  }), [hiddenCategoriesLogic, toggleCategoryWithFlash]);

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
    stack: { pushAction, undo, redo, canUndo, canRedo }
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
    )
  });

  const { handleStateSync } = data;

  const itemActions = useSuitcaseItemActions({
    activeTabId: data.panelState.activeTabId,
    ...data.mutations,
    handleStateSync,
    pushAction,
    fetchUserSuitcases: data.fetchUserSuitcases
  });

  const editorLogic = useSuitcaseEditorLogic({
    activeSuitcase: data.activeSuitcase,
    ...itemActions,
    modalState: data.modalState,
    panelState: data.panelState,
    showToast: data.showToast,
    pushAction
  });

  const actions = useSuitcaseActions({
    ...data,
    ...data.panelState,
    ...data.modalState,
    ...data.mutations,
    onClose,
  });

  // La dashboard è pronta solo se i dati utente e le associazioni (linkedSuitcaseIds)
  // sono stati completamente risolti dal database (evitando flickering di caricamento)
  const isDataReady = !data.isLoadingUser && data.linkedSuitcaseIds !== null;

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
      console.error("Error confirming association:", e);
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
      console.error("Error saving suitcase:", e);
    }
  };

  const handleLogin = () => {
    requestAnimationFrame(() => {
      openModal('auth', {
        returnTo: 'packingList',
        returnProps: { itineraryId: propItineraryId }
      });
    });
  };

  const handleLinkBuild = React.useCallback((providerId: string, productId: string) => {
    const integrations = data.configs.partner_integrations || {};
    const partner = getPartnerById(integrations, providerId);
    return partner ? buildProductAffiliateLink(partner, productId) : '';
  }, [data.configs.partner_integrations]);

  const handleLinkBuildSearch = React.useCallback((query: string, category?: string) => {
    const integrations = data.configs.partner_integrations || {};
    const bestPartner = resolveBestPartner(integrations, { category });
    if (bestPartner) return buildAffiliateLink(bestPartner, { query });
    return `https://www.amazon.it/s?k=${encodeURIComponent(query)}`;
  }, [data.configs.partner_integrations]);

  const totalCount = data.activeSuitcase?.suitcase_items?.length || 0;
  const checkedCount = data.activeSuitcase?.suitcase_items?.filter(i => i.is_checked).length || 0;
  const progressPerc = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  if (!mounted) return null;

  if (!isDataReady && data.panelState.viewMode === 'selector') {
    return createPortal(
      <div
        className="fixed inset-0 lg:inset-auto lg:right-0 lg:bottom-0 flex items-end pointer-events-none"
        style={{ zIndex: Z_MODAL }}
      >
        <div style={{
          left: (!data.panelState.isMobile && data.isSidebarOpen) ? 'var(--active-sidebar-width, 30rem)' : (!data.panelState.isMobile ? '5rem' : '0px'),
          right: (!data.panelState.isMobile && !data.isSidebarOpen) ? '5rem' : '0px',
          zIndex: Z_MODAL
        }}
          className="fixed bottom-0 h-screen lg:h-[70vh] flex flex-col pointer-events-auto"
        >
          <div className="absolute inset-0 -z-floating-panel bg-slate-900 border-t border-indigo-500/20 rounded-t-3xl shadow-2xl" />
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="text-slate-500 font-black tracking-[0.2em] text-[10px] uppercase">
                Caricamento Dashboard...
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const portalContent = (
    <div
      data-testid="suitcase-root"
      className="fixed bottom-0 left-0 right-0 flex items-end pointer-events-none"
      style={{ zIndex: Z_MODAL }}
    >
      <div style={{
        left: (!data.panelState.isMobile && data.isSidebarOpen) ? 'var(--active-sidebar-width, 30rem)' : (!data.panelState.isMobile ? '5rem' : '0px'),
        right: (!data.panelState.isMobile && !data.isSidebarOpen) ? '5rem' : '0px',
        zIndex: Z_MODAL
      }}
        className="fixed bottom-0 h-screen lg:h-[70vh] pointer-events-auto"
      >
        {/* ANIMATION & STYLE WRAPPER (This contains properties that create a stacking context) */}
        <div className={`w-full h-full flex flex-col relative transition-all duration-300 ${data.panelState.isClosing ? 'translate-y-full lg:opacity-0' : 'translate-y-0 lg:opacity-100'}`}>

          {/* BACKGROUND LAYER (Isolate blur and GPU effects here) */}
          <div className={`absolute inset-0 -z-floating-panel bg-slate-900 ${activeModal === 'removeSelection' ? '' : ''} border-t border-indigo-500/20 rounded-t-3xl shadow-2xl`} />

          <div className="w-full flex flex-col h-full lg:overflow-hidden relative">
            <SuitcaseModals
              modalState={data.modalState}
              itineraryId={data.itineraryId}
              actions={actions}
              itemActions={itemActions}
              handleConfirmAssociation={handleConfirmAssociation}
              handleSaveOnly={handleSaveOnly}
              handleCancelAssociation={() => data.modalState.setShowAssociationModal(false)}
              isGuest={!data.currentUser || data.currentUser.role === 'guest'}
              isDiaryFull={!!data.itineraryId && (data.itinerary?.items?.length || 0) > 0}
              onLogin={handleLogin}
            />
            <SuitcaseHeader viewMode={data.panelState.viewMode} activeSuitcase={data.activeSuitcase || null} isEditingTitle={data.isEditingTitle} tempTitle={data.tempTitle} titleInputRef={data.titleInputRef}
              checkedCount={checkedCount} totalCount={totalCount} progressPerc={progressPerc} saveStatus={data.saveStatus} isCreatingSuitcase={data.isCreatingSuitcase} isLinkedToItinerary={data.linkedSuitcaseIds?.includes(data.panelState.activeTabId || '') || false}
              onEditTitle={actions.startEditingTitle} onSaveTitle={actions.handleSaveSuitcaseTitle} onTitleChange={data.setTempTitle} onCreateSuitcase={actions.handleCreateNew} onClose={actions.handleClose} onDelete={() => data.modalState.setSuitcaseToDelete(data.panelState.activeTabId)}
              onUnlink={() => data.panelState.activeTabId && actions.handleUnlink(data.panelState.activeTabId)}
              onBackToSelector={actions.handleBackToSelector} onCreateTemplate={actions.handleCreateTemplate} performUndo={performUndo} performRedo={performRedo} canUndo={canUndo} canRedo={canRedo} sourceTab={data.panelState.sourceTab} setSourceTab={data.panelState.setSourceTab}
              showHiddenCategories={showHiddenCategories} onToggleHiddenCategories={() => setShowHiddenCategories(!showHiddenCategories)}
              hiddenCategoriesCount={enhancedHiddenCategoriesLogic.hiddenIds.length}
              isEyeFlashing={isEyeFlashing} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className={`flex-1 flex flex-col ${data.panelState.viewMode === 'selector' ? 'lg:overflow-hidden overflow-y-auto p-0' : 'overflow-hidden p-0'}`}>
                {data.isLoadingUser && data.panelState.viewMode === 'selector' && <div className="text-center text-slate-400 py-12">Caricamento valigie...</div>}
                {data.panelState.viewMode === 'selector' && !data.isLoadingUser && (
                  <SuitcaseDashboard
                    {...data}
                    tripSuitcases={data.tripSuitcases}
                    savedSuitcases={data.savedSuitcases}
                    allSuitcases={[...data.globalTemplates, ...data.userSuitcases]}
                    linkedSuitcaseIds={data.linkedSuitcaseIds || []}
                    activeTabId={data.panelState.activeTabId}
                    hoveredItemId={data.panelState.hoveredItemId}
                    onLinkSuitcase={actions.handleLinkExisting}
                    onOpenSuitcase={(id) => { data.panelState.setIsNewSuitcaseSession(false); data.panelState.setActiveTabId(id); data.panelState.setViewMode('editor'); }}
                    onUnlinkSuitcase={(id) => data.modalState.setSuitcaseToUnlink(id)} onDeleteSuitcase={(id) => data.modalState.setSuitcaseToDelete(id)}
                    onHover={data.panelState.setHoveredItemId} onTogglePreference={data.togglePreference} onUseTemplate={actions.handleUseTemplate}
                    onCreateSuitcase={actions.handleCreateNew} onCreateTemplate={actions.handleCreateTemplate} onAddCategory={actions.handleAddCategoryFromPreview}
                    onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
                    sourceTab={data.panelState.sourceTab} setSourceTab={data.panelState.setSourceTab}
                    itemMap={data.affiliateMaps.items} categoryMap={data.affiliateMaps.categories} globalMap={data.affiliateMaps.global} placeholders={data.affiliateMaps.placeholders} overrides={data.affiliateMaps.overrides}
                    hasActiveDiary={!!data.itineraryId}
                    onLinkBuild={handleLinkBuild} onLinkBuildSearch={handleLinkBuildSearch}
                    toast={data.toast}
                    showHiddenCategories={showHiddenCategories} />
                )}
                {data.panelState.viewMode === 'editor' && data.activeSuitcase && (
                  <SuitcaseEditorView suitcase={data.activeSuitcase} {...editorLogic}
                    onUpdateSuitcase={async (updates) => { await data.mutations.updateSuitcase(data.activeSuitcase!.id, updates); await data.fetchUserSuitcases(); }}
                    onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
                    onSeedAi={data.handleSeedAi} isSeedingAi={data.isSeedingAi}
                    itemMap={data.affiliateMaps.items} categoryMap={data.affiliateMaps.categories} globalMap={data.affiliateMaps.global} placeholders={data.affiliateMaps.placeholders} overrides={data.affiliateMaps.overrides}
                    onLinkBuild={handleLinkBuild} onLinkBuildSearch={handleLinkBuildSearch}
                    highlightItemId={data.panelState.highlightItemId} selectedItemName={data.panelState.selectedItemName} autoOpenNewCategory={data.panelState.autoOpenNewCategory}
                    showHiddenCategories={showHiddenCategories}
                    hiddenCategoriesLogic={enhancedHiddenCategoriesLogic}
                    toast={data.toast} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};



