
import { supabase } from '../supabaseClient';
import { CityEvent, CityService, CityGuide, FamousPerson } from '../../types/index';
import { DatabaseCityEvent, DatabaseCityService, DatabaseCityGuide, DatabaseCityPerson } from '../../types/database';
import { invalidateCityCache, clearCacheKey } from './cityCache';

// --- EVENTS ---
export const getCityEvents = async (cityId: string): Promise<CityEvent[]> => { 
    const { data } = await supabase.from('city_events').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    return (data as DatabaseCityEvent[] || []).map(e => ({ 
        id: e.id, name: e.name, date: e.date, category: e.category as any, 
        description: e.description, location: e.location, 
        coords: { lat: e.coords_lat, lng: e.coords_lng }, imageUrl: e.image_url, orderIndex: e.order_index 
    })); 
};

export const saveCityEvent = async (cityId: string, event: any) => { 
    invalidateCityCache(cityId); 
    const isNew = !event.id || !event.id.match(/^[0-9a-f]{8}-/); 
    const payload: any = { 
        city_id: cityId, name: event.name, date: event.date, category: event.category, 
        description: event.description, location: event.location, 
        coords_lat: event.coords?.lat || 0, coords_lng: event.coords?.lng || 0, image_url: event.imageUrl,
        order_index: event.orderIndex || 0
    }; 
    if (!isNew) payload.id = event.id; 
    const { data, error } = await supabase.from('city_events').upsert(payload).select().single(); 
    if(error) throw error; 
    return { ...data, orderIndex: data.order_index }; 
};

export const deleteCityEvent = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_events').delete().eq('id', id); 
};

// --- SERVICES ---
export const getCityServices = async (cityId: string): Promise<CityService[]> => { 
    const { data } = await supabase.from('city_services').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    return (data as DatabaseCityService[] || []).map(s => ({ 
        id: s.id, type: s.type as any, name: s.name, contact: s.contact, 
        description: s.description, url: s.url, address: s.address, category: s.category, 
        imageUrl: s.image_url, // MODIFICA 2: Aggiunto imageUrl al mapping
        orderIndex: s.order_index 
    })); 
};

export const saveCityService = async (cityId: string, service: any) => { 
    invalidateCityCache(cityId); 
    const isNew = !service.id || !service.id.match(/^[0-9a-f]{8}-/); 
    const payload: any = { 
        city_id: cityId, type: service.type, name: service.name, contact: service.contact, 
        description: service.description, url: service.url, address: service.address, category: service.category,
        order_index: service.orderIndex || 0,
        image_url: service.imageUrl // Assicuriamoci che venga salvato anche l'URL dell'immagine
    }; 
    if (!isNew) payload.id = service.id; 
    const { data, error } = await supabase.from('city_services').upsert(payload).select().single(); 
    if(error) throw error; 
    return { ...data, orderIndex: data.order_index }; 
};

export const deleteCityService = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_services').delete().eq('id', id); 
};

// --- GUIDES ---
export const getCityGuides = async (cityId: string): Promise<CityGuide[]> => { 
    const { data } = await supabase.from('city_guides').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    return (data as DatabaseCityGuide[] || []).map(g => ({ 
        id: g.id, name: g.name, isOfficial: g.is_official, languages: g.languages, 
        specialties: g.specialties, email: g.email, phone: g.phone, website: g.website, 
        imageUrl: g.image_url, // MODIFICA 1: Usato direttamente l'URL dal DB
        rating: g.rating, reviews: g.reviews as any, orderIndex: g.order_index 
    })); 
};

export const saveCityGuide = async (cityId: string, guide: any) => { 
    invalidateCityCache(cityId); 
    const isNew = !guide.id || !guide.id.match(/^[0-9a-f]{8}-/); 
    const payload: any = { 
        city_id: cityId, name: guide.name, is_official: guide.isOfficial, 
        languages: guide.languages, specialties: guide.specialties, email: guide.email, 
        phone: guide.phone, website: guide.website, image_url: guide.imageUrl, 
        rating: guide.rating, reviews: guide.reviews,
        order_index: guide.orderIndex || 0
    }; 
    if (!isNew) payload.id = guide.id; 
    const { data, error } = await supabase.from('city_guides').upsert(payload).select().single(); 
    if(error) throw error; 
    return { ...data, orderIndex: data.order_index }; 
};

export const deleteCityGuide = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_guides').delete().eq('id', id); 
};

// --- PEOPLE ---
export const getCityPeople = async (cityId: string): Promise<FamousPerson[]> => { 
    const { data } = await supabase.from('city_people').select('*').eq('city_id', cityId).order('order_index', { ascending: true }); 
    return (data as DatabaseCityPerson[] || []).map(p => ({ 
        id: p.id, name: p.name, role: p.role, bio: p.bio, fullBio: p.full_bio, 
        imageUrl: p.image_url, quote: p.quote, lifespan: p.lifespan, 
        famousWorks: p.famous_works, awards: p.awards, privateLife: p.private_life, 
        relatedPlaces: p.related_places as any, careerStats: p.career_stats as any, 
        status: (p.status as 'published' | 'draft') || 'published',
        orderIndex: p.order_index 
    })); 
};

export const saveCityPerson = async (cityId: string, person: any) => { 
    invalidateCityCache(cityId); 
    const isNew = !person.id || !person.id.match(/^[0-9a-f]{8}-/); 
    const payload: any = { 
        city_id: cityId, name: person.name, role: person.role, bio: person.bio, 
        full_bio: person.fullBio, image_url: person.imageUrl, quote: person.quote, 
        lifespan: person.lifespan, famous_works: person.famousWorks, awards: person.awards, 
        private_life: person.privateLife, related_places: person.relatedPlaces, 
        career_stats: person.careerStats, status: person.status || 'published',
        order_index: person.orderIndex || 0
    }; 
    if (!isNew) payload.id = person.id; 
    const { data, error } = await supabase.from('city_people').upsert(payload).select().single(); 
    if(error) throw error; 
    return { ...data, orderIndex: data.order_index }; 
};

export const deleteCityPerson = async (id: string) => { 
    clearCacheKey(`city_details_`); 
    await supabase.from('city_people').delete().eq('id', id); 
};
