import React from 'react';
import { Heart, Clock, Trash2, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { CountBadge } from '@/components/ui/CountBadge';
import type { PhotoSubmission } from '@/types/index';

interface PhotoLikeStatus {
    isLiked: boolean;
    count: number;
}

interface Props {
    heroSnap: PhotoSubmission;
    heroStatus: PhotoLikeStatus | null;
    snapCount: number;
    isAdmin: boolean;
    onOpenLightbox: (id: string) => void;
    onPrev: (e?: React.MouseEvent) => void;
    onNext: (e?: React.MouseEvent) => void;
    onDelete: (snap: PhotoSubmission) => void;
    onToggleOfficial: (snap: PhotoSubmission) => void;
    onToggleLike: (id: string) => void;
}

export const LiveFeedHero: React.FC<Props> = ({
    heroSnap,
    heroStatus,
    snapCount,
    isAdmin,
    onOpenLightbox,
    onPrev,
    onNext,
    onDelete,
    onToggleOfficial,
    onToggleLike,
}) => (
    <div className="animate-in fade-in slide-in-from-top-4 duration-700 -mx-4 md:-mx-8 mb-4 relative group">
        <div
            className="relative w-full h-[45vh] md:h-[38vh] overflow-hidden shadow-2xl cursor-zoom-in bg-slate-900 md:rounded-3xl"
            onClick={() => onOpenLightbox(heroSnap.id)}
        >
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={heroSnap.url}
                    alt=""
                    className="w-full h-full object-cover blur-xl scale-110 opacity-50 brightness-50"
                />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-2">
                <ImageWithFallback
                    src={heroSnap.url}
                    alt="Hero"
                    className="w-full h-full object-contain shadow-lg rounded-lg relative z-floating-panel"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 z-dropdown pointer-events-none" />

            {snapCount > 1 && (
                <>
                    <button
                        type="button"
                        onClick={onPrev}
                        className="absolute top-1/2 left-2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-dropdown transition-all border border-white/10 group-hover:scale-110 active:scale-95 hidden md:block"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-dropdown transition-all border border-white/10 group-hover:scale-110 active:scale-95 hidden md:block"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {heroSnap.status === 'pending' && (
                <div className="absolute top-4 left-4 z-dropdown">
                    <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg border border-amber-300">
                        <Clock className="w-3 h-3" /> In Attesa
                    </span>
                </div>
            )}

            {isAdmin && (
                <div
                    className="absolute top-4 left-4 z-dropdown flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => onDelete(heroSnap)}
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Elimina"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleOfficial(heroSnap);
                        }}
                        className={`p-2 rounded-full shadow-lg transition-transform hover:scale-110 ${
                            heroSnap.isOfficial ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'
                        }`}
                        title={heroSnap.isOfficial ? 'Rendi Community' : 'Promuovi a Official'}
                    >
                        <Trophy className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="absolute top-4 right-4 z-dropdown">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(heroSnap.id);
                    }}
                    className="relative flex items-center justify-center p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-95 hover:bg-black/60 shadow-lg overflow-visible"
                >
                    <Heart
                        className={`w-5 h-5 ${
                            heroStatus?.isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                        }`}
                    />
                    <CountBadge
                        count={heroStatus?.count ?? 0}
                        size="xs"
                        variant="indigo"
                        position="overlay-tr"
                    />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex justify-between items-end z-dropdown pointer-events-none">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-indigo-400">
                            {heroSnap.user.charAt(0)}
                        </div>
                        <span className="text-base font-bold text-white shadow-black drop-shadow-md">
                            {heroSnap.user}
                        </span>
                    </div>
                    {heroSnap.description && (
                        <p className="text-sm md:text-lg text-slate-200 italic font-serif">
                            &quot;{heroSnap.description}&quot;
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);
