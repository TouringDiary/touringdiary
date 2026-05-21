import { MediaStatus } from '../types/index';
import { MEDIA_STATUS_VALUES } from '../constants/governance';

/**
 * Media Governance Utilities
 */

/**
 * Verifica se un valore è un MediaStatus valido.
 */
export const isMediaStatus = (val: unknown): val is MediaStatus => {
    return (
        typeof val === 'string' &&
        MEDIA_STATUS_VALUES.includes(val as typeof MEDIA_STATUS_VALUES[number])
    );
};

/**
 * Sanitizza un valore arbitrario restituendo un MediaStatus valido.
 * Fallback deterministico su 'missing' se il valore non è riconosciuto.
 */
export const sanitizeMediaStatus = (val: unknown): MediaStatus => {
    if (isMediaStatus(val)) return val;

    return 'missing';
};

/**
 * Determina lo stato iniziale di un asset se non specificato nel DB.
 */
export const deriveMediaStatus = (url: string | null | undefined): MediaStatus => {
    return url ? 'real' : 'missing';
};
