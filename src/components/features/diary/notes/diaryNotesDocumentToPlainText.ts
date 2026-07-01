import type { DiaryNotesDocument, DiaryNotesNode } from '@/types/models/DiaryNotes';

function extractNodeText(node: DiaryNotesNode): string {
  if (node.text) return node.text;
  if (!node.content?.length) return '';
  return node.content.map(extractNodeText).join('');
}

function walkNodes(nodes: DiaryNotesNode[], lines: string[]): void {
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
      walkNodes(node.content ?? [], lines);
      continue;
    }

    if (node.content?.length) {
      walkNodes(node.content, lines);
    }
  }
}

/** Converte il documento NOTE in testo piano per export (txt/docx). */
export function diaryNotesDocumentToPlainText(
  document: DiaryNotesDocument | null | undefined,
): string {
  if (!document?.content?.length) return '';
  const lines: string[] = [];
  walkNodes(document.content, lines);
  return lines.join('\n').trim();
}
