import { Calendar } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { formatLocalIsoDateDisplay } from '@/utils/common';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export interface DateShiftConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  oldStartDate: string;
  oldEndDate: string;
  newStartDate: string;
  newEndDate: string;
}

export const DateShiftConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  oldStartDate,
  oldEndDate,
  newStartDate,
  newEndDate,
}: DateShiftConfirmModalProps) => {
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const cardLabelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.cardLabel, isMobile);
  const cardSurfaceShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.cardSurface, isMobile);

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useGlobalModalEscape(isOpen, onClose);

  // Focus iniziale, tab-trap, restore opener (pattern SuggestPatronPhotoModal).
  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      dialog?.focus();
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
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const oldFrom = formatLocalIsoDateDisplay(oldStartDate);
  const oldTo = formatLocalIsoDateDisplay(oldEndDate);
  const newFrom = formatLocalIsoDateDisplay(newStartDate);
  const newTo = formatLocalIsoDateDisplay(newEndDate);

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-amber-500/50`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-shift-confirm-title"
        aria-describedby="date-shift-confirm-desc date-shift-confirm-dates date-shift-confirm-note"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
          <div className="p-4 bg-amber-500/20 rounded-full mb-2">
            <Calendar className="w-10 h-10 text-amber-500" aria-hidden />
          </div>
          <h3 id="date-shift-confirm-title" className={`${modalTitleShell} mb-2`}>
            MODIFICA DATE
          </h3>
          <p
            id="date-shift-confirm-desc"
            className={`${modalSubtitleShell} w-full text-left leading-relaxed mb-2`}
          >
            Le date del diario di viaggio saranno spostate:
          </p>

          <div id="date-shift-confirm-dates" className={`${cardSurfaceShell} w-full`}>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 items-baseline">
              <span className={`${cardLabelShell} shrink-0 pb-2.5 border-b border-white/10`}>
                Da:
              </span>
              <span className="text-rose-300/90 text-sm sm:text-base font-medium tabular-nums min-w-0 text-left pb-2.5 border-b border-white/10">
                {oldFrom} – {oldTo}
              </span>
              <span className={`${cardLabelShell} shrink-0 pt-2.5`}>A:</span>
              <span className="text-emerald-300/90 text-sm sm:text-base font-medium tabular-nums min-w-0 text-left pt-2.5">
                {newFrom} – {newTo}
              </span>
            </div>
          </div>

          <p
            id="date-shift-confirm-note"
            className={`${modalSubtitleShell} w-full text-left leading-relaxed mb-2`}
          >
            Durata e tappe restano invariate: cambia solo la data.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-700"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" aria-hidden /> Conferma
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
