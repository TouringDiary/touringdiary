import { Heart } from 'lucide-react';
import type React from 'react';
import { CountBadge } from '@/components/ui/CountBadge';
import { useInteraction } from '../../context/InteractionContext';
import type { PhotoSubmission, RankedItemMixin } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PhotoGridProps {
  photos: (PhotoSubmission & RankedItemMixin)[];
  onClick: (url: string) => void;
  /** Allinea GalleryGrid: guest → avvia auth; autenticati → toggle like. */
  onOpenAuth?: () => void;
}

const PhotoGridItem: React.FC<{
  photo: PhotoSubmission & RankedItemMixin;
  rank: number;
  onClick: (url: string) => void;
  onOpenAuth?: () => void;
}> = ({ photo, rank, onClick, onOpenAuth }) => {
  const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
  const status = getPhotoStatus(photo);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    togglePhotoHeart(photo.id);
  };

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden group border border-slate-800 hover:border-indigo-500 transition-all shadow-lg">
      <button
        type="button"
        aria-label={`Apri foto ${photo.description || photo.user || 'classifica'}`}
        onClick={() => onClick(photo.url)}
        className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-inset"
      />
      <ImageWithFallback
        src={photo.url}
        alt={photo.description || 'Foto'}
        className="pointer-events-none relative z-[1] w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <CountBadge
        display={`#${rank}`}
        size="lg"
        variant="rank"
        position="overlay-tl"
        className="pointer-events-none z-[1] w-8 h-8 min-w-[32px] text-xs"
      />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
      <div className="absolute top-0 inset-x-0 z-[1] p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
          <p className="text-[8px] text-slate-300 uppercase font-bold tracking-tight text-center leading-tight truncate">
            {photo.hierarchy}
          </p>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-[1] text-white pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold truncate pr-2">{photo.user}</span>
          <button
            type="button"
            onClick={handleLikeClick}
            aria-label="Mi Piace"
            className={`pointer-events-auto flex items-center gap-1 text-xs font-bold min-h-11 min-w-11 justify-center px-2 rounded transition-colors touch-manipulation ${
              status.isLiked
                ? 'text-rose-400 bg-rose-900/20'
                : 'text-slate-300 bg-black/20 hover:bg-black/40'
            } ${status.isLoading ? 'animate-pulse' : ''}`}
            disabled={status.isLoading}
          >
            <Heart className={`w-3 h-3 ${status.isLiked ? 'fill-current' : ''}`} />
            {status.count}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onClick, onOpenAuth }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
      {photos.map((p, idx) => (
        <PhotoGridItem
          key={p.id}
          photo={p}
          rank={idx + 1}
          onClick={onClick}
          onOpenAuth={onOpenAuth}
        />
      ))}
    </div>
  );
};
