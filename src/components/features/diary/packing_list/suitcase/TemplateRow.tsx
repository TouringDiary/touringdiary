import React from 'react';
import { Star, Sparkles, Trash2, Edit2, Copy, Eye } from 'lucide-react';
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
  onView: () => void;
  onTogglePreference: () => void;
  onUse: () => void;
  onOpen?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  isSuggested,
  isPreferred,
  isHovered,
  isCloning,
  onHover,
  onView,
  onTogglePreference,
  onUse,
  onOpen,
  onDuplicate,
  onDelete,
}) => {
  const isTd = isTdTemplate(template);
  const isUser = isUserTemplate(template);

  const containerClass = [
    'flex items-stretch overflow-hidden rounded-xl border transition-all text-left group relative outline-none min-h-0 shrink-0 w-full',
    isHovered && isSuggested
      ? 'bg-indigo-900/50 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      : isHovered
        ? 'bg-slate-800/40 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.1)]'
        : isSuggested
          ? 'bg-indigo-900/30 border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60',
  ].join(' ');

  const actionBtnClass =
    'flex-1 flex items-center justify-center h-[32px] border-r border-white/10 transition-all last:border-r-0 cursor-pointer';

  const handleContentClick = () => {
    onView();
  };

  // Accessibilità: Enter e Space aprono la visualizzazione (parte destra della card).
  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleContentClick();
    }
  };

  return (
    <div
      role="option"
      aria-selected={isHovered}
      className={containerClass}
      onMouseEnter={onHover}
    >
      <div
        className={`w-[96px] shrink-0 flex flex-col border-r border-white/5 overflow-hidden bg-white/[0.03] cursor-default ${
          isHovered ? 'bg-indigo-500/10' : ''
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
          disabled={isCloning}
          className="relative group/usa flex items-center justify-center h-6 w-full border-b border-white/10 bg-indigo-600/90 hover:bg-indigo-500 text-white text-[8px] xl:text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          title="Usa template"
          aria-label="Usa template"
        >
          {isCloning ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'USA'}
        </button>

        <div className="flex items-center justify-center h-[34px] shrink-0 cursor-default">
          <TemplateCategoryIcon
            template={template}
            className="text-[26px] leading-none flex items-center justify-center"
          />
        </div>

        <div className="flex border-t border-white/10 mt-auto">
          {isTd && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePreference();
                }}
                className={`${actionBtnClass} ${
                  isPreferred
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
                title={isPreferred ? 'Rimuovi dai preferiti' : 'Segna come preferito'}
                aria-label={isPreferred ? 'Rimuovi dai preferiti' : 'Segna come preferito'}
              >
                <Star className={`w-3.5 h-3.5 ${isPreferred ? 'fill-amber-400' : ''}`} />
              </button>
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  disabled={isCloning}
                  className={`${actionBtnClass} text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50`}
                  title="Duplica come template personale"
                  aria-label="Duplica come template personale"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {isUser && (
            <>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className={`${actionBtnClass} text-slate-500 hover:text-red-400 hover:bg-red-400/10`}
                  title="Elimina template"
                  aria-label="Elimina template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  disabled={isCloning}
                  className={`${actionBtnClass} text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50`}
                  title="Duplica template"
                  aria-label="Duplica template"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              {onOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  className={`${actionBtnClass} text-slate-400 hover:text-white hover:bg-white/5`}
                  title="Modifica template"
                  aria-label="Modifica template"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleContentClick}
        onKeyDown={handleContentKeyDown}
        onFocus={onHover}
        className="flex-1 flex flex-col min-w-0 relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-r-xl group/content"
      >
        <div
          className="absolute top-2 right-2 z-10 flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900/70 border border-white/10 text-slate-400 opacity-70 group-hover/content:opacity-100 group-hover/content:text-indigo-300 transition-all pointer-events-none"
          title="Clicca per visualizzare"
          aria-hidden
        >
          <Eye className="w-4 h-4" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 leading-tight min-h-0">
          <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate pr-9">
            {template.title.replace(/^Template\s+/i, '')}
          </span>
          <div
            className={`grid items-center min-w-0 mt-0.5 ${
              isSuggested ? 'grid-cols-[auto_1fr]' : 'grid-cols-1'
            }`}
          >
            <span className="text-[9px] xl:text-[11px] text-slate-300 font-bold uppercase tracking-widest truncate">
              {isUser ? 'TEMPLATE PERSONALE' : 'TEMPLATE PRONTO ALL\'USO'}
            </span>
            {isSuggested && (
              <div className="flex justify-center items-center min-w-0 px-1">
                <span className="inline-flex items-center justify-center leading-none min-h-[1rem] px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-100 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-violet-400/50 shrink-0 animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.35)]">
                  Suggerito
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[32px] flex items-center justify-between px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider">
            {template.suitcase_items?.length || 0} OGGETTI
          </div>
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
        </div>
      </div>
    </div>
  );
};
