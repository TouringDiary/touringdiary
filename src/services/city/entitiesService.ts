import type { MediaOriginTypeDb } from '@/constants/governance';
import { assertFamousPersonPublishable } from '@/domain/city/famousPersonCompleteness';
import type {
  Database,
  DatabaseCityEventInsert,
  DatabaseCityGuideInsert,
  DatabaseCityPersonInsert,
  DatabaseCityServiceInsert,
  Json,
} from '../../types/database';
import type { CityEvent, CityGuide, CityService, FamousPerson, Review } from '../../types/index';
import { parseStorageLocationFromPublicUrl } from '../../utils/storagePathFromPublicUrl';
import type { DualWriteImageOriginType } from '../media/imageAssignmentDualWriteService';
import { upsertEntityImageAssignmentDualWrite } from '../media/imageAssignmentDualWriteService';
import { supabase } from '../supabaseClient';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import {
  computeLifespanDisplayForSave,
  replacePersonCategoryLinks,
} from './famousPersonCategoryService';
import {
  type CityPeopleAudience,
  filterFamousPeopleByAudience,
} from './parsers/entities/famousPersonAudience';
import { parseEvent } from './parsers/entities/parseEvent';
import { parseGuide } from './parsers/entities/parseGuide';
import { CITY_PEOPLE_SELECT_WITH_CATEGORIES, parsePerson } from './parsers/entities/parsePerson';
import { parseService } from './parsers/entities/parseService';

// --- ROW TYPES (GOVERNANCE) ---
type DatabaseCityEventRow = Database['public']['Tables']['city_events']['Row'];
type DatabaseCityServiceRow = Database['public']['Tables']['city_services']['Row'];
type DatabaseCityGuideRow = Database['public']['Tables']['city_guides']['Row'];
type DatabaseCityPersonRow = Database['public']['Tables']['city_people']['Row'];

function reviewCriteriaToDbJson(criteria: Record<string, number> | undefined): Json | undefined {
  if (!criteria) return undefined;
  const out: { [key: string]: Json | undefined } = {};
  for (const [key, value] of Object.entries(criteria)) {
    out[key] = value;
  }
  return out;
}

function reviewToDbJson(review: Review): Json {
  const out: { [key: string]: Json | undefined } = {
    id: review.id,
    author: review.author,
    rating: review.rating,
    date: review.date,
    text: review.text,
  };
  if (review.authorId !== undefined) out.authorId = review.authorId;
  if (review.updatedAt !== undefined) out.updatedAt = review.updatedAt;
  if (review.approvedAt !== undefined) out.approvedAt = review.approvedAt;
  const criteria = reviewCriteriaToDbJson(review.criteria);
  if (criteria !== undefined) out.criteria = criteria;
  if (review.itineraryId !== undefined) out.itineraryId = review.itineraryId;
  if (review.poiName !== undefined) out.poiName = review.poiName;
  if (review.poiId !== undefined) out.poiId = review.poiId;
  if (review.status !== undefined) out.status = review.status;
  if (review.cityId !== undefined) out.cityId = review.cityId;
  if (review.cityName !== undefined) out.cityName = review.cityName;
  return out;
}

function cityGuideReviewsToDbJson(reviews: CityGuide['reviews']): Json | null {
  if (reviews == null) return null;
  return reviews.map(reviewToDbJson);
}

export type SaveCityEventInput = Omit<CityEvent, 'id'> & { id?: string };
export type SaveCityServiceInput = Omit<CityService, 'id'> & { id?: string };
export type SaveCityGuideInput = Omit<CityGuide, 'id'> & { id?: string };
/**
 * Persistenza personaggi: `name` è obbligatorio a DB.
 * `bio` / `imageUrl` possono essere assenti/null in bozza incompleta.
 * `specificCategoryIds` aggiorna la junction N:M (replace).
 * La pubblicazione (`status: 'published'`) passa dal gate di dominio.
 */
function toDualWriteImageOriginType(
  origin: CityPersonDualWriteImageOrigin | undefined,
): DualWriteImageOriginType {
  switch (origin) {
    case 'ai':
    case 'ai_generated':
      return 'ai';
    case 'wikimedia':
      return 'wikimedia';
    case 'community':
      return 'community';
    case 'placeholder':
      return 'placeholder';
    default:
      return 'admin';
  }
}

/** Provenance ammessa al dual-write da saveCityPerson (verified_real escluso — esito verifica MF4). */
type CityPersonDualWriteImageOrigin = Exclude<MediaOriginTypeDb, 'verified_real'>;

export type SaveCityPersonInput = Omit<FamousPerson, 'id' | 'bio' | 'imageUrl' | 'cityId'> & {
  id?: string;
  bio?: string | null;
  imageUrl?: string | null;
  specificCategoryIds?: string[];
  /** MF3 — origine esplicita per dual-write (default admin; verified_real non ammesso). */
  imageOriginType?: CityPersonDualWriteImageOrigin;
};

