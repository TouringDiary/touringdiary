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
export const POI_CATEGORY_VALUES = [
  'monument',
  'food',
  'hotel',
  'nature',
  'discovery',
  'leisure',
  'shop',
  'all',
] as const;

/**
 * CITY BADGE GOVERNANCE
 * Contratto DB: cities.special_badge
 */
export const CITY_BADGE_VALUES = ['event', 'trend', 'season', 'editor', 'destination'] as const;

/**
 * EDITORIAL STATUS GOVERNANCE (D39)
 * Vocabolario canonico UI + mapping DB lowercase.
 * NEEDS_CHECK applies to POI only.
 */
export const EDITORIAL_STATUS_CANONICAL = ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'CANCELED'] as const;

export type EditorialStatusCanonical = (typeof EDITORIAL_STATUS_CANONICAL)[number];

export const EDITORIAL_STATUS_DB_VALUES = ['draft', 'published', 'suspended', 'canceled'] as const;

export type EditorialStatusDb = (typeof EDITORIAL_STATUS_DB_VALUES)[number];

export const POI_STATUS_DB_VALUES = [...EDITORIAL_STATUS_DB_VALUES, 'needs_check'] as const;

export type PoiStatusDb = (typeof POI_STATUS_DB_VALUES)[number];

/**
 * POI STATUS GOVERNANCE — UI/filtri Admin attuali (MF1).
 * Contratto DB esteso: vedi POI_STATUS_DB_VALUES (include suspended/canceled).
 */
export const POI_STATUS_VALUES = ['published', 'draft', 'needs_check'] as const;

/**
 * CITY PEOPLE STATUS GOVERNANCE
 * Contratto DB: city_people.status
 */
export const PERSON_STATUS_VALUES = EDITORIAL_STATUS_DB_VALUES;

export type PersonStatusDb = (typeof PERSON_STATUS_VALUES)[number];

/**
 * PATRON EDITORIAL STATUS (D72)
 * Contratto DB: cities.patron_editorial_status — colonna dedicata, NON patron_details JSON.
 */
export const PATRON_EDITORIAL_STATUS_DB_VALUES = EDITORIAL_STATUS_DB_VALUES;

export type PatronEditorialStatusDb = EditorialStatusDb;

export type PatronEditorialStatusCanonical = EditorialStatusCanonical;

/** Stati modificabili manualmente in Edit Città → Storia → Santo Patrono (decisione 2026-09-18). */
export const PATRON_ORDINARY_EDITORIAL_STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const;

export type PatronOrdinaryEditorialStatus =
  (typeof PATRON_ORDINARY_EDITORIAL_STATUS_VALUES)[number];

/** Stati gestiti esclusivamente dal workflow Segnalazioni → Santo Patrono. */
export const PATRON_MODERATION_EDITORIAL_STATUS_VALUES = ['SUSPENDED', 'CANCELED'] as const;

export function toEditorialStatusDb(
  status: EditorialStatusCanonical | null | undefined,
): EditorialStatusDb {
  if (!status) return 'published';
  return status.toLowerCase() as EditorialStatusDb;
}

export function fromEditorialStatusDb(
  db: string | null | undefined,
): EditorialStatusCanonical | null {
  if (db == null || db.trim() === '') return 'PUBLISHED';
  const normalized = db.trim().toLowerCase();
  if (normalized === 'draft') return 'DRAFT';
  if (normalized === 'published') return 'PUBLISHED';
  if (normalized === 'suspended') return 'SUSPENDED';
  if (normalized === 'canceled') return 'CANCELED';
  return null;
}

/** Gate pubblico Patrono (D49): DRAFT/SUSPENDED → contenuto nascosto + SUGGERISCI. */
export function isPatronPublicContentHidden(
  status: PatronEditorialStatusCanonical | null | undefined,
): boolean {
  if (!status) return false;
  return status === 'DRAFT' || status === 'SUSPENDED';
}

/**
 * PHOTO SUBMISSION STATUS GOVERNANCE
 * Contratto DB: photo_submissions.status
 */
export const PHOTO_SUBMISSION_STATUS_VALUES = [
  'pending',
  'approved',
  'rejected',
  'city_deleted',
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
  'needs_review',
] as const;

/**
 * SPONSOR STATUS GOVERNANCE
 * Contratto DB: sponsors.status / sponsor_requests.status
 * NOTA: 'expired' è uno stato runtime derivato, non presente nel DB.
 */
export const SPONSOR_STATUS_VALUES = [
  'pending',
  'waiting_payment',
  'converted',
  'approved',
  'rejected',
  'cancelled',
] as const;

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
  'PRO_USER_PLUS',
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
export const SHOP_PRODUCT_STATUS_VALUES = ['active', 'inactive'] as const;

/**
 * SUGGESTION TYPE GOVERNANCE
 * Contratto Domain: suggestions.type
 */
export const SUGGESTION_TYPE_VALUES = ['new_place', 'edit_info', 'history_culture'] as const;

/**
 * JOURNEY PHASE GOVERNANCE
 * Contratto Domain: narrative compass phases
 */
export const JOURNEY_PHASE_VALUES = [
  'SCOPERTA',
  'SELEZIONE',
  'PIANIFICA',
  'LIVE',
  'RICORDA',
] as const;

/**
 * POI SUBCATEGORY GOVERNANCE
 * Contratto DB: pois.sub_category
 * Tassonomia consolidata (senza duplicati theatre/theater o mall/shopping_mall).
 */
