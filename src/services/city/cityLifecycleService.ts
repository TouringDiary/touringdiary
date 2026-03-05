
import { supabase } from '../supabaseClient';
import { AiZoneSuggestion, CityDeleteOptions } from '../../types/index';
import { DatabaseCity } from '../../types/database';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { ensureZoneExists } from '../zoneService';
import { orphanCityStaging, reclaimStagingByCityName } from '../stagingService';

export const reclaimOrphanedItems = async (cityId: string, cityName: string) => {
    // 0. RECLAIM STAGING OSM
    await reclaimStagingByCityName(cityName, cityId);

    // 1. RECLAIM FOTO (FIX: Aggiorna anche location_name per consistenza filtri)
    await supabase
        .from('photo_submissions')
        .update({ 
            city_id: cityId,
            location_name: cityName, // Allinea il nome location al nuovo nome città
            status: 'approved', 
            updated_at: new Date().toISOString() 
        })
        .is('city_id', null)
        .ilike('location_name', `%${cityName}%`) // Cerca match parziale
        .select('id');

    // 2. RECLAIM LIVE SNAPS
    await supabase
        .from('live_snaps')
        .update({ city_id: cityId })
        .is('city_id', null)
        .ilike('caption', `%${cityName}%`);

    // 3. RECLAIM SHOPS
    await supabase
        .from('shops')
        .update({ city_id: cityId })
        .is('city_id', null)
        .ilike('address', `%${cityName}%`);

    // 4. RECLAIM SPONSORS
    await supabase
        .from('sponsors')
        .update({ city_id: cityId })
        .is('city_id', null)
        .ilike('address', `%${cityName}%`);

    // 5. RECLAIM POI
    await supabase
        .from('pois')
        .update({ city_id: cityId })
        .is('city_id', null)
        .ilike('address', `%${cityName}%`);
        
    // 6. PEOPLE - skipped as per original logic
};

export const deleteCity = async (cityId: string, options: CityDeleteOptions, cityName: string): Promise<void> => {
    
    // PRE-CLEANUP (Staging Orphans con Tagging Sicuro)
    try {
        await orphanCityStaging(cityId, cityName);
    } catch(e) {
        console.warn("Orphaning staging failed", e);
    }

    // 1. MEDIA
    try {
        if (options.keepUserPhotos) {
            await supabase
                .from('photo_submissions')
                .update({ city_id: null, status: 'city_deleted', updated_at: new Date().toISOString() })
                .eq('city_id', cityId);
            
            await supabase
                .from('live_snaps')
                .update({ city_id: null })
                .eq('city_id', cityId);
        } else {
            await supabase.from('photo_submissions').delete().eq('city_id', cityId);
            await supabase.from('live_snaps').delete().eq('city_id', cityId);
        }
    } catch (e) {}

    // 2. BUSINESS
    try {
        if (options.keepShops) {
            await supabase.from('shops').update({ city_id: null }).eq('city_id', cityId);
            await supabase.from('sponsors').update({ city_id: null }).eq('city_id', cityId);
        } else {
            const { data: shops } = await supabase.from('shops').select('id').eq('city_id', cityId);
            if (shops && shops.length > 0) {
                const shopIds = shops.map(s => s.id);
                await supabase.from('shop_products').delete().in('shop_id', shopIds);
                await supabase.from('shops').delete().eq('city_id', cityId);
            }
            await supabase.from('sponsors').delete().eq('city_id', cityId);
        }
    } catch (e) {}

    // 3. PEOPLE
    try {
        if (options.keepPeople) {
            await supabase.from('city_people').update({ city_id: null }).eq('city_id', cityId);
        } else {
            await supabase.from('city_people').delete().eq('city_id', cityId);
        }
    } catch (e) {}

    // 4. POI
    try {
        const { data: pois } = await supabase.from('pois').select('id').eq('city_id', cityId);
        if (pois && pois.length > 0) {
            const poiIds = pois.map(p => p.id);

            if (options.keepPOIs) {
                await supabase.from('pois').update({ city_id: null }).eq('city_id', cityId); 
            } else {
                await supabase.from('reviews').delete().in('poi_id', poiIds);
                await supabase.from('suggestions').delete().in('poi_id', poiIds);
                await supabase.from('pois').delete().eq('city_id', cityId);
            }
        }
    } catch (e) {}

    // 5. DIPENDENZE SEMPLICI
    try {
        await supabase.from('city_events').delete().eq('city_id', cityId);
        await supabase.from('city_services').delete().eq('city_id', cityId);
        await supabase.from('city_guides').delete().eq('city_id', cityId);
    } catch (e) {}

    // 6. CANCELLAZIONE CITTÀ
    clearCacheKey('manifest'); 
    invalidateCityCache(cityId);
    
    const { error } = await supabase.from('cities').delete().eq('id', cityId);
    
    if (error) {
        throw error;
    }
};

