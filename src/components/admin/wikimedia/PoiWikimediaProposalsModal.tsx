import { ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { wikimediaFunctionalStatusLabel } from '@/domain/media/imagePublicationPolicy';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import {
  fetchWikimediaAssetsBySourceRef,
  type WikimediaSourceAssetState,
} from '@/services/media/mediaAssetService';
import { buildCommonsFileDescriptionPageUrl } from '@/services/wikimedia/commonsDownloadPipeline';
import type { WikimediaProposalPreview } from '@/services/wikimedia/rankWikimediaProposals';
import type { WikidataP18Proposal } from '@/services/wikimedia/wikidataLookupService';
import { WikimediaProposalCheckList } from './WikimediaProposalCheckList';
import {
  buildWikimediaProposalChecks,
  buildWikimediaProposalTechnicalFields,
  wikimediaImportAvailability,
} from './wikimediaProposalCheckPresentation';

function describeExistingAsset(asset: WikimediaSourceAssetState): string {
  const functional =
    wikimediaFunctionalStatusLabel({
      assetStatus: asset.assetStatus,
      wikimediaValidated: asset.wikimediaValidated,
      adminBlocked: asset.adminBlocked,
    }) ?? 'stato funzionale non pubblicabile';
  return `${functional}; stato asset ${asset.assetStatus}; ${
    asset.wikimediaValidated === true ? 'Wikimedia validata' : 'Wikimedia non validata'
  }; ${asset.adminBlocked ? 'blocco Admin sul file' : 'senza blocco Admin'}`;
}

export type PoiWikimediaProposalsModalProps = {
  isOpen: boolean;
  subjectLabel: string;
  /** Dettaglio di una proposta. L'elenco e la scelta restano nel tab chiamante. */
  proposal: WikimediaProposalPreview | null;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: (proposal: WikidataP18Proposal) => void;
  onDismiss: (qid: string) => void;
};

export const PoiWikimediaProposalsModal = ({
  isOpen,
  subjectLabel,
  proposal,
  isProcessing = false,
  onClose,
  onConfirm,
  onDismiss,
}: PoiWikimediaProposalsModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [existingAssets, setExistingAssets] = useState<WikimediaSourceAssetState[]>([]);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [presenceLoading, setPresenceLoading] = useState(false);

  useEffect(() => {
    const qid = proposal?.candidate.qid?.trim() ?? '';
    if (!isOpen || !qid) {
      setExistingAssets([]);
      setPresenceError(null);
      setPresenceLoading(false);
      return;
    }
    const controller = new AbortController();
    setPresenceLoading(true);
    setPresenceError(null);
    void fetchWikimediaAssetsBySourceRef(qid)
      .then((assets) => {
        if (controller.signal.aborted) return;
        setExistingAssets(assets);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setExistingAssets([]);
        setPresenceError(
          err instanceof Error ? err.message : 'Lettura asset Wikimedia già presenti fallita.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setPresenceLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [isOpen, proposal?.candidate.qid]);

  useDialogFocusTrap(isOpen && proposal !== null, dialogRef, isProcessing);

  if (!isOpen || !proposal) return null;

  const row = proposal;
  const fileProposal = row.proposal;
  const commonsUrl = fileProposal?.commonsFileTitle?.trim()
    ? buildCommonsFileDescriptionPageUrl(fileProposal.commonsFileTitle)
    : null;
  const availability = wikimediaImportAvailability(row);
  const importDisabled =
    isProcessing ||
    presenceLoading ||
    presenceError !== null ||
    !availability.enabled ||
    !fileProposal;
  const requestClose = () => {
    if (isProcessing) return;
    onClose();
  };
  const checks = buildWikimediaProposalChecks(row);
  const technicalFields = buildWikimediaProposalTechnicalFields(row);

  return (
    <div className="fixed inset-0 z-admin-modal flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
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
        className="relative bg-slate-900 w-full max-w-3xl h-full md:h-[85vh] max-h-full min-h-0 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden outline-none"
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#0f172a] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-bold text-white sm:text-xl">
              Dettaglio proposta Wikimedia
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-400">{subjectLabel}</p>
          </div>
          <CloseButton onClose={requestClose} disabled={isProcessing} />
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="aspect-square w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black sm:w-40">
              {fileProposal?.commonsFileUrl ? (
                <ImageWithFallback
                  src={fileProposal.commonsFileUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
                  Anteprima assente
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-bold text-white">{row.candidate.label}</p>
              <p className="font-mono text-xs text-indigo-300">{row.candidate.qid}</p>
              <p className="text-sm text-slate-400">
                {row.candidate.description ?? 'Descrizione assente'}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Proposta recuperata
              </p>
              {commonsUrl ? (
                <a
                  href={commonsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Pagina Commons <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300">Controlli</h4>
            <WikimediaProposalCheckList checks={checks} showRationale />
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300">
              Dettagli tecnici
            </h4>
            <dl className="space-y-2">
              {technicalFields.map((field) => (
                <div key={field.label} className="min-w-0">
                  <dt className="text-xs font-semibold text-slate-400">{field.label}</dt>
                  <dd className="break-words text-sm text-slate-200">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-800 bg-[#0f172a] px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-300">{availability.reason}</p>
          {presenceLoading ? (
            <p className="text-sm text-slate-400">Lettura asset Wikimedia già presenti...</p>
          ) : null}
          {presenceError ? (
            <p className="text-sm text-red-300" role="alert">
              {presenceError}
            </p>
          ) : null}
          {existingAssets.length > 0 ? (
            <div className="space-y-1 text-sm text-slate-300">
              <p>
                Asset Wikimedia già presente per questo Q-id. L'import resta disponibile: il riuso o
                un nuovo file li decide il percorso di collisione.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {existingAssets.map((asset) => (
                  <li key={asset.id}>{describeExistingAsset(asset)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onDismiss(row.candidate.qid)}
              disabled={isProcessing}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-900/50 px-4 text-xs font-bold uppercase tracking-wide text-red-300 hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50"
            >
              Elimina
            </button>
            <button
              type="button"
              disabled={importDisabled}
              onClick={() => fileProposal && onConfirm(fileProposal)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Importa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
