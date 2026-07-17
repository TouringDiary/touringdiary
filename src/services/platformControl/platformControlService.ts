import { supabase } from '../supabaseClient';
import type { Json } from '@/types/supabase';
import {
    createPlatformControlService,
    mapDbFeatureFlagRow,
    type PlatformControlService,
} from './platformControlMapper';
import type { PlatformControlAuditEvent } from '@/types/platformControl';

let serviceInstance: PlatformControlService | null = null;

export function getPlatformControlService(): PlatformControlService {
    if (!serviceInstance) {
        serviceInstance = createPlatformControlService({
            selectFlags: async () => {
                const { data, error } = await supabase
                    .from('platform_feature_flags')
                    .select('*')
                    .order('category')
                    .order('key');

                if (error) throw error;
                return data ?? [];
            },

            mutateFlag: async (key, patch, reason) => {
                const { data, error } = await supabase.rpc('mutate_platform_feature_flag', {
                    p_key: key,
                    p_patch: patch,
                    p_reason: reason ?? null,
                });

                if (error) throw error;
                if (!data) throw new Error('mutate_platform_feature_flag returned no row');
                return data;
            },

            selectAudit: async (limit = 50) => {
                const { data, error } = await supabase
                    .from('platform_control_audit')
                    .select('id, actor_id, config_key, action, value_before, value_after, reason, created_at')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;

                return (data ?? []).map(
                    (row): PlatformControlAuditEvent => ({
                        id: row.id,
                        actorId: row.actor_id,
                        configKey: row.config_key,
                        action: row.action,
                        valueBefore: row.value_before,
                        valueAfter: row.value_after,
                        reason: row.reason,
                        createdAt: row.created_at,
                    })
                );
            },
        });
    }

    return serviceInstance;
}

/** Resets singleton — for tests only. */
export function resetPlatformControlServiceForTests(): void {
    serviceInstance = null;
}
