import type {
  AnomalyRecord,
  CityQualityStats,
  ObservatoryStats,
  PointOfInterest,
} from '../types/index';
import type { Json } from '../types/supabase';
import { supabase } from './supabaseClient';

/**
 * Recupera le statistiche aggregate dell'osservatorio tramite RPC.
 * Questo è molto più veloce che fare query count separate.
 */
export const getObservatoryStats = async (): Promise<ObservatoryStats | null> => {
  try {
    const { data, error } = await supabase.rpc('get_observatory_stats');

    if (error) {
      console.error('[Observatory] Error fetching stats:', error);
      // Fallback locale in caso di errore RPC (es. funzione non ancora creata)
      return null;
    }

    return data as unknown as ObservatoryStats;
  } catch (e) {
    console.error('[Observatory] Exception:', e);
    return null;
  }
};

/**
 * Recupera la lista delle anomalie dalla vista dedicata.
 * - Con `limit`: singolo batch (al più `limit` record).
 * - Senza `limit`: paginazione `.range` fino a esaurimento (dataset completo per Inspector).
 */
export const getAnomalies = async (limit?: number): Promise<AnomalyRecord[]> => {
  try {
    if (limit != null) {
      const { data, error } = await supabase.from('obs_poi_anomalies').select('*').limit(limit);
      if (error) throw error;
      return (data ?? []) as AnomalyRecord[];
    }

    // Ordinamento stabile su `id` (campo AnomalyRecord / Row di obs_poi_anomalies).
    // Senza order, .range può saltare/duplicare righe tra pagine.
    const pageSize = 1000;
    const all: AnomalyRecord[] = [];
    let from = 0;

    for (;;) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('obs_poi_anomalies')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const batch = (data ?? []) as AnomalyRecord[];
      all.push(...batch);

      if (batch.length < pageSize) break;
      from += pageSize;
    }

    return all;
  } catch (e) {
    console.error('[Observatory] Error fetching anomalies:', e);
    return [];
  }
};

/**
 * Recupera la griglia DETTAGLIATA con le metriche per ogni città.
 * Usa la nuova funzione RPC get_detailed_city_stats.
 */
export const getCityQualityMetrics = async (): Promise<CityQualityStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_detailed_city_stats');

    if (error) throw error;

    return data as CityQualityStats[];
  } catch (e) {
    console.error('[Observatory] Error fetching city metrics:', e);
    return [];
  }
};

function buildSurvivorEnrichmentPayload(survivor: PointOfInterest, victim: PointOfInterest): Json {
  const enrichment: Record<string, Json> = {};

  if (!survivor.description && victim.description) {
    enrichment.description = victim.description;
  }
  if (!survivor.address && victim.address) {
    enrichment.address = victim.address;
  }
  if (!survivor.visitDuration && victim.visitDuration) {
    enrichment.visit_duration = victim.visitDuration;
  }
  if (
    (!survivor.priceLevel || survivor.priceLevel === 1) &&
    victim.priceLevel &&
    victim.priceLevel > 1
  ) {
    enrichment.price_level = victim.priceLevel;
  }

  if (victim.affiliate && Object.keys(victim.affiliate).length > 0) {
    const mergedAffiliate = { ...victim.affiliate, ...survivor.affiliate };
    if (JSON.stringify(mergedAffiliate) !== JSON.stringify(survivor.affiliate)) {
      enrichment.affiliate = mergedAffiliate as Json;
    }
  }

  return enrichment;
}

/**
 * Esegue il MERGE di due POI (D90 server-side).
 * Transazione unica: reviews, suggestions, arricchimento survivor, immagini + DELETE victim.
 */
export const mergePoisInDb = async (
  survivor: PointOfInterest,
  victim: PointOfInterest,
): Promise<boolean> => {
  if (survivor.id === victim.id) {
    console.error('[Observatory] Merge error: survivor e victim coincidono.');
    return false;
  }

  if (survivor.cityId !== victim.cityId) {
    console.error(
      '[Observatory] Merge error: merge intra-city richiesto.',
      survivor.cityId,
      victim.cityId,
    );
    return false;
  }

  const enrichment = buildSurvivorEnrichmentPayload(survivor, victim);

  const { error } = await supabase.rpc('merge_pois_observatory_atomic', {
    p_survivor_id: survivor.id,
    p_victim_id: victim.id,
    p_enrichment: enrichment as Json,
  });

  if (error) {
    console.error('[Observatory] Merge error (merge_pois_observatory_atomic):', error.message);
    return false;
  }

  return true;
};
