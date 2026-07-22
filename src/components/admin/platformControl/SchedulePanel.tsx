import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, HelpCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { AdminSectionCard } from '@/components/admin/common/AdminSectionCard';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import type {
    PlatformFeatureFlagRecord,
    PlatformFlagSchedule,
} from '@/types/platformControl';
import {
    compareScheduleRowsByStatus,
    resolveScheduleRowStatus,
} from '@/domain/platformControl/scheduleRowStatus';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { FeatureFlagBooleanRow } from './FeatureFlagBooleanRow';

const SELECTED_KEY_STORAGE = 'platform-control.schedule.selectedKey';

const FERMO_PROGRAMMATO_HELP =
    'Questo controllo abilita o disabilita la programmazione, non la funzionalità.\n\n' +
    'ON\n' +
    'La programmazione verrà eseguita.\n' +
    'All’orario previsto la funzionalità sarà temporaneamente fermata.\n\n' +
    'OFF\n' +
    'La programmazione rimane salvata ma viene ignorata.\n' +
    'Non verrà eseguita finché non la riattivi.';

/** Label + info — tooltip via AnchoredPopover (hover/focus desktop, tap touch). */
const FermoProgrammatoLabel: React.FC<{ className: string }> = ({ className }) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const openHelp = () => {
        clearCloseTimer();
        setOpen(true);
    };

    const scheduleClose = () => {
        clearCloseTimer();
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    };

    useEffect(() => () => clearCloseTimer(), []);

    return (
        <span className="inline-flex items-center gap-1 min-w-0">
            <span className={className}>Fermo programmato</span>
            <button
                ref={anchorRef}
                type="button"
                className="shrink-0 rounded-full text-slate-400 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 p-0.5"
                aria-label={FERMO_PROGRAMMATO_HELP}
                aria-expanded={open}
                aria-controls="schedule-fermo-programmato-help-popover"
                onClick={() => setOpen((v) => !v)}
                onMouseEnter={openHelp}
                onMouseLeave={scheduleClose}
                onFocus={openHelp}
                onBlur={scheduleClose}
            >
                <HelpCircle className="w-3.5 h-3.5" aria-hidden />
            </button>
            <AnchoredPopover
                isOpen={open}
                onClose={() => setOpen(false)}
                anchorRef={anchorRef}
                align="center"
                role="tooltip"
                className="max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-[11px] leading-relaxed text-slate-200 shadow-xl whitespace-pre-line"
                onMouseEnter={openHelp}
                onMouseLeave={scheduleClose}
            >
                <p id="schedule-fermo-programmato-help-popover">{FERMO_PROGRAMMATO_HELP}</p>
            </AnchoredPopover>
        </span>
    );
};

