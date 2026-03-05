
import { Database } from '../supabase';

// --- GENERIC HELPERS ---
export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// --- DOMAIN ENTITIES (CLEAN ALIASES) ---

// Core & Users
export type DbProfile = Row<'profiles'>;
export type DbUser = DbProfile; // Alias semantico

// Geography & Places
export type DbCity = Row<'cities'>; // PATCH RIMOSSA: home_order è nativo
export type DbPoi = Row<'pois'>;
export type DbPoiStaging = Row<'pois_staging'>; // NEW
export type DbTouristZone = Row<'tourist_zones'>; // NEW

// Business & Marketing
export type DbSponsor = Row<'sponsors'>;
export type DbShop = Row<'shops'>;
export type DbShopProduct = Row<'shop_products'>;

// Content & Editorial
export type DbCityEvent = Row<'city_events'>;
export type DbCityGuide = Row<'city_guides'>;
export type DbCityService = Row<'city_services'>;
export type DbCityPerson = Row<'city_people'>;
export type DbStaticPage = Row<'static_pages'>;
export type DbNewsTicker = Row<'news_ticker'>;
export type DbLoadingTip = Row<'loading_tips'>;

// Community & Interactions
export type DbReview = Row<'reviews'>;
export type DbSuggestion = Row<'suggestions'>;
export type DbCommunityPost = Row<'community_posts'>;
export type DbPhotoSubmission = Row<'photo_submissions'> & { city_id?: string | null }; // Keep safe extend for now
export type DbLiveSnap = Row<'live_snaps'>;
export type DbPhotoLike = Row<'photo_likes'>;
export type DbItinerary = Row<'itineraries'>;

// Gamification
export type DbReward = Row<'rewards_catalog'>;
export type DbUserReward = Row<'user_rewards'>;
export type DbXpAction = Row<'xp_actions'>;

// Social Marketing
export type DbSocialTemplate = Row<'social_templates'>;

// System & Config
export type DbSystemMessage = Row<'system_messages'> & {
    ui_config?: any | null;       
    device_target?: 'all' | 'desktop' | 'mobile' | string;
};
export type DbCommunicationLog = Row<'communication_logs'>;
export type DbAiConfig = Row<'ai_configs'>;
export type DbGlobalSetting = Row<'global_settings'>;
export type DbDesignRule = Row<'design_system_rules'>;
export type DbTaxonomyMapping = Row<'taxonomy_mappings'>; // NEW EXPORT
