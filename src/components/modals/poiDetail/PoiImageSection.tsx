
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Plus, MessageSquare, ArrowUpLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import { PointOfInterest, Review, User } from '@/types';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { StarRating } from '../../common/StarRating';
import {
    getReviewsForPoi,
    deleteOwnReview,
    deleteReviewAsAdmin,
} from '../../../services/communityService';
import { supabase } from '../../../services/supabaseClient';
import { getCategoryPlaceholders } from '../../../services/settingsService';
import { resolvePoiDisplayImageUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';
import { galleryDisplayUrls } from '../../../utils/media';
import { showGlobalAlert } from '@/services/ui/toastService';

interface PoiImageSectionProps {
    poi: PointOfInterest;
    isFlipped: boolean;
    setIsFlipped: (v: boolean) => void;
    onToggleItinerary: (poi: PointOfInterest) => void;
    isInItinerary: boolean;
    user: User;
    onOpenAuth: () => void;
    onOpenReview: () => void;
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
        const { data } = await supabase
            .from('pois')
            .select('rating')
            .eq('id', poi.id)
            .maybeSingle();
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
    const writeLabel = myReview ? 'Modifica Recensione' : 'Scrivi Recensione';
    const deleteAsAuthor = Boolean(
        deleteTarget && !isGuest && deleteTarget.authorId === user.id
    );

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
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                    <ImageWithFallback
                        src={images[currentImageIndex]}
                        alt={poi.name}
                        category={poi.category}
                        className="w-full h-full object-cover opacity-90"
                        priority={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>

                    <div className="absolute top-4 right-4 z-dropdown">
                        <button
                            onClick={() => onToggleItinerary(poi)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform hover:scale-105 active:scale-95 border ${isInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}
                        >
                            {isInItinerary ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isInItinerary ? 'Aggiunto' : 'Aggiungi'}
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-end gap-4 text-white z-dropdown">
                        <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[70px] shadow-2xl">
                            <span className="text-2xl font-black leading-none">{ratingLabel}</span>
                            <StarRating value={displayRating} size="w-3 h-3" showValue={false} />
                        </div>
                        <button
                            onClick={() => setIsFlipped(true)}
                            className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center gap-2 border border-indigo-400 backdrop-blur-md mb-1"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> RECENSIONI
                        </button>
                    </div>

                    {images.length > 1 && (
                        <div className="absolute inset-x-4 top-1/2 -translate-x-1/2 flex justify-between pointer-events-none z-dropdown">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);
                                }}
                                className="p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 pointer-events-auto transition-all"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex((p) => (p + 1) % images.length);
                                }}
                                className="p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 pointer-events-auto transition-all"
                            >
                                <ChevronRight className="w-6 h-6" />
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
                                            <div className="flex items-start gap-1 shrink-0">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-600 font-mono block">
                                                        {formatReviewDate(rev.date)}
                                                    </span>
                                                    {rev.updatedAt && (
                                                        <span className="text-[9px] text-amber-500/90 font-medium block mt-0.5">
                                                            Modificata il {formatReviewDate(rev.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        title={isMine ? 'Elimina recensione' : 'Rimuovi recensione'}
                                                        aria-label={isMine ? 'Elimina recensione' : 'Rimuovi recensione'}
                                                        onClick={() => setDeleteTarget(rev)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
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
                    <div className="p-4 border-t border-slate-800 bg-slate-900">
                        <button
                            onClick={() => {
                                if (isGuest) onOpenAuth();
                                else onOpenReview();
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg flex items-center justify-center gap-2 border border-emerald-500 transition-all"
                        >
                            <Pencil className="w-4 h-4" /> {writeLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
