import {
  AI_RELIABILITY_VALUES,
  POI_STATUS_VALUES,
  TOURISM_INTEREST_VALUES,
} from '../../../constants/governance';
import { SPONSOR_TIER_VALUES, type SponsorTier } from '../../../constants/planTypes';
import type { DatabasePoi } from '../../../types/database';
import {
  type AffiliateLinks,
  type AiReliability,
  type ContactInfo,
  EMPTY_AFFILIATE_LINKS,
  type LinkMetadata,
  type OpeningHours,
  type PoiCategory,
  type PointOfInterest,
  type PoiSubCategory,
  type TourismInterest,
} from '../../../types/index';
import { hasRequiredOpeningHours } from '../../../types/write/poiForm';
import { parseMediaAsset } from '../parsers/media/parseMediaAsset';

// --- HELPER DURATA DEFAULT ---
export const getDefaultDuration = (category: string, subCategory?: string | null): string => {
  const sub = (subCategory || '').toLowerCase();

  // Cibo
  if (category === 'food') {
    if (sub.includes('street') || sub.includes('gelato') || sub.includes('bar')) return '30 min';
    return '1h 30min'; // Ristoranti
  }
  // Monumenti
  if (category === 'monument') {
    if (sub.includes('square') || sub.includes('piazza') || sub.includes('view')) return '30 min';
    if (sub.includes('museum') || sub.includes('archaeol') || sub.includes('castello')) return '2h';
    if (sub.includes('church')) return '45 min';
    return '1h';
  }
  // Natura
  if (category === 'nature') {
    if (sub.includes('beach')) return '3h';
    if (sub.includes('park')) return '1h';
    return '1h';
  }
  // Shopping
  if (category === 'shop') return '45 min';

  // Default generico
  return '1h';
};

const parseOpeningHoursFromDb = (raw: unknown): OpeningHours | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const days = Array.isArray(record.days)
    ? record.days.filter((d): d is string => typeof d === 'string')
    : [];
  const candidate = {
    days,
    morning: typeof record.morning === 'string' ? record.morning : '',
    afternoon: typeof record.afternoon === 'string' ? record.afternoon : '',
    evening: typeof record.evening === 'string' ? record.evening : '',
    isEstimated: record.isEstimated === true,
  };
  if (!hasRequiredOpeningHours(candidate)) return undefined;
  return {
    days: candidate.days,
    morning: candidate.morning.trim() || null,
    afternoon: candidate.afternoon.trim() || null,
    evening: candidate.evening.trim() || null,
    isEstimated: candidate.isEstimated,
  };
};

// Helper per determinare resourceType
const inferResourceType = (sub: string | null): 'guide' | 'operator' | 'service' | undefined => {
  const s = (sub || '').toLowerCase();

  if (s.includes('tour_operator') || s.includes('agency')) return 'operator';
  if (s.includes('guide')) return 'guide';

  // Servizi Utili
  if (
    [
      'pharmacy',
      'hospital',
      'police',
      'fire',
      'transport',
      'taxi',
      'bus',
      'train',
      'metro',
      'airport',
      'ferry',
      'maritime',
      'parking',
      'atm',
      'bank',
    ].some((k) => s.includes(k))
  ) {
    return 'service';
  }

  return undefined;
};

const isAiReliability = (value: unknown): value is AiReliability =>
  typeof value === 'string' && (AI_RELIABILITY_VALUES as readonly string[]).includes(value);

const isTourismInterest = (value: unknown): value is TourismInterest =>
  typeof value === 'string' && (TOURISM_INTEREST_VALUES as readonly string[]).includes(value);

const isSponsorTier = (value: unknown): value is SponsorTier =>
  typeof value === 'string' && (SPONSOR_TIER_VALUES as readonly string[]).includes(value);

function parsePoiStatusFromDb(
  raw: string | null | undefined,
): PointOfInterest['status'] | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  const normalized = raw.trim().toLowerCase();
  if ((POI_STATUS_VALUES as readonly string[]).includes(normalized)) {
    return normalized as PointOfInterest['status'];
  }
  throw new Error(`Invalid POI status "${raw}"`);
}

function parsePriceLevelFromDb(raw: unknown): 1 | 2 | 3 | 4 | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (raw === 1 || raw === 2 || raw === 3 || raw === 4) return raw;
  return undefined;
}

function parseAffiliateLinksFromDb(raw: unknown): AffiliateLinks {
  if (raw == null) return { ...EMPTY_AFFILIATE_LINKS };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid POI affiliate JSON');
  }
  const record = raw as Record<string, unknown>;
  const out: AffiliateLinks = { ...EMPTY_AFFILIATE_LINKS };
  for (const key of Object.keys(EMPTY_AFFILIATE_LINKS) as Array<keyof AffiliateLinks>) {
    const value = record[key];
    if (value === null || value === undefined) {
      out[key] = null;
    } else if (typeof value === 'string') {
      out[key] = value.trim() || null;
    } else {
      throw new Error(`Invalid affiliate field "${key}"`);
    }
  }
  return out;
}

