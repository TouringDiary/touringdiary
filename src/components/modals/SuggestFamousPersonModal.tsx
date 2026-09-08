import { Lightbulb, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import {
  FAMOUS_PERSON_SUGGESTION_NAME_MAX,
  FAMOUS_PERSON_SUGGESTION_NOTES_MAX,
  validateFamousPersonSuggestionInput,
} from '@/domain/city/famousPersonCommunityValidation';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { createFamousPersonSuggestion } from '@/services/famousPerson/famousPersonSuggestionService';
import type { User } from '@/types/users';

type SuggestFamousPersonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  user: User;
  onOpenAuth?: () => void;
  onSuccess?: () => void;
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

export const SuggestFamousPersonModal = ({
  isOpen,
  onClose,
  cityId,
  cityName,
  user,
  onOpenAuth,
  onSuccess,
}: SuggestFamousPersonModalProps) => {
  const nameFieldId = useId();
  const notesFieldId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [suggestedName, setSuggestedName] = useState('');
  const [notes, setNotes] = useState('');
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

  const isGuest = user.role === 'guest';
  const validation = validateFamousPersonSuggestionInput({ suggestedName, notes });
  const canSubmit = validation.ok && !isSubmitting && !isGuest;

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (isOpen) return;
    setSuggestedName('');
    setNotes('');
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !cityId) return;
    setSuggestedName('');
    setNotes('');
    setIsSuccess(false);
    setError(null);
  }, [isOpen, cityId]);

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

  const handleSubmit = async () => {
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    const checked = validateFamousPersonSuggestionInput({ suggestedName, notes });
    if (!checked.ok) {
      setError(checked.errors.join(' '));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createFamousPersonSuggestion({
        userId: user.id,
        cityId,
        suggestedName: checked.suggestedName,
        notes: checked.notes,
      });
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l’invio del suggerimento.');
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
        aria-labelledby="suggest-famous-person-title"
        tabIndex={-1}
      >
        <div className={`${headerShell} relative`}>
          <div className={closeOffsetShell}>
            <CloseButton onClose={onClose} withEscape={false} />
          </div>
          <div className="flex items-start gap-3 pr-10">
            <div className={headerIconBox}>
              <Lightbulb className={headerIconGlyph} aria-hidden />
            </div>
            <div>
              <h2 id="suggest-famous-person-title" className={modalTitleShell}>
                Consiglia un personaggio
              </h2>
              <p className={modalSubtitleShell}>{cityName} — la nota è obbligatoria</p>
            </div>
          </div>
        </div>

        <div className={bodyShell}>
          {isGuest ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Accedi per consigliare un personaggio famoso legato a questa città.
              </p>
              <button type="button" className={btnPrimaryShell} onClick={() => onOpenAuth?.()}>
                Accedi
              </button>
            </div>
          ) : isSuccess ? (
            <p className="text-sm text-emerald-400">
              Grazie! Il suggerimento è in coda di moderazione. Se accettato, l’admin lo completerà
              prima della pubblicazione.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={nameFieldId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Nome personaggio *
                </label>
                <input
                  id={nameFieldId}
                  type="text"
                  value={suggestedName}
                  maxLength={FAMOUS_PERSON_SUGGESTION_NAME_MAX}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor={notesFieldId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Nota obbligatoria *
                </label>
                <textarea
                  id={notesFieldId}
                  value={notes}
                  maxLength={FAMOUS_PERSON_SUGGESTION_NOTES_MAX}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  placeholder="Perché suggerisci questo personaggio? Contesto, fonti, periodo…"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  La nota non può essere vuota. Massimo {FAMOUS_PERSON_SUGGESTION_NOTES_MAX}{' '}
                  caratteri.
                </p>
              </div>
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
                  'Invia suggerimento'
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
