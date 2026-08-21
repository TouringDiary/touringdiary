import { aiGateway } from '@/services/ai/aiGateway';
import {
  buildCityAuditPrompt,
  buildRegeneratePoiPrompt,
  buildSuggestNewPoisPrompt,
  buildVerifyPoisPrompt,
} from '../../../data/ai/prompts';
import { type Schema, Type } from '../../../types/ai';
import type { AuditPoiResult, PoiCategory, PointOfInterest } from '../../../types/index';
import { calculateDistance } from '../../geo';
import { cleanJsonOutput, withRetry } from '../aiUtils';
import { generateAllowedCategoriesPromptString, getCorrectCategory } from '../utils/taxonomyUtils';

export interface EnrichedPoiData {
  description: string;
  /** Categoria normalizzata tramite getCorrectCategory — sempre un valore valido del dominio */
  category: PoiCategory;
  /** Sottocategoria dall'AI — può non essere ancora in POI_SUBCATEGORY_VALUES, normalizzare prima dell'uso */
  rawSubCategory: string;
  visitDuration: string;
  priceLevel: 1 | 2 | 3 | 4;
  address?: string;
  status?: 'published' | 'needs_check';
  tourismInterest: 'high' | 'medium' | 'low';
}

/** Draft POI da Flash / Magic / Targeted. */
export interface SuggestedPoiDraft {
  name: string;
  category?: string;
  subCategory?: string;
  description?: string;
  address?: string;
  tourismInterest?: 'high' | 'medium' | 'low';
}

/** Input minimo per audit (POI già in DB). */
export type CityAuditPoiRef = Pick<PointOfInterest, 'id' | 'name' | 'coords'>;

/** Candidato inviato a verifyPoisBatch. */
export interface PoiVerifyCandidate {
  id: string;
  name: string;
  category?: string;
  subCategory?: string;
  address?: string;
}

/** Campi opzionali condivisi del payload verify (validati solo se presenti). */
interface VerifiedPoiFields {
  address?: string;
  coords?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  category?: string;
  subCategory?: string;
  description?: string;
  visitDuration?: string;
  priceLevel?: 1 | 2 | 3 | 4;
  openingHours?: string;
  openingDays?: string[];
  isEstimated?: boolean;
  /**
   * Status AI freeform + valore locale `invalid` (geo out-of-range).
   * Consumer reali controllano `invalid` / `duplicate` (string equality).
   */
  status?: string;
  aiReliability?: string;
  tourismInterest?: 'high' | 'medium' | 'low';
  reason?: string;
}

/** Risultato associabile al candidato originale via `id` (`useAiValidation`). */
export type VerifiedPoiById = VerifiedPoiFields & { id: string; name?: string };

/** Risultato identificabile via `name` (`RegionalAnalysisModal` / `SuggestedPoiDraft`). */
export type VerifiedPoiByName = VerifiedPoiFields & { name: string; id?: string };

export type VerifiedPoiResult = VerifiedPoiById | VerifiedPoiByName;

type AuditAiItem = {
  name?: string;
  lat?: number;
  lng?: number;
} & Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON array → solo elementi object (payload AI). */
const asRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
};

/** Campi minimi usati da auditCityPois (name/lat/lng opzionali). */
const isAuditAiItem = (value: unknown): value is AuditAiItem => {
  if (!isRecord(value)) return false;
  if (value.name !== undefined && typeof value.name !== 'string') return false;
  if (value.lat !== undefined && typeof value.lat !== 'number') return false;
  if (value.lng !== undefined && typeof value.lng !== 'number') return false;
  return true;
};

/** Draft suggest: name obbligatorio (unico campo usato a valle). */
const isSuggestedPoiDraft = (value: unknown): value is SuggestedPoiDraft =>
  isRecord(value) && typeof value.name === 'string';

