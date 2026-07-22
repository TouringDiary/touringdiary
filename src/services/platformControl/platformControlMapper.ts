import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import {
    PLATFORM_AUDIENCE_LIST,
    type PlatformControlAuditEvent,
    type PlatformFeatureFlagPatch,
    type PlatformFeatureFlagRecord,
    type PlatformFlagSchedule,
    type PlatformAudience,
    type PlatformFlagValueType,
} from '@/types/platformControl';

import type { Json } from '@/types/supabase';
import type { Database } from '@/types/supabase';

type SupabaseFeatureFlagRow = Database['public']['Tables']['platform_feature_flags']['Row'];

export type DbPlatformFeatureFlagRow = SupabaseFeatureFlagRow;

/** Derived from PLATFORM_AUDIENCE_LIST — cannot diverge from PlatformAudience. */
const PLATFORM_AUDIENCE_VALUES: ReadonlySet<string> = new Set(PLATFORM_AUDIENCE_LIST);

function isPlatformAudience(value: string): value is PlatformAudience {
    return PLATFORM_AUDIENCE_VALUES.has(value);
}

function parseAudiences(values: string[] | null): PlatformAudience[] {
    if (!values) return [];
    return values.filter(isPlatformAudience);
}

function parseFlagValue(value: Json, valueType: PlatformFlagValueType): boolean | number {
    if (valueType === 'number') {
        const parsed = typeof value === 'number' ? value : Number(value);
        if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
            throw new Error(`Invalid number flag value: ${String(value)}`);
        }
        return parsed;
    }
    return value === true || value === 'true' || value === 1;
}

function parseOptionalFlagValue(value: Json | null, valueType: PlatformFlagValueType): boolean | number | null {
    if (value === null || value === undefined) return null;
    if (valueType === 'number') {
        const parsed = typeof value === 'number' ? value : Number(value);
        if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
            return null;
        }
        return parsed;
    }
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1) return true;
    if (value === 'false' || value === 0) return false;
    return null;
}

/** Drop malformed windows (incl. startsAt >= endsAt) so runtime never sees invalid schedules. */
function parseSchedules(value: Json): PlatformFlagSchedule[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const row = entry as Record<string, unknown>;
        if (
            typeof row.id !== 'string' ||
            typeof row.startsAt !== 'string' ||
            typeof row.endsAt !== 'string' ||
            (typeof row.value !== 'boolean' && typeof row.value !== 'number')
        ) {
            return [];
        }

        const startMs = Date.parse(row.startsAt);
        const endMs = Date.parse(row.endsAt);
        if (Number.isNaN(startMs) || Number.isNaN(endMs) || !(startMs < endMs)) {
            return [];
        }

        return [{
            id: row.id,
            startsAt: row.startsAt,
            endsAt: row.endsAt,
            value: row.value,
        }];
    });
}

export function mapDbFeatureFlagRow(row: {
    key: string;
    category: string;
    label: string;
    value_type: string;
    default_value: Json;
    supports_schedule: boolean;
    supports_audience: boolean;
    manual_override: Json | null;
    schedules: Json;
    audience: string[] | null;
    blocked_audiences: string[] | null;
    message_key: string | null;
    audit_required: boolean;
    updated_at?: string;
}): PlatformFeatureFlagRecord {
    const valueType = row.value_type === 'number' ? 'number' : 'boolean';
    return {
        key: row.key,
        category: row.category,
        label: row.label,
        valueType,
        defaultValue: parseFlagValue(row.default_value, valueType),
        supportsSchedule: row.supports_schedule,
        supportsAudience: row.supports_audience,
        manualOverride: parseOptionalFlagValue(row.manual_override, valueType),
        schedules: parseSchedules(row.schedules),
        audience: parseAudiences(row.audience),
        blockedAudiences: parseAudiences(row.blocked_audiences),
        messageKey: row.message_key,
        auditRequired: row.audit_required,
        updatedAt: row.updated_at,
    };
}

/** Fallback when DB is unavailable — mirrors migration seed defaults (DOC 30 catalog v1). */
function boolFallback(
    key: string,
    category: string,
    label: string,
    defaultValue: boolean,
    messageKey: string | null = null,
    supportsSchedule = true,
    supportsAudience = true
): PlatformFeatureFlagRecord {
    return {
        key,
        category,
        label,
        valueType: 'boolean',
        defaultValue,
        supportsSchedule,
        supportsAudience,
        manualOverride: null,
        schedules: [],
        audience: [],
        blockedAudiences: [],
        messageKey,
        auditRequired: true,
    };
}

