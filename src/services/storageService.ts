
// Memoria volatile di fallback (RAM)
// Usata quando il browser blocca l'accesso a localStorage/sessionStorage (es. Iframe, Incognito, Tracking Prevention)
const memoryStore: Record<string, string> = {};
const sessionMemoryStore: Record<string, string> = {};

export const DB_KEYS = {
    MANIFEST: 'touring_data_manifest',
    CITIES: 'touring_data_cities',
    SPONSORS: 'touring_data_sponsors',
    SHOPS: 'touring_data_shops',
    PHOTOS: 'touring_data_photos',
    TICKER: 'touring_data_ticker',
    DISMISSED_ALERTS: 'touring_data_dismissed_alerts',
    AI_PROMPTS: 'touring_data_ai_prompts',
    GLOBAL_SETTINGS: 'touring_data_global_settings'
};

export interface GlobalSettings {
    heroImage?: string;
    heroImageCredit?: string;
    defaultPatronImage?: string;
    themeColor?: string;
}

// --- LOCAL STORAGE HELPERS (Persistent) ---

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
    // 1. Prova RAM (Priorità: se abbiamo scritto in RAM per fallback, leggiamo da lì)
    if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
        try {
            return JSON.parse(memoryStore[key]);
        } catch {
            return defaultValue;
        }
    }

    // 2. Prova Local Storage Reale (Protected Access)
    try {
        if (typeof window !== 'undefined') {
            // Accesso protetto alla proprietà (alcuni browser lanciano eccezione solo leggendo .localStorage)
            const storage = window.localStorage;
            if (storage) {
                const item = storage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
        }
    } catch (e) {
        // Accesso negato (Tracking Prevention / Cookie Blocked)
        // Silenzioso fallback
    }
    return defaultValue;
};

export const setStorageItem = <T>(key: string, value: T): boolean => {
    const stringValue = JSON.stringify(value);
    
    // Scrivi sempre in RAM per coerenza nella sessione corrente
    memoryStore[key] = stringValue;

    try {
        if (typeof window !== 'undefined') {
            const storage = window.localStorage;
            if (storage) {
                storage.setItem(key, stringValue);
                return true;
            }
        }
    } catch (e) {
        // Accesso negato: Fallback su RAM (già fatto sopra)
        return false;
    }
    return true;
};

export const removeStorageItem = (key: string): void => {
    delete memoryStore[key];
    try {
        if (typeof window !== 'undefined') {
            const storage = window.localStorage;
            if(storage) storage.removeItem(key);
        }
    } catch (e) {
        // Ignore
    }
};

// --- SESSION STORAGE HELPERS (Tab Session) ---

export const getSessionItem = (key: string): string | null => {
    if (Object.prototype.hasOwnProperty.call(sessionMemoryStore, key)) {
        return sessionMemoryStore[key];
    }
    try {
        if (typeof window !== 'undefined') {
            const storage = window.sessionStorage;
            if(storage) return storage.getItem(key);
        }
    } catch (e) {
        // Ignore
    }
    return null;
};

export const setSessionItem = (key: string, value: string): void => {
    sessionMemoryStore[key] = value;
    try {
        if (typeof window !== 'undefined') {
            const storage = window.sessionStorage;
            if(storage) storage.setItem(key, value);
        }
    } catch (e) {
        // Ignore
    }
};

export const removeSessionItem = (key: string): void => {
    delete sessionMemoryStore[key];
    try {
        if (typeof window !== 'undefined') {
            const storage = window.sessionStorage;
            if(storage) storage.removeItem(key);
        }
    } catch (e) {
        // Ignore
    }
};

export const clearStorage = (key?: string) => {
    try {
        if (key) {
            removeStorageItem(key);
        } else {
            // Clear All
            for (const k in memoryStore) delete memoryStore[k];
            if (typeof window !== 'undefined') {
                const storage = window.localStorage;
                if(storage) storage.clear();
            }
        }
    } catch (e) {
        // Ignore
    }
};

// --- GLOBAL SETTINGS HELPERS ---

export const getGlobalSettings = (): GlobalSettings => {
    return getStorageItem<GlobalSettings>(DB_KEYS.GLOBAL_SETTINGS, {});
};

export const saveGlobalSettings = (settings: GlobalSettings): void => {
    const current = getGlobalSettings();
    setStorageItem(DB_KEYS.GLOBAL_SETTINGS, { ...current, ...settings });
};
