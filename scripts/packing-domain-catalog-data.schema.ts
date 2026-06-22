import type { SystemCategoryName } from '../src/domain/packing/packingCategories';
import { CATEGORY_ORDER } from '../src/domain/packing/packingCategories';
import type { PackingTemplateKey } from '../src/domain/packing/packingDomainCatalogTypes';
import { TEMPLATE_KEYS } from '../src/domain/packing/packingDomainCatalogTypes';

export type AiCatalogSeedEntry = readonly [name: string, tags: readonly string[]];

export interface PackingDomainCatalogJson {
  standard: Record<SystemCategoryName, readonly string[]>;
  templates: Record<PackingTemplateKey, Record<SystemCategoryName, readonly string[]>>;
  ai: Record<SystemCategoryName, readonly AiCatalogSeedEntry[]>;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isAiEntry(value: unknown): value is AiCatalogSeedEntry {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    Array.isArray(value[1]) &&
    value[1].every((tag) => typeof tag === 'string')
  );
}

function isCategoryItemMap(value: unknown): value is Record<SystemCategoryName, readonly string[]> {
  if (typeof value !== 'object' || value === null) return false;
  return CATEGORY_ORDER.every((category) => isStringArray(Reflect.get(value, category)));
}

function isTemplateCatalog(value: unknown): value is PackingDomainCatalogJson['templates'] {
  if (typeof value !== 'object' || value === null) return false;
  return TEMPLATE_KEYS.every((templateKey) => {
    const templateValue = Reflect.get(value, templateKey);
    return isCategoryItemMap(templateValue);
  });
}

function isAiCatalog(value: unknown): value is PackingDomainCatalogJson['ai'] {
  if (typeof value !== 'object' || value === null) return false;
  return CATEGORY_ORDER.every((category) => {
    const entries = Reflect.get(value, category);
    return Array.isArray(entries) && entries.every(isAiEntry);
  });
}

export function parsePackingDomainCatalogJson(value: unknown): PackingDomainCatalogJson {
  if (typeof value !== 'object' || value === null) {
    throw new Error('packing-domain-catalog-data.json: root non è un oggetto');
  }
  const standard = Reflect.get(value, 'standard');
  const templates = Reflect.get(value, 'templates');
  const ai = Reflect.get(value, 'ai');

  if (!isCategoryItemMap(standard)) {
    throw new Error('packing-domain-catalog-data.json: sezione standard non valida');
  }
  if (!isTemplateCatalog(templates)) {
    throw new Error('packing-domain-catalog-data.json: sezione templates non valida');
  }
  if (!isAiCatalog(ai)) {
    throw new Error('packing-domain-catalog-data.json: sezione ai non valida');
  }

  return { standard, templates, ai };
}
