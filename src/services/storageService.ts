
// Memoria volatile di fallback (RAM)
const memoryStore: Record<string, string> = {};
const sessionMemoryStore: Record<string, string> = {};

// Durata della cache in millisecondi (12 ore)
const CACHE_TTL = 12 * 60 * 60 * 1000; 

export const DB_KEYS = {
    MANIFEST: 'touring_data_manifest',
    CITIES: 'touring_data_cities',
    SPONSORS: 'touring_data_sponsors',
    SHOPS: 'touring_data_shops',
    PHOTOS: 'touring_data_photos',
    TICKER: 'touring_data_ticker',
    DISMISSED_ALERTS: 'touring_data_dismissed_alerts', // Questa chiave non scade
    AI_PROMPTS: 'touring_data_ai_prompts',
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// --- LOCAL STORAGE HELPERS (Persistent) ---

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
    const readFromStorage = (storage: Storage | Record<string, string>, storageKey: string): string | null => {
        if (storage instanceof Storage) {
            return storage.getItem(storageKey);
        }
        return storage[storageKey] || null;
    };

    const parseAndValidate = (itemStr: string | null): T => {
        if (!itemStr) return defaultValue;

        try {
            const item: CacheItem<T> | T = JSON.parse(itemStr);

            // Retrocompatibilità: se non è un oggetto con `data` e `timestamp` o è una chiave da ignorare,
            // lo gestiamo in modo diverso.
            if (typeof item !== 'object' || item === null || !('timestamp' in item) || !('data' in item)) {
                if (key === DB_KEYS.DISMISSED_ALERTS) {
                    return item as T; // Restituisci il dato vecchio, non scade
                }
                // Invalida la vecchia struttura della cache eliminandola
                removeStorageItem(key);
                return defaultValue;
            }

            // La chiave `DISMISSED_ALERTS` non deve scadere
            if (key === DB_KEYS.DISMISSED_ALERTS) {
                return item.data;
            }
            
            const now = Date.now();
            if (now - item.timestamp > CACHE_TTL) {
                // Cache scaduta
                removeStorageItem(key);
                return defaultValue;
            }
            
            return item.data;

        } catch (e) {
            // Errore di parsing, il dato non è JSON valido, trattalo come scaduto
            removeStorageItem(key);
            return defaultValue;
        }
    };

    // 1. Prova RAM (Priorità)
    if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
        return parseAndValidate(memoryStore[key]);
    }

    // 2. Prova Local Storage Reale
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const itemStr = window.localStorage.getItem(key);
            return parseAndValidate(itemStr);
        }
    } catch (e) {
        // Accesso negato, fallback alla memoria volatile
    }

    return defaultValue;
};

export const setStorageItem = <T>(key: string, value: T): boolean => {
    let itemToStore;
    
    // La chiave `DISMISSED_ALERTS` viene salvata senza TTL
    if (key === DB_KEYS.DISMISSED_ALERTS) {
        itemToStore = value;
    } else {
        const cacheEntry: CacheItem<T> = {
            data: value,
            timestamp: Date.now()
        };
        itemToStore = cacheEntry;
    }

    const stringValue = JSON.stringify(itemToStore);
    
    memoryStore[key] = stringValue; // Scrivi sempre in RAM per coerenza

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, stringValue);
            return true;
        }
    } catch (e) {
        return false;
    }
    return true;
};


export const removeStorageItem = (key: string): void => {
    delete memoryStore[key];
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
        }
    } catch (e) { /* Ignore */ }
};

// --- SESSION STORAGE HELPERS (Tab Session) ---

export const getSessionItem = (key: string): string | null => {
    if (Object.prototype.hasOwnProperty.call(sessionMemoryStore, key)) {
        return sessionMemoryStore[key];
    }
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            return window.sessionStorage.getItem(key);
        }
    } catch (e) { /* Ignore */ }
    return null;
};

export const setSessionItem = (key: string, value: string): void => {
    sessionMemoryStore[key] = value;
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(key, value);
        }
    } catch (e) { /* Ignore */ }
};

export const removeSessionItem = (key: string): void => {
    delete sessionMemoryStore[key];
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem(key);
        }
    } catch (e) { /* Ignore */ }
};

export const clearStorage = (key?: string) => {
    try {
        if (key) {
            removeStorageItem(key);
        } else {
            for (const k in memoryStore) delete memoryStore[k];
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
            }
        }
    } catch (e) { /* Ignore */ }
};
