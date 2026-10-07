import { AlertTriangle, Check, Minus, XCircle } from 'lucide-react';
import type { WikimediaCheckTone, WikimediaCheckView } from './wikimediaProposalCheckPresentation';

const TONE_CLASS: Record<WikimediaCheckTone, string> = {
  passed: 'text-emerald-300',
  review: 'text-amber-200',
  failed: 'text-red-300',
  not_applicable: 'text-slate-400',
};

function ToneMark({ tone }: { tone: WikimediaCheckTone }) {
  const className = `h-4 w-4 shrink-0 ${TONE_CLASS[tone]}`;
  if (tone === 'passed') return <Check className={className} aria-hidden />;
  if (tone === 'review') return <AlertTriangle className={className} aria-hidden />;
  if (tone === 'failed') return <XCircle className={className} aria-hidden />;
  return <Minus className={className} aria-hidden />;
}

export function WikimediaProposalCheckList({
  checks,
  showRationale = false,
  className,
  readable = false,
}: {
  checks: WikimediaCheckView[];
  showRationale?: boolean;
  className?: string;
  /** Un gradino della scala già usata: text-sm → text-base, motivazione text-xs → text-sm. */
  readable?: boolean;
}) {
  const rowText = readable ? 'text-base' : 'text-sm';
  const rationaleText = readable ? 'text-sm' : 'text-xs';
  return (
    <ul className={className ? `grid grid-cols-1 gap-2 ${className}` : 'space-y-2'}>
      {checks.map((item) => (
        <li key={item.id} className="min-w-0">
          <p className={`flex items-start gap-2 text-slate-200 ${rowText}`}>
            <ToneMark tone={item.tone} />
            <span>
              <span className="font-semibold">{item.label}</span>
              <span className={`ml-2 font-bold uppercase tracking-wide ${TONE_CLASS[item.tone]}`}>
                {item.statusLabel}
              </span>
            </span>
          </p>
          {showRationale && item.rationale ? (
            <p className={`mt-0.5 line-clamp-3 pl-6 text-slate-400 ${rationaleText}`}>
              {item.rationale}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
