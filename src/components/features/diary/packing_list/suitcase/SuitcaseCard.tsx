import React from 'react';
import { TemplateCategoryIcon, getTemplateColor } from './SuitcaseUtils';
import { Eye, Unlink, Trash2 } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';

interface SuitcaseCardProps {
  suitcase: Suitcase;
  isActive?: boolean;
  isLinked?: boolean;
  onClick: (id: string) => void;
  onLink?: (id: string) => void;
  onUnlink?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUser?: any;
  badge?: string;
  onMouseEnter?: () => void;
}

export const SuitcaseCard: React.FC<SuitcaseCardProps> = ({
  suitcase,
  isActive,
  isLinked,
  onClick,
  onLink,
  onUnlink,
  onDelete,
  currentUser,
  badge,
  onMouseEnter
}) => {
  const isOwner = 
    (currentUser?.id === suitcase.user_id) || 
    (!currentUser && (suitcase.user_id === 'guest' || suitcase.id.startsWith('guest-')));

  const categoryColor = getTemplateColor(suitcase.title);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(suitcase.id)}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(suitcase.id);
        }
      }}
      className={`flex items-stretch overflow-hidden rounded-xl border transition-all text-left group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-0 shrink-0 w-full ${isActive
        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.1)]'
        : 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60'
        }`}
    >
      {/* Colonna Sinistra/Comandi */}
      <div
        className={`w-[96px] shrink-0 flex flex-col border-r border-white/5 overflow-hidden
  bg-white/[0.03]
  ${isActive ? 'bg-indigo-500/10' : ''}`}
      >
        {/* Icona */}
        <div className="flex items-center justify-center h-[58px]">
          <TemplateCategoryIcon template={suitcase} className="text-[26px] leading-none flex items-center justify-center" />
        </div>

        {/* Toolbar bottoni */}
        <div className="flex border-t border-white/10 mt-auto">
          {onDelete && isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(suitcase.id);
              }}
              className="flex-1 flex items-center justify-center h-[32px]
                   border-r border-white/10
                   text-slate-400 hover:text-red-400
                   hover:bg-red-400/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLink(suitcase.id);
              }}
              disabled={isLinked}
              className="flex-1 flex items-center justify-center h-[32px]
                   text-indigo-400 hover:bg-indigo-500/10
                   text-[10px] xl:text-[12px] font-black uppercase tracking-tight
                   transition-all"
            >
              {isLinked ? '✓' : 'Scegli'}
            </button>
          )}
        </div>
      </div>

      {/* Colonna Destra: Contenuto Testuale (Suddivisa in Top/Bottom per allineamento perfetto con l'area bottoni) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* AREA TOP: Centrata verticalmente (Altezza icona 58px) */}
        <div className="flex-1 flex flex-col justify-center px-4 leading-tight min-h-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate">
              {suitcase.title}
            </span>
            {isLinked && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </div>

          {/* Date / Sottotitoli */}
          {suitcase.created_at && (
            <div className="text-[9px] xl:text-[11px] text-slate-300 truncate">
              Creato il: {new Date(suitcase.created_at).toLocaleDateString('it-IT')}
            </div>
          )}
          {suitcase.updated_at && suitcase.user_id && (
            <div className="text-[9px] xl:text-[11px] text-slate-300 truncate">
              Modificato il: {new Date(suitcase.updated_at).toLocaleDateString('it-IT')}
            </div>
          )}

          {/* Status badges shifted slightly to keep height contained */}
          <div className="mt-1 flex items-center gap-1.5">
            {isLinked && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                In uso
              </span>
            )}
            {badge && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] xl:text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                {badge}
              </span>
            )}
          </div>
        </div>

        {/* AREA BOTTOM (Altezza Toolbar bottoni: 32px): Allineata perfettamente */}
        <div className="h-[32px] flex items-center px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider">
            {suitcase.suitcase_items?.length || 0} OGGETTI
          </div>
        </div>
      </div>
    </div>
  );
};
