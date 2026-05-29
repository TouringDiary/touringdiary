import { FamousPerson } from '../../../../types';
import { PERSON_STATUS_VALUES } from '../../../../constants/governance';
import { ensureString } from '../shared/ensureString';
import { ensureArray } from '../shared/ensureArray';

interface PersonDbRow {
    id?: unknown;
    name?: unknown;
    role?: unknown;
    bio?: unknown;
    full_bio?: unknown;
    image_url?: unknown;
    quote?: unknown;
    lifespan?: unknown;
    famous_works?: unknown;
    awards?: unknown;
    private_life?: unknown;
    related_places?: FamousPerson['relatedPlaces'];
    career_stats?: FamousPerson['careerStats'];
    status?: unknown;
    order_index?: unknown;
}

function isPersonRecord(raw: unknown): raw is PersonDbRow {
    return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

export function parsePersonStatus(value: unknown): FamousPerson['status'] | undefined {
    if (value === PERSON_STATUS_VALUES[0]) {
        return PERSON_STATUS_VALUES[0];
    }
    if (value === PERSON_STATUS_VALUES[1]) {
        return PERSON_STATUS_VALUES[1];
    }
    return undefined;
}

/**
 * PARSER: FamousPerson
 * Structural Recovery: Preserva integrità JSONB e trasparenza media.
 */
export const parsePerson = (raw: unknown): FamousPerson => {
    if (!isPersonRecord(raw)) {
        if (import.meta.env.DEV && raw !== null && raw !== undefined) {
            console.warn(`[Parser:Person] Invalid person object:`, raw);
        }
        return { id: '', name: '', role: '', bio: '', imageUrl: '' };
    }

    const status = parsePersonStatus(raw.status);

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
        relatedPlaces: raw.related_places,
        careerStats: raw.career_stats,
        ...(status !== undefined ? { status } : {}),
        orderIndex: Number(raw.order_index ?? 0),
    };
};
