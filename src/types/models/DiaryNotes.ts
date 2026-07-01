/**
 * Formato serializzato persistente del documento NOTE del Diario.
 *
 * Questo file definisce ESCLUSIVAMENTE la struttura JSON salvata su disco / Supabase
 * (compatibile con Tiptap / ProseMirror, es. output di `editor.getJSON()`).
 *
 * Non contiene logica dell'editor, componenti React o regole di business:
 * quelle vivranno nei layer UI e nei hook nelle macrofasi successive.
 *
 * Una sola istanza per Itinerary → campo `Itinerary.diaryNotes`.
 */

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

/** Documento NOTE vuoto — unica modalità ufficiale per lo stato iniziale. */
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

/** Normalizza qualsiasi input in un documento valido (per lettura e inizializzazione editor). */
export function normalizeDiaryNotes(value: unknown): DiaryNotesDocument {
  if (isDiaryNotesDocument(value)) return value;
  return { type: EMPTY_DIARY_NOTES_DOCUMENT.type, content: [] };
}
