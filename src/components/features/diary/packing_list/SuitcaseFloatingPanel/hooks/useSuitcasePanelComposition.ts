import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUndoStack } from '@/hooks/useUndoStack';
import { buildProductAffiliateLink, buildAffiliateLink, getPartnerById, resolveBestPartner } from '@/services/partnerIntegrationService';
import { checkDuplicateItem } from '../utils/duplicateCheck';
import { useSuitcaseActions } from './useSuitcaseActions';
import { useSuitcaseEditorLogic } from './useSuitcaseEditorLogic';
import { useSuitcaseDocumentSave } from '@/hooks/save/useSuitcaseDocumentSave';
import { hasDraftWorkspaceInStorage, isDraftWorkspaceId, deleteGuestSuitcase } from '@/utils/guestSuitcaseHelper';
import { useSuitcaseHiddenCategories } from './useSuitcaseHiddenCategories';
import { useSuitcaseItemActions } from './useSuitcaseItemActions';
import { useSuitcasePanelData, type SeedItemsLocallyFn } from './useSuitcasePanelData';
import { useSuitcaseUndo } from './useSuitcaseUndo';
import { useSuitcaseUndoHandlers } from './useSuitcaseUndoHandlers';
import { getSuitcaseItemProgress } from '../../suitcase/SuitcaseUtils';
import { useSuitcaseAssociationFlow } from './useSuitcaseAssociationFlow';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import { SUITCASE_MODIFIED_TOAST } from '@/types/toast';
import { CATEGORY_ID_MAP, normalizeCategoryName } from '@/domain/packing/packingCategories';
import {
  enableOptionalSystemCategory,
  materializeCategorySetupForWrite,
} from '@/domain/packing/categorySetup';
import { buildMissingStandardSeedItems } from '@/services/suitcase/packingSeedService';
import { normalizeItemName } from '@/utils/tagDerivation';

interface UseSuitcasePanelCompositionOptions {
  itineraryId: string | null;
  cityType?: string;
  suitcaseId?: string | null;
  initialAction?: 'create-suitcase' | 'create-template' | null;
  requestClose: () => void;
  registerCloseAttempt?: (handler: () => void) => void;
  onOverlayModalOpenChange?: (open: boolean) => void;
}

