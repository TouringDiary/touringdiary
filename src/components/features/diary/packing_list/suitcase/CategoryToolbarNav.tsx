import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import type { CategoryStatusFilter } from './SuitcaseUtils';
import { ItemCategoryIcon, SUITCASE_TOOLBAR_ICON_BTN_CLASS, SUITCASE_TOOLBAR_ICON_SIZE_CLASS } from './SuitcaseUtils';
import { CategoryStatusFilterDropdown } from './CategoryStatusFilter';

interface CategoryToolbarNavProps {
  categories: DisplayCategory[];
  readOnly?: boolean;
  onNavigate: (categoryId: string) => void;
  onReorder: (categoryId: string, targetIndex: number) => void;
  incompleteCountsByCategoryId?: Record<string, number>;
  categoryStatusFilter?: CategoryStatusFilter;
  onCategoryStatusFilterChange?: (filter: CategoryStatusFilter) => void;
  onAddCategory?: () => void;
}

const SUPPRESS_CLICK_MS = 150;
const SCROLL_PAGE_RATIO = 0.7;

const SCROLL_TRACK_CLASS =
  'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto overflow-y-visible pt-2 pb-0.5 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const NAV_ARROW_BTN_CLASS = `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} p-2 bg-slate-950/95 border-white/15 text-slate-500 shadow-inner hover:text-indigo-300 hover:bg-slate-800 hover:border-white/30`;

const NAV_CATEGORY_BTN_CLASS = `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} p-2 bg-slate-800/50 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/15`;

const CATEGORY_BADGE_CLASS =
  'absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold border-2 border-slate-950 shadow-md shadow-red-950/50 pointer-events-none leading-none tabular-nums';