// --- ENTITIES FETCHERS ---

export const getCityEvents = async (cityId: string): Promise<CityEvent[]> => {
  const { data, error } = await supabase
    .from('city_events')
    .select('*')
    .eq('city_id', cityId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityEventRow[]) || []).map(parseEvent);
};

/** Batch: eventi per più città in una sola query (Around Me / merge). */
export const getCityEventsByCityIds = async (cityIds: string[]): Promise<CityEvent[]> => {
  if (cityIds.length === 0) return [];
  const { data, error } = await supabase
    .from('city_events')
    .select('*')
    .in('city_id', cityIds)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityEventRow[]) || []).map(parseEvent);
};

export const getCityServices = async (cityId: string): Promise<CityService[]> => {
  const { data, error } = await supabase
    .from('city_services')
    .select('*')
    .eq('city_id', cityId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityServiceRow[]) || []).map(parseService);
};

/** Batch: servizi per più città in una sola query (Around Me / merge). */
export const getCityServicesByCityIds = async (cityIds: string[]): Promise<CityService[]> => {
  if (cityIds.length === 0) return [];
  const { data, error } = await supabase
    .from('city_services')
    .select('*')
    .in('city_id', cityIds)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityServiceRow[]) || []).map(parseService);
};

export const getCityGuides = async (cityId: string): Promise<CityGuide[]> => {
  const { data, error } = await supabase
    .from('city_guides')
    .select('*')
    .eq('city_id', cityId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityGuideRow[]) || []).map(parseGuide);
};

/** Batch: guide per più città in una sola query (Around Me / merge). */
export const getCityGuidesByCityIds = async (cityIds: string[]): Promise<CityGuide[]> => {
  if (cityIds.length === 0) return [];
  const { data, error } = await supabase
    .from('city_guides')
    .select('*')
    .in('city_id', cityIds)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return ((data as DatabaseCityGuideRow[]) || []).map(parseGuide);
};

export type { CityPeopleAudience } from './parsers/entities/famousPersonAudience';

export const getCityPeople = async (
  cityId: string,
  audience: CityPeopleAudience = 'admin',
): Promise<FamousPerson[]> => {
  let query = supabase
    .from('city_people')
    .select(CITY_PEOPLE_SELECT_WITH_CATEGORIES)
    .eq('city_id', cityId)
    .order('order_index', { ascending: true });

  if (audience === 'public') {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) throw error;

  const parsed = ((data as DatabaseCityPersonRow[]) || []).map(parsePerson);
  return filterFamousPeopleByAudience(parsed, audience);
};

/** Batch: personaggi per più città in una sola query (Around Me). Audience pubblica di default. */
export const getCityPeopleByCityIds = async (
  cityIds: string[],
  audience: CityPeopleAudience = 'public',
): Promise<FamousPerson[]> => {
  if (cityIds.length === 0) return [];
  let query = supabase
    .from('city_people')
    .select(CITY_PEOPLE_SELECT_WITH_CATEGORIES)
    .in('city_id', cityIds)
    .order('order_index', { ascending: true });

  if (audience === 'public') {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) throw error;

  const parsed = ((data as DatabaseCityPersonRow[]) || []).map(parsePerson);
  return filterFamousPeopleByAudience(parsed, audience);
};

// --- SAVE / DELETE METHODS ---

export const saveCityEvent = async (cityId: string, event: SaveCityEventInput) => {
  invalidateCityCache(cityId);
  const isNew = !event.id?.match(/^[0-9a-f]{8}-/);
  const payload: DatabaseCityEventInsert = {
    city_id: cityId,
    name: event.name,
    date: event.date,
    category: event.category,
    description: event.description,
    location: event.location,
    coords_lat: event.coords?.lat || 0,
    coords_lng: event.coords?.lng || 0,
    image_url: event.imageUrl,
    order_index: event.orderIndex || 0,
  };
  if (!isNew && event.id) {
    payload.id = event.id;
  }

  const { data, error } = await supabase.from('city_events').upsert(payload).select().single();

  if (error) throw error;
  const result = data as DatabaseCityEventRow;
  return { ...result, orderIndex: result.order_index };
};

export const deleteCityEvent = async (id: string) => {
  clearCacheKey(`city_details_`);
  const { error } = await supabase.from('city_events').delete().eq('id', id);
  if (error) throw error;
};

