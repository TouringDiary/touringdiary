
import { supabase } from './supabaseClient';
import type { DatabaseGlobalSetting } from '../types/database';
import type { MarketingConfig } from '../types/models/Sponsor';

// CHIAVI STANDARD DATABASE
export const SETTINGS_KEYS = {
    MARKETING_PRICES: 'marketing_prices_v2', 
    MARKETING_PROMO_TYPES: 'marketing_promo_types',
    PRICE_HISTORY: 'marketing_price_history',
    AFFILIATE_CONFIG: 'affiliate_config',
    SITE_DESIGN: 'site_design',
    CATEGORY_PLACEHOLDERS: 'category_placeholders',
    POI_STRUCTURE: 'poi_structure',
    SERVICES_CONFIG: 'services_config',
    EVENT_CANONICAL_LIST: 'event_canonical_list',
    TAXONOMY_MAP: 'taxonomy_map', 
    EVENT_TAXONOMY_MAP: 'event_taxonomy_map',
    TAXONOMY_NORMALIZATION: 'taxonomy_normalization',
    AI_TYPING_SUGGESTIONS: 'ai_typing_suggestions',
    
    // NEW: Dynamic UI Configuration Keys
    GEO_OPTIONS: 'geo_options',
    POI_CATEGORIES_CONFIG: 'poi_categories_config',
    POI_ADVANCED_STRUCTURE: 'poi_advanced_structure',
    TRAVEL_STYLES_CONFIG: 'travel_styles_config',
    SERVICES_TYPE_MAPPING: 'services_type_mapping',
    
    // PROMPTS AI
    PROMPT_CITY_AUDIT: 'prompt_city_audit',
    PROMPT_PEOPLE_SUGGEST: 'prompt_people_suggest',
    PROMPT_CITY_GENERAL: 'prompt_city_general',
    PROMPT_CITY_STATS: 'prompt_city_stats',
    PROMPT_CITY_HISTORY: 'prompt_city_history',
    PROMPT_CITY_RATINGS: 'prompt_city_ratings',
    PROMPT_CITY_PATRON: 'prompt_city_patron',
    PROMPT_PLANNER_ITINERARY: 'prompt_planner_itinerary',
    PROMPT_PLANNER_ROADBOOK: 'prompt_planner_roadbook',
    PROMPT_VISION_CAPTION: 'prompt_vision_caption'
};

// --- ASSET GLOBAL DEFAULTS ---
export const GLOBAL_ASSET_DEFAULTS = {
    hero: 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200', // Default Napoli/Costiera
    patron: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg', // Icona generica
    auth_bg: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200', // Cinque Terre style (generico Italia)
    social_bg: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600', // Roma style (generico Italia verticale)
    ai_box: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800' // Ravello style
};

export type GlobalAssetKey = keyof typeof GLOBAL_ASSET_DEFAULTS;

// CACHE LOCALE (Runtime Only - Si riempie dopo il primo fetch)
export const memoryCache: Record<string, any> = {};

// Caricamento Massivo all'avvio (Bootstrapping)
export const loadGlobalCache = async () => {
    try {
        // Scarica tutti i settings in una volta sola
        const { data: settingsData } = await supabase.from('global_settings').select('key, value');
        if (settingsData) {
            settingsData.forEach(row => {
                memoryCache[row.key] = row.value;
            });
        }
        
        // Scarica tassonomie
        const { data: taxData } = await supabase.from('taxonomy_mappings').select('*');
        if (taxData) {
            const poiMap: Record<string, string> = {};
            const eventMap: Record<string, string> = {};
            taxData.forEach(row => {
                if (row.context === 'event') eventMap[row.input_term] = row.target_category;
                else poiMap[row.input_term] = row.target_category;
            });
            memoryCache[SETTINGS_KEYS.TAXONOMY_MAP] = poiMap;
            memoryCache[SETTINGS_KEYS.EVENT_TAXONOMY_MAP] = eventMap;
        }
    } catch (e) {
        if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
            console.warn("[Settings] Database offline. Uso impostazioni di default.");
        } else {
            console.error("[Settings] Critical Cache load failed.", e);
        }
    }
};

/**
 * Recupera un setting dalla cache sincrona.
 * Se non esiste, ritorna null (o un valore vuoto sicuro tipizzato).
 */
export const getCachedSetting = <T>(key: string): T | null => {
    return (memoryCache[key] as T) || null;
};

export const getCachedPlaceholder = (category: string): string => {
    const placeholders = getCachedSetting<Record<string, string>>(SETTINGS_KEYS.CATEGORY_PLACEHOLDERS);
    return placeholders ? (placeholders[category] || '') : '';
};

/**
 * Restituisce l'URL dell'immagine globale richiesta.
 * Priorità: 1. DB (se settato, anche stringa vuota) -> 2. Default Hardcoded
 */
export const getGlobalImage = (key: GlobalAssetKey): string => {
    const settings = getCachedSetting<any>(SETTINGS_KEYS.SITE_DESIGN);
    
    let dbValue = null;
    switch(key) {
        case 'hero': dbValue = settings?.heroImage; break;
        case 'patron': dbValue = settings?.defaultPatronImage; break;
        case 'auth_bg': dbValue = settings?.auth_background_image; break;
        case 'social_bg': dbValue = settings?.social_canvas_bg; break;
        case 'ai_box': dbValue = settings?.ai_consultant_bg; break;
    }
    
    // Se il valore esiste nel DB (anche stringa vuota per "nessuna immagine"), usalo.
    if (dbValue !== null && dbValue !== undefined) {
        return dbValue;
    }
    
    return GLOBAL_ASSET_DEFAULTS[key];
};

// --- ASYNC GETTERS (Direct DB Access) ---

export const getSetting = async <T>(key: string): Promise<T | null> => {
    // 1. Prova cache
    if (memoryCache[key]) return memoryCache[key] as T;

    // 2. Fetch DB
    try {
        const { data, error } = await supabase.from('global_settings').select('value').eq('key', key).maybeSingle();
        if (error || !data) return null;
        
        // 3. Aggiorna cache
        memoryCache[key] = data.value;
        return data.value as T;
    } catch (e) {
        return null;
    }
};

export const saveSetting = async <T>(key: string, value: T): Promise<boolean> => {
    try {
        const { error } = await supabase.from('global_settings').upsert({ 
            key, 
            value: value as any, 
            updated_at: new Date().toISOString() 
        });
        
        if (error) throw error;
        
        // Aggiorna cache locale immediatamente
        memoryCache[key] = value;
        return true;
    } catch (e) {
        console.error(`[Settings] Failed to save ${key}`, e);
        return false;
    }
};

export const getGlobalSettings = async () => getSetting<any>(SETTINGS_KEYS.SITE_DESIGN);

export const saveGlobalSettings = async (value: any) => {
    const current = await getGlobalSettings() || {};
    return saveSetting(SETTINGS_KEYS.SITE_DESIGN, { ...current, ...value });
};

// Helper per ottenere defaults di sistema
export const getSystemDefault = <T>(key: string): T | null => {
    return null; 
};
