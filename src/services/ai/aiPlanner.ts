
import { generateStructuredResponse } from './aiUtils';
import { RoadbookDay } from '../../types/models/Itinerary'; 
import { getAiPrompt } from '../aiConfigService';
import { Type, Schema } from '../../types/ai';
import { buildPlannerItineraryPrompt, buildPlannerRoadbookPrompt, buildPlannerModifyPrompt } from '../../data/ai/prompts';

export interface DailyLogistics {
    dayIndex: number;
    start: string;
    end: string;
    startTime: string;
    endTime: string;
}

export interface AiItineraryItem {
    dayIndex: number;
    time: string;
    activityName: string;
    category: string;
    description: string;
    lat: number;
    lng: number;
    matchedPoiId?: string;
    address?: string;
    visitDuration?: string;
}

const ITINERARY_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            dayIndex: { type: Type.INTEGER },
            time: { type: Type.STRING },
            activityName: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            matchedPoiId: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            visitDuration: { type: Type.STRING }
        },
        required: ["dayIndex", "time", "activityName", "category", "matchedPoiId", "visitDuration"]
    }
};

const ROADBOOK_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            dayIndex: { type: Type.INTEGER },
            segments: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        from: { type: Type.STRING },
                        to: { type: Type.STRING },
                        transportMode: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        instructions: { type: Type.STRING },
                        tips: { type: Type.STRING },
                        transportCost: { type: Type.STRING },
                        ticketCost: { type: Type.STRING },
                        foodCost: { type: Type.STRING }
                    },
                    required: ['from', 'to', 'transportMode', 'duration', 'instructions', 'transportCost', 'ticketCost', 'foodCost']
                }
            }
        },
        required: ['dayIndex', 'segments']
    }
};

export const generateItineraryPlan = async (
    daysCount: number, 
    preferences: string, 
    destination: string, 
    availablePois: any[], 
    config: any,
    signal?: AbortSignal
): Promise<AiItineraryItem[]> => {
    
    const generationTask = async () => {
        const topPois = availablePois.sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 80);
        const dbSourceList = topPois.map((p:any) => 
            `ID: "${p.id}" | NOME: "${p.name}" | CAT: "${p.category}" | SUB: "${p.subCategory || ''}"`
        ).join('\n');
        
        let dailyInstructions = "";
        const dailyLogs = config.dailyLogistics || [];
        const forcedStart = config.startLocation || 'Hotel Centrale';
        const forcedEnd = config.endLocation || forcedStart;

        for (let i = 0; i < daysCount; i++) {
            const dayLog = dailyLogs.find((l: any) => l.dayIndex === i) || {};
            const dayStart = (dayLog.start && dayLog.start.trim() !== '') ? dayLog.start : forcedStart;
            const dayEnd = (dayLog.end && dayLog.end.trim() !== '') ? dayLog.end : forcedEnd;
            dailyInstructions += `\nGIORNO ${i} (Index ${i}):\n- Punto Partenza (Hotel/Base): "${dayStart}"\n- Punto Rientro (Hotel/Base): "${dayEnd}"\n- Orari Attivi: ${dayLog.startTime || '09:00'} - ${dayLog.endTime || '20:00'}.\n`;
        }

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        let stylePrompt = await getAiPrompt(
            'planner_itinerary',
            { destination, style: config.style },
            `Sei un Travel Planner esperto per ${destination}. Stile richiesto: ${config.style}.`
        );

        const fullPrompt = `${stylePrompt}\n\n${buildPlannerItineraryPrompt(destination, config.style, daysCount, preferences, dailyInstructions, dbSourceList)}`;

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        return generateStructuredResponse<AiItineraryItem[]>(
            'gemini-3.1-pro-preview',
            fullPrompt,
            ITINERARY_SCHEMA
        );
    };

    return new Promise<AiItineraryItem[]>((resolve, reject) => {
        const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'));
        if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        if (signal) signal.addEventListener('abort', abortHandler);

        const timeoutId = setTimeout(() => {
            reject(new Error("L'AI sta impiegando troppo tempo (Timeout 180s). Riduci i giorni o riprova."));
        }, 180000);

        generationTask()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                clearTimeout(timeoutId);
                if (signal) signal.removeEventListener('abort', abortHandler);
            });
    });
};

export const generateRoadbook = async (itineraryItems: any[], cityName: string): Promise<RoadbookDay[]> => {
    if (!itineraryItems || itineraryItems.length === 0) return [];

    const simplifiedSchedule = itineraryItems.map((item: any) => ({
        d: item.dayIndex,
        t: item.timeSlotStr,
        p: item.poi.name,
        a: item.poi.address,
        c: { lat: item.poi.coords.lat, lng: item.poi.coords.lng }
    }));
    
    const dbPrompt = await getAiPrompt('planner_roadbook', { cityName }, '');
    const fullPrompt = `${dbPrompt}\n\n${buildPlannerRoadbookPrompt(cityName, JSON.stringify(simplifiedSchedule))}`;

    const data = await generateStructuredResponse<RoadbookDay[]>(
        'gemini-3.1-pro-preview',
        fullPrompt,
        ROADBOOK_SCHEMA
    );

    return data.map((day: any) => ({
        ...day,
        segments: Array.isArray(day.segments) ? day.segments : []
    }));
};

export const modifyItinerary = async (currentPlan: AiItineraryItem[], userRequest: string, destination: string, availablePois: any[]): Promise<{ updatedPlan: AiItineraryItem[], chatReply: string }> => {
    
    const planSummary = currentPlan.map(i => ({d: i.dayIndex, t: i.time, n: i.activityName, id: i.matchedPoiId}));
    const topRated = availablePois.sort((a,b) => (b.rating||0) - (a.rating||0)).slice(0, 40);
    const mixedSource = [...topRated];

    const dbAlternatives = mixedSource.map((p:any) => 
        `ID:${p.id}|${p.name}|CAT:${p.category}`
    ).join('\n');

    const prompt = buildPlannerModifyPrompt(destination, JSON.stringify(planSummary), userRequest, dbAlternatives);

    return generateStructuredResponse<{ updatedPlan: AiItineraryItem[], chatReply: string }>(
        'gemini-3.1-pro-preview',
        prompt
    ).then(result => ({
        updatedPlan: result.updatedPlan || currentPlan,
        chatReply: result.chatReply || "Modifica effettuata."
    }));
};
