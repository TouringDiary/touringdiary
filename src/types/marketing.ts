/**
 * src/types/marketing.ts
 * 
 * Definizioni centralizzate per le configurazioni di marketing e pricing.
 * Questi tipi riflettono la struttura dei dati in `global_settings` 
 * per le chiavi `marketing_prices_v2` e `marketing_promo_types`.
 */

/**
 * Definisce le feature specifiche e tipizzate associate a un livello di marketing.
 * @example { "speed": 8, "photos": 10 }
 * @example { "products": 20 }
 */
export interface MarketingTierFeatures {
    speed?: number;
    photos?: number;
    products?: number;
}

/**
 * Configurazione per un singolo livello di marketing (es. 'gold', 'premiumUser').
 * I campi opzionali garantiscono la compatibilità con diverse configurazioni di tier.
 */
export interface MarketingTierConfig {
    basePrice: number;
    promoPrice?: number | null;
    promoLabel?: string | null;
    promoActive: boolean;
    features?: MarketingTierFeatures;
    customFeatureLabels?: string[];
}

/**
 * Configurazione per i limiti di utilizzo dell'AI in base al ruolo utente.
 * Il campo `premium_plus` è opzionale per retrocompatibilità con configurazioni DB più vecchie.
 */
export interface AiLimitsConfig {
    guest: number;
    registered: number;
    premium: number;
    premium_plus?: number;
    sponsor: number;
    pro: number;
    shop: number;
}

/**
 * Rappresenta l'oggetto di configurazione completo per il marketing (chiave: marketing_prices_v2).
 */
export interface MarketingConfig {
    // Livelli Business
    silver: MarketingTierConfig;
    gold: MarketingTierConfig;
    guide: MarketingTierConfig;
    shop: MarketingTierConfig;
    tourOperator: MarketingTierConfig;
    
    // Abbonamenti Utente
    premiumUser: MarketingTierConfig;
    premiumUserPlus: MarketingTierConfig;
    
    // Impostazioni Globali
    novitaDuration: number; 
    aiLimits: AiLimitsConfig; 
}

/**
 * Rappresenta il tipo per una promozione di marketing (chiave: marketing_promo_types).
 */
export interface MarketingPromoType {
    id: string;
    label: string;
}
