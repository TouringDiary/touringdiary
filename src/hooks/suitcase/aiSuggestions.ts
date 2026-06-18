import { addAiSuggestedItemsAsync } from '@/services/suitcase/suitcaseItemsService';
import { getRejectionsBySuitcaseAsync } from '@/services/suitcase/suitcaseRejectionsService';
import { normalizeItemName } from '@/utils/tagDerivation';
import {
  getDraftLocalRejections,
  getGuestSuitcase,
  insertDraftAiSuggestions,
  isDraftWorkspaceId,
} from '@/utils/guestSuitcaseHelper';
import { getCategoryId, normalizeCategoryName } from '@/domain/packing/packingCategories';
import { resolveCategorySetup } from '@/domain/packing/categorySetup';
import { Suitcase } from '@/types/suitcase';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import {
  fetchActiveAiCatalogAsync,
  fetchActiveStandardItemsAsync,
  fetchTemplateSpecificItemsAsync,
} from '@/services/suitcase/packingCatalogService';

export const seedAiSuggestions = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  suggestionContext?: string,
  selectedCategories?: string[],
  suitcase?: Suitcase
): Promise<number> => {
  const toInsert = await getAiCandidates(
    suitcaseId,
    tags,
    existingItems,
    selectedCategories,
    suitcase
  );

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

export const getAiCandidates = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  selectedCategories?: string[],
  suitcase?: Suitcase
): Promise<{ name: string; category: string }[]> => {
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

  const enrichedTags = [...tags];
  if (tags.includes('mare') || tags.includes('montagna')) {
    enrichedTags.push('igiene_completa', 'abbigliamento_base');
  }
  if (tags.includes('volo') || tags.includes('lungo_raggio')) {
    enrichedTags.push('elettronica_completa', 'farmacia');
  }
  if (selectedCategories?.includes('Bambini')) enrichedTags.push('famiglia');
  if (selectedCategories?.includes('Animali')) enrichedTags.push('pet');

  const catalog = await fetchActiveAiCatalogAsync();
  const matchesTags = (itemTags: string[]) =>
    itemTags.includes('universal') || itemTags.some((tag) => enrichedTags.includes(tag));

  const candidates = catalog
    .filter((item) => matchesTags(item.tags))
    .map((item) => ({ name: item.name, category: item.category }));

  const seen = new Set<string>();
  return candidates.filter((item) => {
    const key = normalizeItemName(item.name);

    if (selectedCategories && selectedCategories.length > 0) {
      if (!selectedCategories.includes(item.category)) return false;
    }

    if (seen.has(key) || existingNormalized.has(key)) return false;
    seen.add(key);
    return true;
  });
};
