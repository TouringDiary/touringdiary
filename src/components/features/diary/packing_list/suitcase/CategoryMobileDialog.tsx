import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL_NESTED } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

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
      className="td-modal-overlay lg:hidden bg-black/80 backdrop-blur-md animate-in fade-in p-4"
      onClick={onClose}
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-sm max-h-[calc(100dvh-var(--header-height)-2rem)] flex flex-col outline-none animate-in zoom-in-95"
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
        <div className="min-h-0 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
};
