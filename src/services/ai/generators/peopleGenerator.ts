import { aiGateway } from '@/services/ai/aiGateway';
import { buildEnrichPersonPrompt, buildSuggestPeoplePrompt } from '../../../data/ai/prompts';
import type { FamousPerson } from '../../../types/index';
import {
  generateFamousPeopleCategoriesPromptString,
  loadFamousPersonTaxonomy,
} from '../../city/famousPersonCategoryService';
import { cleanJsonOutput, withRetry } from '../aiUtils';

/** Enrichment AI: campi FamousPerson parziali + slug categorie (non presenti sul modello dominio). */
type PersonEnrichmentResult = Partial<FamousPerson> & {
  specificCategorySlugs?: string[];
};

/**
 * Risultato discovery people da Gemini.
 * Estende Partial<FamousPerson>; richiede `name` per il type guard di validità.
 * Campi discovery-only: slug AI e flag UI di import.
 */
export type PersonDiscoveryResult = PersonEnrichmentResult & {
  name: string;
  isImporting?: boolean;
};

async function loadActiveCategoriesPrompt(): Promise<string> {
  try {
    const taxonomy = await loadFamousPersonTaxonomy({ activeOnly: true });
    return generateFamousPeopleCategoriesPromptString(taxonomy);
  } catch (e) {
    console.warn('[peopleGenerator] Impossibile caricare tassonomia categorie', e);
    return '';
  }
}

function isPersonDiscoveryResult(item: unknown): item is PersonDiscoveryResult {
  if (!item || typeof item !== 'object') return false;
  const name = (item as { name?: unknown }).name;
  return typeof name === 'string' && name.trim().length > 0;
}

export const suggestCityPeople = async (
  cityName: string,
  existingNames: string[] = [],
  contextQuery: string = '',
  count: number = 3,
): Promise<PersonDiscoveryResult[]> => {
  return withRetry(async () => {
    const categoriesPrompt = await loadActiveCategoriesPrompt();
    const prompt = buildSuggestPeoplePrompt(
      cityName,
      count,
      existingNames,
      contextQuery,
      categoriesPrompt,
    );

    const response = await aiGateway.generateLegacy({
      // gemini-2.0-pro non è un ID API utilizzabile (404 NOT_FOUND); allineato a peopleCompletenessPipeline / aiVision.
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || '[]';
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(rawText));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isPersonDiscoveryResult);
    } catch (e) {
      console.warn('Errore parsing suggestCityPeople', e);
      return [];
    }
  });
};

export const enrichPersonData = async (
  personName: string,
  cityName: string,
): Promise<PersonEnrichmentResult> => {
  return withRetry(async () => {
    const categoriesPrompt = await loadActiveCategoriesPrompt();
    const prompt = buildEnrichPersonPrompt(personName, cityName, categoriesPrompt);

    const response = await aiGateway.generateLegacy({
      // gemini-2.0-pro non è un ID API utilizzabile (404 NOT_FOUND); allineato a peopleCompletenessPipeline / aiVision.
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || '{}';
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(rawText));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as PersonEnrichmentResult)
        : {};
    } catch (e) {
      console.error('Errore parsing enrichPersonData', e);
      return {};
    }
  });
};
