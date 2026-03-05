
import { supabase } from '../../supabaseClient';
import { PointOfInterest } from '../../../types/index';
import { DatabasePoi } from '../../../types/database';
import { mapDbPoiToApp } from './poiMapper';

export interface PaginatedPois {
    data: PointOfInterest[];
    count: number;
}

interface PoiFilterParams {
    cityId: string;
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
    
    // Filtri Avanzati
    category?: string;
    subCategory?: string[];
    minRating?: number;
    reliability?: string[]; // ['high', 'medium', 'unknown', ...]
    interest?: string[];    // ['high', 'medium', 'unknown', ...]
    createdDates?: string[]; // ['2023-12-01', ...]
    updatedDates?: string[]; // ['2023-12-01', ...]
    priceLevel?: number[];   // [1, 2, 3, 4] - NEW

    sortBy: 'name' | 'date_added' | 'updated_at';
    sortDir: 'asc' | 'desc';
}

// Helper per costruire filtri complessi (Valori + Null + Condizioni Speciali)
const applyComplexFilter = (query: any, column: string, values: string[], specialMap?: Record<string, string>) => {
    if (!values || values.length === 0) return query;

    const conditions: string[] = [];
    const cleanValues: string[] = [];

    values.forEach(val => {
        if (val === 'unknown') {
            conditions.push(`${column}.is.null`);
        } else if (specialMap && specialMap[val]) {
            conditions.push(specialMap[val]);
        } else {
            cleanValues.push(val);
        }
    });

    if (cleanValues.length > 0) {
        conditions.push(`${column}.in.(${cleanValues.join(',')})`);
    }

    if (conditions.length > 0) {
        query = query.or(conditions.join(','));
    }

    return query;
};

// Helper per Date Range precisi
const buildDateRangeFilter = (column: string, dates: string[]) => {
    if (!dates || dates.length === 0) return null;

    const conditions = dates.map(date => {
        if (!date || date.length < 10) return null;
        
        const start = `${date}T00:00:00`;
        const end = `${date}T23:59:59.999`;
        
        return `and(${column}.gte.${start},${column}.lte.${end})`;
    }).filter(Boolean);

    if (conditions.length === 0) return null;
    return conditions.join(',');
};

export const getPoisPaginated = async (params: PoiFilterParams): Promise<PaginatedPois> => {
    try {
        let query = supabase
            .from('pois')
            .select('*', { count: 'exact' })
            .eq('city_id', params.cityId);

        // 1. STATUS
        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status);
        }
        
        // 2. CATEGORIA
        if (params.category && params.category !== 'all') {
            query = query.eq('category', params.category);
        }

        // 3. SOTTOCATEGORIA
        if (params.subCategory && params.subCategory.length > 0) {
            query = query.in('sub_category', params.subCategory);
        }
        
        // 4. INTERESSE TURISTICO
        if (params.interest && params.interest.length > 0) {
            query = applyComplexFilter(query, 'tourism_interest', params.interest);
        }
        
        // 5. AFFIDABILITÀ AI
        if (params.reliability && params.reliability.length > 0) {
            query = applyComplexFilter(query, 'ai_reliability', params.reliability, {
                'no_gps': 'coords_lat.eq.0',
                'out_of_zone': 'ai_reliability.eq.invalidated'
            });
        }

        // 6. FILTRO DATA CREAZIONE
        if (params.createdDates && params.createdDates.length > 0) {
            const dateFilter = buildDateRangeFilter('created_at', params.createdDates);
            if (dateFilter) {
                query = query.or(dateFilter);
            }
        }

        // 7. FILTRO DATA MODIFICA
        if (params.updatedDates && params.updatedDates.length > 0) {
            const dateFilter = buildDateRangeFilter('updated_at', params.updatedDates);
            if (dateFilter) {
                query = query.or(dateFilter);
            }
        }
        
        // 8. FILTRO LIVELLO ECONOMICO
        if (params.priceLevel && params.priceLevel.length > 0) {
            query = query.in('price_level', params.priceLevel);
        }

        // 9. RATING
        if (params.minRating && params.minRating > 0) {
            query = query.gte('rating', params.minRating);
        }

        // 10. SEARCH
        if (params.search) {
            const term = params.search.trim();
            query = query.or(`name.ilike.%${term}%,address.ilike.%${term}%`);
        }

        // ORDINAMENTO
        const sortColumn = params.sortBy === 'date_added' ? 'created_at' : params.sortBy; 
        query = query.order(sortColumn, { ascending: params.sortDir === 'asc' });

        // PAGINAZIONE
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        
        if (error) {
            console.error("DB Error getPoisPaginated:", JSON.stringify(error, null, 2));
            throw error;
        }

        return {
            data: (data as DatabasePoi[]).map(mapDbPoiToApp),
            count: count || 0
        };
    } catch (e: any) {
        console.error("Critical Error fetching POIs:", e);
        throw e;
    }
};

// --- ALTRI METODI DI LETTURA ---

/**
 * Recupera un batch di POI che necessitano di bonifica.
 */
export const getPoisForDeepScan = async (cityId: string, limit: number = 10): Promise<PointOfInterest[]> => {
    const { data } = await supabase
        .from('pois')
        .select('*')
        .eq('city_id', cityId)
        .not('ai_reliability', 'like', '%+%') 
        .neq('ai_reliability', 'invalidated')
        .order('created_at', { ascending: false }) 
        .limit(limit);

    return (data as DatabasePoi[] || []).map(mapDbPoiToApp);
};

export const getPoisByCityId = async (cityId: string): Promise<PointOfInterest[]> => {
    const { data } = await supabase.from('pois').select('*').eq('city_id', cityId);
    return (data as DatabasePoi[] || []).map(mapDbPoiToApp);
};

export const getAllPoisGlobal = async (): Promise<PointOfInterest[]> => {
    const { data, error } = await supabase.from('pois').select('*');
    if (error) return [];
    return (data as DatabasePoi[] || []).map(mapDbPoiToApp);
};

export const getPoisByCityIds = async (cityIds: string[]): Promise<PointOfInterest[]> => {
    if (cityIds.length === 0) return [];
    const { data } = await supabase.from('pois').select('*').in('city_id', cityIds);
    return (data as DatabasePoi[] || []).map(mapDbPoiToApp);
};

/**
 * NEW: Batch Fetch by IDs (Performance Fix)
 * Recupera una lista di POI specifici dato il loro ID.
 */
export const getPoisByIds = async (ids: string[]): Promise<PointOfInterest[]> => {
    if (!ids || ids.length === 0) return [];
    
    // Chunking per sicurezza se IDs > 200 (Supabase/PostgREST limit)
    // Ma per un itinerario è raro avere così tanti item. Facciamo chiamata diretta per ora.
    const { data, error } = await supabase
        .from('pois')
        .select('*')
        .in('id', ids);

    if (error) {
        console.error("Error fetching POIs by IDs:", error);
        return [];
    }

    return (data as DatabasePoi[] || []).map(mapDbPoiToApp);
};
