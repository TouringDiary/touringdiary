import { SponsorRequest } from '../types/models/Sponsor';
import { PLAN_TYPES } from '../constants/planTypes';

/**
 * Soglia sotto la quale uno sponsor è considerato "partner critico" (es. basso rating).
 */
export const CRITICAL_RATING_THRESHOLD = 3.0;

/**
 * Determina se il record corrente appartiene alla categoria "shop" (Bottega).
 * Gestisce safely null e undefined.
 */
export const isShopCategory = (request: SponsorRequest | null | undefined): boolean => {
    if (!request) return false;
    return request.type === PLAN_TYPES.DIGITAL_SHOWCASE || request.poiCategory === 'shop';
};

/**
 * Valida i dati di attivazione per garantire la presenza di amount e invoiceNumber corretti.
 * Gestisce safely valori non definiti o nulli.
 */
export const validateActivationData = (
    amount: number | null | undefined, 
    invoiceNumber: string | null | undefined
): { isValid: boolean; error: string | null } => {
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
        return { isValid: false, error: "L'importo deve essere maggiore di zero." };
    }
    
    if (!invoiceNumber || invoiceNumber.trim().length < 2) {
        return { isValid: false, error: "Il numero fattura è obbligatorio (min 2 caratteri)." };
    }

    return { isValid: true, error: null };
};

/**
 * Calcola il numero di partner critici all'interno di una lista.
 * I partner critici sono quelli con status 'approved' e rating inferiore alla soglia.
 * Gestisce array vuoti, null e dati malformati.
 */
export const getCriticalPartnersCount = (
    sponsorsList: SponsorRequest[] | null | undefined, 
    threshold: number = CRITICAL_RATING_THRESHOLD
): number => {
    if (!sponsorsList || !Array.isArray(sponsorsList) || sponsorsList.length === 0) {
        return 0;
    }

    return sponsorsList.filter(s => {
        const isApproved = s.status === 'approved';
        if (!isApproved) return false;

        // Type guard per accedere al rating in modo sicuro
        const hasRating = (obj: unknown): obj is { rating: number } => 
            typeof obj === 'object' && obj !== null && 'rating' in obj && typeof (obj as any).rating === 'number';
        
        const rating = hasRating(s) ? s.rating : null;

        return rating !== null && rating < threshold;
    }).length;
};
