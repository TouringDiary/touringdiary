import { getAiClient } from '../../ai/aiClient';
import { withRetry, cleanJsonOutput } from '../../ai/aiUtils';
import { generateAllowedCategoriesPromptString } from '../../ai/utils/taxonomyUtils'; // NEW IMPORT
import { 
    buildSuggestItemsPrompt, 
    buildRefineServicePrompt
} from '../../../data/ai/prompts';

/**
 * Genera liste di elementi per la città (Guide, Eventi, Servizi, Tour Operator).
 */
export const suggestCityItems = async (cityName: string, type: 'guides' | 'events' | 'services' | 'tour_operators' | 'people', existingNames: string[] = [], contextQuery: string = '', count: number = 3): Promise<any[]> => {
    return withRetry(async () => {
        if (type === 'people') {
             return [];
        }

        const exclusionStr = existingNames.length > 0 ? `ESCLUDI questi nomi già presenti: ${existingNames.join(', ')}` : '';
        
        // Genera la lista dinamica delle categorie dal DB
        const allowedCategories = generateAllowedCategoriesPromptString();
        
        const prompt = buildSuggestItemsPrompt(cityName, type, count, contextQuery, exclusionStr, allowedCategories);

        // USARE IL GETTER LAZY, NON LA COSTANTE
        const aiClient = getAiClient();
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim() || "[]";
        const items = JSON.parse(cleanJsonOutput(text));
        
        if (type === 'events' && Array.isArray(items)) {
            return items.map((item: any) => ({
                ...item,
                rating: typeof item.rating === 'number' ? item.rating : 0,
                visitors: typeof item.visitors === 'number' ? item.visitors : 0
            }));
        }

        return items;
    });
};

/**
 * Esegue la bonifica e il merge intelligente dei dati dei servizi.
 */
export const refineServiceData = async (cityName: string, draftData: any): Promise<any> => {
    return withRetry(async () => {
        const prompt = buildRefineServicePrompt(cityName, draftData);
        
        // USARE IL GETTER LAZY
        const aiClient = getAiClient();
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }] 
            }
        });

        const text = response.text?.trim() || "{}";
        return JSON.parse(cleanJsonOutput(text));
    });
};

/**
 * Analizza un evento per stimare interesse turistico e visitatori.
 */
export const analyzeEventInterest = async (eventName: string, cityName: string): Promise<any> => {
    return withRetry(async () => {
        const prompt = `
            Analizza l'evento "${eventName}" a "${cityName}".
            1. Stima un punteggio di interesse turistico (0-100).
            2. Stima visitatori attesi.
            3. Scrivi un riassunto di 1 frase per invogliare.
            
            RISPONDI SOLO JSON: { "rating": 85, "visitors": 5000, "summary": "..." }
        `;
        
        // USARE IL GETTER LAZY
        const aiClient = getAiClient();
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(cleanJsonOutput(response.text || "{}"));
    });
};