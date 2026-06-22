/**
 * Validazione del catalogo dominio Macrofase C (congelato).
 */

import { CATEGORY_ORDER } from './packingCategories';
import type { SystemCategoryName } from './packingCategories';
import {
  PACKING_AI_MIN_PER_CATEGORY,
  PACKING_STANDARD_MIN_BY_CATEGORY,
  PACKING_TEMPLATE_MIN_EXCEPTIONS,
  PACKING_TEMPLATE_MIN_PER_CATEGORY,
  TEMPLATE_KEYS,
  type PackingDomainValidationReport,
  type PackingTemplateKey,
} from './packingDomainCatalogTypes';

export interface ValidatablePackingCatalog {
  standard: Record<SystemCategoryName, readonly string[]>;
  template: Record<PackingTemplateKey, Record<SystemCategoryName, readonly string[]>>;
  ai: ReadonlyArray<{ name: string; category: SystemCategoryName; tags: readonly string[] }>;
}

export function validatePackingDomainCatalogData(
  catalog: ValidatablePackingCatalog
): PackingDomainValidationReport {
  const anomalies: string[] = [];

  const standardByCategory = {} as Record<SystemCategoryName, number>;
  let standardTotal = 0;

  for (const cat of CATEGORY_ORDER) {
    const items = catalog.standard[cat];
    standardByCategory[cat] = items.length;
    standardTotal += items.length;
    const min = PACKING_STANDARD_MIN_BY_CATEGORY[cat];
    if (items.length < min) {
      anomalies.push(`Standard ${cat}: ${items.length} < minimo ${min}`);
    }
    const seen = new Set<string>();
    for (const name of items) {
      if (!name.trim()) anomalies.push(`Standard ${cat}: item vuoto`);
      const key = name.trim().toLowerCase();
      if (seen.has(key)) anomalies.push(`Standard ${cat}: duplicato "${name}"`);
      seen.add(key);
    }
  }

  const templateByTemplate = {} as Record<PackingTemplateKey, number>;
  let templateTotal = 0;

  for (const tk of TEMPLATE_KEYS) {
    let count = 0;
    const tpl = catalog.template[tk];
    for (const cat of CATEGORY_ORDER) {
      const items = tpl[cat];
      count += items.length;
      const min = PACKING_TEMPLATE_MIN_EXCEPTIONS[tk]?.[cat] ?? PACKING_TEMPLATE_MIN_PER_CATEGORY;
      if (items.length < min) {
        anomalies.push(`Template ${tk} / ${cat}: ${items.length} < minimo ${min}`);
      }
      const seen = new Set<string>();
      for (const name of items) {
        if (!name.trim()) anomalies.push(`Template ${tk} / ${cat}: item vuoto`);
        const key = name.trim().toLowerCase();
        if (seen.has(key)) {
          anomalies.push(`Template ${tk} / ${cat}: duplicato interno "${name}"`);
        }
        seen.add(key);
      }
    }
    templateByTemplate[tk] = count;
    templateTotal += count;
  }

  const aiByCategory = {} as Record<SystemCategoryName, number>;
  let aiTotal = 0;
  const globalAiNames = new Set<string>();

  for (const cat of CATEGORY_ORDER) {
    const items = catalog.ai.filter((i) => i.category === cat);
    aiByCategory[cat] = items.length;
    aiTotal += items.length;
    if (items.length < PACKING_AI_MIN_PER_CATEGORY) {
      anomalies.push(`AI ${cat}: ${items.length} < minimo ${PACKING_AI_MIN_PER_CATEGORY}`);
    }
  }

  for (const item of catalog.ai) {
    if (!item.name.trim()) anomalies.push(`AI ${item.category}: item vuoto`);
    const key = item.name.trim().toLowerCase();
    if (globalAiNames.has(key)) {
      anomalies.push(`AI globale: nome duplicato "${item.name}"`);
    }
    globalAiNames.add(key);
    if (!item.tags.length) {
      anomalies.push(`AI "${item.name}": nessun tag`);
    }
  }

  return {
    ok: anomalies.length === 0,
    standardTotal,
    templateTotal,
    aiTotal,
    standardByCategory,
    templateByTemplate,
    aiByCategory,
    anomalies,
  };
}
