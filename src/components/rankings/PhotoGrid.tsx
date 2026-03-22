
import React from 'react';
import { Heart } from 'lucide-react';
import { PhotoSubmission, RankedItemMixin } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useInteraction } from '../../context/InteractionContext';

interface PhotoGridProps {
    photos: (PhotoSubmission & RankedItemMixin)[];
    onClick: (url: string) => void;
}

const PhotoGridItem: React.FC<{
    photo: PhotoSubmission & RankedItemMixin;
    rank: number;
    onClick: (url: string) => void;
}> = ({ photo, rank, onClick }) => {
    const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
    const status = getPhotoStatus(photo);

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isGuest) {
            togglePhotoHeart(photo.id);
        }
    };

    return (
        <div onClick={() => onClick(photo.url)} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-slate-800 hover:border-indigo-500 transition-all shadow-lg">
            <ImageWithFallback src={photo.url} alt={photo.description || 'Foto'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-white font-black text-xs border border-white/10 z-10">
                #{rank}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute top-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                    <p className="text-[8px] text-slate-300 uppercase font-bold tracking-tight text-center leading-tight truncate">
                        {photo.hierarchy}
                    </p>
                </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate pr-2">{photo.user}</span>
                    <button
                        onClick={handleLikeClick}
                        className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${
                            status.isLiked
                                ? 'text-rose-400 bg-rose-900/20'
                                : 'text-slate-300 bg-black/20 hover:bg-black/40'
                        } ${status.isLoading ? 'animate-pulse' : ''}`}
                        disabled={status.isLoading || isGuest}
                    >
                        <Heart className={`w-3 h-3 ${status.isLiked ? 'fill-current' : ''}`} />
                        {status.count}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onClick }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {photos.map((p, idx) => (
                <PhotoGridItem key={p.id} photo={p} rank={idx + 1} onClick={onClick} />
            ))}
        </div>
    );
};
