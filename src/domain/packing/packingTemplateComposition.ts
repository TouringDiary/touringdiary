/**
 * Composizione pura standard + template specifici (nessuna dipendenza Supabase).
 * Usata da packingCompositionService e dagli script QA.
 */

import { getCategoryId, normalizeCategoryName } from './packingCategories';
import type { CategorySetupMap } from './categorySetupTypes';
import type { PackingStandardItemTier } from '@/types/packingCatalog';
import type { SuitcaseItem } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

export interface ComposeCatalogStandardRow {
  category: string;
  name: string;
  tier: PackingStandardItemTier;
}

export interface ComposeCatalogTemplateRow {
  category: string;
  name: string;
}

export interface ComposeTdTemplateItemsParams {
  setup: CategorySetupMap;
  suitcaseId: string;
  standardRows: readonly ComposeCatalogStandardRow[];
  specificRows: readonly ComposeCatalogTemplateRow[];
}

/**
 * Unisce standard e specifici template rispettando category_setup e dedup per nome.
 */
export function composeTdTemplateItemsFromCatalog(
  params: ComposeTdTemplateItemsParams
): SuitcaseItem[] {
  const { setup, suitcaseId, standardRows, specificRows } = params;
  const merged: { name: string; category: string }[] = [];

  for (const row of standardRows) {
    const cat = normalizeCategoryName(row.category);
    const catId = getCategoryId(cat);
    const entry = setup[catId];
    if (entry?.enabled === false) continue;
    if (row.tier === 'additional' && entry?.seeded !== true) continue;
    if (row.tier === 'additional_ai_only') continue;
    merged.push({ name: row.name, category: cat });
  }

  for (const row of specificRows) {
    const cat = normalizeCategoryName(row.category);
    const catId = getCategoryId(cat);
    const entry = setup[catId];
    if (entry?.enabled === false) continue;
    merged.push({ name: row.name, category: cat });
  }

  const seen = new Set<string>();
  const items: SuitcaseItem[] = [];

  for (const row of merged) {
    const key = normalizeItemName(row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: `composed-${suitcaseId}-${items.length}`,
      name: row.name,
      category: row.category,
      suitcase_id: suitcaseId,
      is_checked: false,
      is_ai_suggestion: false,
      quantity: 1,
    });
  }

  return items;
}
