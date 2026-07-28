/**
 * Ricordi del Viaggio — Resource (DOC 37 §6).
 * Foto/Video owned by Viaggio; Note-giorno ≠ note Diario ≠ annotazioni Riepilogo.
 * Giorni = link logici (multi-giorno ammesso); contenuto unico (VD-020).
 */

export type ViaggioRicordoMediaKind = 'photo' | 'video';

/** Due modalità struttura giorni (DOC 37 §6.2). */
export type ViaggioRicordiStructureMode = 'viaggio_period' | 'diary_timeline';

export interface ViaggioRicordoMedia {
  id: string;
  viaggioId: string;
  userId: string;
  kind: ViaggioRicordoMediaKind;
  /**
   * Giorno primario (colonna legacy `day_key`).
   * Allineato al primo di `dayKeys` dopo sync link; non è la fonte di verità dei giorni.
   * Il path storage è fissato all'upload e non segue gli aggiornamenti di questo campo.
   */
  dayKey: string;
  /** Link logici a uno o più giorni (contenuto unico). */
  dayKeys: string[];
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
