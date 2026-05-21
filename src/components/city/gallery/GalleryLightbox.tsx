import { Z_LIGHTBOX } from '@/constants/zIndex';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useInteraction } from '../../../context/InteractionContext';

export interface LightboxData {
    id: string;
    url: string;
    user: string;
    likes: number;
    caption?: string;
    date: string;
    likedByUser?: boolean;
}

interface Props {
    data: LightboxData | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
    allPhotos?: any[];
    currentIndex?: number;
    onGoToPhoto?: (idx: number) => void;
}

export const GalleryLightbox = ({ data, onClose, onNext, onPrev, hasNext, hasPrev, allPhotos = [], currentIndex = 0, onGoToPhoto }: Props) => {
    
    // USARE LE FUNZIONI DEL CONTEXT
    const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
    
    useGlobalModalEscape(!!data, onClose);

    // BLOCK BODY SCROLL - Task 3
    useEffect(() => {
        if (data) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [data]);

    // Navigation shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, hasNext, hasPrev]);

    const thumbnailRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll thumbnails to keep current in view
    useEffect(() => {
        if (thumbnailRef.current && currentIndex !== undefined) {
            const activeThumb = thumbnailRef.current.children[currentIndex] as HTMLElement;
            if (activeThumb) {
                thumbnailRef.current.scrollTo({
                    left: activeThumb.offsetLeft - thumbnailRef.current.offsetWidth / 2 + activeThumb.offsetWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentIndex]);

    if (!data) return null;

    const { isLiked, count, isLoading } = getPhotoStatus({
        id: data.id,
        likes: data.likes,
        likedByUser: data.likedByUser
    });

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGuest || !data?.id) return;
        togglePhotoHeart(data.id);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/98 flex flex-col items-center justify-between animate-in fade-in-25 pointer-events-auto overflow-hidden"
            onClick={onClose}
            style={{ zIndex: Z_LIGHTBOX }}
        >
            {/* Header / Close */}
            <div className="w-full flex justify-end p-4 shrink-0">
                <CloseButton onClose={onClose} variant="primary" />
            </div>

            {/* Main Content Area */}
            <div className="relative flex-1 w-full flex items-center justify-center p-2 md:p-6 min-h-0" onClick={e => e.stopPropagation()}>
                <div className="relative w-full h-full flex items-center justify-center">
                    <ImageWithFallback
                        src={data.url}
                        alt={data.caption || `Foto di ${data.user}`}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
                    />
                </div>
                
                {hasPrev && (
                    <button onClick={onPrev} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md border border-white/10 hidden md:block group">
                        <ChevronLeft size={32} className="text-white group-active:scale-90 transition-transform"/>
                    </button>
                )}
                {hasNext && (
                    <button onClick={onNext} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md border border-white/10 hidden md:block group">
                        <ChevronRight size={32} className="text-white group-active:scale-90 transition-transform"/>
                    </button>
                )}
            </div>

            {/* Footer / Meta / Thumbnails */}
            <div className="w-full flex flex-col items-center gap-4 p-4 pb-8 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent" onClick={e => e.stopPropagation()}>
                
                {/* Thumbnails Carousel - Task 3 */}
                {allPhotos && allPhotos.length > 1 && (
                    <div 
                        ref={thumbnailRef}
                        className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-2xl px-4 py-2 snap-x"
                    >
                        {allPhotos.map((p, idx) => (
                            <button 
                                key={p.id}
                                onClick={() => onGoToPhoto?.(idx)}
                                className={`snap-center shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-amber-500 scale-110 shadow-lg ring-4 ring-amber-500/20' : 'border-white/10 opacity-30 hover:opacity-100 hover:border-white/30'}`}
                            >
                                <img src={p.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Info Bar */}
                <div className="flex items-center gap-6 bg-slate-900/90 p-2.5 px-6 rounded-full text-white backdrop-blur-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col items-start leading-tight">
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5">Contributor</span>
                        <span className="font-bold text-sm tracking-wide text-slate-100">{data.user}</span>
                    </div>
                    
                    <div className="w-px h-8 bg-white/10" />

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center leading-tight">
                            <span className="font-black text-lg text-white">{count}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Apprezzamenti</span>
                        </div>
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        ) : (
                            <button 
                                onClick={handleLike}
                                className={`p-2.5 rounded-full transition-all transform active:scale-90 ${isLiked ? 'bg-red-500/20 text-red-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
                
                {data.caption && (
                    <p className="text-[10px] text-slate-400 font-medium max-w-md text-center italic line-clamp-1 opacity-60">"{data.caption}"</p>
                )}
            </div>
        </div>,
        document.body
    );
};
