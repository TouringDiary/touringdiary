import { supabase } from './supabaseClient';

export interface CitySuggestion {
    id: string;
    name: string;
    region: string;
    province?: string;
}

/**
 * Recupera il nome di un comune dato il suo identificativo UUID.
 * Se la città non viene trovata o in caso di errore, ritorna null.
 *
 * @param cityId Identificativo del comune
 */
export async function getCityNameById(cityId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('cities_registry')
            .select('name')
            .eq('id', cityId)
            .maybeSingle();

        if (error) {
            console.error(`[geoRegistryService] Error in getCityNameById for ${cityId}:`, error);
            return null;
        }

        return data?.name || null;
    } catch (err) {
        console.error(`[geoRegistryService] Unexpected exception in getCityNameById for ${cityId}:`, err);
        return null;
    }
}

/**
 * Esegue la ricerca autocompletata dei comuni italiani limitata a 10 risultati.
 *
 * @param searchText Testo di ricerca digitato dall'utente
 */
export async function searchCitiesByName(searchText: string): Promise<CitySuggestion[]> {
    if (!searchText || searchText.trim().length < 2) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('cities_registry')
            .select('id, name, region, province')
            .ilike('name', `${searchText}%`)
            .limit(10);

        if (error) {
            console.error('[geoRegistryService] Error in searchCitiesByName:', error);
            return [];
        }

        // Mapping esplicito e sicuro per conformarsi all'interfaccia CitySuggestion
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            region: row.region,
            province: row.province || undefined
        }));
    } catch (err) {
        console.error('[geoRegistryService] Unexpected exception in searchCitiesByName:', err);
        return [];
    }
}

export interface ActiveContinent {
    id: string;
    name: string;
    slug: string;
}

export interface ActiveNation {
    id: string;
    name: string;
    slug: string;
    continent_id: string;
}

export interface ActiveRegion {
    id: string;
    name: string;
    slug: string;
    nation_id: string;
}

export interface ActiveTouristZone {
    id: string;
    name: string;
    slug: string;
    region_id: string;
}

/**
 * Recupera tutte le tipologie di città uniche presenti in city_template_map.
 */
export async function getUniqueCityTypes(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('city_template_map')
            .select('city_type');

        if (error) {
            console.error('[geoRegistryService] Error in getUniqueCityTypes:', error);
            return [];
        }

        return Array.from(new Set((data || []).map(t => t.city_type)));
    } catch (err) {
        console.error('[geoRegistryService] Unexpected exception in getUniqueCityTypes:', err);
        return [];
    }
}

/**
 * Recupera tutti i continenti attivi nel sistema.
 */
export async function getActiveContinents(): Promise<ActiveContinent[]> {
    try {
        const { data, error } = await supabase
            .from('active_continents')
            .select('id, name, slug');

        if (error) {
            console.error('[geoRegistryService] Error in getActiveContinents:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('[geoRegistryService] Unexpected exception in getActiveContinents:', err);
        return [];
    }
}

/**
 * Recupera tutte le nazioni attive associate a un continente.
 */
export async function getActiveNations(continentId: string): Promise<ActiveNation[]> {
    if (!continentId) return [];

    try {
        const { data, error } = await supabase
            .from('active_nations')
            .select('id, name, slug, continent_id')
            .eq('continent_id', continentId);

        if (error) {
            console.error(`[geoRegistryService] Error in getActiveNations for continent ${continentId}:`, error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error(`[geoRegistryService] Unexpected exception in getActiveNations for continent ${continentId}:`, err);
        return [];
    }
}

/**
 * Recupera tutte le regioni attive associate a una nazione.
 */
export async function getActiveRegions(nationId: string): Promise<ActiveRegion[]> {
    if (!nationId) return [];

    try {
        const { data, error } = await supabase
            .from('active_regions')
            .select('id, name, slug, nation_id')
            .eq('nation_id', nationId);

        if (error) {
            console.error(`[geoRegistryService] Error in getActiveRegions for nation ${nationId}:`, error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error(`[geoRegistryService] Unexpected exception in getActiveRegions for nation ${nationId}:`, err);
        return [];
    }
}

/**
 * Recupera tutte le zone turistiche attive associate a una regione.
 */
export async function getActiveTouristZones(regionId: string): Promise<ActiveTouristZone[]> {
    if (!regionId) return [];

    try {
        const { data, error } = await supabase
            .from('active_tourist_zones')
            .select('id, name, slug, region_id')
            .eq('region_id', regionId);

        if (error) {
            console.error(`[geoRegistryService] Error in getActiveTouristZones for region ${regionId}:`, error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error(`[geoRegistryService] Unexpected exception in getActiveTouristZones for region ${regionId}:`, err);
        return [];
    }
}
