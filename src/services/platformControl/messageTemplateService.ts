import { supabase } from '@/services/supabaseClient';
import type { Json } from '@/types/supabase';
import type { SystemMessageTemplate } from '@/services/communicationService';
import {
    saveSystemMessageAsync,
} from '@/services/communicationService';
import type { PlatformMessageTemplateCatalogEntry } from '@/constants/platformFeatureFlags';

export function resolveTemplateForCatalog(
    catalog: PlatformMessageTemplateCatalogEntry,
    existing: SystemMessageTemplate | undefined
): SystemMessageTemplate {
    if (existing) return existing;
    return {
        key: catalog.key,
        type: 'internal',
        label: catalog.label,
        titleTemplate: catalog.defaultTitle,
        bodyTemplate: catalog.defaultBody,
        deviceTarget: 'all',
    };
}

/** Persists template and writes platform_control_audit (DL-P05). */
export async function saveAuditedSystemMessage(
    next: SystemMessageTemplate,
    previous: SystemMessageTemplate | null,
    reason?: string
): Promise<boolean> {
    const before: Json | null = previous
        ? {
            key: previous.key,
            label: previous.label,
            titleTemplate: previous.titleTemplate ?? null,
            bodyTemplate: previous.bodyTemplate,
        }
        : null;

    const after: Json = {
        key: next.key,
        label: next.label,
        titleTemplate: next.titleTemplate ?? null,
        bodyTemplate: next.bodyTemplate,
    };

    const saved = await saveSystemMessageAsync(next);
    if (!saved) return false;

    const { error } = await supabase.rpc('record_platform_control_audit', {
        p_config_key: `message.${next.key}`,
        p_action: 'mutate_template',
        p_value_before: before,
        p_value_after: after,
        p_reason: reason ?? null,
    });

    if (error) {
        console.error('[MessageTemplate] Audit write failed:', error.message);
    }

    return true;
}
