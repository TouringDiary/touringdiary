
import { supabase } from './supabaseClient';
import { CitySummary, PointOfInterest, PhotoSubmission, RankedItemMixin } from '../types/index';
import { DatabasePoi, DatabasePhotoSubmission } from '../types/database';
import { mapDbPoiToApp } from './city/poiService';
import { GEO_CONFIG } from '../constants/geoConfig';

// Helper per costruire la stringa gerarchica elegante
const buildHierarchy = (c: { continent?: string|null, nation?: string|null, admin_region?: string|null, zone?: string, name?: string }) => {
    const parts = [
        c.continent || GEO_CONFIG.DEFAULT_CONTINENT,
        c.nation || GEO_CONFIG.DEFAULT_NATION,
        c.admin_region || GEO_CONFIG.DEFAULT_REGION,
        c.zone,
        c.name
    ].filter(Boolean);
    return parts.filter((item, pos, arr) => !pos || item !== arr[pos - 1]).join(' • ');
};

export interface RankingOptions {
    sortType: 'ai' | 'community' | 'mix';
    page: number;
    pageSize: number;
    search?: string;
    zone?: string;
}

export interface RankedCitiesResult {
    data: (CitySummary & RankedItemMixin)[];
    totalCount: number;
}

// --- CITIES RANKING (SERVER SIDE) ---

export const getRankedCities = async ({ sortType, page, pageSize, search = '', zone = '' }: RankingOptions): Promise<RankedCitiesResult> => {
    try {
        // Chiamata RPC alla funzione Supabase
        const { data, error } = await supabase.rpc('get_ranked_cities', {
            sort_type: sortType,
            page_size: pageSize,
            page_index: page - 1, // RPC usa 0-based
            search_text: search,
            zone_filter: zone
        });

        if (error) throw error;

        // Mapping Risultati
        const cities = (data || []).map((db: any, index: number) => ({
            id: db.id,
            name: db.name,
            continent: db.continent || GEO_CONFIG.DEFAULT_CONTINENT,
            nation: db.nation || GEO_CONFIG.DEFAULT_NATION,
            adminRegion: db.admin_region || GEO_CONFIG.DEFAULT_REGION,
            zone: db.zone,
            description: db.description || '',
            imageUrl: db.image_url,
            heroImage: db.hero_image,
            rating: Number(db.rating || 0),
            visitors: Number(db.visitors || 0),
            isFeatured: db.is_featured || false,
            specialBadge: db.special_badge || null,
            coords: { lat: db.coords_lat, lng: db.coords_lng },
            status: db.status,
            createdAt: db.created_at,
            updatedAt: db.updated_at,
            // Calcolo ranking assoluto per display
            originalRank: ((page - 1) * pageSize) + index + 1,
            hierarchy: buildHierarchy(db)
        }));

        const totalCount = data && data.length > 0 ? Number(data[0].total_count) : 0;

        return { data: cities, totalCount };
        
    } catch (e) {
        console.error("Error fetching ranked cities (RPC):", e);
        return { data: [], totalCount: 0 };
    }
};

// --- PHOTOS RANKING (Client-side for now, smaller dataset) ---

export const getTopCommunityPhotos = async (limit: number = 50): Promise<(PhotoSubmission & RankedItemMixin)[]> => {
    try {
        const { data, error } = await supabase
            .from('photo_submissions')
            .select(`
                *,
                cities (
                    name,
                    zone,
                    admin_region,
                    nation,
                    continent
                )
            `)
            .eq('status', 'approved')
            .order('likes', { ascending: false }) 
            .limit(limit);

        if (error) throw error;

        return (data as any[]).map((p, idx) => {
            const city = p.cities;
            const hierarchy = city 
                ? buildHierarchy(city) 
                : `${GEO_CONFIG.DEFAULT_REGION} • ${p.location_name}`;

            return {
                id: p.id,
                userId: p.user_id,
                user: p.user_name,
                locationName: p.location_name,
                description: p.description,
                url: p.image_url,
                status: p.status as any,
                date: p.created_at,
                likes: p.likes,
                updatedAt: p.updated_at,
                hierarchy: hierarchy,
                originalRank: idx + 1
            };
        });
    } catch (e) {
        console.error("Error fetching top photos:", e);
        return [];
    }
};

// --- POI RANKING (Client-side limit for now) ---

export const getTopCommunityPois = async (limit: number = 50, category?: string): Promise<(PointOfInterest & RankedItemMixin)[]> => {
    try {
        let query = supabase
            .from('pois')
            .select(`
                *,
                cities (
                    name,
                    zone,
                    admin_region,
                    nation,
                    continent
                )
            `)
            .eq('status', 'published')
            .order('votes', { ascending: false }) 
            .limit(limit);

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data as any[]).map((db, idx) => {
            const poi = mapDbPoiToApp(db);
            const city = db.cities; 
            
            return {
                ...poi,
                originalRank: idx + 1,
                hierarchy: city ? buildHierarchy({ ...city, name: city.name }) : `${GEO_CONFIG.DEFAULT_REGION} • ${poi.name}`
            };
        });
    } catch (e) {
        console.error("Error fetching top POIs:", e);
        return [];
    }
};
