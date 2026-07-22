import { findMessageCatalogByKey } from '@/constants/platformFeatureFlags';
import { PLATFORM_FEATURE_FLAG_FALLBACKS } from '@/services/platformControl/platformControlMapper';
import type { PlatformControlAuditEvent } from '@/types/platformControl';

type FlagSnapshot = {
    label?: unknown;
    manual_override?: unknown;
    schedules?: unknown;
};

function asObject(value: unknown): FlagSnapshot | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as FlagSnapshot;
}

function schedulesLength(value: unknown): number {
    return Array.isArray(value) ? value.length : 0;
}

function overrideTruthy(value: unknown): boolean {
    return value === true;
}

/**
 * Etichetta UI Centro di Controllo — SoT: record flag in cache / FALLBACKS / catalogo messaggi.
 * Nessun mapping duplicato ad hoc.
 */
export function resolveAuditConfigLabel(
    configKey: string,
    getFlagLabel?: (key: string) => string | undefined
): string {
    const fromLive = getFlagLabel?.(configKey)?.trim();
    if (fromLive) return fromLive;

    const fromFallback = PLATFORM_FEATURE_FLAG_FALLBACKS[configKey]?.label?.trim();
    if (fromFallback) return fromFallback;

    if (configKey.startsWith('message.')) {
        const messageKey = configKey.slice('message.'.length);
        const catalog = findMessageCatalogByKey(messageKey);
        if (catalog?.label?.trim()) return catalog.label.trim();
    }

    return configKey;
}

/**
 * Descrizione amministrativa dell’azione — derivata da `action` + diff value_before/value_after
 * già persistiti dall’audit (nessuna nuova semantica inventata lato server).
 */
export function resolveAuditActionLabel(event: PlatformControlAuditEvent): string {
    if (event.action === 'mutate_template') {
        return 'Messaggio aggiornato';
    }

    const before = asObject(event.valueBefore);
    const after = asObject(event.valueAfter);

    if (!before && !after) {
        return event.action === 'mutate' ? 'Configurazione aggiornata' : event.action;
    }

    const schedulesBefore = schedulesLength(before?.schedules);
    const schedulesAfter = schedulesLength(after?.schedules);
    const schedulesChanged =
        JSON.stringify(before?.schedules ?? null) !== JSON.stringify(after?.schedules ?? null);

    if (schedulesChanged) {
        if (schedulesAfter < schedulesBefore) {
            const removed = schedulesBefore - schedulesAfter;
            if (schedulesAfter === 0) {
                return schedulesBefore === 1
                    ? 'Programmazione eliminata'
                    : 'Programmazioni eliminate';
            }
            return removed === 1
                ? 'Programmazione eliminata'
                : 'Programmazioni eliminate';
        }
        return 'Programmazioni salvate';
    }

    const overrideBefore = before?.manual_override ?? null;
    const overrideAfter = after?.manual_override ?? null;
    const overrideChanged =
        JSON.stringify(overrideBefore) !== JSON.stringify(overrideAfter);

    if (overrideChanged) {
        if (event.configKey === 'feature.platform.schedules_paused') {
            return overrideTruthy(overrideAfter)
                ? 'Pausa programmazioni attivata'
                : 'Pausa programmazioni disattivata';
        }
        return 'Controllo manuale modificato';
    }

    if (event.action === 'mutate') {
        return 'Configurazione aggiornata';
    }

    return event.action;
}