/** Campi opzionali: validati solo se presenti (niente claim oltre il controllato). */
const hasVerifiedPoiOptionalFields = (value: Record<string, unknown>): boolean => {
  if (value.address !== undefined && typeof value.address !== 'string') return false;
  if (value.category !== undefined && typeof value.category !== 'string') return false;
  if (value.subCategory !== undefined && typeof value.subCategory !== 'string') return false;
  if (value.description !== undefined && typeof value.description !== 'string') return false;
  if (value.visitDuration !== undefined && typeof value.visitDuration !== 'string') return false;
  if (value.openingHours !== undefined && typeof value.openingHours !== 'string') return false;
  if (value.status !== undefined && typeof value.status !== 'string') return false;
  if (value.aiReliability !== undefined && typeof value.aiReliability !== 'string') return false;
  if (value.reason !== undefined && typeof value.reason !== 'string') return false;
  if (value.isEstimated !== undefined && typeof value.isEstimated !== 'boolean') return false;
  if (value.lat !== undefined && typeof value.lat !== 'number') return false;
  if (value.lng !== undefined && typeof value.lng !== 'number') return false;
  if (value.id !== undefined && typeof value.id !== 'string') return false;
  if (value.name !== undefined && typeof value.name !== 'string') return false;

  if (value.priceLevel !== undefined) {
    const p = value.priceLevel;
    if (p !== 1 && p !== 2 && p !== 3 && p !== 4) return false;
  }
  if (value.tourismInterest !== undefined) {
    const t = value.tourismInterest;
    if (t !== 'high' && t !== 'medium' && t !== 'low') return false;
  }
  if (value.openingDays !== undefined) {
    if (
      !Array.isArray(value.openingDays) ||
      !value.openingDays.every((d) => typeof d === 'string')
    ) {
      return false;
    }
  }
  if (value.coords !== undefined) {
    if (!isRecord(value.coords)) return false;
    if (typeof value.coords.lat !== 'number' || typeof value.coords.lng !== 'number') return false;
  }
  return true;
};

const isVerifiedPoiById = (value: unknown): value is VerifiedPoiById =>
  isRecord(value) && typeof value.id === 'string' && hasVerifiedPoiOptionalFields(value);

const isVerifiedPoiByName = (value: unknown): value is VerifiedPoiByName =>
  isRecord(value) && typeof value.name === 'string' && hasVerifiedPoiOptionalFields(value);

const isPoiVerifyCandidate = (
  value: PoiVerifyCandidate | SuggestedPoiDraft,
): value is PoiVerifyCandidate => 'id' in value && typeof value.id === 'string';

/** Payload enrich: campi obbligatori del contratto EnrichedPoiData (prima di getCorrectCategory).
 * `status` e `address` restano opzionali come sul tipo (path useSearch senza schema può omettere status).
 */
const isEnrichedPoiPayload = (
  value: unknown,
): value is {
  description: string;
  category: string;
  rawSubCategory: string;
  visitDuration: string;
  priceLevel: 1 | 2 | 3 | 4;
  tourismInterest: 'high' | 'medium' | 'low';
  status?: 'published' | 'needs_check';
  address?: string;
} => {
  if (!isRecord(value)) return false;
  if (typeof value.description !== 'string') return false;
  if (typeof value.category !== 'string') return false;
  if (typeof value.rawSubCategory !== 'string') return false;
  if (typeof value.visitDuration !== 'string') return false;
  const priceLevel = value.priceLevel;
  if (priceLevel !== 1 && priceLevel !== 2 && priceLevel !== 3 && priceLevel !== 4) return false;
  if (
    value.tourismInterest !== 'high' &&
    value.tourismInterest !== 'medium' &&
    value.tourismInterest !== 'low'
  ) {
    return false;
  }
  if (
    value.status !== undefined &&
    value.status !== 'published' &&
    value.status !== 'needs_check'
  ) {
    return false;
  }
  if (value.address !== undefined && typeof value.address !== 'string') return false;
  return true;
};

/**
 * Payload regenerate: Partial<EnrichedPoiData> + chiavi AI extra.
 * Ogni campo EnrichedPoiData presente deve rispettare il tipo; le chiavi extra restano ammesse.
 */
const isRegeneratedPoiPayload = (
  value: unknown,
): value is Partial<EnrichedPoiData> & Record<string, unknown> => {
  if (!isRecord(value)) return false;
  if (value.description !== undefined && typeof value.description !== 'string') return false;
  if (value.category !== undefined && typeof value.category !== 'string') return false;
  if (value.rawSubCategory !== undefined && typeof value.rawSubCategory !== 'string') return false;
  if (value.visitDuration !== undefined && typeof value.visitDuration !== 'string') return false;
  if (value.address !== undefined && typeof value.address !== 'string') return false;
  if (value.priceLevel !== undefined) {
    const p = value.priceLevel;
    if (p !== 1 && p !== 2 && p !== 3 && p !== 4) return false;
  }
  if (value.tourismInterest !== undefined) {
    const t = value.tourismInterest;
    if (t !== 'high' && t !== 'medium' && t !== 'low') return false;
  }
  if (
    value.status !== undefined &&
    value.status !== 'published' &&
    value.status !== 'needs_check'
  ) {
    return false;
  }
  return true;
};

const toAuditAiItems = (value: unknown): AuditAiItem[] =>
  asRecordArray(value).filter(isAuditAiItem);

