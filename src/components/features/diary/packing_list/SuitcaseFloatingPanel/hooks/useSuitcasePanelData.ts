import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  useUserSuitcases,
  useSuitcaseItemsMutations,
  useGlobalTemplates,
  useCreateSuitcase,
  useCloneSuitcase,
  useCityTypeTemplates,
  useUserTemplatePreferences
} from '@/hooks/useSuitcaseSystem';
import { useUI } from '@/context/UIContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';
import { useSuitcaseLifecycle } from './useSuitcaseLifecycle';
import { useFloatingPanelStateSync } from './useFloatingPanelOptimisticUpdates';
import { useSuitcaseSelectors } from '../selectors/suitcaseSelectors';
import { useSuitcaseAffiliate } from './useSuitcaseAffiliate';
import { useSuitcaseSuggestions } from './useSuitcaseSuggestions';
import { useFloatingPanelState } from './useFloatingPanelState';
import { useFloatingPanelModals } from './useFloatingPanelModals';

/**
 * Funzione pura per determinare il tab iniziale della valigia
 */
export function resolveInitialSuitcaseTab(
  currentUser: any,
  tripSuitcaseCount: number,
  savedSuitcaseCount: number
): 'trip' | 'saved' | 'default' {
  if (tripSuitcaseCount > 0) return 'trip';
  if (savedSuitcaseCount > 0) return 'saved';
  return 'default';
}

export const useSuitcasePanelData = (propItineraryId: string | null, cityType?: string, initialSuitcaseId?: string | null) => {

  const { itinerary } = useItinerary();
  const itineraryId = propItineraryId || itinerary?.id;

  const { configs } = useConfig();
  const { isSidebarOpen } = useUI();

  /**
   * 1. Stato pannello
   *
   * Tab iniziale = TEMPLATE (default)
   * poi verrà aggiornato dinamicamente quando i dati diventano disponibili
   */
  const panelState = useFloatingPanelState('selector', 'default');
  const modalState = useFloatingPanelModals();

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false
  });

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setToast({ message, visible: true });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  /**
   * 2. Template globali
   */
  const { globalTemplates, fetchGlobalTemplates } = useGlobalTemplates();

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
    activeSuitcase
  } = useSuitcaseSelectors(
    userSuitcases,
    linkedSuitcaseIds,
    panelState.activeTabId,
    currentUser?.id
  );

  /**
   * 6. Readiness selectors
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

  const selectorsReady =
    linkedSuitcaseIds !== null;

  /**
   * 7. Auto-selezione tab dinamica (logica UX definitiva)
/**
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
       panelState.setActiveTabId(initialSuitcaseId);
       panelState.setViewMode('editor');
       hasInitializedTab.current = true;
    }
  }, [initialSuitcaseId, dataReady]);

  useEffect(() => {
    if (!dataReady || hasInitializedTab.current) return;

    const initialTab = resolveInitialSuitcaseTab(currentUser, tripCount, savedCount);

    // Prima inizializzazione
    if (!hasInitializedTab.current) {
      setSourceTab(initialTab);
      hasInitializedTab.current = true;
      previousTripCount.current = tripCount;
      previousSavedCount.current = savedCount;
      return;
    }

    /**
     * Aggiornamento reattivo
     * Monitoriamo principalmente l'aggiunta/rimozione dal diario.
     */
    if (tripCount !== previousTripCount.current || 
       (savedCount !== previousSavedCount.current && panelState.sourceTab === 'default')) {
      // PROTEZIONE: Se stiamo editando una valigia guest, non resettiamo forzatamente il tab al login
      if (panelState.activeTabId?.startsWith('guest-suitcase-')) {
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
    panelState.sourceTab
  ]);

  /**
   * 8. Affiliate + Suggestions
   */

  const { suggestedTemplateIds } =
    useCityTypeTemplates(cityType || null);

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
    useCallback((id: string, updates: any) => {
      setUserSuitcases(prev => {
        const next = prev.map(s =>
          s.id === id
            ? { ...s, ...updates }
            : s
        );
        
        if (!currentUser || currentUser.role === 'guest') {
          const guestSc = next.find(s => s.id === id);
          if (guestSc) {
            localStorage.setItem('GUEST_LOCAL_SUITCASE', JSON.stringify(guestSc));
          }
        }
        
        return next;
      });

    }, [setUserSuitcases, currentUser]);

  /**
   * 9. Mutations
   */
  const mutations = useSuitcaseItemsMutations();
  const {
    createSuitcase,
    isCreating: isCreatingSuitcase
  } = useCreateSuitcase();
  const {
    cloneSuitcase,
    isCloning
  } = useCloneSuitcase();

  /**
   * 10. Suggestions engine
   */

  const suggestions =
    useSuitcaseSuggestions({
      linkedSuitcaseIds,
      suggestedTemplateIds,
      globalTemplates,
      activeSuitcase,
      itinerary,
      fetchUserSuitcases,
      setSaveStatus
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
    activeSuitcase,
    affiliateMaps,
    handleStateSync,
    handleUpdateSuitcaseLocal,
    mutations,
    createSuitcase,
    isCreatingSuitcase,
    cloneSuitcase,
    isCloning,
    itinerary,
    hasSuitcaseLinkedToDiary: tripSuitcases.length > 0,
    adminSuitcasePlaceholders: configs?.[SETTINGS_KEYS.SUITCASE_PLACEHOLDERS] || {},
    ...suggestions
  };
};