import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CONTENT_REPORT_STATUS_LABELS, type ContentReportStatusDb } from '@/constants/governance';
import { transitionReportStatus } from '@/services/reports/contentReportService';
import { getReportAdminContext } from '@/services/reports/reportContextService';
import {
  EVIDENCE_BUCKET,
  getReportEvidenceSignedUrl,
} from '@/services/reports/reportEvidenceService';
import type { ContentReport, ReportAdminContext } from '@/types/models/contentReport';
import { ReportOtherUsagesAlert } from './ReportOtherUsagesAlert';

type ReportAdminDetailPanelProps = {
  report: ContentReport;
  linkedReports: ContentReport[];
  onUpdated: () => void;
  onClose: () => void;
};

export const ReportAdminDetailPanel = ({
  report,
  linkedReports,
  onUpdated,
  onClose,
}: ReportAdminDetailPanelProps) => {
  const [context, setContext] = useState<ReportAdminContext | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [snapshotPreviewUrl, setSnapshotPreviewUrl] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reportId = report.id;
    const evidencePath = report.evidenceStoragePath;
    const snapshotImageUrl = report.snapshotImageUrl;
    const permanentEvidence =
      report.evidenceStorageBucket === EVIDENCE_BUCKET && Boolean(evidencePath?.trim());

    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const ctx = await getReportAdminContext(reportId);
        if (cancelled) return;
        setContext(ctx);

        if (permanentEvidence && evidencePath) {
          const url = await getReportEvidenceSignedUrl(evidencePath);
          if (cancelled) return;
          setEvidenceUrl(url);
          setSnapshotPreviewUrl(null);
        } else {
          if (cancelled) return;
          setEvidenceUrl(null);
          setSnapshotPreviewUrl(snapshotImageUrl ?? null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Errore caricamento dettaglio.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    report.id,
    report.evidenceStorageBucket,
    report.evidenceStoragePath,
    report.snapshotImageUrl,
  ]);

  useEffect(() => {
    setAdminNotes(report.adminNotes ?? '');
  }, [report]);

  const handleTransition = async (target: Exclude<ContentReportStatusDb, 'nuovo'>) => {
    setIsSaving(true);
    setError(null);
    try {
      await transitionReportStatus(report.id, target, adminNotes);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transizione non riuscita.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
        <span className="sr-only">Caricamento dettaglio segnalazione</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            {CONTENT_REPORT_STATUS_LABELS[report.status]} · {report.reportKind}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {report.snapshotEntityName ?? report.entityId} · gruppo{' '}
            {report.reportGroupId.slice(0, 8)}…
          </p>
        </div>
        <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={onClose}>
          Chiudi
        </button>
      </div>

      {linkedReports.length > 1 ? (
        <p className="text-xs text-indigo-300">
          Modello B: {linkedReports.length} componenti collegate nello stesso gruppo — gestione
          indipendente.
        </p>
      ) : null}

      {context?.reportedAssignment ? (
        <section
          className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-2"
          aria-label="Associazione segnalata"
        >
          <p className="text-xs font-bold uppercase text-slate-400">Associazione segnalata</p>
          <p className="text-sm text-white">
            {context.reportedAssignment.entityName} · {context.reportedAssignment.cityName}
          </p>
          <p className="text-xs text-slate-400">
            {context.reportedAssignment.entityType} · {context.reportedAssignment.assignmentStatus}
            {context.reportedAssignment.isCurrent ? ' · corrente' : ''}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            assignment {context.reportedAssignment.assignmentId}
          </p>
        </section>
      ) : null}

      {context ? (
        <ReportOtherUsagesAlert
          otherAssignments={context.otherAssignments}
          otherPersonCities={context.otherPersonCities}
        />
      ) : null}

      {evidenceUrl ? (
        <div className="rounded-lg overflow-hidden border border-slate-700 max-w-md">
          <img
            src={evidenceUrl}
            alt="Evidenza segnalazione"
            className="w-full max-h-56 object-cover"
          />
          <p className="text-[10px] text-slate-500 p-2">
            Evidenza immutabile al momento della segnalazione (bucket privato report-evidence)
          </p>
        </div>
      ) : snapshotPreviewUrl ? (
        <div className="rounded-lg overflow-hidden border border-slate-700/60 max-w-md">
          <img
            src={snapshotPreviewUrl}
            alt="Anteprima snapshot segnalazione"
            className="w-full max-h-56 object-cover opacity-90"
          />
          <p className="text-[10px] text-amber-500/80 p-2">
            Anteprima snapshot — evidenza permanente non ancora catturata o non disponibile
          </p>
        </div>
      ) : null}

      <div className="text-sm text-slate-300 space-y-2">
        <p>
          <span className="text-slate-500">Motivo utente:</span> {report.reason}
        </p>
        <p className="whitespace-pre-wrap">{report.userNotes}</p>
        {report.reporterUserName ? (
          <p className="text-xs text-slate-500">Segnalante: {report.reporterUserName}</p>
        ) : null}
        {report.reporterEmail ? (
          <p className="text-xs text-slate-500">
            Email: {report.reporterEmail}
            {report.reporterEmailVerified ? ' (verificata)' : ''}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="admin-report-notes" className="text-xs font-bold uppercase text-slate-400">
          Note Admin
        </label>
        <textarea
          id="admin-report-notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {report.status === 'nuovo' ? (
          <button
            type="button"
            disabled={isSaving}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase"
            onClick={() => void handleTransition('in_verifica')}
          >
            In verifica
          </button>
        ) : null}
        {report.status === 'in_verifica' ? (
          <>
            <button
              type="button"
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold uppercase"
              onClick={() => void handleTransition('ok')}
            >
              OK
            </button>
            <button
              type="button"
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold uppercase"
              onClick={() => void handleTransition('ko')}
            >
              KO
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
