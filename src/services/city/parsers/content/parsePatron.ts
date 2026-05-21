
import { PatronDetails } from '../../../../types';
import { ensureString } from '../shared/ensureString';
import { parseMediaAsset } from '../media/parseMediaAsset';

/**
 * PARSER: PatronDetails
 * Normalizza l'oggetto Patron gestendo la compatibilità legacy (snake/camel case).
 * Trasparenza: NON inietta 'N/A' né altri fallback UI.
 */
export const parsePatron = (raw: any): PatronDetails | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Patron] Invalid patron object:`, raw);
        }
        return null;
    }

    // Normalizzazione URL e Status (Legacy Compat + Media Governance)
    const url = ensureString(raw.image_url || raw.imageUrl);
    const status = raw.image_status || raw.image_status_legacy;
    const mediaAsset = parseMediaAsset(url, status);

    return {
        name: ensureString(raw.name),
        date: ensureString(raw.date),
        history: ensureString(raw.history),
        imageUrl: mediaAsset.url,
        image_status: mediaAsset.mediaStatus,
        imageAsset: mediaAsset
    };
};
