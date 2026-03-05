
import { supabase } from '../../supabaseClient';
import { PointOfInterest } from '../../../types/index';
import { DatabasePoi } from '../../../types/database';
import { User } from '../../../types/users';
import { invalidateCityCache, clearCacheKey } from '../cityCache';
import { evaluateAndUpdateCityStatus } from '../cityUpdateService';

export const saveSinglePoi = async (poi: PointOfInterest, cityId: string, currentUser?: User): Promise<void> => {
    invalidateCityCache(cityId); 
    clearCacheKey(`pois_multi_`); 
    
    const realId = (poi.id && !poi.id.startsWith('temp_')) ? poi.id : `poi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    
    const authorName = currentUser?.name || 'Sistema';

    // DEFENSIVE CHECK: Assicura che la categoria sia valida per il DB constraint
    // Questo previene l'errore "violates check constraint" se l'AI impazzisce
    const categoryLower = (poi.category || 'monument').toLowerCase().trim();
    const allowedCats = ['monument', 'food', 'hotel', 'nature', 'discovery', 'leisure', 'shop'];
    const safeCategory = allowedCats.includes(categoryLower) ? categoryLower : 'discovery';

    // MAPPATURA ROBUSTA (ROOT CAUSE FIX)
    const poiPayload: DatabasePoi = {
        id: realId, 
        city_id: cityId, 
        name: poi.name || 'Senza Nome', 
        category: safeCategory, 
        sub_category: poi.subCategory || null, 
        description: poi.description || '', 
        image_url: poi.imageUrl || '', 
        coords_lat: poi.coords?.lat || 0, 
        coords_lng: poi.coords?.lng || 0, 
        address: poi.address || '', 
        rating: poi.rating || 0, 
        votes: poi.votes || 0, 
        status: poi.status || 'published', 
        
        visit_duration: poi.visitDuration || null, 
        
        date_added: poi.dateAdded || now, 
        showcase_expiry: poi.showcaseExpiry || null, 
        price_level: poi.priceLevel || 2, 
        
        // JSON FIELDS
        opening_hours: (poi.openingHours as any) || null, 
        affiliate: (poi.affiliate as any) || null,
        
        // NEW FIELDS
        link_metadata: (poi.linkMetadata as any) || null,
        ai_reliability: poi.aiReliability || null, 
        tourism_interest: poi.tourismInterest || null, 
        last_verified: poi.lastVerified || null, // SCRITTURA ESPLICITA DATA VERIFICA
        
        // METADATA
        is_sponsored: poi.isSponsored || false, 
        tier: poi.tier || null, 
        
        updated_at: now,
        updated_by: authorName,
        created_at: poi.createdAt || now,
        created_by: poi.createdBy || authorName
    };

    const { error } = await supabase.from('pois').upsert(poiPayload);
    if (error) throw error;

    // Ricalcolo stato città in background
    evaluateAndUpdateCityStatus(cityId).catch(err => console.error(`Errore ricalcolo stato città ${cityId}:`, err));
};

export const deleteSinglePoi = async (poiId: string): Promise<void> => {
    clearCacheKey(`city_details_`); 
    clearCacheKey(`pois_multi_`);

    // Recupera la città prima di eliminare per poter aggiornare lo stato
    const { data: poiData } = await supabase.from('pois').select('city_id').eq('id', poiId).maybeSingle();

    const { error } = await supabase.from('pois').delete().eq('id', poiId);
    if (error) throw error;

    if (poiData?.city_id) {
        // Ricalcolo stato città in background
        evaluateAndUpdateCityStatus(poiData.city_id).catch(err => console.error(`Errore ricalcolo stato città ${poiData.city_id}:`, err));
    }
};

export const votePoiAsync = async (poiId: string, increment: boolean): Promise<number> => { 
    const { data: poi } = await supabase.from('pois').select('votes').eq('id', poiId).maybeSingle(); 
    const newVotes = Math.max(0, (poi?.votes || 0) + (increment ? 1 : -1)); 
    await supabase.from('pois').update({ votes: newVotes }).eq('id', poiId); 
    return newVotes; 
};
