import React from 'react';
import { Plus, Layout, Sparkles } from 'lucide-react';

interface DashboardActionGroupProps {
  isCreating: boolean;
  onCreateSuitcase: () => void;
  onCreateTemplate: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
}

export const DashboardActionGroup: React.FC<DashboardActionGroupProps> = ({
  isCreating,
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onCreateSuitcase}
        disabled={isCreating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Valigia</span>
      </button>

      {showRecommendedSuitcase && onOpenRecommendedSuitcase && (
        <button
          onClick={onOpenRecommendedSuitcase}
          disabled={isCreating}
          title="Genera una valigia basata sul diario di viaggio."
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 hover:text-white border border-indigo-400/30 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Valigia Consigliata</span>
        </button>
      )}

      <button
        onClick={onCreateTemplate}
        disabled={isCreating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
      >
        <Layout className="w-3.5 h-3.5" />
        <span>Template</span>
      </button>
    </div>
  );
};
