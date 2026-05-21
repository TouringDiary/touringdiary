import {
    PointOfInterest,
    PoiCategory,
    PoiSubCategory,
    OpeningHours,
    AffiliateLinks,
    MediaStatus
} from '../index';
import { SponsorTier, SPONSOR_TIER_VALUES } from '../../constants/planTypes';
import { EMPTY_AFFILIATE_LINKS, EMPTY_OPENING_HOURS } from '../shared/primitives';
import {
    POI_SUBCATEGORY_VALUES,
    TOURISM_INTEREST_VALUES,
    AI_RELIABILITY_VALUES,
    IMAGE_LICENSE_VALUES
} from '../../constants/governance';

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
    coords: { lat: number; lng: number };
    address: string;
    priceLevel: number;
    status: PointOfInterest['status'];
    visitDuration: string;
    website: string;

    // --- Media Metadata (Editable) ---
    imageCredit: string;
    imageLicense: PointOfInterest['imageLicense'] | '';

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

/**
 * normalizePoiFormData: Transizione da Form State a Domain Entity (STRICT).
 */
export const normalizePoiFormData = (formData: PoiFormData): PointOfInterest => {

    // 1. Normalizzazione Affiliate Links
    const affiliate: AffiliateLinks = { ...EMPTY_AFFILIATE_LINKS };
    Object.keys(EMPTY_AFFILIATE_LINKS).forEach((key) => {
        const val = formData.affiliate[key as keyof AffiliateLinks];
        affiliate[key as keyof AffiliateLinks] = val && val.trim() !== '' ? val.trim() : null;
    });

    // 2. Normalizzazione Opening Hours
    const openingHours: OpeningHours = {
        days: formData.openingHours.days.length > 0 ? formData.openingHours.days : ['Lun-Dom'],
        morning: formData.openingHours.morning?.trim() || null,
        afternoon: formData.openingHours.afternoon?.trim() || null,
        evening: formData.openingHours.evening?.trim() || null,
        isEstimated: formData.openingHours.isEstimated ?? false
    };

    // 3. Validazione Price Level (Strict Range 1-4)
    const priceLevel = Math.min(Math.max(Math.floor(formData.priceLevel || 1), 1), 4) as 1 | 2 | 3 | 4;

    // 4. Validazione Type-Safe (senza cast cosmetici)

    // SubCategory validation
    const subCatInput = formData.subCategory.trim();
    const isValidSubCat = (POI_SUBCATEGORY_VALUES as readonly string[]).includes(subCatInput);
    const subCategory = isValidSubCat ? (subCatInput as PoiSubCategory) : undefined;

    // Tourism Interest validation
    const isValidTourismInterest = (
        value: string
    ): value is NonNullable<PointOfInterest['tourismInterest']> => {
        return TOURISM_INTEREST_VALUES.includes(
            value as typeof TOURISM_INTEREST_VALUES[number]
        );
    };

    const tourismInterest = isValidTourismInterest(formData.tourismInterest)
        ? formData.tourismInterest
        : 'medium';

    // AI Reliability validation
    const isValidAiReliability = (
        value: string
    ): value is NonNullable<PointOfInterest['aiReliability']> => {
        return AI_RELIABILITY_VALUES.includes(
            value as typeof AI_RELIABILITY_VALUES[number]
        );
    };

    const aiReliability = isValidAiReliability(formData.aiReliability)
        ? formData.aiReliability
        : 'medium';

    // Image License validation
    const isValidImageLicense = (
        value: string
    ): value is NonNullable<PointOfInterest['imageLicense']> => {
        return IMAGE_LICENSE_VALUES.includes(
            value as typeof IMAGE_LICENSE_VALUES[number]
        );
    };

    const imageLicense = isValidImageLicense(formData.imageLicense)
        ? formData.imageLicense
        : undefined;

    // Sponsor Tier validation (Runtime Tier mapping)
    const isValidSponsorTier = (value: string): value is SponsorTier => {
        return (SPONSOR_TIER_VALUES as readonly string[]).includes(value);
    };

    const tier = isValidSponsorTier(formData.tier) ? formData.tier : null;

    // 5. Costruzione PointOfInterest STRICT
    const poi: PointOfInterest = {
        id: formData.id,
        name: formData.name.trim() || 'Senza Nome',
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        image_status: formData.image_status,
        category: formData.category,
        subCategory,
        coords: formData.coords,
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
            email: null
        },

        // Preservazione dati storici (IMPORTANTE: Evita reset involontari)
        votes: formData.votes ?? 0,
        rating: formData.rating ?? 4.5,
        reviews: formData.reviews ?? null,
        linkMetadata: formData.linkMetadata ?? null,

        createdAt: formData.createdAt,
        createdBy: formData.createdBy,
        updatedAt: formData.updatedAt,
        updatedBy: formData.updatedBy,
        cityId: formData.cityId
    };

    return poi;
};

/**
 * mapPoiToFormData: Inizializzazione del form da una Entity esistente.
 */
export const mapPoiToFormData = (poi: PointOfInterest | null): PoiFormData => {
    if (!poi) {
        return {
            id: '',
            name: '',
            description: '',
            imageUrl: '',
            image_status: 'placeholder',
            category: 'monument',
            subCategory: '',
            coords: { lat: 0, lng: 0 },
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
                isEstimated: false
            },
            votes: 0,
            rating: 4.5,
            reviews: null,
            linkMetadata: null,
            cityId: undefined
        };
    }

    // Mapping esplicito delle affiliazioni per evitare 'as any'
    const affiliateMap: Partial<Record<keyof AffiliateLinks, string>> = {};
    if (poi.affiliate) {
        const links = poi.affiliate;
        (Object.keys(EMPTY_AFFILIATE_LINKS) as Array<keyof AffiliateLinks>).forEach(key => {
            affiliateMap[key] = links[key] || '';
        });
    }

    return {
        id: poi.id,
        name: poi.name,
        description: poi.description,
        imageUrl: poi.imageUrl,
        image_status: poi.image_status,
        category: poi.category,
        subCategory: poi.subCategory || '',
        coords: poi.coords,
        address: poi.address || '',
        priceLevel: poi.priceLevel || 1,
        status: poi.status || 'published',
        visitDuration: poi.visitDuration || '',
        website: poi.contactInfo?.website || '',

        imageCredit: poi.imageCredit || '',
        imageLicense: poi.imageLicense || '',
        tourismInterest: poi.tourismInterest || 'medium',
        aiReliability: poi.aiReliability || 'medium',

        isSponsored: poi.isSponsored || false,
        tier: poi.tier || 'standard',
        showcaseExpiry: poi.showcaseExpiry || '',

        affiliate: affiliateMap,

        openingHours: {
            days: poi.openingHours?.days || [],
            morning: poi.openingHours?.morning || '',
            afternoon: poi.openingHours?.afternoon || '',
            evening: poi.openingHours?.evening || '',
            isEstimated: poi.openingHours?.isEstimated || false
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
        cityId: poi.cityId
    };
};
