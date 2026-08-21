import type React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

interface CategoryMobileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Contenitore mobile (< lg) per i pannelli "Categorie disponibili" / "Categorie nascoste".
 *
 * Sostituisce l'AnchoredPopover SOLO su mobile: il popover ancorato non disponeva di
 * spazio verticale sufficiente. Il contenuto (i pannelli) resta identico — cambia solo
 * il contenitore. Coerente con il pattern modale dell'app (td-modal-overlay + portal +
 * CloseButton). Su desktop questo componente non viene usato: la preview mostra i pannelli inline.
 *
 * Accessibilità: role="dialog" + aria-modal, chiusura su ESC/backdrop, focus iniziale nel
 * dialog all'apertura e restore del focus all'elemento che lo aveva aperto alla chiusura.
 * Il body scroll-lock replica il pattern già usato in GalleryLightbox (non esiste un sistema
 * modale centralizzato che lo garantisca).
 */
export const CategoryMobileDialog: React.FC<CategoryMobileDialogProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    // Memorizza l'elemento che aveva il focus (il pulsante trigger) per ripristinarlo alla chiusura.
    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusRaf = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(focusRaf);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Initial focus is on the dialog itself (tabIndex={-1}): Shift+Tab must wrap to last.
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || dialog.contains(target)) return;
      const focusable = getFocusableElements(dialog);
      (focusable[0] ?? dialog).focus();
    };

    dialog.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay lg:hidden ${overlayShell}`}
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
        role="dialog"
        aria-modal="true"
        aria-label="Pannello categorie valigia"
        tabIndex={-1}
        className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL_NESTED }}
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          size="sm"
          withEscape={false}
          className="absolute -top-2 -right-2 z-10"
        />
        <div className={`${bodyShell} min-h-0`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
