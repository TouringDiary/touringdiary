import { Z_OVERLAY, Z_MODAL_NESTED, Z_MODAL } from '@/constants/zIndex';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Star, Send, PenTool, AlertCircle, Trophy, Loader2 } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { PointOfInterest, Review } from '../../types/index';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import {
    PLATFORM_FEATURE_FLAG_KEYS,
    PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '@/constants/platformFeatureFlags';
import { computeReviewAverageRating } from '@/services/community/reviewService';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    poi: PointOfInterest;
    /** Deve risolvere solo a salvataggio riuscito; in errore deve rejectare. */
    onSubmit: (
        rating: number,
        criteria: Record<string, number>,
        comment: string
    ) => void | Promise<void>;
    /**
     * Se fornito, viene chiamato al posto di `onClose` dopo un submit riuscito
     * (es. apertura `reviewSuccess` senza chiudere lo stack con `closeModal`).
     */
    onSubmitSuccess?: () => void;
    existingReview?: Review | null;
}

interface ReviewCriteriaItem {
    key: string;
    label: string;
}

function getReviewCriteria(category: PointOfInterest['category']): ReviewCriteriaItem[] {
    switch (category) {
        case 'food':
            return [
                { key: 'food', label: 'Cibo & Bevande' },
                { key: 'service', label: 'Servizio' },
                { key: 'atmosphere', label: 'Atmosfera' },
            ];
        case 'monument':
        case 'nature':
            return [
                { key: 'interest', label: 'Interesse/Bellezza' },
                { key: 'maintenance', label: 'Manutenzione' },
                { key: 'access', label: 'Accessibilità' },
            ];
        default:
            return [{ key: 'general', label: 'Valutazione Generale' }];
    }
}

function isReviewFormDirty(
    comment: string,
    criteriaRatings: Record<string, number>,
    initial: { comment: string; ratings: Record<string, number> },
    criteriaKeys: string[]
): boolean {
    if (comment !== initial.comment) return true;
    return criteriaKeys.some(
        (key) => (criteriaRatings[key] ?? 0) !== (initial.ratings[key] ?? 0)
    );
}

const REVIEW_SUBMIT_ERROR_FALLBACK =
    'Impossibile salvare la recensione. Controlla la connessione e riprova.';

/** Errori applicativi (`new Error(...)`) vs errori Supabase/PostgREST (proprietà `code`). */
function resolveReviewSubmitError(err: unknown): string {
    if (
        err instanceof Error &&
        !Object.prototype.hasOwnProperty.call(err, 'code')
    ) {
        const message = err.message.trim();
        return message || REVIEW_SUBMIT_ERROR_FALLBACK;
    }
    return REVIEW_SUBMIT_ERROR_FALLBACK;
}

