import type { CitySummary, PhotoSubmission } from '@/types/index';

/** Resolve cityId from explicit id or exact locationName match on the manifest. */
export function resolvePhotoCityId(
    photo: Pick<PhotoSubmission, 'cityId' | 'locationName'>,
    cities: CitySummary[]
): string | undefined {
    if (photo.cityId) return photo.cityId;
    const name = photo.locationName?.toLowerCase().trim();
    if (!name) return undefined;
    return cities.find((c) => c.name.toLowerCase().trim() === name)?.id;
}

/** True when the photo can appear in a city Official gallery after promotion. */
export function canPromotePhotoToOfficial(
    photo: Pick<PhotoSubmission, 'cityId' | 'locationName'>,
    cities: CitySummary[]
): boolean {
    return Boolean(resolvePhotoCityId(photo, cities));
}

/**
 * Build DB updates for Official/Community toggle.
 * Returns `null` when promoting without an explicit cityId — caller must open metadata modal.
 */
export function buildOfficialToggleUpdates(
    photo: PhotoSubmission,
    newOfficial: boolean,
    _cities: CitySummary[]
): Partial<PhotoSubmission> | null {
    if (!newOfficial) {
        return { isOfficial: false };
    }

    // Immediate promote only when cityId is already bound (required for Official gallery).
    if (!photo.cityId) return null;

    return { isOfficial: true, cityId: photo.cityId };
}

/** Shared payload for PhotoMetadataModal save (Admin + Live Feed). */
export function buildPhotoMetadataSaveUpdates(
    modal: {
        description: string;
        locationName: string;
        promoteOnSave?: boolean;
    },
    cities: CitySummary[]
): Partial<PhotoSubmission> {
    const cityId = resolvePhotoCityId(
        { cityId: undefined, locationName: modal.locationName },
        cities
    );

    return {
        description: modal.description,
        locationName: modal.locationName,
        ...(cityId ? { cityId } : {}),
        ...(modal.promoteOnSave && cityId ? { isOfficial: true } : {}),
    };
}
