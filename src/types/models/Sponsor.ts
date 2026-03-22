import { PoiCategory, PoiSubCategory, Review } from '../shared';

export type SponsorTier = 'gold' | 'silver' | 'standard';

export type SponsorDuration = '1_month' | '3_months' | '6_months' | '12_months';

export interface PartnerLog {
    id: string;
    date: string;
    type: 'message' | 'system' | 'alert';
    direction: 'inbound' | 'outbound';
    message: string;
    isUnread?: boolean;
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
    address?: string;
    status: 'pending' | 'waiting_payment' | 'approved' | 'rejected' | 'expired' | 'cancelled';
    date: string;
    lastModified?: string;
    type: 'activity' | 'guide' | 'shop' | 'tour_operator';
    poiCategory?: PoiCategory;
    poiSubCategory?: PoiSubCategory;
    startDate?: string;
    endDate?: string;
    tier?: SponsorTier;
    plan?: SponsorDuration;
    pricingVersionId?: string;
    amount?: number;
    invoiceNumber?: string;
    adminNotes?: string;
    adminNotesLastUpdated?: string;
    rejectionReason?: string;
    partnerLogs?: PartnerLog[];
    message?: string;
}

export type ShopCategory = 'gusto' | 'cantina' | 'artigianato' | 'moda';

export interface ShopProduct {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    status: 'visible' | 'hidden';
    shippingMode: 'pickup' | 'ship' | 'both';
}

export interface ShopPartner {
    id: string;
    name: string;
    cityId: string;
    category: ShopCategory;
    level: 'base' | 'premium';
    badge: 'registered' | 'gold';
    
    imageUrl: string;
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
}

// Le definizioni duplicate relative a marketing e pricing (es. TierPricingConfig, MarketingConfig) 
// sono state rimosse. La fonte di verità per questi tipi è ora 'src/types/marketing.ts'.
// Il tipo 'PriceHistoryEntry' è stato rimosso in quanto obsoleto.
