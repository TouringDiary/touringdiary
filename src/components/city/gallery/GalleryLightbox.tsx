import { ChevronLeft, ChevronRight, Flag, Heart, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_LIGHTBOX } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useInteraction } from '../../../context/InteractionContext';
import { ImageWithFallback } from '../../common/ImageWithFallback';

export interface LightboxData {
  id: string;
  url: string;
  user: string;
  /** Community photo likes. Omit for non-photo media (e.g. city cover). */
  likes?: number;
  caption?: string;
  /** Photo submission date. Omit when not a community/official photo. */
  date?: string;
  likedByUser?: boolean;
}

/** Thumbnail strip: real callers pass PhotoSubmission-like items with required `url`. */
export type LightboxThumbnail = Pick<LightboxData, 'id' | 'url'>;

interface Props {
  data: LightboxData | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  allPhotos?: LightboxThumbnail[];
  currentIndex?: number;
  onGoToPhoto?: (idx: number) => void;
  onReportAbuse?: () => void;
}

export const GalleryLightbox = ({
  data,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  allPhotos = [],
  currentIndex = 0,
  onGoToPhoto,
  onReportAbuse,
}: Props) => {
  const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  useGlobalModalEscape(!!data, onClose);

  // Body scroll lock: restore previous overflow (CategoryMobileDialog pattern).
  useEffect(() => {
    if (!data) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [data]);

  // Keyboard navigation only while the lightbox is open.
  useEffect(() => {
    if (!data) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onNext, onPrev, hasNext, hasPrev]);

  // Auto-scroll thumbnails to keep current in view
  useEffect(() => {
    if (!data || !thumbnailRef.current || currentIndex === undefined) return;

    const activeThumb = thumbnailRef.current.children[currentIndex] as HTMLElement | undefined;
    if (activeThumb) {
      thumbnailRef.current.scrollTo({
        left:
          activeThumb.offsetLeft -
          thumbnailRef.current.offsetWidth / 2 +
          activeThumb.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [data, currentIndex]);

  if (!data) return null;

  const hasCommunityLikes = typeof data.likes === 'number';
  const { isLiked, count, isLoading } = hasCommunityLikes
    ? getPhotoStatus({
        id: data.id,
        likes: data.likes,
        likedByUser: data.likedByUser,
      })
    : { isLiked: false, count: 0, isLoading: false };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasCommunityLikes || isGuest || !data.id) return;
    togglePhotoHeart(data.id);
  };

  const handleImageTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  const handleImageTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX == null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX == null) return;
    const deltaX = endX - startX;
    const SWIPE_THRESHOLD_PX = 50;
    if (deltaX > SWIPE_THRESHOLD_PX) {
      if (hasPrev) onPrev();
      return;
    }
    if (deltaX < -SWIPE_THRESHOLD_PX) {
      if (hasNext) onNext();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/98 flex flex-col items-center justify-between animate-in fade-in-25 pointer-events-auto overflow-hidden"
      role="presentation"
      style={{ zIndex: Z_LIGHTBOX }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Chiudi lightbox"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      {/* Header / Close */}
      <div className="relative w-full flex justify-end p-4 shrink-0">
        <CloseButton onClose={onClose} variant="primary" />
      </div>

      {/* Main Content Area — sibling stacking above backdrop; swipe mobile sulla foto */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 md:p-6 min-h-0">
        <div
          className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center touch-pan-y"
          onTouchStart={handleImageTouchStart}
          onTouchEnd={handleImageTouchEnd}
        >
          {/*
            Metodologia Community Hub / GalleryLightbox SoT:
            object-fit contain nell’area flex-1 (niente crop). ImageWithFallback contain
            riempie questo box e centra l’img — foto verticali intere.
          */}
          <ImageWithFallback
            src={data.url}
            alt={data.caption || `Foto di ${data.user}`}
            objectFit="contain"
            size="large"
            className="shadow-2xl rounded-sm animate-in zoom-in-95 duration-300 pointer-events-none"
          />
        </div>

        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Foto precedente"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md border border-white/10 hidden md:block group"
          >
            <ChevronLeft
              size={32}
              className="text-white group-active:scale-90 transition-transform"
            />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Foto successiva"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md border border-white/10 hidden md:block group"
          >
            <ChevronRight
              size={32}
              className="text-white group-active:scale-90 transition-transform"
            />
          </button>
        )}
      </div>

      {/* Footer / Meta / Thumbnails */}
      <div className="relative w-full flex flex-col items-center gap-4 p-4 pb-8 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent">
        {allPhotos.length > 1 && (
          <div
            ref={thumbnailRef}
            className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-2xl px-4 py-2 snap-x"
          >
            {allPhotos.map((p, idx) => (
              <button
                type="button"
                key={p.id}
                onClick={() => onGoToPhoto?.(idx)}
                aria-label={`Apri foto ${idx + 1} di ${allPhotos.length}`}
                aria-current={idx === currentIndex ? 'true' : undefined}
                className={`snap-center shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-amber-500 scale-110 shadow-lg ring-4 ring-amber-500/20' : 'border-white/10 opacity-30 hover:opacity-100 hover:border-white/30'}`}
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info Bar */}
        <div className="flex items-center gap-6 bg-slate-900/90 p-2.5 px-6 rounded-full text-white backdrop-blur-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 max-w-full">
          <div className="flex flex-col items-start leading-tight min-w-0">
            <span className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5">
              Contributor
            </span>
            <span className="font-bold text-sm tracking-wide text-slate-100 truncate max-w-[40vw] sm:max-w-none">
              {data.user}
            </span>
          </div>

          {onReportAbuse ? (
            <>
              <div className="w-px h-8 bg-white/10 shrink-0" />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onReportAbuse();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider min-h-[44px]"
                aria-label="Segnala abuso su questa foto"
              >
                <Flag className="w-4 h-4" aria-hidden />
                Segnala abuso
              </button>
            </>
          ) : null}

          {hasCommunityLikes && (
            <>
              <div className="w-px h-8 bg-white/10 shrink-0" />

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-black text-lg text-white">{count}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                    Apprezzamenti
                  </span>
                </div>
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                ) : (
                  <button
                    type="button"
                    onClick={handleLike}
                    aria-label={isLiked ? 'Rimuovi like' : 'Metti like'}
                    className={`p-2.5 rounded-full transition-all transform active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center ${isLiked ? 'bg-red-500/20 text-red-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {data.caption && (
          <p className="text-[10px] text-slate-400 font-medium max-w-md text-center italic line-clamp-1 opacity-60 px-2">
            "{data.caption}"
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
};
