import { getAiClient } from '../aiClient';
import { withRetry, cleanJsonOutput } from '../aiUtils';
import { calculateDistance } from '../../geo';
import { getCorrectCategory, generateAllowedCategoriesPromptString } from '../utils/taxonomyUtils'; // NEW IMPORT
import { 
    buildSuggestNewPoisPrompt, 
    buildVerifyPoisPrompt, 
    buildRegeneratePoiPrompt,
    buildCityAuditPrompt
} from '../../../data/ai/prompts';
import { AuditPoiResult } from '../../../types/index';
import { Type, Schema } from '../../../types/ai';

export interface EnrichedPoiData {
    description: string;
    category: string;
    subCategory: string;
    visitDuration: string;
    priceLevel: number;
    address?: string; 
    status?: 'published' | 'needs_check'; 
    tourismInterest: 'high' | 'medium' | 'low'; 
}

const ENRICHMENT_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "Descrizione turistica accattivante (max 250 caratteri)" },
        category: { type: Type.STRING, enum: ['monument', 'food', 'hotel', 'nature', 'leisure', 'shop', 'discovery'] },
        subCategory: { type: Type.STRING, description: "Sottocategoria specifica in inglese o italiano" },
        visitDuration: { type: Type.STRING, description: "Durata stimata (es. '1h')" },
        priceLevel: { type: Type.INTEGER, description: "Livello prezzo da 1 a 4" },
        address: { type: Type.STRING, description: "Indirizzo formattato" },
        status: { type: Type.STRING, enum: ['published', 'needs_check'] },
        tourismInterest: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
    },
    required: ["description", "category", "subCategory", "visitDuration", "priceLevel", "status", "tourismInterest"]
};

