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

import {
  stampDiaryNoteTabCreated,
  stampDiaryNoteTabModified,
} from '@/domain/diary/diaryAuthorTracking';

export function createDiaryNoteTab(
  title: string,
  document?: DiaryNotesDocument,
  createdBy?: string
): DiaryNoteTab {
  const tab: DiaryNoteTab = {
    id: randomUUID(),
    title,
    document: document ?? { ...EMPTY_DIARY_NOTES_DOCUMENT, content: [] },
  };
  return createdBy ? stampDiaryNoteTabCreated(tab, createdBy) : tab;
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
  lastModifiedBy?: string,
): DiaryNotesState {
  return {
    ...state,
    tabs: state.tabs.map((tab) => {
      if (tab.id !== state.activeTabId) return tab;
      const updated = { ...tab, document };
      return lastModifiedBy ? stampDiaryNoteTabModified(updated, lastModifiedBy) : updated;
    }),
  };
}

export function addDiaryNoteTab(state: DiaryNotesState, createdBy?: string): DiaryNotesState {
  const tab = createDiaryNoteTab(nextTabTitle(state), undefined, createdBy);
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

function cloneDocument(document: DiaryNotesDocument): DiaryNotesDocument {
  return JSON.parse(JSON.stringify(document)) as DiaryNotesDocument;
}

export function duplicateDiaryNoteTab(
  state: DiaryNotesState,
  tabId: string,
  createdBy?: string,
): DiaryNotesState {
  const source = state.tabs.find((tab) => tab.id === tabId);
  if (!source) return state;

  const copyTitle = `Copia di ${source.title}`;
  const tab = createDiaryNoteTab(copyTitle, cloneDocument(source.document), createdBy);
  const sourceIndex = state.tabs.findIndex((t) => t.id === tabId);
  const tabs = [...state.tabs];
  tabs.splice(sourceIndex + 1, 0, tab);

  return {
    ...state,
    activeTabId: tab.id,
    tabs,
  };
}

export function deleteDiaryNoteTab(state: DiaryNotesState, tabId: string): DiaryNotesState {
  if (state.tabs.length <= 1) return state;

  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return state;

  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  let activeTabId = state.activeTabId;
  if (activeTabId === tabId) {
    const nextIndex = Math.min(index, tabs.length - 1);
    activeTabId = tabs[nextIndex].id;
  }

  return { ...state, activeTabId, tabs };
}

export function moveDiaryNoteTab(
  state: DiaryNotesState,
  tabId: string,
  targetIndex: number,
): DiaryNotesState {
  const fromIndex = state.tabs.findIndex((tab) => tab.id === tabId);
  if (fromIndex < 0) return state;

  const tabs = [...state.tabs];
  const [moved] = tabs.splice(fromIndex, 1);
  const clamped = Math.max(0, Math.min(targetIndex, tabs.length));
  tabs.splice(clamped, 0, moved);

  return { ...state, tabs };
}

/** Sposta il tab immediatamente prima di `beforeTabId`. */
export function moveDiaryNoteTabBefore(
  state: DiaryNotesState,
  tabId: string,
  beforeTabId: string,
): DiaryNotesState {
  if (tabId === beforeTabId) return state;
  const fromIndex = state.tabs.findIndex((tab) => tab.id === tabId);
  const toIndex = state.tabs.findIndex((tab) => tab.id === beforeTabId);
  if (fromIndex < 0 || toIndex < 0) return state;
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  return moveDiaryNoteTab(state, tabId, insertAt);
}

/** Sposta il tab in ultima posizione. */
export function moveDiaryNoteTabToEnd(state: DiaryNotesState, tabId: string): DiaryNotesState {
  return moveDiaryNoteTab(state, tabId, state.tabs.length - 1);
}
