import {
    POI_SUBCATEGORY_VALUES,
    POI_CATEGORY_VALUES,
    SUGGESTION_TYPE_VALUES,
    JOURNEY_PHASE_VALUES,
    PLAN_TYPE_VALUES,
    AI_RELIABILITY_VALUES,
    TOURISM_INTEREST_VALUES,
    SHOP_PRODUCT_STATUS_VALUES
} from '../../constants/governance';

// Shared Primitives & Enums
// Questi tipi sono usati trasversalmente da più modelli (City, Itinerary, Sponsor)

export type PoiCategory = typeof POI_CATEGORY_VALUES[number];

export type PoiSubCategory = typeof POI_SUBCATEGORY_VALUES[number];

export type AiReliability = typeof AI_RELIABILITY_VALUES[number];

export type TourismInterest = typeof TOURISM_INTEREST_VALUES[number];

export type SponsorType = typeof PLAN_TYPE_VALUES[number];

export type ShopProductStatus = typeof SHOP_PRODUCT_STATUS_VALUES[number];

export type SuggestionType = typeof SUGGESTION_TYPE_VALUES[number];

// --- NARRATIVE COMPASS PHASES ---

export type JourneyPhase = typeof JOURNEY_PHASE_VALUES[number];

export type OpeningHours = {
    days: string[];
    morning: string | null;
    afternoon: string | null;
    evening?: string | null;
    isEstimated: boolean | null;
};

export const EMPTY_OPENING_HOURS: OpeningHours = {
    days: [],
    morning: null,
    afternoon: null,
    evening: null,
    isEstimated: false
};

export interface Review {
    id: string;
    author: string;
    authorId?: string;
    rating: number;
    date: string;
    approvedAt?: string; // Data di approvazione admin
    text: string;
    criteria?: Record<string, number>;
    itineraryId?: string;
    poiName?: string;
    poiId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    cityId?: string;
    cityName?: string;
}

export type ContactInfo = {
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    website?: string | null;
};

export type AffiliateLinks = {
    booking: string | null;
    tripadvisor: string | null;
    getyourguide: string | null;
    thefork: string | null;
    michelin: string | null;
    airbnb: string | null;
    skyscanner: string | null;
    ferryscanner: string | null;
};

export const EMPTY_AFFILIATE_LINKS: AffiliateLinks = {
    booking: null,
    tripadvisor: null,
    getyourguide: null,
    thefork: null,
    michelin: null,
    airbnb: null,
    skyscanner: null,
    ferryscanner: null
};

export type LinkMetadata = {
    verified: boolean;
    excluded: string[];
};

// --- GAMIFICATION TYPES ---

export interface LevelInfo {
    level: number;
    name: string;
    minXp: number;
    icon: string;
    color: string;
    description: string;
}

export type RewardCategory = 'food' | 'culture' | 'shopping' | 'general' | 'tech' | 'business';

export interface Reward {
    id: string;
    title: string;
    description: string;
    requiredLevel: number;
    icon: string;
    type: 'internal' | 'partner';
    category: RewardCategory;
    active?: boolean;
}

export interface XpRule {
    key: string;
    label: string;
    xp: number;
    icon?: string;
    description?: string;
}

export interface UserReward {
    instanceId: string;
    rewardId: string;
    userId: string;
    code: string;
    title: string;
    dateClaimed: string;
    status: 'active' | 'used';
    category: RewardCategory;
}
