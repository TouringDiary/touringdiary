import { Flag, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { createFamousPersonPhotoReport } from '@/services/famousPerson/famousPersonPhotoReportService';
import {
  FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS,
  type FamousPersonPhotoReportReason,
} from '@/types/models/famousPersonCommunity';
import type { User } from '@/types/users';

const REPORT_REASONS: FamousPersonPhotoReportReason[] = [
  'copyright',
  'other_rights',
  'unauthorized',
  'other',
];

export type FamousPersonOfficialPhotoTarget = {
  personId: string;
  imageUrl: string;
  storagePath?: string | null;
  personName: string;
};

type ReportFamousPersonPhotoAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  photo: FamousPersonOfficialPhotoTarget | null;
  cityId: string;
  cityName: string;
  user: User | null;
  onOpenAuth?: () => void;
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

export const ReportFamousPersonPhotoAbuseModal = ({
  isOpen,
  onClose,
  photo,
  cityId,
  cityName,
  user,
  onOpenAuth,
}: ReportFamousPersonPhotoAbuseModalProps) => {
  const titleId = useId();
  const reasonGroupId = useId();
  const notesId = useId();
  const statusId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const successCloseRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState<FamousPersonPhotoReportReason | ''>('');
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

  const isGuest = !user || user.role === 'guest';
  const canSubmit = Boolean(photo && reason && !isSubmitting && !isGuest);
  const reportPersonId = photo?.personId ?? null;

  useGlobalModalEscape(isOpen && !isSubmitting, onClose);

  useEffect(() => {
    if (isOpen) return;
    setReason('');
    setNotes('');
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || reportPersonId == null) return;
    setReason('');
    setNotes('');
    setIsSuccess(false);
    setError(null);
  }, [isOpen, reportPersonId]);

  // Focus on success state close button (once per success)
  useEffect(() => {
    if (!isOpen || !isSuccess) return;
    const focusRaf = requestAnimationFrame(() => {
      successCloseRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(focusRaf);
    };
  }, [isOpen, isSuccess]);

  // 1. Focus Restore & Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      const activeEl = document.activeElement;
      openerRef.current = activeEl instanceof HTMLElement ? activeEl : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
        const opener = openerRef.current;
        openerRef.current = null;
        if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
          opener.focus();
        }
      };
    }
  }, [isOpen]);

  // 1.5 Initial Focus (only once on open)
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      if (dialog) {
        const focusable = getFocusableElements(dialog);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialog.focus();
        }
      }
    });
    return () => {
      cancelAnimationFrame(focusRaf);
    };
  }, [isOpen]);

  // 2. Focus Trap
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

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

  if (!isOpen || !photo) return null;

  const handleSubmit = async () => {
    if (!user || user.role === 'guest') {
      onOpenAuth?.();
      return;
    }
    if (!canSubmit || !reason) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createFamousPersonPhotoReport({
        personId: photo.personId,
        personImageUrl: photo.imageUrl,
        personImageStoragePath: photo.storagePath,
        reporterUserId: user.id,
        reporterUserName: user.name ?? null,
        cityId,
        cityName,
        personName: photo.personName,
        reason,
        notes,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio della segnalazione.");
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
        onClick={isSubmitting ? undefined : onClose}
      />
      <div
        ref={dialogRef}
        className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error || isSuccess ? statusId : undefined}
        tabIndex={-1}
      >
        <div className={`${headerShell} relative`}>
          <div className={closeOffsetShell}>
            <CloseButton onClose={isSubmitting ? () => {} : onClose} withEscape={false} />
          </div>
          <div className="flex items-start gap-3 pr-10">
            <div className={headerIconBox}>
              <Flag className={headerIconGlyph} aria-hidden />
            </div>
            <div>
              <h2 id={titleId} className={modalTitleShell}>
                Segnala abuso
              </h2>
              <p className={modalSubtitleShell}>
                {photo.personName} · {cityName}
              </p>
            </div>
          </div>
        </div>

        <div className={bodyShell}>
          {isGuest ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Accedi per segnalare un abuso sulla foto ufficiale pubblicata.
              </p>
              <button type="button" className={btnPrimaryShell} onClick={() => onOpenAuth?.()}>
                Accedi
              </button>
            </div>
          ) : isSuccess ? (
            <p id={statusId} className="text-sm text-emerald-400" role="status" aria-live="polite">
              Segnalazione inviata. Grazie per la collaborazione.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <img
                  src={photo.imageUrl}
                  alt={`Foto ufficiale di ${photo.personName}`}
                  className="w-full max-h-48 object-cover"
                />
              </div>
              <fieldset>
                <legend
                  id={reasonGroupId}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Motivo *
                </legend>
                <div className="space-y-2" role="radiogroup" aria-labelledby={reasonGroupId}>
                  {REPORT_REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 text-sm text-slate-300 min-h-11"
                    >
                      <input
                        type="radio"
                        name="famous-person-abuse-reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                      />
                      {FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS[value]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label
                  htmlFor={notesId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Note (facoltative)
                </label>
                <textarea
                  id={notesId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>
              {error ? (
                <p
                  id={statusId}
                  className="text-sm text-rose-400"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              ) : null}
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
                  'Invia segnalazione'
                )}
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className={footerShell}>
            <div className={footerActionsShell}>
              <button
                ref={successCloseRef}
                type="button"
                className={btnPrimaryShell}
                onClick={onClose}
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
