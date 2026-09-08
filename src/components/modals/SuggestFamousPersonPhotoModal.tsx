import { Camera, Check, Loader2, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { createFamousPersonPhotoSuggestion } from '@/services/famousPerson/famousPersonPhotoSuggestionService';
import type { User } from '@/types/users';

type SuggestFamousPersonPhotoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  cityName: string;
  user: User;
  onOpenAuth?: () => void;
  onSuccess?: () => void;
};

type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

export const SuggestFamousPersonPhotoModal = ({
  isOpen,
  onClose,
  personId,
  personName,
  cityName,
  user,
  onOpenAuth,
  onSuccess,
}: SuggestFamousPersonPhotoModalProps) => {
  const rightsCheckboxId = useId();
  const notesFieldId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const photoRef = useRef(photo);
  const [notes, setNotes] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  const headerIconBox = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
  const headerIconGlyph = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary, isMobile);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel, isMobile);

  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);

  const isGuest = user.role === 'guest';
  const canSubmit = Boolean(photo && rightsConfirmed && !isSubmitting && !isGuest);

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    return () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.previewUrl);
    };
  }, []);

  useEffect(() => {
    if (isOpen) return;
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setNotes('');
    setRightsConfirmed(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusRaf = requestAnimationFrame(() => dialog?.focus());
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
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) };
    });
  };

  const clearPhoto = () => {
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const handleSubmit = async () => {
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    if (!photo || !rightsConfirmed) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createFamousPersonPhotoSuggestion({
        userId: user.id,
        personId,
        notes,
        rightsConfirmed,
        file: photo.file,
      });
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l’invio della fotografia.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggest-famous-person-photo-title"
        tabIndex={-1}
      >
        <div className={`${headerShell} relative`}>
          <div className={closeOffsetShell}>
            <CloseButton onClose={onClose} withEscape={false} />
          </div>
          <div className="flex items-start gap-3 pr-10">
            <div className={headerIconBox}>
              <Camera className={headerIconGlyph} aria-hidden />
            </div>
            <div>
              <h2 id="suggest-famous-person-photo-title" className={modalTitleShell}>
                Suggerisci foto
              </h2>
              <p className={modalSubtitleShell}>
                {personName} · {cityName}
              </p>
            </div>
          </div>
        </div>

        <div className={bodyShell}>
          {isGuest ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Accedi per proporre una nuova foto ufficiale per questo personaggio.
              </p>
              <button type="button" className={btnPrimaryShell} onClick={() => onOpenAuth?.()}>
                Accedi
              </button>
            </div>
          ) : isSuccess ? (
            <p className="text-sm text-emerald-400">
              Grazie! Se approvata, la foto sostituirà l’unica foto ufficiale del personaggio.
            </p>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
              {photo ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                  <img
                    src={photo.previewUrl}
                    alt="Anteprima foto proposta"
                    className="w-full max-h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-black/70 text-white"
                    aria-label="Rimuovi foto"
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[120px] rounded-xl border border-dashed border-slate-600 bg-slate-950 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <Camera className="w-4 h-4" aria-hidden />
                    Scegli una foto
                  </span>
                </button>
              )}

              <div>
                <label
                  htmlFor={notesFieldId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Note (facoltative)
                </label>
                <textarea
                  id={notesFieldId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>

              <label
                htmlFor={rightsCheckboxId}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <input
                  id={rightsCheckboxId}
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(e) => setRightsConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Dichiaro di detenere i diritti o le autorizzazioni necessarie per questa
                  fotografia.
                </span>
              </label>

              {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            </div>
          )}
        </div>

        {!isGuest && !isSuccess ? (
          <div className={footerShell}>
            <div className={footerActionsShell}>
              <button
                type="button"
                className={btnCancelShell}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annulla
              </button>
              <button
                type="button"
                className={btnPrimaryShell}
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Invio…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" aria-hidden />
                    Invia foto
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
