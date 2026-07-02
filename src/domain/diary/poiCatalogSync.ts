import type { ItineraryItem } from '@/types/models/Itinerary';
import type { PointOfInterest } from '@/types/models/City';

/** ID POI catalogo presenti nel diario (esclude custom). */
export function getCatalogPoiIds(items: ItineraryItem[]): string[] {
  return [
    ...new Set(
      items
        .filter((item) => !item.isCustom && item.poi?.id)
        .map((item) => item.poi.id),
    ),
  ];
}

function itemHasPoiCatalogUpdate(item: ItineraryItem, fresh: PointOfInterest): boolean {
  if (!fresh.updatedAt) return false;
  const storedAt = item.poi.updatedAt;
  return !storedAt || storedAt !== fresh.updatedAt;
}

/** Verifica aggiornamenti catalogo confrontando `poi.updatedAt` persistito vs server. */
export function hasPoiCatalogUpdates(
  items: ItineraryItem[],
  freshPois: PointOfInterest[],
): boolean {
  const freshById = new Map(freshPois.map((poi) => [poi.id, poi]));

  return items.some((item) => {
    if (item.isCustom || !item.poi?.id) return false;
    const fresh = freshById.get(item.poi.id);
    if (!fresh) return false;
    return itemHasPoiCatalogUpdate(item, fresh);
  });
}

/** Firma degli aggiornamenti disponibili — per ricordare "Non ora" nella sessione. */
export function buildPoiCatalogUpdateSignature(
  items: ItineraryItem[],
  freshPois: PointOfInterest[],
): string {
  const freshById = new Map(freshPois.map((poi) => [poi.id, poi]));
  const parts: string[] = [];

  for (const item of items) {
    if (item.isCustom || !item.poi?.id) continue;
    const fresh = freshById.get(item.poi.id);
    if (!fresh || !itemHasPoiCatalogUpdate(item, fresh)) continue;
    parts.push(`${item.poi.id}:${fresh.updatedAt ?? ''}`);
  }

  return parts.sort().join('|');
}

/**
 * Aggiorna solo i dati POI dal catalogo, preservando note, orari e metadati del diario.
 */
export function mergePoiCatalogUpdates(
  items: ItineraryItem[],
  freshPois: PointOfInterest[],
): ItineraryItem[] {
  const freshById = new Map(freshPois.map((poi) => [poi.id, poi]));

  return items.map((item) => {
    if (item.isCustom || !item.poi?.id) return item;
    const fresh = freshById.get(item.poi.id);
    if (!fresh || !itemHasPoiCatalogUpdate(item, fresh)) return item;
    return { ...item, poi: fresh };
  });
}
