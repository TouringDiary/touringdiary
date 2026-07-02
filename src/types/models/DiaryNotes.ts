/**
 * Formato serializzato persistente delle NOTE del Diario.
 *
 * Definisce la struttura JSON salvata su disco / Supabase
 * (documenti Tiptap / ProseMirror compatibili con `editor.getJSON()`).
 *
 * `Itinerary.diaryNotes` contiene una collezione di tab (`DiaryNotesState`),
 * ciascuno con un documento indipendente. Il formato legacy (singolo documento)
 * viene migrato automaticamente da `normalizeDiaryNotesState`.
 */

export const DIARY_NOTES_STATE_VERSION = 2 as const;

export interface DiaryNotesMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DiaryNotesNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DiaryNotesNode[];
  text?: string;
  marks?: DiaryNotesMark[];
}

/** Root document serializzato (Tiptap `editor.getJSON()`). */
export interface DiaryNotesDocument {
  type: 'doc';
  content: DiaryNotesNode[];
}

/** Singola nota tabbata all'interno del diario. */
export interface DiaryNoteTab {
  id: string;
  title: string;
  document: DiaryNotesDocument;
}

/** Stato persistente dell'area NOTE — collezione di tab con tab attivo. */
export interface DiaryNotesState {
  version: typeof DIARY_NOTES_STATE_VERSION;
  activeTabId: string;
  tabs: DiaryNoteTab[];
}

/** Documento NOTE vuoto — unica modalità ufficiale per lo stato iniziale di un tab. */
export const EMPTY_DIARY_NOTES_DOCUMENT: DiaryNotesDocument = {
  type: 'doc',
  content: [],
};

export function isDiaryNotesDocument(value: unknown): value is DiaryNotesDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as DiaryNotesDocument).type === 'doc' &&
    Array.isArray((value as DiaryNotesDocument).content)
  );
}

export function isDiaryNotesState(value: unknown): value is DiaryNotesState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as DiaryNotesState;
  return (
    state.version === DIARY_NOTES_STATE_VERSION &&
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

/** Normalizza qualsiasi input in un documento valido (per lettura e inizializzazione editor). */
export function normalizeDiaryNotes(value: unknown): DiaryNotesDocument {
  if (isDiaryNotesDocument(value)) return value;
  return { type: EMPTY_DIARY_NOTES_DOCUMENT.type, content: [] };
}
