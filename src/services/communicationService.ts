import { supabase } from './supabaseClient';
import { DatabaseCommunicationLog } from '../types/database';
import type { Database, Json } from '@/types/supabase';

type SystemMessageRow = Database['public']['Tables']['system_messages']['Row'];
type SystemMessageInsert = Database['public']['Tables']['system_messages']['Insert'];

export interface AdminMessageLog {
    id: string;
    /** ISO timestamp — only present for rows with a non-null DB `created_at`. */
    date: string;
    sender: string;
    targetGroup: string;
    subject: string;
    body: string;
    status: 'sent' | 'scheduled' | 'failed';
    type: 'email' | 'notification' | 'system_alert';
}

export type BubbleArrowDirection =
    | 'top' | 'top-start' | 'top-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
    | 'right' | 'right-start' | 'right-end';

const BUBBLE_ARROW_DIRECTIONS: readonly BubbleArrowDirection[] = [
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end',
    'right', 'right-start', 'right-end',
] as const;

export interface PositionConfig {
    mascot: { x: number; y: number };
    bubble: { x: number; y: number };
    arrowDirection: BubbleArrowDirection;
    targetBox?: {
        x: number;
        y: number;
        w: number;
        h: number;
        active: boolean;
    };
    targetId?: string;
}

export interface UiConfig {
    desktop?: PositionConfig;
    mobile?: PositionConfig;
    confirmLabel?: string;
    cancelLabel?: string;
    mascot?: { x: number; y: number };
    bubble?: { x: number; y: number };
    arrowDirection?: BubbleArrowDirection;
}

export interface SystemMessageTemplate {
    key: string;
    type: 'internal' | 'external' | 'onboarding';
    label: string;
    titleTemplate?: string;
    bodyTemplate: string;
    variables?: string[];
    uiConfig?: UiConfig;
    deviceTarget?: 'all' | 'desktop' | 'mobile';
}

/** Narrow unknown → Supabase `Json` without assertion. */
function isJson(value: unknown): value is Json {
    if (value === null) return true;
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') return true;
    if (Array.isArray(value)) return value.every(isJson);
    if (valueType === 'object') {
        for (const nested of Object.values(value as Record<string, unknown>)) {
            if (nested !== undefined && !isJson(nested)) return false;
        }
        return true;
    }
    return false;
}

/**
 * Domain UiConfig → DB `Json` for `system_messages.ui_config`.
 * Round-trip through JSON then narrow with `isJson` (no `as Json` / `as any`).
 */
function uiConfigToJson(config: UiConfig | undefined): Json | null {
    if (config === undefined) return null;
    const parsed: unknown = JSON.parse(JSON.stringify(config));
    if (!isJson(parsed)) return null;
    return parsed;
}

function isBubbleArrowDirection(value: string): value is BubbleArrowDirection {
    return (BUBBLE_ARROW_DIRECTIONS as readonly string[]).includes(value);
}

function readPoint(value: Json | undefined): { x: number; y: number } | undefined {
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const x = value.x;
    const y = value.y;
    if (typeof x !== 'number' || typeof y !== 'number') return undefined;
    return { x, y };
}

function readTargetBox(
    value: Json | undefined
): PositionConfig['targetBox'] | undefined {
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const { x, y, w, h, active } = value;
    if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof w !== 'number' ||
        typeof h !== 'number' ||
        typeof active !== 'boolean'
    ) {
        return undefined;
    }
    return { x, y, w, h, active };
}

function readPositionConfig(value: Json | undefined): PositionConfig | undefined {
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const mascot = readPoint(value.mascot);
    const bubble = readPoint(value.bubble);
    const arrowRaw = value.arrowDirection;
    if (!mascot || !bubble || typeof arrowRaw !== 'string' || !isBubbleArrowDirection(arrowRaw)) {
        return undefined;
    }
    const targetId = value.targetId;
    return {
        mascot,
        bubble,
        arrowDirection: arrowRaw,
        targetBox: readTargetBox(value.targetBox),
        targetId: typeof targetId === 'string' ? targetId : undefined,
    };
}

/** DB `Json` → domain `UiConfig` via field-level narrowing (no assertion). */
function jsonToUiConfig(value: Json | null | undefined): UiConfig | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== 'object' || Array.isArray(value)) return undefined;

    const confirmLabel = value.confirmLabel;
    const cancelLabel = value.cancelLabel;
    const arrowRaw = value.arrowDirection;

    const config: UiConfig = {
        desktop: readPositionConfig(value.desktop),
        mobile: readPositionConfig(value.mobile),
        confirmLabel: typeof confirmLabel === 'string' ? confirmLabel : undefined,
        cancelLabel: typeof cancelLabel === 'string' ? cancelLabel : undefined,
        mascot: readPoint(value.mascot),
        bubble: readPoint(value.bubble),
        arrowDirection:
            typeof arrowRaw === 'string' && isBubbleArrowDirection(arrowRaw) ? arrowRaw : undefined,
    };

    const hasContent =
        config.desktop !== undefined ||
        config.mobile !== undefined ||
        config.confirmLabel !== undefined ||
        config.cancelLabel !== undefined ||
        config.mascot !== undefined ||
        config.bubble !== undefined ||
        config.arrowDirection !== undefined;

    return hasContent ? config : undefined;
}

