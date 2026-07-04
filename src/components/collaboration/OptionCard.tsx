import React from 'react';
import { Check } from 'lucide-react';

export interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onSelect,
  title,
  description,
  icon,
  recommended = false,
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full text-left p-4 rounded-xl border transition-all ${
      selected
        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
        : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500/40 hover:bg-slate-800/60'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-indigo-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-bold text-white text-sm">{title}</div>
          {recommended && (
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Consigliato
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
      {selected && <Check className="w-4 h-4 text-indigo-400 ml-auto shrink-0" />}
    </div>
  </button>
);
