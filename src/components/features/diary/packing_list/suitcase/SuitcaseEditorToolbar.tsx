import React from 'react';
import { Sparkles, Ban, Wrench, Search } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import {
  CategoryStatusFilter,
  SUITCASE_TOOLBAR_ICON_BTN_CLASS,
  SUITCASE_TOOLBAR_ICON_SIZE_CLASS,
  SUITCASE_VIEW_MODE_BTN_EDITOR_ACTIVE_CLASS,
  SUITCASE_VIEW_MODE_BTN_EDITOR_IDLE_CLASS,
  SUITCASE_VIEW_MODE_BTN_VIEWER_ACTIVE_CLASS,
  SUITCASE_VIEW_MODE_BTN_VIEWER_IDLE_CLASS,
} from './SuitcaseUtils';
import { CategoryToolbarNav } from './CategoryToolbarNav';
import { CountBadge } from '@/components/ui/CountBadge';
import { SuitcaseToolbarGroup } from './SuitcaseToolbarGroup';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';

interface SuitcaseEditorToolbarProps {
  readOnly: boolean;
  isSeedingAi: boolean;
  onOpenAiModal: () => void;
  onOpenBlacklist: () => void;
  blacklistCount: number;
  isBlacklistFlashing: boolean;
  visibleCategories: DisplayCategory[];
  activeCategoryId?: string | null;
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
  /** Avanzamento valigia — mostrato nella riga 2 della toolbar su mobile. */
  checkedCount: number;
  totalCount: number;
  progressPerc: number;
}

const EDITOR_TOOLBAR_SHELL_CLASS =
  'shrink-0 px-4 md:px-6 lg:px-10 pt-2 pb-3.5 bg-slate-900/95 backdrop-blur-md border-b border-white/10 min-w-0';

const GROUP_ICON_CLASS = SUITCASE_TOOLBAR_ICON_SIZE_CLASS;

