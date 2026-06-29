import type { PoiCategory, PoiSubCategory, OpeningHours, Review, AffiliateLinks, LinkMetadata, ContactInfo } from '../shared';
export type { PoiCategory, PoiSubCategory, OpeningHours, Review, AffiliateLinks, LinkMetadata, ContactInfo };
import { MediaStatus, MediaAsset } from './Media';
import type { PlanType, SponsorTier, RuntimeTier } from '../../constants/planTypes';

import { CITY_STATUS_VALUES, CITY_BADGE_VALUES, POI_STATUS_VALUES } from '../../constants/governance';

// --- IDENTITY TYPES ---
export interface CityIdentity {
    id: string;
    slug: string;
    name: string;
}

// --- GEOGRAPHICAL TYPES ---

export interface PointOfInterest {
    id: string;
    name: string;
    description: string;
    fullDescription?: string;
    imageUrl: string;
    image_status?: MediaStatus;
    imageAsset?: MediaAsset;

    // Copyright Metadata
    imageCredit?: string;
    imageLicense?: 'own' | 'cc' | 'public' | 'copyright';

    gallery?: MediaAsset[];
    category: PoiCategory;
    subCategory?: PoiSubCategory;
    rating: number;
    votes: number;
    coords: { lat: number; lng: number };
    priceLevel?: 1 | 2 | 3 | 4;
    tips?: string;
    address?: string;
    visitDuration?: string;
    suggestedBy?: string;
    openingHours?: OpeningHours | null;
    reviews?: Review[] | null;
    tags?: string[];

    // Advanced Taxonomy Fields
    isSponsored?: boolean;
    tier?: SponsorTier;
    planType?: PlanType;
    showcaseExpiry?: string;
    dateAdded?: string;

    // METADATA TRACKING
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;

    // VALIDATION METADATA
    lastVerified?: string;

    listExpiry?: string;
    specialtyProduct?: string;

    // Status Visibilità
    status?: typeof POI_STATUS_VALUES[number];

    // AI Self-Assessment (UPDATED WITH + VARIANTS)
    aiReliability?: 'high' | 'medium' | 'low' | 'high+' | 'medium+' | 'low+' | 'duplicate' | 'invalidated';

    // Livello Interesse Turistico
    tourismInterest?: 'high' | 'medium' | 'low';

    // Monetization & Affiliate
    affiliate?: AffiliateLinks | null;

    // Metadata per la gestione AI dei link
    linkMetadata?: Record<string, LinkMetadata> | null;

    // Context
    cityId?: string;

    // Business Linking
    vatNumber?: string;

    // Geo-Spatial
    distance?: number;

    // --- DIARY 2.0 RESOURCES ---
    resourceType?: 'guide' | 'operator' | 'service';
    contactInfo?: ContactInfo | null;
}

export type BadgeType = typeof CITY_BADGE_VALUES[number];

export interface CitySummary {
    id: string;
    slug: string;
    name: string;
    continent: string;
    nation: string;
    region_id?: string;
    adminRegion: string;
    tourist_zone_id?: string;
    zone: string;
    description: string;
    imageUrl: string;
    image_status?: MediaStatus;
    imageAsset?: MediaAsset;
    imageCredit?: string;
    imageLicense?: 'own' | 'cc' | 'public' | 'copyright';

    heroImage?: string;
    hero_status?: MediaStatus;
    heroAsset?: MediaAsset;

    rating: number;
    visitors: number;
    isFeatured: boolean;
    specialBadge?: BadgeType;
    homeOrder?: number;
    coords: { lat: number; lng: number };
    status: typeof CITY_STATUS_VALUES[number];
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    tags?: string[];
    cityTypes?: string[];
    classificationExplainability?: Record<string, number>;
    hasGeneratedContent?: boolean;

    // SEO Slugs (Geografici)
    continent_slug?: string;
    nation_slug?: string;
    region_slug?: string;
    zone_slug?: string;
}

