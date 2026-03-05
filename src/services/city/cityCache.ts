
// --- CACHING LAYER ---
// Gestisce la persistenza in RAM per evitare chiamate ripetute al DB

const CACHE_TTL = 5 * 60 * 1000; // 5 Minuti standard
const LONG_CACHE_TTL = 10 * 60 * 1000; // 10 Minuti per il manifesto

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const memoryCache: Record<string, CacheEntry<any>> = {};

export const getFromCache = <T>(key: string): T | null => {
    const entry = memoryCache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        delete memoryCache[key]; 
        return null;
    }
    return entry.data;
};

export const setInCache = <T>(key: string, data: T, ttl: number = CACHE_TTL) => {
    memoryCache[key] = { data, timestamp: Date.now() + ttl }; 
};

export const invalidateCityCache = (cityId: string) => {
    delete memoryCache[`city_details_${cityId}`];
    delete memoryCache['manifest_full']; // Forza ricaricamento lista
};

export const clearCacheKey = (pattern: string) => {
    Object.keys(memoryCache).forEach(key => {
        if (key.includes(pattern)) delete memoryCache[key];
    });
};

export { CACHE_TTL, LONG_CACHE_TTL };
