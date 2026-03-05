
import { supabase } from './supabaseClient';
import { DatabasePoiStaging, DatabasePoiInsert } from '../types/database'; // Usa Insert type per scrittura
import { RatedPoiResult } from './ai/generators/qualityGenerator';
import { enrichStagingPoi } from './ai/generators/poiGenerator';
import { getCachedPlaceholder } from './settingsService';
import { calculateDistance } from '../services/geo';
import { getSimilarity } from '../utils/stringUtils';

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

// Colonne leggere per la lista
const LIGHTWEIGHT_COLS = 'id, city_id, osm_id, name, raw_category, coords_lat, coords_lng, address, ai_rating, processing_status, created_at, updated_at';

export const getDistinctRawCategories = async (cityId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('pois_staging')
        .select('raw_category')
        .eq('city_id', cityId);

    if (error || !data) return [];

    const uniqueCats = new Set<string>();
    data.forEach(row => {
        if (row.raw_category) {
            uniqueCats.add(row.raw_category);
        }
    });

    return Array.from(uniqueCats).sort();
};

export const getStagingPois = async ({ cityId, status = 'all', search = '', page = 1, pageSize = 50, aiRating = [], rawCategories = [], sortBy = 'created_at', sortDir = 'desc' }: StagingFilter) => {
    let query = supabase
        .from('pois_staging')
        .select(LIGHTWEIGHT_COLS, { count: 'exact' }) // USO COLONNE LEGGERE
        .eq('city_id', cityId);

    if (status !== 'all') {
        query = query.eq('processing_status', status);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
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
        console.error("Error fetching staging POIs:", error);
        throw error;
    }

    return { data: data as DatabasePoiStaging[], count: count || 0 };
};

