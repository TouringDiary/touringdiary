
// Shared Primitives & Enums
// Questi tipi sono usati trasversalmente da più modelli (City, Itinerary, Sponsor)

export type PoiCategory = 'monument' | 'food' | 'hotel' | 'nature' | 'discovery' | 'leisure' | 'shop' | 'all';

export type PoiSubCategory = 
    | 'restaurant' | 'pizzeria' | 'bar' | 'pastry' | 'street_food' | 'gelato' | 'winery' | 'bakery' | 'dairy' | 'gastronomy' | 'trattoria' | 'braceria' | 'fast_food'
    | 'disco' | 'pub' | 'cinema' | 'theater' | 'stadium' | 'zoo' | 'beach_club' | 'spa' | 'mall' | 'water_park' | 'wine_bar' | 'cocktail_bar' | 'playground'
    | 'fashion' | 'crafts' | 'souvenir' | 'market' | 'tech' | 'food_shop' | 'jewelry'
    | 'church' | 'castle' | 'museum' | 'square' | 'palace' | 'archaeology' | 'monument' | 'library'
    | 'park' | 'beach' | 'hiking' | 'viewpoint' | 'mountain' | 'lake' | 'river' | 'village' | 'garden' | 'beach_free' | 'reserve'
    | 'hotel' | 'bnb' | 'resort' | 'hostel' | 'guest_house' | 'casa_per_ferie' | 'holiday_home' | 'apartment'
    | 'agency' | 'tour_operator';

export type SuggestionType = 'new_place' | 'edit_info' | 'history_culture';

// --- NARRATIVE COMPASS PHASES ---
// UPDATED: 'VIVI' -> 'LIVE'
export type JourneyPhase = 'SCOPERTA' | 'SELEZIONE' | 'PIANIFICA' | 'LIVE' | 'RICORDA';

export interface OpeningHours {
    days: string[];
    morning?: string;
    afternoon?: string;
    evening?: string;
    isEstimated?: boolean; // NEW: Indica se gli orari sono dedotti/stimati
}

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

export interface AffiliateLinks {
    booking?: string;
    tripadvisor?: string;
    getyourguide?: string;
    thefork?: string;
    michelin?: string;
    website?: string; 
    airbnb?: string;
    skyscanner?: string;
    ferryscanner?: string;
}

export interface LinkMetadata {
    verified: boolean;
    excluded: string[];
}

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
