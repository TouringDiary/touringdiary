import { evaluateFeatureFlag } from '@/domain/platformControl/evaluateFeatureFlag';
import { PLATFORM_FEATURE_FLAG_FALLBACKS } from '@/services/platformControl/platformControlMapper';
import type {
    FeatureFlagEvaluationContext,
    FeatureFlagEvaluationResult,
    PlatformFeatureFlagRecord,
} from '@/types/platformControl';

let cachedFlags: PlatformFeatureFlagRecord[] = Object.values(PLATFORM_FEATURE_FLAG_FALLBACKS);

/** Updates the sync cache used by non-React consumers (AI runtime, services). */
export function setPlatformFlagCache(flags: PlatformFeatureFlagRecord[]): void {
    cachedFlags = flags;
}

function resolveDefinition(key: string): PlatformFeatureFlagRecord | undefined {
    const fromCache = cachedFlags.find((flag) => flag.key === key);
    if (fromCache) return fromCache;
    return PLATFORM_FEATURE_FLAG_FALLBACKS[key];
}

function isSchedulesSuspendedFromCache(): boolean {
    const pauseFlag = resolveDefinition('feature.platform.schedules_paused');
    if (!pauseFlag || pauseFlag.valueType !== 'boolean') return false;
    const manual = pauseFlag.manualOverride;
    if (typeof manual === 'boolean') return manual;
    return pauseFlag.defaultValue === true;
}

export function evaluateCachedFeatureFlag(
    key: string,
    ctx: FeatureFlagEvaluationContext,
    now: Date = new Date()
): FeatureFlagEvaluationResult | null {
    const definition = resolveDefinition(key);
    if (!definition) return null;
    return evaluateFeatureFlag(definition, ctx, now, {
        schedulesSuspended: isSchedulesSuspendedFromCache(),
    });
}

export function getCachedNumericFlagValue(key: string, fallback: number): number {
    const definition = resolveDefinition(key);
    if (!definition || definition.valueType !== 'number') return fallback;

    const result = evaluateFeatureFlag(
        definition,
        {
            userRole: 'admin_all',
            isAuthenticated: true,
        },
        new Date(),
        { schedulesSuspended: isSchedulesSuspendedFromCache() }
    );

    return typeof result.effectiveValue === 'number' ? result.effectiveValue : fallback;
}