function parseMessageType(type: string | null): SystemMessageTemplate['type'] {
    if (type === 'internal' || type === 'external' || type === 'onboarding') return type;
    return 'internal';
}

function parseDeviceTarget(target: string | null): NonNullable<SystemMessageTemplate['deviceTarget']> {
    if (target === 'all' || target === 'desktop' || target === 'mobile') return target;
    return 'all';
}

function parseCommunicationLogStatus(status: string): AdminMessageLog['status'] {
    if (status === 'sent' || status === 'scheduled' || status === 'failed') return status;
    return 'failed';
}

function parseCommunicationLogType(type: string): AdminMessageLog['type'] {
    if (type === 'email' || type === 'notification' || type === 'system_alert') return type;
    return 'notification';
}

// --- LOGS ---

/**
 * Maps DB rows to domain logs.
 * `communication_logs.created_at` is typed `string | null` in Supabase.
 * Rows without `created_at` are incomplete audit records and are skipped
 * (domain `AdminMessageLog.date` is always a concrete ISO string).
 */
function mapCommunicationLogRow(log: DatabaseCommunicationLog): AdminMessageLog | null {
    if (log.created_at == null || log.created_at === '') {
        console.warn(
            '[CommunicationService] Skipping communication_log without created_at',
            log.id
        );
        return null;
    }

    return {
        id: log.id,
        date: log.created_at,
        sender: log.sender,
        targetGroup: log.target_group,
        subject: log.subject,
        body: log.body,
        status: parseCommunicationLogStatus(log.status),
        type: parseCommunicationLogType(log.type),
    };
}

export const getCommunicationLogsAsync = async (): Promise<AdminMessageLog[]> => {
    try {
        const { data, error } = await supabase
            .from('communication_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as DatabaseCommunicationLog[];
        const mapped: AdminMessageLog[] = [];
        for (const log of rows) {
            const entry = mapCommunicationLogRow(log);
            if (entry) mapped.push(entry);
        }
        return mapped;
    } catch (e) {
        console.error('Fetch comms logs failed', e);
        return [];
    }
};

export const logCommunicationAsync = async (
    logData: Omit<AdminMessageLog, 'id' | 'date'>
): Promise<void> => {
    try {
        const payload = {
            sender: logData.sender,
            target_group: logData.targetGroup,
            subject: logData.subject,
            body: logData.body,
            status: logData.status,
            type: logData.type,
            created_at: new Date().toISOString(),
        };

        await supabase.from('communication_logs').insert(payload);
    } catch (e) {
        console.error('Log comms failed', e);
    }
};

// --- TEMPLATES (Message Template Source → DB SoT, DL-P13) ---

let systemMessagesCache: SystemMessageTemplate[] | null = null;
let pendingMessagesPromise: Promise<SystemMessageTemplate[]> | null = null;
/** Bumped on every invalidation so in-flight fetches cannot repopulate a stale cache. */
let systemMessagesCacheGeneration = 0;

/**
 * Emitted when the system-messages cache is invalidated after save/delete.
 * Mounted consumers (e.g. useSystemMessage) re-fetch updated templates.
 */
export const SYSTEM_MESSAGES_UPDATED_EVENT = 'system-messages-updated';

const invalidateSystemMessagesCache = (): void => {
    systemMessagesCacheGeneration += 1;
    systemMessagesCache = null;
    pendingMessagesPromise = null;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SYSTEM_MESSAGES_UPDATED_EVENT));
    }
};

function mapSystemMessageRow(msg: SystemMessageRow): SystemMessageTemplate {
    return {
        key: msg.key,
        type: parseMessageType(msg.type),
        label: msg.label,
        titleTemplate: msg.title_template?.trim() || undefined,
        bodyTemplate: msg.body_template?.trim() ?? '',
        variables: msg.variables ?? undefined,
        uiConfig: jsonToUiConfig(msg.ui_config),
        deviceTarget: parseDeviceTarget(msg.device_target),
    };
}

type BootstrapMessageRow = {
    key: string;
    type?: string | null;
    label: string;
    title_template?: string | null;
    body_template?: string | null;
    variables?: string[] | null;
    ui_config?: unknown;
    device_target?: string | null;
};

