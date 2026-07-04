import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { DiaryNoteTab } from '@/types/models/DiaryNotes';
import { HorizontalScrollStrip } from '@/components/common/HorizontalScrollStrip';
import { DiaryNoteTabMenu } from './DiaryNoteTabMenu';

interface DiaryNotesTabsProps {
  tabs: DiaryNoteTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, title: string) => void;
  onDuplicateTab: (tabId: string) => void;
  onMoveTabBefore: (tabId: string, beforeTabId: string) => void;
  onMoveTabToEnd: (tabId: string) => void;
  onDeleteTab: (tabId: string) => void;
  readOnly?: boolean;
}

export const DiaryNotesTabs: React.FC<DiaryNotesTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDuplicateTab,
  onMoveTabBefore,
  onMoveTabToEnd,
  onDeleteTab,
  readOnly = false,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTabsLengthRef = useRef(tabs.length);

  const tabOrderKey = tabs.map((tab) => tab.id).join('|');

  const startEditing = useCallback((tab: DiaryNoteTab) => {
    if (readOnly) return;
    setEditingTabId(tab.id);
    setDraftTitle(tab.title);
  }, [readOnly]);

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
  }, [activeTabId, tabs.length, tabOrderKey]);

  const canDelete = tabs.length > 1;
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  return (
    <HorizontalScrollStrip
      className="diary-notes-tab-bar shrink-0"
      scrollClassName="diary-notes-tab-bar__scroll"
      scrollRef={scrollRef}
      ariaLabel="Note del diario"
      arrowClassName="diary-notes-tab-scroll-arrow hidden lg:inline-flex"
      leading={
        !readOnly ? (
          <button
            type="button"
            onClick={onAddTab}
            className="diary-notes-tab-add shrink-0 rounded border border-stone-300/90 bg-white/80 text-stone-500 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50/80 transition-colors"
            title="Nuova nota"
            aria-label="Crea nuova nota"
          >
            <Plus className="diary-notes-tab-add-icon" aria-hidden />
          </button>
        ) : undefined
      }
      trailing={
        !readOnly && activeTab ? (
          <DiaryNoteTabMenu
            tab={activeTab}
            allTabs={tabs}
            canDelete={canDelete}
            popoverAlign="right"
            onRename={() => startEditing(activeTab)}
            onDuplicate={() => onDuplicateTab(activeTab.id)}
            onMoveBefore={(beforeId) => onMoveTabBefore(activeTab.id, beforeId)}
            onMoveToEnd={() => onMoveTabToEnd(activeTab.id)}
            onDelete={() => onDeleteTab(activeTab.id)}
          />
        ) : undefined
      }
    >
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
              className="diary-notes-tab-input shrink-0 rounded border border-amber-400 bg-white text-stone-800 outline-none ring-1 ring-amber-200"
              aria-label="Rinomina nota"
              maxLength={48}
            />
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={(e) => {
              e.preventDefault();
              startEditing(tab);
            }}
            className={`
              diary-notes-tab shrink-0 rounded border transition-colors max-w-[10rem] sm:max-w-[12rem]
              ${isActive
                ? 'border-amber-400/90 bg-amber-50 text-amber-900 font-semibold'
                : 'border-stone-300/70 bg-white/70 text-stone-600 hover:bg-stone-50 hover:text-stone-800'}
            `}
            title={`${tab.title} — doppio clic per rinominare`}
          >
            <span className="diary-notes-tab__label truncate">{tab.title}</span>
          </button>
        );
      })}
    </HorizontalScrollStrip>
  );
};

DiaryNotesTabs.displayName = 'DiaryNotesTabs';
