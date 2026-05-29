import { supabase } from '../supabaseClient';
import { Database } from '../../types/database';
import { CityEvent, CityService, CityGuide, FamousPerson } from '../../types/index';
import { 
    DatabaseCityEventInsert, DatabaseCityServiceInsert, DatabaseCityGuideInsert, DatabaseCityPersonInsert
} from '../../types/database';
import { invalidateCityCache, clearCacheKey } from './cityCache';
import { parseEvent } from './parsers/entities/parseEvent';
import { parseService } from './parsers/entities/parseService';
import { parseGuide } from './parsers/entities/parseGuide';
import { parsePerson } from './parsers/entities/parsePerson';
import {
    type CityPeopleAudience,
    filterFamousPeopleByAudience,
} from './parsers/entities/famousPersonAudience';

// --- ROW TYPES (GOVERNANCE) ---
type DatabaseCityEventRow = Database['public']['Tables']['city_events']['Row'];
type DatabaseCityServiceRow = Database['public']['Tables']['city_services']['Row'];
type DatabaseCityGuideRow = Database['public']['Tables']['city_guides']['Row'];
type DatabaseCityPersonRow = Database['public']['Tables']['city_people']['Row'];

// --- ENTITIES FETCHERS ---

export const getCityEvents = async (cityId: string): Promise<CityEvent[]> => { 
    const { data, error } = await supabase.from('city_events').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    if (error) throw error;
    return (data as DatabaseCityEventRow[] || []).map(parseEvent); 
};

export const getCityServices = async (cityId: string): Promise<CityService[]> => { 
    const { data, error } = await supabase.from('city_services').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    if (error) throw error;
    return (data as DatabaseCityServiceRow[] || []).map(parseService); 
};

export const getCityGuides = async (cityId: string): Promise<CityGuide[]> => { 
    const { data, error } = await supabase.from('city_guides').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    if (error) throw error;
    return (data as DatabaseCityGuideRow[] || []).map(parseGuide); 
};

export type { CityPeopleAudience } from './parsers/entities/famousPersonAudience';

export type SaveCityPersonInput = Omit<FamousPerson, 'id'> & { id?: string };

export const getCityPeople = async (
    cityId: string,
    audience: CityPeopleAudience = 'admin',
): Promise<FamousPerson[]> => {
    let query = supabase
        .from('city_people')
        .select('*')
        .eq('city_id', cityId)
        .order('order_index', { ascending: true });

    if (audience === 'public') {
        query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) throw error;

    const parsed = (data as DatabaseCityPersonRow[] || []).map(parsePerson);
    return filterFamousPeopleByAudience(parsed, audience);
};

// --- SAVE / DELETE METHODS ---

export const saveCityEvent = async (cityId: string, event: any) => { 
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
        order_index: event.orderIndex || 0
    }; 
    if (!isNew) (payload as any).id = event.id; 
    
    const query: any = supabase.from('city_events').upsert(payload as any);
    const { data, error } = await query.select().single();
    
    if(error) throw error; 
    const result = data as DatabaseCityEventRow;
    return { ...result, orderIndex: result.order_index }; 
};

export const deleteCityEvent = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_events').delete().eq('id', id); 
};

export const saveCityService = async (cityId: string, service: any) => { 
    invalidateCityCache(cityId);

    const serviceType = (service.type || '').toLowerCase().trim();
    if (serviceType === 'tour_operator' || serviceType === 'agency') {
        throw new Error(
            `Tour Operator non può essere salvato in city_services (type="${service.type}"). Usare city_tour_operators.`
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
    if (!isNew) (payload as any).id = service.id; 

    const query: any = supabase.from('city_services').upsert(payload as any);
    const { data, error } = await query.select().single();

    if(error) throw error; 
    const result = data as DatabaseCityServiceRow;
    return { ...result, orderIndex: result.order_index }; 
};

export const deleteCityService = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_services').delete().eq('id', id); 
};

export const saveCityGuide = async (cityId: string, guide: any) => { 
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
        reviews: guide.reviews,
        order_index: guide.orderIndex || 0
    }; 
    if (!isNew) (payload as any).id = guide.id; 

    const query: any = supabase.from('city_guides').upsert(payload as any);
    const { data, error } = await query.select().single();

    if(error) throw error; 
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
    invalidateCityCache(cityId);
    const isNew = !person.id || !person.id.match(/^[0-9a-f]{8}-/);
    const payload: DatabaseCityPersonInsert = {
        city_id: cityId,
        name: person.name,
        role: person.role,
        bio: person.bio,
        full_bio: person.fullBio,
        image_url: person.imageUrl,
        quote: person.quote,
        lifespan: person.lifespan,
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

    const { data, error } = await supabase
        .from('city_people')
        .upsert(payload)
        .select()
        .single();

    if (error) throw error;
    return parsePerson(data as DatabaseCityPersonRow);
};

export const deleteCityPerson = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_people').delete().eq('id', id); 
};
