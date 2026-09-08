import { assertFamousPersonPublishable } from '@/domain/city/famousPersonCompleteness';
import type {
  Database,
  DatabaseCityEventInsert,
  DatabaseCityGuideInsert,
  DatabaseCityPersonInsert,
  DatabaseCityServiceInsert,
  Json,
} from '../../types/database';
import type { CityEvent, CityGuide, CityService, FamousPerson } from '../../types/index';
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

export type SaveCityEventInput = Omit<CityEvent, 'id'> & { id?: string };
export type SaveCityServiceInput = Omit<CityService, 'id'> & { id?: string };
export type SaveCityGuideInput = Omit<CityGuide, 'id'> & { id?: string };
/**
 * Persistenza personaggi: `name` è obbligatorio a DB.
 * `bio` / `imageUrl` possono essere assenti/null in bozza incompleta.
 * `specificCategoryIds` aggiorna la junction N:M (replace).
 * La pubblicazione (`status: 'published'`) passa dal gate di dominio.
 */
export type SaveCityPersonInput = Omit<FamousPerson, 'id' | 'bio' | 'imageUrl' | 'cityId'> & {
  id?: string;
  bio?: string | null;
  imageUrl?: string | null;
  specificCategoryIds?: string[];
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
  const isNew = !event.id || !event.id.match(/^[0-9a-f]{8}-/);
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
  await supabase.from('city_events').delete().eq('id', id);
};

export const saveCityService = async (cityId: string, service: SaveCityServiceInput) => {
  invalidateCityCache(cityId);

  const serviceType = (service.type || '').toLowerCase().trim();
  if (serviceType === 'tour_operator' || serviceType === 'agency') {
    throw new Error(
      `Tour Operator non può essere salvato in city_services (type="${service.type}"). Usare city_tour_operators.`,
    );
  }

  const isNew = !service.id || !service.id.match(/^[0-9a-f]{8}-/);
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
  await supabase.from('city_services').delete().eq('id', id);
};

export const saveCityGuide = async (cityId: string, guide: SaveCityGuideInput) => {
  invalidateCityCache(cityId);
  const isNew = !guide.id || !guide.id.match(/^[0-9a-f]{8}-/);
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
    reviews: guide.reviews as unknown as Json,
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
  await supabase.from('city_guides').delete().eq('id', id);
};

export const saveCityPerson = async (
  cityId: string,
  person: SaveCityPersonInput,
): Promise<FamousPerson> => {
  const specificCategoryIds =
    person.specificCategoryIds ?? person.categories?.map((c) => c.specificId) ?? [];

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

  const isLiving = person.isLiving !== false;
  const lifespanDisplay = computeLifespanDisplayForSave({
    birthYear: person.birthYear,
    birthDate: person.birthDate,
    isLiving,
    deathYear: person.deathYear,
    deathDate: person.deathDate,
  });

  const payload: DatabaseCityPersonInsert = {
    city_id: cityId,
    name: person.name.trim(),
    bio: presentOrNull(person.bio),
    full_bio: person.fullBio,
    image_url: presentOrNull(person.imageUrl),
    quote: person.quote,
    birth_year: person.birthYear ?? null,
    birth_date: person.birthDate ?? null,
    is_living: isLiving,
    death_year: isLiving ? null : (person.deathYear ?? null),
    death_date: isLiving ? null : (person.deathDate ?? null),
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

  const { data, error } = await supabase.from('city_people').upsert(payload).select().single();

  if (error) throw error;
  const saved = data as DatabaseCityPersonRow;
  await replacePersonCategoryLinks(saved.id, specificCategoryIds);

  const { data: full, error: reloadError } = await supabase
    .from('city_people')
    .select(CITY_PEOPLE_SELECT_WITH_CATEGORIES)
    .eq('id', saved.id)
    .single();
  if (reloadError) throw reloadError;

  invalidateCityCache(cityId);
  return parsePerson(full);
};

export const deleteCityPerson = async (id: string) => {
  clearCacheKey(`city_details_`);
  await supabase.from('city_people').delete().eq('id', id);
};
