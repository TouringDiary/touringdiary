import { CityTourOperator } from '../../../../types';
import { ensureString } from '../shared/ensureString';
import { ensureArray } from '../shared/ensureArray';

/**
 * PARSER: CityTourOperator
 * Structural Recovery: Preserva l'integrità JSONB di reviews e opening_hours.
 * NON inventa stati media non presenti nel DB.
 */
export const parseTourOperator = (raw: any): CityTourOperator => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:TourOperator] Invalid operator object:`, raw);
        }
        return { id: '', name: '' } as CityTourOperator;
    }

    const lat = Number(raw.coords_lat);
    const lng = Number(raw.coords_lng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return {
        id: ensureString(raw.id),
        name: ensureString(raw.name),
        slug: raw.slug ? ensureString(raw.slug) : undefined,
        description: raw.description ? ensureString(raw.description) : undefined,
        imageUrl: raw.image_url ? ensureString(raw.image_url) : undefined,
        email: raw.email ? ensureString(raw.email) : undefined,
        phone: raw.phone ? ensureString(raw.phone) : undefined,
        website: raw.website ? ensureString(raw.website) : undefined,
        address: raw.address ? ensureString(raw.address) : undefined,
        coords: hasCoords ? { lat, lng } : undefined,
        rating: raw.rating != null ? Number(raw.rating) : undefined,
        reviews: raw.reviews,
        destinations: raw.destinations ? ensureArray<string>(raw.destinations) : undefined,
        servicesOffered: raw.services_offered ? ensureArray<string>(raw.services_offered) : undefined,
        openingHours: raw.opening_hours ?? undefined,
        licenseNumber: raw.license_number ? ensureString(raw.license_number) : undefined,
        ownerId: raw.owner_id ? ensureString(raw.owner_id) : undefined,
        isSponsored: raw.is_sponsored != null ? Boolean(raw.is_sponsored) : undefined,
    };
};
