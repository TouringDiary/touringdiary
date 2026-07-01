import React from 'react';
import { Briefcase, Layout, Lock, ArrowRight, ArrowDownUp, Check, ChevronDown } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';
import { CategorySetupMap } from '@/types/packingCatalog';
import { User } from '@supabase/supabase-js';
import { ResolvedAffiliateProduct } from '@/types/suitcase';
import {
  normalizeAllSuitcases,
  SUITCASE_COMPACT_DROPDOWN_TRIGGER_LAYOUT_CLASS,
  SUITCASE_TOOLBAR_SHELL_CLASS,
  sortSuitcaseList,
  type SuitcaseListSortMode,
} from './SuitcaseUtils';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { isTdTemplate, isUserTemplate, getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { SuitcaseCard } from './SuitcaseCard';
import { TemplateRow } from './TemplateRow';
import { TemplatePreview } from './TemplatePreview';
import { CarouselPositionIndicator } from '@/components/ui/CarouselPositionIndicator';
import { SuitcaseStatusBox } from './SuitcaseStatusBox';
import { AffiliateSuggestionBox } from './AffiliateSuggestionBox';
import { DashboardActionGroup } from './DashboardActionGroup';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { SuitcaseMobileSuggestionsDrawer } from './SuitcaseMobileSuggestionsDrawer';
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
  /**
   * NB semantica: identifica l'elemento SELEZIONATO per l'anteprima (preview), non un semplice
   * stato di hover. Da quando il click sulla riga seleziona la preview (e il viewer si apre solo
   * dall'icona occhio), questo id guida sia l'evidenziazione `isActive`/`isHovered` sia il
   * `previewTarget`. Nome storico mantenuto per non propagare il rename lungo tutta la catena.
   */
  hoveredItemId: string | null;
  currentUser: User | null;
  isCloning: boolean;

  // Callbacks
  onOpenSuitcase: (id: string) => void;
  onViewSuitcase: (id: string) => void;
  onUnlinkSuitcase: (id: string) => void;
  onDeleteSuitcase: (id: string) => void;
  /** Seleziona l'elemento per l'anteprima (preview). Nome storico: in realtà è "select". */
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

type TemplateSourceFilter = 'all' | 'td' | 'user';

const TEMPLATE_SOURCE_FILTER_OPTIONS: { value: TemplateSourceFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'td', label: 'TD' },
  { value: 'user', label: 'USER' },
];

