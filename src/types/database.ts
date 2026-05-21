import type { CitySummary } from '@/types/index';

import type { Database, Json } from './supabase';
export type { Database, Json };
import * as Domain from './domain/index';

// Re-export Json for convenience (already exported from line 2)

// --- CORE MAPPING (SOURCE OF TRUTH) ---
// Utilizziamo i tipi Row/Insert/Update nativi di Supabase.
// Nessuna estensione manuale qui. Se manca una colonna, va aggiunta in supabase.ts.

// 1. POI & STAGING
export type DatabasePoi = Domain.DbPoi;
export type DatabasePoiInsert = Domain.DbInsert<'pois'> & { id: string; city_id: string; name: string; category: string };
export type DatabasePoiUpdate = Domain.DbUpdate<'pois'>;

export type DatabasePoiStaging = Domain.DbPoiStaging;
export type DatabasePoiStagingInsert = Domain.DbInsert<'pois_staging'>;
export type DatabasePoiStagingUpdate = Domain.DbUpdate<'pois_staging'>;

// 2. CITIES
export type DatabaseCity = Domain.DbCity;
export type DatabaseCityInsert = Domain.DbInsert<'cities'> & { id: string; name: string };
export type DatabaseCityUpdate = Domain.DbUpdate<'cities'>;

// 3. BUSINESS & MARKETING
export type DatabaseSponsor = Domain.DbSponsor;
export type DatabaseShop = Domain.DbShop;
export type DatabaseShopProduct = Domain.DbShopProduct;
export type DatabaseCityGuide = Domain.DbCityGuide;
export type DatabaseCityTourOperator = Domain.DbCityTourOperator;

// Alias per operazioni di scrittura Business
export type DatabaseSponsorInsert = Domain.DbInsert<'sponsors'> & { contact_name: string; company_name: string; email: string; status: string };
export type DatabaseShopInsert = Domain.DbInsert<'shops'> & { id: string; name: string };
export type DatabaseShopProductInsert = Domain.SmartInsert<'shop_products'>;
export type DatabaseCityGuideInsert = Domain.SmartInsert<'city_guides'>;
export type DatabaseCityTourOperatorInsert = Domain.SmartInsert<'city_tour_operators'>;

export type DatabaseSponsorUpdate = Domain.SmartUpdate<'sponsors'>;
export type DatabaseShopUpdate = Domain.SmartUpdate<'shops'>;
export type DatabaseCityGuideUpdate = Domain.SmartUpdate<'city_guides'>;
export type DatabaseShopProductUpdate = Domain.SmartUpdate<'shop_products'>;

/**
 * Type-safe joined version of Sponsor for relational queries.
 */
export interface DatabaseJoinedSponsor extends DatabaseSponsor {
    cities?: {
        name: string;
        continent: string;
        nation: string;
        admin_region: string;
        zone: string;
    } | null;
    pricing_versions?: {
        price: number;
        plans?: {
            name: string;
            type: Database['public']['Enums']['plan_type'];
        } | null;
    } | null;
    /**
     * Proiezione parziale: corrisponde alle colonne in SPONSOR_CONTRACT_SELECT.
     * NON usare Domain.DbPoi (Row completo) perché la SELECT non recupera tutti i campi.
     */
    pois?: Pick<Domain.DbPoi,
        'name' | 'description' | 'image_url' | 'image_status' | 'coords_lat' | 'coords_lng' |
        'category' | 'sub_category' | 'address' | 'website' | 'phone' | 'opening_hours'
    > | null;
    /**
     * Proiezione parziale: corrisponde alle colonne shops in SPONSOR_CONTRACT_SELECT.
     * (name,slug,description,image_url,coords_lat,coords_lng,address,website,phone,opening_hours)
     */
    shops?: Pick<DatabaseShop,
        'name' | 'slug' | 'description' | 'image_url' | 'image_status' | 'coords_lat' | 'coords_lng' |
        'address' | 'website' | 'phone' | 'opening_hours'
    > | null;
    /**
     * Proiezione parziale: corrisponde alle colonne city_guides in SPONSOR_CONTRACT_SELECT.
     * (name,slug,description,image_url,specialties,languages,phone,website)
     */
    city_guides?: Pick<DatabaseCityGuide,
        'name' | 'slug' | 'description' | 'image_url' | 'specialties' | 'languages' | 'phone' | 'website'
    > | null;
    /**
     * Proiezione parziale: corrisponde alle colonne city_tour_operators in SPONSOR_CONTRACT_SELECT.
     * (name,slug,description,image_url,coords_lat,coords_lng,address,opening_hours)
     */
    city_tour_operators?: Pick<DatabaseCityTourOperator,
        'name' | 'slug' | 'description' | 'image_url' | 'coords_lat' | 'coords_lng' |
        'address' | 'opening_hours'
    > | null;
}

