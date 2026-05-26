import React from 'react';
import { Edit2, Trash2, ArrowLeft, Unlink, Plus, Layout, RotateCcw, RotateCw, Eye, EyeOff } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { Suitcase } from '@/types/suitcase';
import { DashboardActionGroup } from './DashboardActionGroup';

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
  onEditTitle: () => void;
  onSaveTitle: () => void;
  onTitleChange: (val: string) => void;
  onCreateSuitcase: () => void;
  onClose: () => void;
  onDelete: () => void;
  onUnlink: () => void;
  onBackToSelector: () => void;
  onCreateTemplate: () => void;
  performUndo: () => Promise<boolean>;
  performRedo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  sourceTab?: 'trip' | 'saved' | 'default';
  setSourceTab?: (val: 'trip' | 'saved' | 'default') => void;
  showHiddenCategories?: boolean;
  onToggleHiddenCategories?: () => void;
  hiddenCategoriesCount?: number;
  isEyeFlashing?: boolean;
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
  onEditTitle,
  onSaveTitle,
  onTitleChange,
  onCreateSuitcase,
  onClose,
  onDelete,
  onUnlink,
  onBackToSelector,
  onCreateTemplate,
  performUndo,
  performRedo,
  canUndo,
  canRedo,
  sourceTab,
  setSourceTab,
  showHiddenCategories,
  onToggleHiddenCategories,
  hiddenCategoriesCount = 0,
  isEyeFlashing = false
}) => {
  return (
    <div className={`flex flex-col shrink-0 sticky top-0 z-dropdown ${viewMode === 'editor' ? 'bg-slate-900 border-b border-white/5' : ''}`}>

      {/* Title Row - Requires solid background if sticky, but parent FloatingPanel provides the main background. We add a solid background element just for the Title Row to ensure blur aesthetics */}
      <div className={`flex items-center justify-between px-4 flex-1 w-full bg-slate-900 border-b border-white/5 ${viewMode === 'selector' ? 'pt-4 pb-2' : 'p-4'} relative z-10`}>
        <div className="flex items-center gap-3">
          {viewMode === 'editor' && (
            <button
              onClick={onBackToSelector}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all mr-1"
              title="Torna alla selezione"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* New vertical bar to match Homepage style */}
          <div className="w-1.5 h-6 md:h-8 bg-amber-500 rounded-full"></div>

          <div>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={tempTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={onSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
                  className="bg-slate-800 border border-indigo-500/50 rounded px-2 py-0.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              ) : (
                <h3
                  className="font-display text-lg md:text-2xl font-bold tracking-tight text-slate-200 flex items-center gap-3 group cursor-pointer"
                  onClick={viewMode === 'editor' ? onEditTitle : undefined}
                >
                  <span className="text-xl md:text-3xl">🧳</span>
                  {viewMode === 'editor' && activeSuitcase ? activeSuitcase.title : 'Organizza la tua valigia'}
                  {viewMode === 'editor' && <Edit2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />}
                </h3>
              )}
            </div>

            {viewMode === 'editor' && activeSuitcase && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${progressPerc === 100 ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}></div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {checkedCount} / {totalCount} ({progressPerc}%)
                  </span>
                </div>

                {activeSuitcase.created_at && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Creato il: {new Date(activeSuitcase.created_at).toLocaleDateString('it-IT')}</span>
                    {activeSuitcase.updated_at && activeSuitcase.user_id && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span>Modificato il: {new Date(activeSuitcase.updated_at).toLocaleDateString('it-IT')}</span>
                      </>
                    )}
                  </div>
                )}

                {saveStatus && <span className="text-[10px] text-emerald-400 animate-in fade-in slide-in-from-right-1">{saveStatus}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'editor' && activeSuitcase && (
            <>
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 mr-2 pr-3 border-r border-white/10">
                <button
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if (!canUndo) return;
                    console.log("[UndoHeaderClick] manual performUndo triggered");
                    await performUndo(); 
                  }}
                  disabled={!canUndo}
                  className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Annulla (Ctrl+Z)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if (!canRedo) return;
                    console.log("[RedoHeaderClick] manual performRedo triggered");
                    await performRedo(); 
                  }}
                  disabled={!canRedo}
                  className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Ripristina (Ctrl+Y)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Pulsante Occhio per Categorie Nascoste */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleHiddenCategories?.(); }}
                  disabled={hiddenCategoriesCount === 0}
                  className={`p-2.5 rounded-xl transition-all ${
                    isEyeFlashing 
                      ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                      : hiddenCategoriesCount === 0 
                        ? 'opacity-30 pointer-events-none text-slate-500' 
                        : showHiddenCategories 
                          ? 'bg-indigo-500/10 text-indigo-400' 
                          : 'hover:bg-white/5 text-slate-500 hover:text-indigo-400'
                  }`}
                  title={showHiddenCategories ? "Chiudi categorie nascoste" : "Mostra categorie nascoste"}
                >
                  {showHiddenCategories ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isLinkedToItinerary ? (
                <button
                  onClick={onUnlink}
                  className="p-2.5 rounded-xl hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-all"
                  title="Scollega dal diario"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              ) : null}
              <button
                onClick={onDelete}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                title="Elimina definitivamente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <CloseButton
            onClose={onClose}
            withEscape={false}
            size="md"
            variant="primary"
          />
        </div>
      </div>

    </div>
  );
};
