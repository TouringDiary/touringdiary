import React, { useMemo } from 'react';
import { TemplateCategoryIcon, getSuitcaseItemProgress } from './SuitcaseUtils';
import { Trash2, Wrench, CheckSquare, Copy, Eye } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Suitcase } from '@/types/suitcase';
import { formatItalianDateTime } from '@/utils/dateFormatters';

export type SuitcaseCardVariant = 'trip' | 'saved';
export type SuitcaseCardRemoveAction = 'delete' | 'unlink';

interface SuitcaseCardProps {
  suitcase: Suitcase;
  variant: SuitcaseCardVariant;
  /** Semantica del pulsante rimozione nella toolbar (default: elimina). */
  removeAction?: SuitcaseCardRemoveAction;
  isActive?: boolean;
  isLinked?: boolean;
  isCloning?: boolean;
  isDiaryAssociable?: boolean;
  currentUser?: User | null;
  onOpen: (id: string) => void;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAssociate?: (id: string) => void;
  onUnlink?: (id: string) => void;
  onMouseEnter?: () => void;
}

const actionBtnClass =
  'flex-1 flex items-center justify-center h-[32px] border-r border-white/10 transition-all last:border-r-0 cursor-pointer';

export const SuitcaseCard: React.FC<SuitcaseCardProps> = ({
  suitcase,
  variant,
  removeAction = 'delete',
  isActive,
  isLinked = false,
  isCloning = false,
  isDiaryAssociable = true,
  currentUser,
  onOpen,
  onView,
  onDelete,
  onDuplicate,
  onAssociate,
  onUnlink,
  onMouseEnter,
}) => {
  const isOwner =
    currentUser?.id === suitcase.user_id ||
    (!currentUser && (suitcase.user_id === 'guest' || suitcase.id.startsWith('guest-')));

  const progress = useMemo(
    () => getSuitcaseItemProgress(suitcase.suitcase_items),
    [suitcase.suitcase_items]
  );

  const showAssociateCta =
    variant === 'saved' && !!onAssociate && isOwner && !isLinked && isDiaryAssociable;

  const showLinkedBadge = variant === 'trip' && isLinked;

  const showAvailableBadge =
    variant === 'saved' && !isDiaryAssociable && !showAssociateCta && !showLinkedBadge;

  const showTopBadge = showAssociateCta || showLinkedBadge || showAvailableBadge;

  const topBadgeClass =
    'flex items-center justify-center h-6 w-full border-b border-white/10 text-[8px] xl:text-[9px] font-black uppercase tracking-widest';

  const removeLabels =
    removeAction === 'unlink'
      ? {
          title: 'Scollega dal diario',
          ariaLabel: 'Scollega valigia dal diario',
        }
      : {
          title: 'Elimina valigia',
          ariaLabel: 'Elimina valigia',
        };

  const handleView = () => onView(suitcase.id);

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleView();
    }
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      className={`flex items-stretch overflow-hidden rounded-xl border transition-all text-left group relative min-h-0 shrink-0 w-full ${
        isActive
          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.1)]'
          : 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60'
      }`}
    >
      <div
        className={`w-[96px] shrink-0 flex flex-col border-r border-white/5 overflow-hidden bg-white/[0.03] cursor-default ${
          isActive ? 'bg-indigo-500/10' : ''
        }`}
      >
        {showAssociateCta && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssociate!(suitcase.id);
            }}
            className={`relative group/cta ${topBadgeClass} bg-amber-600/90 hover:bg-amber-500 text-white transition-all cursor-pointer`}
            aria-label="Associa questa valigia al Diario"
          >
            ASSOCIA
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-950 border border-white/10 text-[10px] font-medium text-slate-200 whitespace-nowrap opacity-0 group-hover/cta:opacity-100 group-focus-visible/cta:opacity-100 transition-opacity duration-100 z-50 shadow-lg normal-case tracking-normal font-medium"
            >
              Associa questa valigia al Diario.
            </span>
          </button>
        )}

        {showLinkedBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnlink?.(suitcase.id);
            }}
            className={`${topBadgeClass} bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all cursor-pointer`}
            title="Scollega dal diario"
            aria-label="Valigia associata al diario — clicca per scollegare"
          >
            ASSOCIATA
          </button>
        )}

        {showAvailableBadge && (
          <div
            className={`${topBadgeClass} bg-amber-500 text-white cursor-default select-none`}
            aria-label="Valigia disponibile"
          >
            DISPONIBILE
          </div>
        )}

        <div
          className={`flex items-center justify-center shrink-0 cursor-default ${
            showTopBadge ? 'h-[34px]' : 'h-[58px]'
          }`}
        >
          <TemplateCategoryIcon
            template={suitcase}
            className="text-[26px] leading-none flex items-center justify-center"
          />
        </div>

        <div className="flex border-t border-white/10 mt-auto">
          {onDelete && isOwner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(suitcase.id);
              }}
              className={`${actionBtnClass} text-slate-400 hover:text-red-400 hover:bg-red-400/10`}
              title={removeLabels.title}
              aria-label={removeLabels.ariaLabel}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDuplicate && isOwner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(suitcase.id);
              }}
              disabled={isCloning}
              className={`${actionBtnClass} text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50`}
              title="Duplica valigia"
              aria-label="Duplica valigia"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(suitcase.id);
            }}
            className={`${actionBtnClass} text-slate-400 hover:text-white hover:bg-white/5`}
            title="Modifica valigia"
            aria-label="Modifica valigia"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleView}
        onKeyDown={handleContentKeyDown}
        onFocus={onMouseEnter}
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
          <span className="text-[13.5px] font-bold text-slate-100 group-hover:text-white truncate">
            {suitcase.title}
          </span>
          {suitcase.created_at && (
            <div className="text-[9px] xl:text-[11px] text-slate-300 tabular-nums leading-snug">
              Creato il: {formatItalianDateTime(suitcase.created_at)}
            </div>
          )}
          {suitcase.updated_at && suitcase.user_id && (
            <div className="text-[9px] xl:text-[11px] text-slate-300 tabular-nums leading-snug">
              Modificato il: {formatItalianDateTime(suitcase.updated_at)}
            </div>
          )}
        </div>

        <div className="h-[32px] flex items-center justify-between gap-2 px-4 border-t border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckSquare
              className={`w-3 h-3 shrink-0 ${
                progress.percentage === 100 ? 'text-emerald-500' : 'text-indigo-400'
              }`}
            />
            <span className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider tabular-nums">
              {progress.checked}/{progress.total}{' '}
              <span className="opacity-40 mx-0.5">•</span> {progress.percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
