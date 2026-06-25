import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import { getCategoryShortLabel } from '@/domain/packing/packingCategories';
import type { CategoryStatusFilter } from './SuitcaseUtils';
import {
  ItemCategoryIcon,
  SUITCASE_TOOLBAR_ICON_BTN_CLASS,
  SUITCASE_TOOLBAR_ICON_SIZE_CLASS,
  SUITCASE_CATEGORY_TOOLBAR_ICON_SIZE_CLASS,
} from './SuitcaseUtils';
import { CategoryStatusFilterDropdown } from './CategoryStatusFilter';
import { CountBadge } from '@/components/ui/CountBadge';

interface CategoryToolbarNavProps {
  categories: DisplayCategory[];
  readOnly?: boolean;
  activeCategoryId?: string | null;
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
  'flex items-end gap-1 min-w-0 flex-1 overflow-x-auto overflow-y-visible pt-2 pb-0.5 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const NAV_ARROW_BTN_CLASS = `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} p-2 bg-slate-950/95 border-white/15 text-slate-500 shadow-inner hover:text-indigo-300 hover:bg-slate-800 hover:border-white/30`;

const NAV_CATEGORY_BTN_CLASS = `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[2.75rem] bg-slate-800/50 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/15`;

const NAV_CATEGORY_BTN_ACTIVE_CLASS =
  'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:bg-indigo-500/20 hover:text-indigo-100 hover:border-indigo-500/40';

const ADD_CATEGORY_BTN_CLASS = `${NAV_CATEGORY_BTN_CLASS} border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/35 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:text-indigo-400/60`;

export const CategoryToolbarNav: React.FC<CategoryToolbarNavProps> = ({
  categories,
  readOnly = false,
  activeCategoryId = null,
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
    <>
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
          className={`${ADD_CATEGORY_BTN_CLASS} relative overflow-visible shrink-0`}
          title={readOnly ? 'Non disponibile in sola lettura' : 'Crea categoria'}
          aria-label={readOnly ? 'Non disponibile in sola lettura' : 'Crea categoria'}
        >
          <Plus className={SUITCASE_CATEGORY_TOOLBAR_ICON_SIZE_CLASS} aria-hidden />
          <span
            className="text-[8px] font-black uppercase tracking-wider leading-none text-indigo-400/80"
            aria-hidden
          >
            NEW
          </span>
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
          const isActive = activeCategoryId === cat.id;
          const shortLabel = getCategoryShortLabel(cat.name);

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
                isActive ? NAV_CATEGORY_BTN_ACTIVE_CLASS : ''
              } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                isDropTarget ? 'ring-2 ring-indigo-500/60 border-indigo-500/40' : ''
              } ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
              aria-current={isActive ? 'true' : undefined}
            >
              <ItemCategoryIcon
                category={cat.name}
                iconKey={cat.icon_key}
                className={SUITCASE_CATEGORY_TOOLBAR_ICON_SIZE_CLASS}
              />
              <span
                className={`text-[8px] font-black uppercase tracking-wider leading-none ${
                  isActive ? 'text-amber-400' : 'text-slate-500'
                }`}
                aria-hidden
              >
                {shortLabel}
              </span>
              {incompleteCount > 0 && (
                <CountBadge
                  count={incompleteCount}
                  max={99}
                  size="sm"
                  variant="red"
                  position="overlay-tr"
                  aria-hidden
                />
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
    </>
  );
};
