import { Itinerary, ItineraryItem } from '@/types';

/** Tappa reale: esclude risorse footer e memo. */
export const isRealItineraryStop = (item: ItineraryItem): boolean =>
  !item.isResource && item.type !== 'memo';

/**
 * Un diario è associabile a una valigia quando ha date valide e almeno una tappa reale.
 * Non dipende da persistenza, itineraryId, nome o autenticazione.
 */
export const isDiaryAssociable = (
  diary: Pick<Itinerary, 'startDate' | 'endDate' | 'items'> | null | undefined
): boolean => {
  if (!diary) return false;

  const { startDate, endDate, items } = diary;
  if (!startDate || !endDate) return false;
  if (startDate > endDate) return false;
  if (!items?.some(isRealItineraryStop)) return false;

  return true;
};
