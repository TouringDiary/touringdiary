import { Flag, Loader2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { createPatronPhotoReport } from '@/services/patron/patronPhotoReportService';
import {
  type CityPatronGalleryPhoto,
  PATRON_PHOTO_REPORT_REASON_LABELS,
  type PatronPhotoReportReason,
} from '@/types/models/patronGallery';
import type { User } from '@/types/users';

const REPORT_REASONS: PatronPhotoReportReason[] = [
  'copyright',
  'other_rights',
  'unauthorized',
  'other',
];

type ReportPatronPhotoAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  photo: CityPatronGalleryPhoto | null;
  cityId: string;
  cityName: string;
  patronName: string;
  user: User | null;
  /** Richiesto nei consumer pubblici per guest; opzionale se l’utente è già autenticato (es. preview admin). */
  onOpenAuth?: () => void;
};

/** Focus ring dialog — stesso token dei modali Foundation (SaveAs / Share / DeleteConfirm). */
const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

export const ReportPatronPhotoAbuseModal = ({
  isOpen,
  onClose,
  photo,
  cityId,
  cityName,
  patronName,
  user,
  onOpenAuth,
}: ReportPatronPhotoAbuseModalProps) => {
  const reasonGroupId = useId();
  const notesId = useId();
  const [reason, setReason] = useState<PatronPhotoReportReason | ''>('');
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
  const reportPhotoId = photo?.id ?? null;

  // ESC LIFO. CloseButton withEscape=false → una sola registrazione nello stack.
  useGlobalModalEscape(isOpen, onClose);

  // Reset alla chiusura.
  useEffect(() => {
    if (isOpen) return;
    setReason('');
    setNotes('');
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, [isOpen]);

  // Nuova fotografia mentre il modal resta aperto → form coerente con la photo corrente.
  // Non tocca isSubmitting (evita race con un submit ancora in volo).
  useEffect(() => {
    if (!isOpen || reportPhotoId == null) return;
    setReason('');
    setNotes('');
    setIsSuccess(false);
    setError(null);
  }, [isOpen, reportPhotoId]);

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
      await createPatronPhotoReport({
        galleryPhotoId: photo.id,
        galleryImageUrl: photo.imageUrl,
        galleryStoragePath: photo.storagePath,
        reporterUserId: user.id,
        reporterUserName: user.name ?? null,
        cityId,
        cityName,
        patronName,
        reason,
        notes,
      });
      setIsSuccess(true);
    } catch {
      setError("Errore durante l'invio della segnalazione.");
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
        className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-patron-photo-title"
        aria-describedby="report-patron-photo-desc"
      >
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
            {/* Stesso token icon-box Foundation; tinta rose solo come accento semantico abuso. */}
            <div className={`${headerIconBox} !bg-rose-500/10 !text-rose-400 !border-rose-500/20`}>
              <Flag className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="report-patron-photo-title" className={`${modalTitleShell} mb-0.5`}>
                Segnala abuso
              </h3>
              <p id="report-patron-photo-desc" className={`${modalSubtitleShell} truncate`}>
                Gallery Patrono · {cityName}
              </p>
            </div>
          </div>
        </header>

        <div className={`${bodyShell} min-h-0 space-y-5`}>
          {isSuccess ? (
            <p className="text-sm text-slate-200 leading-relaxed py-2">
              Grazie per la segnalazione. Il team la esaminerà al più presto.
            </p>
          ) : (
            <>
              {isGuest ? (
                <p className="text-sm text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-lg px-4 py-3">
                  Accedi per segnalare un abuso su una fotografia pubblicata.
                </p>
              ) : null}

              <div className="flex gap-4 items-start">
                <img
                  src={photo.imageUrl}
                  alt={`Fotografia segnalata — ${patronName}`}
                  className="w-24 h-24 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <dl className="text-sm space-y-2 flex-1 min-w-0">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Città
                    </dt>
                    <dd className="text-white">{cityName}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Santo Patrono
                    </dt>
                    <dd className="text-white">{patronName}</dd>
                  </div>
                </dl>
              </div>

              <fieldset>
                <legend
                  id={reasonGroupId}
                  className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2"
                >
                  Motivo della segnalazione *
                </legend>
                <div className="space-y-2" role="radiogroup" aria-labelledby={reasonGroupId}>
                  {REPORT_REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-600 cursor-pointer min-h-[44px]"
                    >
                      <input
                        type="radio"
                        name="patron-report-reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        disabled={isSubmitting}
                        className="text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-slate-200">
                        {PATRON_PHOTO_REPORT_REASON_LABELS[value]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor={notesId}
                  className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2"
                >
                  Note (facoltative)
                </label>
                <textarea
                  id={notesId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  placeholder={
                    reason === 'other'
                      ? 'Specifica il motivo della segnalazione…'
                      : 'Descrivi brevemente il problema…'
                  }
                />
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
                    'Invia segnalazione'
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
