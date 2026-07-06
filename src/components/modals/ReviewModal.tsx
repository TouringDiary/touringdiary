import { Z_OVERLAY, Z_MODAL_NESTED, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { Star, Send, PenTool, AlertCircle, Trophy } from 'lucide-react';

import { CloseButton } from '@/components/ui/controls/CloseButton';

import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

import { PointOfInterest, Review } from '../../types/index';

import { useFoundationStyles } from '@/hooks/useFoundationStyles';

import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';

import { useMobileDetect } from '@/hooks/ui/useMobileDetect';



interface ReviewModalProps {

    isOpen: boolean;

    onClose: () => void;

    poi: PointOfInterest;

    onSubmit: (rating: number, criteria: Record<string, number>, comment: string) => void;

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

    criteriaKeys: string[],

): boolean {

    if (comment !== initial.comment) return true;

    return criteriaKeys.some(

        (key) => (criteriaRatings[key] ?? 0) !== (initial.ratings[key] ?? 0),

    );

}



export const ReviewModal = ({ isOpen, onClose, poi, onSubmit, existingReview }: ReviewModalProps) => {

    const [comment, setComment] = useState('');

    const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});

    const [initialState, setInitialState] = useState({ comment: '', ratings: {} as Record<string, number> });

    const [showConfirmClose, setShowConfirmClose] = useState(false);



    const isMobile = useMobileDetect();

    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);

    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);

    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);

    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);

    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);

    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);



    const criteriaList = useMemo(() => getReviewCriteria(poi.category), [poi.category]);

    const criteriaKeys = useMemo(() => criteriaList.map((c) => c.key), [criteriaList]);



    useEffect(() => {

        if (isOpen) {

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

        }

    }, [isOpen, poi, existingReview, criteriaList]);



    const isDirty = isReviewFormDirty(comment, criteriaRatings, initialState, criteriaKeys);

    const handleCloseAttempt = () => {

        if (isDirty) setShowConfirmClose(true);

        else onClose();

    };



    useGlobalModalEscape(

        isOpen,

        showConfirmClose ? () => setShowConfirmClose(false) : handleCloseAttempt,

    );



    const handleRatingChange = (key: string, value: number) => {

        setCriteriaRatings((prev) => ({ ...prev, [key]: value }));

    };



    const handleSubmit = () => {

        const ratings = Object.values(criteriaRatings);

        const average = ratings.reduce((sum, value) => sum + value, 0) / (ratings.length || 1);

        onSubmit(average, criteriaRatings, comment);

        onClose();

    };



    if (!isOpen) return null;



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

                                <h3 id="review-confirm-close-title" className={modalTitleShell}>Dati non salvati</h3>

                                <p id="review-confirm-close-desc" className={`${modalSubtitleShell} mt-1`}>Vuoi uscire senza pubblicare?</p>

                            </div>

                            <div className="flex gap-3 w-full">

                                <button

                                    type="button"

                                    onClick={() => onClose()}

                                    className="flex-1 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-bold text-xs uppercase"

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

            >

                <CloseButton

                    onClose={handleCloseAttempt}

                    variant="primary"

                    position="absolute"

                    className={`${closeOffsetShell} z-local-overlay`}

                />



                <div className={`${bodyShell} min-h-0`}>

                    <div className="flex justify-between items-center mb-6 pr-10">

                        <div>

                            <h3 id="review-modal-title" className={`${modalTitleShell} flex items-center gap-2`}>

                                {existingReview ? <PenTool className="w-5 h-5 text-amber-500" aria-hidden /> : <Star className="w-5 h-5 text-amber-500" aria-hidden />}

                                {existingReview ? 'Modifica' : 'Scrivi'} Recensione

                            </h3>

                            <p id="review-modal-desc" className={`${modalSubtitleShell} mt-1`}>{poi.name}</p>

                        </div>

                    </div>



                    <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 mb-6">

                        <div className="bg-amber-500/20 p-1.5 rounded-full"><Trophy className="w-4 h-4 text-amber-500" aria-hidden /></div>

                        <div>

                            <p className="text-xs font-bold text-white">Guadagna Punti XP</p>

                            <p className="text-[10px] text-slate-300">

                                <strong className="text-amber-400">+10 XP</strong> per il voto, <strong className="text-emerald-400">+20 XP</strong> se scrivi una recensione utile (min. 10 parole).

                            </p>

                        </div>

                    </div>



                    <div className="space-y-6">

                        <div className="space-y-4">{criteriaList.map(c => (<div key={c.key} className="flex items-center justify-between"><span className="text-sm font-bold text-slate-300">{c.label}</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => handleRatingChange(c.key, star)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded transition-transform active:scale-90"><Star className={`w-6 h-6 ${(criteriaRatings[c.key] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} aria-hidden /></button>))}</div></div>))}</div>

                        <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-slate-500">La tua esperienza</label><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none text-sm resize-none" placeholder="Racconta la tua visita..."></textarea></div>

                        <button type="button" onClick={handleSubmit} disabled={Object.values(criteriaRatings).some(v => v === 0)} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"><Send className="w-4 h-4" aria-hidden /> {existingReview ? 'Aggiorna' : 'Pubblica'}</button>

                    </div>

                </div>

            </div>

        </div>,

        document.body

    );

};


