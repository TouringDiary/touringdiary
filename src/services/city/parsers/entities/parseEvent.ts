import type { CityEvent } from '../../../../types';
import { ensureString } from '../shared/ensureString';
import { isPlainRecord } from '../shared/isPlainRecord';

/**
 * PARSER: CityEvent
 * Structural Recovery: Trasparenza totale rispetto al DB.
 * NON inventa image_status né imageAsset.
 */
export const parseEvent = (raw: unknown): CityEvent => {
  if (!isPlainRecord(raw)) {
    if (import.meta.env.DEV && raw !== null && raw !== undefined) {
      console.warn(`[Parser:Event] Invalid event object:`, raw);
    }
    return {
      id: '',
      name: '',
      date: '',
      category: 'other',
      description: '',
      location: '',
      coords: { lat: 0, lng: 0 },
    };
  }

  return {
    id: ensureString(raw.id),
    name: ensureString(raw.name),
    date: ensureString(raw.date),
    category: raw.category as CityEvent['category'],
    description: ensureString(raw.description),
    location: ensureString(raw.location),
    coords: {
      lat: Number(raw.coords_lat ?? 0),
      lng: Number(raw.coords_lng ?? 0),
    },
    imageUrl: ensureString(raw.image_url),
    orderIndex: Number(raw.order_index ?? 0),
  };
};
