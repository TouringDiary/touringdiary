import { MediaAsset, MediaStatus } from '../types/index';
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

/** URL display per componenti che consumano solo stringhe (img src, inspector). */
export const mediaAssetUrl = (asset: MediaAsset): string => asset.url;

/** Galleria POI/città → URL per slider/lightbox. */
export const galleryDisplayUrls = (gallery: MediaAsset[] | undefined | null): string[] =>
    (gallery ?? []).map(mediaAssetUrl).filter((url) => url.length > 0);

/** Creazione asset in editor/upload (hero/card restano string nel modello). */
export const createMediaAssetFromUrl = (
    url: string,
    mediaStatus: MediaStatus = 'real'
): MediaAsset => ({
    url,
    mediaStatus: url ? mediaStatus : 'missing',
});

/** Dedup galleria per URL normalizzato (senza query string). */
export const dedupeGalleryAssets = (assets: MediaAsset[]): MediaAsset[] => {
    const seen = new Set<string>();
    return assets.filter((asset) => {
        if (!asset.url) return false;
        const cleanUrl = asset.url.split('?')[0].trim();
        if (seen.has(cleanUrl)) return false;
        seen.add(cleanUrl);
        return true;
    });
};
