import React from 'react';
import { Star, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { TemplateCategoryIcon, getTemplateColor } from './SuitcaseUtils';
import { Suitcase } from '@/types/suitcase';

interface TemplateRowProps {
  template: Suitcase;
  isSuggested: boolean;
  isPreferred: boolean;
  isDismissed?: boolean;
  isHovered: boolean;
  isCloning: boolean;
  onHover: () => void;
  onTogglePreference: () => void;
  onUse: () => void;
}
export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  isSuggested,
  isPreferred,
  isHovered,
  isCloning,
  onHover,
  onTogglePreference,
  onUse
}) => {
  const colorClass = getTemplateColor(template.title);

  const containerClass = [
    'flex items-stretch overflow-hidden rounded-xl border transition-all text-left group relative cursor-pointer outline-none min-h-0 shrink-0 w-full',
    isHovered && isSuggested
      ? 'bg-indigo-900/50 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      : isHovered
        ? 'bg-slate-800/40 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.1)]'
        : isSuggested
          ? 'bg-indigo-900/30 border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60',
  ].join(' ');

  return (
    <div
      role="option"
      aria-selected={isHovered}
      tabIndex={0}
      className={containerClass}
      onMouseEnter={onHover}
      onFocus={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); onUse(); }
        if (e.key === ' ') { e.preventDefault(); onHover(); }
      }}
    >
      {/* Colonna Sinistra/Comandi */}
      <div
        className={`w-[96px] shrink-0 flex flex-col border-r border-white/5 overflow-hidden
          bg-white/[0.03]
          ${isHovered ? 'bg-indigo-500/10' : ''}`}
      >
        {/* Icona */}
        <div className="flex items-center justify-center h-[58px]">
          <TemplateCategoryIcon template={template} className="text-[26px] leading-none flex items-center justify-center" />
        </div>

        {/* Toolbar bottoni */}
        <div className="flex border-t border-white/10 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePreference(); }}
            className={`flex-1 flex items-center justify-center h-[32px] border-r border-white/10 transition-all
              ${isPreferred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title={isPreferred ? "Rimuovi dai preferiti" : "Segna come preferito"}
          >
            <Star className={`w-4 h-4 ${isPreferred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onUse(); }}
            disabled={isCloning}
            className="flex-1 flex items-center justify-center h-[32px] text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50"
            title="Usa template"
          >
            {isCloning ? <Sparkles className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Colonna Destra: Contenuto Testuale (Suddivisa in Top/Bottom per allineamento perfetto con l'area bottoni) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* AREA TOP (Altezza icona): Centrata verticalmente */}
        <div className="flex-1 flex flex-col justify-center px-4 leading-tight min-h-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate">
              {template.title.replace(/^Template\s+/i, '')}
            </span>
            {isSuggested && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 shrink-0">
                Suggerito
              </span>
            )}
          </div>
          <div className="text-[9px] xl:text-[11px] text-slate-300 truncate">
            Template pronto all'uso
          </div>
        </div>

        {/* AREA BOTTOM (Altezza Toolbar bottoni: 32px): Allineata perfettamente */}
        <div className="h-[32px] flex items-center px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider">
            {template.suitcase_items?.length || 0} OGGETTI
          </div>
        </div>
      </div>
    </div>
  );
};
