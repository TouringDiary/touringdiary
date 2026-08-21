import type { MediaAsset } from '../../../../types';
import { ensureArray } from '../shared/ensureArray';
import { ensureString } from '../shared/ensureString';
import { isPlainRecord } from '../shared/isPlainRecord';
import { parseMediaAsset } from './parseMediaAsset';

/**
 * PARSER: Gallery
 * Normalizza il formato della galleria accettando solo oggetti MediaAsset.
 * Segue il principio di trasparenza: filtra gli item invalidi e logga le anomalie in DEV.
 */
export const parseGallery = (raw: unknown): MediaAsset[] => {
  const rawArray = ensureArray<unknown>(raw);
  const validAssets: MediaAsset[] = [];

  rawArray.forEach((item, index) => {
    // Unico formato supportato: Oggetto con URL
    if (isPlainRecord(item) && item.url) {
      const status = item.mediaStatus || item.media_status;
      validAssets.push(
        parseMediaAsset(
          typeof item.url === 'string' ? item.url : ensureString(item.url),
          typeof status === 'string' || status == null ? status : ensureString(status),
        ),
      );
    } else {
      // Osservabilità: Log delle anomalie solo in modalità sviluppo
      if (import.meta.env.DEV && item !== null) {
        console.warn(`[Parser:Gallery] Invalid item at index ${index}:`, item);
      }
    }
  });

  return validAssets;
};
