import { ExternalLink, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useId, useRef } from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { buildCommonsFileDescriptionPageUrl } from '@/services/wikimedia/commonsDownloadPipeline';
import type { WikimediaProposalPreview } from '@/services/wikimedia/rankWikimediaProposals';
import type { WikidataP18Proposal } from '@/services/wikimedia/wikidataLookupService';

export type PoiWikimediaProposalsModalProps = {
  isOpen: boolean;
  subjectLabel: string;
  proposals: WikimediaProposalPreview[];
  isProcessing?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (proposal: WikidataP18Proposal) => void;
};

export const PoiWikimediaProposalsModal = ({
  isOpen,
  subjectLabel,
  proposals,
  isProcessing = false,
  errorMessage,
  onClose,
  onConfirm,
}: PoiWikimediaProposalsModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasImportableProposal = proposals.some((row) => row.isImportable && row.proposal);

  useGlobalModalEscape(isOpen && !isProcessing, onClose);
  useDialogFocusTrap(isOpen, dialogRef, isProcessing);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-admin-modal flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-slate-900 w-full max-w-3xl max-h-[calc(100dvh-2rem)] rounded-2xl border border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden outline-none"
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-start gap-4 shrink-0">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              Proposte Wikimedia — {subjectLabel}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ordine: licenza CC BY 4.0 idonea → punteggio entity → confidenza. Import solo dopo
              scelta.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Chiudi"
            className="text-slate-400 hover:text-white p-2 rounded-lg min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto min-h-0 flex-1 space-y-3">
          {errorMessage ? (
            <p className="text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl p-3">
              {errorMessage}
            </p>
          ) : null}

          {proposals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Nessuna proposta Wikimedia trovata per questo POI.
            </p>
          ) : (
            <>
              {!hasImportableProposal ? (
                <p className="text-sm text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
                  Proposte presenti ma nessuna importabile (licenza o metadati Commons non idonei).
                </p>
              ) : null}
              {proposals.map((row) => {
              const proposal = row.proposal;
              const commonsUrl = proposal?.commonsFileTitle?.trim()
                ? buildCommonsFileDescriptionPageUrl(proposal.commonsFileTitle)
                : null;
              const disabled = isProcessing || !row.isImportable || !proposal;
              return (
                <article
                  key={row.candidate.qid}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row gap-4 ${
                    row.isBest
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  } ${!row.isImportable ? 'opacity-60' : ''}`}
                >
                  <div className="w-full sm:w-32 shrink-0 aspect-square rounded-lg overflow-hidden bg-black border border-slate-800">
                    {proposal?.commonsFileUrl ? (
                      <ImageWithFallback
                        src={proposal.commonsFileUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        Anteprima N/D
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{row.candidate.label}</span>
                      <span className="text-[10px] font-mono text-indigo-300">
                        {row.candidate.qid}
                      </span>
                      {row.isBest ? (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500 text-black">
                          Migliore
                        </span>
                      ) : null}
                      {row.license?.isCcBy40AutoPathEligible ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> CC BY 4.0
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {row.candidate.description ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Score {row.candidate.matchScore} · {row.validityNote}
                    </p>
                    {row.license?.blockingReasons?.length ? (
                      <p className="text-[10px] text-amber-300">
                        {row.license.blockingReasons.join(' · ')}
                      </p>
                    ) : null}
                    {proposal?.lookupNotes?.length ? (
                      <p className="text-[10px] text-slate-400">
                        Lookup: {proposal.lookupNotes.join(' · ')}
                      </p>
                    ) : null}
                    {row.license?.stepOutcomes?.length ? (
                      <ul className="text-[10px] text-slate-500 list-disc pl-4 space-y-0.5">
                        {row.license.stepOutcomes.map((step) => (
                          <li key={step.stepCode}>
                            {step.stepCode}: {step.outcome}
                            {step.rationale ? ` — ${step.rationale}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {commonsUrl ? (
                      <a
                        href={commonsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200"
                      >
                        Commons <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex sm:flex-col justify-end">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => proposal && onConfirm(proposal)}
                      className="min-h-11 px-4 py-2 rounded-xl text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Importa'
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
