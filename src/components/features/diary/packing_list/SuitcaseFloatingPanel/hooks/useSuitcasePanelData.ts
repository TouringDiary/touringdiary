import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  useUserSuitcases,
  useSuitcaseItemsMutations,
  useGlobalTemplates,
  useCloneSuitcase,
  useCityTypesTemplates,
  useUserTemplatePreferences
} from '@/hooks/useSuitcaseSystem';
import { useUI } from '@/context/UIContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useUser } from '@/context/UserContext';
import { deriveItineraryCityTypes } from '@/utils/deriveItineraryCityTypes';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';
import { ToastVariant } from '@/types/toast';
import { useSuitcaseLifecycle } from './useSuitcaseLifecycle';
import { useFloatingPanelStateSync } from './useFloatingPanelOptimisticUpdates';
import { useSuitcaseSelectors } from '../selectors/suitcaseSelectors';
import { useSuitcaseAffiliate } from './useSuitcaseAffiliate';
import { useSuitcaseSuggestions } from './useSuitcaseSuggestions';
import { useFloatingPanelState } from './useFloatingPanelState';
import { useFloatingPanelModals } from './useFloatingPanelModals';
import { getRejectionsBySuitcaseAsync } from '@/services/suitcase/suitcaseRejectionsService';
import { Suitcase, SuitcaseRejection } from '@/types/suitcase';
import { CategorySetupMap } from '@/types/packingCatalog';
import { isDiaryAssociable as checkDiaryAssociable } from '@/utils/itineraryAssociability';
import {
  getDraftLocalRejections,
  getGuestSuitcase,
  isDraftWorkspaceId,
  mapDraftLocalRejectionsToRuntime,
  preserveDraftLocalStorageFields,
  saveGuestSuitcase,
} from '@/utils/guestSuitcaseHelper';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import { resolveDefaultSuitcaseTab } from '../types/sourceTab';

export {
  resolveInitialSuitcaseTab,
  resolveDefaultSuitcaseTab,
  isSuitcaseDashboardEmpty,
} from '../types/sourceTab';
export type { SuitcaseSourceTab } from '../types/sourceTab';

