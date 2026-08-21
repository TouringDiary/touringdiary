import { buildRefineServicePrompt, buildSuggestItemsPrompt } from '../../../data/ai/prompts';
import { aiGateway } from '../aiGateway';
import { cleanJsonOutput, withRetry } from '../aiUtils';
import { generateAllowedCategoriesPromptString } from '../utils/taxonomyUtils';

/** Item suggerito da Gemini per guide/eventi/servizi/tour operator. */
export type SuggestedCityItem = Record<string, unknown> & {
  name?: string;
  rating?: number;
  visitors?: number;
};

/** Bundle servizi grezzo / raffinato (Magic/Complete). */
export type RefinedServicesBundle = {
  guides?: SuggestedCityItem[];
  events?: SuggestedCityItem[];
  services?: SuggestedCityItem[];
  tour_operators?: SuggestedCityItem[];
} & Record<string, unknown>;

export interface EventInterestAiResult {
  rating: number;
  visitors: number;
  summary: string;
}

export type SuggestCityItemType = 'guides' | 'events' | 'services' | 'tour_operators' | 'people';

/**
 * Genera liste di elementi per la città (Guide, Eventi, Servizi, Tour Operator).
 */
export const suggestCityItems = async (
  cityName: string,
  type: SuggestCityItemType,
  existingNames: string[] = [],
  contextQuery: string = '',
  count: number = 3,
): Promise<SuggestedCityItem[]> => {
  return withRetry(async () => {
    if (type === 'people') {
      return [];
    }

    const exclusionStr =
      existingNames.length > 0
        ? `ESCLUDI questi nomi già presenti: ${existingNames.join(', ')}`
        : '';

    const allowedCategories = generateAllowedCategoriesPromptString();

    const prompt = buildSuggestItemsPrompt(
      cityName,
      type,
      count,
      contextQuery,
      exclusionStr,
      allowedCategories,
    );

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim() || '[]';
    const parsed: unknown = JSON.parse(cleanJsonOutput(text));
    const items = Array.isArray(parsed) ? (parsed as SuggestedCityItem[]) : [];

    if (type === 'events') {
      return items.map((item) => ({
        ...item,
        rating: typeof item.rating === 'number' ? item.rating : 0,
        visitors: typeof item.visitors === 'number' ? item.visitors : 0,
      }));
    }

    return items;
  });
};

/**
 * Esegue la bonifica e il merge intelligente dei dati dei servizi.
 */
export const refineServiceData = async (
  cityName: string,
  draftData: RefinedServicesBundle,
): Promise<RefinedServicesBundle> => {
  return withRetry(async () => {
    const prompt = buildRefineServicePrompt(cityName, draftData);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed: unknown = JSON.parse(cleanJsonOutput(text));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as RefinedServicesBundle)
      : {};
  });
};

/**
 * Analizza un evento per stimare interesse turistico e visitatori.
 */
export const analyzeEventInterest = async (
  eventName: string,
  cityName: string,
): Promise<EventInterestAiResult> => {
  return withRetry(async () => {
    const prompt = `
            Analizza l'evento "${eventName}" a "${cityName}".
            1. Stima un punteggio di interesse turistico (0-100).
            2. Stima visitatori attesi.
            3. Scrivi un riassunto di 1 frase per invogliare.
            
            RISPONDI SOLO JSON: { "rating": 85, "visitors": 5000, "summary": "..." }
        `;

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed: unknown = JSON.parse(cleanJsonOutput(response.text || '{}'));
    const obj =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    return {
      rating: typeof obj.rating === 'number' ? obj.rating : 0,
      visitors: typeof obj.visitors === 'number' ? obj.visitors : 0,
      summary: typeof obj.summary === 'string' ? obj.summary : '',
    };
  });
};
