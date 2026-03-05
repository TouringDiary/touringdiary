
import { PoiCategory, PoiSubCategory, OpeningHours, Review, AffiliateLinks, LinkMetadata } from '../shared';
import { SponsorTier } from './Sponsor';

// --- GEOGRAPHICAL TYPES ---

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  fullDescription?: string;
  imageUrl: string;
  // Copyright Metadata
  imageCredit?: string; 
  imageLicense?: 'own' | 'cc' | 'public' | 'copyright';
  
  gallery?: string[]; 
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
  openingHours?: OpeningHours;
  reviews?: Review[];
  tags?: string[]; 

  // Advanced Taxonomy Fields
  isSponsored?: boolean; 
  tier?: SponsorTier; 
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
  status?: 'published' | 'draft' | 'needs_check' | 'restored'; 
  
  // AI Self-Assessment (UPDATED WITH + VARIANTS)
  // Standard (Flash): high, medium, low
  // Bonificati (Pro): high+, medium+, low+
  aiReliability?: 'high' | 'medium' | 'low' | 'high+' | 'medium+' | 'low+' | 'duplicate' | 'invalidated'; 
  
  // Livello Interesse Turistico
  tourismInterest?: 'high' | 'medium' | 'low';

  // Monetization & Affiliate
  affiliate?: AffiliateLinks; 
  
  // Metadata per la gestione AI dei link
  linkMetadata?: Record<string, LinkMetadata>; 

  // Context
  cityId?: string;

  // Business Linking
  vatNumber?: string; 
  
  // Geo-Spatial
  distance?: number;

  // --- DIARY 2.0 RESOURCES ---
  resourceType?: 'guide' | 'operator' | 'service';
  contactInfo?: {
      phone?: string;
      email?: string;
      whatsapp?: string;
      website?: string;
  };
}

export type BadgeType = 'event' | 'trend' | 'season' | 'editor' | 'destination';

export interface CitySummary {
    id: string;
    name: string;
    continent: string;
    nation: string;
    adminRegion: string;
    zone: string;
    description: string;
    imageUrl: string;
    heroImage?: string;
    rating: number;
    visitors: number;
    isFeatured: boolean;
    specialBadge?: BadgeType;
    homeOrder?: number; 
    coords: { lat: number; lng: number };
    status: 'published' | 'draft' | 'needs_check' | 'restored';
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    tags?: string[];
    hasGeneratedContent?: boolean; 
}

export interface PatronDetails {
    name: string;
    date: string;
    history: string;
    imageUrl: string;
}

export interface FamousPerson {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
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
    cityId?: string;
    cityName?: string;
    cityBadge?: string;
    metadata?: any;
    orderIndex?: number;
}

export interface CityService {
    id: string;
    type: 'airport' | 'train' | 'bus' | 'taxi' | 'maritime' | 'emergency' | 'pharmacy' | 'other' | 'tour_operator' | 'agency' | 'transport' | 'info' | 'hospital' | 'police' | 'fire' | 'atm' | 'post' | 'luggage' | 'water' | 'consulate';
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

export interface CityDetails extends CitySummary {
    imageCredit?: string; 
    imageLicense?: 'own' | 'cc' | 'public' | 'copyright'; 
    details: {
        subtitle: string;
        heroImage: string;
        historySnippet: string;
        historyFull: string;
        historySections?: any[]; 
        historyGallery?: string[];
        
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
        
        gallery: string[];
        
        services: CityService[];
        events: CityEvent[];
        guides: CityGuide[];
        
        seasonalVisitors?: { spring: number, summer: number, autumn: number, winter: number };
        generationLogs?: string[];
        
        idealFor?: string[];
    };
}
