
import { supabase } from '../supabaseClient';
import { CitySummary } from '../../types/index';
import { clearCacheKey, invalidateCityCache } from './cityCache';

export const saveManifestItem = async (summary: CitySummary): Promise<void> => {
    clearCacheKey('manifest');
    await supabase.from('cities').upsert({ 
        id: summary.id, name: summary.name, zone: summary.zone, 
        status: summary.status, updated_at: new Date().toISOString() 
    });
};

export const updateCityBadge = async (cityId: string, badge: string | null): Promise<void> => {
    invalidateCityCache(cityId);
    clearCacheKey('manifest');
    const { error } = await supabase
        .from('cities')
        .update({ special_badge: badge, updated_at: new Date().toISOString() })
        .eq('id', cityId);
    
    if (error) throw error;
};

export const updateCityHomeOrder = async (cityId: string, order: number | null): Promise<void> => {
    invalidateCityCache(cityId);
    clearCacheKey('manifest');
    
    // cast a 'any' perché home_order potrebbe non essere nei tipi autogenerati se non aggiornati
    const payload: any = { home_order: order, updated_at: new Date().toISOString() };
    
    const { error } = await supabase
        .from('cities')
        .update(payload)
        .eq('id', cityId);
    
    if (error) throw error;
};

export const evaluateAndUpdateCityStatus = async (cityId: string): Promise<'published' | 'draft' | 'needs_check'> => {
    // 1. Recupera i dati base della città
    const { data: city, error: cityError } = await supabase
        .from('cities')
        .select('id, name, description, image_url, status')
        .eq('id', cityId)
        .single();

    if (cityError || !city) {
        console.error(`City not found for status evaluation: ${cityId}`);
        throw new Error(`City not found: ${cityId}`);
    }

    // 2. Conta i POI pubblicati per questa città
    const { count: publishedPoiCount, error: poiError } = await supabase
        .from('pois')
        .select('*', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('status', 'published');

    if (poiError) {
        console.error("Error fetching POIs for status evaluation", poiError);
    }

    const hasPois = (publishedPoiCount || 0) > 0;
    const hasBasicInfo = !!(city.name && city.description && city.image_url);

    // 3. Determina il nuovo stato
    let newStatus: 'published' | 'draft' | 'needs_check' = 'draft';

    if (hasPois && hasBasicInfo) {
        newStatus = 'published';
    } else {
        // Se era in needs_check e non ha i requisiti, lo manteniamo in needs_check
        if (city.status === 'needs_check') {
            newStatus = 'needs_check';
        } else {
            newStatus = 'draft';
        }
    }

    // 4. Aggiorna il DB solo se lo stato è cambiato
    if (newStatus !== city.status) {
        const { error: updateError } = await supabase
            .from('cities')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', cityId);

        if (updateError) {
            console.error("Error updating city status", updateError);
            throw updateError;
        }

        // 5. Invalida la cache
        invalidateCityCache(cityId);
        clearCacheKey('manifest');
    }

    return newStatus;
};
