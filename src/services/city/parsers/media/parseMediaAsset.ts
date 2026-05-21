
import { MediaAsset } from '../../../../types';
import { sanitizeMediaStatus } from '../../../../utils/media';
import { ensureString } from '../shared/ensureString';

/**
 * PARSER: MediaAsset
 * Trasforma URL e Status grezzi in un oggetto MediaAsset normalizzato.
 * Segue il principio di trasparenza: se l'URL manca, lo stato riflette la realtà.
 */
export const parseMediaAsset = (
    url: string | null | undefined,
    status: string | null | undefined,
    credit?: string | null | undefined,
    license?: 'own' | 'cc' | 'public' | 'copyright' | string | null | undefined
): MediaAsset => {
    const safeUrl = ensureString(url);
    const sanitizedStatus = sanitizeMediaStatus(status);

    const normalizedLicense =
        license === 'own' ||
        license === 'cc' ||
        license === 'public' ||
        license === 'copyright'
            ? license
            : undefined;

    return {
        url: safeUrl,
        mediaStatus: sanitizedStatus,
        credit: credit ? String(credit) : undefined,
        license: normalizedLicense
    };
};
