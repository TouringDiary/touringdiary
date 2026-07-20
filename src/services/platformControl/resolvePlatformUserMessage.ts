import { findMessageCatalogByKey } from '@/constants/platformFeatureFlags';
import {
    resolveSystemMessageBody,
    resolveSystemMessageTitle,
} from '@/services/communicationService';

/**
 * Resolve user-facing copy from DB cache (DL-P13).
 * Catalog TS defaults are bootstrap only when cache/DB miss.
 */
export function resolvePlatformUserBody(
    messageKey: string | null | undefined,
    bootstrapFallback: string
): string {
    const catalogBody = findMessageCatalogByKey(messageKey)?.defaultBody?.trim();
    return resolveSystemMessageBody(messageKey, catalogBody || bootstrapFallback);
}

export function resolvePlatformUserTitle(
    messageKey: string | null | undefined,
    bootstrapFallback: string
): string {
    const catalogTitle = findMessageCatalogByKey(messageKey)?.defaultTitle?.trim();
    return resolveSystemMessageTitle(messageKey, catalogTitle || bootstrapFallback);
}