function parseLinkMetadataFromDb(raw: unknown): Record<string, LinkMetadata> | null {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid POI link_metadata JSON');
  }
  const record = raw as Record<string, unknown>;
  const out: Record<string, LinkMetadata> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Invalid link_metadata entry "${key}"`);
    }
    const entry = value as Record<string, unknown>;
    const verified = entry.verified === true;
    const excludedRaw = entry.excluded;
    if (!Array.isArray(excludedRaw)) {
      throw new Error(`Invalid link_metadata excluded for "${key}" (array required).`);
    }
    const excluded = excludedRaw.filter((item): item is string => typeof item === 'string');
    out[key] = { verified, excluded };
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseContactInfoFromDb(
  rawWebsite: string | null | undefined,
  rawPhone: string | null | undefined,
  rawContactJson: unknown,
): ContactInfo {
  let email: string | null = null;
  let whatsapp: string | null = null;
  if (rawContactJson && typeof rawContactJson === 'object' && !Array.isArray(rawContactJson)) {
    const record = rawContactJson as Record<string, unknown>;
    if (record.email === null || typeof record.email === 'string') {
      email = record.email?.trim() || null;
    }
    if (record.whatsapp === null || typeof record.whatsapp === 'string') {
      whatsapp = record.whatsapp?.trim() || null;
    }
  }
  return {
    website: rawWebsite?.trim() || null,
    phone: rawPhone?.trim() || null,
    email,
    whatsapp,
  };
}

/** DB nullable → domain optional (undefined, not null). */
const toOptional = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

// --- MAPPING HELPERS (Strict Typing) ---
export const mapDbPoiToApp = (db: DatabasePoi): PointOfInterest => {
  try {
    const cat = (db.category as PoiCategory) || 'monument';
    const subCat = toOptional(db.sub_category as PoiSubCategory | null);

    const contactInfo = parseContactInfoFromDb(db.website, db.phone, db.contact_info);
    const affiliate = parseAffiliateLinksFromDb(db.affiliate);
    const imageAsset = parseMediaAsset(
      db.image_url,
      db.image_status,
      db.image_credit,
      db.image_license,
    );

    return {
      id: db.id,
      cityId: toOptional(db.city_id),
      name: db.name || 'Senza Nome',
      category: cat,
      subCategory: subCat,
      description: db.description || '',
      imageUrl: imageAsset.url,
      // Media Governance (DB-Driven)
      image_status: imageAsset.mediaStatus,
      imageCredit: imageAsset.credit,
      imageLicense: imageAsset.license,
      imageAsset,

      coords:
        db.coords_lat != null &&
        db.coords_lng != null &&
        Number.isFinite(db.coords_lat) &&
        Number.isFinite(db.coords_lng)
          ? { lat: db.coords_lat, lng: db.coords_lng }
          : undefined,
      address: db.address || '',
      rating: db.rating || 0,
      votes: db.votes || 0,
      status: parsePoiStatusFromDb(db.status),
      dateAdded: toOptional(db.date_added),

      visitDuration: db.visit_duration || getDefaultDuration(cat, db.sub_category ?? undefined),

      priceLevel: parsePriceLevelFromDb(db.price_level),

      // Safe JSON casting
      openingHours: parseOpeningHoursFromDb(db.opening_hours) ?? null,
      openingHoursSourceLoaded: true,
      openingHoursSource: db.opening_hours,
      subCategorySourceLoaded: true,
      subCategorySource: db.sub_category,

      isSponsored: db.is_sponsored || false,
      wikimediaPublicEnabled: db.wikimedia_public_enabled === true,
      tier: isSponsorTier(db.tier) ? db.tier : undefined,

      affiliate: affiliate,

      showcaseExpiry: toOptional(db.showcase_expiry),

      aiReliability: isAiReliability(db.ai_reliability) ? db.ai_reliability : undefined,
      tourismInterest: isTourismInterest(db.tourism_interest) ? db.tourism_interest : undefined,
      // Metadata
      createdAt: toOptional(db.created_at),
      createdBy: toOptional(db.created_by),
      updatedAt: toOptional(db.updated_at),
      updatedBy: toOptional(db.updated_by),
      lastVerified: toOptional(db.last_verified),

      // Link Metadata (Safe JSON casting)
      linkMetadata: parseLinkMetadataFromDb(db.link_metadata),

      // --- CAMPI AGGIUNTIVI (HARDENING) ---
      reviews: null, // Le recensioni vengono caricate separatamente se necessario
      gallery: [], // La galleria POI non è ancora gestita a livello di riga singola
      fullDescription: undefined,
      tips: undefined,
      tags: [],
      suggestedBy: db.suggested_by || undefined,
      vatNumber: undefined,
      listExpiry: undefined,
      specialtyProduct: undefined,
      distance: undefined,

      // --- DIARY 2.0 ---
      resourceType: inferResourceType(subCat ?? null),
      contactInfo: contactInfo,
    };
  } catch (e) {
    console.error('CRITICAL: Error mapping POI:', db.id, e);
    // NON ritorniamo più un fallback safe per non mascherare problemi di integrità.
    // Il chiamante gestirà l'errore a livello di UI (es. ErrorBoundary)
    throw new Error(
      `POI Mapping Failed for ID ${db.id}: ${e instanceof Error ? e.message : 'Unknown error'}`,
    );
  }
};
