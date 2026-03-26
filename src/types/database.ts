
import { Database, Json } from './supabase';
import * as Domain from './domain/index';

// Re-export Json for convenience
export type { Json };

// --- CORE MAPPING (SOURCE OF TRUTH) ---
// Utilizziamo i tipi Row/Insert/Update nativi di Supabase.
// Nessuna estensione manuale qui. Se manca una colonna, va aggiunta in supabase.ts.

// 1. POI & STAGING
export type DatabasePoi = Domain.DbPoi;
export type DatabasePoiInsert = Domain.Insert<'pois'>;
export type DatabasePoiUpdate = Domain.Update<'pois'>;

export type DatabasePoiStaging = Domain.DbPoiStaging;

// 2. CITIES
export type DatabaseCity = Domain.DbCity;
export type DatabaseCityInsert = Domain.Insert<'cities'>;

// 3. BUSINESS & SPONSOR
export type DatabaseSponsor = Domain.DbSponsor;
export type DatabaseShop = Domain.DbShop;
export type DatabaseShopProduct = Domain.DbShopProduct;

// 4. GAMIFICATION
export type DatabaseRewardCatalog = Domain.DbReward;
export type DatabaseXpAction = Domain.DbXpAction;
export type DatabaseUserReward = Domain.DbUserReward;

// 5. SYSTEM
export type DatabaseCommunicationLog = Domain.DbCommunicationLog;
export type DatabaseSystemMessage = Domain.DbSystemMessage;
export type DatabaseGlobalSetting = Domain.DbGlobalSetting;
export type DatabaseAiConfig = Domain.DbAiConfig;
export type DatabaseTaxonomyMapping = Domain.DbTaxonomyMapping;
export type DatabaseSocialTemplate = Domain.DbSocialTemplate;

// 6. CONTENT ENTITIES
export type DatabaseNewsTicker = Domain.DbNewsTicker;
export type DatabaseLoadingTip = Domain.DbLoadingTip;
export type DatabaseStaticPage = Domain.DbStaticPage;
export type DatabaseCityEvent = Domain.DbCityEvent;
export type DatabaseCityService = Domain.DbCityService;
export type DatabaseCityGuide = Domain.DbCityGuide;
export type DatabaseCityPerson = Domain.DbCityPerson;

// 7. COMMUNITY
export type DatabasePhotoSubmission = Domain.DbPhotoSubmission;
export type DatabaseCommunityPost = Domain.DbCommunityPost;

// Helper Type per Join (Query composte specifiche)
export interface DatabaseCityEventWithCity extends Domain.DbCityEvent {
    cities?: Pick<Domain.DbCity, 'id' | 'name' | 'zone' | 'admin_region' | 'special_badge'>;
}
