import React, { useMemo, useState } from 'react';
import { Loader2, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/common/AdminPageHeader';
import { usePlatformControl } from '@/context/PlatformControlContext';
import {
    PLATFORM_CONTROL_SECTION_KEYS,
    PLATFORM_CONTROL_UI_TABS,
    PLATFORM_FEATURE_FLAG_KEYS,
    type PlatformControlSectionId,
} from '@/constants/platformFeatureFlags';
import { PLATFORM_FEATURE_FLAG_FALLBACKS } from '@/services/platformControl/platformControlMapper';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { User } from '@/types/users';
import type { PlatformFlagSchedule } from '@/types/platformControl';
import { PlatformControlSection } from './PlatformControlSection';
import { MessageTemplatesPanel } from './MessageTemplatesPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { SchedulePanel } from './SchedulePanel';
import { AuditHistoryPanel } from './AuditHistoryPanel';

interface PlatformControlCenterProps {
    currentUser: User;
}

type PlatformControlTabId = (typeof PLATFORM_CONTROL_UI_TABS)[number]['id'];

const SECTION_META: Record<
    PlatformControlSectionId,
    { title: string; description: string; note?: string }
> = {
    ai: {
        title: 'AI',
        description:
            'Granularità AI Utente / Admin All / Admin Limited, stop emergenza e acquisto crediti. On/off operativo rapido resta in AI Control Center.',
        note: 'AI Control Center ≠ Centro di Controllo — strumenti separati.',
    },
    comms: {
        title: 'Comunicazioni',
        description:
            'Chat Admin↔Partner, Utente↔Sponsor e notifiche. Messaggi di disabilitazione nella card del flag.',
    },
    sponsor: {
        title: 'Sponsor',
        description: 'Candidature, shop pubblici e soglia rating alert.',
    },
    moderation: {
        title: 'Moderazione',
        description: 'Recensioni, upload foto, segnalazioni e post community.',
    },
};

export const PlatformControlCenter: React.FC<PlatformControlCenterProps> = ({ currentUser }) => {
    const { flags, isLoading, error, mutateFlag, evaluateFlag } = usePlatformControl();
    const ty = usePlatformControlTypography();
    const isSuperAdmin = currentUser.role === 'admin_all';
    const isReadOnlyAdmin = currentUser.role === 'admin_limited';
    const canWrite = isSuperAdmin;
    const [activeTab, setActiveTab] = useState<PlatformControlTabId>('ai');

    const flagsByKey = useMemo(() => {
        const map = new Map(
            Object.entries(PLATFORM_FEATURE_FLAG_FALLBACKS) as [
                string,
                (typeof PLATFORM_FEATURE_FLAG_FALLBACKS)[string],
            ][]
        );
        for (const flag of flags) {
            map.set(flag.key, flag);
        }
        return map;
    }, [flags]);

    const schedulesSuspended =
        evaluateFlag(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED, {
            userRole: 'admin_all',
            isAuthenticated: true,
        })?.enabled ?? false;

    const handleMutate = async (
        key: string,
        manualOverride: boolean | number | null,
        reason?: string
    ) => {
        await mutateFlag(key, { manualOverride }, reason);
    };

    const handleSaveSchedules = async (key: string, schedules: PlatformFlagSchedule[]) => {
        await mutateFlag(key, { schedules });
    };

    const renderFlagSection = (sectionId: PlatformControlSectionId) => {
        const meta = SECTION_META[sectionId];
        return (
            <PlatformControlSection
                sectionId={sectionId}
                title={meta.title}
                description={meta.description}
                note={meta.note}
                flagKeys={PLATFORM_CONTROL_SECTION_KEYS[sectionId]}
                flagsByKey={flagsByKey}
                canWrite={canWrite}
                schedulesSuspended={schedulesSuspended}
                onMutate={handleMutate}
            />
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'ai':
            case 'comms':
            case 'sponsor':
            case 'moderation':
                return renderFlagSection(activeTab);
            case 'maintenance':
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <MaintenancePanel
                            canWrite={canWrite}
                            flagsByKey={flagsByKey}
                            schedulesSuspended={schedulesSuspended}
                            onMutateFlag={handleMutate}
                        />
                        <SchedulePanel
                            canWrite={canWrite}
                            flags={Array.from(flagsByKey.values())}
                            flagsByKey={flagsByKey}
                            schedulesSuspended={schedulesSuspended}
                            onMutateFlag={handleMutate}
                            onSaveSchedules={handleSaveSchedules}
                        />
                    </div>
                );
            case 'globals':
                return <MessageTemplatesPanel canWrite={canWrite} />;
            case 'audit':
                return <AuditHistoryPanel canExport={canWrite} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 min-h-0">
            <div className="shrink-0 p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50 space-y-4">
                <AdminPageHeader
                    icon={SlidersHorizontal}
                    title="Centro di Controllo"
                    subtitle="Hub operativo — feature flags, testi, soglie, programmazione e audit"
                    accent="indigo"
                    badge={
                        isReadOnlyAdmin ? (
                            <span
                                className={`${ty.badge} bg-amber-900/30 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1`}
                            >
                                <ShieldCheck className="w-3 h-3" /> Solo lettura
                            </span>
                        ) : null
                    }
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <StatCard label="Flag caricati" value={String(flags.length)} />
                    <StatCard label="Permesso" value={canWrite ? 'Scrittura' : 'Solo lettura'} />
                    <StatCard
                        label="AI Control Center"
                        value="separato"
                        icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                    />
                </div>

                <div
                    className="bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]"
                    role="tablist"
                    aria-label="Sezioni Centro di Controllo"
                >
                    <div className="flex flex-nowrap gap-1 min-w-max w-full sm:w-auto sm:min-w-full">
                        {PLATFORM_CONTROL_UI_TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    id={`platform-control-tab-${tab.id}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 min-w-[7.5rem] sm:min-w-0 sm:flex-1 px-3 py-2.5 rounded-lg flex items-center justify-center transition-all whitespace-nowrap touch-manipulation ${ty.tab} ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'hover:text-white hover:bg-slate-800/80'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-0"
                role="tabpanel"
                aria-labelledby={`platform-control-tab-${activeTab}`}
            >
                {isLoading ? (
                    <div className={`flex items-center gap-3 ${ty.helper}`}>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className={ty.pageSubtitle}>Caricamento Configuration Source…</span>
                    </div>
                ) : null}

                {error ? (
                    <div className={`rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 ${ty.error}`}>
                        Impossibile caricare i flag dal database. Fallback locale attivo.
                        <p className={`mt-2 ${ty.helper}`}>{error}</p>
                    </div>
                ) : null}

                {renderActiveTab()}
            </div>
        </div>
    );
};

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    const ty = usePlatformControlTypography();
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
            <p className={`${ty.statLabel} flex items-center gap-1.5`}>
                {icon}
                {label}
            </p>
            <p className={`${ty.statValue} mt-0.5`}>{value}</p>
        </div>
    );
}

export default PlatformControlCenter;
