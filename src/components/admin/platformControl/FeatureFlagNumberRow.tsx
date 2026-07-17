import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { evaluateFeatureFlag } from '@/domain/platformControl/evaluateFeatureFlag';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import type { PlatformFeatureFlagRecord } from '@/types/platformControl';

interface FeatureFlagNumberRowProps {
    flag: PlatformFeatureFlagRecord;
    canWrite: boolean;
    schedulesSuspended?: boolean;
    onSave: (manualOverride: number | null) => Promise<void>;
}

export const FeatureFlagNumberRow: React.FC<FeatureFlagNumberRowProps> = ({
    flag,
    canWrite,
    schedulesSuspended = false,
    onSave,
}) => {
    const ty = usePlatformControlTypography();
    const evaluation = evaluateFeatureFlag(
        flag,
        { userRole: 'admin_all', isAuthenticated: true },
        new Date(),
        { schedulesSuspended }
    );
    const current =
        typeof evaluation.effectiveValue === 'number' ? evaluation.effectiveValue : Number(flag.defaultValue);

    const [draft, setDraft] = useState(String(current));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setDraft(String(current));
    }, [current]);

    const handleSave = async () => {
        if (!canWrite || isSaving) return;
        const parsed = Number(draft);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
            setError('Inserire un numero tra 0 e 5.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await onSave(parsed);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Salvataggio non riuscito');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        if (!canWrite || isSaving || flag.manualOverride === null) return;
        setIsSaving(true);
        setError(null);
        try {
            await onSave(null);
            setDraft(String(flag.defaultValue));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Reset non riuscito');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <article className="h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/50 p-3 sm:p-4 gap-2.5">
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1 space-y-1">
                    <h3 className={`${ty.cardTitle} leading-snug`} title={flag.label}>
                        {flag.label}
                    </h3>
                    <p className={ty.cardDescription}>Soglia operativa (stelle)</p>
                </div>
                <span className={`${ty.valueEmphasis} shrink-0 tabular-nums`}>
                    {current}★
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-auto">
                <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={draft}
                    disabled={!canWrite || isSaving}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label={flag.label}
                    className={`w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 disabled:opacity-50 ${ty.input}`}
                />
                {canWrite ? (
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className={`px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5 touch-manipulation ${ty.btnPrimary}`}
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salva'}
                    </button>
                ) : null}
                {canWrite && flag.manualOverride !== null ? (
                    <button
                        type="button"
                        onClick={() => void handleClear()}
                        disabled={isSaving}
                        className={`${ty.actionLink} hover:text-white disabled:opacity-50`}
                    >
                        Default
                    </button>
                ) : null}
            </div>

            <p className={`${ty.monoKey} truncate`} title={flag.key}>
                {flag.key} · {evaluation.source}
            </p>

            {error ? <p className={ty.error}>{error}</p> : null}
        </article>
    );
};