const toVerifiedPoiById = (value: unknown): VerifiedPoiById[] => {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : isRecord(value) ? [value] : [];
  const out: VerifiedPoiById[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    // Il prompt di verify può eco-id numerico; il candidato dominio è string.
    const rawId = item.id;
    const withStringId =
      typeof rawId === 'number' && Number.isFinite(rawId) ? { ...item, id: String(rawId) } : item;
    if (isVerifiedPoiById(withStringId)) out.push(withStringId);
  }
  return out;
};

const toVerifiedPoiByName = (value: unknown): VerifiedPoiByName[] => {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : isRecord(value) ? [value] : [];
  const out: VerifiedPoiByName[] = [];
  for (const item of items) {
    if (isVerifiedPoiByName(item)) out.push(item);
  }
  return out;
};

const ENRICHMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: 'Descrizione turistica accattivante (max 250 caratteri)',
    },
    category: {
      type: Type.STRING,
      enum: ['monument', 'food', 'hotel', 'nature', 'leisure', 'shop', 'discovery'],
    },
    rawSubCategory: {
      type: Type.STRING,
      description: 'Sottocategoria specifica in inglese o italiano',
    },
    visitDuration: { type: Type.STRING, description: "Durata stimata (es. '1h')" },
    priceLevel: { type: Type.INTEGER, description: 'Livello prezzo da 1 a 4' },
    address: { type: Type.STRING, description: 'Indirizzo formattato' },
    status: { type: Type.STRING, enum: ['published', 'needs_check'] },
    tourismInterest: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
  },
  required: [
    'description',
    'category',
    'rawSubCategory',
    'visitDuration',
    'priceLevel',
    'status',
    'tourismInterest',
  ],
};

export const performCityAudit = async (
  cityName: string,
  existingPois: CityAuditPoiRef[],
): Promise<AuditPoiResult[]> => {
  return withRetry(async () => {
    const prompt = buildCityAuditPrompt(cityName);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] },
    });

    const text = response.text?.trim() || '[]';
    let aiResults: AuditAiItem[] = [];
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(text));
      aiResults = toAuditAiItems(parsed);
    } catch {
      return [];
    }

    return aiResults.map((item) => {
      let matchStatus: 'missing' | 'exact_match' | 'geo_match' | 'name_match' = 'missing';
      let matchedDbId: string | undefined;
      let matchedDistance: number | undefined;

      const itemName = typeof item.name === 'string' ? item.name : '';
      const nameMatch = existingPois.find(
        (p) => p.name.toLowerCase().trim() === itemName.toLowerCase().trim(),
      );
      if (nameMatch) {
        matchStatus = 'exact_match';
        matchedDbId = nameMatch.id;
      } else if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        const itemLat = item.lat;
        const itemLng = item.lng;
        const geoMatch = existingPois.find((p) => {
          if (!p.coords || p.coords.lat === 0) return false;
          const dist = calculateDistance(itemLat, itemLng, p.coords.lat, p.coords.lng);
          return dist < 0.1;
        });
        if (geoMatch?.coords) {
          matchStatus = 'geo_match';
          matchedDbId = geoMatch.id;
          matchedDistance =
            calculateDistance(itemLat, itemLng, geoMatch.coords.lat, geoMatch.coords.lng) * 1000;
        }
      }

      return {
        ...item,
        name: itemName,
        matchStatus,
        matchedDbId,
        matchedDistance,
      } as AuditPoiResult;
    });
  });
};

export const suggestNewPois = async (
  cityName: string,
  existingNames: string[] = [],
  instruction: string = '',
  count: number = 5,
  categoryFilter: string = 'monument',
): Promise<SuggestedPoiDraft[]> => {
  return withRetry(async () => {
    const exclusionStr = existingNames.length > 0 ? `ESCLUDI: ${existingNames.join(', ')}` : '';
    const retryInstruction = 'Se non trovi nulla di nuovo, cerca luoghi più di nicchia.';

    const allowedCategories = generateAllowedCategoriesPromptString();

    const prompt = buildSuggestNewPoisPrompt(
      cityName,
      count,
      categoryFilter,
      instruction,
      retryInstruction,
      exclusionStr,
      allowedCategories,
    );

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim() || '[]';
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(text));
      const drafts: SuggestedPoiDraft[] = [];
      for (const item of asRecordArray(parsed)) {
        if (isSuggestedPoiDraft(item)) drafts.push(item);
      }
      return drafts;
    } catch {
      return [];
    }
  });
};

function applyGeoInvalidation<T extends VerifiedPoiFields>(
  results: T[],
  cityCenterCoords: { lat: number; lng: number },
): T[] {
  return results.map((r) => {
    if (cityCenterCoords.lat !== 0 && typeof r.lat === 'number' && typeof r.lng === 'number') {
      const dist = calculateDistance(cityCenterCoords.lat, cityCenterCoords.lng, r.lat, r.lng);
      if (dist > 30) {
        return { ...r, status: 'invalid', reason: 'Fuori zona (>30km dal centro)' };
      }
    }
    return r;
  });
}

