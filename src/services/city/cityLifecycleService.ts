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

function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

export const reclaimOrphanedItems = async (cityId: string, cityName: string) => {
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
  // Non-atomic client cascade: no DB RPC for full city delete exists.
  // Steps run sequentially; a mid-flight failure leaves prior deletions applied.
  // Callers must treat thrown errors as partial-delete and retry/reconcile.

  // PRE-CLEANUP (Staging Orphans con Tagging Sicuro) — mandatory pre-condition to avoid FK violations
  await orphanCityStaging(cityId, cityName);

  // 1. MEDIA
  if (options.keepUserPhotos) {
    const { error } = await supabase
      .from('photo_submissions')
      .update({ city_id: null, status: 'city_deleted', updated_at: new Date().toISOString() })
      .eq('city_id', cityId);
    throwOnError(error, 'orphan photo_submissions failed');
  } else {
    const { error } = await supabase.from('photo_submissions').delete().eq('city_id', cityId);
    throwOnError(error, 'delete photo_submissions failed');
  }

  // 2. BUSINESS — SPONSORS & NO ACTION FK NULLING
  // Fetch IDs of guides, operators, POIs, and shops belonging to this city
  const [guidesRes, operatorsRes, poisRes, shopsRes] = await Promise.all([
    supabase.from('city_guides').select('id').eq('city_id', cityId),
    supabase.from('city_tour_operators').select('id').eq('city_id', cityId),
    supabase.from('pois').select('id').eq('city_id', cityId),
    supabase.from('shops').select('id').eq('city_id', cityId),
  ]);

  throwOnError(guidesRes.error, 'select city_guides failed');
  throwOnError(operatorsRes.error, 'select city_tour_operators failed');
  throwOnError(poisRes.error, 'select pois failed');
  throwOnError(shopsRes.error, 'select shops failed');

  const guideIds = (guidesRes.data || []).map((x) => x.id);
  const operatorIds = (operatorsRes.data || []).map((x) => x.id);
  const poiIds = (poisRes.data || []).map((x) => x.id);
  const shopIds = (shopsRes.data || []).map((x) => x.id);

  // Nullify FKs on sponsors linked to this city's guides, operators, POIs, or shops
  // to avoid ON DELETE NO ACTION violations on sponsors.guide_id, sponsors.operator_id, etc.
  const { error: sponsorsNullError } = await supabase
    .from('sponsors')
    .update({
      guide_id: null,
      operator_id: null,
      poi_id: null,
      shop_id: null,
    })
    .eq('city_id', cityId);
  throwOnError(sponsorsNullError, 'nulling sponsors FKs by city_id failed');

  if (guideIds.length > 0) {
    const { error } = await supabase
      .from('sponsors')
      .update({ guide_id: null })
      .in('guide_id', guideIds);
    throwOnError(error, 'nulling sponsors guide_id failed');
  }

  if (operatorIds.length > 0) {
    const { error } = await supabase
      .from('sponsors')
      .update({ operator_id: null })
      .in('operator_id', operatorIds);
    throwOnError(error, 'nulling sponsors operator_id failed');
  }

  if (poiIds.length > 0) {
    const { error } = await supabase.from('sponsors').update({ poi_id: null }).in('poi_id', poiIds);
    throwOnError(error, 'nulling sponsors poi_id failed');
  }

  if (shopIds.length > 0) {
    const { error } = await supabase
      .from('sponsors')
      .update({ shop_id: null })
      .in('shop_id', shopIds);
    throwOnError(error, 'nulling sponsors shop_id failed');
  }

  // Detach sponsors from the city via the SECURITY DEFINER RPC (DL-022)
  // This transitions active sponsors of this city to 'Da ricollegare' by setting city_id = null and last_city_id = city_id.
  const { error: sponsorDetachError } = await supabase.rpc('handle_city_deleted_for_sponsors', {
    p_city_id: cityId,
  });
  throwOnError(sponsorDetachError, 'handle_city_deleted_for_sponsors failed');

  // Always delete shops because shops.city_id is NOT NULL (cannot be orphaned).
  // Associated shop_products are automatically deleted via DB ON DELETE CASCADE.
  const { error: shopsDeleteError } = await supabase.from('shops').delete().eq('city_id', cityId);
  throwOnError(shopsDeleteError, 'delete shops failed');

  // 3. PEOPLE — city_id NOT NULL: always DELETE (no keepPeople / no orphan).
  // Delete photo reports, photo suggestions, and person suggestions first to prevent ON DELETE RESTRICT violations on person_id.
  const { error: photoReportsDeleteError } = await supabase
    .from('famous_person_photo_reports')
    .delete()
    .eq('city_id', cityId);
  throwOnError(photoReportsDeleteError, 'delete famous_person_photo_reports failed');

  const { error: photoSuggestionsDeleteError } = await supabase
    .from('famous_person_photo_suggestions')
    .delete()
    .eq('city_id', cityId);
  throwOnError(photoSuggestionsDeleteError, 'delete famous_person_photo_suggestions failed');

  const { error: personSuggestionsDeleteError } = await supabase
    .from('famous_person_suggestions')
    .delete()
    .eq('city_id', cityId);
  throwOnError(personSuggestionsDeleteError, 'delete famous_person_suggestions failed');

  const { error: peopleError } = await supabase.from('city_people').delete().eq('city_id', cityId);
  if (peopleError) {
    throw new Error(
      `[CityLifecycle] Impossibile eliminare i personaggi della città (${cityId}): ${peopleError.message}.`,
    );
  }

  // 4. POI
  const { data: pois, error: poisSelectError } = await supabase
    .from('pois')
    .select('id')
    .eq('city_id', cityId);
  throwOnError(poisSelectError, 'select pois failed');

  if (pois && pois.length > 0) {
    const poiIds = pois.map((p) => p.id);

    if (options.keepPOIs) {
      const { error } = await supabase.from('pois').update({ city_id: null }).eq('city_id', cityId);
      throwOnError(error, 'orphan pois failed');
    } else {
      const { error: reviewsError } = await supabase.from('reviews').delete().in('poi_id', poiIds);
      throwOnError(reviewsError, 'delete reviews failed');

      const { error: suggestionsError } = await supabase
        .from('suggestions')
        .delete()
        .in('poi_id', poiIds);
      throwOnError(suggestionsError, 'delete suggestions failed');

      const { error: poisDeleteError } = await supabase.from('pois').delete().eq('city_id', cityId);
      throwOnError(poisDeleteError, 'delete pois failed');
    }
  }

  // 5. DIPENDENZE SEMPLICI
  const { error: eventsError } = await supabase.from('city_events').delete().eq('city_id', cityId);
  throwOnError(eventsError, 'delete city_events failed');

  const { error: servicesError } = await supabase
    .from('city_services')
    .delete()
    .eq('city_id', cityId);
  throwOnError(servicesError, 'delete city_services failed');

  const { error: guidesError } = await supabase.from('city_guides').delete().eq('city_id', cityId);
  throwOnError(guidesError, 'delete city_guides failed');

  const { error: operatorsError } = await supabase
    .from('city_tour_operators')
    .delete()
    .eq('city_id', cityId);
  throwOnError(operatorsError, 'delete city_tour_operators failed');

  // 6. CANCELLAZIONE CITTÀ (cache solo dopo successo)
  const { error } = await supabase.from('cities').delete().eq('id', cityId);
  if (error) {
    throw error;
  }

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
    .select('id, name, visitors, admin_region');
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
