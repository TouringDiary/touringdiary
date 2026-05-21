import {
    PoiCategory,
    PoiSubCategory,
    Review,
    SponsorLifecycleStatus,
    ShopProductStatus
} from '../shared';
import { MediaStatus } from './Media';
import type { PlanType, SponsorTier } from '../../constants/planTypes';
export type { PlanType, SponsorTier };
import { SHOP_CATEGORY_VALUES } from '../../constants/governance';

export type SponsorDuration = '1_month' | '3_months' | '6_months' | '12_months';

export interface PartnerLog {
    id: string;
    date: string;
    type: 'message' | 'system' | 'alert';
    direction: 'inbound' | 'outbound';
    message: string;
    isUnread?: boolean;
}

// SponsorLifecycleStatus moved to src/types/shared/SponsorStatus.ts

export interface Sponsor {
    id: string;
    cityId: string;
    contactName: string;
    companyName: string;
    vatNumber: string;
    email: string;
    phone: string;
    address?: string;
    status: SponsorLifecycleStatus;
    tier: SponsorTier;
    type: PlanType;
    startDate: string;
    endDate: string;
    amount?: number;
    isExpired?: boolean; // Runtime derived status (status === 'approved' && endDate < today)

    ownerId?: string; // NEW: Stable UUID ownership
    profileId?: string; // Legacy/Alias for compatibility
    poiId?: string;
    shopId?: string;
    guideId?: string;
    operatorId?: string;
    requestId?: string;

    // Internal Documentation
    adminNotes?: string;
    adminNotesLastUpdated?: string;

    partnerLogs?: PartnerLog[];
    unreadCount?: number;
    identityType?: 'linked' | 'email_match' | 'vat_match' | 'guest';

    // Geographic Identity (Resolved via Join)
    continent?: string;
    country?: string;
    region?: string;
    touristZone?: string;
    city?: string;
    slug?: string; // NEW: Business Identity Slug for V4 Routing
}

/**
 * Rappresenta uno sponsor con i dati della risorsa associata già risolti tramite JOIN.
 * Usato per il rendering UI senza ulteriori fetch.
 */
export interface ResolvedSponsor extends Sponsor {
    resolvedData?: {
        name: string;
        description: string;
        imageUrl: string;
        image_status?: MediaStatus;
        coords: { lat: number; lng: number };
        category?: PoiCategory;
        subCategory?: PoiSubCategory;
        // Metadati specifici per tipo
        specialties?: string[]; // Per guide
        languages?: string[];   // Per guide
        address?: string;
        website?: string;
        phone?: string;
        openingHours?: string;
        slug?: string;
    };
}

export interface SponsorRequest {
    id: string;
    cityId: string;
    contactName: string;
    companyName: string;
    vatNumber?: string;
    sdiCode?: string;
    email: string;
    phone: string;
    requesterEmail?: string;
    requesterPhone?: string;
    address?: string;
    status: SponsorLifecycleStatus;
    date: string;
    lastModified?: string;
    type: PlanType;
    poiCategory?: PoiCategory;
    poiSubCategory?: PoiSubCategory;

    // Metadata UI (Aggiunti per creazione automatica risorsa)
    imageUrl?: string;
    image_status?: MediaStatus;
    coordsLat?: number;
    coordsLng?: number;
    description?: string;

    // Campi specifici Guide
    languages?: string[];
    specialties?: string[];
    licenseNumber?: string;

    startDate?: string;
    endDate?: string;
    tier?: SponsorTier;
    plan?: SponsorDuration;
    pricingVersionId?: string;
    amount?: number;
    isExpired?: boolean; // Runtime derived status (status === 'approved' && endDate < today)
    invoiceNumber?: string;
    adminNotes?: string;
    adminNotesLastUpdated?: string;
    rejectionReason?: string;
    partnerLogs?: PartnerLog[];
    message?: string;
    profileId?: string;
    ownerId?: string; // NEW: Consistency with Sponsor type

    // Resource Linking (FK from active contract)
    poiId?: string;
    shopId?: string;
    guideId?: string;
    operatorId?: string;
    requestId?: string;

    unreadCount?: number;
    identityType?: 'linked' | 'email_match' | 'vat_match' | 'guest';

    // Geographic Identity (Resolved via Join)
    continent?: string;
    country?: string;
    region?: string;
    touristZone?: string;
    city?: string;
    slug?: string;
}

export type ShopCategory = typeof SHOP_CATEGORY_VALUES[number];

export interface ShopProduct {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    status: ShopProductStatus;
    shippingMode: 'pickup' | 'ship' | 'both';
}

export interface ShopPartner {
    id: string;
    name: string;
    slug?: string;
    cityId: string;
    category: ShopCategory;
    level: 'base' | 'premium';
    badge: 'registered' | 'gold';

    imageUrl: string;
    image_status?: MediaStatus;
    gallery: string[];
    products: ShopProduct[];

    // Storytelling fields
    description?: string;
    shortBio?: string;
    foundedYear?: number;

    likes: number;
    rating: number;
    reviewsCount: number;
    reviews: Review[];

    vatNumber: string;
    address: string;
    coords: { lat: number; lng: number };
    phone: string;
    email: string;
    website?: string;

    shippingInfo?: string;
    paymentInfo?: string;

    aiCredits: number;
    isTipico?: boolean;
    ownerId?: string; // NEW: Stable UUID ownership
}

// Le definizioni duplicate relative a marketing e pricing (es. TierPricingConfig, MarketingConfig) 
// sono state rimosse. La fonte di verità per questi tipi è ora 'src/types/marketing.ts'.
// Il tipo 'PriceHistoryEntry' è stato rimosso in quanto obsoleto.

export interface SponsorSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface SponsorQueryOptions {
    page: number;
    pageSize: number;
    status: SponsorRequest['status'];
    filters?: {
        cityId?: string;
        tier?: string;
        [key: string]: any;
    };
    sortConfig?: SponsorSortConfig;
    searchTerm?: string;
}

export interface SponsorStats {
    pending: number;
    waiting: number;       // alias per waiting_payment (usato dalla UI e dal hook)
    approved: number;
    expired: number;       // sponsor scaduti (tab dedicata nella UI)
    rejected: number;
    cancelled: number;
    converted: number;
    unreadMessages: number;
}

export interface GeoFilters {
    continent?: string;
    nation?: string;
    adminRegion?: string;
    zone?: string;
    cityId?: string;
    tier?: string;
    onlyUnread?: boolean;
}

export interface GeoOptions {
    continents: any[];
    nations: any[];
    adminRegions: any[];
    zones: any[];
    cities: any[];
    tiers: string[];
}

/**
 * Alias per compatibilità con i vecchi import da types/core
 */
export type SortConfig<T> = SponsorSortConfig;

