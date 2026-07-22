import { getCachedSetting } from '../settingsService';
import {
    findMessageCatalogByKey,
    PLATFORM_FEATURE_FLAG_KEYS,
    PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '@/constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '@/domain/platformControl/platformFlagCache';
import { resolveSystemMessageBody, resolveSystemMessageTitle } from '@/services/communicationService';
import type { FeatureFlagEvaluationContext } from '@/types/platformControl';

export type AiRuntimeBlockReason = 'EMERGENCY_STOP' | 'AI_DISABLED' | 'AUDIENCE_BLOCKED';

export interface AiRuntimeStatus {
    available: boolean;
    reason?: AiRuntimeBlockReason;
    /** User-facing body (DB SoT). */
    message?: string;
    /** User-facing short title (DB SoT) — e.g. CTA / toast. */
    title?: string;
}

/** Synced from PlatformControlProvider — used when callers omit ctx (gateway boundary). */
let cachedEvaluationCtx: FeatureFlagEvaluationContext = {
    userRole: null,
    isAuthenticated: false,
};

export function setAiRuntimeEvaluationContext(ctx: FeatureFlagEvaluationContext): void {
    cachedEvaluationCtx = {
        userRole: ctx.userRole,
        isAuthenticated: ctx.isAuthenticated,
    };
}

function parseSettingBool(raw: unknown, defaultWhenMissing: boolean): boolean {
    if (raw === null || raw === undefined) return defaultWhenMissing;
    const normalized = String(raw).replace(/"/g, '').trim().toLowerCase();
    if (['false', 'f', '0', 'no'].includes(normalized)) return false;
    if (['true', 't', '1', 'yes'].includes(normalized)) return true;
    return defaultWhenMissing;
}

function aiFlagKeyForContext(ctx: FeatureFlagEvaluationContext): string {
    if (ctx.userRole === 'admin_all') return PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL;
    if (ctx.userRole === 'admin_limited') return PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED;
    if (!ctx.isAuthenticated) return PLATFORM_FEATURE_FLAG_KEYS.AI_GUEST;
    return PLATFORM_FEATURE_FLAG_KEYS.AI_USERS;
}

/** DB SoT via cache; catalog defaultBody/Title only as bootstrap if DB/cache miss (DL-P13). */
function resolveUserCopy(
    messageKey: string | null | undefined,
    bootstrapBody: string,
    bootstrapTitle: string
): { message: string; title: string } {
    const catalog = findMessageCatalogByKey(messageKey);
    const body = resolveSystemMessageBody(
        messageKey,
        catalog?.defaultBody?.trim() || bootstrapBody
    );
    const title = resolveSystemMessageTitle(
        messageKey,
        catalog?.defaultTitle?.trim() || bootstrapTitle
    );
    return { message: body, title };
}

/**
 * Reads ACC governance from bootstrap cache (global_settings) plus CC Feature Flags.
 * AI Control Center remains the quick on/off; Centro di Controllo adds granularity (G-AI-SEP).
 */
export function getAiRuntimeStatus(ctx?: FeatureFlagEvaluationContext): AiRuntimeStatus {
    const evaluationCtx: FeatureFlagEvaluationContext = ctx ?? cachedEvaluationCtx;

    const emergency = parseSettingBool(getCachedSetting('ai_emergency_stop'), false);
    if (emergency) {
        const copy = resolveUserCopy(
            PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_EMERGENCY_NOTICE,
            'I servizi AI sono temporaneamente sospesi per emergenza.',
            'Emergenza AI'
        );
        return { available: false, reason: 'EMERGENCY_STOP', ...copy };
    }

    const ccEmergency = evaluateCachedFeatureFlag(
        PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY,
        evaluationCtx
    );
    if (ccEmergency?.enabled) {
        const copy = resolveUserCopy(
            ccEmergency.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_EMERGENCY_NOTICE,
            'I servizi AI sono temporaneamente sospesi per emergenza (Centro di Controllo).',
            'Emergenza AI'
        );
        return { available: false, reason: 'EMERGENCY_STOP', ...copy };
    }

    const enabled = parseSettingBool(getCachedSetting('ai_enabled'), true);
    if (!enabled) {
        const copy = resolveUserCopy(
            PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_MAINTENANCE_NOTICE,
            'I servizi AI sono temporaneamente disattivati per manutenzione.',
            'Manutenzione AI'
        );
        return { available: false, reason: 'AI_DISABLED', ...copy };
    }

    const roleFlag = evaluateCachedFeatureFlag(
        aiFlagKeyForContext(evaluationCtx),
        evaluationCtx
    );
    if (roleFlag && !roleFlag.enabled) {
        const copy = resolveUserCopy(
            roleFlag.messageKey,
            'I servizi AI non sono disponibili per il tuo profilo al momento.',
            'AI non disponibile'
        );
        return {
            available: false,
            reason: roleFlag.source === 'audience_blocked' ? 'AUDIENCE_BLOCKED' : 'AI_DISABLED',
            ...copy,
        };
    }

    return { available: true };
}

export function isAiRuntimeAvailable(ctx?: FeatureFlagEvaluationContext): boolean {
    return getAiRuntimeStatus(ctx).available;
}

/** Gateway / provider boundary — throws before any Edge/API call. */
export function assertAiRuntimeAvailable(ctx?: FeatureFlagEvaluationContext): void {
    const status = getAiRuntimeStatus(ctx);
    if (!status.available) {
        throw new Error(status.message || 'I servizi AI non sono disponibili al momento.');
    }
}
