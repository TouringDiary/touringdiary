/**
 * Struttura giorni Ricordi — due modalità DOC 37 §6.2 (pure, no I/O).
 */
import type { Itinerary } from '@/types/index';
import type { Viaggio } from '@/types/models/Viaggio';
import type { ViaggioRicordiStructureMode } from '@/types/models/ViaggioRicordi';

const DAY_MS = 86_400_000;

export interface RicordiDaySlot {
  dayKey: string;
  label: string;
  /** Solo modalità diary_timeline. */
  dayIndex?: number;
}

function toIsoDateUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/** Giorni dal periodo Viaggio (un giorno per data inclusa). */
export function buildDaysFromViaggioPeriod(viaggio: Pick<Viaggio, 'periodStart' | 'periodEnd'>): RicordiDaySlot[] {
  const { periodStart, periodEnd } = viaggio;
  if (!periodStart || !periodEnd) return [];
  const start = Date.parse(periodStart);
  const end = Date.parse(periodEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [];

  const slots: RicordiDaySlot[] = [];
  for (let t = start; t <= end; t += DAY_MS) {
    const dayKey = toIsoDateUTC(t);
    slots.push({ dayKey, label: formatDayLabel(dayKey) });
  }
  return slots;
}

/** Timeline del Diario selezionato (riferimento temporale; ownership media resta sul Viaggio). */
export function buildDaysFromDiaryTimeline(diary: Itinerary): RicordiDaySlot[] {
  const maxFromItems = diary.items.reduce((max, item) => Math.max(max, item.dayIndex ?? 0), 0);
  let dayCount = Math.max(1, maxFromItems + 1);

  if (diary.startDate && diary.endDate) {
    const start = Date.parse(diary.startDate);
    const end = Date.parse(diary.endDate);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      dayCount = Math.max(dayCount, Math.floor((end - start) / DAY_MS) + 1);
    }
  }

  const slots: RicordiDaySlot[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dayKey = `d${i}`;
    let label = `Giorno ${i + 1}`;
    if (diary.startDate) {
      const start = Date.parse(diary.startDate);
      if (!Number.isNaN(start)) {
        const iso = toIsoDateUTC(start + i * DAY_MS);
        label = `Giorno ${i + 1} · ${formatDayLabel(iso)}`;
      }
    }
    slots.push({ dayKey, label, dayIndex: i });
  }
  return slots;
}

export function buildRicordiDaySlots(params: {
  mode: ViaggioRicordiStructureMode;
  viaggio: Pick<Viaggio, 'periodStart' | 'periodEnd'>;
  diary: Itinerary | null;
}): RicordiDaySlot[] {
  if (params.mode === 'viaggio_period') {
    return buildDaysFromViaggioPeriod(params.viaggio);
  }
  if (!params.diary) return [];
  return buildDaysFromDiaryTimeline(params.diary);
}
