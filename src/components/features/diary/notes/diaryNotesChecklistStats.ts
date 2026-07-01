import type { DiaryNotesDocument, DiaryNotesNode } from '@/types/models/DiaryNotes';

export interface DiaryNotesChecklistStats {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  allCompleted: boolean;
}

const EMPTY_STATS: DiaryNotesChecklistStats = {
  total: 0,
  completed: 0,
  remaining: 0,
  percentage: 0,
  allCompleted: false,
};

function walkNodes(
  nodes: DiaryNotesNode[] | undefined,
  acc: { total: number; completed: number },
): void {
  if (!nodes) return;

  for (const node of nodes) {
    if (node.type === 'taskItem') {
      acc.total += 1;
      if (node.attrs?.checked === true) {
        acc.completed += 1;
      }
    }
    walkNodes(node.content, acc);
  }
}

/** Calcola le statistiche checklist dal JSON persistente del documento NOTE. */
export function computeDiaryNotesChecklistStats(
  document: DiaryNotesDocument | null | undefined,
): DiaryNotesChecklistStats {
  if (!document?.content?.length) return EMPTY_STATS;

  const acc = { total: 0, completed: 0 };
  walkNodes(document.content, acc);

  if (acc.total === 0) return EMPTY_STATS;

  const remaining = acc.total - acc.completed;
  const percentage = Math.round((acc.completed / acc.total) * 100);

  return {
    total: acc.total,
    completed: acc.completed,
    remaining,
    percentage,
    allCompleted: remaining === 0,
  };
}
