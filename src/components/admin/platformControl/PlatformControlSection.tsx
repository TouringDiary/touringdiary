import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bot, MessageSquare, Store, ShieldAlert } from 'lucide-react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import type { PlatformControlSectionId } from '@/constants/platformFeatureFlags';
import type { PlatformFeatureFlagRecord } from '@/types/platformControl';
import { AdminSectionCard } from '@/components/admin/common/AdminSectionCard';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';
import { FeatureFlagNumberRow } from './FeatureFlagNumberRow';

interface PlatformControlSectionProps {
    sectionId: PlatformControlSectionId;
    title: string;
    description: string;
    note?: string;
    flagKeys: readonly string[];
    flagsByKey: Map<string, PlatformFeatureFlagRecord>;
    canWrite: boolean;
    schedulesSuspended?: boolean;
    onMutate: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
}

const SECTION_ICON: Record<PlatformControlSectionId, LucideIcon> = {
    ai: Bot,
    comms: MessageSquare,
    sponsor: Store,
    moderation: ShieldAlert,
};

export const PlatformControlSection: React.FC<PlatformControlSectionProps> = ({
    sectionId,
    title,
    description,
    note,
    flagKeys,
    flagsByKey,
    canWrite,
    schedulesSuspended = false,
    onMutate,
}) => {
    const ty = usePlatformControlTypography();
    const Icon = SECTION_ICON[sectionId];

    return (
        <AdminSectionCard
            icon={Icon}
            title={title}
            subtitle={note ? `${description} ${note}` : description}
        >
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
        </AdminSectionCard>
    );
};
