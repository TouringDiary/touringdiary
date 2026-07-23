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

const TOP_FLAG_KEYS = [
    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE,
    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_REGISTRATION,
    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING,
    PLATFORM_FEATURE_FLAG_KEYS.GAMIFICATION_REWARDS,
] as const;

/** Controlli operativi manutenzione + accessi — pausa schedule nell’header Programmazione automatica. */
export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
    canWrite,
    flagsByKey,
    schedulesSuspended = false,
    onMutateFlag,
}) => {
    const ty = usePlatformControlTypography();
    const { evaluateFlag } = usePlatformControl();
    const evaluation = evaluateFlag(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE, {
        userRole: 'admin_all',
        isAuthenticated: true,
    });

    return (
        <div className="space-y-3 sm:space-y-4">
            {evaluation?.enabled ? (
                <p className={ty.helper}>
                    Manutenzione attiva — messaggio fisso in News Bar; le altre news scorrono.
                </p>
            ) : null}

            <p className={ty.helper}>Controlli operativi — manutenzione, accessi e premi Gamification.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {TOP_FLAG_KEYS.map((key) => {
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
                    const isMaintenance = key === PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE;
                    return (
                        <div key={key} className="min-w-0 flex flex-col gap-2">
                            <FeatureFlagBooleanRow
                                flag={flag}
                                canWrite={canWrite}
                                requiresReason={isMaintenance}
                                schedulesSuspended={schedulesSuspended}
                                onSave={(manualOverride, reason) =>
                                    onMutateFlag(key, manualOverride, reason)
                                }
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
