/**
 * Dominio categorie personaggi famosi (Master → Specific, N:M).
 * SoT contratto: AI_CONTEXT/AUDIT_ANGOLO_CULTURA_TIMELINE.md §F3.2 / §F4.3.
 */

export type FamousPersonMasterCategory = {
  id: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  deletedAt: string | null;
};

export type FamousPersonSpecificCategory = {
  id: string;
  masterId: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  deletedAt: string | null;
};

/** Link risolto per display (specific + master nested). */
export type FamousPersonCategoryLink = {
  specific: FamousPersonSpecificCategory;
  master: FamousPersonMasterCategory;
};

/** Soglia warning Admin non bloccante sul numero di Specific assegnate (§F4.3). */
export const SPECIFIC_WARNING_THRESHOLD = 6;

export type FamousPersonCategorySortable = {
  label: string;
  slug: string;
  orderIndex: number;
  masterOrderIndex: number;
  masterSlug: string;
};

/**
 * Slug tecnico da label: snake_case, senza accenti né apostrofi.
 * Es. «Direttore d'orchestra» → `direttore_dorchestra`.
 */
export function slugifyFamousCategoryLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`´ʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Assegnabile / filtrabile / AI: attiva e non soft-deleted (PO-N). */
export function isCategoryAssignable(cat: {
  is_active: boolean;
  deleted_at: string | null;
}): boolean {
  return cat.is_active === true && cat.deleted_at == null;
}

/**
 * Specific “primaria” per badge/display: prima per masterOrderIndex, poi orderIndex, poi slug.
 */
export function getPrimarySpecific(
  categories: FamousPersonCategorySortable[],
): FamousPersonCategorySortable | null {
  if (categories.length === 0) return null;
  const sorted = [...categories].sort((a, b) => {
    if (a.masterOrderIndex !== b.masterOrderIndex) {
      return a.masterOrderIndex - b.masterOrderIndex;
    }
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.slug.localeCompare(b.slug);
  });
  return sorted[0] ?? null;
}

/** Master derivati dall’insieme di Specific (ordine di prima apparizione). */
export function deriveMasterSlugsFromSpecifics(
  categories: Array<{ masterSlug: string }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const cat of categories) {
    if (seen.has(cat.masterSlug)) continue;
    seen.add(cat.masterSlug);
    out.push(cat.masterSlug);
  }
  return out;
}
