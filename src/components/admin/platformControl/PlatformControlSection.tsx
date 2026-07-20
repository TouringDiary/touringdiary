import React from 'react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import type { PlatformFeatureFlagRecord } from '@/types/platformControl';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';
import { FeatureFlagNumberRow } from './FeatureFlagNumberRow';

interface PlatformControlSectionProps {
    flagKeys: readonly string[];
    flagsByKey: Map<string, PlatformFeatureFlagRecord>;
    canWrite: boolean;
    schedulesSuspended?: boolean;
    onMutate: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
}

/** Griglia flag di una TAB — l’intestazione descrittiva è nel banner della TAB. */
export const PlatformControlSection: React.FC<PlatformControlSectionProps> = ({
    flagKeys,
    flagsByKey,
    canWrite,
    schedulesSuspended = false,
    onMutate,
}) => {
    const ty = usePlatformControlTypography();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {flagKeys.map((key) => {
                const flag = flagsByKey.get(key);
                if (!flag) {
                    return (
                        <div
                            key={key}
                            className={`rounded-2xl border border-dashed border-slate-700 p-3 ${ty.helper}`}
                        >
                            Flag non in cache: <code>{key}</code>
                        </div>
                    );
                }

                if (flag.valueType === 'number') {
                    return (
                        <FeatureFlagNumberRow
                            key={key}
                            flag={flag}
                            canWrite={canWrite}
                            schedulesSuspended={schedulesSuspended}
                            onSave={(manualOverride) => onMutate(key, manualOverride)}
                        />
                    );
                }

                return (
                    <FeatureFlagBooleanRow
                        key={key}
                        flag={flag}
                        canWrite={canWrite}
                        schedulesSuspended={schedulesSuspended}
                        requiresReason={key === PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY}
                        onSave={(manualOverride, reason) => onMutate(key, manualOverride, reason)}
                    />
                );
            })}
        </div>
    );
};
