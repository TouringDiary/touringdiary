import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  EMPTY_GEO_REPORT_FILTER,
  GeoReportFilters,
  type GeoReportFilterValue,
} from '@/components/admin/shared/GeoReportFilters';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import {
  IMAGE_ASSET_STATUS_LABELS,
  IMAGE_VERIFICATION_STEP_OUTCOME_DB_VALUES,
  IMAGE_VERIFICATION_STEP_OUTCOME_LABELS,
  type ImageVerificationStepOutcomeDb,
} from '@/constants/governance';
import { IMAGE_VERIFICATION_STEP_DEFINITIONS } from '@/constants/imageVerificationSteps';
import { completeAiVerifyAdminDecision } from '@/services/media/imageStatusService';
import { type AiVerifyQueueRow, listAiVerifyQueue } from '@/services/media/mediaAssetService';
import { mf3ImageVerificationStepsTable } from '@/services/media/mf3DbClient';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

type EntityTab = 'city_person' | 'patron' | 'poi' | 'all';

const ENTITY_TABS: { id: EntityTab; label: string }[] = [
  { id: 'all', label: 'Tutte' },
  { id: 'city_person', label: 'Personaggio' },
  { id: 'patron', label: 'Patrono' },
  { id: 'poi', label: 'POI' },
];

type VerificationStepRow = {
  step_code: string;
  step_order: number;
  outcome: string;
  ai_rationale: string | null;
  admin_rationale: string | null;
  admin_override: boolean;
};

function isKnownVerificationOutcome(outcome: string): outcome is ImageVerificationStepOutcomeDb {
  return (IMAGE_VERIFICATION_STEP_OUTCOME_DB_VALUES as readonly string[]).includes(outcome);
}

function normalizeVerificationSteps(data: unknown): VerificationStepRow[] {
  if (!Array.isArray(data)) return [];
  const rows: VerificationStepRow[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const stepCode = typeof row.step_code === 'string' ? row.step_code : '';
    const stepOrder = typeof row.step_order === 'number' ? row.step_order : 0;
    const outcome = typeof row.outcome === 'string' ? row.outcome : 'not_applicable';
    if (!stepCode) continue;
    rows.push({
      step_code: stepCode,
      step_order: stepOrder,
      outcome,
      ai_rationale: typeof row.ai_rationale === 'string' ? row.ai_rationale : null,
      admin_rationale: typeof row.admin_rationale === 'string' ? row.admin_rationale : null,
      admin_override: row.admin_override === true,
    });
  }
  return rows;
}

function resolvePreviewUrl(row: AiVerifyQueueRow): string | undefined {
  if (row.storageBucket && row.storagePath) {
    return buildPublicStorageUrl(row.storageBucket, row.storagePath) ?? undefined;
  }
  if (row.storagePath.startsWith('http')) return row.storagePath;
  return undefined;
}

type AdminAiVerifyQueueProps = {
  onQueueChanged?: () => void;
};

