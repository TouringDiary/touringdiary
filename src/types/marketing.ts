/**
 * src/types/marketing.ts
 * 
 * Definizioni centralizzate per le configurazioni di marketing e pricing.
 * Questi tipi riflettono la struttura dei dati utilizzata per la gestione delle campagne.
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
 * Rappresenta il tipo per una promozione di marketing (chiave: marketing_promo_types).
 */
export interface MarketingPromoType {
    id: string;
    label: string;
}

/**
 * Configurazione per il rendering di un piano di marketing nella UI.
 */
export interface MarketingTierConfig {
    basePrice: number;
    promoPrice?: number;
    promoActive?: boolean;
    customFeatureLabels?: string[];
}