export const POI_SUBCATEGORY_VALUES = [
  'restaurant',
  'pizzeria',
  'bar',
  'pastry',
  'street_food',
  'gelato',
  'winery',
  'bakery',
  'dairy',
  'gastronomy',
  'trattoria',
  'braceria',
  'fast_food',
  'disco',
  'pub',
  'cinema',
  'theater',
  'stadium',
  'zoo',
  'beach_club',
  'spa',
  'mall',
  'water_park',
  'wine_bar',
  'cocktail_bar',
  'playground',
  'fashion',
  'crafts',
  'souvenir',
  'market',
  'tech',
  'food_shop',
  'jewelry',
  'church',
  'castle',
  'museum',
  'square',
  'palace',
  'archaeology',
  'monument',
  'library',
  'park',
  'beach',
  'hiking',
  'viewpoint',
  'mountain',
  'lake',
  'river',
  'village',
  'garden',
  'beach_free',
  'reserve',
  'hotel',
  'bnb',
  'resort',
  'hostel',
  'guest_house',
  'casa_per_ferie',
  'holiday_home',
  'apartment',
  'camping',
  'agency',
  'tour_operator',
  'guide',
  'bridge',
  'ruins',
  'cafe',
  'bbq',
  'natural_site',
  'forest',
  'cave',
  'hidden_gem',
  'street_art',
  'curiosity',
  'art_gallery',
  'workshop',
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
  low: 'low+',
} as const satisfies Record<'high' | 'medium' | 'low', string>;

/**
 * TOURISM INTEREST GOVERNANCE
 * Contratto Domain: PointOfInterest.tourismInterest
 */
export const TOURISM_INTEREST_VALUES = ['high', 'medium', 'low'] as const;

export type TourismInterest = (typeof TOURISM_INTEREST_VALUES)[number];

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
  'invalidated',
] as const;

export type AiReliability = (typeof AI_RELIABILITY_VALUES)[number];

/**
 * IMAGE LICENSE GOVERNANCE
 * Contratto Domain: PointOfInterest.imageLicense
 */
export const IMAGE_LICENSE_VALUES = ['own', 'cc', 'public', 'copyright'] as const;

export type ImageLicense = (typeof IMAGE_LICENSE_VALUES)[number];

/**
 * CONTENT REPORT GOVERNANCE (MF2 — §42.4)
 * Contratto DB: content_reports.status / report_kind / entity_type
 */
export const CONTENT_REPORT_STATUS_DB_VALUES = ['nuovo', 'in_verifica', 'ok', 'ko'] as const;

export type ContentReportStatusDb = (typeof CONTENT_REPORT_STATUS_DB_VALUES)[number];

export const CONTENT_REPORT_STATUS_LABELS: Record<ContentReportStatusDb, string> = {
  nuovo: 'NUOVO',
  in_verifica: 'IN VERIFICA',
  ok: 'OK',
  ko: 'KO',
};

export const CONTENT_REPORT_KIND_VALUES = [
  'entity_abuse',
  'image_abuse',
  'community_error',
  'suggestion_photo',
  'suggestion_person',
] as const;

export type ContentReportKind = (typeof CONTENT_REPORT_KIND_VALUES)[number];

export const CONTENT_REPORT_ENTITY_TYPE_VALUES = [
  'city_person',
  'poi',
  'patron',
  'photo_submission',
] as const;

export type ContentReportEntityType = (typeof CONTENT_REPORT_ENTITY_TYPE_VALUES)[number];

export const CONTENT_REPORT_REASON_VALUES = [
  'copyright',
  'other_rights',
  'unauthorized',
  'other',
  'error',
  'suggestion',
] as const;

export type ContentReportReason = (typeof CONTENT_REPORT_REASON_VALUES)[number];

export const ASSIGNMENT_STATUS_DB_VALUES = ['active', 'suspended', 'removed', 'replaced'] as const;

export type AssignmentStatusDb = (typeof ASSIGNMENT_STATUS_DB_VALUES)[number];

export function isContentReportStatusDb(value: string): value is ContentReportStatusDb {
  return (CONTENT_REPORT_STATUS_DB_VALUES as readonly string[]).includes(value);
}

export function parseContentReportStatusDb(
  value: string | null | undefined,
): ContentReportStatusDb {
  if (value && isContentReportStatusDb(value)) return value;
  throw new Error(`content_reports.status non valido: ${value ?? '(null)'}`);
}

export const CONTENT_REPORT_SOURCE_CONTEXT_VALUES = [
  'official_photo',
  'community_live',
  'city_gallery',
  'patron_gallery',
  'poi',
] as const;

export type ContentReportSourceContext = (typeof CONTENT_REPORT_SOURCE_CONTEXT_VALUES)[number];

export function isContentReportSourceContext(value: string): value is ContentReportSourceContext {
  return (CONTENT_REPORT_SOURCE_CONTEXT_VALUES as readonly string[]).includes(value);
}

export function parseContentReportSourceContext(value: string): ContentReportSourceContext {
  if (isContentReportSourceContext(value)) return value;
  throw new Error(`source_context non valido: ${value ?? '(null)'}`);
}

export const ASSIGNMENT_ENTITY_TYPE_VALUES = [
  'city_person',
  'poi',
  'patron',
  'photo_submission',
] as const;

export type AssignmentEntityType = (typeof ASSIGNMENT_ENTITY_TYPE_VALUES)[number];

export function isAssignmentEntityType(value: string): value is AssignmentEntityType {
  return (ASSIGNMENT_ENTITY_TYPE_VALUES as readonly string[]).includes(value);
}

export function isAssignmentStatusDb(value: string): value is AssignmentStatusDb {
  return (ASSIGNMENT_STATUS_DB_VALUES as readonly string[]).includes(value);
}

export function isPersonStatusDb(value: string): value is PersonStatusDb {
  return (PERSON_STATUS_VALUES as readonly string[]).includes(value);
}
