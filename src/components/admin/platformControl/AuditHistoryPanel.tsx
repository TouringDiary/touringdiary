import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { getPlatformControlService } from '@/services/platformControl/platformControlService';
import { supabase } from '@/services/supabaseClient';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { PlatformControlAuditEvent } from '@/types/platformControl';
import {
    resolveAuditActionLabel,
    resolveAuditConfigLabel,
} from '@/domain/platformControl/auditPresentation';

interface AuditHistoryPanelProps {
    /** admin_all: export + eliminazione; admin_limited: sola lettura */
    canWrite: boolean;
}

type PendingDelete =
    | { kind: 'single'; event: PlatformControlAuditEvent }
    | { kind: 'clear' }
    | null;

function csvEscape(value: unknown): string {
    const raw = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
}

async function loadActorNames(actorIds: string[]): Promise<Record<string, string>> {
    const unique = [...new Set(actorIds.filter(Boolean))];
    if (unique.length === 0) return {};

    const { data, error } = await supabase.from('profiles').select('id, name').in('id', unique);

    if (error) {
        console.error('[AuditHistory] profiles lookup failed:', error.message);
        return {};
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
        const name = row.name?.trim();
        if (row.id && name) map[row.id] = name;
    }
    return map;
}

/** Contenuto Storico Audit — banner TAB gestito dal Centro di Controllo. */
export const AuditHistoryPanel: React.FC<AuditHistoryPanelProps> = ({ canWrite }) => {
    const ty = usePlatformControlTypography();
    const { getFlagDefinition } = usePlatformControl();

    const [events, setEvents] = useState<PlatformControlAuditEvent[]>([]);
    const [actorNames, setActorNames] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterKey, setFilterKey] = useState('');
    const [limit, setLimit] = useState(50);
    const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [clearAck, setClearAck] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const resolveLabel = useCallback(
        (configKey: string) =>
            resolveAuditConfigLabel(configKey, (key) => getFlagDefinition(key)?.label),
        [getFlagDefinition]
    );

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const rows = await getPlatformControlService().fetchAuditEvents(limit);
            setEvents(rows);
            const names = await loadActorNames(
                rows.map((r) => r.actorId).filter((id): id is string => Boolean(id))
            );
            setActorNames(names);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Caricamento audit fallito');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = filterKey.trim().toLowerCase();
        if (!q) return events;
        return events.filter((e) => {
            const label = resolveLabel(e.configKey).toLowerCase();
            return (
                e.configKey.toLowerCase().includes(q) ||
                label.includes(q) ||
                resolveAuditActionLabel(e).toLowerCase().includes(q)
            );
        });
    }, [events, filterKey, resolveLabel]);

    const closeDeleteModal = () => {
        if (isDeleting) return;
        setPendingDelete(null);
        setClearAck(false);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setIsDeleting(true);
        setError(null);
        setStatusMessage(null);
        const action = pendingDelete;
        try {
            const service = getPlatformControlService();
            if (action.kind === 'single') {
                const ok = await service.deleteAuditEvent(action.event.id);
                if (!ok) {
                    throw new Error('Voce audit non trovata o già eliminata');
                }
                setStatusMessage('Voce audit eliminata');
            } else {
                const deleted = await service.clearAudit();
                setStatusMessage(
                    deleted === 0
                        ? 'Storico già vuoto'
                        : `Storico svuotato (${deleted} ${deleted === 1 ? 'voce' : 'voci'})`
                );
            }
            setPendingDelete(null);
            setClearAck(false);
            await load();
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Eliminazione audit fallita. Riprova o contatta lo sviluppatore.'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = () => {
        const header = [
            'created_at',
            'config_label',
            'config_key',
            'action_label',
            'action',
            'actor_name',
            'actor_id',
            'reason',
            'value_before',
            'value_after',
        ];
        const lines = [
            header.join(','),
            ...filtered.map((e) =>
                [
                    csvEscape(e.createdAt),
                    csvEscape(resolveLabel(e.configKey)),
                    csvEscape(e.configKey),
                    csvEscape(resolveAuditActionLabel(e)),
                    csvEscape(e.action),
                    csvEscape(e.actorId ? actorNames[e.actorId] ?? '' : ''),
                    csvEscape(e.actorId),
                    csvEscape(e.reason),
                    csvEscape(JSON.stringify(e.valueBefore)),
                    csvEscape(JSON.stringify(e.valueAfter)),
                ].join(',')
            ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-control-audit-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
                <input
                    type="search"
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                    placeholder="Filtra per nome o chiave…"
                    className={`flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 ${ty.input}`}
                />
                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className={`bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 ${ty.input}`}
                >
                    <option value={50}>Ultimi 50</option>
                    <option value={100}>Ultimi 100</option>
                    <option value={200}>Ultimi 200</option>
                </select>
                <button
                    type="button"
                    onClick={() => void load()}
                    className={`px-2.5 py-1.5 rounded-lg border border-slate-700 hover:text-white ${ty.btnSecondary}`}
                >
                    Aggiorna
                </button>
                {canWrite ? (
                    <>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={filtered.length === 0}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 ${ty.btnPrimary}`}
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setClearAck(false);
                                setPendingDelete({ kind: 'clear' });
                            }}
                            disabled={events.length === 0 || isDeleting}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-700/60 text-red-300 hover:bg-red-950/40 disabled:opacity-50 ${ty.btnSecondary}`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Svuota Storico
                        </button>
                    </>
                ) : null}
            </div>

            {isLoading ? (
                <div className={`flex items-center gap-2 py-4 ${ty.helper}`}>
                    <Loader2 className="w-4 h-4 animate-spin" /> Caricamento storico…
                </div>
            ) : null}

            {error ? <p className={ty.error}>{error}</p> : null}
            {statusMessage ? <p className={ty.helper}>{statusMessage}</p> : null}

            {!isLoading && filtered.length === 0 ? (
                <p className={ty.sectionSubtitle}>Nessun evento audit da mostrare.</p>
            ) : null}

            {filtered.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left min-w-[760px]">
                        <thead className="bg-slate-900/80 border-b border-slate-800">
                            <tr>
                                <th className={`p-2 ${ty.tableHead}`}>Data</th>
                                <th className={`p-2 ${ty.tableHead}`}>Funzionalità</th>
                                <th className={`p-2 ${ty.tableHead}`}>Azione</th>
                                <th className={`p-2 ${ty.tableHead}`}>Autore</th>
                                <th className={`p-2 ${ty.tableHead}`}>Motivo</th>
                                {canWrite ? (
                                    <th className={`p-2 w-12 ${ty.tableHead}`}>
                                        <span className="sr-only">Elimina</span>
                                    </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((event) => {
                                const label = resolveLabel(event.configKey);
                                const actionLabel = resolveAuditActionLabel(event);
                                const actorName = event.actorId
                                    ? actorNames[event.actorId]
                                    : undefined;
                                return (
                                    <tr key={event.id} className="border-b border-slate-800/80">
                                        <td className={`p-2 whitespace-nowrap ${ty.tableCell}`}>
                                            {new Date(event.createdAt).toLocaleString()}
                                        </td>
                                        <td className={`p-2 ${ty.tableCell}`}>
                                            <span title={event.configKey}>{label}</span>
                                        </td>
                                        <td className={`p-2 ${ty.tableCell}`} title={event.action}>
                                            {actionLabel}
                                        </td>
                                        <td className={`p-2 ${ty.tableCell}`}>
                                            {actorName ? (
                                                <span title={event.actorId ?? undefined}>
                                                    {actorName}
                                                </span>
                                            ) : event.actorId ? (
                                                <span
                                                    className={ty.helper}
                                                    title={event.actorId}
                                                >
                                                    Utente non disponibile
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className={`p-2 ${ty.tableCell}`}>
                                            {event.reason || '—'}
                                        </td>
                                        {canWrite ? (
                                            <td className="p-2">
                                                <button
                                                    type="button"
                                                    title="Elimina voce"
                                                    aria-label="Elimina voce audit"
                                                    disabled={isDeleting}
                                                    onClick={() =>
                                                        setPendingDelete({ kind: 'single', event })
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        ) : null}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : null}

            <DeleteConfirmationModal
                isOpen={pendingDelete?.kind === 'single'}
                onClose={closeDeleteModal}
                onConfirm={() => void handleConfirmDelete()}
                isDeleting={isDeleting}
                variant="danger"
                title="Eliminare questa voce?"
                message={
                    pendingDelete?.kind === 'single'
                        ? `Stai per eliminare definitivamente la voce audit di «${resolveLabel(pendingDelete.event.configKey)}» (${resolveAuditActionLabel(pendingDelete.event)}).\n\nL’operazione non può essere annullata.`
                        : ''
                }
                confirmLabel="Elimina voce"
            />

            <DeleteConfirmationModal
                isOpen={pendingDelete?.kind === 'clear'}
                onClose={closeDeleteModal}
                onConfirm={() => void handleConfirmDelete()}
                isDeleting={isDeleting}
                variant="danger"
                title="Svuotare tutto lo Storico Audit?"
                message={`Stai per eliminare DEFINITIVAMENTE tutte le ${events.length} voci presenti nello Storico Audit del Centro di Controllo.\n\nQuesta azione è irreversibile: non sarà possibile recuperare lo storico.`}
                confirmLabel="Svuota Storico"
                confirmDisabled={!clearAck}
            >
                <label className="mt-3 flex items-start gap-2 text-left text-xs text-slate-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={clearAck}
                        onChange={(e) => setClearAck(e.target.checked)}
                        className="mt-0.5"
                    />
                    <span>
                        Confermo di voler cancellare in modo permanente l’intero Storico Audit.
                    </span>
                </label>
            </DeleteConfirmationModal>
        </div>
    );
};
