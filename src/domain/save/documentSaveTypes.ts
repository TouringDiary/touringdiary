/** Lifecycle phase of a persisted document (Diario / Valigia). */
export type DocumentSavePhase =
  | 'never_saved'
  | 'synced'
  | 'dirty'
  | 'saving'
  | 'error';

/**
 * Phase semantics:
 * - never_saved: document not yet persisted AND snapshot matches baseline (pristine).
 *   Does NOT block exit/navigation — no user edits since open.
 * - dirty: snapshot differs from baseline (first save pending or edits after save).
 * - synced: persisted and matches baseline.
 * - saving / error: in-flight or failed persist.
 */
export function phaseHasUnsavedChanges(phase: DocumentSavePhase): boolean {
  return phase === 'dirty' || phase === 'saving' || phase === 'error';
}

export function phaseBlocksExit(phase: DocumentSavePhase): boolean {
  return phaseHasUnsavedChanges(phase);
}

export type DocumentKind = 'diary' | 'suitcase';

export interface PersistResult {
  id: string;
}

export interface DocumentSaveController {
  phase: DocumentSavePhase;
  lastSavedAt: number | null;
  lastError: string | null;
  autosaveEnabled: boolean;
  canUseAutosave: boolean;
  isGuest: boolean;
  markDirty: (forceExplicit?: boolean) => void;
  save: (options?: { name?: string }) => Promise<string | null>;
  saveAs: (name: string) => Promise<string | null>;
  flush: () => Promise<string | null>;
  setAutosaveEnabled: (enabled: boolean) => void;
  resetBaseline: () => void;
  setBaseline: (snapshot: unknown) => void;
  awaitInFlight: () => Promise<void>;
  isSaving: () => boolean;
  cancelPendingAutosave: () => void;
  getPhase: () => DocumentSavePhase;
}

export const AUTOSAVE_PREF_KEYS = {
  diary: 'prefs.autosave.diary',
  suitcase: 'prefs.autosave.suitcase',
} as const;

export const GUEST_SAVE_MESSAGE =
  'Effettua il login per salvare e collegare i tuoi contenuti.';