export const CategoryToolbarNav: React.FC<CategoryToolbarNavProps> = ({
  categories,
  readOnly = false,
  onNavigate,
  onReorder,
  incompleteCountsByCategoryId = {},
  categoryStatusFilter = 'all',
  onCategoryStatusFilterChange,
  onAddCategory,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragMovedRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);

  const resetDragState = useCallback(() => {
    dragIdRef.current = null;
    dragMovedRef.current = false;
    setDraggingId(null);
    setDropTargetIndex(null);
  }, []);

  const suppressClickAfterDrag = useCallback(() => {
    suppressClickUntilRef.current = performance.now() + SUPPRESS_CLICK_MS;
  }, []);

  const scrollCategories = useCallback((direction: 'left' | 'right') => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const amount = track.clientWidth * SCROLL_PAGE_RATIO;
    track.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  const handleDragStart = useCallback(
    (categoryId: string) => (e: React.DragEvent) => {
      if (readOnly) {
        e.preventDefault();
        return;
      }
      dragMovedRef.current = false;
      dragIdRef.current = categoryId;
      setDraggingId(categoryId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', categoryId);
    },
    [readOnly]
  );

  const handleDragEnd = useCallback(() => {
    if (dragMovedRef.current) {
      suppressClickAfterDrag();
    }
    resetDragState();
  }, [resetDragState, suppressClickAfterDrag]);

  const handleNavigateClick = useCallback(
    (categoryId: string) => {
      if (performance.now() < suppressClickUntilRef.current) return;
      if (dragMovedRef.current) return;
      onNavigate(categoryId);
    },
    [onNavigate]
  );

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      if (readOnly || !dragIdRef.current) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragMovedRef.current = true;
      setDropTargetIndex(index);
    },
    [readOnly]
  );

  const handleDragLeave = useCallback((index: number) => (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDropTargetIndex((current) => (current === index ? null : current));
  }, []);

  const handleDrop = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = dragIdRef.current;
      if (!readOnly && draggedId) {
        dragMovedRef.current = true;
        onReorder(draggedId, index);
        suppressClickAfterDrag();
      }
      resetDragState();
    },
    [onReorder, readOnly, resetDragState, suppressClickAfterDrag]
  );

  const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDropTargetIndex(null);
  }, []);

  const focusButtonAt = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, categories.length - 1));
    buttonRefs.current[clamped]?.focus();
  }, [categories.length]);

  const handleKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          focusButtonAt(index + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          focusButtonAt(index - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusButtonAt(0);
          break;
        case 'End':
          e.preventDefault();
          focusButtonAt(categories.length - 1);
          break;
        default:
          break;
      }
    },
    [categories.length, focusButtonAt]
  );

  return (
    <div className="flex items-center gap-1 w-full min-w-0 overflow-visible py-1 px-1.5 rounded-xl bg-slate-900/40 border border-white/10 shadow-sm shadow-black/10">
      {onCategoryStatusFilterChange && (
        <CategoryStatusFilterDropdown
          value={categoryStatusFilter}
          onChange={onCategoryStatusFilterChange}
        />
      )}

      <button
        type="button"
        onClick={() => scrollCategories('left')}
        className={NAV_ARROW_BTN_CLASS}
        title="Scorri categorie a sinistra"
        aria-label="Scorri categorie a sinistra"
        disabled={categories.length === 0}
      >
        <ChevronLeft className={SUITCASE_TOOLBAR_ICON_SIZE_CLASS} aria-hidden />
      </button>

      {onAddCategory && (
        <button
          type="button"
          onClick={onAddCategory}
          disabled={readOnly}
          className={`${NAV_CATEGORY_BTN_CLASS} bg-indigo-600/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600/10 disabled:hover:text-indigo-400 shrink-0`}
          title={readOnly ? 'Non disponibile in sola lettura' : 'Crea categoria'}
          aria-label={readOnly ? 'Non disponibile in sola lettura' : 'Crea categoria'}
        >
          <Plus className={SUITCASE_TOOLBAR_ICON_SIZE_CLASS} aria-hidden />
        </button>
      )}

      <div
        ref={scrollTrackRef}
        className={SCROLL_TRACK_CLASS}
        role="toolbar"
        aria-orientation="horizontal"
        aria-label="Navigazione categorie"
        onDragLeave={handleContainerDragLeave}
      >
        {categories.map((cat, index) => {
          const isDragging = draggingId === cat.id;
          const isDropTarget = dropTargetIndex === index && draggingId !== cat.id;
          const incompleteCount = incompleteCountsByCategoryId[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              draggable={!readOnly}
              onClick={() => handleNavigateClick(cat.id)}
              onDragStart={handleDragStart(cat.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(index)}
              onDragLeave={handleDragLeave(index)}
              onDrop={handleDrop(index)}
              onKeyDown={handleKeyDown(index)}
              className={`${NAV_CATEGORY_BTN_CLASS} relative overflow-visible shrink-0 ${
                isDragging ? 'opacity-40 scale-95' : ''
              } ${isDropTarget ? 'ring-2 ring-indigo-500/60 border-indigo-500/40' : ''} ${
                !readOnly ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              title={
                incompleteCount > 0
                  ? `${cat.name} (${incompleteCount} da completare)`
                  : cat.name
              }
              aria-label={
                incompleteCount > 0
                  ? `${cat.name}, ${incompleteCount} oggetti da completare`
                  : cat.name
              }
            >
              <ItemCategoryIcon
                category={cat.name}
                iconKey={cat.icon_key}
                className={SUITCASE_TOOLBAR_ICON_SIZE_CLASS}
              />
              {incompleteCount > 0 && (
                <span className={CATEGORY_BADGE_CLASS} aria-hidden>
                  {incompleteCount > 99 ? '99+' : incompleteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollCategories('right')}
        className={NAV_ARROW_BTN_CLASS}
        title="Scorri categorie a destra"
        aria-label="Scorri categorie a destra"
        disabled={categories.length === 0}
      >
        <ChevronRight className={SUITCASE_TOOLBAR_ICON_SIZE_CLASS} aria-hidden />
      </button>
    </div>
  );
};
