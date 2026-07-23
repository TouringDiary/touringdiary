import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Edit2, PenTool, Trash2, Loader2 } from 'lucide-react';
import { PremadeItinerary, Review, User } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import {
    getUnifiedReviews,
    saveUnifiedReview,
    getUserReviewForItinerary,
    deleteOwnReview,
} from '../../services/communityService';
import { ReviewModal } from '../modals/ReviewModal';
import { evaluateCachedFeatureFlag } from '@/domain/platformControl/platformFlagCache';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';

interface Props {
    itinerary: PremadeItinerary;
    onBack: () => void;
    user?: User;
}

function formatReviewDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export const ItineraryReviews = ({ itinerary, onBack, user }: Props) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const refreshLocalReviews = async () => {
        const all = await getUnifiedReviews();
        setReviews(all.filter((r) => r.itineraryId === itinerary.id && r.status === 'approved'));
    };

    useEffect(() => {
        void refreshLocalReviews();
    }, [itinerary.id]);

    const isGuest = !user || user.role === 'guest';

    const myReview = useMemo(() => {
        if (!user) return null;
        return reviews.find((r) => r.authorId === user.id) ?? null;
    }, [reviews, user]);

    const handleAddReview = async (
        rating: number,
        criteria: Record<string, number>,
        comment: string
    ) => {
        if (!user) {
            throw new Error('Devi accedere per pubblicare una recensione.');
        }

        const reviewsFlag = evaluateCachedFeatureFlag(
            PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS,
            {
                userRole: user.role,
                isAuthenticated: true,
            }
        );
        if (reviewsFlag && !reviewsFlag.enabled) {
            throw new Error('L’invio di nuove recensioni è temporaneamente disabilitato.');
        }

        await saveUnifiedReview({
            author: user.name,
            authorId: user.id,
            rating,
            text: comment,
            criteria,
            itineraryId: itinerary.id,
        });
        await refreshLocalReviews();
        setEditingReview(null);
    };

    const openWriteOrEdit = async () => {
        if (isGuest || !user) return;
        const existing =
            myReview ?? (await getUserReviewForItinerary(itinerary.id, user.id));
        setEditingReview(existing);
        setShowReviewModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !user) return;
        setIsDeleting(true);
        try {
            await deleteOwnReview(deleteTarget.id, user.id);
            setDeleteTarget(null);
            await refreshLocalReviews();
        } catch {
            alert('Impossibile eliminare la recensione.');
        } finally {
            setIsDeleting(false);
        }
    };

    const displayedReviews = reviews;

    return (
        <div className="absolute inset-0 bg-[#0f172a] flex flex-col">
            {deleteTarget && (
                <div className="absolute inset-0 z-local-overlay bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
                        <h4 className="text-white font-bold text-sm">Eliminare la tua recensione?</h4>
                        <p className="text-xs text-slate-400">L&apos;azione non può essere annullata.</p>
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
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-950">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Recensioni & Community
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-6 shadow-lg">
                    <div className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-600">
                            <ImageWithFallback
                                src={itinerary.coverImage}
                                alt={itinerary.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm leading-tight mb-1">
                                {itinerary.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                                <StarRating value={itinerary.rating} size="w-3 h-3" />
                                <span className="text-slate-400">({itinerary.votes})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                {itinerary.durationDays} Giorni • {itinerary.mainCity}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Esperienze
                    </h4>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                        {displayedReviews.length}
                    </span>
                </div>

                <div className="space-y-3">
                    {displayedReviews.length > 0 ? (
                        displayedReviews.map((review) => {
                            const isMine = user && review.authorId === user.id;
                            return (
                                <div
                                    key={review.id}
                                    className={`bg-slate-900/50 p-3 rounded-lg border border-slate-800 ${isMine ? 'border-amber-500/20 bg-amber-900/10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white">
                                                {review.author.charAt(0)}
                                            </div>
                                            <span
                                                className={`text-xs font-bold ${isMine ? 'text-amber-400' : 'text-slate-300'}`}
                                            >
                                                {review.author} {isMine && '(Tu)'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-right">
                                                <span className="text-[9px] text-slate-600 block">
                                                    {formatReviewDate(review.date)}
                                                </span>
                                                {review.updatedAt && (
                                                    <span className="text-[8px] text-amber-500 block">
                                                        Modificata il {formatReviewDate(review.updatedAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {isMine && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingReview(review);
                                                            setShowReviewModal(true);
                                                        }}
                                                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                                        title="Modifica"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(review)}
                                                        className="p-1 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                        title="Elimina"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-1 flex justify-between items-center">
                                        <StarRating value={review.rating} size="w-2.5 h-2.5" />
                                    </div>
                                    <p className="text-xs text-slate-400 italic">&quot;{review.text}&quot;</p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg">
                            Ancora nessuna recensione.
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                <button
                    onClick={() => {
                        void openWriteOrEdit();
                    }}
                    disabled={isGuest}
                    className={`w-full py-3 font-bold rounded-xl text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${isGuest ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}
                >
                    <PenTool className="w-4 h-4" />{' '}
                    {isGuest
                        ? 'Login richiesto per recensire'
                        : myReview
                          ? 'Modifica Recensione'
                          : 'Scrivi Recensione'}
                </button>
            </div>

            {showReviewModal && (
                <ReviewModal
                    isOpen={true}
                    onClose={() => setShowReviewModal(false)}
                    poi={{
                        id: itinerary.id,
                        name: itinerary.title,
                        category: 'monument',
                        description: '',
                        imageUrl: '',
                        rating: 0,
                        votes: 0,
                        coords: { lat: 0, lng: 0 },
                    }}
                    onSubmit={handleAddReview}
                    existingReview={editingReview}
                />
            )}
        </div>
    );
};
