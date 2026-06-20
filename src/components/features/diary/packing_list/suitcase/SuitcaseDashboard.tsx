import React from 'react';
import { Briefcase, Layout, Lock, ArrowRight, ArrowDownUp, Check, ChevronDown } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';
import { CategorySetupMap } from '@/types/packingCatalog';
import { User } from '@supabase/supabase-js';
import { ResolvedAffiliateProduct } from '@/types/suitcase';
import {
  normalizeAllSuitcases,
  SUITCASE_TOOLBAR_SHELL_CLASS,
  sortSuitcaseList,
  type SuitcaseListSortMode,
} from './SuitcaseUtils';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { isTdTemplate, isUserTemplate, getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { SuitcaseCard } from './SuitcaseCard';
import { TemplateRow } from './TemplateRow';
import { TemplatePreview } from './TemplatePreview';
import { SuitcaseStatusBox } from './SuitcaseStatusBox';
import { AffiliateSuggestionBox } from './AffiliateSuggestionBox';
import { DashboardActionGroup } from './DashboardActionGroup';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { SuitcaseOnboardingBox } from './SuitcaseOnboardingBox';
import { SuitcaseToast } from '../SuitcaseFloatingPanel/components/SuitcaseToast';

import { ToastVariant } from '@/types/toast';
import {
  SUITCASE_DASHBOARD_TAB_ORDER,
  getSuitcaseTabLabel,
  type SuitcaseSourceTab,
} from '../SuitcaseFloatingPanel/types/sourceTab';
import { getSuitcaseTabIcon } from './suitcaseDashboardPanelUi';

interface SuitcaseDashboardProps {
  // Navigation & View
  sourceTab: SuitcaseSourceTab;
  setSourceTab: (val: SuitcaseSourceTab) => void;

  // Data
  tripSuitcases: Suitcase[];
  allSuitcases: Suitcase[]; // Both templates and saved
  suggestedTemplateIds: string[];
  preferences: Record<string, { enabled: boolean; priority: number }>;

  // Interactions
  activeTabId: string | null;
  hoveredItemId: string | null;
  currentUser: User | null;
  isCloning: boolean;

  // Callbacks
  onOpenSuitcase: (id: string) => void;
  onViewSuitcase: (id: string) => void;
  onUnlinkSuitcase: (id: string) => void;
  onDeleteSuitcase: (id: string) => void;
  onHover: (id: string | null) => void;
  onTogglePreference: (id: string, preferred: boolean) => void;
  onUseTemplate: (id: string) => void;
  templatePreviewOverlays?: Record<string, CategorySetupMap>;
  onTemplatePreviewOverlayChange?: (
    templateId: string,
    updater: (prev: CategorySetupMap) => CategorySetupMap
  ) => void;
  onDuplicateEntity?: (id: string) => void;
  onRequestAssociate?: (id: string) => void;
  onAddCategory: (id: string) => void;
  onDeleteCategory?: (
    suitcaseId: string,
    category: { id: string; name: string; source: string }
  ) => void;
  onSaveTitle?: (id: string, title: string) => Promise<void>;
  onUpdateSuitcaseLocal?: (id: string, updates: Partial<Suitcase>) => void;

  // Actions
  isCreatingSuitcase?: boolean;
  onCreateSuitcase?: () => void;
  onCreateTemplate?: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
  onSaveAsTemplate?: (id: string) => void;

  // Affiliate Data
  itemMap: Record<string, ResolvedAffiliateProduct[]>;
  categoryMap: Record<string, ResolvedAffiliateProduct[]>;
  overrides: Record<string, ResolvedAffiliateProduct>;
  globalMap: ResolvedAffiliateProduct[];
  placeholders: Record<string, ResolvedAffiliateProduct[]>;
  onLinkBuild: (provider: string, url: string) => string;
  onLinkBuildSearch: (query: string) => string;
  adminSuitcasePlaceholders?: Record<string, string>;
  toast?: { visible: boolean; message: string; description?: string; variant?: ToastVariant };
  hasActiveDiary?: boolean;
  isDiaryAssociable?: boolean;
  hasSavedSuitcases?: boolean;
  hasSuitcaseLinkedToDiary?: boolean;
  savedSuitcases: Suitcase[];
  linkedSuitcaseIds: string[];
  onLinkSuitcase: (id: string) => void;
  guestSuitcase?: Suitcase | null;
  onContinueGuestSuitcase?: () => void;
  isLoadingGlobalTemplates?: boolean;
  globalTemplatesFetchError?: string | null;
  isGuest?: boolean;
  onLogin?: () => void;
}

const BASE_LIST_SORT_OPTIONS: { value: SuitcaseListSortMode; label: string }[] = [
  { value: 'updated_at', label: 'Data modifica' },
  { value: 'created_at', label: 'Data creazione' },
  { value: 'title', label: 'Alfabetico' },
];

const TEMPLATE_FAVORITES_SORT_OPTION = {
  value: 'favorites' as const,
  label: 'Preferiti',
};

const SuitcaseListSortDropdown: React.FC<{
  value: SuitcaseListSortMode;
  onChange: (value: SuitcaseListSortMode) => void;
  showFavoritesOption?: boolean;
}> = ({ value, onChange, showFavoritesOption = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const sortOptions = showFavoritesOption
    ? [...BASE_LIST_SORT_OPTIONS, TEMPLATE_FAVORITES_SORT_OPTION]
    : BASE_LIST_SORT_OPTIONS;

  const handleSelect = (next: SuitcaseListSortMode) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Ordina lista"
        className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 min-h-[36px]"
        title="Ordina lista"
      >
        <ArrowDownUp className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
        <ChevronDown
          className={`w-4 h-4 shrink-0 opacity-80 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnchoredPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        align="right"
        role="listbox"
        className="min-w-[11.5rem] rounded-xl border border-white/10 bg-slate-950/98 backdrop-blur-md shadow-2xl shadow-black/40 py-1.5 overflow-hidden pointer-events-auto"
      >
        {sortOptions.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                isSelected
                  ? 'bg-indigo-500/15 text-indigo-100'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-4 shrink-0 flex items-center justify-center">
                {isSelected ? <Check className="w-3.5 h-3.5 text-indigo-400" aria-hidden /> : null}
              </span>
              <span className="text-[11px] md:text-xs font-bold leading-snug">{option.label}</span>
            </button>
          );
        })}
      </AnchoredPopover>
    </>
  );
};

export const SuitcaseDashboard: React.FC<SuitcaseDashboardProps> = ({
  sourceTab,
  setSourceTab,
  tripSuitcases,
  allSuitcases,
  suggestedTemplateIds,
  preferences,
  activeTabId,
  hoveredItemId,
  currentUser,
  isCloning,
  onOpenSuitcase,
  onViewSuitcase,
  onUnlinkSuitcase,
  onDeleteSuitcase,
  onHover,
  onTogglePreference,
  onUseTemplate,
  templatePreviewOverlays = {},
  onTemplatePreviewOverlayChange,
  onDuplicateEntity,
  onRequestAssociate,
  onAddCategory,
  onDeleteCategory,
  onSaveTitle,
  onUpdateSuitcaseLocal,
  isCreatingSuitcase = false,
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
  onSaveAsTemplate,
  itemMap,
  categoryMap,
  overrides,
  globalMap,
  placeholders,
  onLinkBuild,
  onLinkBuildSearch,
  adminSuitcasePlaceholders = {},
  toast = { visible: false, message: "" },
  hasActiveDiary = false,
  isDiaryAssociable = true,
  hasSavedSuitcases = false,
  hasSuitcaseLinkedToDiary = false,
  savedSuitcases = [],
  linkedSuitcaseIds = [],
  onLinkSuitcase,
  guestSuitcase = null,
  onContinueGuestSuitcase,
  isLoadingGlobalTemplates = false,
  globalTemplatesFetchError = null,
  isGuest = false,
  onLogin
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [listSortMode, setListSortMode] = React.useState<SuitcaseListSortMode>('updated_at');

  const isStartTab = sourceTab === 'start';

  const pausedDraftKind = guestSuitcase ? getDraftWorkspaceKind(guestSuitcase) : 'suitcase';
  const pausedEntityLabel = pausedDraftKind === 'user_template' ? 'Template' : 'Valigia';
  const pausedContinueLabel =
    pausedDraftKind === 'user_template' ? 'Continua Template' : 'Continua Valigia';

  // Filtri per liste (Default Templates o Mie Valigie)
  // Normalizzazione e deduplicazione deterministica di allSuitcases delegata al service layer di SuitcaseUtils
  const normalizedAllSuitcases = React.useMemo(() => 
    normalizeAllSuitcases(allSuitcases, tripSuitcases),
    [allSuitcases, tripSuitcases]
  );

  const filteredTemplates = normalizedAllSuitcases.filter(tpl => {
    if (sourceTab === 'default') return isTdTemplate(tpl) || isUserTemplate(tpl);
    return tpl.user_id === currentUser?.id;
  });

  const rawDisplayList =
    sourceTab === 'trip'
      ? tripSuitcases
      : sourceTab === 'saved'
        ? savedSuitcases
        : sourceTab === 'default'
          ? filteredTemplates
          : [];

  const effectiveSortMode: SuitcaseListSortMode =
    listSortMode === 'favorites' && sourceTab !== 'default' ? 'updated_at' : listSortMode;

  const displayList = React.useMemo(
    () =>
      sortSuitcaseList(rawDisplayList, effectiveSortMode, {
        preferences: effectiveSortMode === 'favorites' ? preferences : undefined,
      }),
    [rawDisplayList, effectiveSortMode, preferences]
  );

  const previewTarget =
    normalizedAllSuitcases.find((t) => t.id === hoveredItemId) || displayList[0] || null;
  const activeSuitcaseForSuggestions = normalizedAllSuitcases.find(s => s.id === activeTabId) || tripSuitcases[0] || null;

  const isTripTabEnabled = hasActiveDiary && tripSuitcases.length > 0;
  const isSavedTabDisabled = !currentUser;

  React.useEffect(() => {
    if (isSavedTabDisabled && sourceTab === 'saved') {
      setSourceTab('start');
    }
  }, [isSavedTabDisabled, sourceTab, setSourceTab]);

  const showProgress = sourceTab === 'trip' && hasActiveDiary && tripSuitcases.length > 0;
  const showOnboarding = isStartTab;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row relative overflow-hidden lg:overflow-x-visible lg:overflow-y-hidden">

      {/* ── AREA SINISTRA (Contenuto Principale) ── */}
      <div className="flex-1 flex flex-col min-h-0 relative z-floating-panel w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className={`${SUITCASE_TOOLBAR_SHELL_CLASS} mb-2.5`}>
          <div className="flex flex-1 min-w-0 items-center justify-center overflow-x-auto bg-slate-800/60 rounded-xl border border-white/10 p-1">
            <div className="flex items-center shrink-0">
            {SUITCASE_DASHBOARD_TAB_ORDER.map((tab) => {
              const label = getSuitcaseTabLabel(tab);
              const TabIcon = getSuitcaseTabIcon(tab);
              const isTrip = tab === 'trip';
              const isSaved = tab === 'saved';
              const isDisabled =
                (isTrip && !isTripTabEnabled) ||
                (isSaved && isSavedTabDisabled);
              const disabledTitle = isTrip && isDisabled
                ? 'Associa una valigia al Diario per attivare questa sezione'
                : isSaved && isDisabled
                  ? 'Accedi per vedere le tue valigie salvate'
                  : '';

              return (
                <button
                  key={tab}
                  onClick={() => !isDisabled && setSourceTab(tab)}
                  disabled={isDisabled}
                  title={disabledTitle}
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isDisabled
                      ? 'opacity-60 cursor-not-allowed text-slate-500'
                      : sourceTab === tab
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isDisabled && <Lock className="w-3 h-3 text-slate-500/50 shrink-0" />}
                  {TabIcon && (
                    <TabIcon
                      className="w-3.5 h-3.5 shrink-0"
                      aria-hidden
                    />
                  )}
                  {label}
                </button>
              );
            })}
            </div>
          </div>

          <DashboardActionGroup
            isCreating={isCreatingSuitcase}
            onCreateSuitcase={onCreateSuitcase}
            onCreateTemplate={onCreateTemplate}
            onOpenRecommendedSuitcase={onOpenRecommendedSuitcase}
            showRecommendedSuitcase={showRecommendedSuitcase}
          />
        </div>

        <div
          className={`flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar ${
            isStartTab
              ? 'flex-1 gap-2 px-4 pb-4 md:px-6 md:pb-5 lg:px-10 lg:pb-6 lg:pr-6'
              : 'gap-4 px-4 pb-4 md:px-6 md:pb-6 lg:px-10 lg:pb-10 lg:pr-6'
          }`}
        >

        {/* Toast localizzato sopra la lista */}
        <SuitcaseToast {...toast} />

        {/* WORKSPACE GUEST LOCALE — fuori da tab Salvate */}
        {guestSuitcase && onContinueGuestSuitcase && (
          <div className="w-full shrink-0 animate-in fade-in slide-in-from-top-2 duration-500">
            <button
              type="button"
              onClick={onContinueGuestSuitcase}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                  Workspace in pausa
                </div>
                <div className="text-sm font-bold text-white truncate group-hover:text-emerald-50">
                  {guestSuitcase.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Modifiche locali — salva {pausedEntityLabel.toLowerCase()} quando sei pronto
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
                {pausedContinueLabel}
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* RIGA 3: STATUS STRIP / ONBOARDING */}
        {showProgress && (
          <div className="w-full shrink-0 animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">
                Avanzamento Valigia
              </h3>
            </div>
            <SuitcaseStatusBox
              suitcases={tripSuitcases}
              onOpenSuitcase={onOpenSuitcase}
              onHoverSuitcase={onHover}
              onSelectSuitcase={(id) => onHover(id)}
              activeTabId={activeTabId}
            />
          </div>
        )}

        {showOnboarding && (
          <div className="w-full flex-1 flex flex-col min-h-0">
            <SuitcaseOnboardingBox
              onCreateSuitcase={onCreateSuitcase}
              onCreateTemplate={onCreateTemplate}
              onOpenRecommendedSuitcase={onOpenRecommendedSuitcase}
              showRecommendedSuitcase={showRecommendedSuitcase}
              onNavigateToTemplates={() => setSourceTab('default')}
              isGuest={isGuest}
              onLogin={onLogin}
            />
          </div>
        )}

        {/* RIGA 4: COLONNE LISTE E PREVIEW — solo tab operativi (non Inizia) */}
        {!isStartTab && (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 min-w-0 lg:items-start">

          <div 
            className="flex flex-col lg:w-[45%] xl:w-[40%] min-w-0 transition-all duration-500 rounded-xl"
          >
            <div className="flex items-center justify-between mb-1 px-1 shrink-0 gap-2 min-h-[36px]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-5 bg-amber-500 rounded-full shrink-0" />
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] truncate">
                  {sourceTab === 'default' ? 'Template' : 'Valigie'}
                </h3>
              </div>
              <SuitcaseListSortDropdown
                value={effectiveSortMode}
                onChange={setListSortMode}
                showFavoritesOption={sourceTab === 'default'}
              />
            </div>

            <div className="pr-2 animate-in fade-in duration-500">
              <div className="space-y-2">
                {displayList.length === 0 ? (
                  <div className="py-12 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                    {sourceTab === 'default' && isLoadingGlobalTemplates ? (
                      <p className="text-xs text-slate-500">Caricamento template...</p>
                    ) : sourceTab === 'default' && globalTemplatesFetchError ? (
                      <p className="text-xs text-slate-500">
                        Template non disponibili al momento. Riprova tra poco.
                      </p>
                    ) : sourceTab === 'default' ? (
                      <p className="text-xs text-slate-500">Nessun template disponibile.</p>
                    ) : (
                      <p className="text-xs text-slate-600">Nessun elemento trovato in questa sezione</p>
                    )}
                  </div>
                ) : (
                  displayList.map(tpl => {
                    const isSuggested = suggestedTemplateIds.includes(tpl.id);
                    const isPreferred = preferences[tpl.id]?.enabled === true;
                    if (sourceTab === 'default') {
                      return (
                        <TemplateRow
                          key={tpl.id}
                          template={tpl}
                          isSuggested={isSuggested}
                          isPreferred={isPreferred}
                          isHovered={hoveredItemId === tpl.id}
                          isCloning={isCloning}
                          onHover={() => onHover(tpl.id)}
                          onView={() => onViewSuitcase(tpl.id)}
                          onTogglePreference={() => onTogglePreference(tpl.id, !isPreferred)}
                          onUse={() => onUseTemplate(tpl.id)}
                          onOpen={isUserTemplate(tpl) ? () => onOpenSuitcase(tpl.id) : undefined}
                          onDuplicate={
                            onDuplicateEntity ? () => onDuplicateEntity(tpl.id) : undefined
                          }
                          onDelete={
                            isUserTemplate(tpl) ? () => onDeleteSuitcase(tpl.id) : undefined
                          }
                        />
                      );
                    }
                    return (
                      <SuitcaseCard
                        key={tpl.id}
                        suitcase={tpl}
                        variant={sourceTab === 'trip' ? 'trip' : 'saved'}
                        isActive={hoveredItemId === tpl.id}
                        isLinked={linkedSuitcaseIds.includes(tpl.id)}
                        isCloning={isCloning}
                        isDiaryAssociable={isDiaryAssociable}
                        currentUser={currentUser}
                        onOpen={onOpenSuitcase}
                        onView={onViewSuitcase}
                        onDelete={onDeleteSuitcase}
                        onDuplicate={onDuplicateEntity}
                        onAssociate={sourceTab === 'saved' ? onRequestAssociate : undefined}
                        onUnlink={sourceTab === 'trip' ? onUnlinkSuitcase : undefined}
                        onMouseEnter={() => onHover(tpl.id)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLONNA 2: CONTENUTO PREVIEW */}
          <div className="hidden lg:flex flex-col flex-1 min-w-0 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between mb-1 px-1 shrink-0 gap-2 min-h-[36px]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-5 bg-amber-500 rounded-full shrink-0" />
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] truncate">
                  {sourceTab === 'default' ? 'Contenuto Template' : 'Contenuto Valigia'}
                </h3>
              </div>
              <div className="shrink-0 min-h-[36px] min-w-[64px]" aria-hidden />
            </div>

            <div className="pr-2">
              <div key={previewTarget?.id} className="animate-in fade-in duration-300">
                <TemplatePreview
                  template={previewTarget}
                  sourceTab={sourceTab}
                  onAddCategory={onAddCategory}
                  onDeleteCategory={
                    sourceTab !== 'default' && onDeleteCategory && previewTarget
                      ? (category) => onDeleteCategory(previewTarget.id, category)
                      : undefined
                  }
                  onUpdateSuitcaseLocal={onUpdateSuitcaseLocal}
                  categorySetupOverlay={
                    previewTarget ? templatePreviewOverlays[previewTarget.id] : undefined
                  }
                  onCategorySetupOverlayChange={
                    previewTarget && onTemplatePreviewOverlayChange
                      ? (updater) => onTemplatePreviewOverlayChange(previewTarget.id, updater)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>

      {/* ── AREA DESTRA (Suggerimenti Unificati Edge-to-Edge) ── */}
      <SuitcaseSidePanel
        isCollapsible={true}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        className="border-none"
      >
        <AffiliateSuggestionBox
          activeSuitcase={activeSuitcaseForSuggestions || tripSuitcases[0] || null}
          itemMap={itemMap}
          categoryMap={categoryMap}
          overrides={overrides}
          globalMap={globalMap}
          placeholders={placeholders}
          adminSuitcasePlaceholders={adminSuitcasePlaceholders}
          onLinkBuild={onLinkBuild}
          onLinkBuildSearch={onLinkBuildSearch}
        />
      </SuitcaseSidePanel>

    </div>
  );
};
