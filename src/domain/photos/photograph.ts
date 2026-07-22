import type { MediaStatus } from '@/types/models/Media';

/**
 * Photograph domain contract.
 *
 * Business rule:
 * - Photographs = content uploaded as photographs only:
 *   City Photographic Gallery, Community uploads, Admin photo moderation.
 * - Presentation Media (Hero, Card, POI/Shop/Guide/… covers, banners, thumbnails)
 *   never belong to this domain and must not enter `photo_submissions`.
 * - Placeholders = platform graphic assets from Admin → Asset Globali.
 *
 * `is_official` is an editorial partition inside Photographs only.
 */

/** Only `real` media may exist as a Photograph in `photo_submissions`. */
export const PHOTOGRAPH_MEDIA_STATUS: MediaStatus = 'real';

export type PhotographMediaFields = {
    mediaStatus?: MediaStatus | null;
    url?: string | null;
};

/**
 * Domain predicate: is this asset a Photograph?
 * Status-driven (not URL heuristics). Empty URL is not a Photograph.
 */
export function isPhotograph(
    fields: PhotographMediaFields | MediaStatus | null | undefined,
): boolean {
    if (fields == null) return false;

    if (typeof fields === 'string') {
        return fields === PHOTOGRAPH_MEDIA_STATUS;
    }

    if (!fields.url?.trim()) return false;
    return fields.mediaStatus === PHOTOGRAPH_MEDIA_STATUS;
}

/**
 * Eligible Official city media for registration into the Photo domain:
 * assets from the City Photographic Gallery only (not Presentation Media).
 */
export function isPhotographMediaAsset(fields: PhotographMediaFields): boolean {
    return isPhotograph(fields);
}
