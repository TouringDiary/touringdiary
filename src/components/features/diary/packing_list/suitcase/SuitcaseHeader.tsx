import React from 'react';
import { Edit2, Trash2, ChevronLeft, Link2, Layout, Undo2, Redo2, CloudOff, CalendarDays, Clock3 } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Suitcase } from '@/types/suitcase';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';
import { isSessionReadOnly } from '@/utils/suitcaseDomain';
import type { SuitcasePanelViewMode } from '../SuitcaseFloatingPanel/types/panelViewMode';

const formatSuitcaseDateTime = (iso: string) =>
  new Date(iso)
    .toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '');

interface SuitcaseHeaderProps {
  viewMode: SuitcasePanelViewMode;
  activeSuitcase: Suitcase | null;
  isEditingTitle: boolean;
  tempTitle: string;
  titleInputRef: React.RefObject<HTMLInputElement>;
  checkedCount: number;
  totalCount: number;
  progressPerc: number;
  saveStatus: string | null;
  isLinkedToItinerary: boolean;
  isDiaryAssociable?: boolean;
  isAssociable?: boolean;
  onEditTitle: () => void;
  onSaveTitle: () => void;
  onTitleChange: (val: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onUnlink: () => void;
  onLink?: () => void;
  onBackToSelector: () => void;
  performUndo: () => Promise<boolean>;
  performRedo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
}

export const SuitcaseHeader: React.FC<SuitcaseHeaderProps> = ({
  viewMode,
  activeSuitcase,
  isEditingTitle,
  tempTitle,
  titleInputRef,
  checkedCount,
  totalCount,
  progressPerc,
  saveStatus,
  isLinkedToItinerary,
  isDiaryAssociable = true,
  isAssociable = true,
  onEditTitle,
  onSaveTitle,
  onTitleChange,
  onClose,
  onDelete,
  onUnlink,
  onLink,
  onBackToSelector,
  performUndo,
  performRedo,
  canUndo,
  canRedo
}) => {
  const isDetailView = viewMode === 'editor' || viewMode === 'viewer';
  const isReadOnlySession =
    isDetailView && activeSuitcase
      ? isSessionReadOnly(activeSuitcase, viewMode)
      : false;

  return (
    <div className="flex flex-col shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 z-header relative">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 md:px-6 h-20 md:h-24 w-full gap-2 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 justify-self-start">
          {isDetailView ? (
            <button 
              onClick={onBackToSelector}
              className="p-2.5 -ml-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all group"
              title="Torna alla selezione"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <Layout className="w-6 h-6" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            {isDetailView && activeSuitcase ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 md:gap-4 flex-wrap min-w-0 w-full">
                  <div className="flex items-center gap-2 group min-w-0 flex-1">
                    <TemplateCategoryIcon 
                      template={activeSuitcase} 
                      className="text-2xl md:text-3xl shrink-0 flex items-center justify-center" 
                    />
                    {isEditingTitle && !isReadOnlySession ? (
                      <input
                        ref={titleInputRef}
                        value={tempTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={onSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
                        className="bg-slate-800 border border-indigo-500/50 rounded-lg px-3 py-1 text-base md:text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full max-w-[200px] md:max-w-[400px]"
                        autoFocus
                      />
                    ) : (
                      <h2 
                        onClick={isReadOnlySession ? undefined : onEditTitle}
                        className={`text-base md:text-2xl font-bold text-slate-50 truncate flex items-center gap-2 min-w-0 ${
                          isReadOnlySession ? '' : 'cursor-pointer hover:text-indigo-400 transition-colors'
                        }`}
                      >
                        {activeSuitcase.title}
                        {!isReadOnlySession && (
                          <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
                        )}
                      </h2>
                    )}
                  </div>
                </div>

                {activeSuitcase.created_at && (
                  <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-3 md:gap-4 text-[10px] font-semibold text-slate-300 tabular-nums ml-1">
                    <span className="flex items-center gap-1.5">
                      <span title="Data creazione">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden />
                      </span>
                      <span>{formatSuitcaseDateTime(activeSuitcase.created_at)}</span>
                    </span>
                    {activeSuitcase.updated_at && (
                      <span className="flex items-center gap-1.5">
                        <span title="Ultima modifica">
                          <Clock3 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden />
                        </span>
                        <span>{formatSuitcaseDateTime(activeSuitcase.updated_at)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">Le mie Valigie</h2>
            )}
            
            {!isDetailView && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Gestione bagagli e template
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="justify-self-center shrink-0 px-1 flex md:hidden">
          {isDetailView && activeSuitcase ? (
            <SuitcaseToolbarProgressBox
              checkedCount={checkedCount}
              totalCount={totalCount}
              progressPerc={progressPerc}
              variant="header"
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:gap-3 justify-self-end shrink-0 md:col-start-3">
          {isDetailView && activeSuitcase && viewMode === 'editor' && !isReadOnlySession && (
            <>
              {isLinkedToItinerary ? (
                <button
                  onClick={onUnlink}
                  className="flex items-center gap-0 md:gap-2 p-2.5 md:px-4 md:py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-all group shadow-lg shadow-emerald-500/5"
                  title="Scollega dal diario"
                  aria-label="Scollega dal diario"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Sincronizzato</span>
                </button>
              ) : onLink && isAssociable ? (
                <button
                  onClick={onLink}
                  disabled={!isDiaryAssociable}
                  className={`flex items-center gap-0 md:gap-2 p-2.5 md:px-4 md:py-2 rounded-xl border border-white/10 transition-all shadow-lg ${
                    isDiaryAssociable
                      ? 'bg-slate-800 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20'
                      : 'bg-slate-800/50 text-slate-600 opacity-50 cursor-not-allowed'
                  }`}
                  title={
                    isDiaryAssociable
                      ? 'Collega al diario'
                      : 'Completa date e almeno una tappa nel diario per associare'
                  }
                  aria-label={
                    isDiaryAssociable
                      ? 'Collega al diario'
                      : 'Completa date e almeno una tappa nel diario per associare'
                  }
                >
                  <Link2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Collega</span>
                </button>
              ) : onLink && !isAssociable ? (
                <div
                  className="flex items-center gap-2 p-2.5 md:px-4 md:py-2 rounded-xl bg-slate-800/50 border border-white/10"
                  title="I template non possono essere collegati al diario"
                >
                  <Layout className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline">
                    Template · Non associabile
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 md:px-4 md:py-2 rounded-xl bg-slate-800/50 border border-white/10">
                  <CloudOff className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline">Offline</span>
                </div>
              )}

              <div className="flex items-center rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={performUndo}
                  disabled={!canUndo}
                  className={`p-2.5 transition-all ${canUndo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
                  title="Annulla (Ctrl+Z)"
                  aria-label="Annulla"
                >
                  <Undo2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="w-px self-stretch bg-white/10 shrink-0" aria-hidden />
                <button
                  type="button"
                  onClick={performRedo}
                  disabled={!canRedo}
                  className={`p-2.5 transition-all ${canRedo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
                  title="Ripristina (Ctrl+Y)"
                  aria-label="Ripristina"
                >
                  <Redo2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <button
                onClick={onDelete}
                className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 transition-all shadow-lg"
                title="Elimina valigia"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </>
          )}

          {saveStatus && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mr-2 shadow-lg shadow-emerald-500/5">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{saveStatus}</span>
            </div>
          )}

          <CloseButton onClose={onClose} variant="primary" />
        </div>
      </div>
    </div>
  );
};