/**
 * verifyPoisBatch — due contratti reali:
 * - candidati con `id` (`PoiVerifyCandidate`) → risultati con `id` obbligatorio (match draft);
 * - candidati solo `name` (`SuggestedPoiDraft`) → risultati con `name` obbligatorio.
 */
export async function verifyPoisBatch(
  candidates: PoiVerifyCandidate[],
  cityName: string,
  cityCenterCoords: { lat: number; lng: number },
): Promise<VerifiedPoiById[]>;
export async function verifyPoisBatch(
  candidates: SuggestedPoiDraft[],
  cityName: string,
  cityCenterCoords: { lat: number; lng: number },
): Promise<VerifiedPoiByName[]>;
export async function verifyPoisBatch(
  candidates: Array<PoiVerifyCandidate | SuggestedPoiDraft>,
  cityName: string,
  cityCenterCoords: { lat: number; lng: number },
): Promise<VerifiedPoiResult[]> {
  if (candidates.length === 0) return [];

  const requireId = candidates.every(isPoiVerifyCandidate);

  return withRetry(async () => {
    const prompt = buildVerifyPoisPrompt(cityName, candidates);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] },
    });

    const text = response.text?.trim() || '[]';
    try {
      const results: unknown = JSON.parse(cleanJsonOutput(text));
      if (requireId) {
        return applyGeoInvalidation(toVerifiedPoiById(results), cityCenterCoords);
      }
      return applyGeoInvalidation(toVerifiedPoiByName(results), cityCenterCoords);
    } catch {
      return [];
    }
  });
}

export const regeneratePoiData = async (
  poiName: string,
  cityName: string,
): Promise<Partial<EnrichedPoiData> & Record<string, unknown>> => {
  return withRetry(async () => {
    const prompt = buildRegeneratePoiPrompt(poiName, cityName);

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-pro',
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] },
    });

    const text = response.text?.trim() || '{}';
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(text));
      if (!isRegeneratedPoiPayload(parsed)) return {};
      return parsed;
    } catch {
      return {};
    }
  });
};

export const generatePoiCoords = async (
  poiName: string,
  cityName: string,
): Promise<{ lat: number; lng: number } | null> => {
  return withRetry(async () => {
    const prompt = `Trova le coordinate GPS precise (lat, lng) per: "${poiName}" a "${cityName}". JSON: {lat:0, lng:0}`;

    const response = await aiGateway.generateLegacy({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] },
    });

    const text = response.text?.trim() || '{}';
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(text));
      if (!isRecord(parsed)) return null;
      const lat = parsed.lat;
      const lng = parsed.lng;
      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        return { lat, lng };
      }
      return null;
    } catch {
      return null;
    }
  });
};

export const enrichStagingPoi = async (
  poiName: string,
  cityName: string,
  rawCategory: string | null,
  useSearch: boolean = false,
): Promise<EnrichedPoiData> => {
  return withRetry(async () => {
    const model = useSearch ? 'gemini-2.0-pro' : 'gemini-2.0-flash';
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

    const response = await aiGateway.generateLegacy({
      model: model,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: schemaConfig, tools: tools },
    });

    const text = response.text?.trim() || '{}';
    let json: EnrichedPoiData;
    try {
      const parsed: unknown = JSON.parse(cleanJsonOutput(text));
      if (!isEnrichedPoiPayload(parsed)) throw new Error('enrichment payload is invalid');
      json = {
        description: parsed.description,
        category: getCorrectCategory(parsed.rawSubCategory || '', parsed.category, poiName),
        rawSubCategory: parsed.rawSubCategory,
        visitDuration: parsed.visitDuration,
        priceLevel: parsed.priceLevel,
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        tourismInterest: parsed.tourismInterest,
        ...(parsed.address !== undefined ? { address: parsed.address } : {}),
      };
    } catch {
      console.warn(`[AI Enrichment] Fallito il parsing JSON per "${poiName}". Testo grezzo:`, text);
      json = {
        description: `Luogo di interesse a ${cityName}. (Generazione AI fallita, richiede revisione)`,
        category: 'discovery',
        rawSubCategory: rawCategory || 'generic',
        visitDuration: '1h',
        priceLevel: 1,
        status: 'needs_check',
        address: '',
        tourismInterest: 'medium',
      };
      json.category = getCorrectCategory(json.rawSubCategory || '', json.category, poiName);
    }

    const normalizedSubCategory = json.rawSubCategory?.toLowerCase().trim().replace(/\s+/g, '_');

    return {
      ...json,
      rawSubCategory: normalizedSubCategory || 'generic',
    };
  });
};
