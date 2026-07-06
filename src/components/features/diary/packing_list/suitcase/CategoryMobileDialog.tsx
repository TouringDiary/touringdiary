import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL_NESTED } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';

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

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`td-modal-overlay lg:hidden ${overlayShell}`}
      onClick={onClose}
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`${containerShell} max-w-sm outline-none`}
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
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
    document.body
  );
};
