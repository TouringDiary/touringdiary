import { CityDetails } from '../../types/index';
import { CityUpsertPayload } from '../../types/write';
import {
    serializePatronDetails,
    serializeRatings,
    serializeGallery,
    serializeStringArray,
} from '../../utils/jsonSerialization';

const calculateDerivedRating = (ratings: Record<string, number> | undefined): number => {
    if (!ratings) return 0;
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg100 = sum / values.length;
    return parseFloat(((avg100 / 100) * 5).toFixed(1));
};

/** Mapping esplicito CityDetails → payload di scrittura (contratto condiviso client/server). */
export const buildCityWritePayload = (city: CityDetails): CityUpsertPayload => {
    const derivedRating = calculateDerivedRating(city.details.ratings);
    const heroImage = city.details.heroImage;
    const sanitizedGallery = (city.details.gallery || []).filter(asset => asset.url !== heroImage);

    return {
        id: city.id,
        name: city.name,
        slug: city.slug ?? null,
        continent: city.continent ?? null,
        nation: city.nation ?? null,
        admin_region: city.adminRegion ?? null,
        zone: city.zone ?? null,
        coords_lat: city.coords.lat,
        coords_lng: city.coords.lng,
        description: city.description ?? null,
        status: city.status ?? null,
        image_url: city.imageUrl ?? null,
        image_status: city.image_status,
        image_credit: city.imageCredit ?? null,
        image_license: city.imageLicense ?? null,
        hero_image: heroImage ?? null,
        hero_status: city.hero_status,
        rating: derivedRating,
        visitors: city.visitors ?? null,
        is_featured: city.isFeatured ?? null,
        special_badge: city.specialBadge ?? null,
        home_order: city.homeOrder ?? null,
        subtitle: city.details.subtitle ?? null,
        history_snippet: city.details.historySnippet ?? null,
        history_full: city.details.historyFull ?? null,
        official_website: city.details.officialWebsite ?? null,
        patron_details: serializePatronDetails(city.details.patronDetails),
        ratings: serializeRatings(city.details.ratings),
        gallery: serializeGallery(sanitizedGallery),
        generation_logs: serializeStringArray(city.details.generationLogs),
        updated_at: new Date().toISOString(),
    };
};
