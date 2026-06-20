import { addAiSuggestedItemsAsync } from '@/services/suitcase/suitcaseItemsService';
import { getRejectionsBySuitcaseAsync } from '@/services/suitcase/suitcaseRejectionsService';
import { normalizeItemName } from '@/utils/tagDerivation';
import {
  getDraftLocalRejections,
  getGuestSuitcase,
  insertDraftAiSuggestions,
  isDraftWorkspaceId,
} from '@/utils/guestSuitcaseHelper';
import {
  CATEGORY_ORDER,
  getCategoryId,
  normalizeCategoryName,
  SystemCategoryName,
} from '@/domain/packing/packingCategories';
import { resolveCategorySetup } from '@/domain/packing/categorySetup';
import { Suitcase } from '@/types/suitcase';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import {
  fetchActiveAiCatalogAsync,
  fetchActiveStandardItemsAsync,
  fetchTemplateSpecificItemsAsync,
} from '@/services/suitcase/packingCatalogService';

export interface AiCandidate {
  name: string;
  category: string;
  tripRelevant: boolean;
}

export interface GetAiCandidatesOptions {
  limitPerCategory?: Partial<Record<SystemCategoryName, number>>;
}

export function clampCategoryLimit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isSystemCategoryName(name: string): name is SystemCategoryName {
  return (CATEGORY_ORDER as readonly string[]).includes(name);
}

export function buildUniformLimitMap(
  categories: string[],
  limit: number
): Partial<Record<SystemCategoryName, number>> {
  const clamped = clampCategoryLimit(limit);
  const map: Partial<Record<SystemCategoryName, number>> = {};
  for (const cat of categories) {
    const normalized = normalizeCategoryName(cat);
    if (isSystemCategoryName(normalized)) {
      map[normalized] = clamped;
    }
  }
  return map;
}

export function normalizeLimitPerCategory(
  map: Partial<Record<SystemCategoryName, number>>
): Partial<Record<SystemCategoryName, number>> {
  const out: Partial<Record<SystemCategoryName, number>> = {};
  for (const [cat, limit] of Object.entries(map)) {
    if (limit === undefined) continue;
    const normalized = normalizeCategoryName(cat);
    if (!isSystemCategoryName(normalized)) continue;
    out[normalized] = clampCategoryLimit(limit);
  }
  return out;
}

export const seedAiSuggestions = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  suggestionContext?: string,
  selectedCategories?: string[],
  suitcase?: Suitcase,
  options?: GetAiCandidatesOptions,
  precomputedCandidates?: AiCandidate[]
): Promise<number> => {
  const toInsert =
    precomputedCandidates ??
    (await getAiCandidates(
      suitcaseId,
      tags,
      existingItems,
      selectedCategories,
      suitcase,
      options
    ));

  if (toInsert.length === 0) return 0;

  if (isDraftWorkspaceId(suitcaseId)) {
    insertDraftAiSuggestions(suitcaseId, toInsert, suggestionContext);
    return toInsert.length;
  }

  await addAiSuggestedItemsAsync(suitcaseId, toInsert, suggestionContext);
  return toInsert.length;
};

async function buildCatalogExclusions(suitcase?: Suitcase): Promise<Set<string>> {
  const excluded = new Set<string>();
  if (!suitcase) return excluded;

  const setup = resolveCategorySetup(suitcase);
  const standardRows = await fetchActiveStandardItemsAsync();

  for (const row of standardRows) {
    const cat = normalizeCategoryName(row.category);
    const catId = getCategoryId(cat);
    const entry = setup[catId];
    if (entry?.enabled === false) continue;
    if (entry?.seeded !== true) continue;
    if (row.tier === 'additional_ai_only') continue;
    excluded.add(normalizeItemName(row.name));
  }

  const templateId = suitcase.source_template_id ?? (isTdTemplate(suitcase) ? suitcase.id : null);
  if (templateId) {
    const templateItems = await fetchTemplateSpecificItemsAsync(templateId);
    for (const item of templateItems) {
      excluded.add(normalizeItemName(item.name));
    }
  }

  return excluded;
}

