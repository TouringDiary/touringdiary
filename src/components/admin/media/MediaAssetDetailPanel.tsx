import { Archive, ExternalLink, History, Link2, Loader2, X } from 'lucide-react';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

function usePanelFocusTrap(active: boolean, panelRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusRaf = requestAnimationFrame(() => {
      const focusable = panel ? getFocusableElements(panel) : [];
      if (focusable.length > 0) focusable[0].focus();
      else panel?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return;
      if (event.key !== 'Tab' || !panel) return;
      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      panel?.removeEventListener('keydown', handleKeyDown);
      if (opener) opener.focus();
    };
  }, [active, panelRef]);
}

import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import {
  IMAGE_ASSET_STATUS_LABELS,
  IMAGE_VERIFICATION_STEP_OUTCOME_LABELS,
  isImageVerificationStepOutcomeDb,
} from '@/constants/governance';
import { mapOriginTypeToDisplay } from '@/services/media/mediaAssetService';
import {
  listMediaAssetAssignments,
  listMediaAssetHistory,
  type MediaAssetAssignmentUsage,
  type MediaAssetHistoryEntry,
  type MediaCatalogRow,
  safeArchiveMediaAsset,
} from '@/services/media/mediaCatalogService';
import {
  mf3ImageVerificationRunsTable,
  mf3ImageVerificationStepsTable,
} from '@/services/media/mf3DbClient';
import { listContentReportsForMediaAsset } from '@/services/reports/contentReportService';
import type { ContentReport } from '@/types/models/contentReport';

type MediaAssetDetailPanelProps = {
  asset: MediaCatalogRow;
  onClose: () => void;
  onArchived?: () => void;
};

type VerificationStepRow = {
  stepCode: string;
  outcome: string;
  aiRationale: string | null;
};

