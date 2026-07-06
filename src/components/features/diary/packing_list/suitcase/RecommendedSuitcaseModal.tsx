import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Briefcase } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { Suitcase } from '@/types/suitcase';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { isTdTemplate, isUserTemplate } from '@/utils/suitcaseDomain';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

type ModalTab = 'templates' | 'suitcases';

interface RecommendedSuitcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSources: Suitcase[]) => void;
  isSubmitting?: boolean;
  suggestedTemplateIds: string[];
  globalTemplates: Suitcase[];
  userOwnedTemplates: Suitcase[];
  savedSuitcases: Suitcase[];
}

const SUGGESTED_BADGE_CLASS =
  'inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-violet-500/25 text-violet-200 text-[8px] font-bold uppercase tracking-wider border border-violet-400/40 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.25)]';

const TD_BADGE_CLASS =
  'inline-flex items-center justify-center min-w-[38px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] font-bold uppercase tracking-wider border border-amber-500/20';

const USER_BADGE_CLASS =
  'inline-flex items-center justify-center min-w-[38px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20';

const VALIGIA_BADGE_CLASS =
  'inline-flex items-center justify-center min-w-[38px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 text-[8px] font-bold uppercase tracking-wider border border-sky-500/20';

const SourceBadgeColumn: React.FC<{
  isSuggested?: boolean;
  variant: 'td' | 'user' | 'valigia' | null;
}> = ({ isSuggested = false, variant }) => (
  <div className="flex items-center justify-end gap-1.5 shrink-0 w-[118px]">
    <div className="w-[72px] flex justify-end">
      {isSuggested ? <span className={SUGGESTED_BADGE_CLASS}>Suggerito</span> : null}
    </div>
    <div className="w-[42px] flex justify-center">
      {variant === 'td' && <span className={TD_BADGE_CLASS}>TD</span>}
      {variant === 'user' && <span className={USER_BADGE_CLASS}>USER</span>}
      {variant === 'valigia' && <span className={VALIGIA_BADGE_CLASS}>Valigia</span>}
    </div>
  </div>
);

const SourceIconSlot: React.FC<{ source: Suitcase }> = ({ source }) => (
  <div className="w-10 h-10 flex items-center justify-center shrink-0">
    <TemplateCategoryIcon template={source} className="w-5 h-5 text-[20px] leading-none" />
  </div>
);

