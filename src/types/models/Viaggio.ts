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
export const RICORDAMI_MAX_INTERVAL_MONTHS = 12;

export type ViaggioRicordamiMode = 'interval' | 'custom_date' | 'yearly_date';

export type ViaggioRicordamiConfig =
  | { mode: 'interval' }
  | {
      mode: 'custom_date';
      /** ISO string della prossima emissione one-shot (mezzogiorno locale). */
      customDateIso: string | null;
    }
  | {
      mode: 'yearly_date';
      /** Giorno del mese (1..31). */
      yearlyDay: number;
      /** Mese (1..12). */
      yearlyMonth: number;
    };

export const DEFAULT_VIAGGIO_RICORDAMI_CONFIG: ViaggioRicordamiConfig = {
  mode: 'interval',
};

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

/** Normalizza l’intervallo Ricordami al range prodotto supportato (1..12 mesi). */
export function normalizeRicordamiIntervalMonths(intervalMonths: number | null | undefined): number {
  const n = Number(intervalMonths);
  if (!Number.isFinite(n)) return RICORDAMI_DEFAULT_INTERVAL_MONTHS;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > RICORDAMI_MAX_INTERVAL_MONTHS) return RICORDAMI_MAX_INTERVAL_MONTHS;
  return rounded;
}

export function getViaggioRicordamiConfig(
  metadata: Record<string, unknown> | null | undefined,
): ViaggioRicordamiConfig {
  const raw = metadata?.ricordami;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_VIAGGIO_RICORDAMI_CONFIG;
  }
  const record = raw as Record<string, unknown>;

  const mode = record.mode;
  if (mode === 'custom_date') {
    const customDateIso =
      typeof record.customDateIso === 'string' && record.customDateIso.trim().length > 0
        ? record.customDateIso
        : null;
    return { mode: 'custom_date', customDateIso };
  }

  if (mode === 'yearly_date') {
    const yearlyMonth = Number(record.yearlyMonth);
    const yearlyDay = Number(record.yearlyDay);
    if (!Number.isFinite(yearlyMonth) || yearlyMonth < 1 || yearlyMonth > 12) {
      return DEFAULT_VIAGGIO_RICORDAMI_CONFIG;
    }
    if (!Number.isFinite(yearlyDay) || yearlyDay < 1 || yearlyDay > 31) {
      return DEFAULT_VIAGGIO_RICORDAMI_CONFIG;
    }
    return { mode: 'yearly_date', yearlyDay, yearlyMonth };
  }

  return DEFAULT_VIAGGIO_RICORDAMI_CONFIG;
}

export function withViaggioRicordamiConfig(
  metadata: Record<string, unknown> | null | undefined,
  config: ViaggioRicordamiConfig,
): Record<string, unknown> {
  const base = { ...(metadata ?? {}) };
  if (config.mode === 'interval') {
    return { ...base, ricordami: { mode: 'interval' } };
  }
  if (config.mode === 'custom_date') {
    return {
      ...base,
      ricordami: {
        mode: 'custom_date',
        customDateIso: config.customDateIso,
      },
    };
  }
  return {
    ...base,
    ricordami: {
      mode: 'yearly_date',
      yearlyDay: config.yearlyDay,
      yearlyMonth: config.yearlyMonth,
    },
  };
}

/**
 * Data custom locale → ISO stabile a mezzogiorno locale per evitare drift di timezone
 * sui date-picker nativi.
 */
export function localDateStringToRicordamiIso(dateValue: string): string | null {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) return null;
  const local = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

function ricordaYearlyCandidateIso(
  from: Date,
  year: number,
  month: number,
  day: number,
): string | null {
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  const local = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  // Always strictly in the future (same-day still counts as future only if time is before noon).
  const fromMs = from.getTime();
  return local.getTime() > fromMs ? local.toISOString() : null;
}

/**
 * Prossima emissione per Ricordami “ogni anno il GG/MM”.
 * Trova la prima occorrenza valida nel futuro (considerando anni non bisestili per Feb 29).
 */
export function computeRicordamiNextYearlyAt(
  from: Date,
  yearlyDay: number,
  yearlyMonth: number,
): string {
  const baseYear = from.getFullYear();
  for (let y = baseYear; y <= baseYear + 8; y += 1) {
    const candidate = ricordaYearlyCandidateIso(from, y, yearlyMonth, yearlyDay);
    if (candidate) return candidate;
  }
  // Fallback: ultimo tentativo con anno+1 (assicura type safety; se non valida, returnirà null e gestiamo in UI).
  const fallbackYear = baseYear + 1;
  const daysInFallbackMonth = new Date(fallbackYear, yearlyMonth, 0).getDate();
  const clampedDay = Math.min(Math.max(1, yearlyDay), daysInFallbackMonth);
  const local = new Date(fallbackYear, yearlyMonth - 1, clampedDay, 12, 0, 0, 0);
  return local.toISOString();
}
