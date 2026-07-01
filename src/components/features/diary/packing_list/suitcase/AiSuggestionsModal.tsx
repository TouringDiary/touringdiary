import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ChevronLeft, Check, XCircle } from 'lucide-react';
import {
  CORE_CATEGORY_NAMES,
  CATEGORY_ORDER,
  normalizeCategoryName,
  SystemCategoryName,
} from '@/domain/packing/packingCategories';
import {
  AiQuotaFeedback,
  AiSuggestion,
} from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import {
  AiSuggestionsSetupStep,
  AiQuotaMode,
} from './AiSuggestionsSetupStep';
import { AiSuggestionsReviewStep } from './AiSuggestionsReviewStep';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { ToastVariant } from '@/types/toast';
import {
  buildUniformLimitMap,
  GetAiCandidatesOptions,
  normalizeLimitPerCategory,
} from '@/hooks/useSuitcaseSystem';

interface AiSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    categories: string[],
    mode: 'direct' | 'review',
    options?: GetAiCandidatesOptions
  ) => void;
  onShowMore: () => void;
  onAccept: (name: string, category: string) => Promise<void>;
  onReject: (name: string, category: string) => Promise<void>;
  showToast?: (message: string, description?: string, variant?: ToastVariant) => void;
  isGenerating: boolean;
  initialCategories?: string[];
  suggestions: AiSuggestion[];
  hasMore: boolean;
  quotaFeedback?: AiQuotaFeedback | null;
  exhaustedCategories?: string[];
}

const DEFAULT_UNIFORM_LIMIT = 3;

function buildSuggestionKey(name: string, category: string): string {
  return `${category}::${name}`;
}

const FOOTER_SECONDARY_BTN_CLASS =
  'text-[10px] font-black text-slate-400 uppercase tracking-widest';

/** Pulsante "indietro" compatto del footer review (freccia standard dell'app). */
const FOOTER_REVIEW_BACK_BTN_CLASS =
  'inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/** Dimensioni condivise per i CTA azione del footer review, su un'unica riga. */
const FOOTER_REVIEW_ACTION_BTN_CLASS =
  'inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-3 rounded-xl border box-border text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const FOOTER_REVIEW_ACCEPT_BTN_CLASS = `${FOOTER_REVIEW_ACTION_BTN_CLASS} border-transparent bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95`;

const FOOTER_REVIEW_ACCEPT_ALL_BTN_CLASS = `${FOOTER_REVIEW_ACTION_BTN_CLASS} border-emerald-500/30 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20`;

const FOOTER_REVIEW_REJECT_BTN_CLASS = `${FOOTER_REVIEW_ACTION_BTN_CLASS} border-rose-500/30 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20`;

const TITLE_FALLBACK_DESKTOP =
  'text-xl font-display font-bold text-white uppercase tracking-wide leading-none';
const TITLE_FALLBACK_MOBILE =
  'text-lg font-display font-bold text-white uppercase tracking-wide leading-none';

