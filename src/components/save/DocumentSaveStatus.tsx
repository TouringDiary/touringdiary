import React, { useEffect, useState } from 'react';
import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import { formatItalianDateTime, formatItalianTime } from '@/utils/dateFormatters';

interface DocumentSaveStatusProps {
  phase: DocumentSavePhase;
  lastSavedAt: number | null;
  lastError: string | null;
  isGuest: boolean;
  className?: string;
  /** Timestamp di fallback (es. updated_at dal server) quando lastSavedAt non è ancora impostato in sessione */
  fallbackSavedAt?: number | null;
  /** 'time' = solo ora; 'datetime' = data e ora complete */
  dateFormat?: 'time' | 'datetime';
  /** 'stacked' = etichetta e valore su righe separate (mobile header valigia) */
  layout?: 'inline' | 'stacked';
}

export const DocumentSaveStatus: React.FC<DocumentSaveStatusProps> = ({
  phase,
  lastSavedAt,
  lastError,
  isGuest,
  className = '',
  fallbackSavedAt = null,
  dateFormat = 'time',
  layout = 'inline',
}) => {
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const prevPhaseRef = React.useRef(phase);

  useEffect(() => {
    if (prevPhaseRef.current === 'saving' && phase === 'synced') {
      setShowSavedFlash(true);
      const t = setTimeout(() => setShowSavedFlash(false), 2500);
      return () => clearTimeout(t);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  if (isGuest) return null;

  let content: React.ReactNode = null;

  switch (phase) {
    case 'never_saved':
      // A brand-new document has never been modified — show nothing.
      // Only 'dirty' (explicit user change vs a saved baseline) deserves the warning badge.
      content = null;
      break;
    case 'dirty':
      content = (
        <span className="text-amber-400/90 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden />
          Modifiche non salvate
        </span>
      );
      break;
    case 'saving':
      content = (
        <span className="text-slate-300 flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-slate-500 border-t-indigo-400 rounded-full animate-spin" aria-hidden />
          Salvataggio...
        </span>
      );
      break;
    case 'synced':
      if (showSavedFlash) {
        content = (
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span aria-hidden>✓</span> Salvato
          </span>
        );
      } else {
        const displayTs = lastSavedAt ?? fallbackSavedAt;
        if (displayTs) {
          const formatted =
            dateFormat === 'datetime' ? formatItalianDateTime(displayTs) : formatItalianTime(displayTs);
          content =
            layout === 'stacked' ? (
              <>
                <span className="text-slate-500 whitespace-nowrap text-[1em] leading-[1.25]">
                  Ultimo salvataggio
                </span>
                <span className="text-slate-400 tabular-nums text-[1em] leading-[1.25]">{formatted}</span>
              </>
            ) : (
              <span className="text-slate-400 tabular-nums">
                Ultimo salvataggio {formatted}
              </span>
            );
        }
      }
      break;
    case 'error':
      content = (
        <span className="text-rose-400 flex items-center gap-1.5" title={lastError ?? undefined}>
          <span aria-hidden>⚠</span> Errore di salvataggio
        </span>
      );
      break;
  }

  if (!content) return null;

  return (
    <div
      className={`${
        layout === 'stacked'
          ? 'flex flex-col gap-0.5 normal-case tracking-normal'
          : 'text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {content}
    </div>
  );
};
