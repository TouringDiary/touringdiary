import React from 'react';
import { createPortal } from 'react-dom';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Plus, Sparkles, Ghost } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { SuitcaseRejection } from '@/types/suitcase';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface BlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SuitcaseRejection[];
  onRestore: (rejection: SuitcaseRejection) => Promise<void>;
  onRemove: (rejectionId: string, name: string) => Promise<void>;
  isFetching?: boolean;
}

export const BlacklistModal: React.FC<BlacklistModalProps> = ({
  isOpen,
  onClose,
  items,
  onRestore,
  onRemove,
  isFetching = false
}) => {
  const isMobile = useMobileDetect();
  const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);
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
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel);

  useGlobalModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_MODAL_NESTED }}
      onClick={onClose}
    >
      <div
        className={`${containerShell} max-w-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blacklist-modal-title"
        aria-describedby="blacklist-modal-desc"
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
              <Ghost className={headerIconGlyphShell} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="blacklist-modal-title" className={`${modalTitleShell} truncate`}>
                Oggetti rifiutati
              </h3>
              <p id="blacklist-modal-desc" className={modalSubtitleShell}>Blacklist Suggerimenti AI</p>
            </div>
          </div>
        </header>

        <div className={`${bodyShell} space-y-5 min-h-0`}>
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
            <p className="text-[12px] text-slate-400 mb-3 font-medium">
              Questi oggetti sono stati esclusi dai suggerimenti per questa valigia.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span className="text-indigo-400">➕ AGGIUNGI</span>
                <span className="opacity-50">→ in valigia</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span className="text-emerald-400">🟢 CONSENTI</span>
                <span className="opacity-50">→ suggerimenti</span>
              </div>
            </div>
          </div>

          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <span className={filterSectionLabel10Style}>Caricamento...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                <Ghost className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400">Nessun oggetto rifiutato</p>
                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-1">
                  Gli oggetti che rifiuti dai suggerimenti AI compariranno qui
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all gap-4"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                  </div>

                  <div className="flex w-full sm:w-auto items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 whitespace-nowrap shadow-lg shadow-indigo-500/5"
                      title="Aggiungi alla valigia"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aggiungi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id, item.name)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:border-emerald-500/40 whitespace-nowrap"
                      title="Consenti nuovi suggerimenti"
                    >
                      <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      <span>Consenti</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className={footerShell}>
          <div className={footerActionsShell}>
            <button type="button" onClick={onClose} className={btnCancelShell}>
              Chiudi
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
