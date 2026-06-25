import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase, SuitcaseItem, SuitcaseUiState } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import type { DisplayCategory } from './categorySetup';

export type ItemDisplayOrderMap = NonNullable<SuitcaseUiState['item_display_order']>;

export function getItemDisplayOrder(suitcase: Suitcase): ItemDisplayOrderMap {
  return suitcase.ui_state?.item_display_order ?? {};
}

export function cloneItemDisplayOrder(order: ItemDisplayOrderMap): ItemDisplayOrderMap {
  const next: ItemDisplayOrderMap = {};
  for (const [categoryId, names] of Object.entries(order)) {
    next[categoryId] = [...names];
  }
  return next;
}

function stableLegacyCompare(a: SuitcaseItem, b: SuitcaseItem): number {
  const aCreated = a.created_at ? Date.parse(a.created_at) : 0;
  const bCreated = b.created_at ? Date.parse(b.created_at) : 0;
  if (aCreated !== bCreated) return aCreated - bCreated;
  const nameCmp = a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });
  if (nameCmp !== 0) return nameCmp;
  return a.id.localeCompare(b.id);
}

/**
 * Ordina gli item di una categoria secondo item_display_order.
 * Item non presenti nell'ordine salvato → append in coda con tie-break stabile.
 */
export function sortItemsByDisplayOrder(
  items: SuitcaseItem[],
  categoryId: string,
  orderMap: ItemDisplayOrderMap
): SuitcaseItem[] {
  const savedOrder = orderMap[categoryId];
  if (!savedOrder || savedOrder.length === 0) {
    return [...items].sort(stableLegacyCompare);
  }

  const indexMap = new Map(savedOrder.map((name, index) => [name, index]));
  const inOrder: SuitcaseItem[] = [];
  const tail: SuitcaseItem[] = [];

  for (const item of items) {
    const key = normalizeItemName(item.name);
    if (indexMap.has(key)) {
      inOrder.push(item);
    } else {
      tail.push(item);
    }
  }

  inOrder.sort((a, b) => {
    const ia = indexMap.get(normalizeItemName(a.name)) ?? 0;
    const ib = indexMap.get(normalizeItemName(b.name)) ?? 0;
    return ia - ib;
  });

  tail.sort(stableLegacyCompare);
  return [...inOrder, ...tail];
}

/**
 * Rimuove riferimenti obsoleti e allinea l'ordine agli item correnti.
 */
export function pruneItemDisplayOrder(
  order: ItemDisplayOrderMap,
  items: SuitcaseItem[],
  categories: DisplayCategory[]
): ItemDisplayOrderMap {
  const categoryIdByName = new Map(
    categories.map((cat) => [normalizeCategoryName(cat.name), cat.id])
  );

  const validNamesByCategoryId = new Map<string, Set<string>>();
  for (const item of items) {
    const categoryName = normalizeCategoryName(item.category);
    const categoryId = categoryIdByName.get(categoryName);
    if (!categoryId) continue;
    const key = normalizeItemName(item.name);
    if (!validNamesByCategoryId.has(categoryId)) {
      validNamesByCategoryId.set(categoryId, new Set());
    }
    validNamesByCategoryId.get(categoryId)!.add(key);
  }

  const pruned: ItemDisplayOrderMap = {};
  const categoryIds = new Set([
    ...Object.keys(order),
    ...validNamesByCategoryId.keys(),
  ]);

  for (const categoryId of categoryIds) {
    const validNames = validNamesByCategoryId.get(categoryId);
    if (!validNames || validNames.size === 0) continue;

    const existing = order[categoryId] ?? [];
    const seen = new Set<string>();
    const merged: string[] = [];

    for (const name of existing) {
      if (!validNames.has(name) || seen.has(name)) continue;
      seen.add(name);
      merged.push(name);
    }

    for (const name of validNames) {
      if (seen.has(name)) continue;
      merged.push(name);
    }

    if (merged.length > 0) {
      pruned[categoryId] = merged;
    }
  }

  return pruned;
}

