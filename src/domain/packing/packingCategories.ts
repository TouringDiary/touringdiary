/**
 * Sorgente unica di verità per categorie valigia (frontend).
 * NON duplicare queste liste altrove nel codebase.
 */

export type CategoryTier = 'core' | 'additional';

/** Tier degli item in packing_standard_items */
export type StandardItemTier = 'core' | 'additional' | 'additional_ai_only';

export const CORE_CATEGORY_NAMES = [
  'Abbigliamento',
  'Igiene',
  'Documenti',
  'Elettronica',
  'Farmaci',
  'Accessori',
  'Extra',
] as const;

export const ADDITIONAL_CATEGORY_NAMES = ['Bambini', 'Animali'] as const;

export type CoreCategoryName = (typeof CORE_CATEGORY_NAMES)[number];
export type AdditionalCategoryName = (typeof ADDITIONAL_CATEGORY_NAMES)[number];
export type SystemCategoryName = CoreCategoryName | AdditionalCategoryName;

/** Ordine di visualizzazione: core prima, poi aggiuntive */
export const CATEGORY_ORDER: readonly SystemCategoryName[] = [
  ...CORE_CATEGORY_NAMES,
  ...ADDITIONAL_CATEGORY_NAMES,
];

/** Alias semantico — stessa sequenza di CATEGORY_ORDER */
export const SYSTEM_CATEGORY_NAMES = CATEGORY_ORDER;

export const CATEGORY_ID_MAP: Record<SystemCategoryName, string> = {
  Abbigliamento: 'clothing',
  Igiene: 'hygiene',
  Documenti: 'documents',
  Elettronica: 'electronics',
  Farmaci: 'meds',
  Accessori: 'accessories',
  Extra: 'extra',
  Bambini: 'kids',
  Animali: 'pets',
};

export const CATEGORY_EMOJI: Record<SystemCategoryName, string> = {
  Abbigliamento: '👕',
  Igiene: '🚿',
  Documenti: '📄',
  Elettronica: '📱',
  Farmaci: '💊',
  Accessori: '🎒',
  Extra: '📦',
  Bambini: '👶',
  Animali: '🐾',
};

/** Sigle a 3 lettere per le categorie sistema (toolbar valigia). */
export const CATEGORY_SHORT_LABELS: Record<SystemCategoryName, string> = {
  Abbigliamento: 'ABB',
  Igiene: 'IGI',
  Documenti: 'DOC',
  Elettronica: 'ELE',
  Farmaci: 'FAR',
  Accessori: 'ACC',
  Extra: 'EXT',
  Bambini: 'BAM',
  Animali: 'ANI',
};

export function getCategoryShortLabel(categoryName: string): string {
  const normalized = normalizeCategoryName(categoryName);
  if (isSystemCategoryName(normalized)) {
    return CATEGORY_SHORT_LABELS[normalized];
  }
  const letters = normalized.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  const source = letters.length >= 3 ? letters : normalized;
  return source.slice(0, 3).toUpperCase();
}

/** Alias legacy (suitcase_items) e tag semantici affiliate → nome canonico */
export const LEGACY_CATEGORY_ALIASES: Record<string, SystemCategoryName> = {
  'accessori & organizzazione': 'Accessori',
  accessori: 'Accessori',
  salute: 'Farmaci',
  altro: 'Extra',
  'must have': 'Extra',
  travel: 'Extra',
  beauty: 'Igiene',
  gear: 'Extra',
};

export function getCategoryTier(name: string): CategoryTier | null {
  const normalized = normalizeCategoryName(name);
  if ((CORE_CATEGORY_NAMES as readonly string[]).includes(normalized)) return 'core';
  if ((ADDITIONAL_CATEGORY_NAMES as readonly string[]).includes(normalized)) return 'additional';
  return null;
}

export function isSystemCategoryName(name: string): name is SystemCategoryName {
  return getCategoryTier(name) !== null;
}

/**
 * Indice di CATEGORY_ORDER per match ESATTO (case-sensitive) sul nome.
 * Utile quando i dati in input sono string generiche e vogliamo
 * preservare la semantica di `indexOf` senza cast di tipo.
 */
export function getSystemCategoryOrderIndexExact(name: string): number {
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    if (CATEGORY_ORDER[i] === name) return i;
  }
  return -1;
}

export function normalizeCategoryName(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const alias = LEGACY_CATEGORY_ALIASES[lower];
  if (alias) return alias;
  const match = CATEGORY_ORDER.find((c) => c.toLowerCase() === lower);
  return match ?? trimmed;
}

export function getCategoryId(
  categoryName: string,
  customCategories?: { id: string; name: string }[]
): string {
  const normalized = normalizeCategoryName(categoryName);
  if (normalized in CATEGORY_ID_MAP) {
    return CATEGORY_ID_MAP[normalized as SystemCategoryName];
  }
  const custom = customCategories?.find((c) => c.name === categoryName || c.name === normalized);
  if (custom?.id) return custom.id;
  return normalized.toLowerCase().replace(/\s+/g, '-');
}

export function getCategoryEmoji(categoryName: string): string {
  const normalized = normalizeCategoryName(categoryName);
  if (normalized in CATEGORY_EMOJI) {
    return CATEGORY_EMOJI[normalized as SystemCategoryName];
  }
  return '📦';
}

/** Categorie ammissibili nel dropdown admin (solo nomi canonici) */
export const ADMIN_CATEGORY_OPTIONS: readonly SystemCategoryName[] = CATEGORY_ORDER;
