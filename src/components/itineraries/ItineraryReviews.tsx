import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Star, Clock, Edit2, CheckCircle, XCircle, Ban, PenTool } from 'lucide-react';
import { PremadeItinerary, Review, User } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { getUnifiedReviews, saveUnifiedReview, updateUnifiedReviewStatus } from '../../services/communityService';
import { ReviewModal } from '../modals/ReviewModal';

interface Props {
    itinerary: PremadeItinerary;
    onBack: () => void;
    user?: User;
}

export const ItineraryReviews = ({ itinerary, onBack, user }: Props) => {
    // Fix: Unified reviews are now async, refactored to use useEffect for data fetching
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    const refreshLocalReviews = async () => {
        const all = await getUnifiedReviews();
        setReviews(all.filter(r => r.itineraryId === itinerary.id));
    };

    useEffect(() => {
        refreshLocalReviews();
    }, [itinerary.id]);

    const isGuest = !user || user.role === 'guest';

    const handleAddReview = async (rating: number, criteria: any, comment: string) => {
        if (!user) return;
        const reviewId = editingReview ? editingReview.id : `itn-rev-${Date.now()}`;
        const newReview: any = {
            id: reviewId,
            author: user.name,
            authorId: user.id,
            rating,
            date: new Date().toISOString(),
            text: comment,
            criteria,
            itineraryId: itinerary.id,
            status: 'pending'
        };
        // Fix: calling the correct service method
        await saveUnifiedReview(newReview);
        await refreshLocalReviews();
        setShowReviewModal(false);
        setEditingReview(null);
    };

    const displayedReviews = useMemo(() => {
        return reviews.filter(r => {
            if (r.status === 'approved') return true;
            if (user && r.author === user.name && r.status === 'pending') return true;
            return false;
        });
    }, [reviews, user]);

    return (
        <div className="absolute inset-0 bg-[#0f172a] flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-950">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5"/>
                </button>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Recensioni & Community</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-6 shadow-lg">
                    <div className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-600">
                            <ImageWithFallback src={itinerary.coverImage} alt={itinerary.title} className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm leading-tight mb-1">{itinerary.title}</h4>
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
                        <MessageSquare className="w-4 h-4"/> Esperienze
                    </h4>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                        {displayedReviews.length}
                    </span>
                </div>

                <div className="space-y-3">
                    {displayedReviews.length > 0 ? displayedReviews.map((review, idx) => {
                        const isMine = user && review.author === user.name;
                        const isPending = review.status === 'pending';
                        return (
                            <div key={idx} className={`bg-slate-900/50 p-3 rounded-lg border border-slate-800 ${isMine ? 'border-amber-500/20 bg-amber-900/10' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white">{review.author.charAt(0)}</div>
                                        <span className={`text-xs font-bold ${isMine ? 'text-amber-400' : 'text-slate-300'}`}>{review.author} {isMine && '(Tu)'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-600">{new Date(review.date).toLocaleDateString()}</span>
                                        {isMine && <button onClick={() => { setEditingReview(review); setShowReviewModal(true); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Edit2 className="w-3 h-3"/></button>}
                                    </div>
                                </div>
                                <div className="mb-1 flex justify-between items-center">
                                    <StarRating value={review.rating} size="w-2.5 h-2.5" />
                                    {isPending && <span className="text-[8px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 uppercase"><Clock className="w-2.5 h-2.5"/> In attesa</span>}
                                </div>
                                <p className="text-xs text-slate-400 italic">"{review.text}"</p>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg">Ancora nessuna recensione.</div>
                    )}
                </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                <button onClick={() => { if (!isGuest) { setEditingReview(null); setShowReviewModal(true); } }} disabled={isGuest} className={`w-full py-3 font-bold rounded-xl text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${isGuest ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}>
                    <PenTool className="w-4 h-4"/> {isGuest ? 'Login richiesto per recensire' : 'Scrivi Recensione'}
                </button>
            </div>

            {showReviewModal && (
                <ReviewModal isOpen={true} onClose={() => setShowReviewModal(false)} poi={{ id: itinerary.id, name: itinerary.title, category: 'monument', description: '', imageUrl: '', rating: 0, votes: 0, coords: {lat:0,lng:0} }} onSubmit={handleAddReview} existingReview={editingReview} />
            )}
        </div>
    );
};