function buildEnrichedTags(tags: string[], selectedCategories?: string[]): string[] {
  const enrichedTags = [...tags];
  if (tags.includes('mare') || tags.includes('montagna')) {
    enrichedTags.push('igiene_completa', 'abbigliamento_base');
  }
  if (tags.includes('volo') || tags.includes('lungo_raggio')) {
    enrichedTags.push('elettronica_completa', 'farmacia');
  }
  if (selectedCategories?.includes('Bambini')) enrichedTags.push('famiglia');
  if (selectedCategories?.includes('Animali')) enrichedTags.push('pet');
  return enrichedTags;
}

function isTripRelevant(itemTags: string[], enrichedTags: Set<string>): boolean {
  return itemTags.some((tag) => tag !== 'universal' && enrichedTags.has(tag));
}

function scoreTripPriority(itemTags: string[], enrichedTags: Set<string>): number {
  if (isTripRelevant(itemTags, enrichedTags)) {
    return 100 + itemTags.filter((tag) => enrichedTags.has(tag)).length;
  }
  if (itemTags.includes('universal')) return 1;
  return 0;
}

function resolveSortOrder(sortOrder: number | null | undefined): number {
  return sortOrder ?? 0;
}

function applyLimitPerCategory(
  items: AiCandidate[],
  limitPerCategory?: Partial<Record<SystemCategoryName, number>>
): AiCandidate[] {
  if (!limitPerCategory) return items;

  const counts = new Map<string, number>();
  return items.filter((item) => {
    const normalized = normalizeCategoryName(item.category);
    const limit = isSystemCategoryName(normalized)
      ? limitPerCategory[normalized]
      : undefined;
    if (limit === undefined) return true;
    const current = counts.get(normalized) ?? 0;
    if (current >= limit) return false;
    counts.set(normalized, current + 1);
    return true;
  });
}

export const getAiCandidates = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  selectedCategories?: string[],
  suitcase?: Suitcase,
  options?: GetAiCandidatesOptions
): Promise<AiCandidate[]> => {
  let rejections: string[] = [];
  if (isDraftWorkspaceId(suitcaseId)) {
    const draft = getGuestSuitcase();
    if (draft?.id === suitcaseId) {
      rejections = getDraftLocalRejections(draft).map((r) => normalizeItemName(r.name));
    }
  } else {
    try {
      const dbRejections = await getRejectionsBySuitcaseAsync(suitcaseId);
      rejections = dbRejections.map((r) => normalizeItemName(r.name));
    } catch (e) {
      console.error('[getAiCandidates] Failed to load rejections:', e);
    }
  }

  const existingNormalized = new Set([
    ...existingItems.map((i) => normalizeItemName(i.name)),
    ...rejections,
  ]);

  const catalogExclusions = await buildCatalogExclusions(suitcase);
  for (const name of catalogExclusions) {
    existingNormalized.add(name);
  }

  const enrichedTags = buildEnrichedTags(tags, selectedCategories);
  const enrichedTagSet = new Set(enrichedTags);

  const catalog = await fetchActiveAiCatalogAsync();
  const seen = new Set<string>();

  const pool = catalog
    .filter((item) => {
      if (selectedCategories && selectedCategories.length > 0) {
        if (!selectedCategories.includes(item.category)) return false;
      }
      const key = normalizeItemName(item.name);
      if (seen.has(key) || existingNormalized.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      name: item.name,
      category: item.category,
      tripRelevant: isTripRelevant(item.tags, enrichedTagSet),
      _score: scoreTripPriority(item.tags, enrichedTagSet),
      _sortOrder: resolveSortOrder(item.sort_order),
    }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return a._sortOrder - b._sortOrder;
    })
    .map(({ name, category, tripRelevant }) => ({ name, category, tripRelevant }));

  return applyLimitPerCategory(pool, options?.limitPerCategory);
};