export interface PatronDetails {
    name: string;
    date: string;
    history: string;
    imageUrl: string;
    image_status: MediaStatus;
    imageAsset: MediaAsset;
}

export interface FamousPerson {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
    image_status?: MediaStatus;
    imageAsset?: MediaAsset;
    fullBio?: string;
    quote?: string;
    lifespan?: string;
    famousWorks?: string[];
    awards?: string[];
    privateLife?: string;
    collaborations?: string[];
    careerStats?: { label: string; value: string }[];
    relatedPlaces?: {
        id: string;
        name: string;
        address: string;
        coords: { lat: number; lng: number };
        notes?: string;
        visitDuration?: string;
        priceLevel?: 1 | 2 | 3 | 4;
    }[];
    status?: 'published' | 'draft';
    orderIndex?: number;
}

export interface CityEvent {
    id: string;
    name: string;
    date: string;
    category: string;
    description: string;
    location: string;
    coords: { lat: number; lng: number };
    imageUrl?: string;
    image_status?: MediaStatus;
    imageAsset?: MediaAsset;
    cityId?: string;
    cityName?: string;
    cityBadge?: string;
    metadata?: any;
    orderIndex?: number;
}

export interface CityService {
    id: string;
    type: 'airport' | 'train' | 'bus' | 'taxi' | 'maritime' | 'emergency' | 'pharmacy' | 'other' | 'transport' | 'info' | 'hospital' | 'police' | 'fire' | 'atm' | 'post' | 'luggage' | 'water' | 'consulate';
    name: string;
    contact: string;
    category?: string;
    description?: string;
    url?: string;
    address?: string;
    orderIndex?: number;
}

export interface CityGuide {
    id: string;
    name: string;
    slug?: string;
    isOfficial: boolean;
    languages: string[];
    specialties: string[];
    phone?: string;
    email?: string;
    website?: string;
    imageUrl?: string;
    rating?: number;
    reviews?: Review[];
    isSponsored?: boolean;
    orderIndex?: number;
}

export interface CityTourOperator {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    coords?: { lat: number; lng: number };
    rating?: number;
    reviews?: Review[];
    destinations?: string[];
    servicesOffered?: string[];
    openingHours?: OpeningHours | null;
    licenseNumber?: string;
    ownerId?: string;
    isSponsored?: boolean;
}

export interface CityDetails extends CitySummary {
    details: {
        subtitle: string;
        heroImage: string;
        hero_status?: MediaStatus;
        heroAsset?: MediaAsset;
        historySnippet: string;
        historyFull: string;
        historySections?: any[];
        historyGallery?: MediaAsset[];

        officialWebsite?: string;

        patron: string;
        patronDetails?: PatronDetails;

        ratings: {
            cultura: number; monumenti: number; musei_arte: number; tradizione: number; architettura: number;
            natura: number; mare_spiagge: number; paesaggi: number; clima: number; sostenibilita: number;
            gusto: number; cucina: number; vita_notturna: number; caffe_bar: number; mercati: number;
            viaggiatore: number; mobilita: number; accoglienza: number; costo: number; sicurezza: number;
        };

        famousPeople: FamousPerson[];

        allPois: PointOfInterest[];

        // Filtered lists (derived usually)
        topAttractions: PointOfInterest[];
        foodSpots: PointOfInterest[];
        hotels: PointOfInterest[];
        newDiscoveries: PointOfInterest[];
        leisureSpots: PointOfInterest[];

        gallery: MediaAsset[];

        services: CityService[];
        events: CityEvent[];
        guides: CityGuide[];
        tourOperators?: CityTourOperator[];

        seasonalVisitors?: { spring: number, summer: number, autumn: number, winter: number };
        generationLogs?: string[];

        idealFor?: string[];
    };

    /**
     * Marca una città costruita in memoria da `buildVirtualCity` (Around Me / fusione
     * "Tutto Incluso"). Non esiste su DB: identifica il dominio "Virtual City",
     * concetto distinto dal semplice preload.
     */
    isVirtual?: boolean;
}
