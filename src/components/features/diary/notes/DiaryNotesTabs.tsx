import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { DiaryNoteTab } from '@/types/models/DiaryNotes';

interface DiaryNotesTabsProps {
  tabs: DiaryNoteTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, title: string) => void;
}

export const DiaryNotesTabs: React.FC<DiaryNotesTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTabsLengthRef = useRef(tabs.length);

  const startEditing = useCallback((tab: DiaryNoteTab) => {
    setEditingTabId(tab.id);
    setDraftTitle(tab.title);
  }, []);

  const commitRename = useCallback(() => {
    if (!editingTabId) return;
    const trimmed = draftTitle.trim();
    if (trimmed) {
      onRenameTab(editingTabId, trimmed);
    }
    setEditingTabId(null);
    setDraftTitle('');
  }, [draftTitle, editingTabId, onRenameTab]);

  const cancelEditing = useCallback(() => {
    setEditingTabId(null);
    setDraftTitle('');
  }, []);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // Porta in vista il tab attivo (es. dopo "+" con lista scrollabile).
  useEffect(() => {
    const tabAdded = tabs.length > prevTabsLengthRef.current;
    prevTabsLengthRef.current = tabs.length;

    const tabEl = tabRefs.current.get(activeTabId);
    if (!tabEl) return;

    tabEl.scrollIntoView({
      behavior: tabAdded ? 'smooth' : 'auto',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeTabId, tabs.length]);

  return (
    <div
      className="flex items-center gap-1 shrink-0 overflow-x-auto scroll-smooth pt-1.5 pb-1 [-webkit-overflow-scrolling:touch] scrollbar-hide"
      role="tablist"
      aria-label="Note del diario"
    >
      <button
        type="button"
        onClick={onAddTab}
        className="diary-notes-tab-add inline-flex items-center justify-center shrink-0 rounded border border-stone-300/90 bg-white/80 text-stone-500 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50/80 transition-colors"
        title="Nuova nota"
        aria-label="Crea nuova nota"
      >
        <Plus className="diary-notes-tab-add-icon" aria-hidden />
      </button>

      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isEditing = editingTabId === tab.id;

        if (isEditing) {
          return (
            <input
              key={tab.id}
              ref={inputRef}
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              className="diary-notes-tab-input shrink-0 rounded border border-amber-400 bg-white px-2 py-1 text-stone-800 outline-none ring-1 ring-amber-200"
              aria-label="Rinomina nota"
              maxLength={48}
            />
          );
        }

        return (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            className="relative shrink-0 group/tab"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                startEditing(tab);
              }}
              className={`
                diary-notes-tab inline-flex items-center gap-1 rounded border transition-colors max-w-[10rem] sm:max-w-[12rem]
                ${isActive
                  ? 'border-amber-400/90 bg-amber-50 text-amber-900 font-semibold'
                  : 'border-stone-300/70 bg-white/70 text-stone-600 hover:bg-stone-50 hover:text-stone-800'}
              `}
              title={`${tab.title} — doppio clic per rinominare`}
            >
              <span className="truncate">{tab.title}</span>
            </button>

            {isActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(tab);
                }}
                className="diary-notes-tab-rename absolute top-0 -right-1 z-10 hidden sm:group-hover/tab:inline-flex items-center justify-center rounded-full bg-stone-700 text-white shadow-sm hover:bg-amber-700 transition-colors"
                title="Rinomina nota"
                aria-label={`Rinomina ${tab.title}`}
              >
                <Pencil className="w-2.5 h-2.5" aria-hidden />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

DiaryNotesTabs.displayName = 'DiaryNotesTabs';
