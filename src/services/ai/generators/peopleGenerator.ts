
import { getAiClient } from '../aiClient';
import { withRetry, cleanJsonOutput } from '../aiUtils';
// UPDATE: Import from unified prompts file
import { buildSuggestPeoplePrompt, buildEnrichPersonPrompt } from '../../../data/ai/prompts';

export const suggestCityPeople = async (
    cityName: string, 
    existingNames: string[] = [], 
    contextQuery: string = '', 
    count: number = 3
): Promise<any[]> => {
    return withRetry(async () => {
        const prompt = buildSuggestPeoplePrompt(cityName, count, existingNames, contextQuery);

        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }] 
            }
        });
        
        const rawText = response.text || "[]";
        try {
            const parsed = JSON.parse(cleanJsonOutput(rawText));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn("Errore parsing suggestCityPeople", e);
            return [];
        }
    });
};

export const enrichPersonData = async (personName: string, cityName: string): Promise<any> => {
    return withRetry(async () => {
        const prompt = buildEnrichPersonPrompt(personName, cityName);
        
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }] 
            }
        });

        const rawText = response.text || "{}";
        try {
            return JSON.parse(cleanJsonOutput(rawText));
        } catch (e) {
            console.error("Errore parsing enrichPersonData", e);
            return {};
        }
    });
};