export const getAllStagingPois = async ({ cityId, status = 'all', search = '', aiRating = [], rawCategories = [] }: Omit<StagingFilter, 'page' | 'pageSize'>): Promise<DatabasePoiStaging[]> => {
    let query = supabase
        .from('pois_staging')
        .select(LIGHTWEIGHT_COLS) // USO COLONNE LEGGERE
        .eq('city_id', cityId);

    if (status !== 'all') {
        query = query.eq('processing_status', status);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    if (aiRating && aiRating.length > 0) {
        query = query.in('ai_rating', aiRating);
    }

    if (rawCategories && rawCategories.length > 0) {
        query = query.in('raw_category', rawCategories);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all staging POIs:", error);
        return [];
    }

    return data as DatabasePoiStaging[];
};

export const getAllStagingIds = async ({ cityId, status = 'all', search = '', aiRating = [], rawCategories = [] }: Omit<StagingFilter, 'page' | 'pageSize'>): Promise<string[]> => {
    let query = supabase
        .from('pois_staging')
        .select('id') 
        .eq('city_id', cityId);

    if (status !== 'all') {
        query = query.eq('processing_status', status);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }
    
    if (aiRating && aiRating.length > 0) {
        query = query.in('ai_rating', aiRating);
    }
    
    if (rawCategories && rawCategories.length > 0) {
        query = query.in('raw_category', rawCategories);
    }

    const { data, error } = await query.limit(5000);

    if (error) {
        console.error("Error fetching all staging IDs:", error);
        return [];
    }

    return data.map(r => r.id);
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
    const promises = chunks.map(chunk => 
        supabase
            .from('pois_staging')
            .select('*') // Qui scarichiamo tutto perché serve per il processamento AI/Publish
            .in('id', chunk)
    );

    const results = await Promise.all(promises);

    for (const result of results) {
        if (result.error) {
            console.error("Error fetching staging items chunk:", result.error);
        } else if (result.data) {
            allData = [...allData, ...result.data];
        }
    }

    return allData;
};

export const saveStagingBatch = async (cityId: string, rawItems: any[]) => {
    if (rawItems.length === 0) return { inserted: 0, error: null };

    const payload = rawItems.map(item => ({
        city_id: cityId,
        osm_id: item.osm_id,
        name: item.name,
        raw_category: item.raw_category,
        coords_lat: item.coords_lat,
        coords_lng: item.coords_lng,
        address: item.address,
        ai_rating: item.ai_rating,
        processing_status: 'new',
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('pois_staging')
        .upsert(payload, { onConflict: 'city_id,osm_id' });

    if (error) {
        console.error("Batch save error:", error);
        return { inserted: 0, error };
    }

    return { inserted: rawItems.length, error: null };
};

export const updateStagingAiRatings = async (results: RatedPoiResult[]) => {
    if (results.length === 0) return;
    const updates = results.map(item => {
        const newStatus = item.rating === 'discard' ? 'discarded' : 'ready';
        const dbRating = item.rating === 'discard' ? 'low' : item.rating;
        return supabase
            .from('pois_staging')
            .update({ 
                ai_rating: dbRating,
                processing_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
    });
    await Promise.all(updates);
};

export const updateStagingStatus = async (ids: string[], status: 'new' | 'ready' | 'imported' | 'discarded') => {
    const { error } = await supabase
        .from('pois_staging')
        .update({ 
            processing_status: status,
            updated_at: new Date().toISOString()
        })
        .in('id', ids);
    if (error) throw error;
};

export const deleteStagingPois = async (ids: string[]) => {
    const { error } = await supabase
        .from('pois_staging')
        .delete()
        .in('id', ids);
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
    try {
        // Step 1: Tagga con il nome città (Safe Identification)
        await supabase
            .from('pois_staging')
            .update({ orphan_city_tag: cityName } as any) // Cast any se TypeScript non ha ancora recepito la colonna
            .eq('city_id', cityId);
        
        // Step 2: Rendi orfani (city_id = null)
        await supabase
            .from('pois_staging')
            .update({ city_id: null })
            .eq('city_id', cityId);
            
    } catch(e) {
        console.error("Errore during orphaning:", e);
    }
};

// Recupera gli orfani basandosi sul tag esatto, non sull'indirizzo vago
export const reclaimStagingByCityName = async (cityName: string, newCityId: string): Promise<number> => {
    
    // Cerca per tag esatto (Case insensitive per sicurezza)
    const { data, error } = await supabase
        .from('pois_staging')
        .update({ 
            city_id: newCityId,
            orphan_city_tag: null // Pulisce il tag
        } as any)
        .is('city_id', null)
        .ilike('orphan_city_tag', cityName.trim())
        .select('*');
        
    if (error) console.error("Error reclaiming staging", error);
    return data ? data.length : 0;
};

export const getStagingStats = async (cityId: string) => {
    const { data: all } = await supabase.from('pois_staging').select('processing_status').eq('city_id', cityId);
    const stats = { new: 0, ready: 0, imported: 0, discarded: 0 };
    all?.forEach((row: any) => {
        if (stats[row.processing_status as keyof typeof stats] !== undefined) {
            stats[row.processing_status as keyof typeof stats]++;
        }
    });
    return stats;
};

// --- ALGORITMO DI DEDUPLICA (SMART) ---
export const deduplicateStagingData = async (cityId: string): Promise<number> => {
    try {
        // 1. Scarica tutti i dati staging della città (solo colonne per confronto)
        const { data: allItems } = await supabase
            .from('pois_staging')
            .select('id, osm_id, name, coords_lat, coords_lng, raw_category, address')
            .eq('city_id', cityId);

        if (!allItems || allItems.length === 0) return 0;

        const toDeleteIds = new Set<string>();
        const processedIds = new Set<string>();

        // Funzione per calcolare "Ricchezza Dati"
        const getDataScore = (item: any) => {
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
                const dist = calculateDistance(current.coords_lat, current.coords_lng, other.coords_lat, other.coords_lng) * 1000; // metri
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
                const winner = group[0];
                
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
                 await supabase.from('pois_staging').delete().in('id', ids.slice(i, i + CHUNK));
            }
        }

        return toDeleteIds.size;

    } catch (e) {
        console.error("[Staging] Deduplication error:", e);
        return 0;
    }
};

export const promoteToLive = async (stagingItem: DatabasePoiStaging, cityName: string, useSearch: boolean = false): Promise<boolean> => {
    try {
        // 1. Arricchimento AI
        const enriched = await enrichStagingPoi(stagingItem.name, cityName, stagingItem.raw_category, useSearch);
        
        // 2. Determinazione Placeholder
        const category = enriched.category || 'discovery';
        const placeholderImg = getCachedPlaceholder(category);

        // 3. Costruzione Oggetto POI Finale (Type Safe)
        const finalAddress = enriched.address || stagingItem.address || `${cityName}, Italia`;
        const finalStatus = 'draft'; 
        const stagingInterest = stagingItem.ai_rating || 'medium';

        const newPoi: DatabasePoiInsert = {
            id: `osm_${stagingItem.osm_id.replace(/\W/g, '')}`, 
            city_id: stagingItem.city_id,
            name: stagingItem.name,
            
            category: category,
            sub_category: enriched.subCategory || stagingItem.raw_category || 'generic',
            
            description: enriched.description || `Luogo di interesse a ${cityName}.`,
            
            coords_lat: stagingItem.coords_lat,
            coords_lng: stagingItem.coords_lng,
            address: finalAddress,
            
            visit_duration: enriched.visitDuration || '1h',
            price_level: enriched.priceLevel || 1,
            
            tourism_interest: stagingInterest,
            ai_reliability: useSearch ? 'high' : 'medium',
            
            image_url: placeholderImg, 
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

            last_verified: new Date().toISOString()
        };

        // 4. Inserimento
        const { error: insertError } = await supabase.from('pois').upsert(newPoi);
        if (insertError) throw insertError;

        // 5. UPDATE STAGING STATUS (Imported)
        const { error: updateError } = await supabase
            .from('pois_staging')
            .update({ processing_status: 'imported', updated_at: new Date().toISOString() })
            .eq('id', stagingItem.id);
            
        if (updateError) console.warn("Warning: Failed to update staging status", stagingItem.id);

        return true;
    } catch (e) {
        console.error(`Failed to promote item ${stagingItem.name}:`, e);
        return false;
    }
};
