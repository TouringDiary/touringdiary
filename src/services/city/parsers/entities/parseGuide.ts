import type { CityGuide } from '../../../../types';
import { ensureArray } from '../shared/ensureArray';
import { ensureString } from '../shared/ensureString';
import { isPlainRecord } from '../shared/isPlainRecord';

/**
 * PARSER: CityGuide
 * Structural Recovery: Preserva l'integrità JSONB delle reviews.
 * NON inventa stati media non presenti nel DB.
 */
export const parseGuide = (raw: unknown): CityGuide => {
  if (!isPlainRecord(raw)) {
    if (import.meta.env.DEV && raw !== null && raw !== undefined) {
      console.warn(`[Parser:Guide] Invalid guide object:`, raw);
    }
    return { id: '', name: '', isOfficial: false, languages: [], specialties: [] } as CityGuide;
  }

  return {
    id: ensureString(raw.id),
    name: ensureString(raw.name),
    isOfficial: Boolean(raw.is_official),
    languages: ensureArray<string>(raw.languages),
    specialties: ensureArray<string>(raw.specialties),
    email: ensureString(raw.email),
    phone: ensureString(raw.phone),
    website: ensureString(raw.website),
    imageUrl: ensureString(raw.image_url),
    rating: Number(raw.rating ?? 0),
    reviews: raw.reviews as CityGuide['reviews'], // Preserva integrità JSONB
    orderIndex: Number(raw.order_index ?? 0),
  };
};
