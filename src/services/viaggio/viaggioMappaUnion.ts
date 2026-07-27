/**
 * Unione geolocalizzata Mappa — pure (DOC 37 §9). Nessun I/O.
 */
import type { Itinerary } from '@/types/index';
import type { ViaggioMapPin } from '@/types/models/ViaggioMappa';
import type { ViaggioRicordoMedia } from '@/types/models/ViaggioRicordi';

type RicordoMediaWithCoords = ViaggioRicordoMedia & {
  coordsLat: number;
  coordsLng: number;
};

function isUsableCoord(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function hasUsableRicordoCoords(media: ViaggioRicordoMedia): media is RicordoMediaWithCoords {
  return isUsableCoord(media.coordsLat, media.coordsLng);
}

export function pinsFromDiaries(diaries: Itinerary[]): ViaggioMapPin[] {
  const pins: ViaggioMapPin[] = [];
  for (const diary of diaries) {
    for (const item of diary.items ?? []) {
      const coords = item.poi?.coords;
      if (!coords || !isUsableCoord(coords.lat, coords.lng)) continue;
      pins.push({
        id: `diary:${diary.id}:${item.id}`,
        source: 'diary_poi',
        label: item.poi.name || 'POI',
        lat: coords.lat,
        lng: coords.lng,
        dayKey: `d${item.dayIndex ?? 0}`,
        diaryId: diary.id ?? undefined,
        diaryName: diary.name,
        address: item.poi.address,
      });
    }
  }
  return pins;
}

export function pinsFromRicordi(media: ViaggioRicordoMedia[]): ViaggioMapPin[] {
  return media.filter(hasUsableRicordoCoords).map((m) => ({
    id: `media:${m.id}`,
    source: 'ricordo_media' as const,
    label: m.title || (m.kind === 'video' ? 'Video' : 'Foto'),
    lat: m.coordsLat,
    lng: m.coordsLng,
    dayKey: m.dayKey,
    mediaId: m.id,
  }));
}

export function unionViaggioMapPins(diaries: Itinerary[], media: ViaggioRicordoMedia[]): ViaggioMapPin[] {
  return [...pinsFromDiaries(diaries), ...pinsFromRicordi(media)];
}
