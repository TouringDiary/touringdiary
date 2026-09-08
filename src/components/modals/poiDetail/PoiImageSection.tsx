import {
  ArrowUpLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FavoriteBookmarkButton } from '@/components/myspace/FavoriteBookmarkButton';
import { resolvePoiDisplayImageUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';
import { showGlobalAlert } from '@/services/ui/toastService';
import type { PointOfInterest, Review, User } from '@/types';
import {
  deleteOwnReview,
  deleteReviewAsAdmin,
  getReviewsForPoi,
} from '../../../services/communityService';
import { getCategoryPlaceholders } from '../../../services/settingsService';
import { supabase } from '../../../services/supabaseClient';
import { galleryDisplayUrls } from '../../../utils/media';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { StarRating } from '../../common/StarRating';

interface PoiImageSectionProps {
  poi: PointOfInterest;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  onToggleItinerary?: (poi: PointOfInterest) => void;
  isInItinerary: boolean;
  user: User;
  onOpenAuth?: () => void;
  onOpenReview?: () => void;
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const PoiImageSection = ({
  poi,
  isFlipped,
  setIsFlipped,
  onToggleItinerary,
  isInItinerary,
  user,
  onOpenAuth,
  onOpenReview,
}: PoiImageSectionProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  /** Rating da SoT DB (`pois.rating`), non ricalcolato client-side. */
  const [displayRating, setDisplayRating] = useState<number>(poi.rating || 0);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'admin_all' || user?.role === 'admin_limited';
  const isGuest = !user || user.role === 'guest';

  const mainImageUrl = resolvePoiDisplayImageUrl({
    imageUrl: poi.imageUrl,
    category: poi.category,
    categoryPlaceholders: getCategoryPlaceholders(),
  });

  const images = useMemo(() => {
    const fromGallery = galleryDisplayUrls(poi.gallery);
    if (fromGallery.length > 0) {
      return fromGallery;
    }
    return mainImageUrl ? [mainImageUrl] : [];
  }, [poi.gallery, mainImageUrl]);

  const loadReviews = useCallback(async () => {
    // SoT lista: solo tabella `reviews` (niente merge con poi.reviews legacy JSON).
    const cloud = await getReviewsForPoi(poi.id);
    setAllReviews(cloud);

    // SoT rating: colonna denormalizzata aggiornata dal trigger DB.
    // Rilettura esplicita dopo mutazioni locali (delete) senza attendere refresh del parent.
    const { data } = await supabase.from('pois').select('rating').eq('id', poi.id).maybeSingle();
    setDisplayRating(Number(data?.rating ?? poi.rating ?? 0));
  }, [poi.id, poi.rating]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, isFlipped]);

  useEffect(() => {
    setDisplayRating(poi.rating || 0);
  }, [poi.rating]);

  const myReview = useMemo(() => {
    if (isGuest) return null;
    return allReviews.find((r) => r.authorId === user.id) ?? null;
  }, [allReviews, isGuest, user.id]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const isMine = !isGuest && deleteTarget.authorId === user.id;
      if (isMine) {
        await deleteOwnReview(deleteTarget.id, user.id);
      } else if (isAdmin) {
        await deleteReviewAsAdmin(deleteTarget.id);
      } else {
        throw new Error('Non autorizzato.');
      }
      setDeleteTarget(null);
      await loadReviews();
    } catch (e) {
      console.error(e);
      showGlobalAlert('Impossibile eliminare la recensione.');
    } finally {
      setIsDeleting(false);
    }
  };

  const ratingLabel = displayRating.toFixed(1);
  const deleteAsAuthor = Boolean(deleteTarget && !isGuest && deleteTarget.authorId === user.id);
  const canOpenReviewFlow = Boolean(onOpenReview && (!isGuest || onOpenAuth));

  const handleOpenReview = () => {
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    onOpenReview?.();
  };

  const reviewActionBtnClass =
    'inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500 italic">Nessuna immagine disponibile</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full perspective-1000 bg-black">
      {deleteTarget && (
        <div className="absolute inset-0 z-local-overlay bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="text-white font-bold text-sm">
              {deleteAsAuthor ? 'Eliminare la recensione?' : 'Rimuovere la recensione?'}
            </h4>
            <p className="text-xs text-slate-400">
              {deleteAsAuthor ? (
                <>
                  Stai per eliminare la recensione di{' '}
                  <strong className="text-white">{deleteTarget.author}</strong>.
                </>
              ) : (
                <>
                  Questa recensione verrà rimossa dalla visualizzazione pubblica.
                  {deleteTarget.author ? (
                    <>
                      {' '}
                      (Autore: <strong className="text-white">{deleteTarget.author}</strong>)
                    </>
                  ) : null}
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {deleteAsAuthor ? 'Elimina' : 'Rimuovi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        <div className="absolute inset-0 backface-hidden">
          <div className="peer/photo absolute inset-0">
            <ImageWithFallback
              src={images[currentImageIndex]}
              alt={poi.name}
              category={poi.category}
              className="h-full w-full object-cover opacity-90"
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
          </div>

          {onToggleItinerary && (
            <div className="absolute top-4 right-4 z-dropdown">
              <button
                type="button"
                onClick={() => onToggleItinerary(poi)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 lg:gap-2 lg:px-5 lg:py-2.5 lg:text-xs lg:hover:scale-105 ${isInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}
              >
                {isInItinerary ? (
                  <Check className="h-3 w-3 lg:h-4 lg:w-4" />
                ) : (
                  <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                )}
                {isInItinerary ? 'Aggiunto' : 'ADD'}
              </button>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-dropdown pointer-events-auto lg:bottom-6 lg:right-6">
            <FavoriteBookmarkButton
              userId={user?.role === 'guest' ? null : user?.id}
              entityKind="poi"
              entityId={poi.id}
              onRequireAuth={onOpenAuth}
              size="sm"
              className="!grid !h-10 !w-10 !min-h-10 !min-w-10 !p-0 !place-items-center [&_svg]:block [&_svg]:!size-3.5"
            />
          </div>

          <div className="absolute bottom-4 left-4 z-dropdown text-white lg:bottom-6 lg:left-6">
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="group relative flex min-w-[70px] flex-col items-center rounded-2xl border border-amber-500/35 bg-black/60 p-3 shadow-2xl backdrop-blur-md transition-all hover:border-amber-400/60 hover:bg-black/75 hover:shadow-[0_0_14px_rgba(245,158,11,0.12)] peer-hover/photo:border-amber-400/55 peer-hover/photo:bg-black/75 peer-hover/photo:shadow-[0_0_14px_rgba(245,158,11,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 active:scale-[0.98]"
              aria-label={`Valutazione media ${ratingLabel}, apri recensioni`}
              title="Apri recensioni"
            >
              <span
                className="pointer-events-none absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-md border border-amber-500/45 bg-black/85 p-0.5 shadow-md backdrop-blur-sm transition-all group-hover:border-amber-400/65 group-hover:bg-slate-950/95 group-focus-visible:border-amber-400/70 group-focus-visible:ring-1 group-focus-visible:ring-amber-500/40 group-active:scale-95 peer-hover/photo:border-amber-400/65 peer-hover/photo:bg-slate-950/95"
                aria-hidden
              >
                <span className="relative flex h-4 w-4 items-center justify-center text-indigo-300 transition-colors group-hover:text-indigo-200 group-focus-visible:text-indigo-200 peer-hover/photo:text-indigo-200">
                  <MessageSquare className="h-3.5 w-3.5 fill-current" />
                  <Pencil className="absolute -right-0.5 -top-0.5 h-2 w-2 text-amber-200 transition-colors group-hover:text-amber-100 group-focus-visible:text-amber-100 peer-hover/photo:text-amber-100" />
                </span>
              </span>
              <span className="text-2xl font-black leading-none">{ratingLabel}</span>
              <StarRating value={displayRating} size="w-3 h-3" showValue={false} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-4 top-1/2 z-dropdown flex -translate-y-1/2 justify-between">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);
                }}
                className="pointer-events-auto grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10 bg-black/40 p-2 text-white backdrop-blur transition-all hover:bg-black/80"
                aria-label="Immagine precedente"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((p) => (p + 1) % images.length);
                }}
                className="pointer-events-auto grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10 bg-black/40 p-2 text-white backdrop-blur transition-all hover:bg-black/80"
                aria-label="Immagine successiva"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </div>
          )}
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 flex flex-col border-t border-slate-800">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b0f1a] shrink-0">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Recensioni
            </h3>
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide"
            >
              <ArrowUpLeft className="w-3.5 h-3.5 text-amber-500" /> TORNA FOTO
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-950/50">
            {allReviews.length > 0 ? (
              allReviews.map((rev) => {
                const isMine = !isGuest && rev.authorId === user.id;
                const canDelete = isMine || isAdmin;
                const canEditReview = isMine && canOpenReviewFlow;
                return (
                  <div
                    key={rev.id}
                    className={`bg-[#0b0f1a] p-4 rounded-xl border shadow-sm ${isMine ? 'border-amber-500/30' : 'border-slate-800'}`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
                          {rev.author.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">
                            {rev.author}
                            {isMine ? ' (Tu)' : ''}
                          </span>
                          <div className="flex gap-0.5 mt-0.5">
                            <StarRating value={rev.rating} size="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-start gap-1.5">
                        <div className="min-w-0 text-right">
                          <span className="block whitespace-nowrap text-[10px] font-mono text-slate-600">
                            {formatReviewDate(rev.date)}
                          </span>
                          {rev.updatedAt && (
                            <span className="mt-0.5 block max-w-[9rem] truncate text-[9px] font-medium text-amber-500/90 sm:max-w-none sm:whitespace-nowrap">
                              Modificata il {formatReviewDate(rev.updatedAt)}
                            </span>
                          )}
                        </div>
                        {(canEditReview || canDelete) && (
                          <div className="flex shrink-0 items-center gap-0.5">
                            {canEditReview && (
                              <button
                                type="button"
                                title="Modifica recensione"
                                aria-label="Modifica recensione"
                                onClick={handleOpenReview}
                                className={`${reviewActionBtnClass} text-slate-500 hover:bg-amber-900/20 hover:text-amber-400`}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                title={isMine ? 'Elimina recensione' : 'Rimuovi recensione'}
                                aria-label={isMine ? 'Elimina recensione' : 'Rimuovi recensione'}
                                onClick={() => setDeleteTarget(rev)}
                                className={`${reviewActionBtnClass} text-slate-500 hover:bg-red-900/20 hover:text-red-400`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed pl-2 border-l-2 border-slate-700">
                      {rev.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 opacity-40">
                <MessageSquare className="w-10 h-10" />
                <p className="text-xs italic">Nessun commento.</p>
              </div>
            )}
          </div>
          {canOpenReviewFlow && !myReview && (
            <div className="shrink-0 border-t border-slate-800 bg-slate-900 p-4">
              <button
                type="button"
                onClick={handleOpenReview}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-600 py-3 text-xs font-bold uppercase text-white shadow-lg transition-all hover:bg-emerald-500"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Scrivi Recensione
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
