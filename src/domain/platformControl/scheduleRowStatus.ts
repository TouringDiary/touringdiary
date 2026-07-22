import type { PlatformFlagSchedule } from '@/types/platformControl';

/**
 * Runtime status for a single schedule window (SCH-STATUS-UI / DL-P14).
 * Label UI = valore del tipo (In attesa · Attiva · In pausa · Eseguita · Errore · Disabilitata).
 */
export type ScheduleRowRuntimeStatus =
    | 'In attesa'
    | 'Attiva'
    | 'Eseguita'
    | 'In pausa'
    | 'Disabilitata'
    | 'Errore';

/** Ordine di visualizzazione storico (PO): Attive → In attesa → In pausa → Eseguite. */
const STATUS_SORT_ORDER: Record<ScheduleRowRuntimeStatus, number> = {
    Attiva: 0,
    'In attesa': 1,
    'In pausa': 2,
    Eseguita: 3,
    Errore: 4,
    Disabilitata: 5,
};

/**
 * Resolves display status for one schedule row.
 * - Errore: invalid timestamps or start >= end
 * - Disabilitata: programmazione OFF (salvata, ignorata dal motore)
 * - In pausa: global schedules pause is on (window still stored)
 * - In attesa / Attiva / Eseguita: relative to `now` with end exclusive (same as engine)
 */
export function resolveScheduleRowStatus(
    schedule: PlatformFlagSchedule,
    now: Date = new Date(),
    options?: { schedulesSuspended?: boolean }
): ScheduleRowRuntimeStatus {
    const startMs = Date.parse(schedule.startsAt);
    const endMs = Date.parse(schedule.endsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || !(startMs < endMs)) {
        return 'Errore';
    }

    if (schedule.enabled === false) {
        return 'Disabilitata';
    }

    if (options?.schedulesSuspended) {
        return 'In pausa';
    }

    const nowMs = now.getTime();
    if (nowMs < startMs) return 'In attesa';
    if (nowMs >= startMs && nowMs < endMs) return 'Attiva';
    return 'Eseguita';
}

export function compareScheduleRowsByStatus(
    a: PlatformFlagSchedule,
    b: PlatformFlagSchedule,
    now: Date,
    options?: { schedulesSuspended?: boolean }
): number {
    const statusA = resolveScheduleRowStatus(a, now, options);
    const statusB = resolveScheduleRowStatus(b, now, options);
    const orderDiff = STATUS_SORT_ORDER[statusA] - STATUS_SORT_ORDER[statusB];
    if (orderDiff !== 0) return orderDiff;
    return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}
