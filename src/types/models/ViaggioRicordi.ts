/**
 * Ricordi del Viaggio — Resource (DOC 37 §6).
 * Foto/Video owned by Viaggio; Note-giorno ≠ note Diario ≠ annotazioni Riepilogo.
 */

export type ViaggioRicordoMediaKind = 'photo' | 'video';

/** Due modalità struttura giorni (DOC 37 §6.2). */
export type ViaggioRicordiStructureMode = 'viaggio_period' | 'diary_timeline';

export interface ViaggioRicordoMedia {
  id: string;
  viaggioId: string;
  userId: string;
  kind: ViaggioRicordoMediaKind;
  dayKey: string;
  title: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  coordsLat: number | null;
  coordsLng: number | null;
  createdAt: string;
}

export interface ViaggioRicordoDayNote {
  id: string;
  viaggioId: string;
  userId: string;
  dayKey: string;
  body: string;
  updatedAt: string;
}

export interface ViaggioRicordiDayBucket {
  dayKey: string;
  label: string;
  media: ViaggioRicordoMedia[];
  note: ViaggioRicordoDayNote | null;
}
