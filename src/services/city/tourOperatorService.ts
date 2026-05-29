import { supabase } from '../supabaseClient';
import { Database } from '../../types/database';
import { CityTourOperator } from '../../types/index';
import { DatabaseCityTourOperatorInsert, type Json } from '../../types/database';
import { invalidateCityCache, clearCacheKey } from './cityCache';
import { parseTourOperator } from './parsers/entities/parseTourOperator';

type DatabaseCityTourOperatorRow = Database['public']['Tables']['city_tour_operators']['Row'];

export type SaveCityTourOperatorInput = Omit<CityTourOperator, 'id'> & { id?: string };

const LEGACY_TOUR_OPERATOR_PAYLOAD_ERROR =
    'Legacy Tour Operator payload detected. Use phone/website instead of contact/url.';

/** Maps AI/admin item shapes to city_tour_operators write payload. Rejects legacy contact/url fields. */
export const mapToTourOperatorInput = (item: Record<string, unknown>): SaveCityTourOperatorInput => {
    if ('contact' in item) {
        throw new Error(LEGACY_TOUR_OPERATOR_PAYLOAD_ERROR);
    }
    if ('url' in item) {
        throw new Error(LEGACY_TOUR_OPERATOR_PAYLOAD_ERROR);
    }

    return {
        id: typeof item.id === 'string' ? item.id : undefined,
        name: String(item.name ?? ''),
        phone: (item.phone as string) || undefined,
        website: (item.website as string) || undefined,
        description: (item.description as string) || undefined,
        address: (item.address as string) || undefined,
        email: (item.email as string) || undefined,
    };
};

export const getCityTourOperators = async (cityId: string): Promise<CityTourOperator[]> => {
    const { data, error } = await supabase
        .from('city_tour_operators')
        .select('*')
        .eq('city_id', cityId)
        .order('name', { ascending: true });

    if (error) throw error;
    return (data as DatabaseCityTourOperatorRow[] || []).map(parseTourOperator);
};

export const saveCityTourOperator = async (
    cityId: string,
    operator: SaveCityTourOperatorInput,
): Promise<CityTourOperator> => {
    invalidateCityCache(cityId);

    const isNew = !operator.id || !operator.id.match(/^[0-9a-f]{8}-/);
    const payload: DatabaseCityTourOperatorInsert = {
        city_id: cityId,
        name: operator.name,
        slug: operator.slug,
        description: operator.description,
        image_url: operator.imageUrl,
        email: operator.email,
        phone: operator.phone,
        website: operator.website,
        address: operator.address,
        coords_lat: operator.coords?.lat ?? null,
        coords_lng: operator.coords?.lng ?? null,
        rating: operator.rating,
        reviews: operator.reviews as unknown as Json,
        destinations: operator.destinations,
        services_offered: operator.servicesOffered,
        opening_hours: operator.openingHours as unknown as Json,
        license_number: operator.licenseNumber,
        owner_id: operator.ownerId,
        is_sponsored: operator.isSponsored,
    };

    if (!isNew && operator.id) {
        payload.id = operator.id;
    }

    const { data, error } = await supabase
        .from('city_tour_operators')
        .upsert(payload)
        .select()
        .single();

    if (error) throw error;
    return parseTourOperator(data as DatabaseCityTourOperatorRow);
};

export const deleteCityTourOperator = async (id: string): Promise<void> => {
    clearCacheKey(`city_details_`);
    const { error } = await supabase.from('city_tour_operators').delete().eq('id', id);
    if (error) throw error;
};
