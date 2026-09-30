import type { DatabaseCityInsert, Json } from '../../types/database';
import type { AiZoneSuggestion, CityDeleteOptions } from '../../types/index';
import { orphanCityStaging, reclaimStagingByCityName } from '../stagingService';
import { supabase } from '../supabaseClient';
import { ensureZoneExists } from '../zoneService';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { resolveCanonicalCityId } from './cityIdService';

const throwOnError = (error: { message: string } | null | undefined, context: string): void => {
  if (error) {
    throw new Error(`[CityLifecycle] ${context}: ${error.message}`);
  }
};

type CityLifecycleRpcName = 'delete_city_admin' | 'relink_orphaned_city_content';

function cityLifecycleRpc(name: CityLifecycleRpcName, args: Record<string, unknown>) {
  const client = supabase as unknown as {
    rpc: (rpcName: string, params: Record<string, unknown>) => ReturnType<(typeof supabase)['rpc']>;
  };
  return client.rpc(name, args);
}

function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

export const reclaimOrphanedItems = async (cityId: string, cityName: string) => {
  const { data: cityMeta, error: cityMetaError } = await supabase
    .from('cities')
    .select('status')
    .eq('id', cityId)
    .maybeSingle();
  throwOnError(cityMetaError, 'select city for reclaim failed');

  if (cityMeta?.status === 'deleted_orphan') {
    const { error: relinkCityError } = await cityLifecycleRpc('relink_orphaned_city_content', {
      p_city_id: cityId,
    });
    throwOnError(relinkCityError, 'relink_orphaned_city_content failed');
  }

  // 0. RECLAIM STAGING OSM
  await reclaimStagingByCityName(cityName, cityId);

  const escapedCityName = escapeLikePattern(cityName);

  // 1. RECLAIM FOTO (Preserve status/moderation state, do not overwrite location_name, conservative exact match)
  const { error: photoError } = await supabase
    .from('photo_submissions')
    .update({
      city_id: cityId,
      updated_at: new Date().toISOString(),
    })
    .is('city_id', null)
    .ilike('location_name', escapedCityName)
    .select('id');
  throwOnError(photoError, 'reclaim photo_submissions failed');

  // 3. RECLAIM SHOPS: removed as shops.city_id is NOT NULL (no orphans exist)

  // 4. RECLAIM SPONSORS (RPC gateway — DL-022)
  const { error: relinkError } = await supabase.rpc('relink_orphaned_sponsors_to_city', {
    p_city_id: cityId,
    p_city_name: cityName,
  });
  throwOnError(relinkError, 'relink_orphaned_sponsors_to_city failed');

  // 5. RECLAIM POI (Conservative match requiring a comma separator before city name to avoid false positives)
  const { error: poisError } = await supabase
    .from('pois')
    .update({ city_id: cityId })
    .is('city_id', null)
    .ilike('address', `%, ${escapedCityName}%`);
  throwOnError(poisError, 'reclaim pois failed');
};

export const deleteCity = async (
  cityId: string,
  options: CityDeleteOptions,
  cityName: string,
): Promise<void> => {
  await orphanCityStaging(cityId, cityName);

  const { error } = await cityLifecycleRpc('delete_city_admin', {
    p_city_id: cityId,
    p_options: options,
  });
  throwOnError(error, 'delete_city_admin failed');

  clearCacheKey('manifest');
  invalidateCityCache(cityId);
};

export const importRegionalData = async (
  zones: AiZoneSuggestion[],
  selectedCities: string[],
  adminRegion: string,
): Promise<{
  createdZones: number;
  createdCities: number;
  logs: string[];
  createdItems: { id: string; name: string }[];
}> => {
  let zoneCount = 0;
  let cityCount = 0;
  const logs: string[] = [];
  const createdItems: { id: string; name: string }[] = [];

  const selectedSet = new Set(selectedCities.map((c) => c.toLowerCase().trim()));

  for (const zone of zones) {
    try {
      const result = await ensureZoneExists(zone.name, adminRegion);
      if (result.created) {
        zoneCount++;
        logs.push(result.log);
      }
    } catch {
      logs.push(`[Error] Fallita creazione zona ${zone.name}`);
    }
  }

  const { data: existingDbCities, error: existingCitiesError } = await supabase
    .from('cities')
    .select('id, name, visitors, admin_region')
    .ilike('admin_region', escapeLikePattern(adminRegion.trim()));
  throwOnError(existingCitiesError, 'select existing cities failed');

  const existingMap = new Map<string, { id: string; visitors: number }>();
  if (existingDbCities) {
    for (const c of existingDbCities) {
      const reg = c.admin_region || '';
      const key = `${c.name.toLowerCase().trim()}::${reg.toLowerCase().trim()}`;
      existingMap.set(key, { id: c.id, visitors: c.visitors || 0 });
    }
  }

  for (const zone of zones) {
    for (const city of zone.mainCities) {
      const normalizedName = city.name.toLowerCase().trim();
      const isSelected = selectedSet.has(normalizedName);

      if (isSelected) {
        const key = `${normalizedName}::${adminRegion.toLowerCase().trim()}`;
        const existing = existingMap.get(key);

        try {
          if (existing) {
            const shouldUpdateVisitors =
              city.visitors > existing.visitors || existing.visitors === 0;
            if (shouldUpdateVisitors) {
              const { error: updateError } = await supabase
                .from('cities')
                .update({
                  visitors: city.visitors,
                  zone: zone.name,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              throwOnError(updateError, `update city ${city.name} failed`);
            }

            await reclaimOrphanedItems(existing.id, city.name);
            createdItems.push({ id: existing.id, name: city.name });
          } else {
            // RISOLUZIONE ID CANONICO (Strict Registry Requirement)
            let newId: string;
            try {
              newId = await resolveCanonicalCityId(city.name, adminRegion);
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : String(err);
              if (errMsg.includes('CITY_NOT_IN_REGISTRY') || errMsg.includes('CITY_NAME_EMPTY')) {
                logs.push(
                  `[Skip] La città ${city.name} è stata saltata: non presente in cities_registry.`,
                );
                continue; // Salta questa città se non è nel registro
              }
              throw new Error(
                `[CityLifecycle] Errore tecnico nella risoluzione ID per ${city.name}: ${errMsg}`,
              );
            }

            const payload: DatabaseCityInsert = {
              id: newId,
              name: city.name,
              admin_region: adminRegion,
              zone: zone.name,
              status: 'draft',
              image_url: 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200',
              visitors: city.visitors,
              coords_lat: null,
              coords_lng: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              generation_logs: [] as Json,
            };

            const { error: insertError } = await supabase.from('cities').insert(payload);
            throwOnError(insertError, `insert city ${city.name} failed`);

            cityCount++;
            existingMap.set(`${normalizedName}::${adminRegion.toLowerCase().trim()}`, {
              id: newId,
              visitors: city.visitors,
            });

            await reclaimOrphanedItems(newId, city.name);
            createdItems.push({ id: newId, name: city.name });
          }
        } catch (e: unknown) {
          logs.push(
            `[Error] Fallita operazione su città ${city.name}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }
  }

  clearCacheKey('manifest');
  return { createdZones: zoneCount, createdCities: cityCount, logs, createdItems };
};
