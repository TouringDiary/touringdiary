
import type { Database } from '../supabase';

// --- GENERIC HELPERS (NATIVE) ---
export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// --- SMART UTILITIES ---
export type DbRow<T extends keyof Database['public']['Tables']> = Row<T>;
export type DbInsert<T extends keyof Database['public']['Tables']> = Insert<T>;
export type DbUpdate<T extends keyof Database['public']['Tables']> = Update<T>;
export type SafePartial<T> = Partial<T>;
export type EntityWithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type SmartInsert<T extends keyof Database['public']['Tables']> = Insert<T>;
export type SmartUpdate<T extends keyof Database['public']['Tables']> = Update<T>;

// --- DOMAIN ENTITIES (CLEAN ALIASES) ---

// Core & Users
export type DbProfile = Row<'profiles'>;
export type DbUser = DbProfile; // Alias semantico

// Geography & Places
/** 
 * DbCity: Rappresenta la riga reale del database per una città.
 */
export type DbCity = Row<'cities'>;

/** 
 * DbPoi: Rappresenta la riga reale del database per un punto di interesse.
 */
export type DbPoi = Row<'pois'>;

export type DbPoiStaging = Row<'pois_staging'>; 
export type DbTouristZone = Row<'tourist_zones'>; 

// Operazioni di Scrittura (DTOs)
export type DbCityInsert = Insert<'cities'>;
export type DbCityUpdate = Update<'cities'>;
export type DbPoiInsert = Insert<'pois'>;
export type DbPoiUpdate = Update<'pois'>;

// Business & Marketing
export type DbSponsor = Row<'sponsors'>;
export type DbShop = Row<'shops'>;
export type DbShopProduct = Row<'shop_products'>;

// Content & Editorial
export type DbCityEvent = Row<'city_events'>;
export type DbCityGuide = Row<'city_guides'>;
export type DbCityTourOperator = Row<'city_tour_operators'>;
export type DbCityService = Row<'city_services'>;
export type DbCityPerson = Row<'city_people'>;
export type DbStaticPage = Row<'static_pages'>;
export type DbNewsTicker = Row<'news_ticker'>;
export type DbLoadingTip = Row<'loading_tips'>;

// Community & Interactions
export type DbReview = Row<'reviews'>;
export type DbSuggestion = Row<'suggestions'>;
export type DbCommunityPost = Row<'community_posts'>;
/** PhotoSubmission nativa (is_official ora nel DB) */
export type DbPhotoSubmission = Row<'photo_submissions'>;
export type DbPhotoLike = Row<'photo_likes'>;
export type DbItinerary = Row<'itineraries'>;

// Gamification
export type DbReward = Row<'rewards_catalog'>;
export type DbUserReward = Row<'user_rewards'>;
export type DbXpAction = Row<'xp_actions'>;

// Social Marketing
export type DbSocialTemplate = Row<'social_templates'>;

// System & Config
export type DbSystemMessage = Row<'system_messages'>;
export type DbCommunicationLog = Row<'communication_logs'>;
export type DbAiConfig = Row<'ai_configs'>;
export type DbGlobalSetting = Row<'global_settings'>;
export type DbDesignRule = Row<'design_system_rules'>;
export type DbTaxonomyMapping = Row<'taxonomy_mappings'>; 
export type DbContinent = Row<'continents'>;
export type DbNation = Row<'nations'>;
export type DbRegion = Row<'regions'>;
export type DbSuitcase = Row<'suitcases'>;
export type DbSuitcaseItem = Row<'suitcase_items'>;
export type DbPackingStandardItem = Row<'packing_standard_items'>;
export type DbPackingTemplateItem = Row<'packing_template_items'>;
export type DbPackingAiCatalogItem = Row<'packing_ai_catalog'>;
export type DbPackingStandardItemInsert = Insert<'packing_standard_items'>;
export type DbPackingTemplateItemInsert = Insert<'packing_template_items'>;
export type DbPackingAiCatalogItemInsert = Insert<'packing_ai_catalog'>;
export type DbItinerarySuitcase = Row<'itinerary_suitcases'>;

