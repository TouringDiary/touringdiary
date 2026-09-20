import { AlertTriangle, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

function useDialogFocusTrap(
  active: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  isProcessing: boolean,
): void {
  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      if (!dialog || isProcessing) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length > 0) focusable[0].focus();
      else dialog.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog || isProcessing) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, dialogRef, isProcessing]);
}

import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import type {
  WikidataCandidate,
  WikidataP18Proposal,
} from '@/services/wikimedia/wikidataLookupService';

export type WikidataConfirmModalProps = {
  isOpen: boolean;
  subjectLabel: string;
  proposal: WikidataP18Proposal | null;
  ambiguousCandidates?: WikidataCandidate[];
  isProcessing?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (proposal: WikidataP18Proposal) => void;
  onSelectCandidate?: (candidate: WikidataCandidate) => void;
  onSkip: () => void;
};

export const WikidataConfirmModal = ({
  isOpen,
  subjectLabel,
  proposal,
  ambiguousCandidates = [],
  isProcessing = false,
  errorMessage,
  onClose,
  onConfirm,
  onSelectCandidate,
  onSkip,
}: WikidataConfirmModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else if (openerRef.current) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  useDialogFocusTrap(isOpen, dialogRef, Boolean(isProcessing));

  useEffect(() => {
    if (!isOpen || isProcessing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const showAmbiguous = !proposal && ambiguousCandidates.length > 0;

  return (
    <div className="fixed inset-0 z-admin-modal flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-base font-black uppercase tracking-wide text-white">
              Conferma Wikidata / Commons
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Soggetto: <span className="font-semibold text-slate-200">{subjectLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-100">
            <div className="mb-1 flex items-center gap-2 font-bold uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Conferma identità ≠ verifica licenza
            </div>
            Confermando il Q-id e il file P18 avvii solo la fase successiva (metadati Commons e
            checklist licenza). Nessuna pubblicazione automatica senza verifica conservativa (D79).
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
              {errorMessage}
            </p>
          ) : null}

          {showAmbiguous ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Seleziona l&apos;elemento Wikidata corretto
              </p>
              <ul className="space-y-2">
                {ambiguousCandidates.map((candidate) => (
                  <li key={candidate.qid}>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => onSelectCandidate?.(candidate)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-left text-xs hover:border-indigo-500/50 hover:bg-slate-900 disabled:opacity-50"
                    >
                      <div className="font-bold text-white">
                        {candidate.label}{' '}
                        <span className="font-mono text-indigo-300">({candidate.qid})</span>
                      </div>
                      {candidate.description ? (
                        <div className="mt-1 text-slate-400">{candidate.description}</div>
                      ) : null}
                      <div className="mt-1 text-[10px] text-slate-500">
                        Affinità score: {candidate.matchScore}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {proposal ? (
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
                {proposal.commonsFileUrl ? (
                  <ImageWithFallback
                    src={proposal.commonsFileUrl}
                    alt={proposal.commonsFileTitle}
                    className="h-36 w-full object-cover sm:h-40"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center text-[10px] text-slate-500 sm:h-40">
                    Anteprima non disponibile
                  </div>
                )}
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="font-bold uppercase text-slate-500">Q-id</dt>
                  <dd className="font-mono text-indigo-300">{proposal.qid}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-slate-500">Etichetta Wikidata</dt>
                  <dd className="text-slate-200">{proposal.qLabel}</dd>
                </div>
                {proposal.qDescription ? (
                  <div>
                    <dt className="font-bold uppercase text-slate-500">Descrizione</dt>
                    <dd className="text-slate-300">{proposal.qDescription}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-bold uppercase text-slate-500">P18 / Commons</dt>
                  <dd className="break-all font-mono text-slate-200">
                    {proposal.commonsFileTitle}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-slate-500">Confidenza discovery</dt>
                  <dd className="text-slate-300">{proposal.confidence}</dd>
                </div>
                {proposal.lookupNotes.length > 0 ? (
                  <div>
                    <dt className="font-bold uppercase text-slate-500">Note lookup</dt>
                    <dd className="text-slate-400">{proposal.lookupNotes.join(' · ')}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {proposal ? (
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600"
              />
              <span>
                Confermo esplicitamente che il Q-id e il file P18 proposti corrispondono al soggetto
                «{subjectLabel}» e autorizzo la verifica Commons/licenza (non la pubblicazione
                automatica).
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onSkip}
            disabled={isProcessing}
            className="min-h-11 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Salta (no Wikimedia)
          </button>
          {proposal ? (
            <button
              type="button"
              disabled={!acknowledged || isProcessing}
              onClick={() => onConfirm(proposal)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              Conferma e verifica Commons
            </button>
          ) : null}
          {proposal?.commonsFileUrl ? (
            <a
              href={proposal.commonsFileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Apri Commons
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};