export const useSuitcasePanelData = (propItineraryId: string | null, _cityType?: string, initialSuitcaseId?: string | null) => {

  const { itinerary, savedProjects, saveProject } = useItinerary();
  const { cityManifest } = useUser();
  const itineraryId = itinerary?.id ?? propItineraryId ?? null;
  const isDiaryAssociable = useMemo(() => checkDiaryAssociable(itinerary), [itinerary]);

  const { configs } = useConfig();
  const { isSidebarOpen } = useUI();

  /**
   * 1. Stato pannello
   *
   * Tab iniziale = INIZIA (start), aggiornato da resolveDefaultSuitcaseTab quando i dati sono pronti.
   */
  const panelState = useFloatingPanelState('selector', 'start');
  const modalState = useFloatingPanelModals();

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ 
    message: string; 
    description?: string; 
    variant: ToastVariant;
    visible: boolean; 
  }>({
    message: "",
    variant: 'success',
    visible: false
  });

  const [templatePreviewOverlays, setTemplatePreviewOverlays] = useState<
    Record<string, CategorySetupMap>
  >({});

  const updateTemplatePreviewOverlay = useCallback(
    (
      templateId: string,
      updater: (prev: CategorySetupMap) => CategorySetupMap
    ) => {
      setTemplatePreviewOverlays((prev) => ({
        ...prev,
        [templateId]: updater(prev[templateId] ?? {}),
      }));
    },
    []
  );

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, description?: string, variant: ToastVariant = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setToast({ message, description, variant, visible: true });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  /**
   * 2. Template globali
   */
  const { globalTemplates, fetchGlobalTemplates, isLoading: isLoadingGlobalTemplates, fetchError: globalTemplatesFetchError } = useGlobalTemplates();

  /**
   * 3. Lifecycle
   *
   * Recupera:
   * - utente corrente
   * - id valigie collegate al diario
   */
  const {
    currentUser,
    linkedSuitcaseIds,
    fetchLinkedIds
  } = useSuitcaseLifecycle({
    itineraryId: itineraryId || null,
    fetchGlobalTemplates,
    activeTabId: panelState.activeTabId,
    setActiveTabId: panelState.setActiveTabId,
    viewMode: panelState.viewMode,
    setViewMode: panelState.setViewMode,
    sourceTab: panelState.sourceTab,
    setSourceTab: panelState.setSourceTab,
    setSelectedItemName: panelState.setSelectedItemName
  });

  /**
   * 4. Valigie utente
   */
  const {
    suitcases: userSuitcases,
    setSuitcases: setUserSuitcases,
    isLoading: isLoadingUser,
    fetchSuitcases: fetchUserSuitcases
  } = useUserSuitcases(currentUser?.id);

  const userSuitcasesRef = useRef(userSuitcases);

  useEffect(() => {
    userSuitcasesRef.current = userSuitcases;
  }, [userSuitcases]);

  /**
   * 5. Selectors derivati
   */
  const {
    tripSuitcases,
    savedSuitcases,
    userOwnedTemplates,
    activeSuitcase
  } = useSuitcaseSelectors(
    userSuitcases,
    globalTemplates,
    linkedSuitcaseIds,
    panelState.activeTabId,
    currentUser?.id
  );

  const guestSuitcase = useMemo(
    () => userSuitcases.find((s) => isDraftWorkspaceId(s.id)) ?? null,
    [userSuitcases]
  );

  /**
   * 6. Blacklist (Rifiuti AI)
   */
  const [blacklistItems, setBlacklistItems] = useState<SuitcaseRejection[]>([]);
  const [isFetchingBlacklist, setIsFetchingBlacklist] = useState(false);
  const [isBlacklistFlashing, setIsBlacklistFlashing] = useState(false);
  const blacklistFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (blacklistFlashTimeoutRef.current) {
        clearTimeout(blacklistFlashTimeoutRef.current);
      }
    };
  }, []);

  const triggerBlacklistFlash = useCallback(() => {
    if (blacklistFlashTimeoutRef.current) clearTimeout(blacklistFlashTimeoutRef.current);
    setIsBlacklistFlashing(true);
    blacklistFlashTimeoutRef.current = setTimeout(() => setIsBlacklistFlashing(false), 2000);
  }, []);

  const fetchBlacklist = useCallback(async () => {
    if (!activeSuitcase?.id) {
      setBlacklistItems([]);
      return;
    }

    if (isDraftWorkspaceId(activeSuitcase.id)) {
      const draft = getGuestSuitcase();
      const locals =
        draft?.id === activeSuitcase.id ? getDraftLocalRejections(draft) : [];
      setBlacklistItems(mapDraftLocalRejectionsToRuntime(locals, activeSuitcase.id));
      return;
    }

    setIsFetchingBlacklist(true);
    try {
      const rejections = await getRejectionsBySuitcaseAsync(activeSuitcase.id);
      setBlacklistItems(rejections);
    } catch (e) {
      console.error("[useSuitcasePanelData] Error fetching blacklist:", e);
    } finally {
      setIsFetchingBlacklist(false);
    }
  }, [activeSuitcase?.id]);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  /**
   * 7. Readiness selectors
   *
   * IMPORTANTE:
   * NON richiediamo currentUser !== null
   * perché:
   *
   * - utente anonimo → deve andare su TEMPLATE
   * - utente loggato senza valigie → TEMPLATE
   * - utente loggato con valigie → SALVATE
   *
   * quindi basta sapere che:
   * - loading terminato
   * - linkedSuitcaseIds disponibili
   */

  /**
   * Selectors readiness
   *
   * IMPORTANTE:
   * - utente anonimo → dobbiamo comunque inizializzare il tab
   * - quindi NON aspettiamo isLoadingUser
   */

  /**
   * 8. Auto-selezione tab dinamica (logica UX definitiva)
   *
   * Auto-selezione tab deterministica
   *
   * Regole:
   *
   * - aspetta che linkedSuitcaseIds e userSuitcases siano caricati
   * - inizializza una sola volta il tab corretto
   * - aggiorna solo quando cambia il numero valigie nel diario
   */

  const previousTripCount = useRef<number>(0);
  const previousSavedCount = useRef<number>(0);
  const hasInitializedTab = useRef(false);

  const dataReady =
    !isLoadingUser &&
    linkedSuitcaseIds !== null;

  const { setSourceTab } = panelState;
  const tripCount = tripSuitcases.length;
  const savedCount = savedSuitcases.length;

  useEffect(() => {
    if (initialSuitcaseId && dataReady) {
      const entity =
        userSuitcases.find((s) => s.id === initialSuitcaseId) ??
        globalTemplates.find((s) => s.id === initialSuitcaseId);
      panelState.setActiveTabId(initialSuitcaseId);
      panelState.setViewMode(entity && isTdTemplate(entity) ? 'viewer' : 'editor');
      hasInitializedTab.current = true;
    }
  }, [initialSuitcaseId, dataReady, userSuitcases, globalTemplates]);

  useEffect(() => {
    if (!dataReady || hasInitializedTab.current || initialSuitcaseId) return;

    const initialTab = resolveDefaultSuitcaseTab(tripCount, savedCount);
    setSourceTab(initialTab);
    hasInitializedTab.current = true;
    previousTripCount.current = tripCount;
    previousSavedCount.current = savedCount;
  }, [
    dataReady,
    currentUser,
    tripCount,
    savedCount,
    setSourceTab,
    initialSuitcaseId,
  ]);

  useEffect(() => {
    if (!dataReady || !hasInitializedTab.current) return;

    const initialTab = resolveDefaultSuitcaseTab(tripCount, savedCount);

    if (
      tripCount !== previousTripCount.current ||
      (savedCount !== previousSavedCount.current &&
        (panelState.sourceTab === 'default' || panelState.sourceTab === 'start'))
    ) {
      if (panelState.activeTabId && isDraftWorkspaceId(panelState.activeTabId)) {
        previousTripCount.current = tripCount;
        previousSavedCount.current = savedCount;
        return;
      }
      setSourceTab(initialTab);
    }

    previousTripCount.current = tripCount;
    previousSavedCount.current = savedCount;
  }, [
    dataReady,
    currentUser,
    tripCount,
    savedCount,
    setSourceTab,
    panelState.sourceTab,
    panelState.activeTabId,
  ]);

  useEffect(() => {
    if (panelState.viewMode !== 'selector') return;
    void fetchLinkedIds();
    void fetchUserSuitcases();
  }, [panelState.viewMode, fetchLinkedIds, fetchUserSuitcases]);

  /**
   * 9. Affiliate + Suggestions
   */

  const itineraryCityTypes = useMemo(
    () => deriveItineraryCityTypes(itinerary, cityManifest),
    [itinerary, cityManifest]
  );

  const { suggestedTemplateIds } = useCityTypesTemplates(itineraryCityTypes);

  const {
    preferences,
    togglePreference
  } = useUserTemplatePreferences(currentUser?.id);

  const {
    affiliateMaps
  } = useSuitcaseAffiliate(activeSuitcase || tripSuitcases[0]);

  const {
    handleStateSync
  } = useFloatingPanelStateSync(
    setUserSuitcases,
    panelState.activeTabId
  );

  const handleUpdateSuitcaseLocal =
    useCallback((id: string, updates: Partial<Suitcase>) => {
      setUserSuitcases(prev => {
        const next = prev.map(s =>
          s.id === id
            ? { ...s, ...updates }
            : s
        );

        if (!isDraftWorkspaceId(id)) return next;

        const draftSc = next.find((s) => s.id === id);
        if (!draftSc) return next;

        const preserved = preserveDraftLocalStorageFields(draftSc);
        saveGuestSuitcase(preserved);
        return next.map((s) => (s.id === id ? preserved : s));
      });

    }, [setUserSuitcases, currentUser]);

  /**
   * 10. Mutations
   */
  const mutations = useSuitcaseItemsMutations();
  const {
    cloneSuitcase,
    isCloning
  } = useCloneSuitcase();

  /**
   * 11. Suggestions engine
   */

  const suggestions =
    useSuitcaseSuggestions({
      linkedSuitcaseIds,
      suggestedTemplateIds,
      globalTemplates,
      activeSuitcase,
      itinerary,
      fetchUserSuitcases,
      setSaveStatus,
      showToast
    });

  /**
   * RETURN
   */

  return {
    itineraryId,
    configs,
    isSidebarOpen,
    panelState,
    modalState,
    saveStatus,
    setSaveStatus,
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    titleInputRef,
    toast,
    showToast,
    globalTemplates,
    isLoadingGlobalTemplates,
    globalTemplatesFetchError,
    currentUser,
    linkedSuitcaseIds,
    fetchLinkedIds,
    userSuitcases,
    setUserSuitcases,
    userSuitcasesRef,
    isLoadingUser,
    fetchUserSuitcases,
    suggestedTemplateIds,
    preferences,
    togglePreference,
    tripSuitcases,
    savedSuitcases,
    userOwnedTemplates,
    guestSuitcase,
    activeSuitcase,
    itineraryCityTypes,
    affiliateMaps,
    handleStateSync,
    handleUpdateSuitcaseLocal,
    mutations,
    isCreatingSuitcase: modalState.isCreatingFromConfiguration,
    cloneSuitcase,
    isCloning,
    itinerary,
    savedProjects,
    saveProject,
    isDiaryAssociable,
    hasSuitcaseLinkedToDiary: tripSuitcases.length > 0,
    adminSuitcasePlaceholders: configs?.[SETTINGS_KEYS.SUITCASE_PLACEHOLDERS] || {},
    blacklistItems,
    blacklistCount: blacklistItems.length,
    isFetchingBlacklist,
    isBlacklistFlashing,
    triggerBlacklistFlash,
    fetchBlacklist,
    templatePreviewOverlays,
    updateTemplatePreviewOverlay,
    ...suggestions
  };
};
