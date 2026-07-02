import {
  DIARY_NOTES_STATE_VERSION,
  EMPTY_DIARY_NOTES_DOCUMENT,
  type DiaryNoteTab,
  type DiaryNotesDocument,
  type DiaryNotesState,
  isDiaryNotesDocument,
  normalizeDiaryNotes,
} from '@/types/models/DiaryNotes';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { randomUUID } from '@/utils/runtimeId';

export function defaultTabTitle(index: number): string {
  return `Nota ${index}`;
}

export function createDiaryNoteTab(title: string, document?: DiaryNotesDocument): DiaryNoteTab {
  return {
    id: randomUUID(),
    title,
    document: document ?? { ...EMPTY_DIARY_NOTES_DOCUMENT, content: [] },
  };
}

export function createDefaultDiaryNotesState(): DiaryNotesState {
  const tab = createDiaryNoteTab(defaultTabTitle(1));
  return {
    version: DIARY_NOTES_STATE_VERSION,
    activeTabId: tab.id,
    tabs: [tab],
  };
}

function migrateDocumentToState(document: DiaryNotesDocument): DiaryNotesState {
  const tab = createDiaryNoteTab(defaultTabTitle(1), document);
  return {
    version: DIARY_NOTES_STATE_VERSION,
    activeTabId: tab.id,
    tabs: [tab],
  };
}

/**
 * Riconosce la forma di `DiaryNotesState` indipendentemente da `version`.
 *
 * Versioni future: in lettura accettiamo qualsiasi `version` numerica se la struttura
 * è valida, così i dati non vengono scartati come stato vuoto. Al salvataggio,
 * `buildPackedDiaryData` riscrive `DIARY_NOTES_STATE_VERSION` corrente (stato canonico).
 */
function hasDiaryNotesStateShape(value: unknown): value is DiaryNotesState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as DiaryNotesState;
  return (
    typeof state.version === 'number' &&
    typeof state.activeTabId === 'string' &&
    Array.isArray(state.tabs) &&
    state.tabs.length > 0 &&
    state.tabs.every(
      (tab) =>
        typeof tab.id === 'string' &&
        typeof tab.title === 'string' &&
        isDiaryNotesDocument(tab.document),
    )
  );
}

function repairDiaryNotesState(state: DiaryNotesState): DiaryNotesState {
  let changed = state.version !== DIARY_NOTES_STATE_VERSION;

  const tabs = state.tabs.map((tab, index) => {
    const title = tab.title.trim() || defaultTabTitle(index + 1);
    const document = normalizeDiaryNotes(tab.document);
    if (title !== tab.title || !snapshotsEqual(document, tab.document)) {
      changed = true;
      return { ...tab, title, document };
    }
    return tab;
  });

  const activeTabId = tabs.some((tab) => tab.id === state.activeTabId)
    ? state.activeTabId
    : tabs[0].id;
  if (activeTabId !== state.activeTabId) changed = true;

  if (!changed) return state;

  return {
    version: DIARY_NOTES_STATE_VERSION,
    activeTabId,
    tabs,
  };
}

/**
 * Normalizza qualsiasi valore persistito in `DiaryNotesState`.
 * Migra automaticamente il formato legacy (singolo documento).
 *
 * Se lo stato è già valido e coerente, restituisce la stessa istanza (identità stabile).
 */
export function normalizeDiaryNotesState(value: unknown): DiaryNotesState {
  if (hasDiaryNotesStateShape(value)) return repairDiaryNotesState(value);
  if (isDiaryNotesDocument(value)) return migrateDocumentToState(value);
  return createDefaultDiaryNotesState();
}

export function getActiveTab(state: DiaryNotesState): DiaryNoteTab {
  return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0];
}

export function getActiveTabDocument(state: DiaryNotesState): DiaryNotesDocument {
  return getActiveTab(state).document;
}

export function nextTabTitle(state: DiaryNotesState): string {
  return defaultTabTitle(state.tabs.length + 1);
}

export function setActiveTabId(state: DiaryNotesState, tabId: string): DiaryNotesState {
  if (!state.tabs.some((tab) => tab.id === tabId)) return state;
  return { ...state, activeTabId: tabId };
}

export function updateActiveTabDocument(
  state: DiaryNotesState,
  document: DiaryNotesDocument,
): DiaryNotesState {
  return {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === state.activeTabId ? { ...tab, document } : tab,
    ),
  };
}

export function addDiaryNoteTab(state: DiaryNotesState): DiaryNotesState {
  const tab = createDiaryNoteTab(nextTabTitle(state));
  return {
    ...state,
    activeTabId: tab.id,
    tabs: [...state.tabs, tab],
  };
}

/** Titoli duplicati sono ammessi intenzionalmente (scelta UX: massima libertà di rinomina). */
export function renameDiaryNoteTab(
  state: DiaryNotesState,
  tabId: string,
  title: string,
): DiaryNotesState {
  const trimmed = title.trim();
  if (!trimmed) return state;
  return {
    ...state,
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, title: trimmed } : tab)),
  };
}
