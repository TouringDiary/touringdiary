import {
  buildPlannerItineraryPrompt,
  buildPlannerModifyPrompt,
  buildPlannerRoadbookPrompt,
} from '../../data/ai/prompts';
import { type Schema, Type } from '../../types/ai';
import type { ItineraryItem, RoadbookDay } from '../../types/models/Itinerary';
import { getAiPrompt } from '../aiConfigService';
import { AI_TIMEOUT_REPLAY_WARNING } from './aiEdgeErrors';
import { generateStructuredResponse } from './aiUtils';
import type { AiItineraryItem, DailyLogistics } from './types';

export type { AiItineraryItem, DailyLogistics } from './types';

/** Minimal POI ref consumed by planner prompts (id/name/category + optional geo/rating). */
export interface PlannerPoiRef {
  id: string;
  name: string;
  category: string;
  rating?: number;
  subCategory?: string;
  lat?: number;
  lng?: number;
}

/** Session config for itinerary generation. */
export interface PlannerSessionConfig {
  dailyLogistics: DailyLogistics[];
  startLocation?: string;
  endLocation?: string;
  style?: string;
  /** Extra session fields may be passed by callers; unused in this module. */
  [key: string]: unknown;
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
      visitDuration: { type: Type.STRING },
    },
    required: ['dayIndex', 'time', 'activityName', 'category', 'matchedPoiId', 'visitDuration'],
  },
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
            foodCost: { type: Type.STRING },
          },
          required: [
            'from',
            'to',
            'transportMode',
            'duration',
            'instructions',
            'transportCost',
            'ticketCost',
            'foodCost',
          ],
        },
      },
    },
    required: ['dayIndex', 'segments'],
  },
};

export const generateItineraryPlan = async (
  daysCount: number,
  preferences: string,
  destination: string,
  availablePois: PlannerPoiRef[],
  config: PlannerSessionConfig,
  signal?: AbortSignal,
): Promise<AiItineraryItem[]> => {
  const generationTask = async () => {
    const topPois = [...availablePois]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 80);
    const dbSourceList = topPois
      .map(
        (p) =>
          `ID: "${p.id}" | NOME: "${p.name}" | CAT: "${p.category}" | SUB: "${p.subCategory || ''}"`,
      )
      .join('\n');

    let dailyInstructions = '';
    const dailyLogs = config.dailyLogistics || [];
    const forcedStart = config.startLocation || 'Hotel Centrale';
    const forcedEnd = config.endLocation || forcedStart;

    for (let i = 0; i < daysCount; i++) {
      const dayLog: Partial<DailyLogistics> = dailyLogs.find((l) => l.dayIndex === i) || {};
      const dayStart = dayLog.start && dayLog.start.trim() !== '' ? dayLog.start : forcedStart;
      const dayEnd = dayLog.end && dayLog.end.trim() !== '' ? dayLog.end : forcedEnd;
      dailyInstructions += `\nGIORNO ${i} (Index ${i}):\n- Punto Partenza (Hotel/Base): "${dayStart}"\n- Punto Rientro (Hotel/Base): "${dayEnd}"\n- Orari Attivi: ${dayLog.startTime || '09:00'} - ${dayLog.endTime || '20:00'}.\n`;
    }

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const style = typeof config.style === 'string' ? config.style : '';

    const stylePrompt = await getAiPrompt(
      'planner_itinerary',
      { destination, style },
      `Sei un Travel Planner esperto per ${destination}. Stile richiesto: ${style}.`,
    );

    const fullPrompt = `${stylePrompt}\n\n${buildPlannerItineraryPrompt(destination, style, daysCount, preferences, dailyInstructions, dbSourceList)}`;

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const result = await generateStructuredResponse<AiItineraryItem[]>(
      'gemini-2.0-pro',
      fullPrompt,
      ITINERARY_SCHEMA,
      'planner',
    );

    if (!Array.isArray(result)) {
      throw new Error("L'AI non ha restituito un itinerario valido.");
    }
    if (result.length === 0) {
      throw new Error("L'AI non ha generato nessuna tappa valida.");
    }
    return result;
  };

  return new Promise<AiItineraryItem[]>((resolve, reject) => {
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    if (signal) signal.addEventListener('abort', abortHandler);

    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Timeout: l'elaborazione sta impiegando più del previsto. ${AI_TIMEOUT_REPLAY_WARNING}`,
        ),
      );
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

export const generateRoadbook = async (
  itineraryItems: ItineraryItem[],
  cityName: string,
  forcedModel?: 'flash' | 'pro',
): Promise<RoadbookDay[]> => {
  if (!itineraryItems || itineraryItems.length === 0) return [];

  // 1. Calcolo giorni per routing automatico
  const dayIndices = itineraryItems.map((item) => item.dayIndex);
  const uniqueDays = [...new Set(dayIndices)];
  const daysCount = uniqueDays.length;

  // 2. Selezione Modello: 1-2gg -> Flash, 3+ gg -> Pro (se non forzato)
  let selectedModel = forcedModel || (daysCount <= 2 ? 'gemini-2.0-flash' : 'gemini-2.0-pro');
  if (selectedModel === 'flash') selectedModel = 'gemini-2.0-flash';
  if (selectedModel === 'pro') selectedModel = 'gemini-2.0-pro';

  const simplifiedSchedule = itineraryItems.map((item) => ({
    d: item.dayIndex,
    t: item.timeSlotStr,
    p: item.poi.name,
    a: item.poi.address,
    c: item.poi.coords ? { lat: item.poi.coords.lat, lng: item.poi.coords.lng } : undefined,
  }));

  const dbPrompt = await getAiPrompt('planner_roadbook', { cityName }, '');
  const fullPrompt = `${dbPrompt}\n\n${buildPlannerRoadbookPrompt(cityName, JSON.stringify(simplifiedSchedule))}`;

  const data = await generateStructuredResponse<RoadbookDay[]>(
    selectedModel,
    fullPrompt,
    ROADBOOK_SCHEMA,
    'roadbook',
  );

  return data.map((day: RoadbookDay) => ({
    ...day,
    segments: Array.isArray(day.segments) ? day.segments : [],
  }));
};

export const modifyItinerary = async (
  currentPlan: AiItineraryItem[],
  userRequest: string,
  destination: string,
  availablePois: PlannerPoiRef[],
): Promise<{ updatedPlan: AiItineraryItem[]; chatReply: string }> => {
  const planSummary = currentPlan.map((i) => ({
    d: i.dayIndex,
    t: i.time,
    n: i.activityName,
    id: i.matchedPoiId,
  }));
  const topRated = [...availablePois]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 40);
  const mixedSource = [...topRated];

  const dbAlternatives = mixedSource
    .map((p) => `ID:${p.id}|${p.name}|CAT:${p.category}`)
    .join('\n');

  const prompt = buildPlannerModifyPrompt(
    destination,
    JSON.stringify(planSummary),
    userRequest,
    dbAlternatives,
  );

  return generateStructuredResponse<{ updatedPlan: AiItineraryItem[]; chatReply: string }>(
    'gemini-2.0-pro',
    prompt,
    undefined,
    'modify',
  ).then((result) => ({
    updatedPlan: result.updatedPlan || currentPlan,
    chatReply: result.chatReply || 'Modifica effettuata.',
  }));
};
