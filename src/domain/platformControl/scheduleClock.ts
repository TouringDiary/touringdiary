import type { PlatformFeatureFlagRecord } from '@/types/platformControl';

/**
 * Returns the soonest schedule boundary (start or end) strictly after `nowMs`.
 * Used to arm a precise setTimeout instead of continuous polling.
 */
export function getNextScheduleBoundaryMs(
    flags: PlatformFeatureFlagRecord[],
    nowMs: number
): number | null {
    let next: number | null = null;

    for (const flag of flags) {
        if (!flag.supportsSchedule || flag.schedules.length === 0) continue;
        for (const schedule of flag.schedules) {
            const startMs = Date.parse(schedule.startsAt);
            const endMs = Date.parse(schedule.endsAt);
            if (Number.isNaN(startMs) || Number.isNaN(endMs) || !(startMs < endMs)) continue;

            if (startMs > nowMs) {
                next = next === null ? startMs : Math.min(next, startMs);
            }
            if (endMs > nowMs) {
                next = next === null ? endMs : Math.min(next, endMs);
            }
        }
    }

    return next;
}

/** Browsers clamp very long timeouts; keep a safe upper bound then re-arm. */
export const SCHEDULE_TIMER_MAX_DELAY_MS = 6 * 60 * 60 * 1000; // 6 hours
