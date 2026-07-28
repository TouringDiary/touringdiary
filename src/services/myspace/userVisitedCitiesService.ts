/**
 * Esploratore — archivio città visitate (DOC 35 §8 / PV-005).
 * Aggiunta automatica da Viaggi; rimozione solo manuale.
 * Delete Viaggio non elimina le città visitate (nessuna FK verso viaggi).
 */
import { supabase } from '@/services/supabaseClient';
import { listViaggiByUser } from '@/services/viaggio/viaggioService';
import { listCityIdsForViaggio, listCityIdsForViaggi } from '@/services/viaggio/viaggioCityService';

export type VisitedCitySource = 'auto' | 'manual';

export interface UserVisitedCity {
  userId: string;
  cityId: string;
  firstSeenAt: string;
  source: VisitedCitySource;
}

function mapRow(row: {
  user_id: string;
  city_id: string;
  first_seen_at: string;
  source: string;
}): UserVisitedCity | null {
  if (row.source !== 'auto' && row.source !== 'manual') return null;
  return {
    userId: row.user_id,
    cityId: row.city_id,
    firstSeenAt: row.first_seen_at,
    source: row.source,
  };
}

export async function listVisitedCities(userId: string): Promise<UserVisitedCity[]> {
  const { data, error } = await supabase
    .from('user_visited_cities')
    .select('user_id, city_id, first_seen_at, source')
    .eq('user_id', userId)
    .order('first_seen_at', { ascending: false });

  if (error) {
    console.error('[userVisitedCitiesService] listVisitedCities:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapRow)
    .filter((row): row is UserVisitedCity => row !== null);
}

/** Upsert auto: non sovrascrive first_seen_at / source se già presente. */
export async function ensureVisitedCitiesAuto(
  userId: string,
  cityIds: string[],
): Promise<void> {
  const unique = [...new Set(cityIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  const rows = unique.map((cityId) => ({
    user_id: userId,
    city_id: cityId,
    source: 'auto' as const,
  }));

  const { error } = await supabase.from('user_visited_cities').upsert(rows, {
    onConflict: 'user_id,city_id',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('[userVisitedCitiesService] ensureVisitedCitiesAuto:', error.message);
  }
}

/** Sync da tutti i Viaggi dell’utente (città destination ∪ diary items). */
export async function syncVisitedCitiesFromUserViaggi(userId: string): Promise<void> {
  const viaggi = await listViaggiByUser(userId, 'updated_at');
  const cityIds = await listCityIdsForViaggi(viaggi);
  await ensureVisitedCitiesAuto(userId, cityIds);
}

/** Sync da un singolo Viaggio (apertura cartella). */
export async function syncVisitedCitiesFromViaggio(
  userId: string,
  viaggioId: string,
  destination: string | null,
): Promise<void> {
  const ids = await listCityIdsForViaggio(viaggioId, destination);
  await ensureVisitedCitiesAuto(userId, ids);
}

export async function removeVisitedCity(userId: string, cityId: string): Promise<boolean> {
  const id = cityId.trim();
  if (!id) return false;

  const { error } = await supabase
    .from('user_visited_cities')
    .delete()
    .eq('user_id', userId)
    .eq('city_id', id);

  if (error) {
    console.error('[userVisitedCitiesService] removeVisitedCity:', error.message);
    return false;
  }
  return true;
}
