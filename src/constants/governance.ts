/**
 * GOVERNANCE CONSTANTS — src/constants/governance.ts
 * 
 * Centralized source of truth for runtime validation of domain-driven values.
 * These constants are used to avoid drift between TypeScript unions and runtime logic.
 */

/**
 * CITY STATUS GOVERNANCE
 * Contratto DB: cities.status
 */
export const CITY_STATUS_VALUES = ['published', 'draft', 'needs_check'] as const;

/**
 * POI CATEGORY GOVERNANCE
 * Contratto DB: pois.category
 */
export const POI_CATEGORY_VALUES = ['monument', 'food', 'hotel', 'nature', 'discovery', 'leisure', 'shop', 'all'] as const;

/**
 * CITY BADGE GOVERNANCE
 * Contratto DB: cities.special_badge
 */
export const CITY_BADGE_VALUES = ['event', 'trend', 'season', 'editor', 'destination'] as const;

/**
 * POI STATUS GOVERNANCE
 * Contratto DB: pois.status
 */
export const POI_STATUS_VALUES = ['published', 'draft', 'needs_check'] as const;

/**
 * CITY PEOPLE STATUS GOVERNANCE
 * Contratto DB: city_people.status
 */
export const PERSON_STATUS_VALUES = ['published', 'draft'] as const;

/**
 * PHOTO SUBMISSION STATUS GOVERNANCE
 * Contratto DB: photo_submissions.status
 */
export const PHOTO_SUBMISSION_STATUS_VALUES = [
    'pending',
    'approved',
    'rejected',
    'city_deleted'
] as const;

/**
 * MEDIA STATUS GOVERNANCE
 * Contratto DB: media_status enum
 */
export const MEDIA_STATUS_VALUES = [
    'real',
    'placeholder',
    'missing',
    'ai_generated',
    'needs_review'
] as const;

/**
 * SPONSOR STATUS GOVERNANCE
 * Contratto DB: sponsors.status / sponsor_requests.status
 * NOTA: 'expired' è uno stato runtime derivato, non presente nel DB.
 */
export const SPONSOR_STATUS_VALUES = ['pending', 'waiting_payment', 'converted', 'approved', 'rejected', 'cancelled'] as const;

/**
 * PLAN TYPE GOVERNANCE
 * Contratto DB: enum plan_type
 */
export const PLAN_TYPE_VALUES = [
    'LOCAL_ACTIVITY',
    'REGIONAL_ACTIVITY',
    'DIGITAL_SHOWCASE',
    'TOUR_GUIDE',
    'TOUR_OPERATOR',
    'PRO_USER',
    'PRO_USER_PLUS'
] as const;

/**
 * SHOP CATEGORY GOVERNANCE
 * Contratto DB: shops.category
 */
export const SHOP_CATEGORY_VALUES = ['gusto', 'cantina', 'artigianato', 'moda'] as const;

/**
 * SHOP PRODUCT STATUS GOVERNANCE
 * Contratto Domain: ShopProduct.status
 */
export const SHOP_PRODUCT_STATUS_VALUES = [
    'active',
    'inactive'
] as const;

/**
 * SUGGESTION TYPE GOVERNANCE
 * Contratto Domain: suggestions.type
 */
export const SUGGESTION_TYPE_VALUES = [
    'new_place',
    'edit_info',
    'history_culture'
] as const;

/**
 * JOURNEY PHASE GOVERNANCE
 * Contratto Domain: narrative compass phases
 */
export const JOURNEY_PHASE_VALUES = [
    'SCOPERTA',
    'SELEZIONE',
    'PIANIFICA',
    'LIVE',
    'RICORDA'
] as const;

/**
 * POI SUBCATEGORY GOVERNANCE
 * Contratto DB: pois.sub_category
 * Tassonomia consolidata (senza duplicati theatre/theater o mall/shopping_mall).
 */
export const POI_SUBCATEGORY_VALUES = [
    'restaurant', 'pizzeria', 'bar', 'pastry', 'street_food', 'gelato', 'winery', 'bakery', 'dairy', 'gastronomy', 'trattoria', 'braceria', 'fast_food',
    'disco', 'pub', 'cinema', 'theater', 'stadium', 'zoo', 'beach_club', 'spa', 'mall', 'water_park', 'wine_bar', 'cocktail_bar', 'playground',
    'fashion', 'crafts', 'souvenir', 'market', 'tech', 'food_shop', 'jewelry',
    'church', 'castle', 'museum', 'square', 'palace', 'archaeology', 'monument', 'library',
    'park', 'beach', 'hiking', 'viewpoint', 'mountain', 'lake', 'river', 'village', 'garden', 'beach_free', 'reserve',
    'hotel', 'bnb', 'resort', 'hostel', 'guest_house', 'casa_per_ferie', 'holiday_home', 'apartment', 'camping',
    'agency', 'tour_operator', 'guide', 'bridge', 'ruins', 'cafe', 'bbq', 'natural_site', 'forest', 'cave', 'hidden_gem', 'street_art', 'curiosity', 'art_gallery', 'workshop'
] as const;

/**
 * VERIFIED RELIABILITY MAP — Governance centralizzata
 * Mapping deterministico: tourismInterest -> aiReliability "bonificato" (flag "+").
 * Usato da executeDailyDeepScan per marcare i POI verificati da Gemini Pro.
 * NON usare template string + cast: usare questa mappa.
 */
export const VERIFIED_RELIABILITY_MAP = {
    high: 'high+',
    medium: 'medium+',
    low: 'low+'
} as const satisfies Record<'high' | 'medium' | 'low', string>;

/**
 * TOURISM INTEREST GOVERNANCE
 * Contratto Domain: PointOfInterest.tourismInterest
 */
export const TOURISM_INTEREST_VALUES = ['high', 'medium', 'low'] as const;

/**
 * AI RELIABILITY GOVERNANCE
 * Contratto Domain: PointOfInterest.aiReliability
 */
export const AI_RELIABILITY_VALUES = [
    'high',
    'medium',
    'low',
    'high+',
    'medium+',
    'low+',
    'duplicate',
    'invalidated'
] as const;

/**
 * IMAGE LICENSE GOVERNANCE
 * Contratto Domain: PointOfInterest.imageLicense
 */
export const IMAGE_LICENSE_VALUES = [
    'own',
    'cc',
    'public',
    'copyright'
] as const;
