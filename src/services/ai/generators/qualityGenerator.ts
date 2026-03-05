
import { getAiClient } from '../aiClient';
import { withRetry, cleanJsonOutput } from '../aiUtils';
import { Type, Schema } from '../../../types/ai';

const RATING_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "L'ID univoco del POI fornito in input" },
            rating: { type: Type.STRING, enum: ["high", "medium", "low", "service", "discard"] },
            reason: { type: Type.STRING, description: "Brevissima motivazione" }
        },
        required: ["id", "rating"]
    }
};

export interface StagingPoiInput {
    id: string;
    name: string;
    rawCategory: string | null;
    address?: string | null;
}

export interface RatedPoiResult {
    id: string;
    rating: 'high' | 'medium' | 'low' | 'service' | 'discard';
    reason?: string;
}

export const ratePoiBatch = async (
    cityName: string,
    pois: StagingPoiInput[]
): Promise<RatedPoiResult[]> => {
    
    if (!pois || pois.length === 0) return [];

    return withRetry(async () => {
        const inputList = pois.map(p => 
            `ID: "${p.id}" | NOME: "${p.name}" | CAT: "${p.rawCategory || 'N/D'}" | ADDR: "${p.address || ''}"`
        ).join('\n');

        const prompt = `
        Sei un Curatore di Guide Turistiche esperto per ${cityName}.
        Analizza questa lista e decidi se sono rilevanti.
        
        INPUT DATA:
        ${inputList}
        
        Rispondi ESCLUSIVAMENTE con un array JSON.
        `;

        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: RATING_SCHEMA,
                temperature: 0.2 
            }
        });

        const text = response.text?.trim() || "[]";
        
        try {
            const rawResults = JSON.parse(cleanJsonOutput(text));
            if (!Array.isArray(rawResults)) return [];
            
            return rawResults.map((r: any) => ({
                id: r.id,
                rating: ['high', 'medium', 'low', 'service', 'discard'].includes(r.rating) ? r.rating : 'low',
                reason: r.reason
            }));

        } catch (e) {
            console.error("[QualityGenerator] JSON Parse Error", e);
            return [];
        }
    });
};
