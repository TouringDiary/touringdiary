import React, { useCallback, useMemo } from 'react';
import { StickyNote } from 'lucide-react';
import type { DiaryNotesDocument, DiaryNotesState } from '@/types/models/DiaryNotes';
import {
  addDiaryNoteTab,
  getActiveTabDocument,
  normalizeDiaryNotesState,
  renameDiaryNoteTab,
  setActiveTabId,
  updateActiveTabDocument,
} from '@/domain/diary/diaryNotesState';
import { DiaryNotesEditor } from './DiaryNotesEditor';
import { DiaryNotesChecklistStatsBar } from './DiaryNotesChecklistStatsBar';
import { DiaryNotesTabs } from './DiaryNotesTabs';

export interface DiaryNotesPanelProps {
  notesState: DiaryNotesState | null | undefined;
  onNotesStateChange: (state: DiaryNotesState) => void;
  isActive?: boolean;
}

/**
 * Shell dell'area NOTE del Diario — header, tab, editor Rich Text.
 */
export const DiaryNotesPanel: React.FC<DiaryNotesPanelProps> = React.memo(({
  notesState,
  onNotesStateChange,
  isActive = true,
}) => {
  const state = useMemo(
    () => normalizeDiaryNotesState(notesState),
    [notesState],
  );

  const activeDocument = useMemo(() => getActiveTabDocument(state), [state]);

  const handleDocumentChange = useCallback(
    (document: DiaryNotesDocument) => {
      onNotesStateChange(updateActiveTabDocument(state, document));
    },
    [onNotesStateChange, state],
  );

  const handleSelectTab = useCallback(
    (tabId: string) => {
      onNotesStateChange(setActiveTabId(state, tabId));
    },
    [onNotesStateChange, state],
  );

  const handleAddTab = useCallback(() => {
    onNotesStateChange(addDiaryNoteTab(state));
  }, [onNotesStateChange, state]);

  const handleRenameTab = useCallback(
    (tabId: string, title: string) => {
      onNotesStateChange(renameDiaryNoteTab(state, tabId, title));
    },
    [onNotesStateChange, state],
  );

  return (
    <div className="w-full h-full min-w-0 flex flex-col min-h-0 px-1.5 py-1.5 sm:px-2 sm:py-2 select-text">
      <header className="flex items-center gap-1.5 mb-1 shrink-0">
        <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" aria-hidden />
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-600">
          Note di viaggio
        </h2>
      </header>

      <DiaryNotesTabs
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onSelectTab={handleSelectTab}
        onAddTab={handleAddTab}
        onRenameTab={handleRenameTab}
      />

      <div
        className="flex-1 min-h-0 flex flex-col mt-1 rounded-sm border border-stone-300/70 bg-white/95 shadow-inner"
        role="region"
        aria-label="Area note del diario"
      >
        <DiaryNotesChecklistStatsBar document={activeDocument} />
        <DiaryNotesEditor
          document={activeDocument}
          onDocumentChange={handleDocumentChange}
          isActive={isActive}
        />
      </div>
    </div>
  );
});

DiaryNotesPanel.displayName = 'DiaryNotesPanel';
