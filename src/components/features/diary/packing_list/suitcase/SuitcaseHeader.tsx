import React, { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2, ChevronLeft, Link2, Layout, Undo2, Redo2, CloudOff, CalendarDays, Search, Wrench, Save, Sparkles } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Suitcase } from '@/types/suitcase';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { SuitcaseAscentProgressIndicator, getAscentProgressColor } from './SuitcaseAscentProgressIndicator';
import { DashboardActionGroup } from './DashboardActionGroup';
import { isSessionReadOnly } from '@/utils/suitcaseDomain';
import type { SuitcasePanelViewMode } from '../SuitcaseFloatingPanel/types/panelViewMode';
import { SaveMenuPopover } from '@/components/save/SaveMenuPopover';
import { SuitcaseActionMenu } from './SuitcaseActionMenu';
import { DocumentSaveStatus } from '@/components/save/DocumentSaveStatus';
import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import { formatItalianDateTime } from '@/utils/dateFormatters';

/**
 * Cella quadrata condivisa dei 4 pulsanti azione mobile (Undo, Redo, Visualizza/Modifica, Azione).
 * Riusa i token già presenti nell'header (bg-slate-800/50, border-white/10, rounded-xl) così la
 * griglia 2×2 risulta perfettamente regolare e coerente con il resto dei pulsanti.
 */
const MOBILE_ACTION_BTN_CLASS =
  'inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-xl border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300';

interface SuitcaseHeaderProps {
  viewMode: SuitcasePanelViewMode;
  activeSuitcase: Suitcase | null;
  isEditingTitle: boolean;
  tempTitle: string;
  titleInputRef: React.RefObject<HTMLInputElement>;
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
  /** Selector view only — mobile/tablet create actions hosted next to the close button. */
  onCreateSuitcase?: () => void;
  onCreateTemplate?: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
  isCreatingSuitcase?: boolean;
  performUndo: () => Promise<boolean>;
  performRedo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  isGuest?: boolean;
  onGuestSaveAction?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onAutosaveToggle?: (enabled: boolean) => void;
  savePhase?: DocumentSavePhase;
  lastSavedAt?: number | null;
  lastSaveError?: string | null;
  autosaveEnabled?: boolean;
  canUseAutosave?: boolean;
  /** Azioni Suggerimenti — confluiscono nel menu "Azione" su mobile/tablet (<lg). */
  onOpenAiModal?: () => void;
  onOpenBlacklist?: () => void;
  blacklistCount?: number;
  isSeedingAi?: boolean;
  isBlacklistFlashing?: boolean;
  /** Avanzamento valigia — mostrato (mobile) sotto al titolo, in alternanza con le date. */
  checkedCount?: number;
  totalCount?: number;
  progressPerc?: number;
  /** Toggle Visualizza/Modifica spostato nell'header su mobile (riusa la logica esistente). */
  panelViewMode?: 'viewer' | 'editor';
  canToggleViewMode?: boolean;
  onSetViewMode?: (mode: 'viewer' | 'editor') => void;
  canUseTemplateAction?: boolean;
  onUseTemplate?: () => void;
}

