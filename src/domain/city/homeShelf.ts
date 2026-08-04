import type { CitySummary } from '@/types';

const SLOT_BADGE_FALLBACKS = ['event', 'season', 'trend', 'editor', 'destination'] as const;
const TOP_VISITED_COUNT = 10;

/**
 * DOC-38 §S.4 — HomeShelf (contratto logico).
 * Proiezione minima da un catalogo già caricato: slot In Evidenza, top visitate,
 * badge/featured per griglie first viewport. Dedup per id.
 *
 * Non è un secondo fetch: si applica al risultato di getFullManifestAsync
 * (CatalogRest) quando disponibile. La Home non aspetta questo insieme per montare.
 */
export function buildHomeShelf(catalog: CitySummary[]): CitySummary[] {
  if (!catalog.length) return [];

  const byId = new Map<string, CitySummary>();
  const add = (city: CitySummary | undefined | null) => {
    if (city?.id) byId.set(city.id, city);
  };

  for (const city of catalog) {
    const order = city.homeOrder;
    if (order != null && order >= 1 && order <= 4) add(city);
  }

  for (const badge of SLOT_BADGE_FALLBACKS) {
    add(catalog.find((c) => c.specialBadge === badge));
  }

  [...catalog]
    .sort((a, b) => (b.visitors || 0) - (a.visitors || 0))
    .slice(0, TOP_VISITED_COUNT)
    .forEach(add);

  for (const city of catalog) {
    if (city.isFeatured || city.specialBadge) add(city);
  }

  return Array.from(byId.values());
}
