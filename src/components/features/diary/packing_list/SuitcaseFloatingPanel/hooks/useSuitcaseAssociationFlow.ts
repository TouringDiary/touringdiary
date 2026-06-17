import { useCallback, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Itinerary } from '@/types';
import { Suitcase } from '@/types/suitcase';
import { ToastVariant } from '@/types/toast';
import {
  executeSuitcaseDiaryAssociation,
  SuitcaseAssociationError,
} from '@/services/suitcase/associateSuitcaseWithDiary';
import { isAssociableSuitcase } from '@/utils/suitcaseDomain';
import {
  associationCaseToModalVariant,
  AssociationCase,
  isDiaryPersisted,
  isSuitcasePersisted,
  LinkModalVariant,
  resolveAssociationCase,
} from '@/utils/suitcaseAssociation';
import type { SuitcasePanelViewMode } from '../types/panelViewMode';

const ASSOCIATION_SUCCESS_TOAST: Record<
  AssociationCase,
  { message: string; description: string }
> = {
  A: {
    message: 'Valigia collegata al diario',
    description: 'La valigia è ora sincronizzata con il diario di viaggio.',
  },
  B: {
    message: 'Diario salvato ed associato',
    description: 'Il diario di viaggio è stato salvato e collegato alla valigia.',
  },
  C: {
    message: 'Valigia salvata ed associata',
    description: 'La valigia è stata salvata e collegata al diario di viaggio.',
  },
  D: {
    message: 'Salvato ed associato',
    description: 'Il diario di viaggio e la valigia sono stati salvati ed associati.',
  },
};

export type AssociationSuccessNavigation = 'editor' | 'selector';

export interface RequestAssociationOptions {
  successNavigation: AssociationSuccessNavigation;
  closeAssociationModal?: boolean;
  successToast?: { message: string; description: string };
  /** Chiamato quando l'associazione passa al modale nomi (B/C/D), prima di aprirlo. */
  onBeforeLinkModal?: () => void;
  onSuccess?: () => void;
}

interface AssociationFlowProps {
  itinerary: Itinerary;
  savedProjects: Itinerary[];
  itineraryId: string | null;
  isDiaryAssociable: boolean;
  currentUser: User | null;
  userSuitcases: Suitcase[];
  guestSuitcase?: Suitcase | null;
  saveProject: (name?: string) => Promise<string | null>;
  persistGuestSuitcase: (userId: string, title?: string) => Promise<Suitcase | null>;
  linkSuitcaseToTrip: (itId: string, scId: string, userId: string) => Promise<void>;
  fetchLinkedIds: (overrideItineraryId?: string) => Promise<void>;
  fetchUserSuitcases: () => void;
  clearNewSuitcaseSession: () => void;
  setShowAssociationModal: (value: boolean) => void;
  setActiveTabId: (id: string | null) => void;
  setViewMode: (mode: SuitcasePanelViewMode) => void;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
  onLoginRequired: () => void;
}

