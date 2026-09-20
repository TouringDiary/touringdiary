import { CheckSquare, Eye, Info, Loader2, Plus, Square, Tags, Users, Wand2, X } from 'lucide-react';
import type React from 'react';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import {
  type FamousPersonPublishGap,
  getFamousPersonFieldLabel,
  getMissingFamousPersonFields,
} from '@/domain/city/famousPersonCompleteness';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import {
  type FamousPersonMasterDto,
  type FamousPersonSpecificDto,
  loadFamousPersonTaxonomy,
} from '@/services/city/famousPersonCategoryService';
import { usePeopleManager } from '../../../../hooks/admin/usePeopleManager';
import type { FamousPerson, User } from '../../../../types/index';
import { CultureCornerModal } from '../../../modals/CultureCornerModal';
import { AdminFamousPeopleCategoriesManager } from '../../AdminFamousPeopleCategoriesManager';
import { WikidataConfirmModal } from '../../wikimedia/WikidataConfirmModal';
import { CulturePeopleDiscovery } from './CulturePeopleDiscovery';
import { CulturePeopleModals } from './CulturePeopleModals';
import { CulturePersonCard } from './CulturePersonCard';

interface CulturePeopleProps {
  cityId: string;
  cityName: string;
  /** Compatibilità chiamanti — non utilizzato dal componente. */
  currentUser?: User;
}

function getPersistedPersonId(person: FamousPerson): string | null {
  const { id } = person;
  return typeof id === 'string' && id.trim().length > 0 ? id : null;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

/** Focus trap modale categorie (Tab/Shift+Tab); ESC e restore focus via useGlobalModalEscape. */
function useCategoriesDialogFocusTrap(
  active: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  initialFocusRef: RefObject<HTMLButtonElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, dialogRef, initialFocusRef]);
}

