/**
 * Mappa del Viaggio — View (DOC 37 §9).
 * Unione geolocalizzata; non è entità CRUD.
 * Clustering = solo visualizzazione client-side (VD-019).
 */

import type { PointOfInterest } from '@/types/models/City';

export type ViaggioMapPinSource = 'diary_poi' | 'ricordo_media';

export interface ViaggioMapPin {
  id: string;
  source: ViaggioMapPinSource;
  label: string;
  lat: number;
  lng: number;
  dayKey?: string;
  diaryId?: string;
  diaryName?: string;
  mediaId?: string;
  address?: string;
  /** Solo pin diary_poi — apre pagina POI completa. */
  poiId?: string;
  poi?: PointOfInterest;
}
