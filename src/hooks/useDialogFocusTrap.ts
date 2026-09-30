import { type RefObject, useEffect } from 'react';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

/** Focus iniziale + Tab trap sul dialog (pattern condiviso modali Admin Wikimedia). */
export function useDialogFocusTrap(
  active: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  isProcessing: boolean,
): void {
  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      if (!dialog || isProcessing) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length > 0) focusable[0].focus();
      else dialog.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog || isProcessing) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, dialogRef, isProcessing]);
}
