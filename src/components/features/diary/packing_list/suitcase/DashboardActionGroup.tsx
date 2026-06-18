import React from 'react';
import { Plus, Layout, Sparkles, type LucideIcon } from 'lucide-react';
import { SUITCASE_TOOLBAR_BTN_CLASS } from './SuitcaseUtils';

interface DashboardActionGroupProps {
  isCreating: boolean;
  onCreateSuitcase: () => void;
  onCreateTemplate: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
}

interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
  icon: LucideIcon;
}

/** Tooltip CSS immediato (evita il ritardo nativo dell'attributo title). */
const IconActionButton: React.FC<IconActionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  className,
  icon: Icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`relative group ${SUITCASE_TOOLBAR_BTN_CLASS} disabled:opacity-50 ${className}`}
  >
    <Icon className="w-4 h-4" aria-hidden />
    <span
      role="tooltip"
      className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-950 border border-white/10 text-[10px] font-medium text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-100 z-floating-panel shadow-lg"
    >
      {label}
    </span>
  </button>
);

export const DashboardActionGroup: React.FC<DashboardActionGroupProps> = ({
  isCreating,
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
}) => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <IconActionButton
        label="Crea valigia"
        onClick={onCreateSuitcase}
        disabled={isCreating}
        icon={Plus}
        className="bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500/40"
      />

      {showRecommendedSuitcase && onOpenRecommendedSuitcase && (
        <IconActionButton
          label="Crea valigia personalizzata"
          onClick={onOpenRecommendedSuitcase}
          disabled={isCreating}
          icon={Sparkles}
          className="bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500/40"
        />
      )}

      <IconActionButton
        label="Crea template"
        onClick={onCreateTemplate}
        disabled={isCreating}
        icon={Layout}
        className="bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/15"
      />
    </div>
  );
};