/** Bootstrap API rows may mirror the DB shape; only accept Json-compatible ui_config. */
function mapBootstrapMessageRow(msg: BootstrapMessageRow): SystemMessageTemplate {
    const uiConfig = isJson(msg.ui_config) ? jsonToUiConfig(msg.ui_config) : undefined;
    return {
        key: msg.key,
        type: parseMessageType(msg.type ?? null),
        label: msg.label,
        titleTemplate: msg.title_template?.trim() || undefined,
        bodyTemplate: msg.body_template?.trim() ?? '',
        variables: msg.variables ?? undefined,
        uiConfig,
        deviceTarget: parseDeviceTarget(msg.device_target ?? null),
    };
}

function isBootstrapMessageRow(value: unknown): value is BootstrapMessageRow {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const row = value as Record<string, unknown>;
    return typeof row.key === 'string' && typeof row.label === 'string';
}

/**
 * Sync read of cached DB templates (DL-P13 SoT).
 * Returns null if cache not yet loaded — callers use bootstrap fallback until preload completes.
 */
export function getCachedSystemMessage(key: string): SystemMessageTemplate | null {
    if (!systemMessagesCache) return null;
    return systemMessagesCache.find((m) => m.key === key) ?? null;
}

/**
 * Prefer body from DB cache (SoT). `bootstrapFallback` only when cache miss or empty body.
 */
export function resolveSystemMessageBody(
    key: string | null | undefined,
    bootstrapFallback: string
): string {
    if (!key) return bootstrapFallback;
    const cached = getCachedSystemMessage(key);
    const body = cached?.bodyTemplate?.trim();
    if (body) return body;
    return bootstrapFallback;
}

/**
 * Prefer title from DB cache (SoT). `bootstrapFallback` only when cache miss or empty title.
 */
export function resolveSystemMessageTitle(
    key: string | null | undefined,
    bootstrapFallback: string
): string {
    if (!key) return bootstrapFallback;
    const cached = getCachedSystemMessage(key);
    const title = cached?.titleTemplate?.trim();
    if (title) return title;
    return bootstrapFallback;
}

export const getSystemMessagesAsync = async (): Promise<SystemMessageTemplate[]> => {
    if (systemMessagesCache) return systemMessagesCache;
    if (pendingMessagesPromise) return pendingMessagesPromise;

    const fetchGeneration = systemMessagesCacheGeneration;

    pendingMessagesPromise = (async () => {
        try {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/bootstrap/messages`
                );
                if (response.ok) {
                    const apiRes = await response.json();
                    if (apiRes.success && Array.isArray(apiRes.data)) {
                        console.log(
                            '[CommunicationService] System messages caricati da API locale'
                        );
                        const result = apiRes.data
                            .filter(isBootstrapMessageRow)
                            .map(mapBootstrapMessageRow);
                        if (fetchGeneration === systemMessagesCacheGeneration) {
                            systemMessagesCache = result;
                        }
                        return result;
                    }
                }
            } catch (apiError) {
                console.warn(
                    '[CommunicationService] API locale fallita, uso fallback Supabase',
                    apiError
                );
            }

            const { data, error } = await supabase
                .from('system_messages')
                .select('*')
                .order('label', { ascending: true });

            if (error) throw error;

            const result = (data ?? []).map(mapSystemMessageRow);

            if (fetchGeneration === systemMessagesCacheGeneration) {
                systemMessagesCache = result;
            }
            return result;
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            if (message === 'TypeError: Failed to fetch' || message.includes('fetch')) {
                console.warn(
                    'System Messages offline: Database non raggiungibile. Uso fallback bootstrap.'
                );
            } else {
                console.error('Fetch system messages failed', e);
            }
            return [];
        } finally {
            if (fetchGeneration === systemMessagesCacheGeneration) {
                pendingMessagesPromise = null;
            }
        }
    })();

    return pendingMessagesPromise;
};

/** Kick async load so sync resolvers can hit DB cache soon after app start. */
export function ensureSystemMessagesLoaded(): void {
    void getSystemMessagesAsync();
}

export const saveSystemMessageAsync = async (msg: SystemMessageTemplate): Promise<boolean> => {
    try {
        const payload: SystemMessageInsert = {
            key: msg.key,
            type: msg.type,
            label: msg.label,
            title_template: msg.titleTemplate || null,
            body_template: msg.bodyTemplate,
            variables: msg.variables || null,
            ui_config: uiConfigToJson(msg.uiConfig),
            device_target: msg.deviceTarget || 'all',
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('system_messages').upsert(payload);
        if (error) throw error;

        invalidateSystemMessagesCache();

        return true;
    } catch (e) {
        console.error('Save system message failed', e);
        return false;
    }
};

export const deleteSystemMessageAsync = async (key: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('system_messages').delete().eq('key', key);
        if (error) throw error;

        invalidateSystemMessagesCache();

        return true;
    } catch (e) {
        console.error('Delete system message failed', e);
        return false;
    }
};

export const getCommunicationLogs = (): AdminMessageLog[] => [];
export const logCommunication = (logData: Omit<AdminMessageLog, 'id' | 'date'>): void => {
    void logCommunicationAsync(logData);
};
