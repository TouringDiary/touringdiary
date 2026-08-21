import {
  AI_RELIABILITY_VALUES,
  IMAGE_LICENSE_VALUES,
  POI_SUBCATEGORY_VALUES,
  TOURISM_INTEREST_VALUES,
} from '../../constants/governance';
import { SPONSOR_TIER_VALUES, type SponsorTier } from '../../constants/planTypes';
import { sanitizeMediaStatus } from '../../utils/media';
import type {
  AffiliateLinks,
  MediaStatus,
  OpeningHours,
  PoiCategory,
  PointOfInterest,
  PoiSubCategory,
} from '../index';
import { EMPTY_AFFILIATE_LINKS } from '../shared/primitives';

/**
 * PoiFormData: Stato intermedio per il form di editing POI.
 *
 * ARCHITETTURA:
 * Questo tipo separa lo stato transitorio della UI (permissivo) dal domain model
 * PointOfInterest (STRICT).
 */
export interface PoiFormData {
  // --- Identità & Core ---
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  image_status: MediaStatus;
  category: PoiCategory;
  subCategory: string;
  /** Assente = nessuna posizione nota (allineato a PointOfInterest.coords?). Partial = editing in corso. */
  coords?: { lat?: number; lng?: number };
  address: string;
  priceLevel: number;
  status: PointOfInterest['status'];
  visitDuration: string;
  website: string;

  // --- Media Metadata (Editable) ---
  imageCredit: string;
  imageLicense: NonNullable<PointOfInterest['imageLicense']> | '';

  // --- AI & Quality (Editable) ---
  tourismInterest: NonNullable<PointOfInterest['tourismInterest']> | '';
  aiReliability: NonNullable<PointOfInterest['aiReliability']> | '';

  // --- Marketing & Sponsorship (Editable) ---
  isSponsored: boolean;
  tier: SponsorTier | '';
  showcaseExpiry: string;

  // --- Affiliate (Editable Partial) ---
  affiliate: Partial<Record<keyof AffiliateLinks, string>>;

  // --- Opening Hours (Flat Form State) ---
  openingHours: {
    days: string[];
    morning: string;
    afternoon: string;
    evening: string;
    isEstimated: boolean;
  };

  // --- Readonly/System Metadata (Per Visualizzazione e Preservazione) ---
  readonly createdAt?: string;
  readonly createdBy?: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;

  // Dati storici da non resettare durante l'editing
  readonly votes?: number;
  readonly rating?: number;
  readonly reviews?: PointOfInterest['reviews'];
  readonly linkMetadata?: PointOfInterest['linkMetadata'];
  readonly cityId?: string;
}

const isPoiSubCategory = (value: string): value is PoiSubCategory => {
  for (const v of POI_SUBCATEGORY_VALUES) {
    if (v === value) return true;
  }
  return false;
};

const isTourismInterest = (
  value: string,
): value is NonNullable<PointOfInterest['tourismInterest']> => {
  for (const v of TOURISM_INTEREST_VALUES) {
    if (v === value) return true;
  }
  return false;
};

const isAiReliability = (value: string): value is NonNullable<PointOfInterest['aiReliability']> => {
  for (const v of AI_RELIABILITY_VALUES) {
    if (v === value) return true;
  }
  return false;
};

const isImageLicense = (value: string): value is NonNullable<PointOfInterest['imageLicense']> => {
  for (const v of IMAGE_LICENSE_VALUES) {
    if (v === value) return true;
  }
  return false;
};

const isSponsorTier = (value: string): value is SponsorTier => {
  for (const v of SPONSOR_TIER_VALUES) {
    if (v === value) return true;
  }
  return false;
};

const isPriceLevel = (value: number): value is 1 | 2 | 3 | 4 =>
  value === 1 || value === 2 || value === 3 || value === 4;

/**
 * Opening hours di dominio: giorni obbligatori + almeno una fascia oraria.
 * Non inventa default (es. Lun-Dom).
 */
export const hasRequiredOpeningHours = (oh: PoiFormData['openingHours']): boolean => {
  if (!oh.days || oh.days.length === 0) return false;
  const morning = oh.morning?.trim() ?? '';
  const afternoon = oh.afternoon?.trim() ?? '';
  const evening = oh.evening?.trim() ?? '';
  return morning.length > 0 || afternoon.length > 0 || evening.length > 0;
};

/**
 * normalizePoiFormData: Transizione da Form State a Domain Entity (STRICT).
 * Opening hours incomplete → Error (non inventa placeholder).
 */
