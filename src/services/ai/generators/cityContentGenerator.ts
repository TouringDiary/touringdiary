import { aiGateway } from '@/services/ai/aiGateway';
import { withRetry, cleanJsonOutput } from '../aiUtils';
import { getAiPrompt } from '../../aiConfigService';
import {
    SYSTEM_PRECISION_HEADER,
    buildCityGeneralPrompt,
    buildCityStatsPrompt,
    buildCityHistoryPrompt,
    buildCityRatingsPrompt,
    buildCityPatronPrompt,
    buildRegionalAnalysisPrompt,
    buildZoneAnalysisPrompt,
} from '../../../data/ai/prompts';
import { RegionalAnalysisResult } from '../../../types/index';
import { Type, Schema } from '../../../types/ai';
import {
    type CityCoordsAiResult,
    type CityGeneralAiResult,
    type CityHierarchyAiResult,
    type CityHistoryAiResult,
    type CityPatronAiResult,
    type CityRatingsAiResult,
    type CitySectionKey,
    type CityStatsAiResult,
    parseCityCoordsAiResult,
    parseCityGeneralAiResult,
    parseCityHierarchyAiResult,
    parseCityHistoryAiResult,
    parseCityPatronAiResult,
    parseCityRatingsAiResult,
    parseCityStatsAiResult,
} from '../../../types/ai/cityGeneration';

export type {
    CityCoordsAiResult,
    CityGeneralAiResult,
    CityHierarchyAiResult,
    CityHistoryAiResult,
    CityPatronAiPatron,
    CityPatronAiResult,
    CityRatingsAiResult,
    CitySeasonalVisitorsAiResult,
    CitySectionAiResultMap,
    CitySectionKey,
    CityStatsAiResult,
} from '../../../types/ai/cityGeneration';

const ZONE_ANALYSIS_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        region: { type: Type.STRING },
        zones: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    mainCities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                visitors: { type: Type.NUMBER },
                                reason: { type: Type.STRING },
                            },
                            required: ['name', 'visitors', 'reason'],
                        },
                    },
                },
                required: ['name', 'mainCities'],
            },
        },
    },
    required: ['region', 'zones'],
};

