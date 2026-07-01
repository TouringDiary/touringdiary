import React from 'react';
import { Plus, Layout, Sparkles, Loader2, type LucideIcon } from 'lucide-react';
import { SUITCASE_TOOLBAR_BTN_CLASS } from './SuitcaseUtils';

interface DashboardActionGroupProps {
  isCreating: boolean;
  onCreateSuitcase: () => void;
  onCreateTemplate: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
  /**
   * Versione leggermente più piccola SOLO su mobile (< sm); da `sm` in su torna identica
   * all'originale, così tablet e desktop restano invariati. Usata nell'header selector mobile.
   */
  compact?: boolean;
}

export interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Mostra un loader animato al posto dell'icona durante un'operazione asincrona. */
  loading?: boolean;
  className: string;
  icon: LucideIcon;
  /** Riduce leggermente padding/icona solo su mobile (< sm). */
  compact?: boolean;
}

/**
 * Variante compatta SOLO mobile del pulsante toolbar: rispecchia SUITCASE_TOOLBAR_BTN_CLASS
 * ma con padding/gap ridotti sotto `sm`; da `sm` in su i valori coincidono con l'originale.
 */
const SUITCASE_TOOLBAR_BTN_COMPACT_CLASS =
  'flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed';

/** Varianti colore condivise per gli IconActionButton (identità unica del Design System). */
export const ICON_ACTION_INDIGO_CLASS =
  'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500/40';
export const ICON_ACTION_SLATE_CLASS =
  'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/15';
export const ICON_ACTION_AMBER_CLASS =
  'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500/40';
export const ICON_ACTION_DANGER_CLASS =
  'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-500/40';

/** Variante piena arancione per l'azione primaria (coerente col CTA brand). */
export const ICON_ACTION_AMBER_SOLID_CLASS =
  'bg-amber-600 border-amber-500 text-white hover:bg-amber-500 shadow-md';

/** Tooltip CSS immediato (evita il ritardo nativo dell'attributo title). */
export const IconActionButton: React.FC<IconActionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  loading = false,
  className,
  icon: Icon,
  compact = false,
}) => {
  const baseBtnClass = compact ? SUITCASE_TOOLBAR_BTN_COMPACT_CLASS : SUITCASE_TOOLBAR_BTN_CLASS;
  const iconSizeClass = compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4';
  return (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={label}
    className={`relative group ${baseBtnClass} disabled:opacity-50 ${className}`}
  >
    {loading ? <Loader2 className={`${iconSizeClass} animate-spin`} aria-hidden /> : <Icon className={iconSizeClass} aria-hidden />}
    <span
      role="tooltip"
      className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-950 border border-white/10 text-[10px] font-medium text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-100 z-local-overlay shadow-lg"
    >
      {label}
    </span>
  </button>
  );
};

export const DashboardActionGroup: React.FC<DashboardActionGroupProps> = ({
  isCreating,
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
  compact = false,
}) => {
  return (
    <div className={`flex items-center ${compact ? 'gap-1.5 sm:gap-2' : 'gap-2'} shrink-0`}>
      <IconActionButton
        label="Crea valigia"
        onClick={onCreateSuitcase}
        disabled={isCreating}
        icon={Plus}
        className={ICON_ACTION_INDIGO_CLASS}
        compact={compact}
      />

      {showRecommendedSuitcase && onOpenRecommendedSuitcase && (
        <IconActionButton
          label="Crea Valigia Personalizzata"
          onClick={onOpenRecommendedSuitcase}
          disabled={isCreating}
          icon={Sparkles}
          className={ICON_ACTION_AMBER_CLASS}
          compact={compact}
        />
      )}

      <IconActionButton
        label="Crea template"
        onClick={onCreateTemplate}
        disabled={isCreating}
        icon={Layout}
        className={ICON_ACTION_SLATE_CLASS}
        compact={compact}
      />
    </div>
  );
};
