/**
 * Riepilogo del Viaggio — View (DOC 37 §10).
 * Aggregato calcolato + annotazioni leggere (non Resource CRUD peer).
 */

export interface ViaggioRiepilogoGeneralAnnotations {
  preferredPlace?: string;
  notes?: string;
}

export interface ViaggioRiepilogoDayAnnotations {
  notes?: string;
}

export interface ViaggioRiepilogoAnnotations {
  viaggioId: string;
  userId: string;
  general: ViaggioRiepilogoGeneralAnnotations;
  byDay: Record<string, ViaggioRiepilogoDayAnnotations>;
  updatedAt: string;
}

export interface ViaggioRiepilogoComputed {
  title: string;
  destination: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  diaryCount: number;
  activeDiaryId: string | null;
  poiCount: number;
  cityIds: string[];
  categories: string[];
  ricordiMediaCount: number;
  ricordiNoteCount: number;
  attachmentCount: number;
  mapPinCount: number;
  periodDayCount: number | null;
}
