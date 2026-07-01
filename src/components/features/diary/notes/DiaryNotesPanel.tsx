import React from 'react';
import { StickyNote } from 'lucide-react';
import type { DiaryNotesDocument } from '@/types/models/DiaryNotes';
import { DiaryNotesEditor } from './DiaryNotesEditor';
import { DiaryNotesChecklistStatsBar } from './DiaryNotesChecklistStatsBar';

export interface DiaryNotesPanelProps {
  document: DiaryNotesDocument | null | undefined;
  onDocumentChange: (document: DiaryNotesDocument) => void;
  isActive?: boolean;
}

/**
 * Shell dell'area NOTE del Diario — header + editor Rich Text.
 */
export const DiaryNotesPanel: React.FC<DiaryNotesPanelProps> = React.memo(({
  document,
  onDocumentChange,
  isActive = true,
}) => {
  return (
    <div className="w-full flex flex-col min-h-full px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8 select-text">
      <header className="flex items-center gap-2 mb-3 md:mb-4 shrink-0">
        <StickyNote className="w-4 h-4 text-amber-600" aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
          Note di viaggio
        </h2>
      </header>

      <div
        className="flex-1 min-h-[12rem] rounded-sm border border-stone-300/80 bg-white/90 shadow-inner transition-shadow duration-200 p-3 sm:p-4 md:p-5 lg:p-6"
        role="region"
        aria-label="Area note del diario"
      >
        <DiaryNotesChecklistStatsBar document={document} />
        <DiaryNotesEditor
          document={document}
          onDocumentChange={onDocumentChange}
          isActive={isActive}
        />
      </div>
    </div>
  );
});

DiaryNotesPanel.displayName = 'DiaryNotesPanel';
