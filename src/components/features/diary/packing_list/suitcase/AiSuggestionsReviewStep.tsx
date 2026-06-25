import React, { useMemo } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { AiSuggestionReviewRow } from './AiSuggestionReviewRow';
import {
  AiQuotaFeedback,
  AiSuggestion,
} from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import {
  getSystemCategoryOrderIndexExact,
  SystemCategoryName,
} from '@/domain/packing/packingCategories';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface AiSuggestionsReviewStepProps {
  suggestions: AiSuggestion[];
  isGenerating: boolean;
  hasMore: boolean;
  quotaFeedback?: AiQuotaFeedback | null;
  exhaustedCategories?: string[];
  onShowMore: () => void;
  onAccept: (name: string, category: string) => Promise<void>;
  onReject: (name: string, category: string) => Promise<void>;
  onBackToSetup: () => void;
  selectedForAcceptKeys?: Set<string>;
  onToggleSelectForAccept?: (name: string, category: string) => void;
  suggestionKey?: (name: string, category: string) => string;
}

function isAllQuotaZero(feedback: AiQuotaFeedback | null | undefined): boolean {
  if (!feedback?.selectedCategories.length) return false;
  return feedback.selectedCategories.every((cat) => {
    const requested = feedback.requested[cat as SystemCategoryName];
    return requested !== undefined && requested === 0;
  });
}

function getCategoryQuotaNote(
  category: string,
  feedback: AiQuotaFeedback | null | undefined
): string | null {
  if (!feedback) return null;
  const requested = feedback.requested[category as SystemCategoryName];
  if (requested === undefined) return null;
  const delivered = feedback.delivered[category] ?? 0;

  if (requested === 0) {
    return 'Quantità impostata a 0 — nessun suggerimento per questa categoria.';
  }
  if (delivered < requested) {
    return `Mostrati ${delivered} di ${requested} richiesti — catalogo esaurito per questa categoria.`;
  }
  return null;
}

function getExhaustedCategoryNote(
  category: string,
  feedback: AiQuotaFeedback | null | undefined
): string {
  if (!feedback) {
    return 'Nessun suggerimento disponibile nel catalogo per questa categoria.';
  }

  const requested = feedback.requested[category as SystemCategoryName];
  if (requested === 0) {
    return 'Quantità impostata a 0 — nessun suggerimento per questa categoria.';
  }

  return 'Nessun suggerimento disponibile nel catalogo per questa categoria.';
}

const REVIEW_SECTION_TITLE_CLASS =
  'text-[11px] font-black text-slate-300 uppercase tracking-widest';
const REVIEW_GROUP_LABEL_CLASS =
  'text-[11px] font-black text-slate-300 uppercase tracking-[0.15em]';
const REVIEW_EXHAUSTED_TITLE_CLASS =
  'text-[11px] font-black text-slate-400 uppercase tracking-widest';
const REVIEW_EXHAUSTED_GROUP_LABEL_CLASS =
  'text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]';
const REVIEW_LOADING_CLASS =
  'text-xs text-slate-400 font-bold uppercase tracking-widest';
const REVIEW_SHOW_MORE_CLASS =
  'text-[10px] font-black uppercase tracking-widest';

