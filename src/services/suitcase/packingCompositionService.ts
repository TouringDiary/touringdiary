import { getCategoryId, normalizeCategoryName } from '@/domain/packing/packingCategories';
import {
  getDefaultCategorySetupForTdTemplate,
  resolveCategorySetup,
} from '@/domain/packing/categorySetup';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { CategorySetupMap } from '@/types/packingCatalog';
import { PackingStandardItem, PackingTemplateItem } from '@/types/packingCatalog';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import { normalizeItemName } from '@/utils/tagDerivation';
import {
  fetchActiveStandardItemsAsync,
  fetchTemplateSpecificItemsAsync,
  fetchTemplateSpecificItemsForTemplatesAsync,
} from './packingCatalogService';

export interface ComposeTemplateItemsOptions {
  categorySetup?: CategorySetupMap;
  suitcaseId?: string;
  standardRows?: PackingStandardItem[];
  specificRows?: PackingTemplateItem[];
}

/**
 * View-model runtime: gli id `composed-*` non devono mai essere persistiti.
 * persistSuitcaseItemsFromRuntimeAsync ignora id effimeri e genera UUID lato DB.
 */
export function composeTdTemplateItems(
  template: Suitcase,
  standardRows: PackingStandardItem[],
  specificRows: PackingTemplateItem[],
  options: Pick<ComposeTemplateItemsOptions, 'categorySetup' | 'suitcaseId'> = {}
): SuitcaseItem[] {
  if (!isTdTemplate(template)) {
    throw new Error('[packingCompositionService] composeTdTemplateItems: non è un template TD.');
  }

  const setup = options.categorySetup ?? resolveCategorySetup(template);
  const suitcaseId = options.suitcaseId ?? template.id;

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

export const composeTdTemplateItemsAsync = async (
  template: Suitcase,
  options: ComposeTemplateItemsOptions = {}
): Promise<SuitcaseItem[]> => {
  const [standardRows, specificRows] = await Promise.all([
    options.standardRows ?? fetchActiveStandardItemsAsync(),
    options.specificRows ?? fetchTemplateSpecificItemsAsync(template.id),
  ]);

  return composeTdTemplateItems(template, standardRows, specificRows, options);
};

export const ensureTdTemplateCategorySetup = (template: Suitcase): Suitcase => {
  if (!isTdTemplate(template)) return template;
  if (template.ui_state?.category_setup && Object.keys(template.ui_state.category_setup).length > 0) {
    return template;
  }

  return {
    ...template,
    ui_state: {
      ...template.ui_state,
      hidden_category_ids: template.ui_state?.hidden_category_ids ?? [],
      category_setup: getDefaultCategorySetupForTdTemplate(template.title),
    },
  };
};

export const enrichTdTemplateAsync = async (template: Suitcase): Promise<Suitcase> => {
  if (!isTdTemplate(template)) return template;

  const withSetup = ensureTdTemplateCategorySetup(template);
  const items = await composeTdTemplateItemsAsync(withSetup);

  return {
    ...withSetup,
    suitcase_items: items,
  };
};

/** Prefetch condiviso: 1 query standard + 1 query specifics per tutti i template TD. */
export const enrichTdTemplatesAsync = async (templates: Suitcase[]): Promise<Suitcase[]> => {
  const tdTemplates = templates.filter(isTdTemplate);
  if (tdTemplates.length === 0) return templates;

  const [standardRows, specificsByTemplate] = await Promise.all([
    fetchActiveStandardItemsAsync(),
    fetchTemplateSpecificItemsForTemplatesAsync(tdTemplates.map((t) => t.id)),
  ]);

  return templates.map((template) => {
    if (!isTdTemplate(template)) return template;

    const withSetup = ensureTdTemplateCategorySetup(template);
    const items = composeTdTemplateItems(
      withSetup,
      standardRows,
      specificsByTemplate.get(template.id) ?? []
    );

    return {
      ...withSetup,
      suitcase_items: items,
    };
  });
};
