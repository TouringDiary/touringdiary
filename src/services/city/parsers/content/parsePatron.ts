import type { PatronDetails } from '../../../../types';
import { parseMediaAsset } from '../media/parseMediaAsset';
import { ensureString } from '../shared/ensureString';

const normalizeMediaStatus = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  return undefined;
};

/**
 * PARSER: PatronDetails
 * Normalizza l'oggetto Patron gestendo la compatibilità legacy (snake/camel case).
 * Trasparenza: NON inietta 'N/A' né altri fallback UI.
 * Gallery Patrono/Festa: tabella dedicata `city_patron_gallery` (non patron_details JSON).
 */
export const parsePatron = (raw: unknown): PatronDetails | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    if (import.meta.env.DEV && raw !== null && raw !== undefined) {
      console.warn(`[Parser:Patron] Invalid patron object:`, raw);
    }
    return null;
  }

  const record = raw as Record<string, unknown>;

  const url = ensureString(record.image_url || record.imageUrl);
  const status =
    normalizeMediaStatus(record.image_status) ?? normalizeMediaStatus(record.image_status_legacy);
  const mediaAsset = parseMediaAsset(url, status);

  return {
    name: ensureString(record.name),
    date: ensureString(record.date),
    history: ensureString(record.history),
    imageUrl: mediaAsset.url,
    image_status: mediaAsset.mediaStatus,
    imageAsset: mediaAsset,
  };
};