export const importRegionalData = async (
    zones: AiZoneSuggestion[], 
    selectedCities: string[], 
    adminRegion: string
): Promise<{ 
    createdZones: number, 
    createdCities: number, 
    logs: string[], 
    createdItems: {id: string, name: string}[] 
}> => {
    let zoneCount = 0;
    let cityCount = 0;
    const logs: string[] = [];
    const createdItems: {id: string, name: string}[] = [];
    
    const selectedSet = new Set(selectedCities.map(c => c.toLowerCase().trim()));

    for (const zone of zones) {
        try {
            const result = await ensureZoneExists(zone.name, adminRegion); 
            if (result.created) {
                zoneCount++;
                logs.push(result.log);
            }
        } catch (e) {
             logs.push(`[Error] Fallita creazione zona ${zone.name}`);
        }
    }

    const { data: existingDbCities } = await supabase
        .from('cities')
        .select('id, name, visitors');
    
    const existingMap = new Map<string, { id: string, visitors: number }>();
    if (existingDbCities) {
        existingDbCities.forEach(c => existingMap.set(c.name.toLowerCase().trim(), { id: c.id, visitors: c.visitors || 0 }));
    }

    for (const zone of zones) {
        for (const city of zone.mainCities) {
            const normalizedName = city.name.toLowerCase().trim();
            const isSelected = selectedSet.has(normalizedName);

            if (isSelected) {
                const existing = existingMap.get(normalizedName);

                try {
                    if (existing) {
                        const shouldUpdateVisitors = city.visitors > existing.visitors || existing.visitors === 0;
                        if (shouldUpdateVisitors) {
                            await supabase
                                .from('cities')
                                .update({ 
                                    visitors: city.visitors,
                                    zone: zone.name, 
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', existing.id);
                            
                            cityCount++; 
                        }
                        
                        await reclaimOrphanedItems(existing.id, city.name);
                        createdItems.push({ id: existing.id, name: city.name });

                    } else {
                        const newId = `city_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
                        
                        const payload: Partial<DatabaseCity> = {
                            id: newId,
                            name: city.name,
                            admin_region: adminRegion,
                            zone: zone.name,
                            status: 'draft',
                            image_url: 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200', 
                            visitors: city.visitors,
                            coords_lat: 0,
                            coords_lng: 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            generation_logs: [] 
                        };

                        await supabase.from('cities').insert(payload);
                        cityCount++;
                        existingMap.set(normalizedName, { id: newId, visitors: city.visitors });
                        
                        await reclaimOrphanedItems(newId, city.name);
                        createdItems.push({ id: newId, name: city.name });
                    }
                } catch (e: any) {
                    logs.push(`[Error] Fallita operazione su città ${city.name}: ${e.message}`);
                }
            }
        }
    }

    clearCacheKey('manifest'); 
    return { createdZones: zoneCount, createdCities: cityCount, logs, createdItems };
};

export const seedNapoliData = async () => { return true; };
