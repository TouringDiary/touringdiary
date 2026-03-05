
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

// Getter dinamici che leggono dalla cache sincronizzata col DB

export const getEventCanonicalList = () => {
    return getCachedSetting<any[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST) || [];
};

export const getEventTaxonomyMap = () => {
    return getCachedSetting<Record<string, string>>(SETTINGS_KEYS.EVENT_TAXONOMY_MAP) || {};
};

// Fallback per compatibilità immediata (sarà vuoto finché cache non carica, ma UI gestisce)
export const EVENT_CANONICAL_LIST = []; 
export const EVENT_TAXONOMY_MAP = {};
export const ALLOWED_EVENT_CATEGORIES_STRING = "";
