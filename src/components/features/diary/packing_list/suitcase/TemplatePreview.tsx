import React, { useMemo } from 'react';
import { Plus, Eye, EyeOff, CheckSquare } from 'lucide-react';
import { TemplateCategoryIcon, ItemCategoryIcon, getSuitcaseItemProgress } from './SuitcaseUtils';
import { buildDisplayCategories, getRestorableHiddenCategories } from '@/domain/packing/categorySetup';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase } from '@/types/suitcase';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import { isTdTemplate } from '@/utils/suitcaseDomain';

interface TemplatePreviewProps {
  template: Suitcase | null;
  sourceTab?: 'trip' | 'saved' | 'default';
  onAddCategory?: (id: string) => void;
  onUpdateSuitcaseLocal?: (id: string, updates: any) => void;
  showHiddenCategories?: boolean;
  readOnly?: boolean;
}

const PREVIEW_LABELS: Record<'trip' | 'saved' | 'default', string> = {
  default: "TEMPLATE PRONTO ALL'USO",
  saved: 'VALIGIA SALVATA',
  trip: 'VALIGIA ASSOCIATA AL DIARIO DI VIAGGIO',
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  sourceTab = 'default',
  onAddCategory,
  onUpdateSuitcaseLocal,
  showHiddenCategories = false,
  readOnly: readOnlyProp,
}) => {
  const isReadOnly = readOnlyProp ?? (template ? isTdTemplate(template) : false);
  const { toggleCategory, showAll, isHidden } = useHiddenCategories(
    template?.id,
    template ?? undefined,
    (patch) => {
      if (template?.id && onUpdateSuitcaseLocal) {
        onUpdateSuitcaseLocal(template.id, {
          ui_state: {
            ...template.ui_state,
            category_setup: patch.category_setup,
            hidden_category_ids: patch.hidden_category_ids,
          },
        });
      }
    }
  );

  const categoryCounts = useMemo(() => {
    if (!template?.suitcase_items) return {};
    return template.suitcase_items.reduce((acc: Record<string, number>, item: { category: string }) => {
      const cat = normalizeCategoryName(item.category);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [template]);

  const allCategories = useMemo(() => {
    if (!template) return [];
    return buildDisplayCategories(template);
  }, [template]);

  const visibleCategories = useMemo(() => {
    return allCategories.filter((cat) => cat.source === 'system' || !isHidden(cat.id));
  }, [allCategories, isHidden]);

  const hiddenCategories = useMemo(() => {
    if (!template) return [];
    return getRestorableHiddenCategories(template, isHidden);
  }, [template, isHidden]);

  const progress = useMemo(
    () => getSuitcaseItemProgress(template?.suitcase_items),
    [template?.suitcase_items]
  );

  if (!template) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-xs italic rounded-xl border border-dashed border-slate-800 p-6 text-center h-full">
        Scegli un template per visualizzare la preview
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-3 sticky top-4">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-slate-800/50 flex items-center justify-center w-11 h-11 text-xl shrink-0">
          <TemplateCategoryIcon template={template} />
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold text-white leading-tight truncate">
            {template.title.replace(/^Template\s+/i, '')}
          </div>
          <div className="text-[9px] xl:text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">
            {PREVIEW_LABELS[sourceTab]}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckSquare className={`w-3 h-3 shrink-0 ${progress.percentage === 100 ? 'text-emerald-500' : 'text-indigo-400'}`} />
            <span className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider tabular-nums">
              {progress.checked}/{progress.total} <span className="opacity-40 mx-0.5">•</span> {progress.percentage}%
            </span>
          </div>
        </div>
        {onAddCategory && (
          <button
            onClick={() => !isReadOnly && onAddCategory(template.id)}
            disabled={isReadOnly}
            className="ml-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-500/10 disabled:hover:border-indigo-500/20"
            title={isReadOnly ? 'Non disponibile per i template TD' : 'Aggiungi categoria'}
          >
            <Plus className="w-7 h-7" />
          </button>
        )}
      </div>

      <div className="max-h-[380px] lg:overflow-y-auto lg:custom-scrollbar pr-1">
                <div className="grid grid-cols-3 gap-3">
          {visibleCategories.map((cat) => {
            const count = categoryCounts[cat.name] || 0;
            return (
              <div
                key={cat.id}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border border-white/5 bg-slate-800/20 transition-all ${count === 0 ? 'opacity-30' : 'opacity-100'}`}
              >
                {/* ICONA OCCHIO PER NASCONDERE */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isReadOnly) toggleCategory(cat.id); }}
                  disabled={isReadOnly}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-slate-900/60 text-slate-400 opacity-0 lg:group-hover:opacity-100 hover:text-indigo-400 transition-all z-floating-panel disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                  title={isReadOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
                >
                  <Eye className="w-3 h-3" />
                </button>

                <div className="relative">
                  <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-2xl flex items-center justify-center bg-slate-800/40 text-slate-400 lg:group-hover:text-indigo-400 transition-colors overflow-hidden">
                    <ItemCategoryIcon category={cat.name} iconKey={cat.icon_key} className="text-[22px] 2xl:text-[26px] leading-none" />
                  </div>
                  {count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-400 flex items-center justify-center text-[12px] font-bold text-white ring-1 ring-slate-900 shadow-lg animate-in zoom-in duration-300 leading-none">
                      {count}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[7px] 2xl:text-[9px] text-slate-500 uppercase tracking-widest font-black text-center line-clamp-1 px-1">{cat.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOX CATEGORIE NASCOSTE */}
        {hiddenCategories.length > 0 && showHiddenCategories && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Categorie nascoste <EyeOff className="w-3 h-3" />
              </h4>
              <button 
                onClick={() => !isReadOnly && showAll()}
                disabled={isReadOnly}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-indigo-400"
              >
                Mostra tutte
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hiddenCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => !isReadOnly && toggleCategory(cat.id)}
                  disabled={isReadOnly}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/30 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/5 disabled:hover:bg-slate-800/30"
                  title={isReadOnly ? 'Non disponibile in sola lettura' : 'Ripristina categoria'}
                >
                  <Eye className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