export const SuitcaseHeader: React.FC<SuitcaseHeaderProps> = ({
  viewMode,
  activeSuitcase,
  isEditingTitle,
  tempTitle,
  titleInputRef,
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
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
  isCreatingSuitcase = false,
  performUndo,
  performRedo,
  canUndo,
  canRedo,
  isGuest = false,
  onGuestSaveAction,
  onSave,
  onSaveAs,
  onAutosaveToggle,
  savePhase = 'never_saved',
  lastSavedAt = null,
  lastSaveError = null,
  autosaveEnabled = false,
  canUseAutosave = false,
  onOpenAiModal,
  onOpenBlacklist,
  blacklistCount = 0,
  isSeedingAi = false,
  isBlacklistFlashing = false,
  checkedCount = 0,
  totalCount = 0,
  progressPerc = 0,
  panelViewMode = 'editor',
  canToggleViewMode = false,
  onSetViewMode,
  canUseTemplateAction = false,
  onUseTemplate,
}) => {
  const isDetailView = viewMode === 'editor' || viewMode === 'viewer';
  const isReadOnlySession =
    isDetailView && activeSuitcase
      ? isSessionReadOnly(activeSuitcase, viewMode)
      : false;
  const serverSavedAt =
    activeSuitcase?.updated_at && !Number.isNaN(Date.parse(activeSuitcase.updated_at))
      ? Date.parse(activeSuitcase.updated_at)
      : null;

  // Alternanza (solo mobile) fra blocco "date" e blocco "avanzamento" nello stesso spazio.
  // Un UNICO timer di 5s: si riavvia all'apertura della valigia (id) e ogni volta che cambia la
  // data di salvataggio REALMENTE mostrata all'utente (savedDisplayTs), a prescindere dalla sua
  // origine (salvataggio locale o timestamp del server). Negli altri momenti resta l'avanzamento.
  const [showInfo, setShowInfo] = useState(true);
  const savedDisplayTs = lastSavedAt ?? serverSavedAt;
  const infoPulse = `${activeSuitcase?.id ?? ''}|${savedDisplayTs ?? ''}`;
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setShowInfo(true);
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => setShowInfo(false), 5000);
    return () => {
      if (infoTimerRef.current) {
        clearTimeout(infoTimerRef.current);
        infoTimerRef.current = null;
      }
    };
  }, [infoPulse]);

  const progressAccent = getAscentProgressColor(progressPerc);
  const isViewer = panelViewMode === 'viewer';

  const undoRedoGroup = (
    <div className="flex items-center rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={performUndo}
        disabled={!canUndo}
        className={`p-2 md:p-2.5 transition-all ${canUndo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
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
        className={`p-2 md:p-2.5 transition-all ${canRedo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
        title="Ripristina (Ctrl+Y)"
        aria-label="Ripristina"
      >
        <Redo2 className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );

  // Controllo Visualizza/Modifica (mobile): unico pulsante toggle che riusa onSetViewMode.
  // Per i template (nessun toggle) resta l'azione "Usa Template", come nella toolbar.
  const viewModeMobileControl =
    canUseTemplateAction && onUseTemplate ? (
      <button
        type="button"
        onClick={onUseTemplate}
        className={MOBILE_ACTION_BTN_CLASS}
        aria-label="Usa Template"
        title="Usa Template"
      >
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
      </button>
    ) : canToggleViewMode && onSetViewMode ? (
      <button
        type="button"
        onClick={() => onSetViewMode(isViewer ? 'editor' : 'viewer')}
        className={MOBILE_ACTION_BTN_CLASS}
        aria-pressed={!isViewer}
        aria-label={isViewer ? 'Modifica' : 'Visualizza'}
        title={isViewer ? 'Modifica' : 'Visualizza'}
      >
        {isViewer ? (
          <Wrench className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
        ) : (
          <Search className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
        )}
      </button>
    ) : null;

  return (
    <div className="flex flex-col shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 relative">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 md:px-6 min-h-[3.75rem] py-1.5 md:py-0 md:h-24 w-full gap-2 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 justify-self-start">
          {isDetailView ? (
            <button 
              onClick={onBackToSelector}
              className="p-2 md:p-2.5 -ml-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all group"
              title="Torna alla selezione"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <Layout className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            {isDetailView && activeSuitcase ? (
              <div className="flex flex-col gap-1">
                {/* Mobile: nome + matita/floppy a destra (posizione stabile); date impilate sotto */}
                <div className="flex flex-col gap-1 min-w-0 w-full md:hidden">
                  <div className="flex items-center gap-2 min-w-0 w-full">
                    <TemplateCategoryIcon
                      template={activeSuitcase}
                      className="text-xl shrink-0 flex items-center justify-center"
                    />
                    {isEditingTitle && !isReadOnlySession ? (
                      <input
                        ref={titleInputRef}
                        value={tempTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={onSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
                        className="flex-1 min-w-0 bg-slate-800 border border-indigo-500/50 rounded-lg px-2 py-1 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        autoFocus
                      />
                    ) : (
                      <h2
                        onClick={isReadOnlySession ? undefined : onEditTitle}
                        className={`flex-1 min-w-0 text-base font-bold text-slate-50 truncate ${
                          isReadOnlySession ? '' : 'cursor-pointer hover:text-indigo-400 transition-colors'
                        }`}
                      >
                        {activeSuitcase.title}
                      </h2>
                    )}

                    {/* Rinomina/Salva su <lg sono nel menu "Azione"; qui il rename resta
                        disponibile col tap sul titolo. */}
                  </div>

                  {/* Stesso spazio verticale: le date (in-flow, definiscono l'altezza) e
                      l'avanzamento (overlay) si alternano in dissolvenza → header invariato. */}
                  <div className="relative min-w-0">
                    <div
                      className={`flex flex-col gap-0.5 min-w-0 transition-opacity duration-300 ${
                        showInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      aria-hidden={!showInfo}
                    >
                      {activeSuitcase.created_at && (
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 tabular-nums">
                          <CalendarDays className="w-3 h-3 shrink-0 text-slate-500" aria-hidden />
                          <span className="truncate">Creata il {formatItalianDateTime(activeSuitcase.created_at)}</span>
                        </span>
                      )}
                      {!isGuest && savedDisplayTs && (
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 tabular-nums">
                          <Save className="w-3 h-3 shrink-0 text-slate-500" aria-hidden />
                          <span className="truncate">Salvato il {formatItalianDateTime(savedDisplayTs)}</span>
                        </span>
                      )}
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center gap-2 min-w-0 transition-opacity duration-300 ${
                        showInfo ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                      aria-hidden={showInfo}
                      role="status"
                      aria-label={`Avanzamento valigia: ${checkedCount} su ${totalCount}, ${progressPerc} percento`}
                    >
                      <span className="text-xs font-black tabular-nums leading-none" style={{ color: progressAccent }}>
                        {progressPerc}%
                      </span>
                      <div className="w-14 shrink-0">
                        <SuitcaseAscentProgressIndicator progressPerc={progressPerc} />
                      </div>
                      <span className="text-[11px] font-black text-white tabular-nums leading-none">
                        {checkedCount}
                        <span className="text-slate-400 font-bold mx-0.5" aria-hidden>/</span>
                        {totalCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop: layout originale */}
                <div className="hidden md:flex items-center gap-4 flex-wrap min-w-0 w-full">
                  <div className="flex items-center gap-2 group min-w-0 flex-1">
                    <TemplateCategoryIcon
                      template={activeSuitcase}
                      className="text-3xl shrink-0 flex items-center justify-center"
                    />
                    {isEditingTitle && !isReadOnlySession ? (
                      <input
                        ref={titleInputRef}
                        value={tempTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={onSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
                        className="bg-slate-800 border border-indigo-500/50 rounded-lg px-3 py-1 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full max-w-[400px]"
                        autoFocus
                      />
                    ) : (
                      <h2
                        onClick={isReadOnlySession ? undefined : onEditTitle}
                        className={`text-2xl font-bold text-slate-50 truncate flex items-center gap-2 min-w-0 ${
                          isReadOnlySession ? '' : 'cursor-pointer hover:text-indigo-400 transition-colors'
                        }`}
                      >
                        {activeSuitcase.title}
                        {!isReadOnlySession && (
                          <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
                        )}
                      </h2>
                    )}
                    {viewMode === 'editor' && !isReadOnlySession && onSave && onSaveAs && onAutosaveToggle && (
                      <SaveMenuPopover
                        isGuest={isGuest}
                        autosaveEnabled={autosaveEnabled}
                        canUseAutosave={canUseAutosave}
                        onSave={onSave}
                        onSaveAs={onSaveAs}
                        onAutosaveToggle={onAutosaveToggle}
                        onGuestAction={onGuestSaveAction}
                        disabled={savePhase === 'saving'}
                        className="shrink-0 hidden lg:block"
                      />
                    )}
                  </div>
                </div>

                <div className="hidden md:block ml-1 min-w-0">
                  <DocumentSaveStatus
                    phase={savePhase}
                    lastSavedAt={lastSavedAt}
                    lastError={lastSaveError}
                    isGuest={isGuest}
                    fallbackSavedAt={serverSavedAt}
                    dateFormat="datetime"
                    className="!normal-case !tracking-normal text-slate-500 font-medium"
                  />
                </div>

                {activeSuitcase.created_at && (
                  <div className="hidden md:flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-3 md:gap-4 text-[10px] font-semibold text-slate-300 tabular-nums ml-1">
                    <span className="flex items-center gap-1.5">
                      <span title="Data creazione">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden />
                      </span>
                      <span>Creata il {formatItalianDateTime(activeSuitcase.created_at)}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <h2 className="text-base md:text-2xl font-bold text-white tracking-tight">Le mie Valigie</h2>
            )}
            
            {!isDetailView && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                  Gestione bagagli
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Colonna centrale: segnaposto per la stabilità della griglia su mobile. */}
        <div className="justify-self-center shrink-0 md:hidden" aria-hidden />

        <div className="flex items-center gap-2 md:gap-3 justify-self-end shrink-0 md:col-start-3">
          {/* Desktop (≥lg): azioni editor su riga singola (layout invariato). */}
          {isDetailView && activeSuitcase && viewMode === 'editor' && !isReadOnlySession && (
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center shrink-0">
              {isLinkedToItinerary ? (
                <button
                  onClick={onUnlink}
                  className="flex items-center gap-0 md:gap-2 p-2 md:px-4 md:py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-all group shadow-lg shadow-emerald-500/5"
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
                  className={`flex items-center gap-0 md:gap-2 p-2 md:px-4 md:py-2 rounded-xl border border-white/10 transition-all shadow-lg ${
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
                  className="flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-xl bg-slate-800/50 border border-white/10"
                  title="I template non possono essere collegati al diario"
                >
                  <Layout className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline">
                    Template · Non associabile
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-xl bg-slate-800/50 border border-white/10">
                  <CloudOff className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline">Offline</span>
                </div>
              )}
              </div>

              {undoRedoGroup}

              <button
                onClick={onDelete}
                className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 transition-all shadow-lg"
                title="Elimina valigia"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile/Tablet (<lg): due righe accanto alla X →
              riga 1: Undo/Redo · riga 2: Visualizza/Modifica + Azione. */}
          {isDetailView && activeSuitcase && (viewModeMobileControl || (viewMode === 'editor' && !isReadOnlySession)) && (
            <div className="flex flex-col items-end gap-1 lg:hidden">
              {viewMode === 'editor' && !isReadOnlySession && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={performUndo}
                    disabled={!canUndo}
                    className={MOBILE_ACTION_BTN_CLASS}
                    title="Annulla (Ctrl+Z)"
                    aria-label="Annulla"
                  >
                    <Undo2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={performRedo}
                    disabled={!canRedo}
                    className={MOBILE_ACTION_BTN_CLASS}
                    title="Ripristina (Ctrl+Y)"
                    aria-label="Ripristina"
                  >
                    <Redo2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1">
                {viewModeMobileControl}
                {viewMode === 'editor' && !isReadOnlySession && (
                  <SuitcaseActionMenu
                    className="w-9 h-9 inline-flex items-center justify-center"
                    onRename={onEditTitle}
                    onSave={onSave}
                    onSaveAs={onSaveAs}
                    onAutosaveToggle={onAutosaveToggle}
                    autosaveEnabled={autosaveEnabled}
                    canUseAutosave={canUseAutosave}
                    savePhase={savePhase}
                    isGuest={isGuest}
                    onGuestSaveAction={onGuestSaveAction}
                    onDelete={onDelete}
                    isLinkedToItinerary={isLinkedToItinerary}
                    isAssociable={isAssociable}
                    isDiaryAssociable={isDiaryAssociable}
                    onLink={onLink}
                    onUnlink={onUnlink}
                    onOpenAiModal={onOpenAiModal}
                    onOpenBlacklist={onOpenBlacklist}
                    blacklistCount={blacklistCount}
                    isSeedingAi={isSeedingAi}
                    isBlacklistFlashing={isBlacklistFlashing}
                  />
                )}
              </div>
            </div>
          )}

          {saveStatus && !lastSavedAt && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mr-2 shadow-lg shadow-emerald-500/5">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{saveStatus}</span>
            </div>
          )}

          {/*
            * Selector view, mobile/tablet (< lg): le azioni di creazione vivono qui accanto
            * alla X per liberare la riga dei tab della Dashboard. Su desktop restano nella
            * toolbar della Dashboard, quindi qui sono lg:hidden. Riuso diretto di
            * DashboardActionGroup (stessi pulsanti, incluso "Crea Valigia Personalizzata").
            */}
          {!isDetailView && onCreateSuitcase && onCreateTemplate && (
            <div className="lg:hidden -mr-1 sm:mr-0">
              <DashboardActionGroup
                isCreating={isCreatingSuitcase}
                onCreateSuitcase={onCreateSuitcase}
                onCreateTemplate={onCreateTemplate}
                onOpenRecommendedSuitcase={onOpenRecommendedSuitcase}
                showRecommendedSuitcase={showRecommendedSuitcase}
                compact
              />
            </div>
          )}

          <CloseButton onClose={onClose} variant="primary" />
        </div>
      </div>
    </div>
  );
};