interface SchedulePanelProps {
    canWrite: boolean;
    flags: PlatformFeatureFlagRecord[];
    flagsByKey: Map<string, PlatformFeatureFlagRecord>;
    schedulesSuspended: boolean;
    onMutateFlag: (key: string, manualOverride: boolean | number | null, reason?: string) => Promise<void>;
    onSaveSchedules: (
        key: string,
        schedules: PlatformFlagSchedule[],
        reason?: string
    ) => Promise<void>;
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

function readStoredSelectedKey(): string {
    try {
        return sessionStorage.getItem(SELECTED_KEY_STORAGE) ?? '';
    } catch {
        return '';
    }
}

function writeStoredSelectedKey(key: string) {
    try {
        if (key) sessionStorage.setItem(SELECTED_KEY_STORAGE, key);
    } catch {
        /* ignore quota / private mode */
    }
}

function pickInitialSelectedKey(schedulable: PlatformFeatureFlagRecord[]): string {
    const stored = readStoredSelectedKey();
    if (stored && schedulable.some((f) => f.key === stored)) return stored;
    const withWindows = schedulable.find((f) => f.schedules.length > 0);
    return withWindows?.key ?? schedulable[0]?.key ?? '';
}

/** Normalizza bozza: programmazione ON/OFF → enabled; fermo boolean → value sempre false. */
function toPersistedSchedule(
    schedule: PlatformFlagSchedule,
    valueType: 'boolean' | 'number'
): PlatformFlagSchedule {
    const enabled = schedule.enabled !== false;
    if (valueType === 'boolean') {
        return {
            id: schedule.id,
            startsAt: schedule.startsAt,
            endsAt: schedule.endsAt,
            value: false,
            enabled,
        };
    }
    return {
        id: schedule.id,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        value: schedule.value,
        enabled,
    };
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
    const { evaluationNowMs, evaluateFlag } = usePlatformControl();
    const evaluationNow = new Date(evaluationNowMs);
    const pauseFlag = flagsByKey.get(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED);

    const schedulableFlags = useMemo(
        () =>
            flags.filter(
                (f) =>
                    f.supportsSchedule &&
                    f.key !== PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED
            ),
        [flags]
    );

    const [selectedKey, setSelectedKey] = useState<string>(() =>
        pickInitialSelectedKey(schedulableFlags)
    );
    const selected = flagsByKey.get(selectedKey) ?? schedulableFlags[0];
    const [drafts, setDrafts] = useState<PlatformFlagSchedule[]>(() =>
        (selected?.schedules ?? []).map((s) => ({ ...s }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [saveReason, setSaveReason] = useState('');
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const SAVED_FEEDBACK_MS = 2500;
    const TOAST_MS = 2800;

    useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const selectFlag = (key: string) => {
        setSelectedKey(key);
        writeStoredSelectedKey(key);
    };

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

    const patchDraftById = (scheduleId: string, patch: Partial<PlatformFlagSchedule>) => {
        updateDrafts((prev) => {
            const next = [...prev];
            const index = next.findIndex((s) => s.id === scheduleId);
            if (index < 0) return prev;
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    useEffect(() => {
        if (selected) {
            setDrafts(selected.schedules.map((s) => ({ ...s })));
            setError(null);
            setSaved(false);
            writeStoredSelectedKey(selected.key);
        }
    }, [selected?.key, selected?.updatedAt]);

    useEffect(() => {
        if (!schedulableFlags.length) return;
        const stillValid = schedulableFlags.some((f) => f.key === selectedKey);
        if (!selectedKey || !stillValid) {
            const next = pickInitialSelectedKey(schedulableFlags);
            setSelectedKey(next);
            writeStoredSelectedKey(next);
        }
    }, [selectedKey, schedulableFlags]);

    const displayedDrafts = useMemo(() => {
        return [...drafts].sort((a, b) =>
            compareScheduleRowsByStatus(a, b, evaluationNow, { schedulesSuspended })
        );
    }, [drafts, evaluationNow, schedulesSuspended]);

    const isDraftDirty = useMemo(() => {
        if (!selected) return false;
        return JSON.stringify(drafts) !== JSON.stringify(selected.schedules);
    }, [drafts, selected]);

    const flagRuntime = selected
        ? evaluateFlag(selected.key, { userRole: 'admin_all', isAuthenticated: true })
        : null;
    const hasManualOverride =
        selected?.manualOverride !== null && selected?.manualOverride !== undefined;

    const showSavedFeedback = () => {
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
            setSaved(false);
            savedTimerRef.current = null;
        }, SAVED_FEEDBACK_MS);
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, TOAST_MS);
    };

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
                enabled: true,
            },
        ]);
    };

