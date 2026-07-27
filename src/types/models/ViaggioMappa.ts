/**
 * Mappa del Viaggio — View (DOC 37 §9).
 * Unione geolocalizzata; non è entità CRUD.
 */

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
}
