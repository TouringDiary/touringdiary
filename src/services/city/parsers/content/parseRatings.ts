
/**
 * PARSER: Ratings
 * Stabilizza l'oggetto dei rating (Record<string, number>).
 * Segue il principio di trasparenza: NON inietta default semantici.
 */
export const parseRatings = (raw: any): Record<string, number> => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Ratings] Invalid ratings object:`, raw);
        }
        return {};
    }

    return raw as Record<string, number>;
};