export function generateSingleField(cityName: string, fieldType: 'website'): Promise<string>;
export function generateSingleField(cityName: string, fieldType: 'subtitle'): Promise<string>;
export function generateSingleField(cityName: string, fieldType: 'coords'): Promise<CityCoordsAiResult>;
export function generateSingleField(cityName: string, fieldType: 'hierarchy'): Promise<CityHierarchyAiResult>;
export function generateSingleField(
    cityName: string,
    fieldType: 'website' | 'coords' | 'hierarchy' | 'subtitle',
): Promise<string | CityCoordsAiResult | CityHierarchyAiResult> {
    return withRetry(async () => {
        let prompt = '';

        const model = fieldType === 'subtitle' ? 'gemini-2.0-flash' : 'gemini-2.0-pro';
        const tools = fieldType === 'subtitle' ? undefined : [{ googleSearch: {} }];

        if (fieldType === 'website') {
            const coreInstruction = `Trova l'URL ufficiale del sito del comune o del portale turistico ESCLUSIVAMENTE per la città di ${cityName}. Rispondi SOLO con l'URL.`;
            prompt = await getAiPrompt('city_website', { cityName }, coreInstruction);
            if (!prompt.toLowerCase().includes(cityName.toLowerCase())) {
                prompt = `${prompt} Città Target: ${cityName}`;
            }
        } else if (fieldType === 'coords') {
            prompt = `Trova le coordinate GPS (lat, lng) del centro esatto di ${cityName}. Rispondi JSON: {"lat": 0.0, "lng": 0.0}`;
        } else if (fieldType === 'hierarchy') {
            prompt = `Analizza la geografia di ${cityName}. Rispondi JSON: {"continent": "Europa", "nation": "Italia", "adminRegion": "Campania", "zone": "es. Cilento, Costiera..."}`;
        } else if (fieldType === 'subtitle') {
            prompt = `Scrivi uno slogan turistico breve ed evocativo (max 6 parole) per ${cityName}.`;
        }

        const response = await aiGateway.generateLegacy({
            model,
            contents: prompt,
            config: {
                tools,
                responseMimeType: fieldType === 'coords' || fieldType === 'hierarchy' ? 'application/json' : undefined,
            },
        });

        const text = response.text?.trim() || '';

        if (fieldType === 'coords') {
            return parseCityCoordsAiResult(JSON.parse(cleanJsonOutput(text)));
        }
        if (fieldType === 'hierarchy') {
            return parseCityHierarchyAiResult(JSON.parse(cleanJsonOutput(text)));
        }
        if (fieldType === 'website') {
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            return urlMatch ? urlMatch[0].replace(/['">)]+$/, '') : '';
        }

        return text.replace(/^"|"$/g, '');
    });
}

export function generateCitySection(
    cityName: string,
    section: 'general',
    extraInstructions?: string,
    existingZones?: string[],
): Promise<CityGeneralAiResult>;
export function generateCitySection(
    cityName: string,
    section: 'stats',
    extraInstructions?: string,
    existingZones?: string[],
): Promise<CityStatsAiResult>;
export function generateCitySection(
    cityName: string,
    section: 'history',
    extraInstructions?: string,
    existingZones?: string[],
): Promise<CityHistoryAiResult>;
export function generateCitySection(
    cityName: string,
    section: 'ratings',
    extraInstructions?: string,
    existingZones?: string[],
): Promise<CityRatingsAiResult>;
export function generateCitySection(
    cityName: string,
    section: 'patron',
    extraInstructions?: string,
    existingZones?: string[],
): Promise<CityPatronAiResult>;
export function generateCitySection(
    cityName: string,
    section: CitySectionKey,
    extraInstructions: string = '',
    existingZones: string[] = [],
): Promise<CityGeneralAiResult | CityStatsAiResult | CityHistoryAiResult | CityRatingsAiResult | CityPatronAiResult> {
    return withRetry(async () => {
        let prompt = '';
        const baseContext = `Città Target: ${cityName}. ${extraInstructions}`;

        switch (section) {
            case 'general':
                prompt = buildCityGeneralPrompt(cityName, baseContext, existingZones);
                break;
            case 'stats':
                prompt = buildCityStatsPrompt(cityName, baseContext);
                break;
            case 'history':
                prompt = buildCityHistoryPrompt(cityName, baseContext);
                break;
            case 'ratings':
                prompt = buildCityRatingsPrompt(cityName, baseContext);
                break;
            case 'patron':
                prompt = buildCityPatronPrompt(cityName, baseContext);
                break;
        }

        try {
            const dbKey = `city_gen_${section}`;
            const dbPrompt = await getAiPrompt(dbKey, { cityName, existingZones: existingZones.join(', ') });
            if (dbPrompt && dbPrompt.length > 20) {
                prompt = `${SYSTEM_PRECISION_HEADER}\n${dbPrompt}\n${extraInstructions}`;
            }
        } catch {
            // Fallback
        }

        const response = await aiGateway.generateLegacy({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });

        const text = response.text?.trim() || '{}';
        const parsed: unknown = JSON.parse(cleanJsonOutput(text));

        switch (section) {
            case 'general':
                return parseCityGeneralAiResult(parsed);
            case 'stats':
                return parseCityStatsAiResult(parsed);
            case 'history':
                return parseCityHistoryAiResult(parsed);
            case 'ratings':
                return parseCityRatingsAiResult(parsed);
            case 'patron':
                return parseCityPatronAiResult(parsed);
        }
    });
}

export const generateCitySuggestion = async (userQuery: string, availableCities: string[] = []): Promise<string> => {
    return withRetry(async () => {
        const citiesListString = availableCities.length > 0
            ? availableCities.join(', ')
            : 'Napoli, Sorrento, Positano, Amalfi, Capri, Ischia, Procida, Caserta, Salerno, Paestum';

        const systemPrompt = `
        SEI IL CONSULENTE TURISTICO UFFICIALE DI "TOURING DIARY CAMPANIA".
        OBIETTIVO: Rispondere alla domanda dell'utente in modo utile, preciso e invitante.
        REGOLE FONDAMENTALI:
        1. GROUNDING SUL SITO: Le città attualmente presenti nel nostro sito sono: [${citiesListString}].
        2. STILE: Sii conciso (max 3-4 frasi). Tono amichevole, esperto e caldo.
        DOMANDA UTENTE: "${userQuery}"
        `;

        const response = await aiGateway.generateLegacy({
            model: 'gemini-2.0-flash',
            contents: systemPrompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 200,
            },
        }, { feature: 'hero_chat' });

        return response.text?.trim() || 'Non ho trovato una risposta precisa, ma ti consiglio di esplorare le nostre città in evidenza!';
    });
};

export const generateRegionalAnalysis = async (
    regionName: string,
    existingZones: string[] = [],
    minVisitors: number = 50000,
): Promise<RegionalAnalysisResult | null> => {
    return withRetry(async () => {
        const prompt = buildRegionalAnalysisPrompt(regionName, existingZones, minVisitors);

        const response = await aiGateway.generateLegacy({
            model: 'gemini-2.0-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: ZONE_ANALYSIS_SCHEMA,
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text?.trim() || '{}';
        return JSON.parse(cleanJsonOutput(text)) as RegionalAnalysisResult;
    });
};

export const generateZoneAnalysis = async (
    zoneName: string,
    regionName: string,
    existingCities: string[] = [],
    minVisitors: number = 5000,
): Promise<RegionalAnalysisResult | null> => {
    return withRetry(async () => {
        const prompt = buildZoneAnalysisPrompt(zoneName, regionName, [], minVisitors);

        const response = await aiGateway.generateLegacy({
            model: 'gemini-2.0-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: ZONE_ANALYSIS_SCHEMA,
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text?.trim() || '{}';

        try {
            const data = JSON.parse(cleanJsonOutput(text)) as RegionalAnalysisResult;
            if (!data.zones || !Array.isArray(data.zones)) {
                console.error('Invalid Zone Analysis Format', data);
                throw new Error('Formato JSON non valido');
            }
            return data;
        } catch (e) {
            console.error('AI Parse Error (Zone Analysis):', text);
            throw e;
        }
    });
};
