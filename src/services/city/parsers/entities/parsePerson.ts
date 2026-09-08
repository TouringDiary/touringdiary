import { PERSON_STATUS_VALUES } from '../../../../constants/governance';
import type { FamousPerson, FamousPersonCategoryRef } from '../../../../types';
import { ensureArray } from '../shared/ensureArray';
import { ensureNumber } from '../shared/ensureNumber';
import { ensureString } from '../shared/ensureString';

interface PersonCategoryLinkRaw {
  specific_category_id?: unknown;
  famous_person_specific_categories?: {
    id?: unknown;
    slug?: unknown;
    label?: unknown;
    order_index?: unknown;
    is_active?: unknown;
    famous_person_master_categories?: {
      id?: unknown;
      slug?: unknown;
      label?: unknown;
      order_index?: unknown;
    } | null;
  } | null;
}

interface PersonDbRow {
  id?: unknown;
  city_id?: unknown;
  name?: unknown;
  bio?: unknown;
  full_bio?: unknown;
  image_url?: unknown;
  quote?: unknown;
  lifespan?: unknown;
  lifespan_display?: unknown;
  birth_year?: unknown;
  birth_date?: unknown;
  is_living?: unknown;
  death_year?: unknown;
  death_date?: unknown;
  famous_works?: unknown;
  awards?: unknown;
  private_life?: unknown;
  related_places?: unknown;
  career_stats?: unknown;
  status?: unknown;
  order_index?: unknown;
  city_person_category_links?: PersonCategoryLinkRaw[] | null;
}

function isPersonRecord(raw: unknown): raw is PersonDbRow {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

export function parsePersonStatus(value: unknown): FamousPerson['status'] | undefined {
  if (typeof value === 'string' && (PERSON_STATUS_VALUES as readonly string[]).includes(value)) {
    return value as FamousPerson['status'];
  }
  return undefined;
}

function parseCareerStats(value: unknown): FamousPerson['careerStats'] {
  if (!Array.isArray(value)) return undefined;
  const stats: { label: string; value: string }[] = [];
  for (const item of value) {
    if (typeof item === 'object' && item !== null) {
      const record = item as Record<string, unknown>;
      const label = ensureString(record.label);
      const val = ensureString(record.value);
      if (label || val) {
        stats.push({ label, value: val });
      }
    }
  }
  return stats.length > 0 ? stats : undefined;
}

function parseRelatedPlaces(value: unknown): FamousPerson['relatedPlaces'] {
  if (!Array.isArray(value)) return undefined;
  const places: NonNullable<FamousPerson['relatedPlaces']> = [];
  for (const item of value) {
    if (typeof item === 'object' && item !== null) {
      const record = item as Record<string, unknown>;
      const id = ensureString(record.id);
      const name = ensureString(record.name);
      const address = ensureString(record.address);
      
      let coords: { lat: number; lng: number } | undefined = undefined;
      if (typeof record.coords === 'object' && record.coords !== null) {
        const c = record.coords as Record<string, unknown>;
        const lat = Number(c.lat);
        const lng = Number(c.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          coords = { lat, lng };
        }
      }
      
      if (id && name && coords) {
        const place: NonNullable<FamousPerson['relatedPlaces']>[number] = {
          id,
          name,
          address,
          coords,
        };
        if (typeof record.notes === 'string') {
          place.notes = record.notes;
        }
        if (typeof record.visitDuration === 'string') {
          place.visitDuration = record.visitDuration;
        }
        if (record.priceLevel === 1 || record.priceLevel === 2 || record.priceLevel === 3 || record.priceLevel === 4) {
          place.priceLevel = record.priceLevel;
        }
        places.push(place);
      }
    }
  }
  return places.length > 0 ? places : undefined;
}

function parseOptionalYear(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

/** order_index: 0 solo se mancante/invalid; mai NaN. */
function parseOrderIndex(value: unknown): number {
  const n = ensureNumber(value, 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * is_living: true se === true, false se === false, altrimenti undefined se mancante/null.
 * Preserva la distinzione semantica del valore mancante rispetto a false.
 */
function parseIsLiving(value: unknown): boolean | undefined {
  if (value === true) return true;
  if (value === false) return false;
  return undefined;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function parseCategoryLinks(
  raw: unknown,
): FamousPersonCategoryRef[] {
  if (!Array.isArray(raw)) return [];
  const out: FamousPersonCategoryRef[] = [];
  for (const link of raw) {
    if (!isObject(link)) continue;
    const specific = link.famous_person_specific_categories;
    if (!isObject(specific)) continue;
    const master = specific.famous_person_master_categories;
    if (!isObject(master)) continue;

    const specificId = ensureString(specific.id);
    const masterId = ensureString(master.id);
    if (!specificId || !masterId) continue;

    out.push({
      specificId,
      specificSlug: ensureString(specific.slug),
      specificLabel: ensureString(specific.label),
      masterId,
      masterSlug: ensureString(master.slug),
      masterLabel: ensureString(master.label),
      specificOrderIndex: parseOrderIndex(specific.order_index),
      masterOrderIndex: parseOrderIndex(master.order_index),
      isActive: specific.is_active === true,
    });
  }
  return out;
}

const PERSON_CATEGORY_EMBED = `
  city_person_category_links (
    specific_category_id,
    famous_person_specific_categories (
      id, slug, label, order_index, is_active,
      famous_person_master_categories ( id, slug, label, order_index )
    )
  )
`;

/** Select fragment for people + category links (Supabase embed). */
export const CITY_PEOPLE_SELECT_WITH_CATEGORIES = `*, ${PERSON_CATEGORY_EMBED}`;

/**
 * PARSER: FamousPerson
 * Structural Recovery: Preserva integrità JSONB, cityId e categorie N:M.
 */
export const parsePerson = (raw: unknown): FamousPerson => {
  if (!isPersonRecord(raw)) {
    if (import.meta.env.DEV && raw !== null && raw !== undefined) {
      console.warn(`[Parser:Person] Invalid person object:`, raw);
    }
    return { id: '', cityId: '', name: '', bio: '', imageUrl: '', categories: [] };
  }

  const status = parsePersonStatus(raw.status);
  const lifespanDisplay =
    ensureString(raw.lifespan_display) || ensureString(raw.lifespan) || undefined;

  return {
    id: ensureString(raw.id),
    cityId: ensureString(raw.city_id),
    name: ensureString(raw.name),
    bio: ensureString(raw.bio),
    fullBio: ensureString(raw.full_bio),
    imageUrl: ensureString(raw.image_url),
    quote: ensureString(raw.quote),
    lifespanDisplay,
    birthYear: parseOptionalYear(raw.birth_year),
    birthDate: raw.birth_date == null ? null : ensureString(raw.birth_date) || null,
    isLiving: parseIsLiving(raw.is_living),
    deathYear: parseOptionalYear(raw.death_year),
    deathDate: raw.death_date == null ? null : ensureString(raw.death_date) || null,
    categories: parseCategoryLinks(raw.city_person_category_links),
    famousWorks: ensureArray<string>(raw.famous_works),
    awards: ensureArray<string>(raw.awards),
    privateLife: ensureString(raw.private_life),
    relatedPlaces: parseRelatedPlaces(raw.related_places),
    careerStats: parseCareerStats(raw.career_stats),
    ...(status !== undefined ? { status } : {}),
    orderIndex: parseOrderIndex(raw.order_index),
  };
};
