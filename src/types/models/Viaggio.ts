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
  /** «Ricordami questo viaggio» — DOC 35 §6.5 */
  ricordamiEnabled: boolean;
  ricordamiIntervalMonths: number;
  /** Prossima emissione (ISO); null se OFF. */
  ricordamiNextAt: string | null;
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
  ricordamiEnabled?: boolean;
  ricordamiIntervalMonths?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateViaggioInput {
  title?: string;
  destination?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  coverImage?: string | null;
  ricordamiEnabled?: boolean;
  ricordamiIntervalMonths?: number;
  ricordamiNextAt?: string | null;
  metadata?: Record<string, unknown>;
}

export const RICORDAMI_DEFAULT_INTERVAL_MONTHS = 12;

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
    ricordamiEnabled: true,
    ricordamiIntervalMonths: RICORDAMI_DEFAULT_INTERVAL_MONTHS,
    ricordamiNextAt: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

/** Calcola next_at da ora + N mesi (calendario reale via `Date.setMonth`). */
export function computeRicordamiNextAt(
  from: Date,
  intervalMonths: number,
): string {
  let months = intervalMonths;
  if (!Number.isFinite(months)) {
    months = RICORDAMI_DEFAULT_INTERVAL_MONTHS;
  }
  if (months < 1) {
    months = 1;
  }
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}
