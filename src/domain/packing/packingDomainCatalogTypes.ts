/**
 * Tipi condivisi per il catalogo dominio Macrofase C (congelato).
 * Allineati a packingCategories.ts — unica fonte nomi categoria.
 */

import type { SystemCategoryName } from './packingCategories';
import type { PackingStandardItemTier } from '@/types/packingCatalog';

export const PACKING_DOMAIN_VERSION = '1.0.0-freeze' as const;

export const TEMPLATE_KEYS = [
  'mare',
  'lago',
  'montagna',
  'cultura',
  'business',
  'weekend',
  'famiglia',
] as const;

export type PackingTemplateKey = (typeof TEMPLATE_KEYS)[number];

/** Mappa categoria → nomi item; copre tutte le SystemCategoryName. */
export type PackingCategoryItemMap = {
  readonly [K in SystemCategoryName]: readonly string[];
};

/** Catalogo template: ogni template ha un item map completo per categoria. */
export type PackingTemplateCatalogMap = {
  readonly [K in PackingTemplateKey]: PackingCategoryItemMap;
};

export const TEMPLATE_DB_TITLES: Record<PackingTemplateKey, string> = {
  mare: 'Template Mare',
  lago: 'Template Fiumi & Laghi',
  montagna: 'Template Montagna',
  cultura: 'Template Cultura',
  business: 'Template Business',
  weekend: 'Template Weekend',
  famiglia: 'Template Famiglia',
};

export const CITY_TYPE_TO_TEMPLATE: Record<PackingTemplateKey, readonly string[]> = {
  mare: ['mare'],
  lago: ['lago', 'laghi_fiumi'],
  montagna: ['montagna'],
  cultura: ['cultura'],
  business: ['business'],
  weekend: ['weekend'],
  famiglia: ['famiglia'],
};

export interface PackingStandardCatalogItem {
  category: SystemCategoryName;
  name: string;
  tier: PackingStandardItemTier;
  sort_order: number;
}

export interface PackingAiCatalogEntry {
  name: string;
  category: SystemCategoryName;
  tags: readonly string[];
  sort_order: number;
}

export interface PackingDomainValidationReport {
  ok: boolean;
  standardTotal: number;
  templateTotal: number;
  aiTotal: number;
  standardByCategory: Record<SystemCategoryName, number>;
  templateByTemplate: Record<PackingTemplateKey, number>;
  aiByCategory: Record<SystemCategoryName, number>;
  anomalies: string[];
}

/** Target minimi per categoria (dominio congelato). */
export const PACKING_STANDARD_MIN_BY_CATEGORY: Record<SystemCategoryName, number> = {
  Abbigliamento: 10,
  Igiene: 10,
  Elettronica: 10,
  Documenti: 10,
  Farmaci: 5,
  Accessori: 5,
  Extra: 5,
  Bambini: 5,
  Animali: 5,
};

export const PACKING_TEMPLATE_MIN_PER_CATEGORY = 10;

/**
 * Minimi deliberatamente sotto 10 per categoria — decisioni editoriali approvate, non workaround tecnici.
 * Montagna/Documenti: 9 (senza "Equipaggiamento lista").
 * Business/Documenti: 8 (set documentale business essenziale).
 */
export const PACKING_TEMPLATE_MIN_EXCEPTIONS: Partial<
  Record<PackingTemplateKey, Partial<Record<SystemCategoryName, number>>>
> = {
  montagna: { Documenti: 9 },
  business: { Documenti: 8 },
};

export const PACKING_AI_MIN_PER_CATEGORY = 20;

/** Somma attesa item Standard nel dominio congelato: 4×10 + 5×5 = 65. */
export const PACKING_STANDARD_EXPECTED_TOTAL = 65 as const;
