export interface LoadingTip {
    id: string;
    text: string;
    imageUrl?: string; 
    active: boolean;
    order?: number;
    type?: 'tip' | 'status'; 
}

export interface TouristZone {
    id: string;
    name: string;
    adminRegion: string;
    description?: string;
    aiSuggestions?: AiCitySuggestion[]; 
}

// Estensione per le classifiche
export interface RankedItemMixin {
    hierarchy?: string; 
    originalRank?: number; 
}

// --- AI REGIONAL ANALYSIS TYPES ---
export interface AiCitySuggestion {
    name: string;
    reason: string; 
    visitors: number; 
}

export interface AiZoneSuggestion {
    name: string; 
    description: string;
    mainCities: AiCitySuggestion[];
}

export interface RegionalAnalysisResult {
    region: string;
    zones: AiZoneSuggestion[];
}

// --- PHASE 3: AUDIT TYPES ---
export interface AuditPoiResult {
    name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    reason: string; 
    
    // Status calcolato
    matchStatus: 'missing' | 'exact_match' | 'geo_match' | 'name_match';
    matchedDbId?: string; 
    matchedDistance?: number; 
}

// --- OBSERVATORY TYPES ---
export interface ObservatoryStats {
    total_pois: number;
    total_cities: number;
    anomalies_total: number; // Added
    missing_gps: number;
    missing_images: number;
    draft_pois: number;
    scan_time: string; // Renamed from timestamp
}

export interface AnomalyRecord {
    id: string;
    name: string;
    category: string;
    city_id: string;
    city_name: string;
    anomaly_type: 'no_gps' | 'missing_image' | 'short_desc' | 'low_reliability' | 'unknown';
    updated_at: string;
}

export interface CityQualityStats {
    city_id: string;
    // Geo
    continent: string;
    nation: string;
    admin_region: string;
    zone_name: string;
    city_name: string;
    // Metrics
    city_status: string; 
    visitors: number;
    quality_score: number;
    total_pois: number; 
    photo_coverage: number; 
    text_coverage: number; 
    avg_rating: number; 
    // POI Levels
    poi_top: number;
    poi_medium: number;
    poi_low: number;
    // Entities
    guides_count: number;
    tour_ops_count: number; 
    // Services
    svc_airport: number;
    svc_train: number;
    svc_bus: number;
    svc_taxi: number;
    svc_maritime: number;
    svc_other: number;
    svc_emergency: number;
    svc_pharmacy: number;
    // Content
    events_count: number;
    people_count: number;
    // Sponsor
    sponsor_silver: number;
    sponsor_gold: number;
    // Shop
    shop_gusto: number;
    shop_cantina: number;
    shop_artigianato: number;
    shop_moda: number;
}

// --- IMPORT & STAGING TYPES (NEW) ---
export interface StagingPoi {
    id: string;
    cityId: string;
    osmId: string;
    name: string;
    rawCategory: string | null;
    coords: { lat: number; lng: number };
    address?: string;
    aiRating?: 'low' | 'medium' | 'high';
    processingStatus: 'new' | 'ready' | 'imported' | 'discarded';
    createdAt: string;
    updatedAt: string;
}

// --- CITY DELETION OPTIONS ---
export interface CityDeleteOptions {
    keepUserPhotos: boolean;    // Mantieni foto caricate dagli utenti
    keepShops: boolean;         // Mantieni negozi/partner
    keepPeople: boolean;        // Mantieni personaggi famosi
    keepPOIs: boolean;          // Mantieni i Punti di Interesse (Sconsigliato ma possibile)
}