export const ReviewModal = ({
    isOpen,
    onClose,
    poi,
    onSubmit,
    onSubmitSuccess,
    existingReview,
}: ReviewModalProps) => {
    const [comment, setComment] = useState('');
    const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
    const [initialState, setInitialState] = useState({
        comment: '',
        ratings: {} as Record<string, number>,
    });
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const submitLockRef = useRef(false);

    const isMobile = useMobileDetect();
    const reviewsFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS);
    const reviewsEnabled = reviewsFlag?.enabled ?? true;
    const { getText: getPausedMsg } = useSystemMessage(
        PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_REVIEWS_PAUSED
    );

    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    const criteriaList = useMemo(() => getReviewCriteria(poi.category), [poi.category]);
    const criteriaKeys = useMemo(() => criteriaList.map((c) => c.key), [criteriaList]);

    useEffect(() => {
        if (!isOpen) return;

        let initComment = '';
        const initRatings: Record<string, number> = {};

        if (existingReview) {
            initComment = existingReview.text || '';
            criteriaList.forEach((c) => {
                initRatings[c.key] = existingReview.criteria?.[c.key] || existingReview.rating;
            });
        } else {
            criteriaList.forEach((c) => {
                initRatings[c.key] = 0;
            });
        }

        setComment(initComment);
        setCriteriaRatings({ ...initRatings });
        setInitialState({ comment: initComment, ratings: { ...initRatings } });
        setShowConfirmClose(false);
        setIsSubmitting(false);
        setFormError(null);
        submitLockRef.current = false;
    }, [isOpen, poi, existingReview, criteriaList]);

    const isDirty = isReviewFormDirty(comment, criteriaRatings, initialState, criteriaKeys);

    const handleCloseAttempt = () => {
        if (isSubmitting) return;
        if (isDirty) setShowConfirmClose(true);
        else onClose();
    };

    useGlobalModalEscape(
        isOpen && !isSubmitting,
        showConfirmClose ? () => setShowConfirmClose(false) : handleCloseAttempt
    );

    const handleRatingChange = (key: string, value: number) => {
        if (isSubmitting) return;
        setFormError(null);
        setCriteriaRatings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!reviewsEnabled || isSubmitting || submitLockRef.current) return;
        if (Object.values(criteriaRatings).some((v) => v === 0)) return;

        submitLockRef.current = true;
        setFormError(null);
        setIsSubmitting(true);

        const average = computeReviewAverageRating(criteriaRatings);

        try {
            await onSubmit(average, criteriaRatings, comment);
        } catch (err: unknown) {
            setFormError(resolveReviewSubmitError(err));
            setIsSubmitting(false);
            submitLockRef.current = false;
            return;
        }

        // Persistenza OK: la chiusura/transizione non deve apparire come fallimento salvataggio
        // né lasciare il modal bloccato se il callback di successo fallisce.
        try {
            if (onSubmitSuccess) {
                onSubmitSuccess();
            } else {
                onClose();
            }
        } catch {
            try {
                onClose();
            } catch {
                // ignore — sblocchiamo comunque sotto
            }
        } finally {
            setIsSubmitting(false);
            submitLockRef.current = false;
        }
    };

    if (!isOpen) return null;

    const canSubmit =
        reviewsEnabled &&
        !isSubmitting &&
        !Object.values(criteriaRatings).some((v) => v === 0);

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={handleCloseAttempt}
            style={{ zIndex: Z_OVERLAY }}
        >
            {showConfirmClose && (
                <div
                    className={`td-modal-overlay ${overlayShell} !items-center absolute inset-0`}
                    style={{ zIndex: Z_MODAL_NESTED }}
                    onClick={() => setShowConfirmClose(false)}
                >
                    <div
                        className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                        style={{ zIndex: Z_MODAL_NESTED }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-confirm-close-title"
                        aria-describedby="review-confirm-close-desc"
                    >
                        <CloseButton
                            onClose={() => setShowConfirmClose(false)}
                            variant="primary"
                            position="absolute"
                            className={`${closeOffsetShell} z-local-overlay`}
                        />
                        <div className={`${bodyShell} flex flex-col items-center text-center gap-4`}>
                            <AlertCircle className="w-8 h-8 text-amber-500" aria-hidden />
                            <div>
                                <h3 id="review-confirm-close-title" className={modalTitleShell}>
                                    Dati non salvati
                                </h3>
                                <p id="review-confirm-close-desc" className={`${modalSubtitleShell} mt-1`}>
                                    Vuoi uscire senza pubblicare?
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isSubmitting) return;
                                        onClose();
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Esci
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmClose(false)}
                                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase"
                                >
                                    Resta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
                aria-describedby="review-modal-desc"
                aria-busy={isSubmitting}
            >
                <CloseButton
                    onClose={handleCloseAttempt}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                    withEscape={false}
                    disabled={isSubmitting}
                />

                {!reviewsEnabled ? (
                    <div className={`${bodyShell} min-h-0 space-y-3`}>
                        <h3 className={`${modalTitleShell} text-amber-200`}>
                            {getPausedMsg({}).title || 'Recensioni sospese'}
                        </h3>
                        <p className={`${modalSubtitleShell}`}>
                            {getPausedMsg({}).body ||
                                'L’invio di nuove recensioni è temporaneamente disabilitato.'}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold"
                        >
                            Chiudi
                        </button>
                    </div>
                ) : (
                    <div className={`${bodyShell} min-h-0`}>
                        <div className="flex justify-between items-center mb-6 pr-10">
                            <div>
                                <h3
                                    id="review-modal-title"
                                    className={`${modalTitleShell} flex items-center gap-2`}
                                >
                                    {existingReview ? (
                                        <PenTool className="w-5 h-5 text-amber-500" aria-hidden />
                                    ) : (
                                        <Star className="w-5 h-5 text-amber-500" aria-hidden />
                                    )}
                                    {existingReview ? 'Modifica' : 'Scrivi'} Recensione
                                </h3>
                                <p id="review-modal-desc" className={`${modalSubtitleShell} mt-1`}>
                                    {poi.name}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 mb-6">
                            <div className="bg-amber-500/20 p-1.5 rounded-full">
                                <Trophy className="w-4 h-4 text-amber-500" aria-hidden />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Guadagna Punti XP</p>
                                <p className="text-[10px] text-slate-300">
                                    <strong className="text-amber-400">+10 XP</strong> per il voto,{' '}
                                    <strong className="text-emerald-400">+20 XP</strong> se scrivi una
                                    recensione utile (min. 10 parole).
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                {criteriaList.map((c) => (
                                    <div key={c.key} className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-300">{c.label}</span>
                                        <div className="flex gap-1" role="group" aria-label={c.label}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    aria-label={`${c.label}: ${star} stelle`}
                                                    aria-pressed={(criteriaRatings[c.key] || 0) >= star}
                                                    onClick={() => handleRatingChange(c.key, star)}
                                                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Star
                                                        className={`w-6 h-6 ${(criteriaRatings[c.key] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                                                        aria-hidden
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="review-comment"
                                    className="text-[10px] font-bold uppercase text-slate-500"
                                >
                                    La tua esperienza
                                </label>
                                <textarea
                                    id="review-comment"
                                    rows={3}
                                    value={comment}
                                    disabled={isSubmitting}
                                    onChange={(e) => {
                                        setFormError(null);
                                        setComment(e.target.value);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none text-sm resize-none disabled:opacity-60"
                                    placeholder="Racconta la tua visita..."
                                />
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden />
                                    <span className="text-sm font-bold text-red-200">{formError}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                                        Invio in corso…
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" aria-hidden />
                                        {existingReview ? 'Aggiorna' : 'Pubblica'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
