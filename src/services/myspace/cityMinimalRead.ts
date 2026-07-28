/**
 * Lettura minima città per Preferiti / Esploratore / Recap POI.
 */
import { supabase } from '@/services/supabaseClient';

export interface CityGeoMinimal {
  id: string;
  name: string;
  continent: string | null;
  nation: string | null;
  adminRegion: string | null;
  zone: string | null;
}

export async function getCitiesMinimalByIds(ids: string[]): Promise<CityGeoMinimal[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const { data, error } = await supabase
    .from('cities')
    .select('id, name, continent, nation, admin_region, zone')
    .in('id', unique);

  if (error) {
    console.error('[cityMinimalRead] getCitiesMinimalByIds:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    continent: row.continent,
    nation: row.nation,
    adminRegion: row.admin_region,
    zone: row.zone,
  }));
}

export async function searchCitiesMinimalByName(
  searchText: string,
  limit = 12,
): Promise<CityGeoMinimal[]> {
  const q = searchText.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from('cities')
    .select('id, name, continent, nation, admin_region, zone')
    .ilike('name', `${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[cityMinimalRead] searchCitiesMinimalByName:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    continent: row.continent,
    nation: row.nation,
    adminRegion: row.admin_region,
    zone: row.zone,
  }));
}