export const performCityAudit = async (cityName: string, existingPois: any[]): Promise<AuditPoiResult[]> => {
    return withRetry(async () => {
        const prompt = buildCityAuditPrompt(cityName);
        const aiClient = getAiClient();

        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        const text = response.text?.trim() || "[]";
        let aiResults: any[] = [];
        try { aiResults = JSON.parse(cleanJsonOutput(text)); } catch (e) { return []; }
        if (!Array.isArray(aiResults)) return [];

        return aiResults.map((item: any) => {
            let matchStatus: 'missing' | 'exact_match' | 'geo_match' | 'name_match' = 'missing';
            let matchedDbId: string | undefined;
            let matchedDistance: number | undefined;

            const nameMatch = existingPois.find(p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
            if (nameMatch) {
                matchStatus = 'exact_match';
                matchedDbId = nameMatch.id;
            } else {
                if (item.lat && item.lng) {
                     const geoMatch = existingPois.find(p => {
                         if (!p.coords || p.coords.lat === 0) return false;
                         const dist = calculateDistance(item.lat, item.lng, p.coords.lat, p.coords.lng);
                         return dist < 0.1; 
                     });
                     if (geoMatch) {
                         matchStatus = 'geo_match';
                         matchedDbId = geoMatch.id;
                         matchedDistance = calculateDistance(item.lat, item.lng, geoMatch.coords.lat, geoMatch.coords.lng) * 1000;
                     }
                }
            }

            return { ...item, matchStatus, matchedDbId, matchedDistance };
        });
    });
};

export const suggestNewPois = async (
    cityName: string, 
    existingNames: string[] = [], 
    instruction: string = '', 
    count: number = 5,
    categoryFilter: string = 'monument'
): Promise<any[]> => {
    return withRetry(async () => {
        const exclusionStr = existingNames.length > 0 ? `ESCLUDI: ${existingNames.join(', ')}` : '';
        const retryInstruction = "Se non trovi nulla di nuovo, cerca luoghi più di nicchia.";
        
        // Genera la lista dinamica delle categorie dal DB
        const allowedCategories = generateAllowedCategoriesPromptString();
        
        const prompt = buildSuggestNewPoisPrompt(cityName, count, categoryFilter, instruction, retryInstruction, exclusionStr, allowedCategories);
        const aiClient = getAiClient();

        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim() || "[]";
        try {
            const parsed = JSON.parse(cleanJsonOutput(text));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });
};

export const verifyPoisBatch = async (
    candidates: any[], 
    cityName: string,
    cityCenterCoords: { lat: number, lng: number }
): Promise<any[]> => {
    if (candidates.length === 0) return [];
    
    return withRetry(async () => {
        const prompt = buildVerifyPoisPrompt(cityName, candidates);
        const aiClient = getAiClient();

        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        const text = response.text?.trim() || "[]";
        try {
            const results = JSON.parse(cleanJsonOutput(text));
            if (!results) return [];
            const safeResults = Array.isArray(results) ? results : [results];

            return safeResults.map((r: any) => {
                if (cityCenterCoords.lat !== 0 && r.lat && r.lng) {
                     const dist = calculateDistance(cityCenterCoords.lat, cityCenterCoords.lng, r.lat, r.lng);
                     if (dist > 30) {
                         return { ...r, status: 'invalid', reason: 'Fuori zona (>30km dal centro)' };
                     }
                }
                return r;
            });
        } catch (e) { return []; }
    });
};

export const regeneratePoiData = async (poiName: string, cityName: string): Promise<any> => {
    return withRetry(async () => {
        const prompt = buildRegeneratePoiPrompt(poiName, cityName);
        const aiClient = getAiClient();
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        const text = response.text?.trim() || "{}";
        try { return JSON.parse(cleanJsonOutput(text)); } catch (e) { return {}; }
    });
};

export const generatePoiCoords = async (poiName: string, cityName: string): Promise<{ lat: number, lng: number } | null> => {
    return withRetry(async () => {
        const prompt = `Trova le coordinate GPS precise (lat, lng) per: "${poiName}" a "${cityName}". JSON: {lat:0, lng:0}`;
        const aiClient = getAiClient();

        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        const text = response.text?.trim() || "{}";
        try {
            const json = JSON.parse(cleanJsonOutput(text));
            if (json.lat && json.lng) return { lat: json.lat, lng: json.lng };
            return null;
        } catch { return null; }
    });
};

export const enrichStagingPoi = async (poiName: string, cityName: string, rawCategory: string | null, useSearch: boolean = false): Promise<EnrichedPoiData> => {
    return withRetry(async () => {
        const model = useSearch ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
        const tools = useSearch ? [{ googleSearch: {} }] : undefined; 
        const schemaConfig = useSearch ? undefined : ENRICHMENT_SCHEMA;

        const prompt = `
        Sei un Editor di Guide Turistiche esperto per la città di "${cityName}".
        Il tuo compito è scrivere una scheda turistica accattivante, dettagliata e veritiera per il seguente luogo di interesse:
        Nome: "${poiName}"
        Categoria Originale: ${rawCategory || 'N/D'}
        
        ${useSearch ? 'USA GOOGLE SEARCH per trovare informazioni aggiornate e precise.' : 'Usa la tua conoscenza per creare una descrizione di alta qualità.'}
        
        REGOLE FONDAMENTALI:
        1. La descrizione deve essere utile per un turista, evidenziando cosa rende speciale questo luogo (max 250 caratteri).
        2. Restituisci ESCLUSIVAMENTE un oggetto JSON valido.
        3. NON includere blocchi markdown (\`\`\`json), NON includere testo introduttivo o conclusivo. Solo il JSON puro.
        `;

        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: schemaConfig, tools: tools }
        });

        const text = response.text?.trim() || "{}";
        let json: EnrichedPoiData;
        try {
            json = JSON.parse(cleanJsonOutput(text));
        } catch (e) {
            console.warn(`[AI Enrichment] Fallito il parsing JSON per "${poiName}". Testo grezzo:`, text);
            json = {
                description: `Luogo di interesse a ${cityName}. (Generazione AI fallita, richiede revisione)`,
                category: 'discovery',
                subCategory: rawCategory || 'generic',
                visitDuration: '1h',
                priceLevel: 1,
                status: 'needs_check',
                address: '',
                tourismInterest: 'medium'
            };
        }

        json.category = getCorrectCategory(json.subCategory || '', json.category, poiName);
        return json;
    });
};