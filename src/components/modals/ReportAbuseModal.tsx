import { Flag, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import type { ContentReportReason } from '@/constants/governance';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import {
  hasReportableImageTarget,
  type ReportAbuseTarget,
  useReportAbuseSubmit,
} from '@/hooks/reports/useReportAbuseSubmit';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { User } from '@/types/users';

const REPORT_REASONS: ContentReportReason[] = [
  'copyright',
  'other_rights',
  'unauthorized',
  'other',
];

const REASON_LABELS: Record<ContentReportReason, string> = {
  copyright: 'Violazione copyright',
  other_rights: 'Altri diritti (immagine, privacy, …)',
  unauthorized: 'Uso non autorizzato',
  other: 'Altro',
  error: 'Errore segnalato',
  suggestion: 'Suggerimento',
};

/** Focus ring dialog — stesso token dei modali Foundation (SaveAs / Share / DeleteConfirm). */
const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

export type ReportAbuseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: ReportAbuseTarget | null;
  user: User | null;
  /** Mostra opzione segnalazione entità (Personaggio/Patrono) */
  allowEntityAbuse?: boolean;
  /** Mostra opzione segnalazione immagine */
  allowImageAbuse?: boolean;
  subtitle?: string;
  onOpenAuth?: () => void;
};

export const ReportAbuseModal = ({
  isOpen,
  onClose,
  target,
  user,
  allowEntityAbuse = true,
  allowImageAbuse = true,
  subtitle,
  onOpenAuth,
}: ReportAbuseModalProps) => {
  const titleId = useId();
  const notesId = useId();
  const statusId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState<ContentReportReason | ''>('');
  const [notes, setNotes] = useState('');
  const [includeEntity, setIncludeEntity] = useState(false);
  const [includeImage, setIncludeImage] = useState(true);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestOtp, setGuestOtp] = useState('');
  const [otpPhase, setOtpPhase] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [isSuccess, setIsSuccess] = useState(false);

  const { isSubmitting, error, setError, sendOtp, verifyOtp, submit } = useReportAbuseSubmit();
  const isGuest = !user || user.role === 'guest';
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

  useGlobalModalEscape(isOpen && !isSubmitting, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setNotes('');
    setIncludeEntity(false);
    setIncludeImage(allowImageAbuse);
    setGuestEmail('');
    setGuestOtp('');
    setOtpPhase('idle');
    setIsSuccess(false);
    setError(null);
  }, [isOpen, allowImageAbuse, setError]);

  if (!isOpen || !target) return null;

  const canReportEntity = allowEntityAbuse && target.entityType !== 'photo_submission';
  const notesValid = notes.trim().length > 0;
  const entityTargetValid = includeEntity && canReportEntity;
  const imageTargetValid = includeImage && allowImageAbuse && hasReportableImageTarget(target);
  const typeValid = entityTargetValid || imageTargetValid;
  const canSubmit =
    Boolean(reason) &&
    notesValid &&
    typeValid &&
    !isSubmitting &&
    (!isGuest || otpPhase === 'verified');

  const handleSendOtp = async () => {
    try {
      await sendOtp(guestEmail);
      setOtpPhase('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invio OTP non riuscito.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp(guestEmail, guestOtp);
      setOtpPhase('verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifica OTP non riuscita.');
    }
  };

  const handleSubmit = async () => {
    if (!reason || !canSubmit) return;
    const ok = await submit({
      target,
      reason,
      userNotes: notes,
      includeEntityAbuse: includeEntity && canReportEntity,
      includeImageAbuse: includeImage && allowImageAbuse,
      user,
      otpPhase,
    });
    if (ok) setIsSuccess(true);
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
        <CloseButton
          onClose={isSubmitting ? () => {} : onClose}
          variant="primary"
          size="md"
          position="static"
          withEscape={false}
          className={`absolute ${closeOffsetShell} z-local-overlay`}
        />

        <header className={headerShell}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className={headerIconBox}>
              <Flag className={headerIconGlyph} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className={`${modalTitleShell} mb-0.5`}>
                Segnala abuso
              </h2>
              <p className={`${modalSubtitleShell} truncate`}>
                {target.entityName}
                {subtitle ? ` · ${subtitle}` : ''}
              </p>
            </div>
          </div>
        </header>

        <div className={bodyShell}>
          {isSuccess ? (
            <p id={statusId} className="text-sm text-emerald-400" role="status" aria-live="polite">
              Segnalazione inviata. Grazie per la collaborazione.
            </p>
          ) : (
            <div className="space-y-4">
              {target.imageUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <img
                    src={target.imageUrl}
                    alt={`Anteprima segnalazione — ${target.entityName}`}
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              ) : null}

              {(canReportEntity || allowImageAbuse) && (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Cosa segnali *
                  </legend>
                  {canReportEntity ? (
                    <label className="flex items-center gap-2 text-sm text-slate-300 min-h-11">
                      <input
                        type="checkbox"
                        checked={includeEntity}
                        onChange={(e) => setIncludeEntity(e.target.checked)}
                      />
                      Contenuto / Personaggio / Patrono
                    </label>
                  ) : null}
                  {allowImageAbuse && hasReportableImageTarget(target) ? (
                    <label className="flex items-center gap-2 text-sm text-slate-300 min-h-11">
                      <input
                        type="checkbox"
                        checked={includeImage}
                        onChange={(e) => setIncludeImage(e.target.checked)}
                      />
                      Immagine visualizzata
                    </label>
                  ) : null}
                </fieldset>
              )}

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Motivo *
                </legend>
                <div className="space-y-2">
                  {REPORT_REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 text-sm text-slate-300 min-h-11"
                    >
                      <input
                        type="radio"
                        name="report-abuse-reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                      />
                      {REASON_LABELS[value]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor={notesId}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Note *
                </label>
                <textarea
                  id={notesId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  placeholder="Descrivi il problema…"
                />
              </div>

              {isGuest ? (
                <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">
                    Inserisci la tua email per verificare l&apos;identità. Non serve registrarti.
                  </p>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="email@esempio.it"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    disabled={otpPhase === 'verified'}
                  />
                  {otpPhase === 'sent' || otpPhase === 'verified' ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={guestOtp}
                      onChange={(e) => setGuestOtp(e.target.value)}
                      placeholder="Codice OTP"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      disabled={otpPhase === 'verified'}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {otpPhase === 'idle' ? (
                      <button
                        type="button"
                        className={btnPrimaryShell}
                        onClick={() => void handleSendOtp()}
                      >
                        Invia codice
                      </button>
                    ) : null}
                    {otpPhase === 'sent' ? (
                      <button
                        type="button"
                        className={btnPrimaryShell}
                        onClick={() => void handleVerifyOtp()}
                      >
                        Verifica codice
                      </button>
                    ) : null}
                    {otpPhase === 'verified' ? (
                      <span className="text-xs text-emerald-400 font-medium">Email verificata</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {error ? (
                <p id={statusId} className="text-sm text-rose-400" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!isSuccess ? (
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
              {isGuest && onOpenAuth && otpPhase !== 'verified' ? (
                <button type="button" className={btnPrimaryShell} onClick={onOpenAuth}>
                  Accedi
                </button>
              ) : (
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
                    'Invia'
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
