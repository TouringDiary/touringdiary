import React from 'react';
import { Check } from 'lucide-react';
import type { WorkspaceCompositionCandidate } from '@/domain/collaboration/workspaceComposition';

function formatCompositionCatalogDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Presentazione metadata di un candidato catalogo (tipo, date, metadati futuri)
 * come stringa secondaria nella riga selezionabile.
 */
export function buildCompositionCandidateMetadata(
  kindLabel: string,
  candidate: WorkspaceCompositionCandidate,
  showDates: boolean
): string {
  if (!showDates) return kindLabel;

  const created = formatCompositionCatalogDate(candidate.createdAt);
  const updated = formatCompositionCatalogDate(candidate.updatedAt);
  const parts = [kindLabel];
  if (created) parts.push(`Creato: ${created}`);
  if (updated && updated !== created) parts.push(`Modificato: ${updated}`);
  return parts.join(' · ');
}

interface CompositionSelectableRowProps {
  selected: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  inputType: 'checkbox' | 'radio';
  name?: string;
  disabled?: boolean;
}

export const CompositionSelectableRow: React.FC<CompositionSelectableRowProps> = ({
  selected,
  title,
  subtitle,
  onClick,
  inputType,
  disabled = false,
}) => (
  <button
    type="button"
    role={inputType === 'radio' ? 'radio' : 'checkbox'}
    aria-checked={selected}
    aria-readonly={disabled && inputType === 'checkbox' ? true : undefined}
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
      disabled ? 'cursor-default opacity-90' : ''
    } ${
      selected
        ? 'border-indigo-500/60 bg-indigo-500/10'
        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
    }`}
  >
    <span
      aria-hidden
      className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
        inputType === 'radio' ? 'rounded-full' : 'rounded-md'
      } ${selected ? 'border-indigo-500 bg-indigo-600' : 'border-slate-600'}`}
    >
      {selected && <Check className="w-3 h-3 text-white" />}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-white truncate">{title}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{subtitle}</p>
    </div>
  </button>
);
