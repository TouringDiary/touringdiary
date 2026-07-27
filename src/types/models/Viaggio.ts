/**
 * Viaggio — Aggregate Root del patrimonio personale (MySpace).
 * SoT: AI_CONTEXT/34A · 37 — il Diario (`Itinerary`) è una Resource collegata, non l'identità.
 */

export interface Viaggio {
  id: string;
  userId: string;
  title: string;
  destination: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  coverImage: string | null;
  /** Diario attivo; NULL se nessuno (no auto-promote). */
  activeDiaryId: string | null;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface CreateViaggioInput {
  userId: string;
  title: string;
  destination?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  coverImage?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateViaggioInput {
  title?: string;
  destination?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  coverImage?: string | null;
  metadata?: Record<string, unknown>;
}

/** Empty Viaggio ammesso dal dominio (0 diari). */
export function createEmptyViaggioDraft(userId: string, title = 'Viaggio'): Omit<Viaggio, 'id'> & { id: null } {
  const now = Date.now();
  return {
    id: null,
    userId,
    title,
    destination: null,
    periodStart: null,
    periodEnd: null,
    coverImage: null,
    activeDiaryId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}
