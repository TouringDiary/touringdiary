/**
 * SoT — catena distanze tra tappe geolocalizzate del Diario.
 *
 * Regola: Note / memo / risorse / coordinate (0,0) non sono tappe geografiche.
 * La distanza di una tappa geo è sempre verso l’ultima tappa geo valida precedente
 * nello stesso giorno (stesso algoritmo usato dalla timeline Diario).
 *
 * Usato da: DiaryDay, prepareItineraryForPdf (Export PDF/Word/TXT/anteprima).
 */

import { calculateDistance } from '@/services/geo';
import type { ItineraryItem } from '@/types';

/** Tappa con coordinate utili per la catena distanze (non nota/memo/risorsa/zero). */
export function isValidGeoItineraryStop(item: ItineraryItem): boolean {
    if (item.isCustom || item.isResource || item.type === 'memo') return false;
    const coords = item.poi?.coords;
    if (!coords) return false;
    return coords.lat !== 0 || coords.lng !== 0;
}

/** Indice dell’ultima tappa geo valida prima di `currentIndex` (−1 se assente). */
export function findLastValidGeoStopIndex(
    list: ItineraryItem[],
    currentIndex: number,
): number {
    for (let i = currentIndex - 1; i >= 0; i--) {
        const candidate = list[i];
        if (
            candidate &&
            isValidGeoItineraryStop(candidate) &&
            candidate.dayIndex === list[currentIndex]?.dayIndex
        ) {
            return i;
        }
    }
    return -1;
}

/**
 * Distanza (km, 1 decimale) dalla precedente tappa geo valida allo stop corrente.
 * `null` se lo stop corrente non è geo o non esiste un predecessore geo nello stesso giorno.
 */
export function distanceFromPreviousGeoStop(
    list: ItineraryItem[],
    currentIndex: number,
): number | null {
    const item = list[currentIndex];
    if (!item || !isValidGeoItineraryStop(item)) return null;

    const lastIndex = findLastValidGeoStopIndex(list, currentIndex);
    if (lastIndex < 0) return null;

    const prev = list[lastIndex];
    const from = prev.poi.coords;
    const to = item.poi.coords;
    if (!from || !to) return null;

    return calculateDistance(from.lat, from.lng, to.lat, to.lng);
}
