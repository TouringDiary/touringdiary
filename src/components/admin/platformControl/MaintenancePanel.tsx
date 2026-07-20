import React from 'react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';

interface MaintenancePanelProps {
    canWrite: boolean;
    flagsByKey: Map<string, import('@/types/platformControl').PlatformFeatureFlagRecord>;
    schedulesSuspended?: boolean;
    onMutateFlag: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
}

const PLATFORM_ACCESS_FLAG_KEYS = [
    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_REGISTRATION,
    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING,
] as const;

/** Contenuto operativo manutenzione + accessi piattaforma — banner TAB gestito dal Centro di Controllo. */
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
        <div className="space-y-4">
            <div className="space-y-2">
                {evaluation?.enabled ? (
                    <p className={ty.helper}>
                        Manutenzione attiva — messaggio fisso in News Bar; le altre news scorrono.
                    </p>
                ) : null}
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
            </div>

            <div className="space-y-2 max-w-xl">
                <p className={ty.helper}>Accesso piattaforma — registrazione e onboarding.</p>
                {PLATFORM_ACCESS_FLAG_KEYS.map((key) => {
                    const flag = flagsByKey.get(key);
                    if (!flag) {
                        return (
                            <div
                                key={key}
                                className={`rounded-2xl border border-dashed border-slate-700 p-3 ${ty.helper}`}
                            >
                                Flag <code>{key}</code> non in cache — deploy migration richiesta.
                            </div>
                        );
                    }
                    return (
                        <FeatureFlagBooleanRow
                            key={key}
                            flag={flag}
                            canWrite={canWrite}
                            schedulesSuspended={schedulesSuspended}
                            onSave={(manualOverride, reason) =>
                                onMutateFlag(key, manualOverride, reason)
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
};
