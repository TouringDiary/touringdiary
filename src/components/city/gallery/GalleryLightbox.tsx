
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { useInteraction } from '../../../context/InteractionContext';
import { CloseButton } from '../../common/CloseButton';

export interface LightboxData {
    id: string; 
    url: string;
    user: string;
    likes: number;
    caption?: string;
    date?: string;
}

interface Props {
    data: LightboxData;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

export const GalleryLightbox = ({ data, onClose, onNext, onPrev, hasNext, hasPrev }: Props) => {
    const { hasUserLikedPhoto, togglePhotoHeart, isGuest } = useInteraction();
    
    // Stato locale per feedback immediato (ottimistico)
    const [localLikes, setLocalLikes] = useState(data.likes);
    const [isLiked, setIsLiked] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    // Reset stato quando cambia la foto (navigazione)
    useEffect(() => {
        setIsLiked(hasUserLikedPhoto(data.id));
        setLocalLikes(data.likes);
    }, [data.id, data.likes, hasUserLikedPhoto]);

    // Gestione Tastiera (ESC + Frecce)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
            if (e.key === 'ArrowRight' && onNext && hasNext) {
                e.preventDefault();
                onNext();
            }
            if (e.key === 'ArrowLeft' && onPrev && hasPrev) {
                e.preventDefault();
                onPrev();
            }
        };
        
        // Capture phase per intercettare prima dei modali genitori
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [onClose, onNext, onPrev, hasNext, hasPrev]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (isGuest) return; 
        if (isVoting) return;
        
        setIsVoting(true);
        
        const newIsLiked = !isLiked;
        const newLikes = Math.max(0, localLikes + (newIsLiked ? 1 : -1));
        
        setIsLiked(newIsLiked);
        setLocalLikes(newLikes);

        try {
            const serverCount = await togglePhotoHeart(data.id);
            if (serverCount !== undefined) {
                setLocalLikes(serverCount);
            } else {
                setIsLiked(!newIsLiked);
                setLocalLikes(localLikes);
            }
        } catch (error) {
            setIsLiked(!newIsLiked);
            setLocalLikes(localLikes);
        } finally {
            setIsVoting(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300" onClick={onClose}>
            
            {/* Pulsanti Navigazione (Visibili su Mobile e Desktop) */}
            {hasPrev && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-slate-800/50 hover:bg-slate-700 text-white rounded-full transition-colors border border-white/10 z-[9999]"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8"/>
                </button>
            )}
            
            {hasNext && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-slate-800/50 hover:bg-slate-700 text-white rounded-full transition-colors border border-white/10 z-[9999]"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8"/>
                </button>
            )}

            <div className="relative w-full h-full md:w-[85vw] md:h-[85vh] bg-black md:rounded-3xl overflow-hidden shadow-2xl border-0 md:border border-slate-700 flex flex-col group" onClick={(e) => e.stopPropagation()}>
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/90 to-transparent z-20 flex justify-between items-start pointer-events-none">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-indigo-400">
                                    {data.user.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-xs shadow-black drop-shadow-md leading-none">{data.user}</span>
                                    {data.date && <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{new Date(data.date).toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <div className="w-px h-4 bg-white/20"></div>
                            
                            {/* Interactive Like Button */}
                            <button 
                                onClick={handleLike}
                                className={`flex items-center gap-1.5 font-bold text-xs group transition-all cursor-pointer`}
                            >
                                {isVoting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white"/>
                                ) : (
                                    <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white group-hover:text-rose-400'}`}/>
                                )}
                                <span className={isLiked ? 'text-rose-500' : 'text-white'}>
                                    {localLikes}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Standard Close Button */}
                    <div className="pointer-events-auto z-50">
                        <CloseButton onClose={onClose} size="lg" />
                    </div>
                </div>

                {/* Main Image */}
                <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                     {/* Mobile Navigation Areas (Zone invisibili ai lati per tap facilitato) */}
                     {hasPrev && (
                         <div 
                            className="absolute left-0 top-0 bottom-0 w-16 z-10 md:hidden" 
                            onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}
                         ></div>
                     )}
                     {hasNext && (
                         <div 
                            className="absolute right-0 top-0 bottom-0 w-16 z-10 md:hidden" 
                            onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
                         ></div>
                     )}

                     <ImageWithFallback src={data.url} alt="Fullscreen" className="w-full h-full object-contain" draggable={false}/>
                     
                     {/* DESCRIPTION BOTTOM OVERLAY */}
                     {data.caption && (
                         <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 md:pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-30 flex flex-col justify-end min-h-[120px]">
                            <p className="text-white text-base md:text-xl font-serif italic drop-shadow-md text-center max-w-4xl mx-auto leading-relaxed opacity-95">
                                "{data.caption}"
                            </p>
                         </div>
                     )}
                </div>
            </div>
        </div>,
        document.body
    );
};
