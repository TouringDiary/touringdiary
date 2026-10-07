import { Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { WikimediaProposalCheckList } from '@/components/admin/wikimedia/WikimediaProposalCheckList';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { IMAGE_VERIFICATION_STEP_OUTCOME_LABELS } from '@/constants/governance';
import { toneForVerificationOutcome } from '@/domain/media/imagePublicationPolicy';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import {
  completeWikimediaValidation,
  loadLatestWikimediaValidationSteps,
  saveWikimediaValidationDraft,
  type WikimediaValidationStep,
} from '@/services/media/wikimediaValidationService';

type WikimediaValidationModalProps = {
  isOpen: boolean;
  mediaAssetId: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  sourceRef: string | null;
  functionalStatus: string | null;
  technicalStatus: string | null;
  onClose: () => void;
  onValidated: () => void;
};

export const WikimediaValidationModal = ({
  isOpen,
  mediaAssetId,
  previewUrl,
  sourceUrl,
  sourceRef,
  functionalStatus,
  technicalStatus,
  onClose,
  onValidated,
}: WikimediaValidationModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<WikimediaValidationStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingStep, setMissingStep] = useState<string | null>(null);

  useDialogFocusTrap(isOpen, dialogRef, loading);

  useEffect(() => {
    if (!isOpen || !mediaAssetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMissingStep(null);
    void loadLatestWikimediaValidationSteps(mediaAssetId)
      .then((rows) => {
        if (!cancelled) setSteps(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Lettura controlli fallita.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mediaAssetId]);

  if (!isOpen || !mediaAssetId) return null;

  const requestClose = () => {
    if (loading) return;
    onClose();
  };

  const updateNote = (stepCode: string, adminRationale: string) => {
    setSteps((current) =>
      current.map((step) => (step.stepCode === stepCode ? { ...step, adminRationale } : step)),
    );
  };

  const firstMissing = () =>
    steps.find((step) => step.noteRequired && step.adminRationale.trim().length === 0) ?? null;

  const saveDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      await saveWikimediaValidationDraft(
        mediaAssetId,
        steps.map((step) => ({ stepCode: step.stepCode, adminRationale: step.adminRationale })),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Salvataggio bozza fallito.');
    } finally {
      setLoading(false);
    }
  };

  const validate = async () => {
    const missing = firstMissing();
    if (missing) {
      setMissingStep(missing.stepCode);
      setError(`Nota obbligatoria: ${missing.label}.`);
      return;
    }
    setLoading(true);
    setError(null);
    setMissingStep(null);
    try {
      await saveWikimediaValidationDraft(
        mediaAssetId,
        steps.map((step) => ({ stepCode: step.stepCode, adminRationale: step.adminRationale })),
      );
      await completeWikimediaValidation(
        mediaAssetId,
        'Validazione Admin Wikimedia completata sui 16 controlli.',
      );
      onValidated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validazione fallita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-admin-modal flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Chiudi finestra"
        disabled={loading}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={requestClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-[#0f172a] px-4 py-4 sm:px-6">
          <h2 id={titleId} className="min-w-0 text-lg font-bold text-white sm:text-xl">
            Valida Wikimedia
          </h2>
          <CloseButton onClose={requestClose} disabled={loading} />
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {previewUrl ? (
              <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black sm:w-36">
                <ImageWithFallback src={previewUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <dl className="min-w-0 space-y-1 text-sm text-slate-200">
              <div>Stato funzionale: {functionalStatus ?? 'DA VALIDARE'}</div>
              <div>Stato tecnico: {technicalStatus ?? '—'}</div>
              <div className="break-all">Wikidata: {sourceRef ?? '—'}</div>
              <div className="break-all">Fonte: {sourceUrl ?? '—'}</div>
            </dl>
          </div>
          {loading && steps.length === 0 ? (
            <p className="text-sm text-slate-400">Lettura dei 16 controlli...</p>
          ) : null}
          <ul className="space-y-4">
            {steps.map((step) => (
              <li
                key={step.stepCode}
                className={`rounded-xl border p-3 ${
                  missingStep === step.stepCode ? 'border-amber-500' : 'border-slate-800'
                }`}
              >
                <WikimediaProposalCheckList
                  checks={[
                    {
                      id: step.stepCode,
                      label: step.label,
                      tone: toneForVerificationOutcome(step.outcome),
                      statusLabel: IMAGE_VERIFICATION_STEP_OUTCOME_LABELS[step.outcome],
                      rationale: step.aiRationale,
                    },
                  ]}
                  showRationale
                />
                {step.evidenceJson ? (
                  <p className="mt-1 break-all pl-6 text-xs text-slate-500">
                    {JSON.stringify(step.evidenceJson)}
                  </p>
                ) : null}
                <label
                  className="mt-2 block text-xs font-bold uppercase text-slate-400"
                  htmlFor={`${titleId}-${step.stepCode}`}
                >
                  Nota Admin {step.noteRequired ? '(obbligatoria)' : '(facoltativa)'}
                </label>
                <textarea
                  id={`${titleId}-${step.stepCode}`}
                  value={step.adminRationale}
                  onChange={(event) => updateNote(step.stepCode, event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                />
              </li>
            ))}
          </ul>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => void saveDraft()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            Salva bozza
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void validate()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Valida
          </button>
        </div>
      </div>
    </div>
  );
};
