import { useId, useRef } from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import {
  IMAGE_ASSET_STATUS_LABELS,
  IMAGE_VERIFICATION_STEP_OUTCOME_LABELS,
  isImageAssetStatusDb,
  isImageVerificationStepOutcomeDb,
} from '@/constants/governance';
import type { WikimediaStorageDecisionState } from '@/hooks/admin/useWikimediaEntityImport';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import type { WikimediaStorageObjectFacts } from '@/services/wikimedia/commonsDownloadPipeline';
import { formatByteLength } from '@/services/wikimedia/wikimediaStorageCollision';

type WikimediaStorageDecisionModalProps = {
  decision: WikimediaStorageDecisionState | null;
  isProcessing: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onReuse: () => void;
  onImportNew: () => void;
};

function factLabel(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '—';
}

function statusLabel(value: string | null): string {
  if (!value) return '—';
  return isImageAssetStatusDb(value) ? IMAGE_ASSET_STATUS_LABELS[value] : value;
}

function verificationLabel(value: string | null): string {
  if (!value) return '—';
  return isImageVerificationStepOutcomeDb(value)
    ? IMAGE_VERIFICATION_STEP_OUTCOME_LABELS[value]
    : value;
}

function FactList({ facts, title }: { facts: WikimediaStorageObjectFacts; title: string }) {
  const rows = [
    ['File', facts.fileName],
    ['MIME', facts.mime],
    ['Dimensione', formatByteLength(facts.byteLength)],
    ['Asset ID', factLabel(facts.assetId)],
    ['Stato', statusLabel(facts.assetStatus)],
    ['Origine', factLabel(facts.originType)],
    ['Licenza', factLabel(facts.licenseCode)],
    ['Verifica', verificationLabel(facts.verificationOutcome)],
    ['Path', facts.storagePath],
  ] as const;

  return (
    <div className="min-w-0 space-y-3">
      <h3 className="text-sm font-black uppercase tracking-wide text-white">{title}</h3>
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black">
        <ImageWithFallback
          src={facts.previewUrl}
          alt=""
          objectFit="contain"
          className="h-full w-full"
        />
      </div>
      <dl className="space-y-1 text-sm text-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
        {facts.verificationSummary ? (
          <div className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Dettaglio</dt>
            <dd className="break-words">{facts.verificationSummary}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export const WikimediaStorageDecisionModal = ({
  decision,
  isProcessing,
  errorMessage,
  onClose,
  onReuse,
  onImportNew,
}: WikimediaStorageDecisionModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = decision !== null;
  useDialogFocusTrap(isOpen, dialogRef, isProcessing);
  if (!decision) return null;

  const identical = decision.decision === 'identical';
  const requestClose = () => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-admin-modal flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Chiudi finestra"
        disabled={isProcessing}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={requestClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-[#0f172a] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-white sm:text-xl">
              {identical
                ? 'Questa immagine è già presente in archivio.'
                : 'Collisione sul path Storage'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {identical
                ? 'Il file scaricato coincide con l’oggetto già archiviato. Non viene eseguito un secondo upload.'
                : 'Lo stesso path contiene byte diversi. Nessun file viene sovrascritto.'}
            </p>
          </div>
          <CloseButton onClose={requestClose} disabled={isProcessing} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {identical ? (
            <FactList facts={decision.existing} title="Foto già presente" />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FactList facts={decision.existing} title="Foto già presente" />
              <FactList facts={decision.incoming} title="Nuova foto Wikimedia" />
            </div>
          )}
        </div>
        {errorMessage ? (
          <p className="px-4 text-sm text-red-300 sm:px-6" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 border-t border-slate-800 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onReuse}
            disabled={isProcessing}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            Usa l'asset già presente
          </button>
          {identical ? null : (
            <button
              type="button"
              onClick={onImportNew}
              disabled={isProcessing}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-indigo-400 px-4 text-xs font-bold uppercase tracking-wide text-indigo-100 hover:bg-indigo-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
            >
              Importa la nuova immagine
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
