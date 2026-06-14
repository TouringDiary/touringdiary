import { Itinerary } from '@/types';
import { CitySummary } from '@/types/models/City';
import { isRealItineraryStop } from '@/utils/itineraryAssociability';

const normalizeCityType = (cityType: string): string =>
  cityType === 'lago' ? 'laghi_fiumi' : cityType.toLowerCase();

/**
 * Deriva i city_type unici dal diario risolvendo cityId → cityTypes dal manifest.
 */
export const deriveItineraryCityTypes = (
  itinerary: Pick<Itinerary, 'items'> & { mainCity?: string | null } | null | undefined,
  cityManifest: CitySummary[] | null | undefined
): string[] => {
  if (!itinerary) return [];

  const manifest = cityManifest ?? [];
  const cityIds = new Set<string>();

  itinerary.items
    ?.filter(isRealItineraryStop)
    .forEach((item) => {
      if (item.cityId) cityIds.add(item.cityId.toLowerCase());
    });

  if (cityIds.size === 0 && itinerary.mainCity) {
    cityIds.add(itinerary.mainCity.toLowerCase());
  }

  const types = new Set<string>();

  cityIds.forEach((cityId) => {
    const city = manifest.find(
      (c) => c.id.toLowerCase() === cityId || c.slug?.toLowerCase() === cityId
    );
    (city?.cityTypes ?? []).forEach((t) => types.add(normalizeCityType(t)));
  });

  return Array.from(types);
};

/** Deduplica template_id preservando l'ordine (prima occorrenza vince). */
export const dedupeTemplateIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  ids.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  });
  return result;
};
