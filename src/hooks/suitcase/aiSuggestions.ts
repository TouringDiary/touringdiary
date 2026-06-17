import { addAiSuggestedItemsAsync } from '@/services/suitcase/suitcaseItemsService';
import { getRejectionsBySuitcaseAsync } from '@/services/suitcase/suitcaseRejectionsService';
import { normalizeItemName } from '@/utils/tagDerivation';
import {
  getDraftLocalRejections,
  getGuestSuitcase,
  insertDraftAiSuggestions,
  isDraftWorkspaceId,
} from '@/utils/guestSuitcaseHelper';
import { TAG_ITEM_MAP, UNIVERSAL_DEFAULTS } from '@/domain/packing/packingAiSeedSource';

// ECCEZIONE DOCUMENTATA (MACROFASE A→C): catalogo hardcoded fino a collegamento packing_ai_catalog.
// Vedi docs/packing/MACROFASE_A_EXCEPTIONS.md

export const seedAiSuggestions = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  suggestionContext?: string,
  selectedCategories?: string[]
): Promise<number> => {
  const toInsert = await getAiCandidates(suitcaseId, tags, existingItems, selectedCategories);

  if (toInsert.length === 0) return 0;

  if (isDraftWorkspaceId(suitcaseId)) {
    insertDraftAiSuggestions(suitcaseId, toInsert, suggestionContext);
    return toInsert.length;
  }

  await addAiSuggestedItemsAsync(suitcaseId, toInsert, suggestionContext);
  return toInsert.length;
};

export const getAiCandidates = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  selectedCategories?: string[]
): Promise<{ name: string; category: string }[]> => {
  // 1. Carica blacklist: locale su workspace draft, DB su valigie persistite
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
      console.error("[getAiCandidates] Failed to load rejections:", e);
    }
  }

  // 2. Unifica oggetti esistenti e blacklist nel Set di esclusione
  const existingNormalized = new Set([
    ...existingItems.map(i => normalizeItemName(i.name)),
    ...rejections
  ]);

  const candidates: { name: string; category: string }[] = [...UNIVERSAL_DEFAULTS];
  
  // Aggiungiamo tag impliciti basati sui tag esistenti per arricchire la generazione
  const enrichedTags = [...tags];
  if (tags.includes('mare') || tags.includes('montagna')) enrichedTags.push('igiene_completa', 'abbigliamento_base');
  if (tags.includes('volo') || tags.includes('lungo_raggio')) enrichedTags.push('elettronica_completa', 'farmacia');

  // Logica Categorie -> Tag (Bambini -> famiglia, Animali -> pet)
  if (selectedCategories?.includes('Bambini')) enrichedTags.push('famiglia');
  if (selectedCategories?.includes('Animali')) enrichedTags.push('pet');

  enrichedTags.forEach(tag => {
    if (TAG_ITEM_MAP[tag]) candidates.push(...TAG_ITEM_MAP[tag]);
  });

  const seen = new Set<string>();
  const filtered = candidates.filter(item => {
    const key = normalizeItemName(item.name);
    
    // Filtro per categoria se specificato
    if (selectedCategories && selectedCategories.length > 0) {
      if (!selectedCategories.includes(item.category)) return false;
    }

    if (seen.has(key) || existingNormalized.has(key)) return false;
    seen.add(key);
    return true;
  });

  return filtered;
};
