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
import { createPatronPhotoSuggestion } from '@/services/patron/patronPhotoSuggestionService';
import type { User } from '@/types/users';

type SuggestPatronPhotoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  patronName: string;
  user: User;
  onOpenAuth?: () => void;
  onSuccess?: () => void;
};

/** Preview locale: id stabile + File + object URL (1:1). Non persistito. */
type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

const revokePreviewUrls = (items: SelectedPhoto[]) => {
  for (const item of items) {
    URL.revokeObjectURL(item.previewUrl);
  }
};

/** Tab trap locale (stesso pattern di AdminPatronSaintManager; nessuna utility shared nel codebase). */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

/** Focus ring dialog — stesso token dei modali Foundation (SaveAs / Share / DeleteConfirm). */
const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

export const SuggestPatronPhotoModal = ({
  isOpen,
  onClose,
  cityId,
  cityName,
  patronName,
  user,
  onOpenAuth,
  onSuccess,
}: SuggestPatronPhotoModalProps) => {
  const rightsCheckboxId = useId();
  const notesFieldId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const photosRef = useRef(photos);
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
    photosRef.current = photos;
  }, [photos]);

  const isGuest = user.role === 'guest';
  const canSubmit = photos.length > 0 && rightsConfirmed && !isSubmitting && !isGuest;

  // ESC LIFO (useCloseOnEscape). PatronSaintModal disabilita il proprio ESC mentre questo è aperto.
  // CloseButton: withEscape=false per evitare doppia registrazione nello stack.
  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    return () => {
      revokePreviewUrls(photosRef.current);
    };
  }, []);

  // Reset completo alla chiusura.
  useEffect(() => {
    if (isOpen) return;
    setPhotos((prev) => {
      revokePreviewUrls(prev);
      return [];
    });
    setNotes('');
    setRightsConfirmed(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen]);

  // Contesto città cambiato mentre il modal resta aperto → non riusare preview/note del contesto precedente.
  // Non tocca isSubmitting (evita race con submit ancora in volo sulla città precedente).
  useEffect(() => {
    if (!isOpen) return;
    if (!cityId) return;
    setPhotos((prev) => {
      revokePreviewUrls(prev);
      return [];
    });
    setNotes('');
    setRightsConfirmed(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen, cityId]);

  // Focus iniziale, tab-trap, restore opener (pattern AdminPatronSaintManager).
  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const next: SelectedPhoto[] = picked.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createPatronPhotoSuggestion({
        userId: user.id,
        cityId,
        notes,
        rightsConfirmed,
        files: photos.map((item) => item.file),
      });
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio.");
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
        tabIndex={-1}
        className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggest-patron-photo-title"
        aria-describedby="suggest-patron-photo-desc"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/*
          position=static: evita top-4/right-4 di CloseButton; l’offset ufficiale
          foundation_modal_close_offset (top-6 right-8) + absolute come in FoundationPreview.
          variant=primary: cerchio rosso, hover:bg-red-700 (SoT X del sito).
        */}
        <CloseButton
          onClose={onClose}
          variant="primary"
          size="md"
          position="static"
          withEscape={false}
          className={`absolute ${closeOffsetShell} z-local-overlay`}
        />

        <header className={headerShell}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className={headerIconBox}>
              <Camera className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="suggest-patron-photo-title" className={`${modalTitleShell} mb-0.5`}>
                Suggerisci foto del Patrono
              </h3>
              <p id="suggest-patron-photo-desc" className={`${modalSubtitleShell} truncate`}>
                {cityName} · {patronName}
              </p>
            </div>
          </div>
        </header>

        <div className={`${bodyShell} min-h-0 space-y-5`}>
          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" aria-hidden />
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                Grazie! Le tue foto sono state inviate agli amministratori per la verifica.
              </p>
            </div>
          ) : (
            <>
              {isGuest ? (
                <p className="text-sm text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-lg px-4 py-3">
                  Accedi per suggerire fotografie del Patrono o della Festa Patronale.
                </p>
              ) : null}

              <dl className="grid grid-cols-1 gap-3 text-sm bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Utente
                  </dt>
                  <dd className="text-white font-medium mt-0.5">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Città
                  </dt>
                  <dd className="text-white font-medium mt-0.5">{cityName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Santo Patrono
                  </dt>
                  <dd className="text-white font-medium mt-0.5">{patronName}</dd>
                </div>
              </dl>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Carica le tue foto
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {photos.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Anteprima foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(item.id)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full min-h-8 min-w-8 inline-flex items-center justify-center"
                        aria-label={`Rimuovi foto ${index + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-amber-500 transition-colors min-h-[44px]"
                    aria-label="Aggiungi fotografia"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFilesChange}
                />
                {photos.length === 0 ? (
                  <p className="text-xs text-slate-500">Almeno una fotografia è obbligatoria.</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor={notesFieldId}
                  className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2"
                >
                  Note (facoltative)
                </label>
                <textarea
                  id={notesFieldId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  placeholder="Occasione, luogo dello scatto, festa patronale…"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Diritti sulla foto
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Con l&apos;invio dichiari di essere il titolare dei diritti sulla fotografia
                  oppure di avere tutte le autorizzazioni necessarie per condividerla e consentirne
                  l&apos;utilizzo su TouringDiary.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Autorizzi TouringDiary a utilizzare la fotografia nell&apos;ambito del servizio,
                  in particolare per la galleria fotografica del Santo Patrono e della Festa
                  Patronale.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L&apos;invio non comporta la pubblicazione automatica: la fotografia sarà valutata
                  nel processo previsto dal servizio prima di un eventuale inserimento nella
                  galleria ufficiale.
                </p>
                <label
                  htmlFor={rightsCheckboxId}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    id={rightsCheckboxId}
                    type="checkbox"
                    checked={rightsConfirmed}
                    onChange={(e) => setRightsConfirmed(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                    Confermo di avere i diritti o le autorizzazioni necessarie per inviare questa
                    fotografia e autorizzo TouringDiary al suo utilizzo secondo quanto indicato
                    sopra.
                  </span>
                </label>
              </div>

              {error ? (
                <p className="text-sm text-rose-400" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        {!isSuccess ? (
          <footer className={footerShell}>
            <div className={footerActionsShell}>
              <button type="button" onClick={onClose} className={btnCancelShell}>
                Annulla
              </button>
              {isGuest ? (
                onOpenAuth ? (
                  <button type="button" onClick={onOpenAuth} className={btnPrimaryShell}>
                    Accedi
                  </button>
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit}
                  className={btnPrimaryShell}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Invio…
                    </>
                  ) : (
                    'Invia suggerimento'
                  )}
                </button>
              )}
            </div>
          </footer>
        ) : (
          <footer className={footerShell}>
            <div className={footerActionsShell}>
              <button type="button" onClick={onClose} className={btnPrimaryShell}>
                Chiudi
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
