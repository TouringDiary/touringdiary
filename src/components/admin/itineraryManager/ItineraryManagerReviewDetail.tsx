import { ExternalLink, Star } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { Review } from '../../../types/index';
import { StarRating } from '../../common/StarRating';
import type { ResolvedTarget } from './itineraryManagerGeo';

/** Tab trap locale sul dialog (nessun focusin su document: non ruba il focus a layer successivi). */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export const ItineraryManagerReviewDetail = ({
  review,
  target,
  canOpenPoi,
  onClose,
  onOpenPoi,
  onOpenReviews,
}: {
  review: Review;
  target: ResolvedTarget;
  canOpenPoi: boolean;
  onClose: () => void;
  onOpenPoi: () => void;
  onOpenReviews: () => void;
}) => {
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useGlobalModalEscape(true, onClose);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell} !items-center !top-0`}
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
        className={`${containerShell} max-w-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-review-detail-title"
        aria-describedby="admin-review-detail-desc"
        tabIndex={-1}
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          withEscape={false}
          className={`${closeOffsetShell} z-local-overlay`}
        />
        <div className={`${bodyShell} flex flex-col gap-5 sm:gap-6`}>
          <div className="flex items-center gap-3 sm:gap-4 pr-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-xl sm:text-2xl text-slate-400 shadow-lg">
              {review.author.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 id="admin-review-detail-title" className={`${modalTitleShell} truncate`}>
                {review.author}
              </h3>
              <p className={modalSubtitleShell}>Recensore Community</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {target.kind === 'itinerary' ? 'ITINERARIO' : 'POI / LUOGO'}
              </span>
              <StarRating value={review.rating} size="w-4 h-4" />
            </div>
            <h4
              className="text-base sm:text-lg font-bold text-white mb-1 break-words"
              title={target.technicalId || undefined}
            >
              {target.name}
            </h4>
            {target.geo?.breadcrumb ? (
              <p className="text-xs text-slate-400 break-words">{target.geo.breadcrumb}</p>
            ) : null}
          </div>

          <div id="admin-review-detail-desc">
            <p className="text-slate-300 italic text-base sm:text-lg leading-relaxed break-words">
              &quot;{review.text}&quot;
            </p>
          </div>

          {review.criteria && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-800 pt-4">
              {Object.entries(review.criteria).map(([key, val]) => (
                <div key={key} className="text-center bg-slate-800/80 p-2 rounded-lg min-w-0">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1 truncate">
                    {key}
                  </span>
                  <span className="text-amber-500 font-bold">{val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs border-t border-slate-800 pt-4">
            <div>
              <span className="text-slate-500 uppercase font-bold block mb-1">Pubblicata il</span>
              <span className="text-white font-mono">{new Date(review.date).toLocaleString()}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-slate-500 uppercase font-bold block mb-1">Modificata</span>
              <span className="text-white font-mono">
                {review.updatedAt ? new Date(review.updatedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors"
            >
              Chiudi
            </button>
            {canOpenPoi && (
              <>
                <button
                  type="button"
                  onClick={onOpenReviews}
                  className="flex-1 py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Star className="w-4 h-4" /> Recensioni
                </button>
                <button
                  type="button"
                  onClick={onOpenPoi}
                  className="flex-1 py-3 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Apri POI
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
