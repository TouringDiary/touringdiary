import React from 'react';
import { Edit2, Trash2, ChevronLeft, Unlink, Link2, Layout, Undo2, Redo2, CloudOff, Calendar, Clock, CheckSquare, Plus } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Suitcase } from '@/types/suitcase';
import { TemplateCategoryIcon } from './SuitcaseUtils';

interface SuitcaseHeaderProps {
  viewMode: 'selector' | 'editor';
  activeSuitcase: Suitcase | null;
  isEditingTitle: boolean;
  tempTitle: string;
  titleInputRef: React.RefObject<HTMLInputElement>;
  checkedCount: number;
  totalCount: number;
  progressPerc: number;
  saveStatus: string | null;
  isCreatingSuitcase: boolean;
  isLinkedToItinerary: boolean;
  isDiaryAssociable?: boolean;
  isAssociable?: boolean;
  onEditTitle: () => void;
  onSaveTitle: () => void;
  onTitleChange: (val: string) => void;
  onCreateSuitcase: () => void;
  onClose: () => void;
  onDelete: () => void;
  onUnlink: () => void;
  onLink?: () => void;
  onBackToSelector: () => void;
  onCreateTemplate: () => void;
  performUndo: () => Promise<boolean>;
  performRedo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  sourceTab: 'trip' | 'saved' | 'default';
  setSourceTab: (val: 'trip' | 'saved' | 'default') => void;
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
  isCreatingSuitcase,
  isLinkedToItinerary,
  isDiaryAssociable = true,
  isAssociable = true,
  onEditTitle,
  onSaveTitle,
  onTitleChange,
  onCreateSuitcase,
  onClose,
  onDelete,
  onUnlink,
  onLink,
  onBackToSelector,
  onCreateTemplate,
  performUndo,
  performRedo,
  canUndo,
  canRedo,
  sourceTab,
  setSourceTab
}) => {
  const isEditor = viewMode === 'editor';

  return (
    <div className="flex flex-col shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-header relative">
      <div className="flex items-center justify-between px-4 md:px-6 h-20 md:h-24">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {isEditor ? (
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
            {isEditor && activeSuitcase ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2 group min-w-0">
                    <TemplateCategoryIcon 
                      template={activeSuitcase} 
                      className="text-2xl md:text-3xl shrink-0 flex items-center justify-center" 
                    />
                    {isEditingTitle ? (
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
                        onClick={onEditTitle}
                        className="text-base md:text-2xl font-bold text-white truncate cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
                      >
                        {activeSuitcase.title}
                        <Edit2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </h2>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 shadow-lg shrink-0">
                    <CheckSquare className={`w-3.5 h-3.5 ${progressPerc === 100 ? 'text-emerald-500' : 'text-indigo-400'}`} />
                    <span className="text-[11px] font-black text-slate-300 tracking-tight">
                      {checkedCount}/{totalCount} <span className="opacity-40 mx-1">•</span> {progressPerc}%
                    </span>
                  </div>
                </div>

                {activeSuitcase.created_at && (
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 opacity-50" /> Creato il {new Date(activeSuitcase.created_at).toLocaleDateString('it-IT')}</span>
                    {activeSuitcase.updated_at && (
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-50" /> Modificato il {new Date(activeSuitcase.updated_at).toLocaleDateString('it-IT')}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">Le mie Valigie</h2>
            )}
            
            {!isEditor && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Gestione bagagli e template
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isEditor && activeSuitcase && (
            <>
              <div className="flex items-center bg-slate-800/50 rounded-2xl border border-white/5 p-1.5">
                <button
                  onClick={performUndo}
                  disabled={!canUndo}
                  className={`p-2 rounded-xl transition-all ${canUndo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
                  title="Annulla (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button
                  onClick={performRedo}
                  disabled={!canRedo}
                  className={`p-2 rounded-xl transition-all ${canRedo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
                  title="Ripristina (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4 md:w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mr-1 md:mr-2 pr-2 md:pr-3 border-r border-white/10">
                {isLinkedToItinerary ? (
                  <button
                    onClick={onUnlink}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-all group shadow-lg shadow-emerald-500/5"
                    title="Scollega dal diario"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sincronizzato</span>
                    <Unlink className="w-4 h-4 sm:hidden" />
                  </button>
                ) : onLink && isAssociable ? (
                  <button
                    onClick={onLink}
                    disabled={!isDiaryAssociable}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 transition-all shadow-lg ${
                      isDiaryAssociable
                        ? 'bg-slate-800 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20'
                        : 'bg-slate-800/50 text-slate-600 opacity-50 cursor-not-allowed'
                    }`}
                    title={
                      isDiaryAssociable
                        ? 'Collega al diario'
                        : 'Completa date e almeno una tappa nel diario per associare'
                    }
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Collega</span>
                  </button>
                ) : onLink && !isAssociable ? (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5"
                    title="I template non possono essere collegati al diario"
                  >
                    <Layout className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">
                      Template · Non associabile
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5">
                    <CloudOff className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Offline</span>
                  </div>
                )}
                
                <button
                  onClick={onDelete}
                  className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 transition-all shadow-lg"
                  title="Elimina valigia"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
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
