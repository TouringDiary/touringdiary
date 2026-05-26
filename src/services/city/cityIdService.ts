import { supabase } from '../supabaseClient';

/**
 * Normalizza una stringa rimuovendo accenti, spazi multipli e caratteri speciali
 * per un confronto "puro".
 */
export const flattenString = (str: string): string => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Rimuove tutto ciò che non è alfanumerico
        .trim();
};
/**
 * Risolve l'ID canonico di una città interrogando cities_registry.
 * Segue una strategia di matching a 3 livelli per gestire caratteri speciali e separatori.
 * 
 * @throws Error "CITY_NOT_IN_REGISTRY" se non viene trovato alcun match.
 */
export async function resolveCanonicalCityId(
    name: string,
    adminRegion?: string
): Promise<string> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("CITY_NAME_EMPTY");

    // STAGE 1: Match Esatto (Case-Insensitive)
    let query = supabase
        .from('cities_registry')
        .select('id, name, region') 
        .ilike('name', cleanName);
    
    if (adminRegion) {
        query = query.eq('region', adminRegion); // Usiamo 'region' come confermato dal resto del codice
    }

    const { data: exactMatches } = await query;
    
    if (exactMatches && exactMatches.length === 1) {
        return exactMatches[0].id;
    }

    // STAGE 2: Match con Wildcard (Separatori flessibili)
    // Escapiamo i caratteri Jolly di SQL (% e _) e sostituiamo separatori con %
    const escaped = cleanName.replace(/[%_]/g, '\\$&');
    const flexiblePattern = escaped.replace(/['\-\s]+/g, '%');
    
    let flexQuery = supabase
        .from('cities_registry')
        .select('id, name, region')
        .ilike('name', flexiblePattern);

    if (adminRegion) {
        flexQuery = flexQuery.eq('region', adminRegion);
    }

    const { data: candidates } = await flexQuery;

    if (candidates && candidates.length > 0) {
        // STAGE 3: Validazione Client-side con Flattening
        const targetFlat = flattenString(cleanName);
        
        // Cerchiamo un match perfetto tra le stringhe appiattite
        const match = candidates.find(c => flattenString(c.name) === targetFlat);
        
        if (match) {
            console.log(`[CityIdService] Risolto ID canonico per "${cleanName}": ${match.id} (via stage 3)`);
            return match.id;
        }

        // Se abbiamo multipli risultati e non riusciamo a disambiguare, 
        // ma uno ha un match molto forte, potremmo prenderlo. 
        // Per ora siamo rigorosi: se Stage 3 fallisce, error.
    }

    console.error(`[CityIdService] Impossibile risolvere ID per "${cleanName}" in region "${adminRegion || 'any'}".`);
    throw new Error("CITY_NOT_IN_REGISTRY");
}

/**
 * Slug canonico da cities_registry (SSOT identità comune).
 * Fallback su cityId, allineato a mapDbCityToSummary (city_slug || slug || id).
 */
export async function getRegistryCitySlugById(cityId: string): Promise<string> {
    if (!cityId) return cityId;

    const { data, error } = await supabase
        .from('cities_registry')
        .select('slug')
        .eq('id', cityId)
        .maybeSingle();

    if (error) {
        console.warn(`[CityIdService] getRegistryCitySlugById failed for ${cityId}:`, error);
        return cityId;
    }

    return data?.slug || cityId;
}