export const MediaAssetDetailPanel = ({
  asset,
  onClose,
  onArchived,
}: MediaAssetDetailPanelProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [assignments, setAssignments] = useState<MediaAssetAssignmentUsage[]>([]);
  const [history, setHistory] = useState<MediaAssetHistoryEntry[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveNote, setArchiveNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAssignments([]);
    setHistory([]);
    setReports([]);
    setVerificationSteps([]);

    void (async () => {
      try {
        const [usageRows, historyRows, reportRows] = await Promise.all([
          listMediaAssetAssignments(asset.id),
          listMediaAssetHistory(asset.id),
          listContentReportsForMediaAsset(asset.id),
        ]);
        if (cancelled) return;
        setAssignments(usageRows);
        setHistory(historyRows);
        setReports(reportRows);

        const { data: runs, error: runsError } = await mf3ImageVerificationRunsTable()
          .select('id')
          .eq('media_asset_id', asset.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (runsError) {
          throw new Error(runsError.message);
        }

        const firstRun = (runs?.[0] ?? null) as { id?: string } | null;
        const runId = firstRun && typeof firstRun.id === 'string' ? firstRun.id : null;
        if (runId) {
          const { data: steps, error: stepsError } = await mf3ImageVerificationStepsTable()
            .select('step_code, outcome, ai_rationale')
            .eq('run_id', runId)
            .order('step_order', { ascending: true });
          if (stepsError) {
            throw new Error(stepsError.message);
          }
          if (!cancelled) {
            setVerificationSteps(
              ((steps ?? []) as unknown[]).map((raw) => {
                const row = raw as Record<string, unknown>;
                return {
                  stepCode: String(row.step_code ?? ''),
                  outcome: String(row.outcome ?? ''),
                  aiRationale: typeof row.ai_rationale === 'string' ? row.ai_rationale : null,
                };
              }),
            );
          }
        } else if (!cancelled) {
          setVerificationSteps([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore caricamento dettaglio asset.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [asset.id]);

  usePanelFocusTrap(true, panelRef);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !archiving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [archiving, onClose]);

  const handleArchive = async () => {
    setArchiving(true);
    setError(null);
    try {
      const result = await safeArchiveMediaAsset(asset.id, archiveNote);
      if (!result.ok) {
        setError(result.message ?? 'Archivio non consentito.');
        return;
      }
      onArchived?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivio non consentito.');
    } finally {
      setArchiving(false);
    }
  };

  const originLabel = mapOriginTypeToDisplay(asset.originType);

  return (
    <div className="fixed inset-0 z-admin-modal flex justify-end bg-black/60">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 id={titleId} className="text-sm font-black uppercase tracking-wide text-white">
            Dettaglio asset
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Chiudi pannello"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
            <ImageWithFallback
              src={asset.publicUrl}
              alt={asset.storagePath}
              className="max-h-56 w-full object-contain"
            />
          </div>

          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Origine</dt>
              <dd className="font-semibold text-slate-200">{originLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Stato asset</dt>
              <dd className="font-semibold text-slate-200">
                {IMAGE_ASSET_STATUS_LABELS[asset.assetStatus]}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Storage path</dt>
              <dd className="break-all font-mono text-[11px] text-slate-300">
                {asset.storagePath}
              </dd>
            </div>
            {asset.sourceRef ? (
              <div>
                <dt className="text-slate-500">Riferimento sorgente</dt>
                <dd className="font-mono text-indigo-300">{asset.sourceRef}</dd>
              </div>
            ) : null}
            {asset.licenseCode ? (
              <div>
                <dt className="text-slate-500">Licenza</dt>
                <dd className="text-slate-200">{asset.licenseCode}</dd>
              </div>
            ) : null}
            {asset.authorName ? (
              <div>
                <dt className="text-slate-500">Autore</dt>
                <dd className="text-slate-200">{asset.authorName}</dd>
              </div>
            ) : null}
            {asset.attributionText ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Attribuzione</dt>
                <dd className="text-slate-300">{asset.attributionText}</dd>
              </div>
            ) : null}
            {asset.licenseVerifiedAt ? (
              <div>
                <dt className="text-slate-500">Licenza verificata il</dt>
                <dd className="text-slate-300">
                  {new Date(asset.licenseVerifiedAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
            {asset.sourceUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Fonte</dt>
                <dd>
                  <a
                    href={asset.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-indigo-300 hover:underline"
                  >
                    {asset.sourceUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Caricamento utilizzi e storico…
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-400">
              <Link2 className="h-4 w-4" /> Utilizzi entità ({assignments.length})
            </h3>
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-500">Nessun assignment registrato.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((usage) => (
                  <li
                    key={usage.assignmentId}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-white">
                      {usage.entityLabel ?? usage.entityId}{' '}
                      <span className="text-slate-500">({usage.entityType})</span>
                    </div>
                    <div className="text-slate-400">
                      {usage.cityName ?? usage.cityId} · {usage.assignmentRole} ·{' '}
                      {usage.assignmentStatus}
                      {usage.isCurrent ? ' · corrente' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {verificationSteps.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-black uppercase text-slate-400">
                Verifica licenza (ultimo run)
              </h3>
              <ul className="space-y-1 text-[11px]">
                {verificationSteps.map((step) => (
                  <li
                    key={step.stepCode}
                    className="flex justify-between gap-2 rounded bg-slate-950 px-2 py-1"
                  >
                    <span className="font-mono text-slate-400">{step.stepCode}</span>
                    <span className="text-slate-200">
                      {isImageVerificationStepOutcomeDb(step.outcome)
                        ? IMAGE_VERIFICATION_STEP_OUTCOME_LABELS[step.outcome]
                        : step.outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-400">
              <History className="h-4 w-4" /> History assignment
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">Nessun evento storico.</p>
            ) : (
              <ul className="space-y-2 text-[11px]">
                {history.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-slate-800 px-3 py-2">
                    <div className="font-semibold text-slate-200">{entry.eventType}</div>
                    <div className="text-slate-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                    {entry.newAssignmentStatus ? (
                      <div className="text-slate-400">
                        Assignment: {entry.previousAssignmentStatus ?? '—'} →{' '}
                        {entry.newAssignmentStatus}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {reports.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-black uppercase text-slate-400">
                Segnalazioni collegate (MF2)
              </h3>
              <ul className="space-y-2 text-xs">
                {reports.map((report) => (
                  <li
                    key={report.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2"
                  >
                    <div className="font-semibold text-white">{report.reportKind}</div>
                    <div className="text-slate-400">
                      {report.status} · {new Date(report.createdAt).toLocaleString()}
                    </div>
                    {report.evidenceStoragePath ? (
                      <div className="text-[10px] text-emerald-400">Evidenza permanente MF2</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-400">
              <Archive className="h-4 w-4" /> Safe archive
            </h3>
            <p className="mb-2 text-[11px] text-slate-400">
              Bloccato se l&apos;asset ha assignment attivi o segnalazioni aperte. Non elimina lo
              storico.
            </p>
            <textarea
              value={archiveNote}
              onChange={(e) => setArchiveNote(e.target.value)}
              rows={2}
              placeholder="Motivazione archivio (opzionale)"
              className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              disabled={archiving || asset.activeUsageCount > 0}
              onClick={() => void handleArchive()}
              className="min-h-10 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {archiving ? 'Archiviazione…' : 'Archivia in sicurezza'}
            </button>
            {asset.activeUsageCount > 0 ? (
              <p className="mt-2 text-[11px] text-amber-300">
                Asset in uso ({asset.activeUsageCount}) — archivio non disponibile.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};
