import React from 'react';
import { Plus, FolderX, Check, Package, ChevronUp, ChevronDown, Eye, CheckSquare } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import type { SuitcaseItem } from '@/types/suitcase';
import {
  ItemCategoryIcon,
  SUITCASE_CATEGORY_SECTION_SHELL_CLASS,
  SUITCASE_CATEGORY_SECTION_HEADER_CLASS,
} from './SuitcaseUtils';
import { CategoryItemsGrid, type CategoryItemsGridProps } from './CategoryItemsGrid';
import { CATEGORY_INLINE_EDITOR_HEIGHT_PX } from './suitcaseLayoutConstants';

export type CategoryProgress = {
  checked: number;
  total: number;
  percentage: number;
  isComplete: boolean;
};

export type CategorySectionProps = {
  category: DisplayCategory;
  items: SuitcaseItem[];
  categoryProgress: CategoryProgress;
  readOnly: boolean;
  highlighted: boolean;
  visibleCategoryIds: string[];
  sectionRef: (el: HTMLDivElement | null) => void;
  selection: CategoryItemsGridProps['selection'];
  itemActions: Omit<CategoryItemsGridProps['itemActions'], 'moveTargets'> & {
    moveTargets: DisplayCategory[];
  };
  drag: CategoryItemsGridProps['drag'];
  activeCategoryForAdd: string | null;
  newItemName: string;
  onNewItemNameChange: (value: string) => void;
  onToggleAdd: () => void;
  onConfirmAdd: () => void;
  onMoveCategory: (direction: 'up' | 'down') => void;
  onHideCategory: () => void;
  onDeleteCategory?: () => void;
};

/** Sezione UI di una singola categoria (header + griglia item + empty / inline add). */
export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  items,
  categoryProgress,
  readOnly,
  highlighted,
  visibleCategoryIds,
  sectionRef,
  selection,
  itemActions,
  drag,
  activeCategoryForAdd,
  newItemName,
  onNewItemNameChange,
  onToggleAdd,
  onConfirmAdd,
  onMoveCategory,
  onHideCategory,
  onDeleteCategory,
}) => {
  const categoryIndex = visibleCategoryIds.indexOf(category.id);

  return (
    <div
      data-category-id={category.id}
      ref={sectionRef}
      className={`${SUITCASE_CATEGORY_SECTION_SHELL_CLASS} group/section scroll-mt-4 transition-shadow duration-300 overflow-visible ${
        highlighted ? 'ring-2 ring-indigo-500/60 shadow-indigo-500/20' : ''
      }`}
    >
      <div className={SUITCASE_CATEGORY_SECTION_HEADER_CLASS}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex flex-col gap-px shrink-0 rounded-md border border-white/10 p-px"
            role="group"
            aria-label="Ordine categoria"
          >
            <button
              onClick={() => !readOnly && onMoveCategory('up')}
              disabled={readOnly || categoryIndex <= 0}
              className="w-7 h-7 rounded bg-slate-900/50 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta categoria su'}
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => !readOnly && onMoveCategory('down')}
              disabled={readOnly || categoryIndex >= visibleCategoryIds.length - 1}
              className="w-7 h-7 rounded bg-slate-900/50 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta categoria giù'}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-white/5 shadow-lg shadow-indigo-500/5 shrink-0">
            <ItemCategoryIcon
              category={category.name}
              iconKey={category.icon_key ?? undefined}
              className="w-5.5 h-5.5"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-[13px] md:text-[15px] uppercase font-semibold text-slate-200 tracking-wide leading-none mb-1 truncate">
              {category.name}
            </h4>
            <div className="flex items-center gap-1.5">
              <CheckSquare
                className={`w-3 h-3 shrink-0 ${categoryProgress.isComplete ? 'text-emerald-500' : 'text-indigo-400'}`}
              />
              <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                {categoryProgress.checked}/{categoryProgress.total}{' '}
                <span className="opacity-40 mx-0.5">•</span> {categoryProgress.percentage}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => !readOnly && onToggleAdd()}
            disabled={readOnly}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900/50 hover:bg-white/10 text-indigo-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            title={readOnly ? 'Non disponibile in sola lettura' : 'Aggiungi oggetto'}
          >
            <Plus className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </button>
          <button
            onClick={() => !readOnly && onHideCategory()}
            disabled={readOnly}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900/50 hover:bg-amber-500/10 text-amber-400/80 hover:text-amber-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/50 disabled:hover:text-amber-400/80"
            title={readOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
          >
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={() => !readOnly && onDeleteCategory?.()}
            disabled={readOnly}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/50 disabled:hover:text-slate-400"
            title={
              readOnly ? 'Non disponibile in sola lettura' : 'Elimina definitivamente la categoria'
            }
          >
            <FolderX className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <CategoryItemsGrid
          category={{ id: category.id, name: category.name }}
          items={items}
          readOnly={readOnly}
          selection={selection}
          itemActions={itemActions}
          drag={drag}
        >
          {activeCategoryForAdd === category.name && !readOnly && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-500/30 bg-slate-900/60 animate-in fade-in slide-in-from-top-1 shadow-lg shadow-indigo-500/10"
              style={{ height: CATEGORY_INLINE_EDITOR_HEIGHT_PX }}
            >
              <input
                autoFocus
                value={newItemName}
                onChange={(e) => onNewItemNameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onConfirmAdd()}
                placeholder="Cosa vuoi aggiungere?"
                className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder:text-slate-600 font-medium"
              />
              <button
                onClick={onConfirmAdd}
                className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-all font-bold shadow-lg shadow-indigo-500/20"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </CategoryItemsGrid>

        {categoryProgress.total === 0 && !activeCategoryForAdd && (
          <div className="py-4 text-center">
            <p className="text-[11px] text-slate-700 italic flex items-center justify-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Nessun oggetto in {category.name.toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