// Sponsor Requests
export interface DatabaseSponsorRequest {
    id: string;
    company_name: string;
    vat_number: string | null;
    requester_name: string;
    requester_email: string;
    requester_phone?: string | null;
    address?: string | null;
    city_id: string;
    message?: string | null;
    description?: string | null;
    image_url?: string | null;
    coords_lat?: number | null;
    coords_lng?: number | null;
    profile_id?: string | null;
    owner_id?: string | null;
    poi_sub_category?: string | null;
    image_status?: Database['public']['Enums']['media_status'];
    type: Database['public']['Enums']['plan_type'];
    pricing_version_id?: string | null;
    status: Database['public']['Enums']['subscription_status'] | string;
    created_at: string;
    updated_at?: string | null;
    languages?: string[] | null;
    specialties?: string[] | null;
    license_number?: string | null;
    rejection_reason?: string | null;
    amount?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    email?: string | null;
    phone?: string | null;
    tier?: Database['public']['Enums']['plan_type'] | string | null;
}

/**
 * Type-safe joined version of SponsorRequest for relational queries.
 */
export interface DatabaseJoinedSponsorRequest extends DatabaseSponsorRequest {
    cities?: {
        name: string;
        continent: string;
        nation: string;
        admin_region: string;
        zone: string;
    } | null;
    pricing_versions?: {
        price: number;
        plans?: {
            name: string;
            type: Database['public']['Enums']['plan_type'];
        } | null;
    } | null;
}

// 4. GAMIFICATION
export type DatabaseRewardCatalog = Domain.DbReward;
export type DatabaseXpAction = Domain.DbXpAction;
export type DatabaseUserReward = Domain.DbUserReward;

export type DatabaseRewardInsert = Domain.SmartInsert<'rewards_catalog'>;
export type DatabaseUserRewardInsert = Domain.DbInsert<'user_rewards'> & { instance_id: string; user_id: string; reward_id: string; code: string; status: string };
export type DatabaseUserRewardUpdate = Domain.DbUpdate<'user_rewards'>;

// 5. SYSTEM
export type DatabaseCommunicationLog = Domain.DbCommunicationLog;
export type DatabaseSystemMessage = Domain.DbSystemMessage;
export type DatabaseGlobalSetting = Domain.DbGlobalSetting;
export type DatabaseAiConfig = Domain.DbAiConfig;
export type DatabaseAiConfigInsert = Domain.DbInsert<'ai_configs'> & { key: string; prompts: string[]; selected: string[] };
export type DatabaseTaxonomyMapping = Domain.DbTaxonomyMapping;
export type DatabaseSocialTemplate = Domain.DbSocialTemplate;
export type DatabaseSocialTemplateInsert = Domain.DbInsert<'social_templates'>;

// 6. CONTENT ENTITIES
export type DatabaseNewsTicker = Domain.DbNewsTicker;
export type DatabaseLoadingTip = Domain.DbLoadingTip;
export type DatabaseStaticPage = Domain.DbStaticPage;
export type DatabaseCityEvent = Domain.DbCityEvent;
export type DatabaseCityService = Domain.DbCityService;
export type DatabaseCityPerson = Domain.DbCityPerson;

