import React from 'react';
import { Star, ArrowRight, Sparkles, Trash2 } from 'lucide-react';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { Suitcase } from '@/types/suitcase';
import { isTdTemplate, isUserTemplate } from '@/utils/suitcaseDomain';

interface TemplateRowProps {
  template: Suitcase;
  isSuggested: boolean;
  isPreferred: boolean;
  isHovered: boolean;
  isCloning: boolean;
  onHover: () => void;
  onTogglePreference: () => void;
  onUse: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
}
export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  isSuggested,
  isPreferred,
  isHovered,
  isCloning,
  onHover,
  onTogglePreference,
  onUse,
  onOpen,
  onDelete,
}) => {
  const isTd = isTdTemplate(template);
  const isUser = isUserTemplate(template);

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

  const handleRowClick = () => {
    if (isUser && onOpen) {
      onOpen();
      return;
    }
    onUse();
  };

  return (
    <div
      role="option"
      aria-selected={isHovered}
      tabIndex={0}
      className={containerClass}
      onClick={handleRowClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); handleRowClick(); }
        if (e.key === ' ') { e.preventDefault(); onHover(); }
      }}
    >
      <div
        className={`w-[96px] shrink-0 flex flex-col border-r border-white/5 overflow-hidden
          bg-white/[0.03]
          ${isHovered ? 'bg-indigo-500/10' : ''}`}
      >
        <div className="flex items-center justify-center h-[58px]">
          <TemplateCategoryIcon template={template} className="text-[26px] leading-none flex items-center justify-center" />
        </div>

        <div className="flex border-t border-white/10 mt-auto">
          {isTd && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePreference(); }}
              className={`flex-1 flex items-center justify-center h-[32px] border-r border-white/10 transition-all
                ${isPreferred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              title={isPreferred ? "Rimuovi dai preferiti" : "Segna come preferito"}
            >
              <Star className={`w-4 h-4 ${isPreferred ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {isUser && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex-1 flex items-center justify-center h-[32px] border-r border-white/10 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Elimina template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col justify-center px-4 leading-tight min-h-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate">
              {template.title.replace(/^Template\s+/i, '')}
            </span>
            {isTd && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 shrink-0">
                TD
              </span>
            )}
            {isUser && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 shrink-0">
                USER
              </span>
            )}
            {isSuggested && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 shrink-0">
                Suggerito
              </span>
            )}
          </div>
          <div className="text-[9px] xl:text-[11px] text-slate-300 font-bold uppercase tracking-widest truncate">
            {isUser ? 'TEMPLATE PERSONALE' : 'TEMPLATE PRONTO ALL\'USO'}
          </div>
        </div>

        <div className="h-[32px] flex items-center px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider">
            {template.suitcase_items?.length || 0} OGGETTI
          </div>
        </div>
      </div>
    </div>
  );
};