    const persistSchedules = async (next: PlatformFlagSchedule[]) => {
        if (!selected) return;
        const normalized = next.map((s) => toPersistedSchedule(s, selected.valueType));
        const reason = saveReason.trim() || undefined;
        await onSaveSchedules(selected.key, normalized, reason);
        setDrafts(normalized);
        setSaveReason('');
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
            await persistSchedules(drafts);
            showSavedFeedback();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Salvataggio programmazioni fallito');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWindow = async (scheduleId: string) => {
        if (!canWrite || !selected || isSaving) return;
        const next = drafts.filter((s) => s.id !== scheduleId);
        setIsSaving(true);
        setError(null);
        setSaved(false);
        try {
            await persistSchedules(next);
            showToast('Finestra eliminata e salvata');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Eliminazione finestra fallita');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivateAll = async () => {
        if (!canWrite || !selected || isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await persistSchedules([]);
            showSavedFeedback();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Disattivazione fallita');
        } finally {
            setIsSaving(false);
        }
    };

    const pauseAside = pauseFlag ? (
        <FeatureFlagBooleanRow
            flag={pauseFlag}
            canWrite={canWrite}
            compact
            schedulesSuspended={false}
            onSave={(manualOverride, reason) =>
                onMutateFlag(
                    PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED,
                    manualOverride,
                    reason
                )
            }
        />
    ) : (
        <p className={ty.error}>Flag pausa programmazioni non in cache.</p>
    );

    return (
        <AdminSectionCard
            icon={CalendarClock}
            title="Programmazione automatica"
            subtitle="Programma i fermi temporanei delle funzionalità. Le finestre salvate restano sempre visibili; spariscono solo se eliminate."
            headerAside={pauseAside}
        >
            {toastMessage ? (
                <div
                    role="status"
                    className="fixed bottom-4 right-4 z-50 rounded-xl border border-emerald-500/40 bg-emerald-950/95 px-4 py-2.5 text-sm font-medium text-emerald-100 shadow-lg"
                >
                    {toastMessage}
                </div>
            ) : null}

            <div className="space-y-4">
                {schedulesSuspended ? (
                    <p
                        className={`${ty.helper} rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-amber-100`}
                    >
                        Programmazioni in pausa: le finestre restano salvate e visibili ma non
                        vengono applicate.
                    </p>
                ) : null}

                {selected && isDraftDirty ? (
                    <p
                        className={`${ty.helper} rounded-xl border border-sky-500/30 bg-sky-950/20 px-3 py-2 text-sky-100`}
                    >
                        Modifiche non salvate: l’app usa ancora l’ultima versione salvata. Clicca
                        «Salva programmazioni» per applicarle.
                    </p>
                ) : null}

                {selected && !hasManualOverride && !schedulesSuspended && flagRuntime ? (
                    <p className={ty.sectionSubtitle}>
                        Stato attuale:{' '}
                        <span className="text-slate-200 font-semibold">
                            {flagRuntime.enabled ? 'disponibile' : 'fermata'}
                        </span>
                        {flagRuntime.source === 'schedule' ? ' · da programmazione' : null}
                        {flagRuntime.source === 'default' ? ' · impostazione predefinita' : null}
                        {flagRuntime.source === 'manual_override' ? ' · interruttore manuale' : null}
                    </p>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <label className={`${ty.fieldLabel} shrink-0`}>Funzionalità</label>
                    <select
                        value={selected?.key ?? ''}
                        onChange={(e) => selectFlag(e.target.value)}
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
                        </div>

                        {drafts.length === 0 ? (
                            <p className={ty.sectionSubtitle}>
                                Nessuna programmazione salvata per questa funzionalità.
                            </p>
                        ) : null}

                        {displayedDrafts.map((sched) => {
                            const rowStatus = resolveScheduleRowStatus(sched, evaluationNow, {
                                schedulesSuspended,
                            });
                            const isJobOn = sched.enabled !== false;
                            const showManualBlockHint =
                                hasManualOverride &&
                                (rowStatus === 'In attesa' || rowStatus === 'Attiva');
                            const statusClass =
                                rowStatus === 'Attiva'
                                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                                    : rowStatus === 'In attesa'
                                      ? 'text-sky-300 bg-sky-950/40 border-sky-500/30'
                                      : rowStatus === 'In pausa'
                                        ? 'text-amber-200 bg-amber-950/30 border-amber-500/30'
                                        : rowStatus === 'Errore'
                                          ? 'text-rose-300 bg-rose-950/40 border-rose-500/30'
                                          : rowStatus === 'Disabilitata'
                                            ? 'text-slate-500 bg-slate-900 border-slate-700'
                                            : 'text-slate-400 bg-slate-900 border-slate-700';

                            return (
                                <div key={sched.id} className="space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end border border-slate-800 rounded-xl p-2.5">
                                    <label className="space-y-1">
                                        <span className={ty.fieldLabel}>Inizio</span>
                                        <input
                                            type="datetime-local"
                                            value={toLocalInputValue(sched.startsAt)}
                                            disabled={!canWrite || isSaving}
                                            onChange={(e) => {
                                                const iso = fromLocalInputValue(e.target.value);
                                                if (iso === null) return;
                                                patchDraftById(sched.id, { startsAt: iso });
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
                                                patchDraftById(sched.id, { endsAt: iso });
                                            }}
                                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                        />
                                    </label>
                                    <div className="space-y-1">
                                        <label className="space-y-1 block">
                                            <FermoProgrammatoLabel className={ty.fieldLabel} />
                                            <select
                                                value={isJobOn ? 'on' : 'off'}
                                                disabled={!canWrite || isSaving}
                                                onChange={(e) => {
                                                    const on = e.target.value === 'on';
                                                    patchDraftById(sched.id, {
                                                        enabled: on,
                                                        ...(selected.valueType === 'boolean'
                                                            ? { value: false }
                                                            : {}),
                                                    });
                                                }}
                                                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                                            >
                                                <option value="on">ON</option>
                                                <option value="off">OFF</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="space-y-1">
                                        <span className={ty.fieldLabel}>Stato</span>
                                        <span
                                            className={`inline-flex items-center px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
                                            title="Stato della programmazione (aggiornato automaticamente)"
                                        >
                                            {rowStatus}
                                        </span>
                                    </div>
                                    {canWrite ? (
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => {
                                                void handleDeleteWindow(sched.id);
                                            }}
                                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 disabled:opacity-50"
                                            aria-label="Elimina programmazione"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <span />
                                    )}
                                    </div>
                                    {showManualBlockHint ? (
                                        <p
                                            className={`${ty.helper} rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-2 text-amber-100`}
                                            role="status"
                                        >
                                            ⚠️ «{selected.label}» è attualmente impostata su
                                            controllo manuale.
                                            <br />
                                            Per questo motivo questa programmazione automatica non
                                            verrà eseguita finché il controllo manuale non verrà
                                            rimosso.
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}

                        {canWrite ? (
                            <div className="space-y-2 pt-1">
                                <label className="block space-y-1 max-w-xl">
                                    <span className={ty.fieldLabel}>
                                        Motivo (facoltativo, consigliato)
                                    </span>
                                    <input
                                        type="text"
                                        value={saveReason}
                                        onChange={(e) => setSaveReason(e.target.value)}
                                        placeholder="Es. Fermo Upload foto per manutenzione serale"
                                        disabled={isSaving}
                                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 placeholder:text-slate-600 disabled:opacity-50 ${ty.input}`}
                                    />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddWindow}
                                    disabled={isSaving || selected.valueType !== 'boolean'}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:text-white disabled:opacity-50 ${ty.btnSecondary}`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Aggiungi programmazione
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSave()}
                                    disabled={isSaving}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 ${ty.btnPrimary}`}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : null}
                                    Salva programmazioni
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeactivateAll()}
                                    disabled={isSaving || drafts.length === 0}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-950/30 disabled:opacity-50 ${ty.btnSecondary}`}
                                >
                                    Elimina tutte
                                </button>
                                </div>
                            </div>
                        ) : null}

                        {saved ? (
                            <p className={ty.success}>Programmazioni salvate</p>
                        ) : null}
                        {error ? <p className={ty.error}>{error}</p> : null}
                        <p className={ty.sectionSubtitle}>
                            Le programmazioni In attesa e Attive restano in elenco finché non le
                            elimini. OFF = salvata ma non eseguita. In caso di finestre sovrapposte
                            vale l’ordine salvato (non l’ordine a schermo).
                        </p>
                    </div>
                ) : null}
            </div>
        </AdminSectionCard>
    );
};
