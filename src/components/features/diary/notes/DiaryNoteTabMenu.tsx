import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Edit2,
  MoreVertical,
  MoveHorizontal,
  Trash2,
} from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import type { DiaryNoteTab } from '@/types/models/DiaryNotes';

interface DiaryNoteTabMenuProps {
  tab: DiaryNoteTab;
  allTabs: DiaryNoteTab[];
  canDelete: boolean;
  readOnly?: boolean;
  popoverAlign?: 'left' | 'right';
  onRename: () => void;
  onDuplicate: () => void;
  onMoveBefore: (beforeTabId: string) => void;
  onMoveToEnd: () => void;
  onDelete: () => void;
}

const ITEM_CLASS =
  'w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export const DiaryNoteTabMenu: React.FC<DiaryNoteTabMenuProps> = ({
  tab,
  allTabs,
  canDelete,
  readOnly = false,
  popoverAlign = 'left',
  onRename,
  onDuplicate,
  onMoveBefore,
  onMoveToEnd,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMoveOpen(false);
  }, [tab.id]);

  if (readOnly) return null;

  const otherTabs = allTabs.filter((t) => t.id !== tab.id);
  const canMove = otherTabs.length > 0;

  const closeAll = () => {
    setMenuOpen(false);
    setMoveOpen(false);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
          setMoveOpen(false);
        }}
        className="diary-notes-tab-menu shrink-0 rounded border border-stone-300/70 bg-white/70 text-stone-500 hover:text-amber-800 hover:border-amber-300 hover:bg-amber-50/80 transition-colors"
        title={`Azioni su "${tab.title}"`}
        aria-label={`Azioni sulla nota attiva: ${tab.title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreVertical className="diary-notes-tab-menu-icon" aria-hidden />
      </button>

      <AnchoredPopover
        isOpen={menuOpen}
        onClose={closeAll}
        anchorRef={anchorRef}
        align={popoverAlign}
        className={`w-44 bg-white border border-stone-300 rounded-lg shadow-lg overflow-hidden z-popover ${
          popoverAlign === 'right' ? 'origin-top-right' : 'origin-top-left'
        }`}
      >
        {!moveOpen ? (
          <>
            <button type="button" className={ITEM_CLASS} onClick={() => { closeAll(); onRename(); }}>
              <Edit2 className="w-3.5 h-3.5 text-stone-500" aria-hidden />
              Rinomina
            </button>
            <button type="button" className={ITEM_CLASS} onClick={() => { closeAll(); onDuplicate(); }}>
              <Copy className="w-3.5 h-3.5 text-stone-500" aria-hidden />
              Duplica
            </button>
            <button
              type="button"
              className={ITEM_CLASS}
              disabled={!canMove}
              onClick={() => setMoveOpen(true)}
            >
              <MoveHorizontal className="w-3.5 h-3.5 text-stone-500" aria-hidden />
              Sposta
            </button>
            <div className="border-t border-stone-200" />
            <button
              type="button"
              className={`${ITEM_CLASS} text-red-600 hover:bg-red-50`}
              disabled={!canDelete}
              onClick={() => { closeAll(); onDelete(); }}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
              Elimina
            </button>
          </>
        ) : (
          <>
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              Sposta prima di…
            </div>
            <div className="max-h-40 overflow-y-auto custom-scrollbar">
              {otherTabs.map((other) => (
                <button
                  key={other.id}
                  type="button"
                  className={ITEM_CLASS}
                  onClick={() => {
                    closeAll();
                    onMoveBefore(other.id);
                  }}
                >
                  <span className="truncate">{other.title}</span>
                </button>
              ))}
              <button
                type="button"
                className={`${ITEM_CLASS} border-t border-stone-100`}
                onClick={() => {
                  closeAll();
                  onMoveToEnd();
                }}
              >
                Alla fine
              </button>
            </div>
            <button
              type="button"
              className={`${ITEM_CLASS} border-t border-stone-200 text-stone-500`}
              onClick={() => setMoveOpen(false)}
            >
              Indietro
            </button>
          </>
        )}
      </AnchoredPopover>
    </>
  );
};

DiaryNoteTabMenu.displayName = 'DiaryNoteTabMenu';
