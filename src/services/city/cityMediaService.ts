import { CityDetails, MediaAsset } from '../../types';

/**
 * CITY MEDIA SERVICE
 * 
 * PURE LOGIC LAYER: Gestisce la trasformazione del CityDTO in asset visualizzabili.
 * Regola: Nessun accesso a Supabase, riceve solo DTO validati.
 */

export const getCityOfficialMedia = (city: CityDetails): MediaAsset[] => {
    const assets: MediaAsset[] = [];

    if (!city) return assets;

    // 1. Core Hero/Card Image
    if (city.imageUrl && city.image_status !== 'placeholder' && city.image_status !== 'missing') {
        assets.push({ url: city.imageUrl, mediaStatus: city.image_status });
    }

    // 2. Gallery Discovery
    const gallery = city.details?.gallery || [];
    gallery.forEach((asset: MediaAsset) => {
        if (asset.url && asset.mediaStatus !== 'placeholder' && asset.mediaStatus !== 'missing') {
            assets.push(asset);
        }
    });

    // 3. POI Media Discovery
    const pois = city.details?.allPois || [];
    pois.forEach(poi => {
        if (poi.imageUrl && poi.image_status !== 'placeholder' && poi.image_status !== 'missing') {
            assets.push({ url: poi.imageUrl, mediaStatus: poi.image_status as any });
        }
    });

    return assets;
};
