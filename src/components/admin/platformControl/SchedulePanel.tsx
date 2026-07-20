import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Loader2, Plus, Trash2 } from 'lucide-react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { AdminSectionCard } from '@/components/admin/common/AdminSectionCard';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import type {
    PlatformFeatureFlagRecord,
    PlatformFlagSchedule,
} from '@/types/platformControl';
import { resolveScheduleRowStatus } from '@/domain/platformControl/scheduleRowStatus';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';

interface SchedulePanelProps {
    canWrite: boolean;
    flags: PlatformFeatureFlagRecord[];
    flagsByKey: Map<string, PlatformFeatureFlagRecord>;
    schedulesSuspended: boolean;
    onMutateFlag: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
    onSaveSchedules: (key: string, schedules: PlatformFlagSchedule[]) => Promise<void>;
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(local: string): string | null {
    if (!local.trim()) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function newScheduleId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
    canWrite,
    flags,
    flagsByKey,
    schedulesSuspended,
    onMutateFlag,
    onSaveSchedules,
}) => {
    const ty = usePlatformControlTypography();
    const { evaluationNowMs } = usePlatformControl();
    const pauseFlag = flagsByKey.get(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED);
    const evaluationNow = new Date(evaluationNowMs);

    const schedulableFlags = useMemo(
        () => flags.filter((f) => f.supportsSchedule && f.key !== PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED),
        [flags]
    );

    const [selectedKey, setSelectedKey] = useState<string>(
        () => schedulableFlags[0]?.key ?? ''
    );
    const selected = flagsByKey.get(selectedKey) ?? schedulableFlags[0];
    const [drafts, setDrafts] = useState<PlatformFlagSchedule[]>(() =>
        (selected?.schedules ?? []).map((s) => ({ ...s }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const SAVED_FEEDBACK_MS = 2500;

    useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    const updateDrafts = (
        updater: (prev: PlatformFlagSchedule[]) => PlatformFlagSchedule[]
    ) => {
        setDrafts(updater);
        setSaved(false);
        setError(null);
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
            savedTimerRef.current = null;
        }
    };

    const patchDraft = (index: number, patch: Partial<PlatformFlagSchedule>) => {
        updateDrafts((prev) => {
            const next = [...prev];
            const current = next[index];
            if (!current) return prev;
            next[index] = { ...current, ...patch };
            return next;
        });
    };

    useEffect(() => {
        if (selected) {
            // Copia indipendente: niente condivisione di riferimento con lo stato sorgente.
            setDrafts(selected.schedules.map((s) => ({ ...s })));
            setError(null);
            setSaved(false);
        }
    }, [selected?.key, selected?.updatedAt]);

    useEffect(() => {
        if (!selectedKey && schedulableFlags[0]) {
            setSelectedKey(schedulableFlags[0].key);
        }
    }, [selectedKey, schedulableFlags]);

    const handleAddWindow = () => {
        if (!selected || selected.valueType !== 'boolean') return;
        const start = new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        updateDrafts((prev) => [
            ...prev,
            {
                id: newScheduleId(),
                startsAt: start.toISOString(),
                endsAt: end.toISOString(),
                value: false,
            },
        ]);
    };

    const showSavedFeedback = () => {
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
            setSaved(false);
            savedTimerRef.current = null;
        }, SAVED_FEEDBACK_MS);
    };

    const handleSave = async () => {
        if (!canWrite || !selected || isSaving) return;
        for (const s of drafts) {
            const a = Date.parse(s.startsAt);
            const b = Date.parse(s.endsAt);
            if (Number.isNaN(a) || Number.isNaN(b) || !(a < b)) {
                setError('Ogni finestra deve avere inizio precedente alla fine.');
                return;
            }
        }
        setIsSaving(true);
        setError(null);
        setSaved(false);
        try {
            await onSaveSchedules(selected.key, drafts);
            showSavedFeedback();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Salvataggio programmazioni fallito');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivateAll = async () => {
        if (!canWrite || !selected || isSaving) return;
        updateDrafts(() => []);
        setIsSaving(true);
        setError(null);
        try {
            await onSaveSchedules(selected.key, []);
            showSavedFeedback();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Disattivazione fallita');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSectionCard
            icon={CalendarClock}
            title="Programmazione automatica"
            subtitle="Imposta finestre orarie per attivare o sospendere automaticamente gli interruttori. Le finestre restano salvate anche se le programmazioni sono in pausa."
        >
            <div className="space-y-4">
                {pauseFlag ? (
                    <div className="max-w-xl">
                        <FeatureFlagBooleanRow
                            flag={pauseFlag}
                            canWrite={canWrite}
                            schedulesSuspended={false}
                            onSave={(manualOverride, reason) =>
                                onMutateFlag(
                                    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED,
                                    manualOverride,
                                    reason
                                )
                            }
                        />
                        <p className={`${ty.sectionSubtitle} mt-2`}>
                            {schedulesSuspended
                                ? 'Le finestre restano salvate ma non vengono applicate finché la pausa è attiva.'
                                : 'Attiva la pausa per sospendere tutte le programmazioni senza cancellarle.'}
                        </p>
                    </div>
                ) : (
                    <p className={ty.error}>
                        Flag pausa programmazioni non in cache — applicare migration Fase 3.4.
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <label className={`${ty.fieldLabel} shrink-0`}>
                        Feature Flag
                    </label>
                    <select
                        value={selected?.key ?? ''}
                        onChange={(e) => setSelectedKey(e.target.value)}
                        className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 ${ty.input}`}
                    >
                        {schedulableFlags.map((f) => (
                            <option key={f.key} value={f.key}>
                                {f.label} ({f.schedules.length} finestre)
                            </option>
                        ))}
                    </select>
                </div>

                {selected ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={ty.cardTitle}>{selected.label}</p>
                            <p className={ty.monoKey}>{selected.key}</p>
                        </div>

                        {drafts.length === 0 ? (
                            <p className={ty.sectionSubtitle}>
                                Nessuna finestra programmata. Il flag usa override manuale o default.
                            </p>
                        ) : null}

                        {drafts.map((sched, index) => {
                            const rowStatus = resolveScheduleRowStatus(sched, evaluationNow, {
                                schedulesSuspended,
                            });
                            const statusClass =
                                rowStatus === 'Attiva'
                                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                                    : rowStatus === 'Programmata'
                                      ? 'text-sky-300 bg-sky-950/40 border-sky-500/30'
                                      : rowStatus === 'In pausa'
                                        ? 'text-amber-200 bg-amber-950/30 border-amber-500/30'
                                        : rowStatus === 'Errore'
                                          ? 'text-rose-300 bg-rose-950/40 border-rose-500/30'
                                          : rowStatus === 'Terminata'
                                            ? 'text-slate-400 bg-slate-900 border-slate-700'
                                            : 'text-slate-400 bg-slate-900 border-slate-700';

                            return (
                            <div
                                key={sched.id}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end border border-slate-800 rounded-xl p-2.5"
                            >
                                <label className="space-y-1">
                                    <span className={ty.fieldLabel}>Inizio</span>
                                    <input
                                        type="datetime-local"
                                        value={toLocalInputValue(sched.startsAt)}
                                        disabled={!canWrite || isSaving}
                                        onChange={(e) => {
                                            const iso = fromLocalInputValue(e.target.value);
                                            if (iso === null) return;
                                            patchDraft(index, { startsAt: iso });
                                        }}
                                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className={ty.fieldLabel}>Fine</span>
                                    <input
                                        type="datetime-local"
                                        value={toLocalInputValue(sched.endsAt)}
                                        disabled={!canWrite || isSaving}
                                        onChange={(e) => {
                                            const iso = fromLocalInputValue(e.target.value);
                                            if (iso === null) return;
                                            patchDraft(index, { endsAt: iso });
                                        }}
                                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                    />
                                </label>
                                {selected.valueType === 'boolean' ? (
                                    <label className="space-y-1">
                                        <span className={ty.fieldLabel}>Valore</span>
                                        <select
                                            value={sched.value === true ? 'on' : 'off'}
                                            disabled={!canWrite || isSaving}
                                            onChange={(e) => {
                                                patchDraft(index, {
                                                    value: e.target.value === 'on',
                                                });
                                            }}
                                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                        >
                                            <option value="off">OFF</option>
                                            <option value="on">ON</option>
                                        </select>
                                    </label>
                                ) : (
                                    <label className="space-y-1">
                                        <span className={ty.fieldLabel}>Valore</span>
                                        <input
                                            type="number"
                                            value={typeof sched.value === 'number' ? sched.value : 0}
                                            disabled={!canWrite || isSaving}
                                            onChange={(e) => {
                                                patchDraft(index, {
                                                    value: Number(e.target.value),
                                                });
                                            }}
                                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                        />
                                    </label>
                                )}
                                <div className="space-y-1">
                                    <span className={ty.fieldLabel}>Stato</span>
                                    <span
                                        className={`inline-flex items-center px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
                                        title="Stato runtime della finestra (aggiornato automaticamente)"
                                    >
                                        {rowStatus}
                                    </span>
                                </div>
                                {canWrite ? (
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => {
                                            updateDrafts((prev) =>
                                                prev.filter((s) => s.id !== sched.id)
                                            );
                                        }}
                                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 disabled:opacity-50"
                                        aria-label="Elimina finestra"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <span />
                                )}
                            </div>
                            );
                        })}

                        {canWrite ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleAddWindow}
                                    disabled={isSaving}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:text-white disabled:opacity-50 ${ty.btnSecondary}`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Aggiungi finestra
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSave()}
                                    disabled={isSaving}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 ${ty.btnPrimary}`}
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                    Salva programmazioni
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeactivateAll()}
                                    disabled={isSaving || drafts.length === 0}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-950/30 disabled:opacity-50 ${ty.btnSecondary}`}
                                >
                                    Disattiva programmazioni
                                </button>
                            </div>
                        ) : null}

                        {saved ? (
                            <p className={ty.success}>Programmazioni salvate</p>
                        ) : null}
                        {error ? <p className={ty.error}>{error}</p> : null}
                        {/* Sovrapposizioni: prima in lista — regola di dominio in evaluateFeatureFlag / DOC 30 */}
                        <p className={ty.sectionSubtitle}>
                            In caso di finestre sovrapposte, viene applicata la prima nella lista.
                            «Disattiva programmazioni» svuota le finestre di questo flag (irreversibile
                            finché non se ne creano di nuove). La pausa globale le mantiene salvate.
                        </p>
                    </div>
                ) : null}
            </div>
        </AdminSectionCard>
    );
};
