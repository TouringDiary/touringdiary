
// src/utils/marketingTierUtils.ts

/**
 * Definisce i tipi per le chiavi dei tier e delle categorie per avere type-safety.
 * Questo assicura che solo le chiavi valide possano essere usate.
 */
export type MarketingTierKey = 
  | 'silver' 
  | 'gold' 
  | 'shop' 
  | 'guide' 
  | 'tourOperator' 
  | 'premiumUser' 
  | 'premiumUserPlus';

export type PartnerCategoryKey = 'local_business' | 'shop' | 'tour_operator' | 'guide';
export type AdminCategoryKey = 'BUSINESS' | 'VIAGGIATORI';

// --- FONTE DI VERITÀ PER LA CATEGORIZZAZIONE DEI PIANI MARKETING ---

/**
 * Mappatura per il Modale "Diventa Partner".
 * Associa una categoria logica (es. 'local_business') a un'etichetta UI 
 * e a una lista di chiavi di tier corrispondenti.
 */
export const PARTNER_CATEGORIES: Record<PartnerCategoryKey, { label: string; tiers: MarketingTierKey[] }> = {
    local_business: { label: 'Attività Commerciale', tiers: ['silver', 'gold'] },
    shop: { label: 'Bottega & Shop', tiers: ['shop'] },
    tour_operator: { label: 'Tour Operator', tiers: ['tourOperator'] },
    guide: { label: 'Guida Turistica', tiers: ['guide'] },
};

/**
 * Mappatura per i Tab del Pannello Admin.
 * Raggruppa i tier in categorie di alto livello per la gestione amministrativa.
 * Riutilizza le definizioni di PARTNER_CATEGORIES per coerenza.
 */
export const ADMIN_CATEGORIES: Record<AdminCategoryKey, MarketingTierKey[]> = {
    BUSINESS: [
        ...PARTNER_CATEGORIES.local_business.tiers,
        ...PARTNER_CATEGORIES.shop.tiers,
        ...PARTNER_CATEGORIES.tour_operator.tiers,
        ...PARTNER_CATEGORIES.guide.tiers,
    ],
    VIAGGIATORI: ['premiumUser', 'premiumUserPlus'],
};

/**
 * Funzione helper per ottenere tutte le chiavi dei tier validi da un oggetto di configurazione.
 * Questo permette di filtrare via le chiavi che non sono piani veri e propri (es. 'aiLimits').
 * @param allConfigKeys Un array di chiavi dall'oggetto marketing_prices_v2
 * @returns Un array di chiavi che corrispondono a tier di marketing validi.
 */
export function getValidTierKeys(allConfigKeys: string[]): MarketingTierKey[] {
    const allTiers: MarketingTierKey[] = [...ADMIN_CATEGORIES.BUSINESS, ...ADMIN_CATEGORIES.VIAGGIATORI];
    return allConfigKeys.filter(key => allTiers.includes(key as MarketingTierKey)) as MarketingTierKey[];
}
