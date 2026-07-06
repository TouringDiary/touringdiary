import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface ItemDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  category: string;
  isAiSuggestion?: boolean;
}

export const ItemDeleteConfirmationModal: React.FC<ItemDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  category,
  isAiSuggestion = false
}) => {
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  const title = isAiSuggestion ? "Rifiuta Suggerimento?" : "Elimina Oggetto?";
  const description = isAiSuggestion 
    ? <>Vuoi davvero escludere <span className="text-white font-bold">{itemName}</span> dai suggerimenti? Verrà inserito nella blacklist per questa valigia.</>
    : <>Vuoi davvero eliminare <span className="text-white font-bold">{itemName}</span> dalla categoria <span className="text-indigo-400 font-bold">{category}</span>?</>;
  const confirmLabel = isAiSuggestion ? "Rifiuta Suggerimento" : "Elimina Oggetto";
  const Icon = isAiSuggestion ? XCircle : Trash2;

  const variantBorderClass = isAiSuggestion ? 'border-amber-500/30' : 'border-rose-500/30';

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell} !items-center`}
      style={{ zIndex: Z_MODAL_NESTED }}
      onClick={onClose}
    >
      <div
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${variantBorderClass}`}
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-delete-confirmation-title"
        aria-describedby="item-delete-confirmation-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
          <div className={`w-20 h-20 rounded-full ${isAiSuggestion ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'} flex items-center justify-center border relative`}>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-slate-900 shadow-lg">
              <AlertTriangle className="w-3 h-3 text-white" aria-hidden />
            </div>
            <Icon className={`w-10 h-10 ${isAiSuggestion ? 'text-amber-500' : 'text-rose-500'} animate-pulse`} aria-hidden />
          </div>

          <div>
            <h3 id="item-delete-confirmation-title" className={`${modalTitleShell} mb-3`}>{title}</h3>
            <p id="item-delete-confirmation-desc" className={`${modalSubtitleShell} leading-relaxed max-w-[280px] mx-auto`}>
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full ${isAiSuggestion ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'} text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest group`}
            >
              <Icon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {confirmLabel}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
