
import { getAiClient } from '../aiClient';
import { withRetry, cleanJsonOutput } from '../aiUtils';
import { 
    buildSuggestItemsPrompt, 
    buildRefineServicePrompt
} from '../../../data/ai/prompts';

// Definizione locale leggera per evitare import
const ALLOWED_SUBCATEGORIES_LIST = `
- MONUMENTI: chiesa, castello, museo, piazza, archaeology, palazzo, monumento
- CIBO: restaurant, pizzeria, trattoria, street_food, pastry, gelato, bar
- SVAGO: disco, theater, cinema, zoo, spa, stadium
- NATURA: beach_free, beach_club, park, hiking, viewpoint, lake
- SHOPPING: fashion, crafts, jewelry, souvenir
- HOTEL: hotel, bnb, resort
`;

export const suggestCityItems = async (cityName: string, type: 'guides' | 'events' | 'services' | 'tour_operators' | 'people', existingNames: string[] = [], contextQuery: string = '', count: number = 3): Promise<any[]> => {
    return withRetry(async () => {
        if (type === 'people') return [];

        const exclusionStr = existingNames.length > 0 ? `ESCLUDI: ${existingNames.join(', ')}` : '';
        const prompt = buildSuggestItemsPrompt(cityName, type, count, contextQuery, exclusionStr, ALLOWED_SUBCATEGORIES_LIST);

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

export const refineServiceData = async (cityName: string, draftData: any): Promise<any> => {
    return withRetry(async () => {
        const prompt = buildRefineServicePrompt(cityName, draftData);
        
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        const text = response.text?.trim() || "{}";
        return JSON.parse(cleanJsonOutput(text));
    });
};

export const analyzeEventInterest = async (eventName: string, cityName: string): Promise<any> => {
    return withRetry(async () => {
        const prompt = `Analizza "${eventName}" a "${cityName}". RISPONDI SOLO JSON: { "rating": 85, "visitors": 5000, "summary": "..." }`;
        
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(cleanJsonOutput(response.text || "{}"));
    });
};
