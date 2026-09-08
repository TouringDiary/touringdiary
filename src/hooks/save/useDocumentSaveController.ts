import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentSavePhase, PersistResult } from '@/domain/save/documentSaveTypes';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { getStorageItem, setStorageItem } from '@/services/storageService';

const DEFAULT_DEBOUNCE_MS = 2500;
const DEFAULT_SAFETY_MS = 60_000;

type SaveRequestOptions = {
  name?: string;
  asCopy?: boolean;
  force?: boolean;
};

type SaveJob = {
  options: SaveRequestOptions;
  shouldEnableAutosaveAfter: boolean;
  waiters: Array<(id: string | null) => void>;
};

export interface UseDocumentSaveControllerOptions<TSnapshot> {
  /** Unique key for autosave preference in storage */
  autosavePreferenceKey: string;
  isGuest: boolean;
  isNeverSaved: () => boolean;
  /**
   * Se false, l'autosave (!force) non tenta il persist e non marca `error`
   * (es. nome obbligatorio ancora assente). Il save manuale usa `force` e resta invariato.
   */
  canPersist?: () => boolean;
  getSnapshot: () => TSnapshot;
  getDocumentId: () => string | null;
  persist: (
    snapshot: TSnapshot,
    options: {
      name?: string;
      asCopy?: boolean;
      documentId: string | null;
    },
  ) => Promise<PersistResult>;
  onPersisted?: (result: PersistResult, snapshot: TSnapshot) => void;
  debounceMs?: number;
  safetyIntervalMs?: number;
  enabled?: boolean;
}

