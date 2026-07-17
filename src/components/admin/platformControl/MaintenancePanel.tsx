import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { AdminSectionCard } from '@/components/admin/common/AdminSectionCard';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';

interface MaintenancePanelProps {
    canWrite: boolean;
    flagsByKey: Map<string, import('@/types/platformControl').PlatformFeatureFlagRecord>;
    schedulesSuspended?: boolean;
    onMutateFlag: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
    canWrite,
    flagsByKey,
    schedulesSuspended = false,
    onMutateFlag,
}) => {
    const ty = usePlatformControlTypography();
    const { evaluateFlag } = usePlatformControl();
    const maintenanceFlag = flagsByKey.get(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE);
    const evaluation = evaluateFlag(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE, {
        userRole: 'admin_all',
        isAuthenticated: true,
    });

    return (
        <AdminSectionCard
            icon={AlertTriangle}
            title="Manutenzione"
            subtitle={
                evaluation?.enabled
                    ? 'Manutenzione attiva — messaggio fisso in News Bar; le altre news scorrono (DL-P06).'
                    : 'ON/OFF da Centro di Controllo. Messaggio fisso in News Bar; altre news scorrono (DL-P06). Nessun nuovo banner.'
            }
        >
            {maintenanceFlag ? (
                <div className="max-w-xl">
                    <FeatureFlagBooleanRow
                        flag={maintenanceFlag}
                        canWrite={canWrite}
                        requiresReason
                        schedulesSuspended={schedulesSuspended}
                        onSave={(manualOverride, reason) =>
                            onMutateFlag(
                                PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE,
                                manualOverride,
                                reason
                            )
                        }
                    />
                </div>
            ) : (
                <div className={`rounded-2xl border border-dashed border-slate-700 p-3 ${ty.helper}`}>
                    Flag <code>feature.platform.maintenance</code> non in cache — deploy migration
                    richiesta.
                </div>
            )}
        </AdminSectionCard>
    );
};
