import type { DiaryNotesDocument, DiaryNotesNode, DiaryNotesState } from '@/types/models/DiaryNotes';
import { isDiaryNotesState, normalizeDiaryNotes } from '@/types/models/DiaryNotes';
import { normalizeDiaryNotesState } from '@/domain/diary/diaryNotesState';

function extractNodeText(node: DiaryNotesNode): string {
  if (node.text) return node.text;
  if (!node.content?.length) return '';
  return node.content.map(extractNodeText).join('');
}

function collectDocumentLines(nodes: DiaryNotesNode[]): string[] {
  const lines: string[] = [];

  for (const node of nodes) {
    if (node.type === 'taskItem') {
      const checked = node.attrs?.checked === true ? 'x' : ' ';
      const text = extractNodeText(node).trim();
      lines.push(`[${checked}] ${text}`);
      continue;
    }

    if (node.type === 'heading') {
      const text = extractNodeText(node).trim();
      if (text) lines.push(text.toUpperCase());
      continue;
    }

    if (node.type === 'paragraph') {
      const text = extractNodeText(node).trim();
      if (text) lines.push(text);
      continue;
    }

    if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
      lines.push(...collectDocumentLines(node.content ?? []));
      continue;
    }

    if (node.content?.length) {
      lines.push(...collectDocumentLines(node.content));
    }
  }

  return lines;
}

/** Una riga prodotta dall'export ha testo reale (esclude checklist vuote `[ ]`). */
function isMeaningfulExportedLine(line: string): boolean {
  const taskMatch = line.match(/^\[[ x]\] (.*)$/);
  if (taskMatch) return taskMatch[1].trim().length > 0;
  return line.trim().length > 0;
}

function documentToPlainText(document: DiaryNotesDocument | null | undefined): string {
  if (!document?.content?.length) return '';
  return collectDocumentLines(document.content).join('\n').trim();
}

function documentHasMeaningfulContent(document: DiaryNotesDocument | null | undefined): boolean {
  if (!document?.content?.length) return false;
  return collectDocumentLines(document.content).some(isMeaningfulExportedLine);
}

/** Converte un singolo documento NOTE in testo piano. */
export function diaryNotesDocumentToPlainText(
  document: DiaryNotesDocument | null | undefined,
): string {
  return documentToPlainText(normalizeDiaryNotes(document));
}

/** Converte lo stato NOTE (tutti i tab) in testo piano per export (txt/docx). */
export function diaryNotesStateToPlainText(
  state: DiaryNotesState | null | undefined,
): string {
  if (!state?.tabs.length) return '';

  const sections = state.tabs
    .map((tab) => {
      const body = documentToPlainText(tab.document);
      if (!body) return '';
      return `=== ${tab.title} ===\n${body}`;
    })
    .filter(Boolean);

  return sections.join('\n\n').trim();
}

/** Accetta stato multi-tab, documento legacy o null. */
export function diaryNotesToPlainText(
  value: DiaryNotesState | DiaryNotesDocument | null | undefined,
): string {
  if (value == null) return '';
  if (isDiaryNotesState(value)) return diaryNotesStateToPlainText(value);
  if (typeof value === 'object' && (value as DiaryNotesDocument).type === 'doc') {
    return diaryNotesDocumentToPlainText(value as DiaryNotesDocument);
  }
  return diaryNotesStateToPlainText(normalizeDiaryNotesState(value));
}

/** True se almeno un tab contiene testo reale (non spazi, non documenti vuoti). */
export function diaryNotesHasMeaningfulContent(
  value: DiaryNotesState | DiaryNotesDocument | null | undefined,
): boolean {
  if (value == null) return false;
  if (isDiaryNotesState(value)) {
    return value.tabs.some((tab) => documentHasMeaningfulContent(tab.document));
  }
  if (typeof value === 'object' && (value as DiaryNotesDocument).type === 'doc') {
    return documentHasMeaningfulContent(normalizeDiaryNotes(value));
  }
  const state = normalizeDiaryNotesState(value);
  return state.tabs.some((tab) => documentHasMeaningfulContent(tab.document));
}
