
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

// --- NEW PRICING TYPES ---

export interface TierPricingConfig {
    basePrice: number;       // Prezzo pieno
    promoPrice?: number;     // Prezzo scontato
    promoLabel?: string;     // Es. "Black Friday"
    promoActive: boolean;    // Switch on/off
    validFrom?: string;      // ISO Date YYYY-MM-DD
    validTo?: string;        // ISO Date YYYY-MM-DD
    features?: { photos: number, speed?: number, products?: number }; // Limiti tecnici
    
    // NEW: Testi personalizzabili per le 3 feature visualizzate nella card
    customFeatureLabels?: [string, string, string]; 
}

export interface PriceHistoryEntry {
    id: string;
    periodLabel: string; // Es. "Listino 2024"
    validFrom: string;
    validTo: string;
    silverPrice: number;
    goldPrice: number;
    shopPrice: number;
    guidePrice: number;
    promoName?: string;  // Se era una promo
    archivedAt: string;
}

// CONFIGURAZIONE LIMITI AI (Admin Controllable)
// Definizione rigorosa dei ruoli per la gestione quote
export interface AiLimitsConfig {
    guest: number;          // Ospite (Non registrato)
    registered: number;     // Utente Registrato (Free)
    premium: number;        // Utente Premium (Traveler Pro)
    premium_plus: number;   // NEW: Utente Premium Plus (Traveler Pro+)
    sponsor: number;        // Sponsor (Silver/Gold Activity)
    pro: number;            // Professionisti (Guide / Tour Operator)
    shop: number;           // Negozianti (Shop Partner)
}

export interface MarketingConfig {
    silver: TierPricingConfig;
    gold: TierPricingConfig;
    guide: TierPricingConfig;
    shop: TierPricingConfig;
    tourOperator: TierPricingConfig;
    // Piani Utente
    premiumUser?: TierPricingConfig;
    premiumUserPlus?: TierPricingConfig; // NEW: Piano Superiore
    
    novitaDuration: number;
    aiLimits?: AiLimitsConfig; 
}
