import { CityService } from '../../../../types';
import { ensureString } from '../shared/ensureString';

/**
 * PARSER: CityService
 * Structural Recovery: Trasparenza totale rispetto al DB.
 */
export const parseService = (raw: any): CityService => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Service] Invalid service object:`, raw);
        }
        return { id: '', type: 'other', name: '', contact: '' } as CityService;
    }

    return {
        id: ensureString(raw.id),
        type: raw.type as CityService['type'],
        name: ensureString(raw.name),
        contact: ensureString(raw.contact),
        description: ensureString(raw.description),
        url: ensureString(raw.url),
        address: ensureString(raw.address),
        category: ensureString(raw.category),
        orderIndex: Number(raw.order_index ?? 0)
    };
};
