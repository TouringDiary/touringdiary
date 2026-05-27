import { getCachedSetting } from '../settingsService';

export type AiRuntimeBlockReason = 'EMERGENCY_STOP' | 'AI_DISABLED';

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

/** Reads governance flags from bootstrap cache (global_settings). No polling. */
export function getAiRuntimeStatus(): AiRuntimeStatus {
    const emergency = parseSettingBool(getCachedSetting('ai_emergency_stop'), false);
    if (emergency) {
        return {
            available: false,
            reason: 'EMERGENCY_STOP',
            message: 'I servizi AI sono temporaneamente sospesi per emergenza.',
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

    return { available: true };
}

export function isAiRuntimeAvailable(): boolean {
    return getAiRuntimeStatus().available;
}
