import { Info } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { WIKIMEDIA_CHECK_LEGEND } from './wikimediaProposalCheckPresentation';

/** ⓘ sulla riga delle proposte: stesso popover ancorato degli aiuti già presenti. */
export function WikimediaChecksInfoButton() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        aria-label="Controlli Wikimedia: significato e verifica admin"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <AnchoredPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align="right"
        role="dialog"
        aria-labelledby={titleId}
        className="max-h-[min(24rem,70vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-xs leading-relaxed text-slate-200 shadow-xl"
      >
        <div id={panelId}>
          <p id={titleId} className="font-bold uppercase tracking-wide text-slate-300">
            Controlli Wikimedia
          </p>
          <dl className="mt-2 space-y-2">
            {WIKIMEDIA_CHECK_LEGEND.map((item) => (
              <div key={item.label}>
                <dt className="font-semibold text-slate-100">{item.label}</dt>
                <dd>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </AnchoredPopover>
    </>
  );
}
