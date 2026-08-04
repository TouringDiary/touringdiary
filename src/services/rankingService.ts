import { filterPhotographs, PHOTOGRAPH_READ_MEDIA_STATUS } from '@/domain/photos/photographQuery';
import { GEO_CONFIG } from '../constants/geoConfig';
import { CITY_BADGE_VALUES, CITY_STATUS_VALUES } from '../constants/governance';
import type { DatabaseJoinedPhotoSubmission, DatabaseJoinedPoi } from '../types/database';
import type {
  CitySummary,
  PhotoSubmission,
  PointOfInterest,
  RankedItemMixin,
} from '../types/index';
import { sanitizeMediaStatus } from '../utils/media';
import { mapDbPoiToApp } from './city/poi/poiMapper';
import { supabase } from './supabaseClient';

// Helper per costruire la stringa gerarchica elegante
const buildHierarchy = (c: {
  continent?: string | null;
  nation?: string | null;
  admin_region?: string | null;
  zone?: string | null;
  name?: string | null;
}) => {
  const parts = [
    c.continent || GEO_CONFIG.DEFAULT_CONTINENT,
    c.nation || GEO_CONFIG.DEFAULT_NATION,
    c.admin_region || GEO_CONFIG.DEFAULT_REGION,
    c.zone,
    c.name,
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

/** Residual: regenerate Supabase types when `get_ranked_cities` RPC is added to Database. */
type GetRankedCitiesArgs = {
  sort_type: string;
  page_size: number;
  page_index: number;
  search_text: string;
  zone_filter: string;
};

type GetRankedCitiesRow = {
  id: string;
  slug: string | null;
  name: string;
  continent: string | null;
  nation: string | null;
  admin_region: string | null;
  zone: string | null;
  description: string | null;
  image_url: string | null;
  image_status: string | null;
  hero_image: string | null;
  hero_status: string | null;
  rating: number | null;
  visitors: number | null;
  is_featured: boolean | null;
  special_badge: string | null;
  coords_lat: number;
  coords_lng: number;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  total_count: number;
};

const getRankedCitiesRpc = supabase.rpc.bind(supabase) as (
  fn: 'get_ranked_cities',
  args: GetRankedCitiesArgs,
) => PromiseLike<{ data: GetRankedCitiesRow[] | null; error: Error | null }>;

// --- CITIES RANKING (SERVER SIDE) ---

export const getRankedCities = async ({
  sortType,
  page,
  pageSize,
  search = '',
  zone = '',
}: RankingOptions): Promise<RankedCitiesResult> => {
  try {
    // Chiamata RPC tipizzata allineata allo schema Supabase
    const { data, error } = await getRankedCitiesRpc('get_ranked_cities', {
      sort_type: sortType,
      page_size: pageSize,
      page_index: page - 1,
      search_text: search,
      zone_filter: zone,
    });

    if (error) throw error;
    const rows = data || [];

    const cities: (CitySummary & RankedItemMixin)[] = rows.map((db, index: number) => {
      // Normalizzazione Badge Type-Safe via Governance Centralizzata
      const safeBadge =
        db.special_badge && (CITY_BADGE_VALUES as readonly string[]).includes(db.special_badge)
          ? (db.special_badge as CitySummary['specialBadge'])
          : undefined;

      // Normalizzazione Status Type-Safe via Governance Centralizzata
      const safeStatus =
        db.status && (CITY_STATUS_VALUES as readonly string[]).includes(db.status)
          ? (db.status as CitySummary['status'])
          : 'draft';

      return {
        id: db.id,
        slug: db.slug || db.id,
        name: db.name,
        continent: db.continent || GEO_CONFIG.DEFAULT_CONTINENT,
        nation: db.nation || GEO_CONFIG.DEFAULT_NATION,
        adminRegion: db.admin_region || GEO_CONFIG.DEFAULT_REGION,
        zone: db.zone ?? '',
        description: db.description || '',
        imageUrl: db.image_url ?? '',

        // MediaStatus deterministico (RPC/DB driven)
        image_status: sanitizeMediaStatus(db.image_status),

        heroImage: db.hero_image ?? undefined,
        hero_status: sanitizeMediaStatus(db.hero_status),

        rating: Number(db.rating || 0),
        visitors: Number(db.visitors || 0),
        isFeatured: db.is_featured || false,
        specialBadge: safeBadge,
        coords: { lat: db.coords_lat, lng: db.coords_lng },
        status: safeStatus,
        createdAt: db.created_at ?? undefined,
        updatedAt: db.updated_at ?? undefined,
        originalRank: (page - 1) * pageSize + index + 1,
        hierarchy: buildHierarchy(db),
      };
    });

    const totalCount = data && data.length > 0 ? Number(data[0].total_count) : 0;
    return { data: cities, totalCount };
  } catch (e) {
    console.error('Error fetching ranked cities (RPC):', e);
    return { data: [], totalCount: 0 };
  }
};

// --- PHOTOS RANKING (Client-side for now, smaller dataset) ---

export const getTopCommunityPhotos = async (
  limit: number = 50,
): Promise<(PhotoSubmission & RankedItemMixin)[]> => {
  try {
    const { data, error } = await supabase
      .from('photo_submissions')
      .select(`
                *,
                photo_likes!left(user_id),
                cities (
                    name,
                    zone,
                    admin_region,
                    nation,
                    continent
                )
            `)
      .eq('status', 'approved')
      .eq('media_status', PHOTOGRAPH_READ_MEDIA_STATUS)
      .order('likes', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const userId = (await supabase.auth.getUser()).data.user?.id;

    const photos: DatabaseJoinedPhotoSubmission[] =
      (data as unknown as DatabaseJoinedPhotoSubmission[]) || [];

    const ranked = photos.map((p, idx) => {
      const city = p.cities;

      const hierarchy = city
        ? buildHierarchy(city)
        : `${GEO_CONFIG.DEFAULT_REGION} • ${p.location_name}`;

      return {
        id: p.id,
        submissionId: p.id ?? null,

        userId: p.user_id || undefined,
        user: p.user_name || 'Utente',
        locationName: p.location_name || '',
        description: p.description || undefined,
        url: p.image_url || '',
        mediaStatus: sanitizeMediaStatus(p.media_status),
        status: (p.status as PhotoSubmission['status']) || 'pending',
        date: p.created_at || new Date().toISOString(),
        likes: p.likes || 0,
        updatedAt: p.updated_at || undefined,

        likedByUser: Boolean(p.photo_likes?.some((l) => l.user_id === userId)),

        isOfficial: p.is_official ?? false,

        hierarchy: hierarchy,
        originalRank: idx + 1,
      };
    });

    // Stessa regola gallerie: solo Fotografie (SoT dominio).
    return filterPhotographs(ranked).map((p, idx) => ({
      ...p,
      originalRank: idx + 1,
    }));
  } catch (e) {
    return [];
  }
};

// --- POI RANKING (Client-side limit for now) ---

export const getTopCommunityPois = async (
  limit: number = 50,
  category?: string,
): Promise<(PointOfInterest & RankedItemMixin)[]> => {
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

    const pois: DatabaseJoinedPoi[] = (data as unknown as DatabaseJoinedPoi[]) || [];

    return pois.map((db, idx) => {
      const poi = mapDbPoiToApp(db);
      const city = db.cities;

      return {
        ...poi,
        originalRank: idx + 1,
        hierarchy: city
          ? buildHierarchy({ ...city, name: city.name })
          : `${GEO_CONFIG.DEFAULT_REGION} • ${poi.name}`,
      };
    });
  } catch (e) {
    console.error('Error fetching top POIs:', e);
    return [];
  }
};

// --- RANKING SCORE UPDATE (Fire and Forget) ---
export const updatePhotoScore = async (photoId: string, isLiked: boolean): Promise<void> => {
  try {
    // Segnaposto per algortimo futuro avanzato (es: +x punti per like)
    console.log(
      `[RankingService] Predisposto aggiornamento per photo ${photoId}. Like state: ${isLiked}`,
    );
    // In futuro: await supabase.rpc('update_photo_ranking_score', { p_photo_id: photoId, p_like: isLiked });
  } catch (e) {
    console.error('Errore aggiornamento score foto (RankingService):', e);
  }
};