export function useSuitcasePanelComposition({
  itineraryId: propItineraryId,
  cityType,
  suitcaseId,
  initialAction,
  requestClose,
  registerCloseAttempt,
  onOverlayModalOpenChange,
}: UseSuitcasePanelCompositionOptions) {
  const seedItemsLocallyRef = useRef<SeedItemsLocallyFn | null>(null);
  const data = useSuitcasePanelData(propItineraryId, cityType, suitcaseId, {
    seedItemsLocallyRef,
  });
  const { openModal } = useModal();

  const {
    pushAction,
    undo,
    redo,
    cancelUndo,
    cancelRedo,
    resetStack,
    canUndo,
    canRedo,
    hasPersistentUndo,
    beginExecution,
    endExecution,
    isExecuting,
  } = useUndoStack(30);

  const { activeTabId, setSelectedItemName, viewMode } = data.panelState;

  const isGuestUser = !data.currentUser;

  const suitcaseDocumentSave = useSuitcaseDocumentSave({
    activeSuitcase: data.activeSuitcase,
    isGuest: isGuestUser,
    userId: data.currentUser?.id ?? null,
    onDocumentSaved: (sc) => {
      data.handleUpdateSuitcaseLocal(sc.id, sc);
      if (!isDraftWorkspaceId(sc.id)) {
        deleteGuestSuitcase();
      }
      // Non rifare fetch: sovrascriverebbe mutazioni locali non ancora nel baseline.
    },
    onSaveAsNavigate: (newId) => {
      resetStack();
      data.panelState.setActiveTabId(newId);
      data.panelState.setViewMode('editor');
      void data.fetchUserSuitcases();
    },
    enabled: viewMode === 'editor' && !!data.activeSuitcase && !isTdTemplate(data.activeSuitcase),
  });

  useEffect(() => {
    resetStack();
    setSelectedItemName(null);
  }, [activeTabId, resetStack, setSelectedItemName]);

  const hiddenCategories = useSuitcaseHiddenCategories({
    activeSuitcase: data.activeSuitcase,
    onUpdateCategoryVisibility: (patch) => {
      if (data.activeSuitcase?.id && !isTdTemplate(data.activeSuitcase)) {
        data.handleUpdateSuitcaseLocal(data.activeSuitcase.id, {
          ui_state: {
            ...data.activeSuitcase.ui_state,
            category_setup: patch.category_setup,
            hidden_category_ids: patch.hidden_category_ids,
            dismissed_category_ids: patch.dismissed_category_ids,
            category_display_order: patch.category_display_order,
          },
        });
        suitcaseDocumentSave.notifyLocalMutation();
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
    cancelUndo,
    cancelRedo,
    isExecuting,
    beginExecution,
    endExecution,
    viewMode,
    ...data.mutations,
    getActiveSuitcase: () => data.activeSuitcase ?? undefined,
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
    checkDuplicateItem: (id, name, cat, scId, isUndo) => checkDuplicateItem(
      id, name, cat, scId, data.panelState.activeTabId, data.userSuitcasesRef.current, isUndo
    ),
    getActiveSuitcase: () => {
      const id = data.panelState.activeTabId;
      if (!id) return undefined;
      return (
        data.userSuitcasesRef.current.find((suitcase) => suitcase.id === id) ??
        data.globalTemplates.find((template) => template.id === id)
      );
    },
    getSuitcaseById: (id: string) =>
      data.userSuitcasesRef.current.find((suitcase) => suitcase.id === id) ??
      data.globalTemplates.find((template) => template.id === id),
    handleStateSync: data.handleStateSync,
    pushAction,
    fetchUserSuitcases: data.fetchUserSuitcases,
    showToast: data.showToast,
    fetchBlacklist: data.fetchBlacklist,
    triggerBlacklistFlash: data.triggerBlacklistFlash,
    onDocumentDirty: suitcaseDocumentSave.notifyLocalMutation,
    onSuitcaseLocalUpdate: data.handleUpdateSuitcaseLocal,
  });

  const usesLocalDocumentSeed =
    viewMode === 'editor' &&
    !!data.activeSuitcase &&
    !isGuestUser &&
    !isTdTemplate(data.activeSuitcase) &&
    !isDraftWorkspaceId(data.activeSuitcase.id);

  seedItemsLocallyRef.current = usesLocalDocumentSeed
    ? async (candidates, context) => {
        if (!data.activeSuitcase) return 0;
        for (const candidate of candidates) {
          await itemActions.handleAddItemConfirmed(
            data.activeSuitcase.id,
            candidate.name,
            candidate.category,
            {
              is_ai_suggestion: true,
              ai_suggestion_context: context ?? null,
              suggested_at: new Date().toISOString(),
            }
          );
        }
        return candidates.length;
      }
    : null;

  const lastAutosaveErrorToastRef = useRef<string | null>(null);
  useEffect(() => {
    if (suitcaseDocumentSave.phase !== 'error' || !suitcaseDocumentSave.lastError) {
      if (suitcaseDocumentSave.phase !== 'error') {
        lastAutosaveErrorToastRef.current = null;
      }
      return;
    }
    if (lastAutosaveErrorToastRef.current === suitcaseDocumentSave.lastError) return;
    lastAutosaveErrorToastRef.current = suitcaseDocumentSave.lastError;
    data.showToast(
      'Salvataggio non riuscito',
      suitcaseDocumentSave.lastError,
      'destructive'
    );
  }, [data.showToast, suitcaseDocumentSave.lastError, suitcaseDocumentSave.phase]);

  const editorLogic = useSuitcaseEditorLogic({
    activeSuitcase: data.activeSuitcase,
    ...itemActions,
    fetchBlacklist: data.fetchBlacklist,
    modalState: data.modalState,
    panelState: data.panelState,
    showToast: data.showToast,
    pushAction,
  });

  const resolveActiveSuitcase = useCallback(() => {
    const id = data.panelState.activeTabId;
    if (!id) return undefined;
    return (
      data.userSuitcasesRef.current.find((suitcase) => suitcase.id === id) ??
      data.globalTemplates.find((template) => template.id === id)
    );
  }, [data.globalTemplates, data.panelState.activeTabId, data.userSuitcasesRef]);

  /** Handler unico per accettazione suggerimenti AI (review modal, desktop/mobile/tablet). */
  const handleAcceptAiSuggestion = useCallback(
    async (name: string, category: string) => {
      const suitcase = resolveActiveSuitcase();
      if (!suitcase) return;

      const existing = suitcase.suitcase_items?.find(
        (item) =>
          normalizeItemName(item.name) === normalizeItemName(name) &&
          !!item.is_ai_suggestion &&
          !item.accepted_from_ai
      );

      if (existing) {
        await itemActions.handleUpdateItemConfirmed(
          existing.id,
          { is_ai_suggestion: false, accepted_from_ai: true },
          existing
        );
      } else {
        await itemActions.handleAddItemConfirmed(suitcase.id, name, category, {
          accepted_from_ai: true,
          is_ai_suggestion: false,
        });
      }

      data.setAiSuggestions((prev) =>
        prev.map((s) => (s.name === name ? { ...s, status: 'accepted' as const } : s))
      );
    },
    [data.setAiSuggestions, itemActions, resolveActiveSuitcase]
  );

  const handleRejectAiSuggestion = useCallback(
    async (name: string, category: string) => {
      const suitcase = resolveActiveSuitcase();
      if (!suitcase) return;

      await data.mutations.rejectItem(suitcase.id, { name, category });
      await data.fetchBlacklist({ force: true });
      data.setAiSuggestions((prev) =>
        prev.map((s) => (s.name === name ? { ...s, status: 'rejected' as const } : s))
      );
    },
    [data.fetchBlacklist, data.mutations, data.setAiSuggestions, resolveActiveSuitcase]
  );

  const handleActivateOptionalCategory = useCallback(async (categoryId: string) => {
    const suitcase = data.activeSuitcase;
    if (!suitcase) return;

    const { setup } = materializeCategorySetupForWrite(suitcase);
    const nextSetup = enableOptionalSystemCategory(setup, categoryId);
    hiddenCategories.enhancedHiddenCategoriesLogic.activateOptionalCategory(categoryId);

    const categoryName = Object.entries(CATEGORY_ID_MAP).find(([, id]) => id === categoryId)?.[0];
    const seedItems = await buildMissingStandardSeedItems(suitcase, nextSetup);
    const toAdd = seedItems.filter(
      (item) => !categoryName || normalizeCategoryName(item.category) === categoryName
    );

    for (const item of toAdd) {
      await itemActions.handleAddItemConfirmed(suitcase.id, item.name, item.category);
    }
  }, [
    data.activeSuitcase,
    hiddenCategories.enhancedHiddenCategoriesLogic,
    itemActions,
  ]);

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
    isDiaryAssociable: data.isDiaryAssociable,
    currentUser: data.currentUser,
    userSuitcases: data.userSuitcases,
    guestSuitcase: data.guestSuitcase,
    fetchLinkedIds: data.fetchLinkedIds,
    fetchUserSuitcases: data.fetchUserSuitcases,
    clearNewSuitcaseSession: data.panelState.clearNewSuitcaseSession,
    setShowAssociationModal: data.modalState.setShowAssociationModal,
    setActiveTabId: data.panelState.setActiveTabId,
    setViewMode: data.panelState.setViewMode,
    showToast: data.showToast,
    onLoginRequired: handleLogin,
  });

  // Chiusura unificata (X / ESC / Indietro): se ci sono modifiche non salvate apre il dialogo
  // unico "Modifiche non salvate" (Salva / Annulla le modifiche / Continua a modificare),
  // altrimenti chiude direttamente. Sostituisce il vecchio flusso "Metti in pausa".
  const requestCloseGuarded = useCallback(() => {
    const m = data.modalState;
    // Un solo punto di verità per "c'è già un modale che intercetta la chiusura": finché uno di
    // questi è aperto la X/ESC/Indietro li chiude per primi e non deve avviare il flusso di uscita.
    // Aggiungendo nuovi modal in futuro basta estenderne l'elenco qui.
    const hasBlockingModalOpen =
      m.showUnsavedChangesModal ||
      m.showAssociationModal ||
      m.showDraftOverwriteModal ||
      m.showCategorySetupModal ||
      m.showRecommendedSuitcaseModal ||
      m.suitcaseToDelete !== null ||
      m.suitcaseToUnlink !== null ||
      m.itemToDelete !== null ||
      m.categoryToDelete !== null ||
      m.showBlacklistModal ||
      associationFlow.linkModalOpen;

    if (hasBlockingModalOpen) return;

    const activeId = data.panelState.activeTabId;
    const inEditor = data.panelState.viewMode === 'editor' && activeId !== null;
    const isDraft = activeId ? isDraftWorkspaceId(activeId) : false;
    const savePhase = suitcaseDocumentSave.phase;
    // Consideriamo "modifiche non salvate" solo bozza/dirty/error: sono gli stati in cui esiste
    // davvero lavoro non persistito da proteggere alla chiusura. La fase `saving` è volutamente
    // esclusa perché un salvataggio è già in corso ed è gestito dal flusso di salvataggio
    // (al suo completamento la fase diventa idle o error, e in error rientriamo nel guard).
    const hasUnsavedChanges =
      inEditor &&
      (isDraft ||
        hasDraftWorkspaceInStorage() ||
        savePhase === 'dirty' ||
        savePhase === 'error');

    if (!hasUnsavedChanges) {
      requestClose();
      return;
    }

    m.setShowUnsavedChangesModal(true);
  }, [
    associationFlow.linkModalOpen,
    data.modalState,
    data.panelState.activeTabId,
    data.panelState.viewMode,
    requestClose,
    suitcaseDocumentSave.phase,
  ]);

  useEffect(() => {
    registerCloseAttempt?.(requestCloseGuarded);
  }, [registerCloseAttempt, requestCloseGuarded]);

  useLayoutEffect(() => {
    const m = data.modalState;
    onOverlayModalOpenChange?.(
      m.showCategorySetupModal || m.showRecommendedSuitcaseModal
    );
  }, [
    data.modalState.showCategorySetupModal,
    data.modalState.showRecommendedSuitcaseModal,
    onOverlayModalOpenChange,
  ]);

  // "Continua a modificare": chiude solo il dialogo, resta nell'editor.
  const handleCancelUnsavedChanges = useCallback(() => {
    data.modalState.setShowUnsavedChangesModal(false);
  }, [data.modalState]);

  // "Annulla le modifiche": nessuna pausa. Se è una bozza locale viene abbandonata, così le
  // modifiche sono davvero scartate e non riproposte alla riapertura; poi chiude il pannello.
  const handleDiscardAndExit = useCallback(() => {
    data.modalState.setShowUnsavedChangesModal(false);
    const activeId = data.panelState.activeTabId;
    if (activeId && isDraftWorkspaceId(activeId)) {
      deleteGuestSuitcase();
      data.panelState.clearNewSuitcaseSession();
    } else if (hasDraftWorkspaceInStorage()) {
      deleteGuestSuitcase();
    }
    requestClose();
  }, [data.modalState, data.panelState, requestClose]);

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
    requestClose: requestCloseGuarded,
    handleLinkExisting: associationFlow.handleLinkExisting,
    onDocumentDirty:
      viewMode === 'editor' && data.activeSuitcase && !isTdTemplate(data.activeSuitcase)
        ? suitcaseDocumentSave.notifyLocalMutation
        : undefined,
    onSuitcaseLocalUpdate: data.handleUpdateSuitcaseLocal,
  });

  // Avvio automatico di una pipeline di creazione esistente (riuso degli handler della Dashboard Valigia).
  // L'intento iniziale è uno stato "da consumare": una volta eseguito viene azzerato, così l'effect
  // non si rieseguirà anche se gli handler cambiano identità o se isLoadingUser oscilla.
  const { handleCreateNew, handleCreateTemplate } = actions;
  const [pendingInitialAction, setPendingInitialAction] = useState(initialAction ?? null);
  // Risincronizza l'intento da consumare quando cambia `initialAction` (es. riapertura del modal
  // senza smontaggio del componente). La semantica "consume once" resta invariata: dopo il consumo
  // pendingInitialAction torna null e questo effect riarma solo a un nuovo cambio di initialAction.
  useEffect(() => {
    setPendingInitialAction(initialAction ?? null);
  }, [initialAction]);
  useEffect(() => {
    if (!pendingInitialAction || data.isLoadingUser) return;
    setPendingInitialAction(null);
    if (pendingInitialAction === 'create-suitcase') {
      void handleCreateNew();
    } else if (pendingInitialAction === 'create-template') {
      void handleCreateTemplate();
    }
  }, [pendingInitialAction, data.isLoadingUser, handleCreateNew, handleCreateTemplate]);

  const handleBackToSelector = useCallback(async () => {
    const isExistingPersisted =
      activeTabId &&
      !isDraftWorkspaceId(activeTabId) &&
      !data.panelState.isNewSuitcaseSession;

    await suitcaseDocumentSave.awaitInFlight();

    // La conferma "salvato" deve riflettere lo stato REALE del SaveController:
    // - 'synced'  → l'autosalvataggio ha persistito davvero → toast di successo;
    // - 'error'   → il salvataggio è fallito → toast di errore esplicito (mai un falso successo);
    // - 'dirty'/'saving' → operazione non ancora conclusa → nessun annuncio definitivo.
    if (isExistingPersisted && hasPersistentUndo) {
      const phase = suitcaseDocumentSave.getPhase();
      if (phase === 'synced') {
        data.showToast(
          SUITCASE_MODIFIED_TOAST.message,
          SUITCASE_MODIFIED_TOAST.description,
          'success'
        );
      } else if (phase === 'error') {
        data.showToast(
          'Salvataggio non riuscito',
          suitcaseDocumentSave.lastError ||
            'Le ultime modifiche non sono state salvate. Riprova.',
          'destructive'
        );
      }
    }

    actions.handleBackToSelector();
  }, [
    actions,
    activeTabId,
    data.panelState.isNewSuitcaseSession,
    data.showToast,
    hasPersistentUndo,
    suitcaseDocumentSave,
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
    canUndo: canUndo && suitcaseDocumentSave.phase !== 'saving',
    canRedo: canRedo && suitcaseDocumentSave.phase !== 'saving',
    suitcaseDocumentSave,
    handleBackToSelector,
    handleDiscardAndExit,
    handleCancelUnsavedChanges,
    forceClose: requestClose,
    handleConfirmAssociateSaved,
    handleActivateOptionalCategory,
    handleAcceptAiSuggestion,
    handleRejectAiSuggestion,
  };
}

export type SuitcasePanelComposition = ReturnType<typeof useSuitcasePanelComposition>;
