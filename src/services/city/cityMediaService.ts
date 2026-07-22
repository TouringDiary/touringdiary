import { CityDetails, MediaAsset } from '../../types';
import { isPhotographMediaAsset } from '@/domain/photos/photograph';

/**
 * CITY MEDIA → PHOTOGRAPH (Galleria Fotografica only)
 *
 * PURE LOGIC LAYER: no Supabase access; receives validated City DTO only.
 *
 * Platform rule: Presentation Media (Hero, Card, POI cover, Shop/Guide/… covers)
 * never enters the Photograph domain.
 *
 * The only city-side source authorized for Official Photograph registration is
 * Admin → Città → Media → Galleria Fotografica (`city.details.gallery`).
 */

/**
 * Assets from the City Photographic Gallery eligible for Photograph registration.
 * Does NOT include Hero, Card Anteprima, or entity presentation images.
 */
export const getCityPhotographicGalleryAssets = (city: CityDetails): MediaAsset[] => {
    const assets: MediaAsset[] = [];

    if (!city) return assets;

    const gallery = city.details?.gallery || [];
    gallery.forEach((asset: MediaAsset) => {
        if (isPhotographMediaAsset(asset)) {
            assets.push(asset);
        }
    });

    return assets;
};

/**
 * @deprecated Use `getCityPhotographicGalleryAssets`. Kept as alias during migration of call sites.
 */
export const getCityOfficialMedia = getCityPhotographicGalleryAssets;
