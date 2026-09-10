import { calculateDistance } from '../services/geo';
import type {
  DatabasePoiInsert,
  DatabasePoiStaging,
  DatabasePoiStagingInsert,
  DatabasePoiStagingUpdate,
} from '../types/database'; // Usa Insert type per scrittura
import type { Json } from '../types/supabase';
import { getSimilarity } from '../utils/stringUtils';
import { enrichStagingPoi } from './ai/generators/poiGenerator';
import type { RatedPoiResult } from './ai/generators/qualityGenerator';
import { getCachedSetting } from './settingsService';
import { supabase } from './supabaseClient';

function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

function escapePostgrestIlike(term: string): string {
  const escaped = term.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&').replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

export interface StagingFilter {
  cityId: string;
  status?: 'new' | 'ready' | 'imported' | 'discarded' | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  aiRating?: string[];
  rawCategories?: string[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/**
 * DTO canonico per l'ingestione di dati nella tabella di staging.
 * Definisce il contratto minimo richiesto dai parser esterni.
 */
export interface StagingIngestDTO {
  osm_id: string;
  name: string;
  raw_category: string;
  coords_lat: number;
  coords_lng: number;
  address?: string;
  ai_rating?: 'high' | 'medium' | 'low';
}

// Colonne leggere per la lista
const LIGHTWEIGHT_COLS =
  'id, city_id, osm_id, name, raw_category, coords_lat, coords_lng, address, ai_rating, processing_status, created_at, updated_at';

/** Sottoinsieme di pois_staging restituito dalle query LIGHTWEIGHT_COLS. */
export type StagingPoiLightweight = {
  id: string;
  city_id: string | null;
  osm_id: string;
  name: string;
  raw_category: string | null;
  coords_lat: number;
  coords_lng: number;
  address: string | null;
  ai_rating: string | null;
  processing_status: string;
  created_at: string | null;
  updated_at: string | null;
};

function describeStagingPoiLightweightRowIssue(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'expected an object';
  if (!('id' in value) || typeof value.id !== 'string') return 'id must be a string';
  if (!('city_id' in value) || (typeof value.city_id !== 'string' && value.city_id !== null))
    return 'city_id must be a string or null';
  if (!('osm_id' in value) || typeof value.osm_id !== 'string') return 'osm_id must be a string';
  if (!('name' in value) || typeof value.name !== 'string') return 'name must be a string';
  if (
    !('raw_category' in value) ||
    (typeof value.raw_category !== 'string' && value.raw_category !== null)
  )
    return 'raw_category must be a string or null';
  if (!('coords_lat' in value) || typeof value.coords_lat !== 'number')
    return 'coords_lat must be a finite number';
  if (!Number.isFinite(value.coords_lat)) return 'coords_lat must be a finite number';
  if (!('coords_lng' in value) || typeof value.coords_lng !== 'number')
    return 'coords_lng must be a finite number';
  if (!Number.isFinite(value.coords_lng)) return 'coords_lng must be a finite number';
  if (!('address' in value) || (typeof value.address !== 'string' && value.address !== null))
    return 'address must be a string or null';
  if (!('ai_rating' in value) || (typeof value.ai_rating !== 'string' && value.ai_rating !== null))
    return 'ai_rating must be a string or null';
  if (!('processing_status' in value) || typeof value.processing_status !== 'string')
    return 'processing_status must be a string';
  if (
    !('created_at' in value) ||
    (typeof value.created_at !== 'string' && value.created_at !== null)
  )
    return 'created_at must be a string or null';
  if (
    !('updated_at' in value) ||
    (typeof value.updated_at !== 'string' && value.updated_at !== null)
  )
    return 'updated_at must be a string or null';
  return null;
}

function isStagingPoiLightweightRow(value: unknown): value is StagingPoiLightweight {
  return describeStagingPoiLightweightRowIssue(value) === null;
}

function parseStagingPoiLightweightRows(data: unknown): StagingPoiLightweight[] {
  if (!Array.isArray(data)) {
    throw new Error('[Staging] Expected an array of lightweight staging rows');
  }

  return data.map((row, index) => {
    if (!isStagingPoiLightweightRow(row)) {
      const issue = describeStagingPoiLightweightRowIssue(row) ?? 'unknown validation failure';
      throw new Error(`[Staging] Invalid lightweight staging row at index ${index}: ${issue}`);
    }
    return row;
  });
}

export const getDistinctRawCategories = async (cityId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('pois_staging')
    .select('raw_category')
    .eq('city_id', cityId);

  if (error) {
    throw new Error(`[Staging] getDistinctRawCategories failed: ${error.message}`);
  }
  if (!data) return [];

  const uniqueCats = new Set<string>();
  data.forEach((row) => {
    if (row.raw_category) {
      uniqueCats.add(row.raw_category);
    }
  });

  return Array.from(uniqueCats).sort();
};

export const getStagingPois = async ({
  cityId,
  status = 'all',
  search = '',
  page = 1,
  pageSize = 50,
  aiRating = [],
  rawCategories = [],
  sortBy = 'created_at',
  sortDir = 'desc',
}: StagingFilter) => {
  let query = supabase
    .from('pois_staging')
    .select(LIGHTWEIGHT_COLS, { count: 'exact' }) // USO COLONNE LEGGERE
    .eq('city_id', cityId);

  if (status !== 'all') {
    query = query.eq('processing_status', status);
  }

  if (search) {
    const escaped = escapePostgrestIlike(search);
    query = query.or(`name.ilike.${escaped},address.ilike.${escaped}`);
  }

  if (aiRating && aiRating.length > 0) {
    query = query.in('ai_rating', aiRating);
  }

  if (rawCategories && rawCategories.length > 0) {
    query = query.in('raw_category', rawCategories);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) {
    console.error('Error fetching staging POIs:', error);
    throw error;
  }

  return { data: parseStagingPoiLightweightRows(data), count: count || 0 };
};

export const getAllStagingPois = async ({
  cityId,
  status = 'all',
  search = '',
  aiRating = [],
  rawCategories = [],
}: Omit<StagingFilter, 'page' | 'pageSize'>): Promise<StagingPoiLightweight[]> => {
  let query = supabase
    .from('pois_staging')
    .select(LIGHTWEIGHT_COLS) // USO COLONNE LEGGERE
    .eq('city_id', cityId);

  if (status !== 'all') {
    query = query.eq('processing_status', status);
  }

  if (search) {
    const escaped = escapePostgrestIlike(search);
    query = query.or(`name.ilike.${escaped},address.ilike.${escaped}`);
  }

  if (aiRating && aiRating.length > 0) {
    query = query.in('ai_rating', aiRating);
  }

  if (rawCategories && rawCategories.length > 0) {
    query = query.in('raw_category', rawCategories);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`[Staging] getAllStagingPois failed: ${error.message}`);
  }

  return parseStagingPoiLightweightRows(data);
};

export const getAllStagingIds = async ({
  cityId,
  status = 'all',
  search = '',
  aiRating = [],
  rawCategories = [],
}: Omit<StagingFilter, 'page' | 'pageSize'>): Promise<string[]> => {
  let queryBase = supabase.from('pois_staging').select('id').eq('city_id', cityId);

  if (status !== 'all') {
    queryBase = queryBase.eq('processing_status', status);
  }

  if (search) {
    const escaped = escapePostgrestIlike(search);
    queryBase = queryBase.or(`name.ilike.${escaped},address.ilike.${escaped}`);
  }

  if (aiRating && aiRating.length > 0) {
    queryBase = queryBase.in('ai_rating', aiRating);
  }

  if (rawCategories && rawCategories.length > 0) {
    queryBase = queryBase.in('raw_category', rawCategories);
  }

  const allIds: string[] = [];
  let from = 0;
  const PAGE_SIZE = 2000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBase.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching all staging IDs:', error);
      throw new Error(`[Staging] Error fetching all staging IDs: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allIds.push(...data.map((r) => r.id));
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    }
  }

  return allIds;
};

// FIX: Chunked fetch per evitare errori "Bad Request" su URL troppo lunghi
export const getStagingItemsByIds = async (ids: string[]): Promise<DatabasePoiStaging[]> => {
  if (ids.length === 0) return [];

  // Divide in chunk da 50 per stare sicuri nei limiti URL
  const CHUNK_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }

  let allData: DatabasePoiStaging[] = [];

  // Esegue le chiamate in parallelo per velocità
  const promises = chunks.map((chunk) =>
    supabase
      .from('pois_staging')
      .select('*') // Qui scarichiamo tutto perché serve per il processamento AI/Publish
      .in('id', chunk),
  );

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result.error) {
      throw new Error(`[Staging] getStagingItemsByIds chunk failed: ${result.error.message}`);
    }
    if (result.data) {
      allData = [...allData, ...result.data];
    }
  }

  return allData;
};

export const saveStagingBatch = async (cityId: string, rawItems: StagingIngestDTO[]) => {
  if (rawItems.length === 0) return { inserted: 0, error: null };

  const payload: DatabasePoiStagingInsert[] = rawItems.map((item) => ({
    city_id: cityId,
    osm_id: item.osm_id,
    name: item.name,
    raw_category: item.raw_category,
    coords_lat: item.coords_lat,
    coords_lng: item.coords_lng,
    address: item.address || null,
    ai_rating: item.ai_rating || 'medium',
    processing_status: 'new',
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('pois_staging')
    .upsert(payload, { onConflict: 'city_id,osm_id' });

  if (error) {
    console.error('Batch save error:', error);
    return { inserted: 0, error };
  }

  return { inserted: rawItems.length, error: null };
};

export const updateStagingAiRatings = async (results: RatedPoiResult[]) => {
  if (results.length === 0) return;
  const updates = results.map((item) => {
    const newStatus = item.rating === 'discard' ? 'discarded' : 'ready';
    const dbRating = item.rating === 'discard' ? 'low' : item.rating;
    return supabase
      .from('pois_staging')
      .update({
        ai_rating: dbRating,
        processing_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
  });
  const updateResults = await Promise.all(updates);
  for (const updateResult of updateResults) {
    if (updateResult.error) {
      throw new Error(`[Staging] updateStagingAiRatings failed: ${updateResult.error.message}`);
    }
  }
};

export const updateStagingStatus = async (
  ids: string[],
  status: 'new' | 'ready' | 'imported' | 'discarded',
) => {
  const { error } = await supabase
    .from('pois_staging')
    .update({
      processing_status: status,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);
  if (error) throw error;
};

export const deleteStagingPois = async (ids: string[]) => {
  const { error } = await supabase.from('pois_staging').delete().in('id', ids);
  if (error) throw error;
};

export const clearCityStaging = async (cityId: string): Promise<number> => {
  const { error, count } = await supabase
    .from('pois_staging')
    .delete({ count: 'exact' })
    .eq('city_id', cityId);

  if (error) throw error;
  return count || 0;
};

// --- GESTIONE ORFANI SICURA (TAGGING) ---

// 1. Marca gli item come orfani con il nome della città (colonna dedicata)
// 2. Rimuove city_id
export const orphanCityStaging = async (cityId: string, cityName: string): Promise<void> => {
  // Step 1: Tagga con il nome città (Safe Identification)
  const { error: tagError } = await supabase
    .from('pois_staging')
    .update({ orphan_city_tag: cityName })
    .eq('city_id', cityId);
  if (tagError) {
    throw new Error(`[Staging] Tagging pois_staging failed: ${tagError.message}`);
  }

  // Step 2: Rendi orfani (city_id = null)
  const orphanUpdate: DatabasePoiStagingUpdate = { city_id: null };
  const { error: orphanError } = await supabase
    .from('pois_staging')
    .update(orphanUpdate)
    .eq('city_id', cityId);
  if (orphanError) {
    throw new Error(`[Staging] Orphaning pois_staging failed: ${orphanError.message}`);
  }
};

// Recupera gli orfani basandosi sul tag esatto, non sull'indirizzo vago
export const reclaimStagingByCityName = async (
  cityName: string,
  newCityId: string,
): Promise<number> => {
  const escapedCityName = escapeLikePattern(cityName.trim());
  // Cerca per tag esatto (Case insensitive per sicurezza)
  const { data, error } = await supabase
    .from('pois_staging')
    .update({
      city_id: newCityId,
      orphan_city_tag: null, // Pulisce il tag
    })
    .is('city_id', null)
    .ilike('orphan_city_tag', escapedCityName)
    .select('*');

  if (error) {
    throw new Error(`[Staging] Reclaiming staging failed: ${error.message}`);
  }
  return data ? data.length : 0;
};

export const getStagingStats = async (cityId: string) => {
  const { data: all, error } = await supabase
    .from('pois_staging')
    .select('processing_status')
    .eq('city_id', cityId);

  if (error) {
    throw new Error(`[Staging] getStagingStats failed: ${error.message}`);
  }
  const stats: Record<'new' | 'ready' | 'imported' | 'discarded', number> = {
    new: 0,
    ready: 0,
    imported: 0,
    discarded: 0,
  };
  all?.forEach((row) => {
    const status = row.processing_status as keyof typeof stats;
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });
  return stats;
};

interface StagingComparisonItem {
  id: string;
  osm_id: string;
  name: string;
  coords_lat: number;
  coords_lng: number;
  raw_category: string | null;
  address: string | null;
}

// --- ALGORITMO DI DEDUPLICA (SMART) ---
export const deduplicateStagingData = async (cityId: string): Promise<number> => {
  try {
    // 1. Scarica tutti i dati staging della città (solo colonne per confronto)
    const { data, error } = await supabase
      .from('pois_staging')
      .select('id, osm_id, name, coords_lat, coords_lng, raw_category, address')
      .eq('city_id', cityId);

    if (error) {
      throw new Error(`[Staging] Failed to load data for deduplication: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Mappatura esplicita e semanticamente sicura (evita typing trust-based su select)
    const allItems: StagingComparisonItem[] = data.map((row) => ({
      id: row.id,
      osm_id: row.osm_id,
      name: row.name,
      coords_lat: row.coords_lat,
      coords_lng: row.coords_lng,
      raw_category: row.raw_category,
      address: row.address,
    }));

    const toDeleteIds = new Set<string>();
    const processedIds = new Set<string>();

    // Algoritmo deterministico per calcolare la "Ricchezza Dati" (Data Quality Score)
    const getDataScore = (item: StagingComparisonItem): number => {
      let score = 0;
      if (item.address && item.address.length > 5) score += 2;
      if (item.raw_category && item.raw_category !== 'unknown') score += 1;
      if (item.name && item.name.length > 3) score += 1;
      return score;
    };

    // 2. Loop di confronto O(N^2) ottimizzato
    for (let i = 0; i < allItems.length; i++) {
      const current = allItems[i];

      if (toDeleteIds.has(current.id) || processedIds.has(current.id)) continue;
      processedIds.add(current.id);

      // Trova duplicati di questo item
      const duplicates = allItems.filter((other, j) => {
        if (i === j) return false;
        if (toDeleteIds.has(other.id)) return false;

        // Criterio 1: Stesso OSM ID (Hard Duplicate)
        if (current.osm_id && other.osm_id && current.osm_id === other.osm_id) return true;

        // Criterio 2: Vicinanza (< 20 metri) + Nome Simile (> 80%)
        const dist =
          calculateDistance(
            current.coords_lat,
            current.coords_lng,
            other.coords_lat,
            other.coords_lng,
          ) * 1000; // metri
        if (dist < 20) {
          const similarity = getSimilarity(current.name, other.name);
          return similarity > 0.8;
        }
        return false;
      });

      if (duplicates.length > 0) {
        // Abbiamo un gruppo di duplicati. Troviamo il "Vincitore"
        const group = [current, ...duplicates];

        // Ordina per punteggio ricchezza decrescente
        group.sort((a, b) => getDataScore(b) - getDataScore(a));

        // Il primo è il vincitore, gli altri si cancellano

        for (let k = 1; k < group.length; k++) {
          toDeleteIds.add(group[k].id);
        }
      }
    }

    // 3. Esegui cancellazione massiva
    if (toDeleteIds.size > 0) {
      const ids = Array.from(toDeleteIds);
      const CHUNK = 500;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const { error: deleteError } = await supabase
          .from('pois_staging')
          .delete()
          .in('id', ids.slice(i, i + CHUNK));
        if (deleteError) {
          throw new Error(`[Staging] Chunked delete failed: ${deleteError.message}`);
        }
      }
    }

    return toDeleteIds.size;
  } catch (e) {
    console.error('[Staging] Deduplication error:', e);
    throw e;
  }
};

export const promoteToLive = async (
  stagingItem: DatabasePoiStaging,
  cityName: string,
  useSearch: boolean = false,
): Promise<boolean> => {
  try {
    if (!stagingItem.city_id) {
      throw new Error(`[Staging] Cannot promote orphaned staging item ${stagingItem.id}`);
    }

    if (typeof stagingItem.osm_id !== 'string' || stagingItem.osm_id.trim().length === 0) {
      throw new Error(`[Staging] Invalid osm_id for staging item ${stagingItem.id}`);
    }

    // 1. Arricchimento AI
    const enriched = await enrichStagingPoi(
      stagingItem.name,
      cityName,
      stagingItem.raw_category,
      useSearch,
    );

    // 2. Determinazione Placeholder
    const category = enriched.category || 'discovery';
    const placeholderImg = category ? getCachedSetting<string>(category) : null;

    // 3. Costruzione Oggetto POI Finale (Type Safe)
    const finalAddress = enriched.address ?? stagingItem.address ?? null;
    const finalStatus = 'draft';
    const stagingInterest = stagingItem.ai_rating || 'medium';

    const safeOsmId = stagingItem.osm_id.replace(/[^A-Za-z0-9_-]/g, '_');

    const newPoi: DatabasePoiInsert = {
      id: `osm_${safeOsmId}`,
      city_id: stagingItem.city_id,
      name: stagingItem.name,

      category: category,
      sub_category: enriched.rawSubCategory || stagingItem.raw_category || 'generic',

      description: enriched.description || `Luogo di interesse a ${cityName}.`,

      coords_lat: stagingItem.coords_lat,
      coords_lng: stagingItem.coords_lng,
      address: finalAddress,

      visit_duration: enriched.visitDuration || '1h',
      price_level: enriched.priceLevel || 1,

      tourism_interest: stagingInterest,
      ai_reliability: useSearch ? 'high' : 'medium',

      image_url: placeholderImg || '',
      rating: 0,
      votes: 0,
      status: finalStatus, // Forced Draft
      date_added: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      is_sponsored: false,
      tier: null,
      opening_hours: null,
      affiliate: null,
      link_metadata: null,
      showcase_expiry: null,
      created_by: 'Import System',
      updated_by: useSearch ? 'AI Pro + Search' : 'AI Flash',

      last_verified: new Date().toISOString(),
    };

    // 4. Promozione atomica (POI upsert + staging imported in un'unica transazione DB)
    const p_poi: Json = {
      id: newPoi.id,
      city_id: newPoi.city_id,
      name: newPoi.name,
      category: newPoi.category,
      sub_category: newPoi.sub_category,
      description: newPoi.description,
      coords_lat: newPoi.coords_lat,
      coords_lng: newPoi.coords_lng,
      address: newPoi.address,
      visit_duration: newPoi.visit_duration,
      price_level: newPoi.price_level,
      tourism_interest: newPoi.tourism_interest,
      ai_reliability: newPoi.ai_reliability,
      image_url: newPoi.image_url,
      rating: newPoi.rating,
      votes: newPoi.votes,
      status: newPoi.status,
      date_added: newPoi.date_added,
      created_at: newPoi.created_at,
      updated_at: newPoi.updated_at,
      is_sponsored: newPoi.is_sponsored,
      tier: newPoi.tier,
      opening_hours: newPoi.opening_hours,
      affiliate: newPoi.affiliate,
      link_metadata: newPoi.link_metadata,
      showcase_expiry: newPoi.showcase_expiry,
      created_by: newPoi.created_by,
      updated_by: newPoi.updated_by,
      last_verified: newPoi.last_verified,
    };

    const { error: rpcError } = await supabase.rpc('promote_staging_poi_to_live', {
      p_staging_id: stagingItem.id,
      p_poi,
    });

    if (rpcError) {
      throw new Error(`[Staging] Atomic promote failed for ${stagingItem.id}: ${rpcError.message}`);
    }

    return true;
  } catch (e) {
    console.error(`Failed to promote item ${stagingItem.name}:`, e);
    return false;
  }
};