export const useSuitcaseAssociationFlow = ({
  itinerary,
  savedProjects,
  itineraryId,
  isDiaryAssociable,
  currentUser,
  userSuitcases,
  guestSuitcase,
  saveProject,
  persistGuestSuitcase,
  linkSuitcaseToTrip,
  fetchLinkedIds,
  fetchUserSuitcases,
  clearNewSuitcaseSession,
  setShowAssociationModal,
  setActiveTabId,
  setViewMode,
  showToast,
  onLoginRequired,
}: AssociationFlowProps) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalVariant, setLinkModalVariant] = useState<LinkModalVariant>('both');
  const [pendingSuitcaseId, setPendingSuitcaseId] = useState<string | null>(null);
  const [pendingSuitcaseTitle, setPendingSuitcaseTitle] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const pendingAssociationOptsRef = useRef<Partial<RequestAssociationOptions>>({});
  const pendingSuccessNavigationRef = useRef<AssociationSuccessNavigation>('editor');

  const resolveSuitcaseTitle = useCallback(
    (suitcaseId: string) =>
      userSuitcases.find((suitcase) => suitcase.id === suitcaseId)?.title ||
      (guestSuitcase?.id === suitcaseId ? guestSuitcase.title : '') ||
      '',
    [guestSuitcase, userSuitcases]
  );

  const applyAssociationSuccess = useCallback(
    async (
      result: { itineraryId: string; suitcaseId: string },
      navigation: AssociationSuccessNavigation,
      associationCase: AssociationCase
    ) => {
      await fetchLinkedIds(result.itineraryId);
      fetchUserSuitcases();
      clearNewSuitcaseSession();

      if (navigation === 'editor') {
        setActiveTabId(result.suitcaseId);
        setViewMode('editor');
      } else {
        setShowAssociationModal(false);
        setViewMode('selector');
        setActiveTabId(null);
      }

      const toast =
        pendingAssociationOptsRef.current.successToast ??
        ASSOCIATION_SUCCESS_TOAST[associationCase];
      showToast(toast.message, toast.description, 'success');

      pendingAssociationOptsRef.current.onSuccess?.();
      pendingAssociationOptsRef.current = {};
    },
    [
      fetchLinkedIds,
      fetchUserSuitcases,
      setActiveTabId,
      clearNewSuitcaseSession,
      setShowAssociationModal,
      setViewMode,
      showToast,
    ]
  );

  const runAssociation = useCallback(
    async (
      suitcaseId: string,
      names?: { diaryName?: string; suitcaseName?: string }
    ) => {
      if (!currentUser?.id) {
        showToast(
          'Accesso richiesto',
          'Effettua il login per associare una valigia al diario.',
          'destructive'
        );
        onLoginRequired();
        return;
      }

      const diaryPersisted = isDiaryPersisted(itinerary, savedProjects);
      const suitcasePersisted = isSuitcasePersisted(suitcaseId);
      const associationCase = resolveAssociationCase(diaryPersisted, suitcasePersisted);
      const effectiveItineraryId = diaryPersisted ? itinerary.id : itineraryId;
      const successNavigation = pendingSuccessNavigationRef.current;

      setIsAssociating(true);
      try {
        const result = await executeSuitcaseDiaryAssociation({
          associationCase,
          userId: currentUser.id,
          itineraryId: effectiveItineraryId,
          suitcaseId,
          diaryName: names?.diaryName ?? itinerary.name,
          suitcaseName: names?.suitcaseName ?? pendingSuitcaseTitle,
          deps: {
            saveDiary: async (name) => {
              const savedId = await saveProject(name);
              if (!savedId) {
                throw new SuitcaseAssociationError(
                  'Impossibile salvare il diario. Riprova.',
                  'save-diary'
                );
              }
              return savedId;
            },
            persistGuestSuitcase: async (userId, title) => {
              const persisted = await persistGuestSuitcase(userId, title);
              if (!persisted) {
                throw new SuitcaseAssociationError(
                  'Impossibile salvare la valigia. Riprova.',
                  'persist-suitcase'
                );
              }
              return persisted;
            },
            linkSuitcaseToTrip,
          },
        });

        setLinkModalOpen(false);
        setPendingSuitcaseId(null);
        setPendingSuitcaseTitle('');
        await applyAssociationSuccess(result, successNavigation, associationCase);
      } catch (error) {
        const message =
          error instanceof SuitcaseAssociationError
            ? error.message
            : 'Associazione non riuscita. Riprova.';
        showToast('Associazione non riuscita', message, 'destructive');
        console.error('[useSuitcaseAssociationFlow] Association failed:', error);
      } finally {
        setIsAssociating(false);
      }
    },
    [
      pendingSuitcaseTitle,
      applyAssociationSuccess,
      currentUser?.id,
      itinerary,
      itineraryId,
      linkSuitcaseToTrip,
      onLoginRequired,
      persistGuestSuitcase,
      saveProject,
      savedProjects,
      showToast,
    ]
  );

  const requestAssociation = useCallback(
    async (suitcaseId: string, options: RequestAssociationOptions) => {
      if (!currentUser?.id) {
        showToast(
          'Accesso richiesto',
          'Effettua il login per associare una valigia al diario.',
          'destructive'
        );
        onLoginRequired();
        return;
      }

      pendingSuccessNavigationRef.current = options.successNavigation;
      pendingAssociationOptsRef.current = options;

      const diaryPersisted = isDiaryPersisted(itinerary, savedProjects);
      const suitcasePersisted = isSuitcasePersisted(suitcaseId);
      const associationCase = resolveAssociationCase(diaryPersisted, suitcasePersisted);
      const modalVariant = associationCaseToModalVariant(associationCase);

      if (modalVariant) {
        if (options.closeAssociationModal) {
          setShowAssociationModal(false);
        }
        options.onBeforeLinkModal?.();
        setPendingSuitcaseId(suitcaseId);
        setPendingSuitcaseTitle(resolveSuitcaseTitle(suitcaseId));
        setLinkModalVariant(modalVariant);
        setLinkModalOpen(true);
        return;
      }

      await runAssociation(suitcaseId);
    },
    [
      currentUser?.id,
      itinerary,
      onLoginRequired,
      resolveSuitcaseTitle,
      runAssociation,
      savedProjects,
      setShowAssociationModal,
      showToast,
    ]
  );

  const handleLinkExisting = useCallback(
    async (suitcaseId: string) => {
      const suitcase = userSuitcases.find((s) => s.id === suitcaseId);
      if (suitcase && !isAssociableSuitcase(suitcase)) {
        showToast(
          'Associazione non disponibile',
          'I template non possono essere associati al diario. Usa «Usa template» per creare una valigia.',
          'destructive'
        );
        return;
      }

      if (!isDiaryAssociable) {
        showToast(
          'Diario non associabile',
          'Imposta le date del viaggio e aggiungi almeno una tappa per associare una valigia.',
          'destructive'
        );
        return;
      }

      await requestAssociation(suitcaseId, { successNavigation: 'editor' });
    },
    [isDiaryAssociable, requestAssociation, showToast, userSuitcases]
  );

  const handleLinkModalConfirm = useCallback(
    async (values: { diaryName?: string; suitcaseName?: string }) => {
      if (!pendingSuitcaseId) return;
      await runAssociation(pendingSuitcaseId, values);
    },
    [pendingSuitcaseId, runAssociation]
  );

  const handleLinkModalCancel = useCallback(() => {
    if (isAssociating) return;
    setLinkModalOpen(false);
    setPendingSuitcaseId(null);
    setPendingSuitcaseTitle('');
  }, [isAssociating]);

  return {
    handleLinkExisting,
    requestAssociation,
    linkModalOpen,
    linkModalVariant,
    isAssociating,
    defaultDiaryName: itinerary.name || '',
    defaultSuitcaseName: pendingSuitcaseTitle,
    handleLinkModalConfirm,
    handleLinkModalCancel,
  };
};
