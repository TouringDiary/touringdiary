import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { getPlatformControlService } from '@/services/platformControl/platformControlService';
import type { PlatformControlAuditEvent } from '@/types/platformControl';

interface AuditHistoryPanelProps {
    canExport: boolean;
}

function csvEscape(value: unknown): string {
    const raw = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
}

/** Contenuto Storico Audit — banner TAB gestito dal Centro di Controllo. */
export const AuditHistoryPanel: React.FC<AuditHistoryPanelProps> = ({ canExport }) => {
    const ty = usePlatformControlTypography();

    const [events, setEvents] = useState<PlatformControlAuditEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterKey, setFilterKey] = useState('');
    const [limit, setLimit] = useState(50);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const rows = await getPlatformControlService().fetchAuditEvents(limit);
            setEvents(rows);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Caricamento audit fallito');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = filterKey.trim()
        ? events.filter((e) => e.configKey.toLowerCase().includes(filterKey.trim().toLowerCase()))
        : events;

    const handleExport = () => {
        const header = ['created_at', 'config_key', 'action', 'actor_id', 'reason', 'value_before', 'value_after'];
        const lines = [
            header.join(','),
            ...filtered.map((e) =>
                [
                    csvEscape(e.createdAt),
                    csvEscape(e.configKey),
                    csvEscape(e.action),
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
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                    type="search"
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                    placeholder="Filtra per chiave config…"
                    className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 ${ty.input}`}
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
                {canExport ? (
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={filtered.length === 0}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 ${ty.btnPrimary}`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                ) : null}
            </div>

            {isLoading ? (
                <div className={`flex items-center gap-2 py-4 ${ty.helper}`}>
                    <Loader2 className="w-4 h-4 animate-spin" /> Caricamento storico…
                </div>
            ) : null}

            {error ? <p className={ty.error}>{error}</p> : null}

            {!isLoading && filtered.length === 0 ? (
                <p className={ty.sectionSubtitle}>Nessun evento audit da mostrare.</p>
            ) : null}

            {filtered.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left min-w-[640px]">
                        <thead className="bg-slate-900/80 border-b border-slate-800">
                            <tr>
                                <th className={`p-2 ${ty.tableHead}`}>Data</th>
                                <th className={`p-2 ${ty.tableHead}`}>Chiave</th>
                                <th className={`p-2 ${ty.tableHead}`}>Azione</th>
                                <th className={`p-2 ${ty.tableHead}`}>Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((event) => (
                                <tr key={event.id} className="border-b border-slate-800/80">
                                    <td className={`p-2 whitespace-nowrap ${ty.tableCell}`}>
                                        {new Date(event.createdAt).toLocaleString()}
                                    </td>
                                    <td className={`p-2 ${ty.monoKey}`}>{event.configKey}</td>
                                    <td className={`p-2 ${ty.tableCell}`}>{event.action}</td>
                                    <td className={`p-2 ${ty.tableCell}`}>{event.reason || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};
