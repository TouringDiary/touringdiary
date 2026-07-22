import React from 'react';
import { Heart } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import type { PhotoSubmission } from '@/types/index';

interface PhotoLikeStatus {
    isLiked: boolean;
    count: number;
}

interface Props {
    snaps: PhotoSubmission[];
    heroIndex: number;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    getStatus: (snap: PhotoSubmission) => PhotoLikeStatus;
    onSelect: (index: number) => void;
    onOpenLightbox: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
}

export const LiveFeedCarousel: React.FC<Props> = ({
    snaps,
    heroIndex,
    scrollRef,
    getStatus,
    onSelect,
    onOpenLightbox,
    hasMore,
    onLoadMore,
}) => (
    <div
        ref={scrollRef}
        className="flex flex-nowrap gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory w-full pt-4 mt-auto mb-4 transition-all duration-500"
    >
        {snaps.map((snap, idx) => {
            const status = getStatus(snap);
            const isActive = idx === heroIndex;
            return (
                <div
                    key={snap.id}
                    data-index={idx}
                    className={`snap-start flex-shrink-0 w-[32vw] md:w-[220px] aspect-square bg-slate-900 rounded-xl relative group overflow-hidden cursor-pointer shadow-xl border-2 transition-all duration-300 ${
                        isActive ? 'border-indigo-500 scale-105 z-10' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => {
                        if (isActive) onOpenLightbox(snap.id);
                        else onSelect(idx);
                    }}
                >
                    <ImageWithFallback
                        src={snap.url}
                        alt="Snap"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-dropdown opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {snap.status === 'pending' && (
                        <div className="absolute top-2 left-2 z-dropdown">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse border border-black" />
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-dropdown opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                        <span className="text-white text-[10px] font-bold truncate max-w-[70%]">
                            {snap.description || 'Foto'}
                        </span>
                        <div className="flex items-center gap-1.5 text-white text-xs font-black">
                            <Heart
                                className={`w-4 h-4 ${
                                    status.isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                                }`}
                            />{' '}
                            {status.count}
                        </div>
                    </div>
                    {isActive && <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />}
                </div>
            );
        })}
        {hasMore && (
            <button
                type="button"
                onClick={onLoadMore}
                className="snap-start flex-shrink-0 w-[32vw] md:w-[220px] aspect-square rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-indigo-500 transition-colors"
            >
                Carica altre
            </button>
        )}
    </div>
);
