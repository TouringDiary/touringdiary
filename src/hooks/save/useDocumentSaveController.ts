import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStorageItem, setStorageItem } from '@/services/storageService';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import type { DocumentSavePhase, PersistResult } from '@/domain/save/documentSaveTypes';

const DEFAULT_DEBOUNCE_MS = 2500;
const DEFAULT_SAFETY_MS = 60_000;

export interface UseDocumentSaveControllerOptions<TSnapshot> {
  /** Unique key for autosave preference in storage */
  autosavePreferenceKey: string;
  isGuest: boolean;
  isNeverSaved: () => boolean;
  getSnapshot: () => TSnapshot;
  getDocumentId: () => string | null;
  persist: (snapshot: TSnapshot, options: {
    name?: string;
    asCopy?: boolean;
    documentId: string | null;
  }) => Promise<PersistResult>;
  onPersisted?: (result: PersistResult, snapshot: TSnapshot) => void;
  debounceMs?: number;
  safetyIntervalMs?: number;
  enabled?: boolean;
}

export function useDocumentSaveController<TSnapshot>({
  autosavePreferenceKey,
  isGuest,
  isNeverSaved,
  getSnapshot,
  getDocumentId,
  persist,
  onPersisted,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  safetyIntervalMs = DEFAULT_SAFETY_MS,
  enabled = true,
}: UseDocumentSaveControllerOptions<TSnapshot>) {
  const [phase, setPhase] = useState<DocumentSavePhase>('never_saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [autosaveEnabled, setAutosaveEnabledState] = useState<boolean>(() => {
    // Preferenza persistita; se assente parte da OFF (nuovi diari). Dopo il primo salvataggio
    // manuale viene attivata automaticamente — vedi runSave.
    const stored = getStorageItem<boolean | null>(autosavePreferenceKey, null);
    return stored ?? false;
  });

  const baselineRef = useRef<TSnapshot | null>(null);
  const phaseRef = useRef<DocumentSavePhase>('never_saved');
  const saveGenerationRef = useRef(0);
  const inFlightRef = useRef<Promise<string | null> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtySinceRef = useRef<number | null>(null);

  const getSnapshotRef = useRef(getSnapshot);
  const isNeverSavedRef = useRef(isNeverSaved);
  const persistRef = useRef(persist);
  const onPersistedRef = useRef(onPersisted);

  useEffect(() => { getSnapshotRef.current = getSnapshot; }, [getSnapshot]);
  useEffect(() => { isNeverSavedRef.current = isNeverSaved; }, [isNeverSaved]);
  useEffect(() => { persistRef.current = persist; }, [persist]);
  useEffect(() => { onPersistedRef.current = onPersisted; }, [onPersisted]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const canUseAutosave = !isGuest && phase !== 'never_saved';

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const cancelPendingAutosave = clearDebounce;

  const computePhaseFromSnapshot = useCallback((): DocumentSavePhase => {
    const snapshot = getSnapshotRef.current();
    if (baselineRef.current === null) {
      return isNeverSavedRef.current() ? 'never_saved' : 'dirty';
    }
    if (snapshotsEqual(snapshot, baselineRef.current)) {
      return isNeverSavedRef.current() ? 'never_saved' : 'synced';
    }
    return 'dirty';
  }, []);

  const markDirty = useCallback(() => {
    if (!enabled) return;
    if (phaseRef.current === 'saving') return;
    const next = computePhaseFromSnapshot();
    if (next !== 'dirty') return;
    if (dirtySinceRef.current === null) dirtySinceRef.current = Date.now();
    setPhase('dirty');
    setLastError(null);
  }, [computePhaseFromSnapshot, enabled]);

  const setBaseline = useCallback((snapshot: TSnapshot) => {
    baselineRef.current = snapshot;
    dirtySinceRef.current = null;
    setLastError(null);
    setPhase(computePhaseFromSnapshot());
  }, [computePhaseFromSnapshot]);

  const resetBaseline = useCallback(() => {
    setBaseline(getSnapshotRef.current());
  }, [setBaseline]);

  const runSave = useCallback(async (options?: {
    name?: string;
    asCopy?: boolean;
    force?: boolean;
  }): Promise<string | null> => {
    if (isGuest) return null;

    const snapshot = getSnapshotRef.current();
    const generation = ++saveGenerationRef.current;

    if (!options?.force && baselineRef.current !== null && snapshotsEqual(snapshot, baselineRef.current) && !options?.asCopy) {
      setPhase(isNeverSavedRef.current() ? 'never_saved' : 'synced');
      return getDocumentId();
    }

    clearDebounce();
    setPhase('saving');
    setLastError(null);

    // Nuovo diario: al primo salvataggio manuale attiva Auto-save (ON). I diari già esistenti non passano da qui.
    const shouldEnableAutosaveAfter =
      !!options?.force && !options?.asCopy && isNeverSavedRef.current();

    const savePromise = (async () => {
      try {
        const result = await persistRef.current(snapshot, {
          name: options?.name,
          asCopy: options?.asCopy,
          documentId: getDocumentId(),
        });

        if (generation !== saveGenerationRef.current) {
          return null;
        }

        onPersistedRef.current?.(result, snapshot);
        baselineRef.current = snapshot;
        setLastSavedAt(Date.now());

        if (shouldEnableAutosaveAfter) {
          setAutosaveEnabledState(true);
          setStorageItem(autosavePreferenceKey, true);
        }

        const currentAfterSave = getSnapshotRef.current();
        if (!snapshotsEqual(currentAfterSave, snapshot)) {
          dirtySinceRef.current = Date.now();
          setPhase('dirty');
        } else {
          dirtySinceRef.current = null;
          setPhase(isNeverSavedRef.current() ? 'never_saved' : 'synced');
        }
        return result.id;
      } catch (error) {
        if (generation !== saveGenerationRef.current) return null;
        const message = error instanceof Error ? error.message : 'Salvataggio non riuscito';
        setLastError(message);
        setPhase('error');
        return null;
      } finally {
        if (inFlightRef.current === savePromise) {
          inFlightRef.current = null;
        }
      }
    })();

    inFlightRef.current = savePromise;
    return savePromise;
  }, [autosavePreferenceKey, clearDebounce, getDocumentId, isGuest]);

  const flush = useCallback(() => runSave({ force: true }), [runSave]);

  const save = useCallback(
    (options?: { name?: string }) => runSave({ name: options?.name, force: true }),
    [runSave]
  );

  const saveAs = useCallback(
    (name: string) => runSave({ name, asCopy: true, force: true }),
    [runSave]
  );

  const awaitInFlight = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
    }
  }, []);

  const isSaving = useCallback(() => inFlightRef.current !== null, []);

  const setAutosaveEnabled = useCallback((value: boolean) => {
    setAutosaveEnabledState(value);
    setStorageItem(autosavePreferenceKey, value);
  }, [autosavePreferenceKey]);

  // Recompute dirty when enabled toggles
  useEffect(() => {
    if (!enabled) return;
    const next = computePhaseFromSnapshot();
    if (
      phaseRef.current !== 'saving' &&
      phaseRef.current !== 'error' &&
      next !== phaseRef.current
    ) {
      setPhase(next);
    }
  }, [computePhaseFromSnapshot, enabled, phase]);

  // Debounced autosave
  useEffect(() => {
    if (!enabled || isGuest || !autosaveEnabled || !canUseAutosave) return;
    if (phase !== 'dirty') return;

    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      void runSave();
    }, debounceMs);

    return clearDebounce;
  }, [autosaveEnabled, canUseAutosave, clearDebounce, debounceMs, enabled, isGuest, phase, runSave]);

  // Safety interval save
  useEffect(() => {
    if (!enabled || isGuest || !autosaveEnabled || !canUseAutosave) return;

    const interval = setInterval(() => {
      if (phaseRef.current !== 'dirty') return;
      if (dirtySinceRef.current === null) return;
      if (Date.now() - dirtySinceRef.current < safetyIntervalMs) return;
      void runSave();
    }, 5000);

    return () => clearInterval(interval);
  }, [autosaveEnabled, canUseAutosave, enabled, isGuest, runSave, safetyIntervalMs]);

  // Enable autosave preference after first successful save
  useEffect(() => {
    if (phase === 'synced' && !isNeverSaved() && !isGuest) {
      const pref = getStorageItem<boolean | null>(autosavePreferenceKey, null);
      if (pref === null) {
        setAutosaveEnabled(true);
      }
    }
  }, [autosavePreferenceKey, isGuest, isNeverSaved, phase, setAutosaveEnabled]);

  const controller = useMemo(
    () => ({
      phase,
      lastSavedAt,
      lastError,
      autosaveEnabled,
      canUseAutosave,
      isGuest,
      markDirty,
      save,
      saveAs,
      flush,
      setAutosaveEnabled,
      resetBaseline,
      setBaseline,
      awaitInFlight,
      isSaving,
      cancelPendingAutosave,
    }),
    [
      phase,
      lastSavedAt,
      lastError,
      autosaveEnabled,
      canUseAutosave,
      isGuest,
      markDirty,
      save,
      saveAs,
      flush,
      setAutosaveEnabled,
      resetBaseline,
      setBaseline,
      awaitInFlight,
      isSaving,
      cancelPendingAutosave,
    ]
  );

  return controller;
}
