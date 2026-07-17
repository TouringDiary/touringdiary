import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { evaluateFeatureFlag } from '@/domain/platformControl/evaluateFeatureFlag';
import { setPlatformFlagCache } from '@/domain/platformControl/platformFlagCache';
import {
    PLATFORM_FEATURE_FLAG_FALLBACKS,
} from '@/services/platformControl/platformControlMapper';
import { getPlatformControlService } from '@/services/platformControl/platformControlService';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import type {
    FeatureFlagEvaluationContext,
    FeatureFlagEvaluationResult,
    PlatformFeatureFlagPatch,
    PlatformFeatureFlagRecord,
} from '@/types/platformControl';
import { useUser } from './UserContext';

type PlatformControlContextType = {
    flags: PlatformFeatureFlagRecord[];
    isLoading: boolean;
    error: string | null;
    refreshFlags: () => Promise<void>;
    evaluateFlag: (key: string, ctx?: Partial<FeatureFlagEvaluationContext>) => FeatureFlagEvaluationResult | null;
    getFlagDefinition: (key: string) => PlatformFeatureFlagRecord | undefined;
    mutateFlag: (key: string, patch: PlatformFeatureFlagPatch, reason?: string) => Promise<void>;
};

const PlatformControlContext = createContext<PlatformControlContextType | undefined>(undefined);

export const PlatformControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [flags, setFlags] = useState<PlatformFeatureFlagRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        } catch (e) {
            console.error('[PlatformControl] Failed to load feature flags:', e);
            setError(e instanceof Error ? e.message : 'Failed to load feature flags');
            const fallbacks = Object.values(PLATFORM_FEATURE_FLAG_FALLBACKS);
            setFlags(fallbacks);
            setPlatformFlagCache(fallbacks);
        } finally {
            setIsLoading(false);
        }
    }, []);

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

            return evaluateFeatureFlag(definition, ctx, new Date(), { schedulesSuspended });
        },
        [defaultContext, flagMap, schedulesSuspended]
    );

    const mutateFlag = useCallback(
        async (key: string, patch: PlatformFeatureFlagPatch, reason?: string) => {
            const service = getPlatformControlService();
            await service.mutateFeatureFlag(key, patch, reason);
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
        }),
        [flags, isLoading, error, refreshFlags, evaluateFlag, getFlagDefinition, mutateFlag]
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

/** Centralized consumer hook — DOC 30 runtime integration. */
export function useFeatureFlag(key: string): FeatureFlagEvaluationResult | null {
    const { evaluateFlag } = usePlatformControl();
    return evaluateFlag(key);
}
