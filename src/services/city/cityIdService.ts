import { supabase } from '../supabaseClient';

/**
 * Normalizza una stringa rimuovendo accenti, spazi multipli e caratteri speciali
 * per un confronto "puro".
 */
export const flattenString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Rimuove tutto ciò che non è alfanumerico
    .trim();
};

/** Escapes SQL LIKE wildcards (\, % and _) so they can be matched literally in ILIKE queries */
function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}
/**
 * Risolve l'ID canonico di una città interrogando cities_registry.
 * Segue una strategia di matching a 3 livelli per gestire caratteri speciali e separatori.
 *
 * @throws Error "CITY_NOT_IN_REGISTRY" se non viene trovato alcun match.
 */
export async function resolveCanonicalCityId(name: string, adminRegion?: string): Promise<string> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('CITY_NAME_EMPTY');

  // STAGE 1: Match Esatto (Case-Insensitive)
  // We escape SQL LIKE wildcards so that % and _ match literally
  const escapedExactName = escapeLikePattern(cleanName);
  let query = supabase
    .from('cities_registry')
    .select('id, name, region')
    .ilike('name', escapedExactName);

  if (adminRegion) {
    query = query.eq('region', adminRegion); // Usiamo 'region' come confermato dal resto del codice
  }

  const { data: exactMatches, error: err1 } = await query;
  if (err1) {
    throw new Error(`REGISTRY_DATABASE_ERROR: ${err1.message}`);
  }

  if (exactMatches && exactMatches.length === 1) {
    return exactMatches[0].id;
  }

  // STAGE 2: Match con Wildcard (Separatori flessibili)
  // Split the name by separators, escape SQL wildcards in the parts, and join with '%'
  const parts = cleanName.split(/['\-\s]+/);
  const flexiblePattern = parts.map(escapeLikePattern).join('%');

  let flexQuery = supabase
    .from('cities_registry')
    .select('id, name, region')
    .ilike('name', flexiblePattern);

  if (adminRegion) {
    flexQuery = flexQuery.eq('region', adminRegion);
  }

  const { data: candidates, error: err2 } = await flexQuery;
  if (err2) {
    throw new Error(`REGISTRY_DATABASE_ERROR: ${err2.message}`);
  }

  if (candidates && candidates.length > 0) {
    // STAGE 3: Validazione Client-side con Flattening
    const targetFlat = flattenString(cleanName);

    // Cerchiamo tutti i candidati il cui flattenString(c.name) === targetFlat
    const matches = candidates.filter((c) => flattenString(c.name) === targetFlat);

    if (matches.length === 1) {
      const match = matches[0];
      console.log(
        `[CityIdService] Risolto ID canonico per "${cleanName}": ${match.id} (via stage 3)`,
      );
      return match.id;
    }

    if (matches.length > 1) {
      console.warn(
        `[CityIdService] Risoluzione ambigua per "${cleanName}": trovati ${matches.length} match con lo stesso flattening.`,
      );
      // Considera il risultato ambiguo e non restituire un ID (continua verso CITY_NOT_IN_REGISTRY)
    }
  }

  console.error(
    `[CityIdService] Impossibile risolvere ID per "${cleanName}" in region "${adminRegion || 'any'}".`,
  );
  throw new Error('CITY_NOT_IN_REGISTRY');
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
