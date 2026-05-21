import { MediaAsset } from '../../../../types';
import { ensureArray } from '../shared/ensureArray';
import { parseMediaAsset } from './parseMediaAsset';

/**
 * PARSER: Gallery
 * Normalizza il formato della galleria accettando solo oggetti MediaAsset.
 * Segue il principio di trasparenza: filtra gli item invalidi e logga le anomalie in DEV.
 */
export const parseGallery = (raw: any): MediaAsset[] => {
    const rawArray = ensureArray(raw);
    const validAssets: MediaAsset[] = [];

    rawArray.forEach((item: any, index: number) => {
        // Unico formato supportato: Oggetto con URL
        if (item && typeof item === 'object' && item.url) {
            validAssets.push(parseMediaAsset(item.url, item.mediaStatus || item.media_status));
        } else {
            // Osservabilità: Log delle anomalie solo in modalità sviluppo
            if (import.meta.env.DEV && item !== null) {
                console.warn(`[Parser:Gallery] Invalid item at index ${index}:`, item);
            }
        }
    });

    return validAssets;
};