export const SuitcaseEditorToolbar: React.FC<SuitcaseEditorToolbarProps> = ({
  readOnly,
  isSeedingAi,
  onOpenAiModal,
  onOpenBlacklist,
  blacklistCount,
  isBlacklistFlashing,
  visibleCategories,
  activeCategoryId = null,
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
  checkedCount,
  totalCount,
  progressPerc,
}) => {
  const aiTitle = readOnly
    ? 'Non disponibile in sola lettura'
    : isSeedingAi
      ? 'Generazione...'
      : 'Nuovi';
  const blacklistTitle = readOnly ? 'Non disponibile in sola lettura' : 'Rifiutati';

  const isEditorMode = panelViewMode === 'editor';
  const isViewerMode = panelViewMode === 'viewer';

  const suggerimentiButtons = (
    <>
      <button
        type="button"
        onClick={onOpenAiModal}
        disabled={readOnly || isSeedingAi}
        className={`${SUITCASE_TOOLBAR_ICON_BTN_CLASS} relative overflow-visible bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500/40 disabled:hover:bg-amber-500/10 disabled:hover:text-amber-400 group`}
        title={aiTitle}
        aria-label={aiTitle}
      >
        <Sparkles
          className={`${GROUP_ICON_CLASS} group-hover:scale-110 transition-transform ${isSeedingAi ? 'animate-spin' : ''}`}
          aria-hidden
        />
      </button>

      <button
        type="button"
        onClick={onOpenBlacklist}
        disabled={readOnly}
        className={`${SUITCASE_TOOLBAR_ICON_BTN_CLASS} relative overflow-visible group ${
          readOnly
            ? 'bg-slate-800/50 border-white/10 text-slate-500'
            : isBlacklistFlashing
              ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300 text-white border-amber-400/50'
              : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/15'
        }`}
        title={blacklistTitle}
        aria-label={blacklistTitle}
      >
        <Ban className={`${GROUP_ICON_CLASS} group-hover:scale-110 transition-transform`} aria-hidden />
        {blacklistCount > 0 && (
          <CountBadge
            count={blacklistCount}
            max={99}
            size="sm"
            variant="indigo"
            position="overlay-tr"
            className={
              isBlacklistFlashing ? 'bg-white text-amber-600 border-amber-400 shadow-amber-950/50' : ''
            }
            aria-hidden
          />
        )}
      </button>
    </>
  );

  const categoryNav = (
    <CategoryToolbarNav
      categories={visibleCategories}
      readOnly={readOnly}
      activeCategoryId={activeCategoryId}
      onNavigate={onNavigateToCategory}
      onReorder={onReorderCategory}
      incompleteCountsByCategoryId={incompleteCountsByCategoryId}
      categoryStatusFilter={categoryStatusFilter}
      onCategoryStatusFilterChange={onCategoryStatusFilterChange}
      onAddCategory={onAddCategory}
    />
  );

  const hasModalita = canToggleViewMode || canUseTemplateAction;
  const modalitaButtons = !hasModalita ? null : canUseTemplateAction ? (
    <button
      type="button"
      onClick={() => onUseTemplate?.()}
      className={`${SUITCASE_TOOLBAR_ICON_BTN_CLASS} bg-slate-800/50 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/15 shrink-0`}
      aria-label="Usa Template"
      title="Usa Template"
    >
      <Sparkles className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={() => onSetViewMode?.('viewer')}
        className={
          isViewerMode
            ? SUITCASE_VIEW_MODE_BTN_EDITOR_ACTIVE_CLASS
            : SUITCASE_VIEW_MODE_BTN_EDITOR_IDLE_CLASS
        }
        aria-label="Visualizzazione"
        aria-pressed={isViewerMode}
        title="Visualizzazione"
      >
        <Search className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onSetViewMode?.('editor')}
        className={
          isEditorMode
            ? SUITCASE_VIEW_MODE_BTN_VIEWER_ACTIVE_CLASS
            : SUITCASE_VIEW_MODE_BTN_VIEWER_IDLE_CLASS
        }
        aria-label="Modifica"
        aria-pressed={isEditorMode}
        title="Modifica"
      >
        <Wrench className={`${SUITCASE_TOOLBAR_ICON_SIZE_CLASS} shrink-0`} aria-hidden />
      </button>
    </>
  );

  return (
    <div className={EDITOR_TOOLBAR_SHELL_CLASS}>
      {/* DESKTOP / TABLET ≥768px: layout originale a riga unica (invariato) */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 sm:gap-3 min-w-0">
        <SuitcaseToolbarGroup label="Suggerimenti" align="start" showDividerAfter>
          {suggerimentiButtons}
        </SuitcaseToolbarGroup>

        <SuitcaseToolbarGroup
          label="Categorie"
          align="center"
          className="min-w-0 max-w-[min(100%,20rem)] sm:max-w-[min(100%,28rem)] md:max-w-[min(100%,36rem)] lg:max-w-[min(100%,48rem)]"
        >
          {categoryNav}
        </SuitcaseToolbarGroup>

        {modalitaButtons && (
          <SuitcaseToolbarGroup label="Modalità" align="end" showDividerBefore>
            {modalitaButtons}
          </SuitcaseToolbarGroup>
        )}
      </div>

      {/* MOBILE (<768px): riga 2 (Suggerimenti/Rifiutati · avanzamento · Visualizza/Modifica) + riga 3 (categorie) */}
      <div className="flex flex-col gap-2 w-full min-w-0 md:hidden">
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <div className="flex items-center gap-1 shrink-0">{suggerimentiButtons}</div>
          <div className="h-8 w-px shrink-0 bg-white/10" aria-hidden />
          <div className="shrink-0">
            <SuitcaseToolbarProgressBox
              checkedCount={checkedCount}
              totalCount={totalCount}
              progressPerc={progressPerc}
              variant="header"
            />
          </div>
          <div className="flex-1" aria-hidden />
          {modalitaButtons && (
            <>
              <div className="h-8 w-px shrink-0 bg-white/10" aria-hidden />
              <div className="flex items-center gap-1 shrink-0">{modalitaButtons}</div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 w-full min-w-0">{categoryNav}</div>
      </div>
    </div>
  );
};
