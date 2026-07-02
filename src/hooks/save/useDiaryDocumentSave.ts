import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Itinerary } from '@/types';
import { useDocumentSaveController } from '@/hooks/save/useDocumentSaveController';
import { AUTOSAVE_PREF_KEYS, phaseHasUnsavedChanges } from '@/domain/save/documentSaveTypes';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { isDiaryPersisted, isDiaryTempId } from '@/utils/suitcaseAssociation';
import { registerDocumentExitGate, controllerToExitRegistration } from '@/focus/exitGate/documentExitRegistry';
import { registerDocumentSaveController } from '@/domain/save/documentSaveRegistry';

interface UseDiaryDocumentSaveOptions {
  itinerary: Itinerary;
  savedProjects: Itinerary[];
  isGuest: boolean;
  saveProject: (name?: string, isSaveAs?: boolean) => Promise<string | null>;
  onSaved?: (id: string) => void;
  onSaveAsNavigate?: (id: string) => void;
}

const getPersistedSavedAt = (itinerary: Itinerary): number | undefined =>
  itinerary.updatedAt ?? itinerary.createdAt;

const diarySnapshot = (itinerary: Itinerary) => ({
  id: itinerary.id,
  name: itinerary.name,
  startDate: itinerary.startDate,
  endDate: itinerary.endDate,
  items: itinerary.items,
  dayStyles: itinerary.dayStyles,
  roadbook: itinerary.roadbook,
  diaryNotes: itinerary.diaryNotes ?? null,
});

export function useDiaryDocumentSave({
  itinerary,
  savedProjects,
  isGuest,
  saveProject,
  onSaved,
  onSaveAsNavigate,
}: UseDiaryDocumentSaveOptions) {
  const itineraryRef = useRef(itinerary);
  itineraryRef.current = itinerary;

  const prevSnapshotRef = useRef<ReturnType<typeof diarySnapshot> | null>(null);
  const baselineDocIdRef = useRef<string | null>(null);
  const baselineSourceRef = useRef<'itinerary' | 'savedProjects' | null>(null);

  const isNeverSaved = useCallback(
    () => !isDiaryPersisted(itineraryRef.current, savedProjects),
    [savedProjects]
  );

  const persist = useCallback(
    async (
      snapshot: ReturnType<typeof diarySnapshot>,
      options: { name?: string; asCopy?: boolean; documentId: string | null }
    ) => {
      const name = options.name ?? snapshot.name;
      if (!name?.trim()) {
        throw new Error('Inserisci un nome per il diario.');
      }
      const id = await saveProject(name, options.asCopy);
      if (!id) throw new Error('Salvataggio non riuscito');
      if (options.asCopy) {
        onSaveAsNavigate?.(id);
      } else {
        onSaved?.(id);
      }
      return { id };
    },
    [onSaveAsNavigate, onSaved, saveProject]
  );

  const controller = useDocumentSaveController({
    autosavePreferenceKey: AUTOSAVE_PREF_KEYS.diary,
    isGuest,
    isNeverSaved,
    getSnapshot: () => diarySnapshot(itineraryRef.current),
    getDocumentId: () => itineraryRef.current.id,
    persist,
    enabled: !isGuest,
  });

  // Mark dirty when itinerary content changes (stable compare via snapshotsEqual)
  useEffect(() => {
    const next = diarySnapshot(itinerary);
    if (prevSnapshotRef.current !== null && !snapshotsEqual(prevSnapshotRef.current, next)) {
      controller.markDirty();
    }
    prevSnapshotRef.current = next;
  }, [itinerary, controller]);

  // Baseline on document load / switch — not on every savedProjects refresh after save.
  useEffect(() => {
    if (baselineDocIdRef.current !== null && baselineDocIdRef.current !== itinerary.id) {
      baselineSourceRef.current = null;
    }

    const isPersisted = isDiaryPersisted(itinerary, savedProjects);

    if (baselineDocIdRef.current === itinerary.id) {
      if (baselineSourceRef.current === 'savedProjects') return;
      if (!isPersisted) return;

      const baseline = savedProjects.find((p) => p.id === itinerary.id);
      if (!baseline) return;
      controller.setBaseline(diarySnapshot(baseline));
      const savedAt = getPersistedSavedAt(baseline);
      if (savedAt) controller.restoreLastSavedAt(savedAt);
      baselineSourceRef.current = 'savedProjects';
      prevSnapshotRef.current = diarySnapshot(itinerary);
      return;
    }

    if (isPersisted) {
      const baseline = savedProjects.find((p) => p.id === itinerary.id);
      if (!baseline) return;
      controller.setBaseline(diarySnapshot(baseline));
      const savedAt = getPersistedSavedAt(baseline);
      if (savedAt) controller.restoreLastSavedAt(savedAt);
      baselineSourceRef.current = 'savedProjects';
    } else {
      controller.setBaseline(diarySnapshot(itinerary));
      baselineSourceRef.current = 'itinerary';
    }

    baselineDocIdRef.current = itinerary.id;
    prevSnapshotRef.current = diarySnapshot(itinerary);
  }, [itinerary.id, itinerary, savedProjects, controller]);

  useEffect(() => {
    const unregister = registerDocumentExitGate(
      controllerToExitRegistration('diary', 'Diario di viaggio', controller)
    );
    const unregisterSave = registerDocumentSaveController('diary', controller);
    return () => {
      unregister();
      unregisterSave();
    };
  }, [controller]);

  const handleSave = useCallback(async () => {
    if (isGuest) return null;
    if (isNeverSaved() || !itinerary.name?.trim()) {
      return 'needs_name' as const;
    }
    return controller.save();
  }, [controller, isGuest, isNeverSaved, itinerary.name]);

  const handleSaveAs = useCallback(
    async (name: string) => controller.saveAs(name),
    [controller]
  );

  const isDirty = useMemo(
    () => phaseHasUnsavedChanges(controller.phase),
    [controller.phase]
  );

  return {
    ...controller,
    handleSave,
    handleSaveAs,
    isDirty,
    isNeverSaved,
    needsNameForSave: () => isNeverSaved() || !itinerary.name?.trim(),
  };
}

export { isDiaryTempId };
