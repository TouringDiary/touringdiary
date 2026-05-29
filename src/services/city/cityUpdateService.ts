import { supabase } from '../supabaseClient';
import { CitySummary } from '../../types/index';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { callCityAdminApi } from './cityAdminApi';

export const saveManifestItem = async (summary: CitySummary): Promise<void> => {
    clearCacheKey('manifest');

    await callCityAdminApi<{ id: string; updated_at: string }>(
        `/cities/${encodeURIComponent(summary.id)}/manifest`,
        'PATCH',
        {
            name: summary.name,
            zone: summary.zone ?? null,
            status: summary.status ?? null,
            updated_at: new Date().toISOString(),
        }
    );
};

export const updateCityBadge = async (cityId: string, badge: string | null): Promise<void> => {
    invalidateCityCache(cityId);
    clearCacheKey('manifest');

    await callCityAdminApi<{ id: string; updated_at: string }>(
        `/cities/${encodeURIComponent(cityId)}/badge`,
        'PATCH',
        { badge }
    );
};

export const updateCityHomeOrder = async (cityId: string, order: number | null): Promise<void> => {
    invalidateCityCache(cityId);
    clearCacheKey('manifest');

    await callCityAdminApi<{ id: string; updated_at: string }>(
        `/cities/${encodeURIComponent(cityId)}/home-order`,
        'PATCH',
        { home_order: order }
    );
};

export const evaluateAndUpdateCityStatus = async (cityId: string): Promise<CitySummary['status']> => {
    const { data: city, error: cityError } = await supabase
        .from('cities')
        .select('id, name, description, image_url, status')
        .eq('id', cityId)
        .single();

    if (cityError || !city) {
        console.error(`City not found for status evaluation: ${cityId}`);
        throw new Error(`City not found: ${cityId}`);
    }

    if (city.status === 'published') {
        return 'published';
    }

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

    let newStatus: CitySummary['status'] = 'draft';

    if (hasPois && hasBasicInfo) {
        newStatus = 'published';
    } else if (city.status === 'needs_check') {
        newStatus = 'needs_check';
    } else {
        newStatus = 'draft';
    }

    if (newStatus !== city.status) {
        await callCityAdminApi<{ id: string; status: string; updated_at: string }>(
            `/cities/${encodeURIComponent(cityId)}/status`,
            'PATCH',
            { status: newStatus }
        );

        invalidateCityCache(cityId);
        clearCacheKey('manifest');
    }

    return newStatus;
};