export const saveCityService = async (cityId: string, service: SaveCityServiceInput) => {
  invalidateCityCache(cityId);

  const serviceType = (service.type || '').toLowerCase().trim();
  if (serviceType === 'tour_operator' || serviceType === 'agency') {
    throw new Error(
      `Tour Operator non può essere salvato in city_services (type="${service.type}"). Usare city_tour_operators.`,
    );
  }

  const isNew = !service.id?.match(/^[0-9a-f]{8}-/);
  const payload: DatabaseCityServiceInsert = {
    city_id: cityId,
    type: service.type,
    name: service.name,
    contact: service.contact,
    description: service.description,
    url: service.url,
    address: service.address,
    category: service.category,
    order_index: service.orderIndex || 0,
  };
  if (!isNew && service.id) {
    payload.id = service.id;
  }

  const { data, error } = await supabase.from('city_services').upsert(payload).select().single();

  if (error) throw error;
  const result = data as DatabaseCityServiceRow;
  return { ...result, orderIndex: result.order_index };
};

export const deleteCityService = async (id: string) => {
  clearCacheKey(`city_details_`);
  const { error } = await supabase.from('city_services').delete().eq('id', id);
  if (error) throw error;
};

export const saveCityGuide = async (cityId: string, guide: SaveCityGuideInput) => {
  invalidateCityCache(cityId);
  const isNew = !guide.id?.match(/^[0-9a-f]{8}-/);
  const payload: DatabaseCityGuideInsert = {
    city_id: cityId,
    name: guide.name,
    is_official: guide.isOfficial,
    languages: guide.languages,
    specialties: guide.specialties,
    email: guide.email,
    phone: guide.phone,
    website: guide.website,
    image_url: guide.imageUrl,
    rating: guide.rating,
    reviews: cityGuideReviewsToDbJson(guide.reviews),
    order_index: guide.orderIndex || 0,
  };
  if (!isNew && guide.id) {
    payload.id = guide.id;
  }

  const { data, error } = await supabase.from('city_guides').upsert(payload).select().single();

  if (error) throw error;
  const result = data as DatabaseCityGuideRow;
  return { ...result, orderIndex: result.order_index };
};

export const deleteCityGuide = async (id: string) => {
  clearCacheKey(`city_details_`);
  const { error } = await supabase.from('city_guides').delete().eq('id', id);
  if (error) throw error;
};

type PersistedPersonLifespanFields = Pick<
  DatabaseCityPersonRow,
  'is_living' | 'birth_year' | 'birth_date' | 'death_year' | 'death_date'
>;

