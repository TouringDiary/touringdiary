import React from 'react';
import { UserRound } from 'lucide-react';

interface Props {
  editorName?: string | null;
  className?: string;
}

/** §21 — indicazione discreta dell'ultimo autore di modifica in contesto collaborativo. */
export const CollaborationLastEditorLine: React.FC<Props> = ({ editorName, className = '' }) => {
  const name = editorName?.trim();
  if (!name) return null;

  return (
    <p className={`inline-flex items-center gap-1.5 text-[11px] text-slate-500 ${className}`}>
      <UserRound className="w-3 h-3 shrink-0" aria-hidden />
      <span>
        Ultima modifica di <span className="text-slate-400 font-medium">{name}</span>
      </span>
    </p>
  );
};