export const CulturePeople: React.FC<CulturePeopleProps> = ({ cityId, cityName }) => {
  const { city } = useCityEditor();
  const { aiBlocked, blockMessage, guardAiAction } = useAiRuntimeGate();

  const {
    peopleList,
    isLoading,
    processingId,
    isDiscovering,
    discoveryResults,
    isDeleting,
    isBulkProcessing,
    selectedIds,
    toggleSelection,
    toggleAll,
    bulkUpdateStatus,
    wipeAndRewritePerson,
    regeneratePortrait,
    completeMissingFieldWithAi,
    recoverPersonDatesWithAi,
    fieldGenerating,
    fixPeopleBatch,
    addManualPerson,
    deletePerson,
    updatePersonLocal,
    savePersonChanges,
    toggleStatus,
    reorderPerson,
    runDiscovery,
    importDiscoveryPerson,
    removeDiscoveryResult,
    aiImageStepChoice,
    setAiImageStepChoice,
    aiImageStepModalCopy,
    wikidataImportUi,
    wikidataImportProcessing,
    closeWikidataImportUi,
    selectWikidataCandidate,
    confirmWikidataCommonsImport,
  } = usePeopleManager(cityId, cityName);

  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [aiContextQuery, setAiContextQuery] = useState('');
  const [discoveryCount, setDiscoveryCount] = useState<number>(3);
  /** Draft ordine: commit su blur / Enter (non a ogni onChange). */
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [refineTarget, setRefineTarget] = useState<FamousPerson | null>(null);
  const [showBulkFixConfirm, setShowBulkFixConfirm] = useState(false);
  const [publishBlock, setPublishBlock] = useState<{
    person: FamousPerson;
    missingFields: FamousPersonPublishGap[];
    otherIncompleteCount?: number;
  } | null>(null);

  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewInitialId, setPreviewInitialId] = useState<string | undefined>(undefined);
  const [isCategoriesOverlayOpen, setIsCategoriesOverlayOpen] = useState(false);
  const categoriesOpenButtonRef = useRef<HTMLButtonElement>(null);
  const categoriesCloseButtonRef = useRef<HTMLButtonElement>(null);
  const categoriesDialogRef = useRef<HTMLDivElement>(null);

  useGlobalModalEscape(isCategoriesOverlayOpen, () => {
    setIsCategoriesOverlayOpen(false);
    queueMicrotask(() => categoriesOpenButtonRef.current?.focus());
  });

  useCategoriesDialogFocusTrap(
    isCategoriesOverlayOpen,
    categoriesDialogRef,
    categoriesCloseButtonRef,
  );

  const [masters, setMasters] = useState<FamousPersonMasterDto[]>([]);
  const [specifics, setSpecifics] = useState<FamousPersonSpecificDto[]>([]);

  // Logical correction: reset outdated UI state when cityId changes
  useEffect(() => {
    if (!cityId) return;
    setExpandedPersonId(null);
    setAiContextQuery('');
    setOrderDrafts({});
    setDeleteTarget(null);
    setRefineTarget(null);
    setShowBulkFixConfirm(false);
    setPublishBlock(null);
    setSuccessModal({ isOpen: false, message: '' });
    setPreviewModalOpen(false);
    setPreviewInitialId(undefined);
  }, [cityId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const taxonomy = await loadFamousPersonTaxonomy({ activeOnly: false });
        if (cancelled) return;
        setMasters(taxonomy.masters);
        setSpecifics(taxonomy.specifics);
      } catch (e) {
        console.error('[CulturePeople] taxonomy load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddManual = async () => {
    const newId = await addManualPerson();
    if (newId) setExpandedPersonId(newId);
  };

  const handleDeleteRequest = (person: FamousPerson) => {
    if (!person.id) return;
    setDeleteTarget({ id: person.id, name: person.name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await deletePerson(deleteTarget.id);
    if (success) setDeleteTarget(null);
    else alert('Errore cancellazione.');
  };

  const handleRefineRequest = (person: FamousPerson) => {
    setRefineTarget(person);
  };

  const confirmRefine = async () => {
    if (!refineTarget) return;
    if (!guardAiAction()) {
      setRefineTarget(null);
      return;
    }
    const target = refineTarget;
    setRefineTarget(null);
    const result = await wipeAndRewritePerson(target);
    if (!result?.success) {
      alert(`Errore durante la bonifica: ${result?.error || 'Sconosciuto'}`);
    } else {
      setSuccessModal({ isOpen: true, message: `Bonifica completata per ${target.name}` });
    }
  };

  const confirmBulkFix = async () => {
    if (!guardAiAction()) {
      setShowBulkFixConfirm(false);
      return;
    }
    setShowBulkFixConfirm(false);
    const result = await fixPeopleBatch();
    if (result?.success) {
      setSuccessModal({
        isOpen: true,
        message: `Bonifica completata! Processati ${result.count} personaggi${result.failed ? ` (${result.failed} falliti)` : ''}.`,
      });
    } else if (result) {
      alert(
        `Bonifica parziale: ${result.count} ok, ${result.failed ?? 0} falliti. Controlla i personaggi e riprova.`,
      );
    }
  };

  const handleOpenPreview = (personId?: string) => {
    setPreviewInitialId(personId);
    setPreviewModalOpen(true);
  };

  const handleToggleStatus = async (person: FamousPerson) => {
    const result = await toggleStatus(person);
    if (!result.ok) {
      if (result.cause === 'incomplete') {
        setPublishBlock({ person: result.person, missingFields: result.missingFields });
        const id = getPersistedPersonId(result.person);
        if (id) setExpandedPersonId(id);
      } else {
        alert(`Errore cambio stato: ${result.message}`);
      }
    }
  };

  const handleBulkPublish = async () => {
    const results = await bulkUpdateStatus('published');
    const incomplete = results.filter(
      (r): r is Extract<typeof r, { ok: false; cause: 'incomplete' }> =>
        !r.ok && r.cause === 'incomplete',
    );
    const runtime = results.find((r) => !r.ok && r.cause === 'runtime');
    if (runtime && !runtime.ok) {
      alert(`Errore pubblicazione: ${runtime.message}`);
      return;
    }
    if (incomplete.length > 0) {
      const first = incomplete[0];
      setPublishBlock({
        person: first.person,
        missingFields: first.missingFields,
        otherIncompleteCount: incomplete.length > 1 ? incomplete.length - 1 : undefined,
      });
      const id = getPersistedPersonId(first.person);
      if (id) setExpandedPersonId(id);
    }
  };

  const handleBulkDraft = async () => {
    const results = await bulkUpdateStatus('draft');
    for (const result of results) {
      if (result.ok) continue;
      if (result.cause === 'runtime') {
        alert(`Errore impostazione bozza: ${result.message}`);
        return;
      }
    }
  };

  const handleGenerateMissingField = async (field: FamousPersonPublishGap) => {
    if (!publishBlock) return;

    if (field === 'categories') {
      const id = getPersistedPersonId(publishBlock.person);
      if (id) setExpandedPersonId(id);
      setPublishBlock(null);
      return;
    }

    if (!guardAiAction()) return;

    if (field === 'dates') {
      const updated = await recoverPersonDatesWithAi(publishBlock.person);
      if (!updated) {
        alert("Impossibile recuperare le date con l'AI. Riprova o compila manualmente.");
        return;
      }
      const stillMissing = getMissingFamousPersonFields(updated);
      if (stillMissing.length === 0) {
        setPublishBlock(null);
        setSuccessModal({
          isOpen: true,
          message: `${updated.name} è completo. Puoi pubblicarlo.`,
        });
      } else {
        setPublishBlock({ person: updated, missingFields: stillMissing });
      }
      return;
    }

    const updated = await completeMissingFieldWithAi(publishBlock.person, field);
    if (!updated) {
      alert(
        `Impossibile generare «${getFamousPersonFieldLabel(field)}» con l'AI. Riprova o compila manualmente.`,
      );
      return;
    }
    const stillMissing = getMissingFamousPersonFields(updated);
    if (stillMissing.length === 0) {
      setPublishBlock(null);
      setSuccessModal({
        isOpen: true,
        message: `${updated.name} è completo. Puoi pubblicarlo.`,
      });
    } else {
      setPublishBlock({ person: updated, missingFields: stillMissing });
    }
  };

  const selectableIds = peopleList
    .map((p) => p.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const isSelectionActive = selectedCount > 0;

  const commitOrderDraft = (personId: string) => {
    const draft = orderDrafts[personId];
    if (draft === undefined) return;
    const raw = draft.trim();
    setOrderDrafts((prev) => {
      const next = { ...prev };
      delete next[personId];
      return next;
    });
    if (raw === '') return;
    const nextRank = Number(raw);
    if (!Number.isFinite(nextRank) || !Number.isInteger(nextRank) || nextRank < 1) return;
    void reorderPerson(personId, nextRank);
  };

  return (
    <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl relative">
      <WikidataConfirmModal
        isOpen={Boolean(wikidataImportUi)}
        subjectLabel={wikidataImportUi?.personName ?? ''}
        proposal={wikidataImportUi?.proposal ?? null}
        ambiguousCandidates={wikidataImportUi?.ambiguousCandidates ?? []}
        errorMessage={wikidataImportUi?.errorMessage ?? null}
        isProcessing={wikidataImportProcessing}
        onClose={closeWikidataImportUi}
        onSkip={closeWikidataImportUi}
        onSelectCandidate={(candidate) => void selectWikidataCandidate(candidate)}
        onConfirm={(proposal) => void confirmWikidataCommonsImport(proposal)}
      />

      <CulturePeopleModals
        successModal={successModal}
        setSuccessModal={setSuccessModal}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        confirmDelete={confirmDelete}
        isDeleting={isDeleting}
        refineTarget={refineTarget}
        setRefineTarget={setRefineTarget}
        confirmRefine={confirmRefine}
        publishBlock={publishBlock}
        setPublishBlock={setPublishBlock}
        setExpandedPersonId={setExpandedPersonId}
        fieldGenerating={fieldGenerating}
        aiBlocked={aiBlocked}
        blockMessage={blockMessage}
        handleGenerateMissingField={handleGenerateMissingField}
        showBulkFixConfirm={showBulkFixConfirm}
        setShowBulkFixConfirm={setShowBulkFixConfirm}
        confirmBulkFix={confirmBulkFix}
        isSelectionActive={isSelectionActive}
        selectedCount={selectedCount}
        peopleListCount={peopleList.length}
      />

      {isCategoriesOverlayOpen ? (
        <div
          ref={categoriesDialogRef}
          className="fixed inset-0 z-admin-modal bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="culture-people-categories-title"
          tabIndex={-1}
        >
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-violet-600 rounded-lg shrink-0">
                <Tags className="w-5 h-5 text-white" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2
                  id="culture-people-categories-title"
                  className="text-lg font-bold text-white uppercase tracking-wide truncate"
                >
                  Categoria Personaggio
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                  Tassonomia globale · contesto {cityName}
                </p>
              </div>
            </div>
            <button
              ref={categoriesCloseButtonRef}
              type="button"
              onClick={() => {
                setIsCategoriesOverlayOpen(false);
                queueMicrotask(() => categoriesOpenButtonRef.current?.focus());
              }}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 shrink-0"
              aria-label="Chiudi gestione categorie Personaggio"
            >
              <X className="w-6 h-6" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <AdminFamousPeopleCategoriesManager
              embedded
              contextCityId={cityId}
              contextCityName={cityName}
            />
          </div>
        </div>
      ) : null}

      {previewModalOpen && city && (
        <CultureCornerModal
          isOpen={true}
          onClose={() => setPreviewModalOpen(false)}
          city={{ ...city, details: { ...city.details, famousPeople: peopleList } }}
          onAddToItinerary={() => {}}
          initialPersonId={previewInitialId}
        />
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" aria-hidden /> Personaggi
            Famosi
          </h3>
          <span className="text-xs bg-slate-950 px-2 py-1 rounded text-slate-500 font-mono border border-slate-800">
            {peopleList.length} totali
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {peopleList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkFixConfirm(true)}
              disabled={isBulkProcessing || isLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 min-h-11 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 shadow-lg shadow-purple-900/20 border border-purple-500"
              title={isSelectionActive ? 'Riscrivi selezionati' : 'Riscrivi e correggi TUTTI'}
            >
              {isBulkProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="w-4 h-4" aria-hidden />
              )}
              {isBulkProcessing
                ? 'Bonifica in corso...'
                : isSelectionActive
                  ? `Magic Fix (${selectedCount})`
                  : 'Magic Fix (Tutti)'}
            </button>
          )}

          <button
            ref={categoriesOpenButtonRef}
            type="button"
            onClick={() => setIsCategoriesOverlayOpen(true)}
            className="bg-slate-800 hover:bg-violet-600 text-slate-400 hover:text-white px-3 py-2.5 min-h-11 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          >
            <Tags className="w-3.5 h-3.5" aria-hidden />
            Categoria Personaggio
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block"></div>

          <button
            type="button"
            onClick={() => handleOpenPreview()}
            className="inline-flex items-center justify-center min-h-11 min-w-11 bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
            title="Anteprima Lista"
            aria-label="Anteprima lista"
          >
            <Eye className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleAddManual}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 min-h-11 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" aria-hidden /> <span className="hidden md:inline">Nuovo</span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 bg-blue-900/10 border border-blue-500/20 p-3 rounded-xl">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-blue-200 leading-relaxed">
          <strong>Nota Legale:</strong> I ritratti storici generati dall'AI sono interpretazioni
          artistiche a scopo illustrativo. Non costituiscono documentazione storica fotografica
          ufficiale. Questo disclaimer è visibile anche agli utenti.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center justify-center min-h-11 min-w-11 p-1.5 rounded hover:bg-slate-800 transition-colors"
            aria-label={
              allSelected ? 'Deseleziona tutti i personaggi' : 'Seleziona tutti i personaggi'
            }
            aria-pressed={allSelected}
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-500" aria-hidden />
            ) : (
              <Square className="w-5 h-5" aria-hidden />
            )}
          </button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {selectedCount} SELEZIONATI
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
            <button
              type="button"
              onClick={() => handleBulkPublish()}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-1.5 min-h-11 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/30"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden /> Pubblica
            </button>
            <button
              type="button"
              onClick={() => handleBulkDraft()}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 px-3 py-1.5 min-h-11 rounded-lg text-[10px] font-bold uppercase transition-colors border border-amber-500/30"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden /> Bozza
            </button>
          </div>
        )}
      </div>

      <CulturePeopleDiscovery
        aiContextQuery={aiContextQuery}
        setAiContextQuery={setAiContextQuery}
        discoveryCount={discoveryCount}
        setDiscoveryCount={setDiscoveryCount}
        isDiscovering={isDiscovering}
        discoveryResults={discoveryResults}
        runDiscovery={runDiscovery}
        importDiscoveryPerson={importDiscoveryPerson}
        removeDiscoveryResult={removeDiscoveryResult}
        aiBlocked={aiBlocked}
        blockMessage={blockMessage}
        guardAiAction={guardAiAction}
        aiImageStepChoice={aiImageStepChoice}
        setAiImageStepChoice={setAiImageStepChoice}
        aiImageStepModalCopy={aiImageStepModalCopy}
      />

      <div className="space-y-4 md:max-h-[min(600px,70vh)] md:overflow-y-auto custom-scrollbar md:pr-1">
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" aria-hidden />
          </div>
        ) : (
          peopleList.map((p, idx) => {
            if (!p.id) return null;
            const personId = p.id;
            const isExpanded = expandedPersonId === personId;
            const isProcessingThis = processingId === personId;
            const isSelected = selectedIds.has(personId);

            return (
              <CulturePersonCard
                key={`${cityId}-${personId}`}
                person={p}
                idx={idx}
                isExpanded={isExpanded}
                toggleExpanded={() => {
                  if (isProcessingThis) return;
                  setExpandedPersonId(isExpanded ? null : personId);
                }}
                isSelected={isSelected}
                toggleSelection={toggleSelection}
                isProcessingThis={isProcessingThis}
                orderDraftValue={orderDrafts[personId]}
                setOrderDraftValue={(value) =>
                  setOrderDrafts((prev) => ({ ...prev, [personId]: value }))
                }
                commitOrderDraft={() => commitOrderDraft(personId)}
                handleOpenPreview={handleOpenPreview}
                handleDeleteRequest={handleDeleteRequest}
                handleRefineRequest={handleRefineRequest}
                handleToggleStatus={handleToggleStatus}
                updatePersonLocal={updatePersonLocal}
                savePersonChanges={savePersonChanges}
                regeneratePortrait={regeneratePortrait}
                completeMissingFieldWithAi={completeMissingFieldWithAi}
                recoverPersonDatesWithAi={recoverPersonDatesWithAi}
                fieldGenerating={fieldGenerating}
                aiBlocked={aiBlocked}
                blockMessage={blockMessage}
                guardAiAction={guardAiAction}
                masters={masters}
                specifics={specifics}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
