/**
 * Risoluzione metadati entità Preferiti (guide, tour operator, shop, sponsor).
 */
import { supabase } from '@/services/supabaseClient';
import { convertSponsorToPoi } from '@/services/sponsors/sponsorResolvers';
import { mapResolvedSponsor, SPONSOR_PUBLIC_VITRINE_SELECT, normalizeJoinedSponsorRow } from '@/services/sponsors/sponsorResolvers';
import type { PointOfInterest } from '@/types/index';

export interface FavoriteEntityMeta {
  title: string;
  cityId: string | null;
}

const SPONSOR_ID_PREFIX = 'sponsor-';

export function isSponsorPoiId(id: string): boolean {
  return id.startsWith(SPONSOR_ID_PREFIX);
}

export function extractSponsorId(poiId: string): string {
  return poiId.startsWith(SPONSOR_ID_PREFIX) ? poiId.slice(SPONSOR_ID_PREFIX.length) : poiId;
}

export async function getGuidesMetaByIds(ids: string[]): Promise<Record<string, FavoriteEntityMeta>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('city_guides')
    .select('id, name, city_id')
    .in('id', unique);

  if (error) {
    console.error('[favoritesEntityRead] getGuidesMetaByIds:', error.message);
    return {};
  }

  const out: Record<string, FavoriteEntityMeta> = {};
  for (const row of data ?? []) {
    out[row.id] = { title: row.name, cityId: row.city_id };
  }
  return out;
}

export async function getTourOperatorsMetaByIds(ids: string[]): Promise<Record<string, FavoriteEntityMeta>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('city_tour_operators')
    .select('id, name, city_id')
    .in('id', unique);

  if (error) {
    console.error('[favoritesEntityRead] getTourOperatorsMetaByIds:', error.message);
    return {};
  }

  const out: Record<string, FavoriteEntityMeta> = {};
  for (const row of data ?? []) {
    out[row.id] = { title: row.name, cityId: row.city_id };
  }
  return out;
}

export async function getShopsMetaByIds(ids: string[]): Promise<Record<string, FavoriteEntityMeta>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, city_id')
    .in('id', unique);

  if (error) {
    console.error('[favoritesEntityRead] getShopsMetaByIds:', error.message);
    return {};
  }

  const out: Record<string, FavoriteEntityMeta> = {};
  for (const row of data ?? []) {
    out[row.id] = { title: row.name, cityId: row.city_id };
  }
  return out;
}

/** Risolve POI sponsor sintetici (`sponsor-{uuid}`) non presenti in tabella `pois`. */
export async function getSponsorPoisByIds(ids: string[]): Promise<PointOfInterest[]> {
  const sponsorIds = ids
    .filter(isSponsorPoiId)
    .map(extractSponsorId)
    .filter(Boolean);
  if (sponsorIds.length === 0) return [];

  const { data, error } = await supabase
    .from('sponsors')
    .select(SPONSOR_PUBLIC_VITRINE_SELECT)
    .in('id', sponsorIds);

  if (error) {
    console.error('[favoritesEntityRead] getSponsorPoisByIds:', error.message);
    return [];
  }

  return (data ?? []).map((row) => convertSponsorToPoi(mapResolvedSponsor(normalizeJoinedSponsorRow(row))));
}