export const normalizePoiFormData = (formData: PoiFormData): PointOfInterest => {
  // 1. Normalizzazione Affiliate Links
  const affiliate: AffiliateLinks = { ...EMPTY_AFFILIATE_LINKS };
  (Object.keys(EMPTY_AFFILIATE_LINKS) as Array<keyof AffiliateLinks>).forEach((key) => {
    const val = formData.affiliate[key];
    affiliate[key] = val && val.trim() !== '' ? val.trim() : null;
  });

  // 2. Opening Hours — obbligatorie per dominio (no fallback inventato)
  if (!hasRequiredOpeningHours(formData.openingHours)) {
    throw new Error(
      'Opening hours incomplete: days and at least one time slot (morning/afternoon/evening) are required.',
    );
  }
  const openingHours: OpeningHours = {
    days: formData.openingHours.days,
    morning: formData.openingHours.morning.trim() || null,
    afternoon: formData.openingHours.afternoon.trim() || null,
    evening: formData.openingHours.evening.trim() || null,
    isEstimated: formData.openingHours.isEstimated ?? false,
  };

  // 3. Price Level — opzionale sul domain; 1..4 solo se valore form valido (form UX default = 1)
  const floorLevel = Math.floor(formData.priceLevel);
  const priceLevel = isPriceLevel(floorLevel) ? floorLevel : undefined;

  // 4. Validazione runtime type-safe (type guard locali)
  const subCatInput = formData.subCategory.trim();
  const subCategory = isPoiSubCategory(subCatInput) ? subCatInput : undefined;

  const tourismInterest = isTourismInterest(formData.tourismInterest)
    ? formData.tourismInterest
    : undefined;

  const aiReliability = isAiReliability(formData.aiReliability)
    ? formData.aiReliability
    : undefined;

  const imageLicense = isImageLicense(formData.imageLicense) ? formData.imageLicense : undefined;

  const tier = isSponsorTier(formData.tier) ? formData.tier : undefined;

  const lat = formData.coords?.lat;
  const lng = formData.coords?.lng;
  const hasUsableCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);

  // 5. Costruzione PointOfInterest STRICT
  const poi: PointOfInterest = {
    id: formData.id,
    name: formData.name.trim() || 'Senza Nome',
    description: formData.description.trim(),
    imageUrl: formData.imageUrl.trim(),
    image_status: formData.image_status,
    category: formData.category,
    subCategory,
    ...(hasUsableCoords ? { coords: { lat, lng } } : {}),
    address: formData.address.trim() || undefined,
    priceLevel,
    status: formData.status || 'published',
    visitDuration: formData.visitDuration.trim() || '1 h',

    imageCredit: formData.imageCredit.trim() || undefined,
    imageLicense,

    tourismInterest,
    aiReliability,

    isSponsored: formData.isSponsored,
    tier,
    showcaseExpiry: formData.showcaseExpiry || undefined,

    affiliate,
    openingHours,

    contactInfo: {
      website: formData.website.trim() || null,
      phone: null,
      whatsapp: null,
      email: null,
    },

    // Preservazione dati storici (assenza = undefined/null, mai valori inventati)
    votes: formData.votes,
    rating: formData.rating,
    reviews: formData.reviews ?? null,
    linkMetadata: formData.linkMetadata ?? null,

    createdAt: formData.createdAt,
    createdBy: formData.createdBy,
    updatedAt: formData.updatedAt,
    updatedBy: formData.updatedBy,
    cityId: formData.cityId,
  };

  return poi;
};

/**
 * mapPoiToFormData: Inizializzazione del form da una Entity esistente.
 */
export const mapPoiToFormData = (poi: PointOfInterest | null): PoiFormData => {
  if (!poi) {
    // Default UX di creazione (non sono sentinel di dominio): giorni completi;
    // fasce orarie vuote → validate()/normalize richiedono almeno una fascia.
    return {
      id: '',
      name: '',
      description: '',
      imageUrl: '',
      image_status: 'placeholder',
      category: 'monument',
      subCategory: '',
      address: '',
      priceLevel: 1,
      status: 'published',
      visitDuration: '1 h',
      website: '',
      imageCredit: '',
      imageLicense: '',
      tourismInterest: 'medium',
      aiReliability: 'medium',
      isSponsored: false,
      tier: 'standard',
      showcaseExpiry: '',
      affiliate: {},
      openingHours: {
        days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
        morning: '',
        afternoon: '',
        evening: '',
        isEstimated: false,
      },
      reviews: null,
      linkMetadata: null,
      cityId: undefined,
    };
  }

  // Mapping esplicito delle affiliazioni per evitare 'as any'
  const affiliateMap: Partial<Record<keyof AffiliateLinks, string>> = {};
  if (poi.affiliate) {
    const links = poi.affiliate;
    (Object.keys(EMPTY_AFFILIATE_LINKS) as Array<keyof AffiliateLinks>).forEach((key) => {
      affiliateMap[key] = links[key] ?? '';
    });
  }

  return {
    id: poi.id,
    name: poi.name,
    description: poi.description,
    imageUrl: poi.imageUrl ?? '',
    image_status: sanitizeMediaStatus(poi.image_status),
    category: poi.category,
    subCategory: poi.subCategory ?? '',
    coords: poi.coords ? { lat: poi.coords.lat, lng: poi.coords.lng } : undefined,
    address: poi.address ?? '',
    priceLevel: poi.priceLevel ?? 1,
    status: poi.status ?? 'published',
    visitDuration: poi.visitDuration ?? '',
    website: poi.contactInfo?.website ?? '',

    imageCredit: poi.imageCredit ?? '',
    imageLicense: poi.imageLicense ?? '',
    tourismInterest: poi.tourismInterest ?? 'medium',
    aiReliability: poi.aiReliability ?? 'medium',

    isSponsored: poi.isSponsored ?? false,
    tier: poi.tier ?? 'standard',
    showcaseExpiry: poi.showcaseExpiry ?? '',

    affiliate: affiliateMap,

    openingHours: {
      days: poi.openingHours?.days ?? [],
      morning: poi.openingHours?.morning ?? '',
      afternoon: poi.openingHours?.afternoon ?? '',
      evening: poi.openingHours?.evening ?? '',
      isEstimated: poi.openingHours?.isEstimated ?? false,
    },

    createdAt: poi.createdAt,
    createdBy: poi.createdBy,
    updatedAt: poi.updatedAt,
    updatedBy: poi.updatedBy,

    // Preservazione dati storici per il form state
    votes: poi.votes,
    rating: poi.rating,
    reviews: poi.reviews,
    linkMetadata: poi.linkMetadata,
    cityId: poi.cityId,
  };
};
