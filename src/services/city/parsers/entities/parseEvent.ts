import { CityEvent } from '../../../../types';
import { ensureString } from '../shared/ensureString';

/**
 * PARSER: CityEvent
 * Structural Recovery: Trasparenza totale rispetto al DB.
 * NON inventa image_status né imageAsset.
 */
export const parseEvent = (raw: any): CityEvent => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Event] Invalid event object:`, raw);
        }
        return { id: '', name: '', date: '', category: 'other', description: '', location: '', coords: { lat: 0, lng: 0 } } as CityEvent;
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
            lng: Number(raw.coords_lng ?? 0) 
        },
        imageUrl: ensureString(raw.image_url),
        orderIndex: Number(raw.order_index ?? 0)
    };
};
