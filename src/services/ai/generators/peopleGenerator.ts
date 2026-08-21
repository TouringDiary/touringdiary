import { aiGateway } from '@/services/ai/aiGateway';
import { buildEnrichPersonPrompt, buildSuggestPeoplePrompt } from '../../../data/ai/prompts';
import type { FamousPerson } from '../../../types/index';
import { cleanJsonOutput, withRetry } from '../aiUtils';

/** Risultato discovery people da Gemini (parziale FamousPerson). */
export type PersonDiscoveryResult = Partial<FamousPerson> & {
  name: string;
  role?: string;
  bio?: string;
  isImporting?: boolean;
};

export const suggestCityPeople = async (
  cityName: string,
  existingNames: string[] = [],
  contextQuery: string = '',
  count: number = 3,
): Promise<PersonDiscoveryResult[]> => {
  return withRetry(async () => {
    const prompt = buildSuggestPeoplePrompt(cityName, count, existingNames, contextQuery);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
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
      return parsed.filter(
        (item): item is PersonDiscoveryResult =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as PersonDiscoveryResult).name === 'string',
      );
    } catch (e) {
      console.warn('Errore parsing suggestCityPeople', e);
      return [];
    }
  });
};

export const enrichPersonData = async (
  personName: string,
  cityName: string,
): Promise<Partial<FamousPerson>> => {
  return withRetry(async () => {
    const prompt = buildEnrichPersonPrompt(personName, cityName);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
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
        ? (parsed as Partial<FamousPerson>)
        : {};
    } catch (e) {
      console.error('Errore parsing enrichPersonData', e);
      return {};
    }
  });
};
