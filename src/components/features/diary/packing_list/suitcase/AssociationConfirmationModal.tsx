import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Briefcase, Link, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface AssociationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // "Salva valigia" (stays saved)
  onConfirm: () => void; // "Salva e associa"
  onDiscard: () => void; // "Esci senza salvare" (deletes if new)
  onCancel?: () => void; // "Annulla" (just close modal, stay in editor)
  isDiaryAssociable?: boolean;
  title: string;
  message: string;
  isLinking?: boolean;
  hasActiveTrip: boolean;
  isGuest?: boolean;
  onLogin?: () => void;
  /** Draft template USER: solo salva, nessuna associazione al diario */
  isTemplateDraft?: boolean;
}

export const AssociationConfirmationModal: React.FC<AssociationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  onCancel,
  isDiaryAssociable = true,
  title,
  message,
  isLinking = false,
  hasActiveTrip,
  isGuest = false,
  onLogin,
  isTemplateDraft = false,
}) => {
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  // Dismiss = chiudi modale senza azione primaria (resta in editor se onCancel è fornito).
  // Allineato a DeleteConfirmationModal: ESC e overlay via CloseButton, niente secondo listener ESC.
  const handleDismiss = () => {
    (onCancel ?? onClose)();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_MODAL_NESTED }}
      onClick={handleDismiss}
    >
      <div
        className={`${containerShell} max-w-md outline-none`}
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton
          onClose={handleDismiss}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} flex flex-col items-center text-center gap-6`}>
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 relative">
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900 shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <Briefcase className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>

          <div>
            <h3 className={`${modalTitleShell} mb-3`}>{title}</h3>
            <p className={`${modalSubtitleShell} leading-relaxed max-w-[280px] mx-auto`}>
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            {isGuest ? (
              <>
                <button
                  onClick={onLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest"
                >
                  <ArrowRight className="w-4 h-4" />
                  Effettua Login
                </button>
                <button
                  onClick={onDiscard}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-rose-500/20"
                >
                  Esci senza salvare
                </button>
              </>
            ) : hasActiveTrip && !isTemplateDraft ? (
              <>
                <button
                  onClick={onConfirm}
                  disabled={isLinking || !isDiaryAssociable}
                  className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest group ${(!isDiaryAssociable && !isLinking) ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : ''}`}
                >
                  {isLinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  )}
                  {isLinking ? 'Associazione in corso...' : !isDiaryAssociable ? 'Diario non associabile' : 'Salva e associa al diario'}
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
                >
                  Salva valigia
                </button>

                <button
                  onClick={onDiscard}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-rose-500/20"
                >
                  Esci senza salvare
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest"
                >
                  <ArrowRight className="w-4 h-4" />
                  {isLinking ? 'Salvataggio...' : isTemplateDraft ? 'Salva template' : 'Salva Valigia'}
                </button>

                <button
                  onClick={onDiscard}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
                >
                  Esci senza salvare
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
