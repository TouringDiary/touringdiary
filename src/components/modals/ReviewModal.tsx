
import React, { useState, useEffect } from 'react';
import { X, Star, Send, PenTool, AlertCircle, Trophy } from 'lucide-react';
import { PointOfInterest, Review } from '../../types/index';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; // NEW HOOK

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    poi: PointOfInterest;
    onSubmit: (rating: number, criteria: Record<string, number>, comment: string) => void;
    existingReview?: Review | null; 
}

export const ReviewModal = ({ isOpen, onClose, poi, onSubmit, existingReview }: ReviewModalProps) => {
    const [comment, setComment] = useState('');
    const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
    const [initialState, setInitialState] = useState({ comment: '', ratings: {} as Record<string, number> });
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    
    // 1. Rileva Mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // 2. Hook Stili Dinamici
    const modalTitleStyle = useDynamicStyles('modal_title', isMobile);

    const getCriteria = () => {
        switch (poi.category) {
            case 'food': return [{ key: 'food', label: 'Cibo & Bevande' }, { key: 'service', label: 'Servizio' }, { key: 'atmosphere', label: 'Atmosfera' }];
            case 'monument': case 'nature': return [{ key: 'interest', label: 'Interesse/Bellezza' }, { key: 'maintenance', label: 'Manutenzione' }, { key: 'access', label: 'Accessibilità' }];
            default: return [{ key: 'general', label: 'Valutazione Generale' }];
        }
    };

    const criteriaList = getCriteria();

    useEffect(() => {
        if (isOpen) {
            let initComment = '';
            let initRatings: Record<string, number> = {};
            if (existingReview) {
                initComment = existingReview.text || '';
                criteriaList.forEach(c => { initRatings[c.key] = existingReview.criteria?.[c.key] || existingReview.rating; });
            } else {
                initComment = '';
                criteriaList.forEach(c => initRatings[c.key] = 0);
            }
            setComment(initComment);
            setCriteriaRatings(initRatings);
            setInitialState({ comment: initComment, ratings: initRatings });
            setShowConfirmClose(false);
        }
    }, [isOpen, poi, existingReview]);

    const isDirty = JSON.stringify({ comment, ratings: criteriaRatings }) !== JSON.stringify(initialState);
    const handleCloseAttempt = () => { if (isDirty) setShowConfirmClose(true); else onClose(); };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (showConfirmClose) setShowConfirmClose(false);
                else handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showConfirmClose, isDirty]);

    const handleRatingChange = (key: string, value: number) => { setCriteriaRatings(prev => ({ ...prev, [key]: value })); };
    const handleSubmit = () => { const values: number[] = Object.values(criteriaRatings); const sum = values.reduce((a, b) => a + b, 0); const avg = sum / (values.length || 1); onSubmit(avg, criteriaRatings, comment); onClose(); };

    if (!isOpen) return null;

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[3000] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseAttempt}></div>
             {showConfirmClose && (
                <div className="absolute inset-0 z-[3050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <div className="flex flex-col items-center text-center gap-4">
                            <AlertCircle className="w-8 h-8 text-amber-500"/>
                            <div><h3 className="text-lg font-bold text-white mb-1">Dati non salvati</h3><p className="text-sm text-slate-400">Vuoi uscire senza pubblicare?</p></div>
                            <div className="flex gap-3 w-full"><button onClick={() => onClose()} className="flex-1 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-bold text-xs uppercase">Esci</button><button onClick={() => setShowConfirmClose(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase">Resta</button></div>
                        </div>
                    </div>
                </div>
            )}
            <div className="relative bg-slate-900 w-full max-w-md md:rounded-2xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        {/* DYNAMIC TITLE */}
                        <h3 className={`flex items-center gap-2 ${modalTitleStyle || 'text-xl font-bold text-white'}`}>
                            {existingReview ? <PenTool className="w-5 h-5 text-amber-500"/> : <Star className="w-5 h-5 text-amber-500"/>}
                            {existingReview ? 'Modifica' : 'Scrivi'} Recensione
                        </h3>
                        <p className="text-xs text-slate-400">{poi.name}</p>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={handleCloseAttempt} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-5 h-5"/></button>
                </div>
                
                {/* XP INFO BOX */}
                <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 mb-6">
                    <div className="bg-amber-500/20 p-1.5 rounded-full"><Trophy className="w-4 h-4 text-amber-500"/></div>
                    <div>
                        <p className="text-xs font-bold text-white">Guadagna Punti XP</p>
                        <p className="text-[10px] text-slate-300">
                            <strong className="text-amber-400">+10 XP</strong> per il voto, <strong className="text-emerald-400">+20 XP</strong> se scrivi una recensione utile (min. 10 parole).
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">{criteriaList.map(c => (<div key={c.key} className="flex items-center justify-between"><span className="text-sm font-bold text-slate-300">{c.label}</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => handleRatingChange(c.key, star)} className="focus:outline-none transition-transform active:scale-90"><Star className={`w-6 h-6 ${(criteriaRatings[c.key] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} /></button>))}</div></div>))}</div>
                    <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-slate-500">La tua esperienza</label><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none text-sm resize-none" placeholder="Racconta la tua visita..."></textarea></div>
                    <button onClick={handleSubmit} disabled={Object.values(criteriaRatings).some(v => v === 0)} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"><Send className="w-4 h-4" /> {existingReview ? 'Aggiorna' : 'Pubblica'}</button>
                </div>
            </div>
        </div>
    );
};