export const AiSuggestionsModal: React.FC<AiSuggestionsModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onShowMore,
  onAccept,
  onReject,
  showToast,
  isGenerating,
  initialCategories = [],
  suggestions,
  hasMore,
  quotaFeedback = null,
  exhaustedCategories = [],
}) => {
  const [step, setStep] = useState<'setup' | 'review'>('setup');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mode, setMode] = useState<'direct' | 'review'>('review');
  const [quotaMode, setQuotaMode] = useState<AiQuotaMode>('uniform');
  const [uniformLimit, setUniformLimit] = useState(DEFAULT_UNIFORM_LIMIT);
  const [customLimits, setCustomLimits] = useState<Partial<Record<SystemCategoryName, number>>>({});
  const [removedCategories, setRemovedCategories] = useState<string[]>([]);
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'accept-all' | 'reject-all' | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [selectedForAcceptKeys, setSelectedForAcceptKeys] = useState<Set<string>>(new Set());

  const isMobile = useMobileDetect();
  const titleStyle = useDynamicStyles('suitcase_title', isMobile);
  const subtitleStyle = useDynamicStyles('suitcase_text_support', isMobile);
  const titleFallback = isMobile ? TITLE_FALLBACK_MOBILE : TITLE_FALLBACK_DESKTOP;

  useEffect(() => {
    if (isOpen && selectedCategories.length === 0) {
      setSelectedCategories(initialCategories.length > 0 ? initialCategories : [...CORE_CATEGORY_NAMES].slice(0, 4));
    }
  }, [isOpen, initialCategories, selectedCategories.length]);

  // Blocca lo scroll della pagina sottostante mentre la modale è aperta
  // (stesso pattern di CategoryMobileDialog / GalleryLightbox).
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep('setup');
      setShowAddCategoryDropdown(false);
      setRemovedCategories([]);
      setBulkConfirm(null);
      setIsBulkRunning(false);
      setSelectedForAcceptKeys(new Set());
    }
  }, [isOpen]);

  const buildGenerateOptions = useCallback((): GetAiCandidatesOptions => {
    if (quotaMode === 'uniform') {
      return {
        limitPerCategory: buildUniformLimitMap(selectedCategories, uniformLimit),
      };
    }
    const map: Partial<Record<SystemCategoryName, number>> = {};
    for (const cat of selectedCategories) {
      const normalized = normalizeCategoryName(cat) as SystemCategoryName;
      map[normalized] = customLimits[normalized] ?? uniformLimit;
    }
    return { limitPerCategory: normalizeLimitPerCategory(map) };
  }, [quotaMode, uniformLimit, customLimits, selectedCategories]);

  if (!isOpen) return null;

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const bulkDisabled = isGenerating || isBulkRunning || pendingSuggestions.length === 0;
  const selectedPendingCount = pendingSuggestions.filter((s) =>
    selectedForAcceptKeys.has(buildSuggestionKey(s.name, s.category))
  ).length;
  const hasSelectedPending = selectedPendingCount > 0;

  const handleToggleSelectForAccept = (name: string, category: string) => {
    const key = buildSuggestionKey(name, category);
    setSelectedForAcceptKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRejectSuggestion = async (name: string, category: string) => {
    const key = buildSuggestionKey(name, category);
    setSelectedForAcceptKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    await onReject(name, category);
  };

  const acceptPendingSuggestions = async (toAccept: AiSuggestion[]) => {
    if (toAccept.length === 0) return;

    setIsBulkRunning(true);
    try {
      for (const s of toAccept) {
        await onAccept(s.name, s.category);
      }
      setSelectedForAcceptKeys((prev) => {
        const next = new Set(prev);
        for (const s of toAccept) {
          next.delete(buildSuggestionKey(s.name, s.category));
        }
        return next;
      });
      showToast?.(
        toAccept.length === 1 ? 'Suggerimento accettato' : `${toAccept.length} suggerimenti accettati`,
        'Gli oggetti sono stati aggiunti alla valigia.',
        'success'
      );
      onClose();
    } finally {
      setIsBulkRunning(false);
    }
  };

  const runAcceptSelected = () => {
    const toAccept = pendingSuggestions.filter((s) =>
      selectedForAcceptKeys.has(buildSuggestionKey(s.name, s.category))
    );
    void acceptPendingSuggestions(toAccept);
  };

  const handleDismiss = () => {
    if (isBulkRunning) return;
    onClose();
  };

  const runBulkAccept = async () => {
    const count = pendingSuggestions.length;
    if (count === 0) return;

    try {
      await acceptPendingSuggestions(pendingSuggestions);
    } finally {
      setBulkConfirm(null);
    }
  };

  const runBulkReject = async () => {
    const count = pendingSuggestions.length;
    if (count === 0) return;

    setIsBulkRunning(true);
    try {
      for (const s of pendingSuggestions) {
        await onReject(s.name, s.category);
      }
      showToast?.(
        count === 1 ? 'Suggerimento rifiutato' : `${count} suggerimenti rifiutati`,
        'Gli oggetti non verranno più suggeriti per questa valigia.',
        'success'
      );
      onClose();
    } finally {
      setIsBulkRunning(false);
      setBulkConfirm(null);
    }
  };

  const removeCategory = (cat: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
    setRemovedCategories(prev => (prev.includes(cat) ? prev : [...prev, cat]));
    const normalized = normalizeCategoryName(cat) as SystemCategoryName;
    setCustomLimits(prev => {
      const next = { ...prev };
      delete next[normalized];
      return next;
    });
  };

  const restoreCategory = (cat: string) => {
    setRemovedCategories(prev => prev.filter(c => c !== cat));
    if (!selectedCategories.includes(cat)) {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const addCategory = (cat: string) => {
    if (!selectedCategories.includes(cat)) {
      setSelectedCategories(prev => [...prev, cat]);
    }
    setRemovedCategories(prev => prev.filter(c => c !== cat));
    setShowAddCategoryDropdown(false);
  };

  const handleSetQuotaMode = (next: AiQuotaMode) => {
    setQuotaMode(next);
  };

  const availableCategories = CATEGORY_ORDER.filter(
    c => !selectedCategories.includes(c) && !removedCategories.includes(c)
  );

  const handleGenerate = () => {
    const options = buildGenerateOptions();
    if (mode === 'direct') {
      onGenerate(selectedCategories, 'direct', options);
      onClose();
    } else {
      setStep('review');
      onGenerate(selectedCategories, 'review', options);
    }
  };

  return createPortal(
    <div
      className="td-modal-overlay bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      style={{ zIndex: Z_OVERLAY }}
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-300 flex flex-col max-h-[calc(100dvh-var(--header-height)-env(safe-area-inset-bottom,0px)-0.5rem)] sm:max-h-[90vh] pb-safe sm:pb-0"
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton
          onClose={handleDismiss}
          disableIfDirty={isBulkRunning}
          disabled={isBulkRunning}
          variant="primary"
          position="absolute"
          className="top-6 right-8"
        />

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4 pr-12 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
              <Sparkles className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`${titleStyle || titleFallback} mb-1`}>Suggerimenti AI</h3>
              <p className={`${subtitleStyle || "text-[13.5px] text-slate-400 font-medium"}`}>
                {step === 'setup'
                  ? 'Scegli categorie e quantità dei suggerimenti'
                  : 'Revisione suggerimenti per categoria'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-8 custom-scrollbar">
          {step === 'setup' ? (
            <AiSuggestionsSetupStep
              selectedCategories={selectedCategories}
              removedCategories={removedCategories}
              availableCategories={availableCategories}
              showAddCategoryDropdown={showAddCategoryDropdown}
              mode={mode}
              quotaMode={quotaMode}
              uniformLimit={uniformLimit}
              customLimits={customLimits}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onRestoreCategory={restoreCategory}
              onToggleDropdown={() => setShowAddCategoryDropdown(!showAddCategoryDropdown)}
              onSetMode={setMode}
              onSetQuotaMode={handleSetQuotaMode}
              onSetUniformLimit={setUniformLimit}
              onSetCustomLimit={(category, limit) =>
                setCustomLimits(prev => ({ ...prev, [category]: limit }))
              }
            />
          ) : (
            <AiSuggestionsReviewStep
              suggestions={suggestions}
              isGenerating={isGenerating}
              hasMore={hasMore}
              quotaFeedback={quotaFeedback}
              exhaustedCategories={exhaustedCategories}
              onShowMore={onShowMore}
              onAccept={onAccept}
              onReject={handleRejectSuggestion}
              onBackToSetup={() => {
                setSelectedForAcceptKeys(new Set());
                setStep('setup');
              }}
              selectedForAcceptKeys={selectedForAcceptKeys}
              onToggleSelectForAccept={handleToggleSelectForAccept}
              suggestionKey={buildSuggestionKey}
            />
          )}
        </div>

        <div className="px-4 sm:px-8 py-6 border-t border-white/5 bg-slate-900/50 shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between min-w-0">
          {step === 'setup' ? (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-xl border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:border-white/10 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedCategories.length === 0 || isGenerating}
                className="flex-[2] px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Genera
              </button>
            </div>
          ) : bulkConfirm ? (
            <>
              <p className={`${subtitleStyle || "text-[13px] text-slate-400"} flex-1`}>
                {bulkConfirm === 'accept-all'
                  ? `Accettare ${pendingSuggestions.length} suggerimenti e aggiungerli alla valigia?`
                  : `Rifiutare ${pendingSuggestions.length} suggerimenti e inserirli in blacklist?`}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setBulkConfirm(null)}
                  disabled={isBulkRunning}
                  className={`px-6 py-3 rounded-xl ${FOOTER_SECONDARY_BTN_CLASS} hover:text-white transition-colors disabled:opacity-50`}
                >
                  Annulla
                </button>
                <button
                  onClick={bulkConfirm === 'accept-all' ? runBulkAccept : runBulkReject}
                  disabled={isBulkRunning}
                  className={`px-8 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    bulkConfirm === 'accept-all'
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  {isBulkRunning ? 'Elaborazione...' : 'Conferma'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setStep('setup')}
                disabled={isBulkRunning}
                aria-label="Indietro"
                title="Indietro"
                className={FOOTER_REVIEW_BACK_BTN_CLASS}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-stretch gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBulkConfirm('reject-all');
                  }}
                  disabled={bulkDisabled}
                  className={FOOTER_REVIEW_REJECT_BTN_CLASS}
                >
                  <XCircle className="w-4 h-4" />
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBulkConfirm('accept-all');
                  }}
                  disabled={bulkDisabled}
                  className={FOOTER_REVIEW_ACCEPT_ALL_BTN_CLASS}
                >
                  <Check className="w-4 h-4" />
                  Tutti
                </button>
                {hasSelectedPending && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      runAcceptSelected();
                    }}
                    disabled={isBulkRunning}
                    className={FOOTER_REVIEW_ACCEPT_BTN_CLASS}
                  >
                    <Check className="w-4 h-4" />
                    {isBulkRunning ? 'Attendi...' : 'Selezione'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
