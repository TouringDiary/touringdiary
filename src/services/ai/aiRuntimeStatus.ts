import { getCachedSetting } from '../settingsService';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '@/domain/platformControl/platformFlagCache';
import type { FeatureFlagEvaluationContext } from '@/types/platformControl';
import type { UserRole } from '@/types/users';

export type AiRuntimeBlockReason = 'EMERGENCY_STOP' | 'AI_DISABLED' | 'AUDIENCE_BLOCKED';

export interface AiRuntimeStatus {
    available: boolean;
    reason?: AiRuntimeBlockReason;
    message?: string;
}

function parseSettingBool(raw: unknown, defaultWhenMissing: boolean): boolean {
    if (raw === null || raw === undefined) return defaultWhenMissing;
    const normalized = String(raw).replace(/"/g, '').trim().toLowerCase();
    if (['false', 'f', '0', 'no'].includes(normalized)) return false;
    if (['true', 't', '1', 'yes'].includes(normalized)) return true;
    return defaultWhenMissing;
}

function aiFlagKeyForRole(role: UserRole | null | undefined): string {
    if (role === 'admin_all') return PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL;
    if (role === 'admin_limited') return PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED;
    return PLATFORM_FEATURE_FLAG_KEYS.AI_USERS;
}

/**
 * Reads ACC governance from bootstrap cache (global_settings) plus CC Feature Flags.
 * AI Control Center remains the quick on/off; Centro di Controllo adds granularity (G-AI-SEP).
 */
export function getAiRuntimeStatus(ctx?: FeatureFlagEvaluationContext): AiRuntimeStatus {
    const evaluationCtx: FeatureFlagEvaluationContext = ctx ?? {
        userRole: null,
        isAuthenticated: false,
    };

    const emergency = parseSettingBool(getCachedSetting('ai_emergency_stop'), false);
    if (emergency) {
        return {
            available: false,
            reason: 'EMERGENCY_STOP',
            message: 'I servizi AI sono temporaneamente sospesi per emergenza.',
        };
    }

    const ccEmergency = evaluateCachedFeatureFlag(
        PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY,
        evaluationCtx
    );
    if (ccEmergency?.enabled) {
        return {
            available: false,
            reason: 'EMERGENCY_STOP',
            message: 'I servizi AI sono temporaneamente sospesi per emergenza (Centro di Controllo).',
        };
    }

    const enabled = parseSettingBool(getCachedSetting('ai_enabled'), true);
    if (!enabled) {
        return {
            available: false,
            reason: 'AI_DISABLED',
            message: 'I servizi AI sono temporaneamente disattivati per manutenzione.',
        };
    }

    const roleFlag = evaluateCachedFeatureFlag(
        aiFlagKeyForRole(evaluationCtx.userRole),
        evaluationCtx
    );
    if (roleFlag && !roleFlag.enabled) {
        return {
            available: false,
            reason: roleFlag.source === 'audience_blocked' ? 'AUDIENCE_BLOCKED' : 'AI_DISABLED',
            message: 'I servizi AI non sono disponibili per il tuo profilo al momento.',
        };
    }

    return { available: true };
}

export function isAiRuntimeAvailable(ctx?: FeatureFlagEvaluationContext): boolean {
    return getAiRuntimeStatus(ctx).available;
}