export const AiSuggestionsReviewStep: React.FC<AiSuggestionsReviewStepProps> = ({
  suggestions,
  isGenerating,
  hasMore,
  quotaFeedback = null,
  exhaustedCategories = [],
  onShowMore,
  onAccept,
  onReject,
  onBackToSetup,
  selectedForAcceptKeys,
  onToggleSelectForAccept,
  suggestionKey,
}) => {
  const isMobile = useMobileDetect();
  const helperStyle = useDynamicStyles('suitcase_text_support', isMobile);

  const groupedData = useMemo(() => {
    const groups: Record<string, AiSuggestion[]> = {};

    suggestions.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });

    for (const category of Object.keys(groups)) {
      groups[category].sort((a, b) => {
        const aRel = a.tripRelevant ? 1 : 0;
        const bRel = b.tripRelevant ? 1 : 0;
        if (bRel !== aRel) return bRel - aRel;
        return a.name.localeCompare(b.name);
      });
    }

    const exhaustedSet = new Set(exhaustedCategories);
    const categorySource =
      quotaFeedback?.selectedCategories.length
        ? quotaFeedback.selectedCategories
        : Object.keys(groups);

    const sortedCategories = [...categorySource].sort((a, b) => {
      const indexA = getSystemCategoryOrderIndexExact(a);
      const indexB = getSystemCategoryOrderIndexExact(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    const activeCategories = sortedCategories.filter((category) => !exhaustedSet.has(category));

    return { groups, activeCategories, exhaustedCategories };
  }, [suggestions, quotaFeedback, exhaustedCategories]);

  const allQuotaZero = isAllQuotaZero(quotaFeedback);

  const hasAnyActiveContent =
    !allQuotaZero &&
    (groupedData.activeCategories.some((cat) => (groupedData.groups[cat]?.length ?? 0) > 0) ||
      hasMore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className={REVIEW_SECTION_TITLE_CLASS}>Suggerimenti Trovati</h4>
          <p className={`${helperStyle || "text-[11px] text-slate-500 font-medium"}`}>
            Gli oggetti con badge Consigliato sono prioritari per il tuo itinerario.
          </p>
        </div>
        <button
          onClick={onBackToSetup}
          className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-300 transition-colors"
        >
          Modifica Filtri
        </button>
      </div>

      {isGenerating && suggestions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className={REVIEW_LOADING_CLASS}>L'AI sta lavorando...</p>
        </div>
      ) : allQuotaZero ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className={`${helperStyle || "text-sm text-slate-300 font-bold"}`}>Nessun suggerimento richiesto.</p>
          <p className={`${helperStyle || "text-sm text-slate-400"}`}>
            Tutte le categorie selezionate hanno una quantità impostata a 0.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {hasAnyActiveContent ? (
            <>
              {groupedData.activeCategories.map(category => {
                const items = groupedData.groups[category] ?? [];
                const quotaNote = getCategoryQuotaNote(category, quotaFeedback);

                if (items.length === 0) return null;

                return (
                  <div key={category} className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 md:p-6 space-y-5">
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-sm">
                        <ItemCategoryIcon category={category} className="w-4 h-4" />
                      </div>
                      <h5 className={`${REVIEW_GROUP_LABEL_CLASS} flex items-center gap-2`}>
                        {category}
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                        <span className="text-indigo-400">{items.length}</span>
                      </h5>
                    </div>

                    {quotaNote && (
                      <p className={`${helperStyle || "text-[11px] text-slate-500 font-medium"} px-1`}>
                        {quotaNote}
                      </p>
                    )}

                    <div className="space-y-2">
                      {items.map((s, idx) => {
                        const key = suggestionKey?.(s.name, s.category) ?? `${s.category}::${s.name}`;
                        return (
                        <AiSuggestionReviewRow
                          key={`${category}-${s.name}-${idx}`}
                          name={s.name}
                          category={s.category}
                          status={s.status}
                          tripRelevant={s.tripRelevant}
                          onAccept={() => onAccept(s.name, s.category)}
                          onReject={() => onReject(s.name, s.category)}
                          isSelectedForAccept={selectedForAcceptKeys?.has(key) ?? false}
                          onToggleSelectForAccept={
                            onToggleSelectForAccept
                              ? () => onToggleSelectForAccept(s.name, s.category)
                              : undefined
                          }
                        />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={onShowMore}
                  disabled={isGenerating}
                  className={`w-full py-4 mt-4 rounded-2xl border border-dashed border-white/10 ${REVIEW_SHOW_MORE_CLASS} text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2`}
                >
                  {isGenerating ? <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Mostra altri suggerimenti
                </button>
              )}
            </>
          ) : groupedData.exhaustedCategories.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className={`${helperStyle || "text-sm text-slate-400"}`}>Nessun nuovo suggerimento trovato per queste categorie.</p>
            </div>
          ) : null}

          {groupedData.exhaustedCategories.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1 px-1">
                <h4 className={REVIEW_EXHAUSTED_TITLE_CLASS}>
                  Categorie senza ulteriori suggerimenti
                </h4>
                <p className={`${helperStyle || "text-[11px] text-slate-500 font-medium"}`}>
                  Queste categorie erano selezionate, ma il catalogo non ha altri candidati disponibili.
                </p>
              </div>

              <div className="space-y-3">
                {groupedData.exhaustedCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-slate-800/40 border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-400 border border-white/5 shrink-0">
                      <ItemCategoryIcon category={category} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h5 className={REVIEW_EXHAUSTED_GROUP_LABEL_CLASS}>
                        {category}
                      </h5>
                      <p className={`${helperStyle || "text-[11px] text-slate-500 font-medium"}`}>
                        {getExhaustedCategoryNote(category, quotaFeedback)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
