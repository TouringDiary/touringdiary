
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { CloseButton } from '../../common/CloseButton';
import { LightboxData } from '../../../types/index';
import { useInteraction } from '../../../context/InteractionContext';

interface Props {
    data: LightboxData | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
}

export const GalleryLightbox = ({ data, onClose, onNext, onPrev, hasNext, hasPrev }: Props) => {
    // RIMOSSI: Tutti gli useState (localLikes, isLiked, isVoting) e gli useEffect correlati.
    
    // USARE LE FUNZIONI DEL CONTEXT
    const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
    
    // La gestione della tastiera rimane invariata
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev, hasNext, hasPrev]);
    
    if (!data) return null;

    // LEGGERE I DATI DIRETTAMENTE DAL CONTEXT AD OGNI RENDER
    const { isLiked, count, isLoading } = getPhotoStatus({ 
        id: data.id, 
        likes: data.likes 
    });

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGuest) return;
        togglePhotoHeart(data.id);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center animate-in fade-in-25"
            onClick={onClose}
        >
            <div className="relative w-full h-full max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <ImageWithFallback
                    src={data.url}
                    alt={data.caption || `Foto di ${data.user}`}
                    className="w-full h-full object-contain"
                />
            </div>
            
            <CloseButton onClose={onClose} className="absolute top-4 right-4" />
            
            {hasPrev && <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"><ChevronLeft size={28} /></button>}
            {hasNext && <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20"><ChevronRight size={28} /></button>}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 p-2 px-4 rounded-full text-white">
                <span className="font-semibold">{data.user}</span>
                <div className="w-px h-6 bg-white/20" />
                
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{count}</span>
                    {isLoading ? (
                        <Loader2 className="w-7 h-7 animate-spin text-white" />
                    ) : (
                        <Heart
                            className={`w-7 h-7 cursor-pointer transition-colors ${
                                isLiked ? 'text-red-500 fill-current' : 'text-white hover:text-red-400'
                            }`}
                            onClick={handleLike}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}; 
