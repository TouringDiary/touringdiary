/** Tab supportate da CityInfoModal e dalle preview editor città. */
export const CITY_INFO_PREVIEW_TABS = ['guides', 'events', 'services', 'tour_operators'] as const;

export type CityInfoPreviewTab = (typeof CITY_INFO_PREVIEW_TABS)[number];

export function isCityInfoPreviewTab(value: string): value is CityInfoPreviewTab {
    for (const tab of CITY_INFO_PREVIEW_TABS) {
        if (value === tab) return true;
    }
    return false;
}
