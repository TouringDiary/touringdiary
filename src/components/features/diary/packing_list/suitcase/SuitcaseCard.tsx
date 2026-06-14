import React, { useState, useCallback, useMemo } from 'react';
import { TemplateCategoryIcon, getSuitcaseItemProgress } from './SuitcaseUtils';
import { Trash2, Edit2, CheckSquare, Layout } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Suitcase } from '@/types/suitcase';
import { isAssociableSuitcase } from '@/utils/suitcaseDomain';

interface SuitcaseCardProps {
  suitcase: Suitcase;
  isActive?: boolean;
  isLinked?: boolean;
  onClick: (id: string) => void;
  onLink?: (id: string) => void;
  isDiaryAssociable?: boolean;
  onUnlink?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSaveTitle?: (id: string, title: string) => Promise<void>;
  onSaveAsTemplate?: (id: string) => void;
  currentUser?: User | null;
  onMouseEnter?: () => void;
}

export const SuitcaseCard: React.FC<SuitcaseCardProps> = ({
  suitcase,
  isActive,
  isLinked,
  onClick,
  onLink,
  isDiaryAssociable = true,
  onUnlink,
  onDelete,
  onSaveTitle,
  onSaveAsTemplate,
  currentUser,
  onMouseEnter
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  const isOwner = 
    (currentUser?.id === suitcase.user_id) || 
    (!currentUser && (suitcase.user_id === 'guest' || suitcase.id.startsWith('guest-')));

  const canEditTitle = !!onSaveTitle && isOwner && !!suitcase.user_id;
  const canLink = !!onLink && isAssociableSuitcase(suitcase);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTitle(suitcase.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = useCallback(async () => {
    if (!onSaveTitle) {
      setIsEditingTitle(false);
      return;
    }
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setIsEditingTitle(false);
      return;
    }
    if (trimmed !== suitcase.title) {
      await onSaveTitle(suitcase.id, trimmed);
    }
    setIsEditingTitle(false);
  }, [onSaveTitle, suitcase.id, suitcase.title, draftTitle]);

  const progress = useMemo(
    () => getSuitcaseItemProgress(suitcase.suitcase_items),
    [suitcase.suitcase_items]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !isEditingTitle && onClick(suitcase.id)}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (isEditingTitle) return;
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

          {onSaveAsTemplate && isOwner && isAssociableSuitcase(suitcase) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveAsTemplate(suitcase.id);
              }}
              className="flex-1 flex items-center justify-center h-[32px]
                   border-r border-white/10
                   text-slate-400 hover:text-emerald-400
                   hover:bg-emerald-400/10 transition-all"
              title="Salva come template"
            >
              <Layout className="w-4 h-4" />
            </button>
          )}

          {onLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLink(suitcase.id);
              }}
              disabled={isLinked || !isDiaryAssociable || !canLink}
              title={
                !canLink
                  ? 'I template non possono essere associati al diario'
                  : !isDiaryAssociable
                    ? 'Completa date e almeno una tappa nel diario per associare'
                    : undefined
              }
              className={`flex-1 flex items-center justify-center h-[32px]
                   text-[10px] xl:text-[12px] font-black uppercase tracking-tight
                   transition-all ${
                     isLinked || !isDiaryAssociable || !canLink
                       ? 'text-slate-600 opacity-50 cursor-not-allowed'
                       : 'text-indigo-400 hover:bg-indigo-500/10'
                   }`}
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
          <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
            {isEditingTitle ? (
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSaveTitle();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-indigo-500/50 rounded-lg px-2 py-0.5 text-[13.5px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full min-w-0 max-w-full"
                autoFocus
              />
            ) : (
              <>
                <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate min-w-0 flex-1">
                  {suitcase.title}
                </span>
                {canEditTitle && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="p-0.5 rounded-md text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                    title="Modifica nome valigia"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
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

        </div>

        {/* AREA BOTTOM (Altezza Toolbar bottoni: 32px): Progress */}
        <div className="h-[32px] flex items-center justify-between gap-2 px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckSquare className={`w-3 h-3 shrink-0 ${progress.percentage === 100 ? 'text-emerald-500' : 'text-indigo-400'}`} />
            <span className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider tabular-nums">
              {progress.checked}/{progress.total} <span className="opacity-40 mx-0.5">•</span> {progress.percentage}%
            </span>
          </div>
          {isLinked && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
