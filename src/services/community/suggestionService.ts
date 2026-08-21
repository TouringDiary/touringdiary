import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';
import type { Database, Json } from '../../types/database';
import type { SuggestionRequest, SuggestionType } from '../../types/index';
import { UUID_REGEX } from '../../utils/uuid';
import { supabase } from '../supabaseClient';

type SuggestionRow = Database['public']['Tables']['suggestions']['Row'];
type SuggestionUpdate = Database['public']['Tables']['suggestions']['Update'];

/** Details invio: contratto C3 completo oppure payload parziale già usato dai caller (es. claim). */
type SuggestionDetailsInput =
  | (SuggestionRequest['details'] & {
      errorTypes?: {
        name: boolean;
        location: boolean;
        hours: boolean;
        photo: boolean;
      };
    })
  | {
      title: string;
      description: string;
      category?: SuggestionRequest['details']['category'];
      address?: string;
      errorTypes?: {
        name: boolean;
        location: boolean;
        hours: boolean;
        photo: boolean;
      };
    };

/** Input create — riuso campi SuggestionRequest senza id/status/date. */
type SuggestionCreateInput = {
  userId: string;
  userName: string;
  cityId: string;
  cityName: string;
  poiId?: string;
  type: SuggestionType;
  details: SuggestionDetailsInput;
};

/** Payload review Admin (editData) passato a update/apply. */
type SuggestionReviewPayload = SuggestionRequest['details'] & {
  adminNotes?: string;
};

type SuggestionRejectionMeta = {
  reason: string;
  adminMessage: string;
};

type SuggestionDetails = SuggestionRequest['details'];
type SuggestionCategory = SuggestionDetails['category'];

const SUGGESTION_CATEGORIES: readonly SuggestionCategory[] = [
  'monument',
  'food',
  'hotel',
  'nature',
  'leisure',
  'discovery',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSuggestionCategory = (value: unknown): value is SuggestionCategory => {
  if (typeof value !== 'string') return false;
  for (const c of SUGGESTION_CATEGORIES) {
    if (c === value) return true;
  }
  return false;
};

/**
 * Converte details_json solo se la struttura minima del contratto è presente.
 * Assenza / payload insufficiente → undefined (niente object vuoto inventato).
 */
const mapDetailsJson = (raw: Json | null): SuggestionDetails | undefined => {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.title !== 'string') return undefined;
  if (typeof raw.description !== 'string') return undefined;
  if (typeof raw.address !== 'string') return undefined;
  if (!isSuggestionCategory(raw.category)) return undefined;

  const details: SuggestionDetails = {
    title: raw.title,
    category: raw.category,
    description: raw.description,
    address: raw.address,
  };

  if (typeof raw.website === 'string') details.website = raw.website;
  if (typeof raw.openingHours === 'string') details.openingHours = raw.openingHours;

  if (isRecord(raw.coords)) {
    const lat = raw.coords.lat;
    const lng = raw.coords.lng;
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      details.coords = { lat, lng };
    }
  }

  return details;
};

const mapDbSuggestionToRequest = (s: SuggestionRow): SuggestionRequest | null => {
  const details = mapDetailsJson(s.details_json);
  if (!details) return null;
  return {
    id: s.id,
    userId: s.user_id ?? '',
    userName: s.user_name ?? '',
    cityId: s.city_id ?? '',
    cityName: s.city_name ?? '',
    poiId: s.poi_id ?? undefined,
    type: (s.type ?? 'new_place') as SuggestionType,
    status: (s.status ?? 'pending') as SuggestionRequest['status'],
    date: s.created_at ?? '',
    details,
    adminNotes: s.admin_notes ?? undefined,
  };
};

export const getPendingSuggestionCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
};

export const getAllSuggestionsAsync = async (): Promise<SuggestionRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || [])
      .map(mapDbSuggestionToRequest)
      .filter((s): s is SuggestionRequest => s !== null);
  } catch (e) {
    console.error('Errore fetch suggestions:', e);
    return [];
  }
};

export const getUserSuggestionsAsync = async (userId: string): Promise<SuggestionRequest[]> => {
  if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || [])
      .map(mapDbSuggestionToRequest)
      .filter((s): s is SuggestionRequest => s !== null);
  } catch (e) {
    console.error('Errore fetch user suggestions:', e);
    return [];
  }
};

export const addSuggestion = async (suggestion: SuggestionCreateInput): Promise<void> => {
  // Security Gate (service boundary): Feature Flag Runtime → Database.
  // UI UX Gates must not replace this check.
  const suggestionsFlag = evaluateCachedFeatureFlag(
    PLATFORM_FEATURE_FLAG_KEYS.MODERATION_SUGGESTIONS,
    {
      userRole: null,
      isAuthenticated: Boolean(suggestion?.userId),
    },
  );
  if (!suggestionsFlag?.enabled) {
    throw new Error(
      resolvePlatformUserBody(
        suggestionsFlag?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_SUGGESTIONS_PAUSED,
        'Le segnalazioni sono temporaneamente disabilitate.',
      ),
    );
  }

  const payload = {
    user_id: suggestion.userId,
    user_name: suggestion.userName,
    city_id: suggestion.cityId,
    city_name: suggestion.cityName,
    poi_id: suggestion.poiId,
    type: suggestion.type,
    status: 'pending',
    details_json: suggestion.details as Json,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('suggestions').insert(payload);
  if (error) throw error;
};

export const updateSuggestionStatus = async (
  id: string,
  status: SuggestionRequest['status'],
  adminNotes?: string,
  details?: SuggestionReviewPayload | Json,
  rejectionMeta?: SuggestionRejectionMeta,
): Promise<void> => {
  const payload: SuggestionUpdate = { status, admin_notes: adminNotes };
  if (details) payload.details_json = details as Json;
  if (rejectionMeta) {
    payload.admin_notes =
      `${adminNotes || ''}\n[REJECTION] ${rejectionMeta.reason}: ${rejectionMeta.adminMessage}`.trim();
  }
  const { error } = await supabase.from('suggestions').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteSuggestion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('suggestions').delete().eq('id', id);
  if (error) throw error;
};

export const applySuggestion = async (id: string, data: SuggestionReviewPayload): Promise<void> => {
  await updateSuggestionStatus(id, 'approved', data.adminNotes, data);
};
