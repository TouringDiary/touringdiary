
import { supabase } from './supabaseClient';
import { analyzeEventInterest } from './ai/generators/listGenerator';
import { updateCityBadge } from './city/cityUpdateService';
import { getSafeEventCategory } from '../utils/common';
import { getCachedSetting, SETTINGS_KEYS } from './settingsService';

export interface GlobalEventFilter {
    page: number;
    pageSize: number;
    search?: string;
    category?: string;
    season?: string;
    period?: string; 
    holiday?: string; 
    sortBy?: 'date' | 'name' | 'city' | 'rating' | 'category';
    sortDir?: 'asc' | 'desc';
}

export const getGlobalEventsPaginated = async (params: GlobalEventFilter) => {
    let query = supabase
        .from('city_events')
        .select(`
            id, name, date, category, description,
            cities!inner ( id, name, zone, admin_region, special_badge ),
            metadata
        `, { count: 'exact' });

    if (params.search) {
        const term = `%${params.search}%`;
        query = query.ilike('name', term);
    }
    
    if (params.category) {
        query = query.eq('category', params.category);
    }
    
    if (params.period) {
        query = query.ilike('date', `%${params.period}%`);
    }

    if (params.holiday) {
        let keywords: string[] = [];
        switch (params.holiday) {
            case 'natale': keywords = ['Natale', 'Natal', 'Presepe', 'Capodanno', 'Befana', 'Avvento', 'Dicembre']; break;
            case 'pasqua': keywords = ['Pasqua', 'Pasquetta', 'Quaresima', 'Settimana Santa', 'Venerdì Santo']; break;
            case 'carnevale': keywords = ['Carnevale', 'Maschera', 'Sfilata', 'Carro']; break;
            case 'ferragosto': keywords = ['Ferragosto', 'Agosto', 'Estate', 'Estiv']; break;
            case 'halloween': keywords = ['Halloween', 'Ognissanti', 'Morti', 'Zucca']; break;
            case 'ponti_primavera': keywords = ['25 Aprile', '1 Maggio', 'Liberazione', 'Lavoro', 'Aprile', 'Maggio']; break;
            case 'immacolata': keywords = ['Immacolata', '8 Dicembre']; break;
        }
        if (keywords.length > 0) {
            const conditions = keywords.map(k => `name.ilike.%${k}%,description.ilike.%${k}%`).join(',');
            query = query.or(conditions);
        }
    }

    const isAscending = params.sortDir === 'asc';

    switch (params.sortBy) {
        case 'city': query = query.order('name', { foreignTable: 'cities', ascending: isAscending }); break;
        case 'name': query = query.order('name', { ascending: isAscending }); break;
        case 'category': query = query.order('category', { ascending: isAscending }); break;
        case 'rating': query = query.order('date', { ascending: false }); break;
        case 'date': default: query = query.order('date', { ascending: isAscending }); break;
    }
    
    query = query.order('id', { ascending: true });

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    
    if (error) throw error;

    let flatData = (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        category: getSafeEventCategory(e.category),
        description: e.description,
        city_id: e.cities?.id,
        city_name: e.cities?.name || 'Sconosciuta', 
        zone: e.cities?.zone,
        admin_region: e.cities?.admin_region,
        city_badge: e.cities?.special_badge,
        metadata: e.metadata || {} 
    }));
    
    if (params.sortBy === 'rating') {
        flatData.sort((a: any, b: any) => {
            const valA = a.metadata?.rating || 0;
            const valB = b.metadata?.rating || 0;
            return params.sortDir === 'asc' ? valA - valB : valB - valA;
        });
    }

    return { data: flatData, count: count || 0 };
};

export const analyzeEventWithAi = async (eventName: string, cityName: string) => {
    try {
        const analysis = await analyzeEventInterest(eventName, cityName);
        return analysis;
    } catch (e) {
        console.error("AI Event Analysis Failed:", e);
        return null;
    }
};

export const updateEventMetadata = async (eventId: string, metadata: any) => {
    const { error } = await supabase.from('city_events').update({ metadata: metadata }).eq('id', eventId);
    if (error) throw error;
};

export const toggleCityEventBadge = async (cityId: string, badge: string | null) => {
    await updateCityBadge(cityId, badge);
};
