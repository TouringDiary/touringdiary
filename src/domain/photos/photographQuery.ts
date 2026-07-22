import { isPhotograph, PHOTOGRAPH_MEDIA_STATUS } from './photograph';
import type { PhotographMediaFields } from './photograph';

/**
 * Single Source of Truth for photograph gallery reads.
 *
 * Galleries ask for Photographs only. They do not know Placeholders.
 * Query builders must constrain `media_status` to this value (positive filter).
 */
export const PHOTOGRAPH_READ_MEDIA_STATUS = PHOTOGRAPH_MEDIA_STATUS;

/**
 * Defense-in-depth after mapping DB rows: keep only Photographs.
 * Call sites that already applied PHOTOGRAPH_READ_MEDIA_STATUS still benefit
 * if legacy/odd rows slip through the query layer.
 */
export function filterPhotographs<T extends PhotographMediaFields>(items: T[]): T[] {
    return items.filter((item) => isPhotograph(item));
}