export const PLATFORM_FEATURE_FLAG_FALLBACKS: Record<string, PlatformFeatureFlagRecord> = {
    [PLATFORM_FEATURE_FLAG_KEYS.AI_GUEST]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.AI_GUEST, 'ai', 'AI Guest', true, 'ai_disabled_guest'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.AI_USERS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.AI_USERS, 'ai', 'AI Utente', true, 'ai_disabled_user'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL, 'ai', 'AI Admin All', true, 'ai_disabled_admin'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED, 'ai', 'AI Admin Limited', true, 'ai_disabled_admin_limited'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY, 'ai', 'Stop emergenza AI', false, 'ai_emergency_notice', true, false
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_CREDIT_PURCHASE]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_CREDIT_PURCHASE, 'economy', 'Acquisto crediti AI', true, 'credits_purchase_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_SUBSCRIPTIONS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_SUBSCRIPTIONS, 'economy', 'Abbonamenti premium', true, 'subscriptions_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_ADMIN_PARTNER]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_ADMIN_PARTNER, 'comms', 'Chat Admin↔Partner', true, 'comms_partner_chat_disabled'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_USER_SPONSOR]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_USER_SPONSOR, 'comms', 'Chat Utente↔Sponsor', false, 'comms_user_sponsor_disabled'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_NOTIFICATIONS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_NOTIFICATIONS, 'comms', 'Notifiche in-app', true, 'comms_notifications_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS, 'sponsor', 'Nuove candidature Sponsor', true, 'sponsor_applications_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC, 'sponsor', 'Shop partner pubblici', true, null
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_RATING_THRESHOLD]: {
        key: PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_RATING_THRESHOLD,
        category: 'sponsor',
        label: 'Soglia rating alert (stelle)',
        valueType: 'number',
        defaultValue: 3,
        supportsSchedule: false,
        supportsAudience: false,
        manualOverride: null,
        schedules: [],
        audience: [],
        blockedAudiences: [],
        messageKey: null,
        auditRequired: true,
    },
    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS, 'moderation', 'Recensioni utenti', true, 'moderation_reviews_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS, 'moderation', 'Upload foto', true, 'moderation_photos_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_SUGGESTIONS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_SUGGESTIONS, 'moderation', 'Segnalazioni utenti', true, 'moderation_suggestions_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS, 'moderation', 'Post community', true, 'moderation_community_posts_paused'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE,
        'platform',
        'Modalità manutenzione',
        false,
        'maintenance_ticker_message',
        true,
        false
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_REGISTRATION]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_REGISTRATION,
        'platform',
        'Registrazione nuovi utenti',
        true,
        'registration_closed'
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING,
        'platform',
        'Onboarding guidato',
        true,
        null,
        false,
        true
    ),
    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED]: boolFallback(
        PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED,
        'platform',
        'Programmazioni in pausa',
        false,
        null,
        false,
        false
    ),
};

export type PlatformControlServiceDeps = {
    selectFlags: () => Promise<DbPlatformFeatureFlagRow[]>;
    mutateFlag: (key: string, patch: Json, reason?: string) => Promise<DbPlatformFeatureFlagRow>;
    selectAudit: (limit?: number) => Promise<PlatformControlAuditEvent[]>;
};

export function createPlatformControlService(deps: PlatformControlServiceDeps) {
    return {
        async fetchFeatureFlags(): Promise<PlatformFeatureFlagRecord[]> {
            const rows = await deps.selectFlags();
            return rows.map(mapDbFeatureFlagRow);
        },

        async mutateFeatureFlag(
            key: string,
            patch: PlatformFeatureFlagPatch,
            reason?: string
        ): Promise<PlatformFeatureFlagRecord> {
            const dbPatch: { [key: string]: Json } = {};

            if ('manualOverride' in patch) {
                dbPatch.manual_override =
                    patch.manualOverride === null || patch.manualOverride === undefined
                        ? null
                        : patch.manualOverride;
            }
            if ('schedules' in patch) {
                dbPatch.schedules = (patch.schedules ?? []).map((schedule) => ({
                    id: schedule.id,
                    startsAt: schedule.startsAt,
                    endsAt: schedule.endsAt,
                    value: schedule.value,
                }));
            }
            if ('audience' in patch) {
                dbPatch.audience = patch.audience ?? [];
            }
            if ('blockedAudiences' in patch) {
                dbPatch.blocked_audiences = patch.blockedAudiences ?? [];
            }

            const row = await deps.mutateFlag(key, dbPatch, reason);
            return mapDbFeatureFlagRow(row);
        },

        async fetchAuditEvents(limit = 50): Promise<PlatformControlAuditEvent[]> {
            return deps.selectAudit(limit);
        },
    };
}

export type PlatformControlService = ReturnType<typeof createPlatformControlService>;
