import React from 'react';
import { Briefcase, Layout, Lock, ArrowRight } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';
import { User } from '@supabase/supabase-js';
import { ResolvedAffiliateProduct } from '@/types/suitcase';
import { normalizeAllSuitcases } from './SuitcaseUtils';
import { isTdTemplate, isUserTemplate } from '@/utils/suitcaseDomain';
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

interface SuitcaseDashboardProps {
  // Navigation & View
  sourceTab: 'trip' | 'saved' | 'default';
  setSourceTab: (val: 'trip' | 'saved' | 'default') => void;

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
  onDuplicateEntity?: (id: string) => void;
  onRequestAssociate?: (id: string) => void;
  onAddCategory: (id: string) => void;
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
  showHiddenCategories?: boolean;
  hasActiveDiary?: boolean;
  isDiaryAssociable?: boolean;
  hasSavedSuitcases?: boolean;
  hasSuitcaseLinkedToDiary?: boolean;
  savedSuitcases: Suitcase[];
  linkedSuitcaseIds: string[];
  onLinkSuitcase: (id: string) => void;
  guestSuitcase?: Suitcase | null;
  onContinueGuestSuitcase?: () => void;
}

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
  onDuplicateEntity,
  onRequestAssociate,
  onAddCategory,
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
  showHiddenCategories = false,
  hasActiveDiary = false,
  isDiaryAssociable = true,
  hasSavedSuitcases = false,
  hasSuitcaseLinkedToDiary = false,
  savedSuitcases = [],
  linkedSuitcaseIds = [],
  onLinkSuitcase,
  guestSuitcase = null,
  onContinueGuestSuitcase
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const templatesSectionRef = React.useRef<HTMLDivElement>(null);
  const [highlightTemplates, setHighlightTemplates] = React.useState(false);

  const handleUsaTemplateClick = () => {
    if (templatesSectionRef.current) {
      templatesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHighlightTemplates(true);
    setTimeout(() => {
      setHighlightTemplates(false);
    }, 1500);
  };

  // Filtri per liste (Default Templates o Mie Valigie)
  // Normalizzazione e deduplicazione deterministica di allSuitcases delegata al service layer di SuitcaseUtils
  const normalizedAllSuitcases = React.useMemo(() => 
    normalizeAllSuitcases(allSuitcases, tripSuitcases),
    [allSuitcases, tripSuitcases]
  );

  const filteredTemplates = normalizedAllSuitcases.filter(tpl => {
    if (sourceTab === 'default') return isTdTemplate(tpl) || isUserTemplate(tpl);
    return tpl.user_id === currentUser?.id;
  }).sort((a, b) => {
    const aPref = preferences[a.id]?.enabled === true ? 1 : 0;
    const bPref = preferences[b.id]?.enabled === true ? 1 : 0;
    if (bPref !== aPref) return bPref - aPref;
    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
  });

  const previewTarget = normalizedAllSuitcases.find(t => t.id === hoveredItemId) || filteredTemplates[0] || tripSuitcases[0] || null;
  const activeSuitcaseForSuggestions = normalizedAllSuitcases.find(s => s.id === activeTabId) || tripSuitcases[0] || null;

  const displayList = sourceTab === 'trip'
    ? tripSuitcases
    : sourceTab === 'saved'
      ? savedSuitcases
      : filteredTemplates;

  const isTripTabEnabled = hasActiveDiary && tripSuitcases.length > 0;
  const isSavedTabDisabled = !currentUser;

  React.useEffect(() => {
    if (isSavedTabDisabled && sourceTab === 'saved') {
      setSourceTab('default');
    }
  }, [isSavedTabDisabled, sourceTab, setSourceTab]);

  const showProgress = sourceTab === 'trip' && hasActiveDiary && tripSuitcases.length > 0;
  const showOnboarding =
    (sourceTab === 'default' || !currentUser) &&
    savedSuitcases.length === 0 &&
    tripSuitcases.length === 0 &&
    !guestSuitcase;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row relative lg:overflow-y-auto lg:custom-scrollbar">

      {/* ── AREA SINISTRA (Contenuto Principale) ── */}
      <div className="flex-1 flex flex-col px-4 pb-4 md:px-6 md:pb-6 lg:px-10 lg:pb-10 lg:pr-6 gap-4 relative z-floating-panel w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Toast localizzato sopra la lista */}
        <SuitcaseToast {...toast} />

        {/* RIGA 2: CONTROL BAR */}
        <div className="flex items-center justify-between gap-2 shrink-0 border-b border-white/5 pb-2 min-w-0 overflow-visible">
          <div className="flex bg-slate-950/50 rounded-xl border border-white/5 p-1 min-w-0">
            {(['trip', 'saved', 'default'] as const).map((tab) => {
              const label = tab === 'trip' ? 'Diario' : tab === 'saved' ? 'Salvate' : 'Template';
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
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isDisabled
                      ? 'opacity-60 cursor-not-allowed text-slate-500'
                      : sourceTab === tab
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-500 hover:text-white'
                    }`}
                >
                  {isDisabled && <Lock className="w-3 h-3 text-slate-500/50" />}
                  {label}
                </button>
              );
            })}
          </div>

          <DashboardActionGroup
            isCreating={isCreatingSuitcase}
            onCreateSuitcase={onCreateSuitcase}
            onCreateTemplate={onCreateTemplate}
            onOpenRecommendedSuitcase={onOpenRecommendedSuitcase}
            showRecommendedSuitcase={showRecommendedSuitcase}
          />
        </div>

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
                  Modifiche locali — salva quando sei pronto
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
                Continua valigia
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

        {showOnboarding && !showProgress && (
          <div className="w-full shrink-0">
            <SuitcaseOnboardingBox
              onCreateSuitcase={onCreateSuitcase}
              onUsaTemplateClick={handleUsaTemplateClick}
            />
          </div>
        )}

        {/* RIGA 4: COLONNE LISTE E PREVIEW */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 min-w-0 lg:items-start">

          <div 
            className={`flex flex-col lg:w-[45%] xl:w-[40%] min-w-0 transition-all duration-500 rounded-xl ${highlightTemplates ? 'ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : ''}`}
            ref={templatesSectionRef}
          >
            <div className="flex items-center justify-between mb-1 px-1 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">
                  {sourceTab === 'default' ? 'Template' : 'Valigie'}
                </h3>
              </div>
            </div>

            <div className="pr-2 animate-in fade-in duration-500">
              <div className="space-y-2">
                {displayList.length === 0 ? (
                  <div className="py-12 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-600">Nessun elemento trovato in questa sezione</p>
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
            <div className="flex items-center gap-3 mb-1 px-1 shrink-0 h-6">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">
                {sourceTab === 'default' ? 'Contenuto Template' : 'Contenuto Valigia'}
              </h3>
            </div>

            <div className="pr-2">
              <div key={previewTarget?.id} className="animate-in fade-in duration-300">
                <TemplatePreview
                  template={previewTarget}
                  sourceTab={sourceTab}
                  onAddCategory={onAddCategory}
                  onUpdateSuitcaseLocal={onUpdateSuitcaseLocal}
                  showHiddenCategories={showHiddenCategories}
                />
              </div>
            </div>
          </div>
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
