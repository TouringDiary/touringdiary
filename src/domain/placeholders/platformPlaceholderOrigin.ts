/**
 * Platform Placeholder origin — Source of Truth keys.
 *
 * Business rule: any image that originates in Admin → Asset Globali
 * is a Placeholder (platform graphic asset), never a Photograph.
 *
 * These keys map 1:1 to `global_settings` rows managed by AdminHeaderManager
 * (active assets) plus the retired-URL tombstone list.
 * Nature is determined by origin (this list), not by filename or URL heuristics.
 *
 * Once an URL has been published under Asset Globali, it remains Placeholder
 * origin for Photo-domain writes even after replace/delete (retired list).
 */

/** Setting keys owned by Admin → Asset Globali (Placeholder SoT). */
export const PLATFORM_PLACEHOLDER_SETTING_KEYS = [
    'hero_image',
    'default_patron_image',
    'auth_background_image',
    'social_canvas_bg',
    'ai_consultant_bg',
    'favicon_image',
    'category_placeholders',
    'suitcase_placeholders',
    /** Former Asset Globali URLs — still Placeholder by origin for Photo writes. */
    'retired_platform_placeholder_urls',
] as const;

export type PlatformPlaceholderSettingKey =
    (typeof PLATFORM_PLACEHOLDER_SETTING_KEYS)[number];

/**
 * Raw values as stored in `global_settings.value`:
 * - string URL for single assets (hero, patron, backgrounds)
 * - Record<category, url> for category / suitcase maps
 * - string[] for retired Placeholder URLs (origin tombstones)
 */
export type PlatformPlaceholderSettingValue =
    | string
    | string[]
    | Record<string, string>
    | null
    | undefined;

/** Snapshot of Asset Globali settings used to build the URL registry. */
export type PlatformPlaceholderSettingsSnapshot = Partial<
    Record<PlatformPlaceholderSettingKey, PlatformPlaceholderSettingValue>
>;
