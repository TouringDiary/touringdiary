import React from 'react';
import { Sparkles, Ban, Wrench, Search } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import { CategoryStatusFilter, SUITCASE_TOOLBAR_ICON_BTN_CLASS, SUITCASE_TOOLBAR_ICON_SIZE_CLASS } from './SuitcaseUtils';
import { CategoryToolbarNav } from './CategoryToolbarNav';

interface SuitcaseEditorToolbarProps {
  readOnly: boolean;
  isSeedingAi: boolean;
  onOpenAiModal: () => void;
  onOpenBlacklist: () => void;
  blacklistCount: number;
  isBlacklistFlashing: boolean;
  visibleCategories: DisplayCategory[];
  incompleteCountsByCategoryId: Record<string, number>;
  categoryStatusFilter: CategoryStatusFilter;
  onCategoryStatusFilterChange: (filter: CategoryStatusFilter) => void;
  onNavigateToCategory: (categoryId: string) => void;
  onReorderCategory: (categoryId: string, targetIndex: number) => void;
  onAddCategory: () => void;
  canToggleViewMode: boolean;
  canUseTemplateAction: boolean;
  panelViewMode: 'viewer' | 'editor';
  onSetViewMode?: (mode: 'viewer' | 'editor') => void;
  onUseTemplate?: () => void;
}

const EDITOR_TOOLBAR_SHELL_CLASS =
  'shrink-0 px-4 md:px-6 lg:px-10 py-2 bg-slate-900/95 backdrop-blur-md border-b border-white/10 min-w-0';

const GROUP_ICON_CLASS = SUITCASE_TOOLBAR_ICON_SIZE_CLASS;

const GROUP_LABEL_CLASS =
  'text-[7px] font-black uppercase tracking-[0.18em] text-slate-400 leading-none whitespace-nowrap mb-0.5';

interface ToolbarLabeledGroupProps {
  label: string;
  children: React.ReactNode;
}

const ToolbarLabeledGroup: React.FC<ToolbarLabeledGroupProps> = ({ label, children }) => (
  <div className="flex flex-col items-center gap-0.5 shrink-0 self-center" role="group" aria-label={label}>
    <span className={GROUP_LABEL_CLASS}>{label}</span>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
);

export const SuitcaseEditorToolbar: React.FC<SuitcaseEditorToolbarProps> = ({
  readOnly,
  isSeedingAi,
  onOpenAiModal,
  onOpenBlacklist,
  blacklistCount,
  isBlacklistFlashing,
  visibleCategories,
  incompleteCountsByCategoryId,
  categoryStatusFilter,
  onCategoryStatusFilterChange,
  onNavigateToCategory,
  onReorderCategory,
  onAddCategory,
  canToggleViewMode,
  canUseTemplateAction,
  panelViewMode,
  onSetViewMode,
  onUseTemplate,
}) => {
  const viewModeButtonClass = canUseTemplateAction
    ? `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} bg-slate-800/50 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/15 shrink-0`
    : panelViewMode === 'viewer'
      ? `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} bg-sky-500/10 border-sky-500/25 text-sky-300 hover:bg-sky-500/15 hover:border-sky-500/35 shrink-0`
      : `${SUITCASE_TOOLBAR_ICON_BTN_CLASS} bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/35 shrink-0`;

  return (
    <div className={EDITOR_TOOLBAR_SHELL_CLASS}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center w-full gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 justify-self-start min-w-0 overflow-x-auto overflow-y-visible flex-nowrap">
          <ToolbarLabeledGroup label="Oggetti">
            <button
              onClick={onOpenAiModal}
              disabled={readOnly || isSeedingAi}
              className={`${SUITCASE_TOOLBAR_ICON_BTN_CLASS} bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500/40 disabled:hover:bg-amber-500/10 disabled:hover:text-amber-400 group`}
              title={readOnly ? 'Non disponibile in sola lettura' : isSeedingAi ? 'Generazione...' : 'Ottieni suggerimenti'}
              aria-label={readOnly ? 'Non disponibile in sola lettura' : isSeedingAi ? 'Generazione suggerimenti' : 'Ottieni suggerimenti'}
            >
              <Sparkles className={`${GROUP_ICON_CLASS} group-hover:scale-110 transition-transform ${isSeedingAi ? 'animate-spin' : ''}`} aria-hidden />
            </button>

            <button
              onClick={onOpenBlacklist}
              disabled={readOnly}
              className={`${SUITCASE_TOOLBAR_ICON_BTN_CLASS} group relative ${
                readOnly
                  ? 'bg-slate-800/50 border-white/10 text-slate-500'
                  : isBlacklistFlashing
                    ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300 text-white border-amber-400/50'
                    : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/15'
              }`}
              title={readOnly ? 'Non disponibile in sola lettura' : 'Oggetti rifiutati'}
              aria-label={readOnly ? 'Non disponibile in sola lettura' : 'Oggetti rifiutati'}
            >
              <Ban className={`${GROUP_ICON_CLASS} group-hover:scale-110 transition-transform`} aria-hidden />
              {blacklistCount > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[8px] font-black border-2 transition-all ${
                  isBlacklistFlashing ? 'bg-white text-amber-600 border-amber-400' : 'bg-indigo-500 text-white border-slate-900'
                }`}>
                  {blacklistCount}
                </span>
              )}
            </button>
          </ToolbarLabeledGroup>
        </div>

        <div className="justify-self-center min-w-0 w-full max-w-[min(100%,20rem)] sm:max-w-[min(100%,28rem)] md:max-w-[min(100%,36rem)] lg:max-w-[min(100%,48rem)] px-0.5 sm:px-1 overflow-visible">
          <CategoryToolbarNav
            categories={visibleCategories}
            readOnly={readOnly}
            onNavigate={onNavigateToCategory}
            onReorder={onReorderCategory}
            incompleteCountsByCategoryId={incompleteCountsByCategoryId}
            categoryStatusFilter={categoryStatusFilter}
            onCategoryStatusFilterChange={onCategoryStatusFilterChange}
            onAddCategory={onAddCategory}
          />
        </div>

        <div className="flex items-center justify-self-end shrink-0 min-w-0">
          {(canToggleViewMode || canUseTemplateAction) && (
            <button
              type="button"
              onClick={() => {
                if (canUseTemplateAction) {
                  onUseTemplate?.();
                  return;
                }
                onSetViewMode?.(panelViewMode === 'viewer' ? 'editor' : 'viewer');
              }}
              className={viewModeButtonClass}
              aria-label={
                canUseTemplateAction
                  ? 'Usa Template'
                  : panelViewMode === 'viewer'
                    ? 'Modifica'
                    : 'Visualizzazione'
              }
              title={
                canUseTemplateAction
                  ? 'Usa Template'
                  : panelViewMode === 'viewer'
                    ? 'Modifica'
                    : 'Visualizzazione'
              }
            >
              {canUseTemplateAction ? (
                <Sparkles className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
              ) : panelViewMode === 'viewer' ? (
                <Wrench className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
              ) : (
                <Search className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