export const AdminAiVerifyQueue = ({ onQueueChanged }: AdminAiVerifyQueueProps) => {
  const rationaleId = useId();
  const [entityTab, setEntityTab] = useState<EntityTab>('all');
  const [geo, setGeo] = useState<GeoReportFilterValue>(EMPTY_GEO_REPORT_FILTER);
  const [rows, setRows] = useState<AiVerifyQueueRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<VerificationStepRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminRationale, setAdminRationale] = useState('');
  const [overrideStepCode, setOverrideStepCode] = useState('');

  const selected = useMemo(
    () => rows.find((r) => r.mediaAssetId === selectedId) ?? null,
    [rows, selectedId],
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAiVerifyQueue({
        entityType: entityTab === 'all' ? null : entityTab,
        continent: geo.continent || null,
        nation: geo.nation || null,
        cityId: geo.cityId || null,
        limit: 100,
      });
      setRows(data);
      if (selectedId && !data.some((r) => r.mediaAssetId === selectedId)) {
        setSelectedId(null);
        setSteps([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entityTab, geo, selectedId]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const loadSteps = useCallback(async (runId: string | null) => {
    if (!runId) {
      setSteps([]);
      return;
    }
    setDetailLoading(true);
    try {
      const { data, error: stepsError } = await mf3ImageVerificationStepsTable()
        .select('step_code, step_order, outcome, ai_rationale, admin_rationale, admin_override')
        .eq('run_id', runId)
        .order('step_order', { ascending: true });
      if (stepsError) throw stepsError;
      setSteps(normalizeVerificationSteps(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSteps([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSteps(selected?.latestRunId ?? null);
  }, [selected?.latestRunId, loadSteps]);

  const runDecision = async (decision: 'approve' | 'reject' | 'override_approve') => {
    if (!selected) return;
    if (!adminRationale.trim()) {
      setError('Motivazione Admin obbligatoria.');
      return;
    }
    if (decision === 'override_approve' && !overrideStepCode.trim()) {
      setError('Seleziona lo step da sottoporre a override.');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await completeAiVerifyAdminDecision({
        mediaAssetId: selected.mediaAssetId,
        decision,
        adminRationale: adminRationale.trim(),
        overrideStepCode: decision === 'override_approve' ? overrideStepCode.trim() : null,
      });
      setAdminRationale('');
      setOverrideStepCode('');
      await loadQueue();
      onQueueChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const stepLabel = (code: string) =>
    IMAGE_VERIFICATION_STEP_DEFINITIONS.find((s) => s.code === code)?.label ?? code;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 lg:gap-6">
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap gap-2">
          {ENTITY_TABS.map((tab) => {
            const active = entityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setEntityTab(tab.id)}
                className={`min-h-11 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider touch-manipulation ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void loadQueue()}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold uppercase hover:bg-slate-700 disabled:opacity-50"
            aria-label="Aggiorna coda"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="w-4 h-4" aria-hidden />
            )}
            Aggiorna
          </button>
        </div>

        <GeoReportFilters value={geo} onChange={setGeo} />

        {error ? (
          <p className="text-sm text-rose-400 flex items-start gap-2" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            {error}
          </p>
        ) : null}

        <ul className="space-y-2 max-h-[50vh] lg:max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
          {rows.length === 0 && !loading ? (
            <li className="text-sm text-slate-500 p-4 border border-dashed border-slate-700 rounded-xl">
              Nessun asset in stato {IMAGE_ASSET_STATUS_LABELS.verify_ai_image}.
            </li>
          ) : null}
          {rows.map((row) => {
            const active = row.mediaAssetId === selectedId;
            const preview = resolvePreviewUrl(row);
            return (
              <li key={row.mediaAssetId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(row.mediaAssetId)}
                  aria-pressed={active}
                  className={`w-full text-left rounded-xl border p-3 flex gap-3 items-center min-h-11 touch-manipulation transition-colors ${
                    active
                      ? 'border-violet-500/60 bg-violet-950/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                    <ImageWithFallback
                      src={preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {row.entityLabel ?? row.entityType}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {[row.continent, row.nation, row.cityName].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-[10px] text-violet-300 font-mono truncate mt-0.5">
                      {IMAGE_ASSET_STATUS_LABELS.verify_ai_image}
                      {row.currentAssignments.length > 1
                        ? ` · ${row.currentAssignments.length} utilizzi`
                        : ''}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:p-5 space-y-4 min-w-0">
        {!selected ? (
          <p className="text-sm text-slate-500">Seleziona un asset dalla coda per i dettagli.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-40 aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 shrink-0">
                <ImageWithFallback
                  src={resolvePreviewUrl(selected)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 space-y-2 flex-1">
                <h4 className="text-lg font-bold text-white truncate">{selected.entityLabel}</h4>
                <p className="text-xs text-slate-400">
                  {selected.entityType} · {selected.cityName}
                </p>
                {selected.currentAssignments.length > 1 ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Utilizzi correnti ({selected.currentAssignments.length})
                    </p>
                    <ul className="text-[10px] text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                      {selected.currentAssignments.map((usage) => (
                        <li key={usage.assignmentId}>
                          {usage.entityLabel ?? usage.entityType} · {usage.cityName ?? usage.cityId}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="text-[10px] text-slate-500 break-all">
                  Provenienza: {selected.originType}
                  {selected.generatedByAi ? ' · AI flag' : ''}
                </p>
                {selected.latestAiSummary ? (
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Motivazione AI
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selected.latestAiSummary}
                    </p>
                    {selected.blockingStepCode ? (
                      <p className="text-[10px] text-amber-400 mt-2">
                        Step bloccante: {stepLabel(selected.blockingStepCode)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Checklist verifica
              </h5>
              {detailLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Caricamento step…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {(steps.length > 0
                    ? steps
                    : IMAGE_VERIFICATION_STEP_DEFINITIONS.map((def) => ({
                        step_code: def.code,
                        step_order: def.order,
                        outcome: 'not_applicable',
                        ai_rationale: null,
                        admin_rationale: null,
                        admin_override: false,
                      }))
                  ).map((step) => {
                    const label = isKnownVerificationOutcome(step.outcome)
                      ? IMAGE_VERIFICATION_STEP_OUTCOME_LABELS[step.outcome]
                      : step.outcome;
                    return (
                      <div
                        key={`${step.step_code}-${step.step_order}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5"
                      >
                        <p className="text-[10px] font-bold text-slate-300 leading-snug">
                          {stepLabel(step.step_code)}
                        </p>
                        <p className="text-[10px] text-violet-300 font-bold mt-1">{label}</p>
                        {step.ai_rationale ? (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-3">
                            {step.ai_rationale}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <label
                htmlFor={rationaleId}
                className="text-[10px] font-bold uppercase text-slate-500"
              >
                Motivazione Admin
              </label>
              <textarea
                id={rationaleId}
                value={adminRationale}
                onChange={(e) => setAdminRationale(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 text-sm text-white p-3 min-h-11"
                placeholder="Obbligatoria per approve / reject / override (D82 tracciato)"
              />
              <label
                htmlFor={`${rationaleId}-override-step`}
                className="text-[10px] font-bold uppercase text-slate-500 block"
              >
                Override step (solo approvazione con override)
              </label>
              <select
                id={`${rationaleId}-override-step`}
                value={overrideStepCode}
                onChange={(e) => setOverrideStepCode(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 text-sm text-white p-2.5 min-h-11"
              >
                <option value="">— Nessun override —</option>
                {IMAGE_VERIFICATION_STEP_DEFINITIONS.map((def) => (
                  <option key={def.code} value={def.code}>
                    {def.label}
                  </option>
                ))}
              </select>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void runDecision('approve')}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden />
                  Approva
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void runDecision('override_approve')}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" aria-hidden />
                  Override D82
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void runDecision('reject')}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" aria-hidden />
                  Rifiuta / Rimuovi
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
