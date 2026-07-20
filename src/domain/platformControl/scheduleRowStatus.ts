import type { PlatformFlagSchedule } from '@/types/platformControl';

/** Runtime status for a single schedule window (SCH-STATUS-UI / DL-P14). */
export type ScheduleRowRuntimeStatus =
    | 'Programmata'
    | 'Attiva'
    | 'Terminata'
    | 'In pausa'
    | 'Disabilitata'
    | 'Errore';

/**
 * Resolves display status for one schedule row.
 * - Errore: invalid timestamps or start >= end
 * - In pausa: global schedules pause is on (window still stored)
 * - Disabilitata: empty/disabled window (caller may use when flag has no schedules)
 * - Programmata / Attiva / Terminata: relative to `now` with end exclusive (same as engine)
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

    if (options?.schedulesSuspended) {
        return 'In pausa';
    }

    const nowMs = now.getTime();
    if (nowMs < startMs) return 'Programmata';
    if (nowMs >= startMs && nowMs < endMs) return 'Attiva';
    return 'Terminata';
}