export const RecommendedSuitcaseModal: React.FC<RecommendedSuitcaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  suggestedTemplateIds,
  globalTemplates,
  userOwnedTemplates,
  savedSuitcases,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('templates');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const userModifiedSelectionRef = useRef(false);
  const prevIsOpenRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dialogPanelRef = useRef<HTMLDivElement>(null);

  useGlobalModalEscape(isOpen, onClose);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const headerIconBoxShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
  const headerIconGlyphShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const sectionTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle, isMobile);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);

  const allTemplates = useMemo(
    () => [...globalTemplates, ...userOwnedTemplates],
    [globalTemplates, userOwnedTemplates]
  );

  const suggestedTemplates = useMemo(
    () =>
      suggestedTemplateIds
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

  const selectedTemplateCount = useMemo(
    () => allTemplates.filter((t) => selectedIds.has(t.id)).length,
    [allTemplates, selectedIds]
  );

  const selectedSuitcaseCount = useMemo(
    () => savedSuitcases.filter((s) => selectedIds.has(s.id)).length,
    [savedSuitcases, selectedIds]
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
      setActiveTab('templates');
      setSelectedIds(new Set(suggestedTemplateIds));
      scrollContainerRef.current.scrollTop = 0;
      dialogPanelRef.current?.focus({ preventScroll: true });
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

  const buildOrderedSelection = (): Suitcase[] => {
    const suggestedSet = new Set(suggestedTemplateIds);
    const selectedTemplates = allTemplates.filter((t) => selectedIds.has(t.id));
    const selectedSuitcases = savedSuitcases.filter((s) => selectedIds.has(s.id));

    const orderedSuggested = suggestedTemplateIds
      .map((id) => selectedTemplates.find((t) => t.id === id))
      .filter((t): t is Suitcase => !!t);

    const otherTemplates = selectedTemplates.filter((t) => !suggestedSet.has(t.id));
    return [...orderedSuggested, ...otherTemplates, ...selectedSuitcases];
  };

  const handleConfirm = () => {
    const selected = buildOrderedSelection();
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  const rowClass = (checked: boolean) =>
    `grid grid-cols-[16px_40px_minmax(0,1fr)_118px] items-center gap-x-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
      checked
        ? 'bg-indigo-500/10 border-indigo-500/40'
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
    }`;

  const renderTemplateRow = (template: Suitcase, isSuggested: boolean) => {
    const checked = selectedIds.has(template.id);
    const isTd = isTdTemplate(template);
    const isUser = isUserTemplate(template);

    return (
      <label key={template.id} className={rowClass(checked)}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleId(template.id)}
          className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500/30 shrink-0"
        />
        <SourceIconSlot source={template} />
        <div className="min-w-0 self-center">
          <div className="text-sm font-bold text-white truncate leading-tight">{template.title}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
            {template.suitcase_items?.length ?? 0} oggetti
          </div>
        </div>
        <SourceBadgeColumn
          isSuggested={isSuggested}
          variant={isTd ? 'td' : isUser ? 'user' : null}
        />
      </label>
    );
  };

  const renderSuitcaseRow = (suitcase: Suitcase) => {
    const checked = selectedIds.has(suitcase.id);

    return (
      <label key={suitcase.id} className={rowClass(checked)}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleId(suitcase.id)}
          className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500/30 shrink-0"
        />
        <SourceIconSlot source={suitcase} />
        <div className="min-w-0 self-center">
          <div className="text-sm font-bold text-white truncate leading-tight">{suitcase.title}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
            {suitcase.suitcase_items?.length ?? 0} oggetti
          </div>
        </div>
        <SourceBadgeColumn variant="valigia" />
      </label>
    );
  };

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_OVERLAY }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogPanelRef}
        tabIndex={-1}
        className={`${containerShell} max-w-lg outline-none`}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalized-suitcase-title"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          withEscape={false}
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <header className={headerShell}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className={headerIconBoxShell}>
              <Sparkles className={headerIconGlyphShell} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="personalized-suitcase-title" className={`${modalTitleShell} truncate`}>
                Valigia Personalizzata
              </h2>
              <p className={modalSubtitleShell}>
                Combina template e valigie adatte al tuo viaggio.
              </p>
            </div>
          </div>
        </header>

        <div className="shrink-0 px-6 sm:px-8 pt-4 pb-3">
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-800/60 border border-white/[0.06]"
            role="tablist"
            aria-label="Sorgenti valigia"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'templates'}
              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'templates'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('templates')}
            >
              Template{selectedTemplateCount > 0 ? ` (${selectedTemplateCount})` : ''}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'suitcases'}
              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'suitcases'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('suitcases')}
            >
              Valigie{selectedSuitcaseCount > 0 ? ` (${selectedSuitcaseCount})` : ''}
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className={`${bodyShell} space-y-6 min-h-0`}
        >
          {activeTab === 'templates' && (
            <>
              {suggestedTemplates.length > 0 && (
                <section>
                  <h4 className={`${sectionTitleShell} mb-3`}>
                    Suggeriti per il tuo viaggio
                  </h4>
                  <div className="space-y-2">
                    {suggestedTemplates.map((t) => renderTemplateRow(t, true))}
                  </div>
                </section>
              )}

              {(otherTdTemplates.length > 0 || otherUserTemplates.length > 0) && (
                <section>
                  <h4 className={`${sectionTitleShell} mb-3`}>
                    Altri template disponibili
                  </h4>
                  <div className="space-y-2">
                    {otherTdTemplates.map((t) => renderTemplateRow(t, false))}
                    {otherUserTemplates.map((t) => renderTemplateRow(t, false))}
                  </div>
                </section>
              )}

              {allTemplates.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">
                  Nessun template disponibile.
                </p>
              )}
            </>
          )}

          {activeTab === 'suitcases' && (
            <>
              {savedSuitcases.length > 0 ? (
                <section>
                  <h4 className={`${sectionTitleShell} mb-3`}>
                    Le tue valigie
                  </h4>
                  <div className="space-y-2">
                    {savedSuitcases.map((s) => renderSuitcaseRow(s))}
                  </div>
                </section>
              ) : (
                <p className="text-center text-sm text-slate-500 py-8">
                  Nessuna valigia salvata disponibile.
                </p>
              )}
            </>
          )}
        </div>

        <footer className={footerShell}>
          <div className={footerActionsShell}>
            <button
              type="button"
              onClick={onClose}
              className={btnCancelShell}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || selectedIds.size === 0}
              className={`${btnPrimaryShell} flex items-center justify-center gap-2`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              {isSubmitting ? 'Preparazione...' : 'Crea draft valigia'}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