const TemplateSourceFilterDropdown: React.FC<{
  value: TemplateSourceFilter;
  onChange: (value: TemplateSourceFilter) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const selectedLabel =
    TEMPLATE_SOURCE_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? 'ALL';

  const handleSelect = (next: TemplateSourceFilter) => {
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
        aria-label="Filtra template"
        className={`${SUITCASE_COMPACT_DROPDOWN_TRIGGER_LAYOUT_CLASS} gap-2 px-3 rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40`}
        title="Filtra template"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
          {selectedLabel}
        </span>
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
        {TEMPLATE_SOURCE_FILTER_OPTIONS.map((option) => {
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
              <span className="text-[11px] md:text-xs font-bold leading-snug uppercase tracking-wide">
                {option.label}
              </span>
            </button>
          );
        })}
      </AnchoredPopover>
    </>
  );
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
        className={`${SUITCASE_COMPACT_DROPDOWN_TRIGGER_LAYOUT_CLASS} gap-2 px-3 rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40`}
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncSidebarOpen = (event: MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', syncSidebarOpen);
    return () => {
      mediaQuery.removeEventListener('change', syncSidebarOpen);
    };
  }, []);

  const [listSortMode, setListSortMode] = React.useState<SuitcaseListSortMode>('updated_at');
  const [templateSourceFilter, setTemplateSourceFilter] = React.useState<TemplateSourceFilter>('all');

  // Stato del carosello categorie riportato da TemplatePreview (fonte di verità nel figlio):
  // serve solo a montare il CarouselPositionIndicator nell'intestazione del box "Contenuto…".
  const [previewCarousel, setPreviewCarousel] = React.useState<{ progress: number; count: number }>(
    { progress: 0, count: 0 }
  );

  // Bail-out: aggiorna lo stato (→ re-render del Dashboard) solo quando il valore mostrato cambia
  // davvero. Restituendo `prev` quando progress/count sono identici, React salta il re-render —
  // così cadono gli update inutili (eventi di scroll duplicati, l'istanza nascosta di
  // TemplatePreview che riporta sempre lo stesso (0, count), assestamento a fine scroll), mentre
  // ogni reale spostamento del thumb continua a propagarsi. Reference stabile (useCallback) così
  // l'effetto di report nel figlio non si ri-attiva ad ogni render del parent.
  const handlePreviewCarouselChange = React.useCallback(
    (next: { progress: number; count: number }) => {
      setPreviewCarousel((prev) =>
        prev.progress === next.progress && prev.count === next.count ? prev : next
      );
    },
    []
  );

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

  const sourceFilteredTemplates = React.useMemo(() => {
    if (templateSourceFilter === 'td') {
      return filteredTemplates.filter(isTdTemplate);
    }
    if (templateSourceFilter === 'user') {
      return filteredTemplates.filter(isUserTemplate);
    }
    return filteredTemplates;
  }, [filteredTemplates, templateSourceFilter]);

  const rawDisplayList =
    sourceTab === 'trip'
      ? tripSuitcases
      : sourceTab === 'saved'
        ? savedSuitcases
        : sourceTab === 'default'
          ? sourceFilteredTemplates
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
  const showMobileSuggestions = !isStartTab;

  const templatePreviewElement = (
    <TemplatePreview
      template={previewTarget}
      sourceTab={sourceTab as Exclude<SuitcaseSourceTab, 'start'>}
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
      onCarouselStateChange={handlePreviewCarouselChange}
    />
  );

  return (
    <div className="w-full h-full flex flex-col lg:flex-row relative overflow-hidden lg:overflow-x-visible lg:overflow-y-hidden min-h-0">

      {/* ── AREA SINISTRA (Contenuto Principale) ── */}
      {/*
        * Nessun z-index qui: replica l'architettura dell'Editor Valigia
        * (SuitcaseEditorView), dove l'area lista NON ha z-index così che il
        * SuitcaseMobileSuggestionsDrawer (z-local-drawer) — fratello e successivo
        * nel DOM — riceva i tap della barra "Mostra suggerimenti". Usare un tier
        * globale (z-floating-panel = focusCompanion 9100) sovrastava il drawer
        * (z-local-drawer 300) rendendo il pulsante non cliccabile su mobile.
        */}
      <div className="flex-1 flex flex-col min-h-0 relative w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className={`${SUITCASE_TOOLBAR_SHELL_CLASS} mb-1 lg:mb-2.5`}>
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

          {/*
            * Desktop (>= lg): azioni di creazione nella toolbar.
            * Mobile/tablet (< lg): spostate nell'header del pannello (SuitcaseHeader), accanto
            * alla X, così la riga dei tab usa tutta la larghezza disponibile.
            */}
          <div className="hidden lg:flex">
            <DashboardActionGroup
              isCreating={isCreatingSuitcase}
              onCreateSuitcase={onCreateSuitcase}
              onCreateTemplate={onCreateTemplate}
              onOpenRecommendedSuitcase={onOpenRecommendedSuitcase}
              showRecommendedSuitcase={showRecommendedSuitcase}
            />
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col min-h-0 ${
            isStartTab
              ? 'overflow-y-auto custom-scrollbar gap-4 max-lg:gap-4 px-4 pb-6 md:px-6 md:pb-5 lg:px-10 lg:pb-6 lg:pr-6'
              // Mobile (<lg): scroll verticale unico di pagina (AVANZAMENTO → VALIGIE → CONTENUTO),
              // le sezioni fluiscono ad altezza naturale e non in pannelli a scroll interno.
              // La barra "Mostra suggerimenti" (SuitcaseMobileSuggestionsDrawer collapsedLayout="docked")
              // resta un fratello in-flow del layout, fuori da questo contenitore scrollabile.
              : 'overflow-y-auto custom-scrollbar gap-3 lg:gap-4 px-4 pb-4 md:px-6 lg:px-10 lg:pb-10 lg:pr-6'
          }`}
        >

        <SuitcaseToast {...toast} />

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

        {showOnboarding && (
          <div className="w-full shrink-0 flex flex-col lg:flex-1 lg:min-h-0">
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

        {!isStartTab && (
        <div className="flex flex-col lg:flex-1 lg:flex-row gap-3 lg:gap-8 lg:min-h-0 min-w-0 lg:items-start">

          {/* Mobile (<lg): colonna ad altezza naturale che impila AVANZAMENTO + VALIGIE nel
            * flusso di pagina scrollabile (nessuno scroll interno). Su desktop torna a larghezza
            * fissa affiancata (lg:flex-none + lg:w-[45%]) con i propri vincoli min-h-0. */}
          <div className="flex flex-col min-w-0 lg:min-h-0 lg:flex-none lg:w-[45%] xl:w-[40%] transition-all duration-500 rounded-xl">
            {showProgress && (
              <div className="w-full shrink-0 mb-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-100 max-lg:mb-2">
                <div className="flex items-center gap-3 mb-1 sm:mb-2 px-1">
                  <div className="w-1 h-4 sm:h-5 bg-amber-500 rounded-full" />
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

            <div className="flex flex-col lg:contents max-lg:rounded-2xl max-lg:border max-lg:border-white/10 max-lg:bg-slate-950/30 max-lg:p-2">
            <div className="flex items-center justify-between mb-1 px-1 shrink-0 gap-2 min-h-[36px]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-5 bg-amber-500 rounded-full shrink-0" />
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] truncate">
                  {sourceTab === 'default' ? 'Template' : 'Valigie'}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {sourceTab === 'default' && (
                  <TemplateSourceFilterDropdown
                    value={templateSourceFilter}
                    onChange={setTemplateSourceFilter}
                  />
                )}
                {/* Ordinamento valigie: gestione riservata al Desktop (pannello dedicato).
                    Su mobile la sezione non è presente, quindi il pulsante è nascosto (<lg). */}
                <div className="hidden lg:block">
                  <SuitcaseListSortDropdown
                    value={effectiveSortMode}
                    onChange={setListSortMode}
                    showFavoritesOption={sourceTab === 'default'}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-visible lg:flex-none lg:min-h-0 pr-2 animate-in fade-in duration-500">
              <div className="space-y-2">
                {displayList.length === 0 ? (
                  <div className="py-12 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                    {sourceTab === 'default' && isLoadingGlobalTemplates ? (
                      <p className="text-xs text-slate-500">Caricamento template...</p>
                    ) : sourceTab === 'default' && globalTemplatesFetchError ? (
                      <p className="text-xs text-slate-500">
                        Template non disponibili al momento. Riprova tra poco.
                      </p>
                    ) : sourceTab === 'default' && templateSourceFilter === 'user' && isGuest ? (
                      <p className="text-xs text-slate-500">
                        Accedi per vedere i tuoi template personali.
                      </p>
                    ) : sourceTab === 'default' && templateSourceFilter === 'user' ? (
                      <p className="text-xs text-slate-500">
                        Non hai ancora creato template personali.
                      </p>
                    ) : sourceTab === 'default' && templateSourceFilter === 'td' ? (
                      <p className="text-xs text-slate-500">
                        Nessun template Touring Diary disponibile.
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
                          onSelect={() => onHover(tpl.id)}
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
                        onSelect={() => onHover(tpl.id)}
                      />
                    );
                  })
                )}
              </div>
            </div>
            </div>
          </div>

          {/*
            * Sezione mobile "Contenuto Valigia / Template" (terzo blocco impilato, dopo
            * AVANZAMENTO e VALIGIE). Ad altezza naturale: scorre col resto della pagina, niente
            * scroll interno.
            * Background opaco proprio (bg-slate-900, coerente col resto della Dashboard / pannello
            * Valigia) così da non lasciare intravedere il Diario sottostante; il negative margin +
            * padding ricompone l'opaco a tutta larghezza annullando il px-4 del contenitore padre.
            */}
          <div className="flex flex-col bg-slate-900 -mx-4 px-4 pt-2 pb-2 md:-mx-6 md:px-6 lg:hidden animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/30 p-2">
              <div className="flex items-center justify-between mb-1 px-1 shrink-0 gap-2 min-h-[36px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-5 bg-amber-500 rounded-full shrink-0" />
                  <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] truncate">
                    {sourceTab === 'default' ? 'Contenuto Template' : 'Contenuto Valigia'}
                  </h3>
                </div>
                {/* Indicatore posizione carosello categorie allineato a destra dell'intestazione
                    (lo stato arriva da TemplatePreview via onCarouselStateChange). Mobile-only:
                    l'intero blocco è già lg:hidden. */}
                <CarouselPositionIndicator
                  count={previewCarousel.count}
                  progress={previewCarousel.progress}
                  className="shrink-0"
                />
              </div>
              <div className="pr-2">
                <div key={previewTarget?.id} className="animate-in fade-in duration-300">
                  {templatePreviewElement}
                </div>
              </div>
            </div>
          </div>

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
                {templatePreviewElement}
              </div>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>

      {/* ── AREA DESTRA (Suggerimenti affiliate — desktop rail) ── */}
      <SuitcaseSidePanel
        isCollapsible={true}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sticky={true}
        className="border-none shrink-0 lg:shrink-0"
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

      {showMobileSuggestions && (
      <SuitcaseMobileSuggestionsDrawer
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        collapsedLayout="docked"
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
      </SuitcaseMobileSuggestionsDrawer>
      )}

    </div>
  );
};
