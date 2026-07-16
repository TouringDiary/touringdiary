
import { PatronDetails } from '../../../../types';
import { ensureString } from '../shared/ensureString';
import { parseMediaAsset } from '../media/parseMediaAsset';

/**
 * PARSER: PatronDetails
 * Normalizza l'oggetto Patron gestendo la compatibilità legacy (snake/camel case).
 * Trasparenza: NON inietta 'N/A' né altri fallback UI.
 */
export const parsePatron = (raw: unknown): PatronDetails | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Patron] Invalid patron object:`, raw);
        }
        return null;
    }

    const record = raw as Record<string, unknown>;

    // Normalizzazione URL e Status (Legacy Compat + Media Governance)
    const url = ensureString(record.image_url || record.imageUrl);
    const status = record.image_status || record.image_status_legacy;
    const mediaAsset = parseMediaAsset(url, status as string | null | undefined);

    return {
        name: ensureString(record.name),
        date: ensureString(record.date),
        history: ensureString(record.history),
        imageUrl: mediaAsset.url,
        image_status: mediaAsset.mediaStatus,
        imageAsset: mediaAsset
    };
};
