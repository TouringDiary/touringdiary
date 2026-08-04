import type { MediaStatus } from '@/types/models/Media';
import {
    isPlatformPlaceholderUrl,
    type PlatformPlaceholderRegistry,
} from '@/domain/placeholders/platformPlaceholderRegistry';
import { isPhotograph, PHOTOGRAPH_MEDIA_STATUS } from './photograph';

export type PhotographWriteCandidate = {
    url: string | null | undefined;
    mediaStatus?: MediaStatus | null;
};

export type PhotographWriteDenialReason =
    | 'empty_url'
    | 'not_photograph_status'
    | 'platform_placeholder_origin';

export type PhotographWriteDecision =
    | { allowed: true }
    | { allowed: false; reason: PhotographWriteDenialReason };

/**
 * Write-boundary guard for `photo_submissions`.
 *
 * A row may be created/updated as Photograph only when:
 * 1. URL is present
 * 2. mediaStatus is Photograph (`real`)
 * 3. URL is not Placeholder-by-origin (Asset Globali registry:
 *    current settings URLs **and** retired tombstones)
 *
 * Orphan / replaced Asset Globali URLs remain Placeholder origin via the
 * retired list — denial does not depend on storage path or filename.
 *
 * SoT della decisione: questa funzione. `assertPhotographWrite` solo la materializza in Error.
 */
export function evaluatePhotographWrite(
    candidate: PhotographWriteCandidate,
    placeholderRegistry: PlatformPlaceholderRegistry,
): PhotographWriteDecision {
    const url = candidate.url?.trim() ?? '';
    if (!url) {
        return { allowed: false, reason: 'empty_url' };
    }

    // Omission = `real`: same default as photoService upload/getOrCreate and createMediaAssetFromUrl.
    // A write into photo_submissions without an explicit status is treated as Photograph content.
    const mediaStatus = candidate.mediaStatus ?? PHOTOGRAPH_MEDIA_STATUS;

    if (!isPhotograph({ url, mediaStatus })) {
        return { allowed: false, reason: 'not_photograph_status' };
    }

    if (isPlatformPlaceholderUrl(url, placeholderRegistry)) {
        return { allowed: false, reason: 'platform_placeholder_origin' };
    }

    return { allowed: true };
}

/** Convenience boolean for call sites that only need allow/deny. */
export function canRegisterAsPhotograph(
    candidate: PhotographWriteCandidate,
    placeholderRegistry: PlatformPlaceholderRegistry,
): boolean {
    return evaluatePhotographWrite(candidate, placeholderRegistry).allowed;
}

/**
 * Throws when the candidate must not enter the Photo domain.
 * Does not re-decide: only turns `evaluatePhotographWrite` into an Error.
 */
export function assertPhotographWrite(
    candidate: PhotographWriteCandidate,
    placeholderRegistry: PlatformPlaceholderRegistry,
): void {
    const decision = evaluatePhotographWrite(candidate, placeholderRegistry);
    if (!decision.allowed) {
        throw new Error(
            `[PhotoDomain] Cannot register as Photograph (${decision.reason}).`,
        );
    }
}