export function appendItemToDisplayOrder(
  order: ItemDisplayOrderMap,
  categoryId: string,
  itemName: string
): ItemDisplayOrderMap {
  const key = normalizeItemName(itemName);
  const next = cloneItemDisplayOrder(order);
  const list = [...(next[categoryId] ?? [])].filter((name) => name !== key);
  list.push(key);
  next[categoryId] = list;
  return next;
}

export function removeItemFromDisplayOrder(
  order: ItemDisplayOrderMap,
  categoryId: string,
  itemName: string
): ItemDisplayOrderMap {
  const key = normalizeItemName(itemName);
  const next = cloneItemDisplayOrder(order);
  const list = next[categoryId];
  if (!list) return next;
  const filtered = list.filter((name) => name !== key);
  if (filtered.length === 0) {
    delete next[categoryId];
  } else {
    next[categoryId] = filtered;
  }
  return next;
}

export function removeCategoryFromDisplayOrder(
  order: ItemDisplayOrderMap,
  categoryId: string
): ItemDisplayOrderMap {
  const next = cloneItemDisplayOrder(order);
  delete next[categoryId];
  return next;
}

export function moveItemBetweenCategoriesInOrder(
  order: ItemDisplayOrderMap,
  sourceCategoryId: string,
  destCategoryId: string,
  itemName: string
): ItemDisplayOrderMap {
  const key = normalizeItemName(itemName);
  let next = removeItemFromDisplayOrder(order, sourceCategoryId, itemName);
  next = appendItemToDisplayOrder(next, destCategoryId, key);
  return next;
}

function buildCategoryNameList(
  order: ItemDisplayOrderMap,
  categoryId: string,
  visibleNamesInOrder: string[]
): string[] {
  const visibleKeys = visibleNamesInOrder.map((name) => normalizeItemName(name));
  const visibleSet = new Set(visibleKeys);
  const saved = order[categoryId] ?? [];
  const merged = [...saved];

  for (const key of visibleKeys) {
    if (!merged.includes(key)) {
      merged.push(key);
    }
  }

  const list = merged.filter((key) => visibleSet.has(key));
  for (const key of visibleKeys) {
    if (!list.includes(key)) {
      list.push(key);
    }
  }

  return list;
}

/**
 * Scambia due item nella categoria (semantica DnD: drop su un'altra riga).
 */
export function swapItemsInCategoryOrder(
  order: ItemDisplayOrderMap,
  categoryId: string,
  draggedName: string,
  targetName: string,
  visibleNamesInOrder: string[]
): ItemDisplayOrderMap {
  const draggedKey = normalizeItemName(draggedName);
  const targetKey = normalizeItemName(targetName);
  if (draggedKey === targetKey) return order;

  const next = cloneItemDisplayOrder(order);
  const list = buildCategoryNameList(order, categoryId, visibleNamesInOrder);
  const fromIdx = list.indexOf(draggedKey);
  const toIdx = list.indexOf(targetKey);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return order;

  [list[fromIdx], list[toIdx]] = [list[toIdx], list[fromIdx]];
  next[categoryId] = list;
  return next;
}

export function isSameItemDisplayOrder(
  left: ItemDisplayOrderMap,
  right: ItemDisplayOrderMap
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  if (leftKeys.some((key, index) => key !== rightKeys[index])) return false;

  for (const key of leftKeys) {
    const leftList = left[key] ?? [];
    const rightList = right[key] ?? [];
    if (leftList.length !== rightList.length) return false;
    if (leftList.some((name, index) => name !== rightList[index])) return false;
  }

  return true;
}

export function buildGroupedItemsByCategory(
  suitcase: Suitcase,
  categories: DisplayCategory[]
): Record<string, SuitcaseItem[]> {
  const items = suitcase.suitcase_items ?? [];
  const prunedOrder = pruneItemDisplayOrder(
    getItemDisplayOrder(suitcase),
    items,
    categories
  );

  const acc: Record<string, SuitcaseItem[]> = {};
  for (const cat of categories) {
    const filtered = items.filter(
      (item) =>
        normalizeCategoryName(item.category) === cat.name || item.category === cat.name
    );
    acc[cat.name] = sortItemsByDisplayOrder(filtered, cat.id, prunedOrder);
  }
  return acc;
}
