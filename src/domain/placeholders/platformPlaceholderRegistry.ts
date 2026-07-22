import {
    PLATFORM_PLACEHOLDER_SETTING_KEYS,
    type PlatformPlaceholderSettingValue,
    type PlatformPlaceholderSettingsSnapshot,
} from './platformPlaceholderOrigin';

/** Normalize URL for origin-registry membership (no heuristics on path/name). */
export function normalizePlatformAssetUrl(url: string | null | undefined): string {
    if (!url) return '';
    return url.split('?')[0].trim().toLowerCase();
}

function collectUrlsFromValue(
    value: PlatformPlaceholderSettingValue,
    into: Set<string>,
): void {
    if (value == null) return;

    if (typeof value === 'string') {
        const normalized = normalizePlatformAssetUrl(value);
        if (normalized) into.add(normalized);
        return;
    }

    if (Array.isArray(value)) {
        for (const url of value) {
            if (typeof url !== 'string') continue;
            const normalized = normalizePlatformAssetUrl(url);
            if (normalized) into.add(normalized);
        }
        return;
    }

    if (typeof value === 'object') {
        for (const url of Object.values(value)) {
            if (typeof url !== 'string') continue;
            const normalized = normalizePlatformAssetUrl(url);
            if (normalized) into.add(normalized);
        }
    }
}

/**
 * Build the set of Placeholder URLs from an Asset Globali settings snapshot.
 * Origin-based: active SoT keys + retired tombstones (never path heuristics).
 */
export function collectPlatformPlaceholderUrls(
    snapshot: PlatformPlaceholderSettingsSnapshot,
): ReadonlySet<string> {
    const urls = new Set<string>();

    for (const key of PLATFORM_PLACEHOLDER_SETTING_KEYS) {
        collectUrlsFromValue(snapshot[key], urls);
    }

    return urls;
}

export type PlatformPlaceholderRegistry = ReadonlySet<string>;

export function createPlatformPlaceholderRegistry(
    snapshot: PlatformPlaceholderSettingsSnapshot,
): PlatformPlaceholderRegistry {
    return collectPlatformPlaceholderUrls(snapshot);
}

/**
 * True when `url` is registered as a Platform Placeholder by origin
 * (active Asset Globali settings and/or retired tombstones).
 */
export function isPlatformPlaceholderUrl(
    url: string | null | undefined,
    registry: PlatformPlaceholderRegistry,
): boolean {
    const normalized = normalizePlatformAssetUrl(url);
    if (!normalized) return false;
    return registry.has(normalized);
}

/**
 * Merge newly retired Asset Globali URLs into the tombstone list.
 * Dedupes by normalized URL; preserves a stable display form (no query string).
 */
export function mergeRetiredPlatformPlaceholderUrls(
    existing: readonly string[] | null | undefined,
    urlsToRetire: readonly (string | null | undefined)[],
): string[] {
    const byNormalized = new Map<string, string>();

    for (const url of existing ?? []) {
        if (typeof url !== 'string') continue;
        const normalized = normalizePlatformAssetUrl(url);
        if (!normalized) continue;
        byNormalized.set(normalized, url.split('?')[0].trim());
    }

    for (const url of urlsToRetire) {
        if (typeof url !== 'string') continue;
        const normalized = normalizePlatformAssetUrl(url);
        if (!normalized) continue;
        if (!byNormalized.has(normalized)) {
            byNormalized.set(normalized, url.split('?')[0].trim());
        }
    }

    return [...byNormalized.values()];
}