async function loadPersistedPersonLifespanFields(
  personId: string,
): Promise<PersistedPersonLifespanFields | null> {
  const { data, error } = await supabase
    .from('city_people')
    .select('is_living, birth_year, birth_date, death_year, death_date')
    .eq('id', personId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function resolveOptionalNumberField(
  payloadValue: number | null | undefined,
  persistedValue: number | null | undefined,
): number | null {
  if (payloadValue !== undefined) return payloadValue ?? null;
  return persistedValue ?? null;
}

function resolveOptionalDateField(
  payloadValue: string | null | undefined,
  persistedValue: string | null | undefined,
): string | null {
  if (payloadValue !== undefined) return payloadValue ?? null;
  return persistedValue ?? null;
}

const UPSERT_CITY_PERSON_RPC = 'upsert_city_person_with_category_links';
const UPSERT_CITY_PERSON_MIGRATION = '20260910180000_upsert_city_person_with_category_links.sql';

function normalizeSpecificCategoryIds(ids: string[]): string[] {
  const normalized = ids
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter((id) => id.length > 0);
  return [...new Set(normalized)];
}

function isUpsertCityPersonRpcMissing(error: { code?: string; message?: string }): boolean {
  if (error.code !== 'PGRST202') return false;
  const message = error.message ?? '';
  return message.includes(UPSERT_CITY_PERSON_RPC);
}

async function saveCityPersonViaLegacyUpsert(
  payload: DatabaseCityPersonInsert,
  specificCategoryIds: string[],
): Promise<string> {
  const { data, error } = await supabase.from('city_people').upsert(payload).select('id').single();
  if (error) throw error;
  const savedId = (data as { id: string }).id;
  try {
    await replacePersonCategoryLinks(savedId, specificCategoryIds);
  } catch (linksError) {
    const detail = linksError instanceof Error ? linksError.message : String(linksError);
    throw new Error(
      `[saveCityPerson] Fallback non atomico: persona salvata (id=${savedId}) ma aggiornamento categorie fallito. Applicare migration ${UPSERT_CITY_PERSON_MIGRATION}. Dettaglio: ${detail}`,
    );
  }
  return savedId;
}

export const saveCityPerson = async (
  cityId: string,
  person: SaveCityPersonInput,
): Promise<FamousPerson> => {
  const specificCategoryIds = normalizeSpecificCategoryIds(
    person.specificCategoryIds ?? person.categories?.map((c) => c.specificId) ?? [],
  );

  if (person.status === 'published') {
    assertFamousPersonPublishable({
      ...person,
      specificCategoryIds,
    });
  }

  const isNew = !person.id?.match(/^[0-9a-f]{8}-/);
  const presentOrNull = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const persisted = !isNew && person.id ? await loadPersistedPersonLifespanFields(person.id) : null;

  const isLiving: boolean | undefined =
    typeof person.isLiving === 'boolean'
      ? person.isLiving
      : typeof persisted?.is_living === 'boolean'
        ? persisted.is_living
        : undefined;

  const birthYear = isNew
    ? (person.birthYear ?? null)
    : resolveOptionalNumberField(person.birthYear, persisted?.birth_year);
  const birthDate = isNew
    ? (person.birthDate ?? null)
    : resolveOptionalDateField(person.birthDate, persisted?.birth_date);

  const deathYear =
    isLiving === true
      ? null
      : isNew
        ? (person.deathYear ?? null)
        : resolveOptionalNumberField(person.deathYear, persisted?.death_year);
  const deathDate =
    isLiving === true
      ? null
      : isNew
        ? (person.deathDate ?? null)
        : resolveOptionalDateField(person.deathDate, persisted?.death_date);

  const lifespanDisplay = computeLifespanDisplayForSave({
    birthYear,
    birthDate,
    isLiving,
    deathYear,
    deathDate,
  });

  const payload: DatabaseCityPersonInsert = {
    city_id: cityId,
    name: person.name.trim(),
    bio: presentOrNull(person.bio),
    full_bio: person.fullBio,
    image_url: presentOrNull(person.imageUrl),
    quote: person.quote,
    birth_year: birthYear,
    birth_date: birthDate,
    ...(typeof isLiving === 'boolean' ? { is_living: isLiving } : {}),
    death_year: deathYear,
    death_date: deathDate,
    lifespan_display: lifespanDisplay || null,
    famous_works: person.famousWorks,
    awards: person.awards,
    private_life: person.privateLife,
    related_places: person.relatedPlaces,
    career_stats: person.careerStats,
    status: person.status,
    order_index: person.orderIndex || 0,
  };
  if (!isNew && person.id) {
    payload.id = person.id;
  }

  let savedId: string;
  const { data: rpcSavedId, error } = await supabase.rpc('upsert_city_person_with_category_links', {
    p_person: payload,
    p_specific_category_ids: specificCategoryIds,
  });

  if (error) {
    if (isUpsertCityPersonRpcMissing(error)) {
      console.warn(
        `[saveCityPerson] RPC ${UPSERT_CITY_PERSON_RPC} assente sul database; fallback upsert+links (non atomico). Applicare migration ${UPSERT_CITY_PERSON_MIGRATION}.`,
      );
      savedId = await saveCityPersonViaLegacyUpsert(payload, specificCategoryIds);
    } else {
      throw error;
    }
  } else if (typeof rpcSavedId !== 'string' || rpcSavedId.length === 0) {
    throw new Error(
      'upsert_city_person_with_category_links non ha restituito un id persona valido.',
    );
  } else {
    savedId = rpcSavedId;
  }

  const { data: full, error: reloadError } = await supabase
    .from('city_people')
    .select(CITY_PEOPLE_SELECT_WITH_CATEGORIES)
    .eq('id', savedId)
    .single();
  if (reloadError) throw reloadError;

  const parsedPerson = parsePerson(full);
  const imageUrl = parsedPerson.imageUrl?.trim() ?? '';
  if (imageUrl.length > 0) {
    const parsedStorage = parseStorageLocationFromPublicUrl(imageUrl);
    const originType = toDualWriteImageOriginType(person.imageOriginType);
    if (parsedStorage?.storagePath) {
      await upsertEntityImageAssignmentDualWrite({
        entityType: 'city_person',
        entityId: parsedPerson.id,
        cityId,
        assignmentRole: 'primary',
        source: {
          imageUrl,
          storageBucket: parsedStorage.storageBucket,
          storagePath: parsedStorage.storagePath,
          originType,
        },
      });
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      await upsertEntityImageAssignmentDualWrite({
        entityType: 'city_person',
        entityId: parsedPerson.id,
        cityId,
        assignmentRole: 'primary',
        source: {
          imageUrl,
          storageBucket: null,
          storagePath: null,
          originType,
        },
      });
    }
  }

  invalidateCityCache(cityId);

  if (person.imageOriginType === 'ai' && imageUrl.length > 0) {
    return {
      ...parsedPerson,
      imageAsset: {
        url: parsedPerson.imageUrl ?? imageUrl,
        mediaStatus: parsedPerson.imageAsset?.mediaStatus ?? 'real',
        generatedByAi: true,
        originType: 'ai',
      },
    };
  }

  return parsedPerson;
};

export const deleteCityPerson = async (id: string) => {
  clearCacheKey(`city_details_`);
  const { error } = await supabase.from('city_people').delete().eq('id', id);
  if (error) throw error;
};
