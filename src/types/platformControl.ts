import type { UserRole } from './users';

/** Audience framework — DOC 30 DL-P04 / DL-P05.
 * Single source of literals: type + runtime Set stay in sync. */
export const PLATFORM_AUDIENCE_LIST = [
    'public',
    'registered',
    'business',
    'admin_limited',
    'admin_all',
] as const;

export type PlatformAudience = (typeof PLATFORM_AUDIENCE_LIST)[number];

export type PlatformFlagValueType = 'boolean' | 'number';

export type PlatformFlagSchedule = {
    id: string;
    startsAt: string;
    endsAt: string;
    /**
     * Valore applicato al flag quando la finestra è attiva e la programmazione è abilitata.
     * Per le programmazioni boolean di fermo la UI persiste sempre `false`.
     */
    value: boolean | number;
    /**
     * ON/OFF della programmazione (fermo): se false la finestra resta salvata ma è ignorata dal motore.
     * Assente / undefined → trattata come abilitata (compatibilità dati legacy).
     */
    enabled?: boolean;
};

export type PlatformFeatureFlagRecord = {
    key: string;
    category: string;
    label: string;
    valueType: PlatformFlagValueType;
    defaultValue: boolean | number;
    supportsSchedule: boolean;
    supportsAudience: boolean;
    manualOverride: boolean | number | null;
    schedules: PlatformFlagSchedule[];
    audience: PlatformAudience[];
    blockedAudiences: PlatformAudience[];
    messageKey: string | null;
    auditRequired: boolean;
    updatedAt?: string;
};

export type FeatureFlagEvaluationContext = {
    userRole: UserRole | null;
    isAuthenticated: boolean;
};

export type FeatureFlagResolutionSource =
    | 'admin_exempt'
    | 'audience_blocked'
    | 'manual_override'
    | 'schedule'
    | 'default';

export type FeatureFlagEvaluationResult = {
    key: string;
    effectiveValue: boolean | number;
    enabled: boolean;
    source: FeatureFlagResolutionSource;
    messageKey: string | null;
};

export type PlatformFeatureFlagPatch = {
    manualOverride?: boolean | number | null;
    schedules?: PlatformFlagSchedule[];
    audience?: PlatformAudience[];
    blockedAudiences?: PlatformAudience[];
};

export type PlatformControlAuditEvent = {
    id: string;
    actorId: string | null;
    configKey: string;
    action: string;
    valueBefore: unknown;
    valueAfter: unknown;
    reason: string | null;
    createdAt: string;
};
