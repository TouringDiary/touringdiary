import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONTENT_REPORT_STATUS_LABELS,
  type ContentReportEntityType,
  type ContentReportKind,
  type ContentReportSourceContext,
  type ContentReportStatusDb,
} from '@/constants/governance';
import {
  getReportsByGroupId,
  listContentReportsForAdmin,
} from '@/services/reports/contentReportService';
import type { ContentReport } from '@/types/models/contentReport';
import { ReportAdminDetailPanel } from './ReportAdminDetailPanel';

type ReportsListPanelProps = {
  entityTypes: ContentReportEntityType[];
  sourceContexts?: ContentReportSourceContext[];
  reportKinds?: ContentReportKind[];
  emptyMessage?: string;
};

const STATUS_FILTERS: Array<ContentReportStatusDb | 'all'> = [
  'nuovo',
  'in_verifica',
  'ok',
  'ko',
  'all',
];

export const ReportsListPanel = ({
  entityTypes,
  sourceContexts,
  reportKinds,
  emptyMessage = 'Nessuna segnalazione in questa sezione.',
}: ReportsListPanelProps) => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [filter, setFilter] = useState<ContentReportStatusDb | 'all'>('nuovo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkedReports, setLinkedReports] = useState<ContentReport[]>([]);
  const [linkedReportsError, setLinkedReportsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listContentReportsForAdmin({
        entityTypes,
        sourceContexts,
        reportKinds,
        status: filter,
      });
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento segnalazioni.');
    } finally {
      setIsLoading(false);
    }
  }, [entityTypes, sourceContexts, reportKinds, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId],
  );

  useEffect(() => {
    if (!selectedReport) {
      setLinkedReports([]);
      setLinkedReportsError(null);
      return;
    }

    let cancelled = false;
    const groupId = selectedReport.reportGroupId;

    setLinkedReports([]);
    setLinkedReportsError(null);

    void getReportsByGroupId(groupId)
      .then((reports) => {
        if (!cancelled) setLinkedReports(reports);
      })
      .catch((err) => {
        if (!cancelled) {
          setLinkedReports([]);
          setLinkedReportsError(
            err instanceof Error ? err.message : 'Errore caricamento segnalazioni collegate.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedReport]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
              filter === status ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {status === 'all' ? 'Tutte' : CONTENT_REPORT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      {linkedReportsError ? (
        <p className="text-sm text-rose-400" role="alert">
          {linkedReportsError}
        </p>
      ) : null}

      {selectedReport ? (
        <ReportAdminDetailPanel
          report={selectedReport}
          linkedReports={linkedReports}
          onUpdated={() => void load()}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {reports.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
          {reports.map((report) => (
            <li key={report.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-colors"
                onClick={() => setSelectedId(report.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {report.snapshotEntityName ?? report.entityId}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 shrink-0">
                    {CONTENT_REPORT_STATUS_LABELS[report.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {report.reportKind} · {new Date(report.createdAt).toLocaleString('it-IT')}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
