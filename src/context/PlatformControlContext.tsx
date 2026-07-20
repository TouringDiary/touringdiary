import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { evaluateFeatureFlag } from '@/domain/platformControl/evaluateFeatureFlag';
import { setPlatformFlagCache, setPlatformFlagEvaluationNow } from '@/domain/platformControl/platformFlagCache';
import {
    getNextScheduleBoundaryMs,
    SCHEDULE_TIMER_MAX_DELAY_MS,
} from '@/domain/platformControl/scheduleClock';
import {
    PLATFORM_FEATURE_FLAG_FALLBACKS,
} from '@/services/platformControl/platformControlMapper';
import { getPlatformControlService } from '@/services/platformControl/platformControlService';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { ensureSystemMessagesLoaded } from '@/services/communicationService';
import type {
    FeatureFlagEvaluationContext,
    FeatureFlagEvaluationResult,
    PlatformFeatureFlagPatch,
    PlatformFeatureFlagRecord,
} from '@/types/platformControl';
import { useUser } from './UserContext';
import { setAiRuntimeEvaluationContext } from '@/services/ai/aiRuntimeStatus';

type PlatformControlContextType = {
    flags: PlatformFeatureFlagRecord[];
    isLoading: boolean;
    error: string | null;
    refreshFlags: () => Promise<void>;
    evaluateFlag: (key: string, ctx?: Partial<FeatureFlagEvaluationContext>) => FeatureFlagEvaluationResult | null;
    getFlagDefinition: (key: string) => PlatformFeatureFlagRecord | undefined;
    mutateFlag: (key: string, patch: PlatformFeatureFlagPatch, reason?: string) => Promise<void>;
    /** Epoch ms used for schedule evaluation — advances at schedule boundaries. */
    evaluationNowMs: number;
};

const PlatformControlContext = createContext<PlatformControlContextType | undefined>(undefined);