export function useDocumentSaveController<TSnapshot>({
  autosavePreferenceKey,
  isGuest,
  isNeverSaved,
  canPersist,
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
  const queueRef = useRef<SaveJob[]>([]);
  const pumpPromiseRef = useRef<Promise<void> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtySinceRef = useRef<number | null>(null);

  const getSnapshotRef = useRef(getSnapshot);
  const isNeverSavedRef = useRef(isNeverSaved);
  const canPersistRef = useRef(canPersist);
  const persistRef = useRef(persist);
  const onPersistedRef = useRef(onPersisted);
  const getDocumentIdRef = useRef(getDocumentId);

  useEffect(() => {
    getSnapshotRef.current = getSnapshot;
  }, [getSnapshot]);
  useEffect(() => {
    isNeverSavedRef.current = isNeverSaved;
  }, [isNeverSaved]);
  useEffect(() => {
    canPersistRef.current = canPersist;
  }, [canPersist]);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);
  useEffect(() => {
    onPersistedRef.current = onPersisted;
  }, [onPersisted]);
  useEffect(() => {
    getDocumentIdRef.current = getDocumentId;
  }, [getDocumentId]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Autosave solo dopo il primo salvataggio riuscito (documento persistito), e solo
  // se il controller è abilitato. Allinea il flag alla possibilità runtime reale.
  const canUseAutosave = enabled && !isGuest && !isNeverSaved();

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

  const markDirty = useCallback(
    (forceExplicit = false) => {
      if (!enabled) return;
      if (phaseRef.current === 'saving') return;
      const next = computePhaseFromSnapshot();
      if (next === 'dirty') {
        if (dirtySinceRef.current === null) dirtySinceRef.current = Date.now();
        setPhase('dirty');
        setLastError(null);
        return;
      }
      // `forceExplicit` proviene da una mutazione locale appena applicata
      // (notifyLocalMutation): lo snapshot letto qui può precedere il commit React,
      // quindi `computePhaseFromSnapshot` restituirebbe ancora 'synced' e il segnale
      // andrebbe perso. Onoriamo il segnale solo se il documento è già persistito
      // (le bozze non fanno autosave); l'effetto di ricomputo post-commit riporta
      // a 'synced' se la mutazione non ha prodotto differenze reali, e runSave
      // protegge comunque da salvataggi no-op.
      if (forceExplicit && !isNeverSavedRef.current()) {
        if (dirtySinceRef.current === null) dirtySinceRef.current = Date.now();
        setPhase('dirty');
        setLastError(null);
      }
    },
    [computePhaseFromSnapshot, enabled],
  );

  const setBaseline = useCallback(
    (snapshot: TSnapshot) => {
      baselineRef.current = snapshot;
      dirtySinceRef.current = null;
      setLastError(null);
      setPhase(computePhaseFromSnapshot());
    },
    [computePhaseFromSnapshot],
  );

  const seedLastSavedAt = useCallback((at: number) => {
    setLastSavedAt((prev) => prev ?? at);
  }, []);

  const restoreLastSavedAt = useCallback((at: number) => {
    setLastSavedAt(at);
  }, []);

  const resetBaseline = useCallback(() => {
    setBaseline(getSnapshotRef.current());
  }, [setBaseline]);

  const resolveWaiters = useCallback((job: SaveJob, id: string | null) => {
    for (const waiter of job.waiters) {
      waiter(id);
    }
  }, []);

  const executeJob = useCallback(
    async (job: SaveJob) => {
      try {
        // Snapshot preso all'avvio della write (dopo eventuale attesa in coda): latest-wins.
        const snapshot = getSnapshotRef.current();

        if (!job.options.force && !job.options.asCopy) {
          if (isNeverSavedRef.current() || (canPersistRef.current && !canPersistRef.current())) {
            // runSave aveva già messo `saving`; ripristina la fase dallo snapshot corrente.
            setPhase(computePhaseFromSnapshot());
            resolveWaiters(job, null);
            return;
          }
          if (baselineRef.current !== null && snapshotsEqual(snapshot, baselineRef.current)) {
            setPhase(isNeverSavedRef.current() ? 'never_saved' : 'synced');
            resolveWaiters(job, getDocumentIdRef.current());
            return;
          }
        }

        setPhase('saving');
        setLastError(null);

        const result = await persistRef.current(snapshot, {
          name: job.options.name,
          asCopy: job.options.asCopy,
          documentId: getDocumentIdRef.current(),
        });

        baselineRef.current = snapshot;
        setLastSavedAt(Date.now());

        if (job.shouldEnableAutosaveAfter) {
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
        resolveWaiters(job, result.id);

        if (onPersistedRef.current) {
          try {
            onPersistedRef.current(result, snapshot);
          } catch (onPersistedError) {
            console.error(
              '[useDocumentSaveController] Error inside onPersisted callback:',
              onPersistedError,
            );
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Salvataggio non riuscito';
        setLastError(message);
        setPhase('error');
        resolveWaiters(job, null);
      }
    },
    [autosavePreferenceKey, computePhaseFromSnapshot, resolveWaiters],
  );

  const pumpQueue = useCallback(() => {
    if (pumpPromiseRef.current) return;

    const pump = (async () => {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift();
        if (!job) break;
        try {
          await executeJob(job);
        } catch (pumpErr) {
          console.error('[useDocumentSaveController] executeJob threw unhandled exception:', pumpErr);
        }
      }
    })();

    pumpPromiseRef.current = pump;
    void pump.finally(() => {
      if (pumpPromiseRef.current === pump) {
        pumpPromiseRef.current = null;
      }
      // Nuovi job possono essere arrivati tra l'uscita del while e il clear del pump.
      if (queueRef.current.length > 0) {
        pumpQueue();
      }
    });
  }, [executeJob]);

  const enqueueJob = useCallback(
    (job: Omit<SaveJob, 'waiters'>): Promise<string | null> => {
      return new Promise<string | null>((resolve) => {
        const queue = queueRef.current;
        const last = queue[queue.length - 1];
        // Coalesce solo save "normali" (non saveAs): l'ultimo snapshot vince quando la write parte.
        if (last && !last.options.asCopy && !job.options.asCopy) {
          last.options = {
            force: !!(last.options.force || job.options.force),
            name: job.options.name ?? last.options.name,
            asCopy: false,
          };
          last.shouldEnableAutosaveAfter =
            last.shouldEnableAutosaveAfter || job.shouldEnableAutosaveAfter;
          last.waiters.push(resolve);
        } else {
          queue.push({
            options: job.options,
            shouldEnableAutosaveAfter: job.shouldEnableAutosaveAfter,
            waiters: [resolve],
          });
        }
        pumpQueue();
      });
    },
    [pumpQueue],
  );

  const runSave = useCallback(
    async (options?: {
      name?: string;
      asCopy?: boolean;
      force?: boolean;
    }): Promise<string | null> => {
      if (isGuest) return null;

      const snapshot = getSnapshotRef.current();

      // Percorso autosave (!force): skip silenzioso se il documento non è ancora persistibile.
      // Nessun phase=error — distingue "non pronto" da un vero fallimento di salvataggio.
      if (!options?.force && !options?.asCopy) {
        if (isNeverSavedRef.current()) return null;
        if (canPersistRef.current && !canPersistRef.current()) return null;
      }

      if (
        !options?.force &&
        baselineRef.current !== null &&
        snapshotsEqual(snapshot, baselineRef.current) &&
        !options?.asCopy
      ) {
        setPhase(isNeverSavedRef.current() ? 'never_saved' : 'synced');
        return getDocumentIdRef.current();
      }

      clearDebounce();
      setPhase('saving');
      setLastError(null);

      // Nuovo diario: al primo salvataggio manuale attiva Auto-save (ON). I diari già esistenti non passano da qui.
      const shouldEnableAutosaveAfter =
        !!options?.force && !options?.asCopy && isNeverSavedRef.current();

      return enqueueJob({
        options: {
          name: options?.name,
          asCopy: options?.asCopy,
          force: options?.force,
        },
        shouldEnableAutosaveAfter,
      });
    },
    [clearDebounce, enqueueJob, isGuest],
  );

  const flush = useCallback(() => runSave({ force: true }), [runSave]);

  const save = useCallback(
    (options?: { name?: string }) => runSave({ name: options?.name, force: true }),
    [runSave],
  );

  const saveAs = useCallback(
    (name: string) => runSave({ name, asCopy: true, force: true }),
    [runSave],
  );

  const awaitInFlight = useCallback(async () => {
    // Attende il drain completo: write in corso + eventuali job coalesced ancora in coda.
    while (pumpPromiseRef.current || queueRef.current.length > 0) {
      if (pumpPromiseRef.current) {
        await pumpPromiseRef.current;
      } else if (queueRef.current.length > 0) {
        pumpQueue();
        if (pumpPromiseRef.current) {
          await pumpPromiseRef.current;
        }
      }
    }
  }, [pumpQueue]);

  const isSaving = useCallback(
    () => pumpPromiseRef.current !== null || queueRef.current.length > 0,
    [],
  );

  const setAutosaveEnabled = useCallback(
    (value: boolean) => {
      setAutosaveEnabledState(value);
      setStorageItem(autosavePreferenceKey, value);
    },
    [autosavePreferenceKey],
  );

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
  }, [
    autosaveEnabled,
    canUseAutosave,
    clearDebounce,
    debounceMs,
    enabled,
    isGuest,
    phase,
    runSave,
  ]);

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
      seedLastSavedAt,
      restoreLastSavedAt,
      awaitInFlight,
      isSaving,
      cancelPendingAutosave,
      getPhase: () => phaseRef.current,
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
      seedLastSavedAt,
      restoreLastSavedAt,
      awaitInFlight,
      isSaving,
      cancelPendingAutosave,
    ],
  );

  return controller;
}
