
import React, { useState, useMemo } from 'react';
import { MessageSquare, Star, Users } from 'lucide-react';
import { ShopPartner } from '../../types/index';
import { StarRating } from '../common/StarRating';

interface ShopReviewsProps {
    shop: ShopPartner;
}

export const ShopReviews: React.FC<ShopReviewsProps> = ({ shop }) => {
    const [reviewFilter, setReviewFilter] = useState<'recent' | 'best'>('recent');

    const sortedReviews = useMemo(() => {
        const list = [...(shop.reviews || [])];
        if (reviewFilter === 'best') return list.sort((a, b) => b.rating - a.rating);
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [shop.reviews, reviewFilter]);

    return (
        <div className="h-full flex flex-col p-6 md:p-8 bg-[#050b1a] relative">
            <div className="mb-6 shrink-0">
                {/* STILE UNIFORMATO SUB-HEADER */}
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-500"/> Feedback Community
                </h4>
                {/* STILE UNIFORMATO MAIN-HEADER */}
                <h3 className="text-2xl md:text-3xl font-display font-bold text-amber-500 mb-6 tracking-tight leading-none flex items-center gap-3">
                    Dicono di noi
                </h3>
                
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-inner">
                    <button 
                        onClick={() => setReviewFilter('recent')} 
                        className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reviewFilter === 'recent' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                        Recenti
                    </button>
                    <button 
                        onClick={() => setReviewFilter('best')} 
                        className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reviewFilter === 'best' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                        Migliori
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 -mr-2">
                {sortedReviews.length > 0 ? sortedReviews.map((rev, i) => (
                    <div key={i} className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-600 transition-all shadow-lg group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                                    {rev.author.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-xs">{rev.author}</div>
                                    <div className="flex gap-1 mt-0.5">
                                        <StarRating value={rev.rating} size="w-2.5 h-2.5" />
                                    </div>
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-600 font-mono uppercase bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                {new Date(rev.date).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed italic border-t border-slate-800/50 pt-3 group-hover:text-slate-300 transition-colors">
                            "{rev.text}"
                        </p>
                    </div>
                )) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl">
                        <MessageSquare className="w-8 h-8 text-slate-700 mb-2"/>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Ancora nessuna recensione.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span className="font-bold">{sortedReviews.length} Recensioni</span>
                <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">
                    <Star className="w-3 h-3 fill-current"/> {shop.rating.toFixed(1)} Media
                </div>
            </div>
        </div>
    );
};
