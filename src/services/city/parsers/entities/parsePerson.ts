import { FamousPerson } from '../../../../types';
import { ensureString } from '../shared/ensureString';
import { ensureArray } from '../shared/ensureArray';

/**
 * PARSER: FamousPerson
 * Structural Recovery: Preserva integrità JSONB e trasparenza media.
 */
export const parsePerson = (raw: any): FamousPerson => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Person] Invalid person object:`, raw);
        }
        return { id: '', name: '', role: '', bio: '', imageUrl: '' } as FamousPerson;
    }

    return {
        id: ensureString(raw.id),
        name: ensureString(raw.name),
        role: ensureString(raw.role),
        bio: ensureString(raw.bio),
        fullBio: ensureString(raw.full_bio),
        imageUrl: ensureString(raw.image_url),
        quote: ensureString(raw.quote),
        lifespan: ensureString(raw.lifespan),
        famousWorks: ensureArray<string>(raw.famous_works),
        awards: ensureArray<string>(raw.awards),
        privateLife: ensureString(raw.private_life),
        relatedPlaces: raw.related_places, // Preserva integrità JSONB
        careerStats: raw.career_stats,     // Preserva integrità JSONB
        status: raw.status as FamousPerson['status'],
        orderIndex: Number(raw.order_index ?? 0)
    };
};
