import React from 'react';
import { Plus, Layout, Sparkles, type LucideIcon } from 'lucide-react';

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
    className={`relative group flex items-center justify-center p-2 rounded-xl transition-all disabled:opacity-50 ${className}`}
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
        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20"
      />

      {showRecommendedSuitcase && onOpenRecommendedSuitcase && (
        <IconActionButton
          label="Crea valigia consigliata"
          onClick={onOpenRecommendedSuitcase}
          disabled={isCreating}
          icon={Sparkles}
          className="bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 hover:text-white border border-indigo-400/30"
        />
      )}

      <IconActionButton
        label="Crea template"
        onClick={onCreateTemplate}
        disabled={isCreating}
        icon={Layout}
        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5"
      />
    </div>
  );
};
