import type {
    FeatureFlagEvaluationContext,
    FeatureFlagEvaluationResult,
    FeatureFlagResolutionSource,
    PlatformFeatureFlagRecord,
    PlatformFlagSchedule,
    PlatformFlagValueType,
} from '@/types/platformControl';
import { isAdminAllExempt, isAudienceBlocked } from './platformAudience';

function coerceBoolean(value: boolean | number | null | undefined, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return fallback;
}

/** Accept override only when its runtime type matches the flag valueType. */
function typedOverride(
    value: boolean | number | null | undefined,
    valueType: PlatformFlagValueType
): boolean | number | null {
    if (value === null || value === undefined) return null;
    if (valueType === 'number') {
        return typeof value === 'number' && !Number.isNaN(value) ? value : null;
    }
    return typeof value === 'boolean' ? value : null;
}

/**
 * Returns the value of the first schedule window that contains `now`.
 *
 * Domain rule — overlapping windows: **array order wins** (first match).
 * No chronological re-sort. Documented in DOC 30 (Feature Flag Engine).
 */
function getActiveScheduleValue(
    schedules: PlatformFlagSchedule[],
    now: Date
): boolean | number | null {
    const nowMs = now.getTime();

    for (const schedule of schedules) {
        const startMs = Date.parse(schedule.startsAt);
        const endMs = Date.parse(schedule.endsAt);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;
        if (nowMs >= startMs && nowMs < endMs) {
            return schedule.value;
        }
    }

    return null;
}

export type EvaluateFeatureFlagOptions = {
    /** When true, ignore all schedules (global pause — schedules remain stored). */
    schedulesSuspended?: boolean;
};

/**
 * Resolves effective flag value: manual_override ?? active_schedule ?? default (DL-P04).
 * admin_all is never blocked by audience rules.
 * When schedulesSuspended, schedule layer is skipped (pause globale programmazioni).
 */
export function evaluateFeatureFlag(
    flag: PlatformFeatureFlagRecord,
    ctx: FeatureFlagEvaluationContext,
    now: Date = new Date(),
    options?: EvaluateFeatureFlagOptions
): FeatureFlagEvaluationResult {
    const messageKey = flag.messageKey;
    const manual = typedOverride(flag.manualOverride, flag.valueType);
    const scheduled =
        flag.supportsSchedule && !options?.schedulesSuspended
            ? getActiveScheduleValue(flag.schedules, now)
            : null;
    const effectiveValue = manual ?? scheduled ?? flag.defaultValue;

    let source: FeatureFlagResolutionSource = 'default';
    if (manual != null) {
        source = 'manual_override';
    } else if (scheduled != null) {
        source = 'schedule';
    }

    if (
        !isAdminAllExempt(ctx.userRole) &&
        flag.supportsAudience &&
        flag.valueType === 'boolean' &&
        isAudienceBlocked(flag.audience, flag.blockedAudiences, ctx)
    ) {
        return {
            key: flag.key,
            effectiveValue: false,
            enabled: false,
            source: 'audience_blocked',
            messageKey,
        };
    }

    return {
        key: flag.key,
        effectiveValue,
        enabled: flag.valueType === 'boolean' ? coerceBoolean(effectiveValue, false) : true,
        source,
        messageKey,
    };
}