export type DatabaseCityEventInsert = Domain.SmartInsert<'city_events'>;
export type DatabaseCityServiceInsert = Domain.SmartInsert<'city_services'>;
export type DatabaseCityPersonInsert = Domain.SmartInsert<'city_people'>;

export type DatabaseCityEventUpdate = Domain.SmartUpdate<'city_events'>;
export type DatabaseCityServiceUpdate = Domain.SmartUpdate<'city_services'>;
export type DatabaseCityPersonUpdate = Domain.SmartUpdate<'city_people'>;

// Alias per notifiche
export type DatabaseNotificationInsert = Domain.DbInsert<'notifications'> & { user_id: string; type: string; title: string; message: string };

// 7. COMMUNITY
export type DatabasePhotoSubmission = Domain.DbPhotoSubmission;
export type DatabaseCommunityPost = Domain.DbCommunityPost;

export type DatabasePhotoSubmissionInsert = Domain.SmartInsert<'photo_submissions'>;
export type DatabaseCommunityPostInsert = Domain.SmartInsert<'community_posts'>;

export type DatabasePhotoSubmissionUpdate = Domain.SmartUpdate<'photo_submissions'>;
export type DatabaseCommunityPostUpdate = Domain.SmartUpdate<'community_posts'>;

/**
 * Type-safe joined version of PhotoSubmission for community ranking.
 */
export interface DatabaseJoinedPhotoSubmission extends DatabasePhotoSubmission {
    cities: {
        name: string;
        zone: string | null;
        admin_region: string | null;
        nation: string | null;
        continent: string | null;
    } | null;
    photo_likes: { user_id: string }[] | null;
}

/**
 * Type-safe joined version of POI for community ranking.
 */
export interface DatabaseJoinedPoi extends DatabasePoi {
    cities: {
        name: string;
        zone: string | null;
        admin_region: string | null;
        nation: string | null;
        continent: string | null;
    } | null;
}

/**
 * Risultato grezzo della RPC get_ranked_cities.
 * Inferito direttamente dalla definizione della funzione in supabase.ts.
 */
export type DatabaseRankedCityRow = Database['public']['Functions']['get_ranked_cities']['Returns'][0];
export interface DatabaseCityRouteView {
    city_id: string

    id?: string
    slug?: string
    name?: string
    city_name: string
    city_slug: string
    coords_lat: number
    coords_lng: number
    zone_slug: string
    region_slug: string
    nation_slug: string
    continent_slug: string
    updated_at: string
    // Campi ereditati necessari per il mapping in CitySummary/CityDetails
    status?: CitySummary['status']
    generation_logs?: string[]
    continent?: string
    nation?: string
    admin_region?: string
    region_id?: string
    zone?: string
    tourist_zone_id?: string
    description?: string
    image_url?: string
    hero_image?: string
    rating?: number
    visitors?: number
    is_featured?: boolean
    special_badge?: CitySummary['specialBadge']
    home_order?: number
    city_types?: string[]
    classification_explainability?: Json
    created_at?: string
    published_at?: string
    subtitle?: string
    history_snippet?: string
    history_full?: string
    official_website?: string
    patron_details?: Json
    ratings?: Record<string, number>
    gallery?: string[]
    image_status?: Database['public']['Enums']['media_status']
    hero_status?: Database['public']['Enums']['media_status']
    image_credit?: string
    image_license?: string
}

// Helper Type per Join (Query composte specifiche)
export interface DatabaseCityEventWithCity extends Domain.DbCityEvent {
    cities?: Pick<Domain.DbCity, 'id' | 'name' | 'zone' | 'admin_region'> & { special_badge?: CitySummary['specialBadge'] };
}

// 8. SUITCASES & PACKING
export type DatabaseSuitcase = Domain.DbSuitcase;
export type DatabaseSuitcaseItem = Domain.DbSuitcaseItem;

// 9. SPONSOR MESSAGES
export type DatabaseSponsorMessage = Domain.Row<'sponsor_messages'>;
export type DatabaseSponsorMessageInsert = Domain.DbInsert<'sponsor_messages'>;