export const PlatformControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [flags, setFlags] = useState<PlatformFeatureFlagRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evaluationNowMs, setEvaluationNowMs] = useState(() => Date.now());
    const boundaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flagsRef = useRef(flags);
    flagsRef.current = flags;

    const syncEvaluationClock = useCallback(() => {
        const now = Date.now();
        setPlatformFlagEvaluationNow(now);
        setEvaluationNowMs(now);
        return now;
    }, []);

    useEffect(() => {
        ensureSystemMessagesLoaded();
    }, []);

    /**
     * Arm a single timeout to the next schedule start/end (not continuous polling).
     * Re-arms after each boundary so long-lived pages stay exact and cheap.
     */
    const armNextScheduleBoundary = useCallback(() => {
        if (boundaryTimerRef.current !== null) {
            clearTimeout(boundaryTimerRef.current);
            boundaryTimerRef.current = null;
        }

        const now = Date.now();
        const nextBoundary = getNextScheduleBoundaryMs(flagsRef.current, now);
        if (nextBoundary === null) return;

        const delay = Math.min(
            Math.max(nextBoundary - now, 0),
            SCHEDULE_TIMER_MAX_DELAY_MS
        );

        boundaryTimerRef.current = setTimeout(() => {
            boundaryTimerRef.current = null;
            syncEvaluationClock();
            armNextScheduleBoundary();
        }, delay);
    }, [syncEvaluationClock]);

    useEffect(() => {
        armNextScheduleBoundary();
        return () => {
            if (boundaryTimerRef.current !== null) {
                clearTimeout(boundaryTimerRef.current);
                boundaryTimerRef.current = null;
            }
        };
    }, [flags, armNextScheduleBoundary]);

    // Tab wake: browsers throttle background timers — resync on visibility.
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) return;
            syncEvaluationClock();
            armNextScheduleBoundary();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [syncEvaluationClock, armNextScheduleBoundary]);

    const flagMap = useMemo(() => {
        const map = new Map<string, PlatformFeatureFlagRecord>();
        for (const flag of flags) {
            map.set(flag.key, flag);
        }
        for (const [key, fallback] of Object.entries(PLATFORM_FEATURE_FLAG_FALLBACKS)) {
            if (!map.has(key)) {
                map.set(key, fallback);
            }
        }
        return map;
    }, [flags]);

    const refreshFlags = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getPlatformControlService();
            const loaded = await service.fetchFeatureFlags();
            setFlags(loaded);
            setPlatformFlagCache(loaded);
            syncEvaluationClock();
        } catch (e) {
            console.error('[PlatformControl] Failed to load feature flags:', e);
            setError(e instanceof Error ? e.message : 'Failed to load feature flags');
            const fallbacks = Object.values(PLATFORM_FEATURE_FLAG_FALLBACKS);
            setFlags(fallbacks);
            setPlatformFlagCache(fallbacks);
            syncEvaluationClock();
        } finally {
            setIsLoading(false);
        }
    }, [syncEvaluationClock]);

    useEffect(() => {
        void refreshFlags();
    }, [refreshFlags]);

    const defaultContext = useMemo<FeatureFlagEvaluationContext>(
        () => ({
            userRole: user?.role ?? null,
            isAuthenticated: Boolean(user && user.role !== 'guest'),
        }),
        [user]
    );

    useEffect(() => {
        setAiRuntimeEvaluationContext(defaultContext);
    }, [defaultContext]);

    const getFlagDefinition = useCallback(
        (key: string) => flagMap.get(key),
        [flagMap]
    );

    const schedulesSuspended = useMemo(() => {
        const pauseFlag = flagMap.get(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED);
        if (!pauseFlag || pauseFlag.valueType !== 'boolean') return false;
        if (typeof pauseFlag.manualOverride === 'boolean') return pauseFlag.manualOverride;
        return pauseFlag.defaultValue === true;
    }, [flagMap]);

    const evaluateFlag = useCallback(
        (key: string, ctxOverride?: Partial<FeatureFlagEvaluationContext>): FeatureFlagEvaluationResult | null => {
            const definition = flagMap.get(key);
            if (!definition) return null;

            const ctx: FeatureFlagEvaluationContext = {
                ...defaultContext,
                ...ctxOverride,
            };

            return evaluateFeatureFlag(definition, ctx, new Date(evaluationNowMs), {
                schedulesSuspended,
            });
        },
        [defaultContext, flagMap, schedulesSuspended, evaluationNowMs]
    );

    const mutateFlag = useCallback(
        async (key: string, patch: PlatformFeatureFlagPatch, reason?: string) => {
            // Saving schedules clears manual override so the window is authoritative (anti-sticky SCH-03).
            const effectivePatch: PlatformFeatureFlagPatch =
                patch.schedules !== undefined && patch.manualOverride === undefined
                    ? { ...patch, manualOverride: null }
                    : patch;
            const service = getPlatformControlService();
            await service.mutateFeatureFlag(key, effectivePatch, reason);
            await refreshFlags();
        },
        [refreshFlags]
    );

    const value = useMemo(
        () => ({
            flags,
            isLoading,
            error,
            refreshFlags,
            evaluateFlag,
            getFlagDefinition,
            mutateFlag,
            evaluationNowMs,
        }),
        [flags, isLoading, error, refreshFlags, evaluateFlag, getFlagDefinition, mutateFlag, evaluationNowMs]
    );

    return (
        <PlatformControlContext.Provider value={value}>
            {children}
        </PlatformControlContext.Provider>
    );
};

export function usePlatformControl(): PlatformControlContextType {
    const ctx = useContext(PlatformControlContext);
    if (!ctx) {
        throw new Error('usePlatformControl must be used within PlatformControlProvider');
    }
    return ctx;
}

/**
 * Centralized consumer hook — DOC 30 runtime integration.
 * Re-renders when evaluationNowMs advances at a schedule boundary.
 */
export function useFeatureFlag(key: string): FeatureFlagEvaluationResult | null {
    const { evaluateFlag, evaluationNowMs } = usePlatformControl();
    void evaluationNowMs;
    return evaluateFlag(key);
}
