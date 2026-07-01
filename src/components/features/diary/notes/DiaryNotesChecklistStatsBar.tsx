import React, { useMemo } from 'react';
import type { DiaryNotesDocument } from '@/types/models/DiaryNotes';
import { computeDiaryNotesChecklistStats } from './diaryNotesChecklistStats';

interface DiaryNotesChecklistStatsBarProps {
  document: DiaryNotesDocument | null | undefined;
}

export const DiaryNotesChecklistStatsBar: React.FC<DiaryNotesChecklistStatsBarProps> = React.memo(({
  document,
}) => {
  const stats = useMemo(() => computeDiaryNotesChecklistStats(document), [document]);

  if (stats.total === 0) return null;

  const progressLabel = `${stats.completed} di ${stats.total} attività completate`;

  return (
    <div
      className="mb-3 rounded-sm border border-stone-200/80 bg-stone-50/90 px-3 py-2 text-xs text-stone-600"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          <span className="font-semibold text-stone-700">{stats.total}</span> attività
        </span>
        <span aria-hidden className="text-stone-300">
          ·
        </span>
        <span>
          <span className="font-semibold text-emerald-700">{stats.completed}</span> completate
        </span>
        <span aria-hidden className="text-stone-300">
          ·
        </span>
        <span>
          <span className="font-semibold text-amber-700">{stats.remaining}</span> rimanenti
        </span>
        <span aria-hidden className="text-stone-300">
          ·
        </span>
        <span>
          <span className="font-semibold text-stone-700">{stats.percentage}%</span> completato
        </span>
      </div>

      <div
        className="mt-2 h-1 w-full rounded-full bg-stone-200/90 overflow-hidden"
        role="progressbar"
        aria-valuenow={stats.completed}
        aria-valuemin={0}
        aria-valuemax={stats.total}
        aria-label={progressLabel}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            stats.allCompleted ? 'bg-emerald-500' : 'bg-amber-500/85'
          }`}
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      {stats.allCompleted && (
        <p className="mt-1.5 text-emerald-700 font-medium animate-in fade-in duration-200">
          Tutte le attività completate.
        </p>
      )}
    </div>
  );
});

DiaryNotesChecklistStatsBar.displayName = 'DiaryNotesChecklistStatsBar';
