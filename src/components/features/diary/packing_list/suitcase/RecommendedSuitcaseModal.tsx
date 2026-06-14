import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Briefcase } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { Suitcase } from '@/types/suitcase';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { isTdTemplate, isUserTemplate } from '@/utils/suitcaseDomain';

interface RecommendedSuitcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTemplates: Suitcase[]) => void;
  isSubmitting?: boolean;
  suggestedTemplateIds: string[];
  globalTemplates: Suitcase[];
  userOwnedTemplates: Suitcase[];
}

export const RecommendedSuitcaseModal: React.FC<RecommendedSuitcaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  suggestedTemplateIds,
  globalTemplates,
  userOwnedTemplates,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const userModifiedSelectionRef = useRef(false);
  const prevIsOpenRef = useRef(false);

  const allTemplates = useMemo(
    () => [...globalTemplates, ...userOwnedTemplates],
    [globalTemplates, userOwnedTemplates]
  );

  const suggestedTemplates = useMemo(
    () => suggestedTemplateIds
      .map((id) => allTemplates.find((t) => t.id === id))
      .filter((t): t is Suitcase => !!t),
    [allTemplates, suggestedTemplateIds]
  );

  const otherTdTemplates = useMemo(
    () => globalTemplates.filter((t) => !suggestedTemplateIds.includes(t.id)),
    [globalTemplates, suggestedTemplateIds]
  );

  const otherUserTemplates = useMemo(
    () => userOwnedTemplates.filter((t) => !suggestedTemplateIds.includes(t.id)),
    [userOwnedTemplates, suggestedTemplateIds]
  );

  useLayoutEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;

    if (!isOpen) {
      userModifiedSelectionRef.current = false;
      prevIsOpenRef.current = false;
      return;
    }

    if (justOpened) {
      userModifiedSelectionRef.current = false;
      setSelectedIds(new Set(suggestedTemplateIds));
    } else if (!userModifiedSelectionRef.current && suggestedTemplateIds.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        suggestedTemplateIds.forEach((id) => {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }

    prevIsOpenRef.current = true;
  }, [isOpen, suggestedTemplateIds]);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    userModifiedSelectionRef.current = true;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = allTemplates.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  const renderRow = (template: Suitcase, isSuggested: boolean) => {
    const checked = selectedIds.has(template.id);
    const isTd = isTdTemplate(template);
    const isUser = isUserTemplate(template);

    return (
      <label
        key={template.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
          checked
            ? 'bg-indigo-500/10 border-indigo-500/40'
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleId(template.id)}
          className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500/30"
        />
        <TemplateCategoryIcon template={template} className="text-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{template.title}</span>
            {isSuggested && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] font-bold uppercase tracking-wider border border-indigo-500/30 shrink-0">
                Suggerito
              </span>
            )}
            {isTd && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] font-bold uppercase tracking-wider border border-amber-500/20 shrink-0">
                TD
              </span>
            )}
            {isUser && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20 shrink-0">
                USER
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {template.suitcase_items?.length ?? 0} oggetti
          </div>
        </div>
      </label>
    );
  };

  return createPortal(
    <div
      className="td-modal-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      style={{ zIndex: Z_OVERLAY }}
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.2)] relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClose={onClose} className="absolute top-4 right-4 z-10" />

        <div className="p-6 pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Valigia Consigliata
              </h3>
              <p className="text-xs text-slate-400">
                Genera una valigia basata sul diario di viaggio.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 min-h-0">
          {suggestedTemplates.length > 0 && (
            <section>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">
                Suggeriti per il tuo viaggio
              </h4>
              <div className="space-y-2">
                {suggestedTemplates.map((t) => renderRow(t, true))}
              </div>
            </section>
          )}

          {(otherTdTemplates.length > 0 || otherUserTemplates.length > 0) && (
            <section>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                Altri template disponibili
              </h4>
              <div className="space-y-2">
                {otherTdTemplates.map((t) => renderRow(t, false))}
                {otherUserTemplates.map((t) => renderRow(t, false))}
              </div>
            </section>
          )}

          {allTemplates.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">
              Nessun template disponibile.
            </p>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-white/5 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || selectedIds.size === 0}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            {isSubmitting ? 'Preparazione...' : 'Crea draft valigia'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
