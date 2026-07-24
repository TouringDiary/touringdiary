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
 * @param signal Optional AbortSignal — cancels the in-flight PostgREST request when the caller supersedes it
 */
export async function getCityNameById(
    cityId: string,
    signal?: AbortSignal
): Promise<string | null> {
    try {
        if (signal?.aborted) return null;

        let query = supabase
            .from('cities_registry')
            .select('name')
            .eq('id', cityId);

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query.maybeSingle();

        if (signal?.aborted) return null;

        if (error) {
            // Abort is not a failure worth logging.
            if (error.name === 'AbortError' || signal?.aborted) return null;
            console.error(`[geoRegistryService] Error in getCityNameById for ${cityId}:`, error);
            return null;
        }

        return data?.name || null;
    } catch (err) {
        if (signal?.aborted) return null;
        if (err instanceof DOMException && err.name === 'AbortError') return null;
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
 * View rows from Supabase expose nullable columns even when the underlying
 * geo tables are NOT NULL. Domain Active* records require complete strings —
 * drop incomplete rows instead of widening the domain or asserting.
 */
function toActiveContinent(row: {
    id: string | null;
    name: string | null;
    slug: string | null;
}): ActiveContinent | null {
    if (!row.id || !row.name || !row.slug) return null;
    return { id: row.id, name: row.name, slug: row.slug };
}

function toActiveNation(row: {
    id: string | null;
    name: string | null;
    slug: string | null;
    continent_id: string | null;
}): ActiveNation | null {
    if (!row.id || !row.name || !row.slug || !row.continent_id) return null;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        continent_id: row.continent_id,
    };
}

function toActiveRegion(row: {
    id: string | null;
    name: string | null;
    slug: string | null;
    nation_id: string | null;
}): ActiveRegion | null {
    if (!row.id || !row.name || !row.slug || !row.nation_id) return null;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        nation_id: row.nation_id,
    };
}

function toActiveTouristZone(row: {
    id: string | null;
    name: string | null;
    slug: string | null;
    region_id: string | null;
}): ActiveTouristZone | null {
    if (!row.id || !row.name || !row.slug || !row.region_id) return null;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        region_id: row.region_id,
    };
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

        return (data ?? []).flatMap((row) => {
            const mapped = toActiveContinent(row);
            return mapped ? [mapped] : [];
        });
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

        return (data ?? []).flatMap((row) => {
            const mapped = toActiveNation(row);
            return mapped ? [mapped] : [];
        });
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

        return (data ?? []).flatMap((row) => {
            const mapped = toActiveRegion(row);
            return mapped ? [mapped] : [];
        });
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

        return (data ?? []).flatMap((row) => {
            const mapped = toActiveTouristZone(row);
            return mapped ? [mapped] : [];
        });
    } catch (err) {
        console.error(`[geoRegistryService] Unexpected exception in getActiveTouristZones for region ${regionId}:`, err);
        return [];
    }
}
