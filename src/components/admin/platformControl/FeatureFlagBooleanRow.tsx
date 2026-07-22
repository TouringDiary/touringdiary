import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { evaluateFeatureFlag } from '@/domain/platformControl/evaluateFeatureFlag';
import {
    findMessageCatalogByKey,
    getFeatureFlagAdminHelp,
} from '@/constants/platformFeatureFlags';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { usePlatformControl } from '@/context/PlatformControlContext';
import type { PlatformFeatureFlagRecord } from '@/types/platformControl';
import { MessageTemplateEditor } from './MessageTemplateEditor';

interface FeatureFlagBooleanRowProps {
    flag: PlatformFeatureFlagRecord;
    canWrite: boolean;
    requiresReason?: boolean;
    schedulesSuspended?: boolean;
    /** Densità ridotta per controlli contestuali in header di sezione (stessa logica, meno chrome). */
    compact?: boolean;
    onSave: (manualOverride: boolean | null, reason?: string) => Promise<void>;
}

export const FeatureFlagBooleanRow: React.FC<FeatureFlagBooleanRowProps> = ({
    flag,
    canWrite,
    requiresReason = false,
    schedulesSuspended = false,
    compact = false,
    onSave,
}) => {
    const ty = usePlatformControlTypography();
    const { evaluationNowMs } = usePlatformControl();
    const evaluation = evaluateFeatureFlag(
        flag,
        { userRole: 'admin_all', isAuthenticated: true },
        new Date(evaluationNowMs),
        { schedulesSuspended }
    );
    const effectiveOn = evaluation.enabled;
    const [isSaving, setIsSaving] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const catalogEntry = findMessageCatalogByKey(flag.messageKey);
    const adminHelp = getFeatureFlagAdminHelp(flag.key);

    const handleToggle = async () => {
        if (!canWrite || isSaving) return;
        if (requiresReason && !reason.trim()) {
            setError('Motivazione obbligatoria per questa modifica.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await onSave(!effectiveOn, reason.trim() || undefined);
            setReason('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Salvataggio non riuscito');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearOverride = async () => {
        if (!canWrite || isSaving || flag.manualOverride === null) return;
        setIsSaving(true);
        setError(null);
        try {
            await onSave(null, reason.trim() || undefined);
            setReason('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Reset non riuscito');
        } finally {
            setIsSaving(false);
        }
    };

    if (compact) {
        return (
            <div
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    effectiveOn
                        ? 'border-amber-500/35 bg-amber-950/25'
                        : 'border-slate-700/80 bg-slate-950/40'
                }`}
            >
                <div className="min-w-0 flex-1">
                    <p className={`${ty.fieldLabel} text-slate-200 truncate`} title={flag.label}>
                        {flag.label}
                    </p>
                    {adminHelp ? (
                        <p className={`${ty.helper} mt-0.5 line-clamp-2 leading-snug`}>
                            {adminHelp}
                        </p>
                    ) : null}
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={effectiveOn}
                    aria-label={`${flag.label}: ${effectiveOn ? 'acceso' : 'spento'}`}
                    disabled={!canWrite || isSaving}
                    onClick={() => void handleToggle()}
                    className={`relative shrink-0 h-7 w-12 rounded-full transition-colors touch-manipulation disabled:opacity-50 ${
                        effectiveOn ? 'bg-amber-600' : 'bg-slate-700'
                    }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                            effectiveOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                    {isSaving ? (
                        <Loader2 className="absolute inset-0 m-auto w-3 h-3 text-white animate-spin" />
                    ) : null}
                </button>
                {error ? <p className={`${ty.error} sr-only`}>{error}</p> : null}
            </div>
        );
    }

    return (
        <article
            className={`h-full flex flex-col rounded-2xl border p-3 sm:p-4 gap-2.5 transition-colors ${
                effectiveOn
                    ? 'border-emerald-500/25 bg-slate-950/80'
                    : 'border-slate-800 bg-slate-950/50'
            }`}
        >
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1 space-y-1">
                    <h3 className={`${ty.cardTitle} leading-snug`} title={flag.label}>
                        {flag.label}
                    </h3>
                    <p className={`${ty.cardDescription} whitespace-pre-line`}>
                        {adminHelp}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={effectiveOn}
                    aria-label={`${flag.label}: ${effectiveOn ? 'acceso' : 'spento'}`}
                    disabled={!canWrite || isSaving}
                    onClick={() => void handleToggle()}
                    className={`relative shrink-0 h-8 w-14 rounded-full transition-colors touch-manipulation disabled:opacity-50 ${
                        effectiveOn ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                >
                    <span
                        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                            effectiveOn ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                    {isSaving ? (
                        <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-white animate-spin" />
                    ) : null}
                </button>
            </div>

            <div className="flex items-center justify-between gap-2">
                {canWrite && flag.manualOverride !== null ? (
                    <button
                        type="button"
                        onClick={() => void handleClearOverride()}
                        disabled={isSaving}
                        className={`${ty.actionLink} hover:text-white disabled:opacity-50 px-1 py-1`}
                    >
                        Default
                    </button>
                ) : (
                    <span className={`${ty.helper} truncate`} title={flag.key}>
                        {evaluation.source}
                        {flag.manualOverride !== null ? ' · override' : ''}
                        {schedulesSuspended && evaluation.source !== 'manual_override'
                            ? ' · schedule in pausa'
                            : ''}
                    </span>
                )}
            </div>

            {canWrite && requiresReason ? (
                <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivazione (obbligatoria)"
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 placeholder:text-slate-600 ${ty.input}`}
                />
            ) : null}

            {catalogEntry ? (
                <MessageTemplateEditor
                    catalogEntry={catalogEntry}
                    canWrite={canWrite}
                    compact
                />
            ) : null}

            <p className={`${ty.monoKey} truncate`} title={flag.key}>
                {flag.key}
            </p>

            {error ? <p className={ty.error}>{error}</p> : null}
        </article>
    );
};
