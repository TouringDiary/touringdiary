import React, { useEffect, useRef } from 'react';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { useVirtualWindow } from '@/hooks/useVirtualWindow';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import type { SuitcaseItem, RuntimeAffiliateProduct } from '@/types/suitcase';
import type { UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import { normalizeItemName } from '@/utils/tagDerivation';
import { SuitcaseItemRow } from './SuitcaseItemRow';
import {
  SUITCASE_ITEMS_VIRTUALIZE_AT,
  SUITCASE_ITEM_ROW_HEIGHT_PX,
  CATEGORY_INLINE_EDITOR_VIRTUAL_RESERVE_PX,
  SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_VH,
  SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_PX,
  SUITCASE_CATEGORY_GRID_COLS_COMPACT,
  SUITCASE_CATEGORY_GRID_COLS_WIDE,
  SUITCASE_CATEGORY_GRID_CLASSNAME,
} from './suitcaseLayoutConstants';

export type CategoryItemsGridProps = {
  category: { id: string; name: string };
  items: SuitcaseItem[];
  readOnly: boolean;
  selection: {
    highlightItemId: string | null;
    selectedItemName: string | null;
    onSelectItem: (name: string | null) => void;
  };
  itemActions: {
    overrides: Record<string, RuntimeAffiliateProduct>;
    moveTargets: DisplayCategory[];
    onUpdateItem: (itemId: string, updates: UpdateSuitcaseItemDto) => void;
    onDeleteItem: (itemId: string) => void;
    onLinkBuildSearch: (query: string) => string;
  };
  drag: {
    dropTarget: { categoryId: string; index: number } | null;
    onSwapItemsInCategory?: (
      categoryId: string,
      draggedName: string,
      targetName: string,
      visibleNamesInOrder: string[],
    ) => void;
    handleItemDragStart: (categoryId: string, itemId: string) => (e: React.DragEvent) => void;
    handleItemDragOver: (categoryId: string, index: number) => (e: React.DragEvent) => void;
    handleItemDragLeave: (categoryId: string, index: number) => (e: React.DragEvent) => void;
    handleItemDrop: (categoryId: string, categoryName: string, index: number) => (e: React.DragEvent) => void;
    resetItemDragState: () => void;
  };
  /**
   * Contratto children: solo lo slot inline «aggiungi elemento» della categoria attiva.
   * Non usare per altri contenuti (rompe stima altezza virtuale e layout griglia).
   */
  children?: React.ReactNode;
};

/** Griglia item categoria — virtual window sopra soglia (path consumer STEP 4). */
export const CategoryItemsGrid: React.FC<CategoryItemsGridProps> = ({
  category,
  items,
  readOnly,
  selection,
  itemActions,
  drag,
  children,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const isMobileCompact = useMobileCompact();
  // SoT colonne: suitcaseLayoutConstants (COMPACT/WIDE + SUITCASE_CATEGORY_GRID_CLASSNAME).
  const cols = isMobileCompact
    ? SUITCASE_CATEGORY_GRID_COLS_COMPACT
    : SUITCASE_CATEGORY_GRID_COLS_WIDE;

  const shouldVirtualize = items.length >= SUITCASE_ITEMS_VIRTUALIZE_AT;
  const rowCount = Math.max(1, Math.ceil(items.length / cols));
  const { startIndex, endIndex, paddingTop, paddingBottom, totalListHeight } = useVirtualWindow({
    containerRef: listRef,
    totalItems: shouldVirtualize ? rowCount : 0,
    itemHeight: SUITCASE_ITEM_ROW_HEIGHT_PX,
    overscan: 3,
  });

  useEffect(() => {
    if (!shouldVirtualize) return;
    listRef.current?.scrollTo({ top: 0 });
  }, [shouldVirtualize, category.id, items.length]);

  const visibleStart = shouldVirtualize ? startIndex * cols : 0;
  const visibleEnd = shouldVirtualize ? Math.min(items.length, endIndex * cols) : items.length;
  const visibleItems = items.slice(visibleStart, visibleEnd);

  const renderItem = (item: SuitcaseItem, itemIndex: number) => {
    const canSwipeDelete = !readOnly && !item.is_ai_suggestion;
    return (
      <SwipeToDelete
        key={item.id}
        className="rounded-xl"
        revealClassName="inset-y-[10%] rounded-xl"
        disabled={!canSwipeDelete}
        onDelete={() => itemActions.onDeleteItem(item.id)}
      >
        <SuitcaseItemRow
          item={item}
          readOnly={readOnly}
          onUpdate={itemActions.onUpdateItem}
          onDelete={itemActions.onDeleteItem}
          highlightId={selection.highlightItemId}
          override={itemActions.overrides[normalizeItemName(item.name)]}
          onLinkBuildSearch={itemActions.onLinkBuildSearch}
          isSelected={selection.selectedItemName === item.name}
          onSelect={() =>
            selection.onSelectItem(
              item.name === selection.selectedItemName ? null : item.name,
            )
          }
          moveTargets={itemActions.moveTargets}
          onMoveToCategory={(targetName) =>
            itemActions.onUpdateItem(item.id, { category: targetName })
          }
          reorderEnabled={!readOnly && !!drag.onSwapItemsInCategory}
          isDragTarget={
            drag.dropTarget?.categoryId === category.id &&
            drag.dropTarget.index === itemIndex
          }
          onDragStart={drag.handleItemDragStart(category.id, item.id)}
          onDragOver={drag.handleItemDragOver(category.id, itemIndex)}
          onDragLeave={drag.handleItemDragLeave(category.id, itemIndex)}
          onDrop={drag.handleItemDrop(category.id, category.name, itemIndex)}
          onDragEnd={drag.resetItemDragState}
        />
      </SwipeToDelete>
    );
  };

  if (!shouldVirtualize) {
    return (
      <div className={SUITCASE_CATEGORY_GRID_CLASSNAME}>
        {items.map((item, itemIndex) => renderItem(item, itemIndex))}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="overflow-y-auto custom-scrollbar pr-0.5"
      style={{
        maxHeight: `min(${SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_VH}vh, ${SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_PX}px)`,
      }}
    >
      <div style={{ height: totalListHeight + (children ? CATEGORY_INLINE_EDITOR_VIRTUAL_RESERVE_PX : 0) }}>
        <div style={{ paddingTop, paddingBottom }}>
          <div className={SUITCASE_CATEGORY_GRID_CLASSNAME}>
            {visibleItems.map((item, i) => renderItem(item, visibleStart + i))}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
