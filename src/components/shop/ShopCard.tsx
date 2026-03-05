
import React, { useState, useEffect } from 'react';
import { Award, MapPin, Star, ArrowRight } from 'lucide-react';
import { ShopPartner } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { calculateShopRank } from '../../services/shopService';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; // NEW HOOK

interface ShopCardProps {
    shop: ShopPartner;
    onOpen: (shop: ShopPartner) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onOpen }) => {
    const rank = calculateShopRank(shop);
    const visibleProducts = shop.products.filter(p => p.status === 'visible');

    // Mappa la categoria dello shop a una delle chiavi placeholder specifiche
    const getPlaceholderCategory = () => {
        if (shop.category === 'gusto') return 'shop_gusto';
        if (shop.category === 'cantina') return 'shop_cantina';
        if (shop.category === 'artigianato') return 'shop_artigianato';
        if (shop.category === 'moda') return 'shop_moda';
        return 'shop'; // Fallback
    };
    
    const placeholderCat = getPlaceholderCategory();

    // 1. Rileva Mobile (Immediato)
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // 2. Hook Stili Dinamici
    const titleStyle = useDynamicStyles('shop_card_title', isMobile);

    return (
        <div className={`bg-[#020617] border rounded-[2rem] overflow-hidden transition-all hover:border-slate-600 group flex h-64 cursor-pointer ${shop.badge === 'gold' ? 'border-amber-500/40 shadow-2xl shadow-amber-900/10 ring-1 ring-amber-500/10' : 'border-slate-800 shadow-xl'}`} onClick={() => onOpen(shop)}>
            <div className="w-1/3 h-full relative overflow-hidden shrink-0 border-r border-slate-800/50">
                <ImageWithFallback src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" category={placeholderCat}/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
                {shop.badge === 'gold' && (
                    <div className="absolute top-6 left-6 bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 uppercase tracking-tighter ring-2 ring-black/30 z-10">
                        <Award className="w-3 h-3"/> SPONSOR
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
                <div className="w-full min-w-0">
                    <div className="flex justify-between items-start mb-4 w-full">
                        <div className="flex-1 min-w-0">
                            {/* DYNAMIC STYLE */}
                            <h4 className={`mb-1 group-hover:text-indigo-400 transition-colors leading-none truncate ${titleStyle}`}>
                                {shop.name}
                            </h4>
                            <div className="flex items-center gap-2 text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">
                                <MapPin className="w-3.5 h-3.5 text-amber-500"/> {shop.address}
                            </div>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex flex-col items-center min-w-[70px] shadow-inner shrink-0 ml-4">
                            <div className="flex items-center gap-1 text-amber-500 font-black text-xl">
                                <Star className="w-4 h-4 fill-current"/>
                                {/* SAFE RATING CHECK */}
                                <span>{(shop.rating || 0).toFixed(1)}</span>
                            </div>
                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Rating</span>
                        </div>
                    </div>
                    {visibleProducts.length > 0 && (
                        <div className="flex gap-2 mt-1 overflow-x-auto no-scrollbar pb-2">
                            {visibleProducts.map(product => (
                                <button key={product.id} onClick={(e) => { e.stopPropagation(); onOpen(shop); }} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 flex flex-col shrink-0 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all text-left group/prod">
                                    <span className="text-[9px] font-black text-white uppercase tracking-tight truncate max-w-[120px] group-hover/prod:text-indigo-300">{product.name}</span>
                                    {/* SAFE PRICE CHECK */}
                                    <span className="text-xs font-mono font-black text-emerald-400">€{(product.price || 0).toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 w-full shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] mb-0.5">Rank TDS</span>
                        <span className="text-indigo-400 font-black font-mono text-base leading-none">#{rank.toFixed(0)}</span>
                    </div>
                    <button onClick={() => onOpen(shop)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] transition-all shadow-xl hover:shadow-indigo-500/30 active:scale-95 flex items-center justify-center">Vedi Bottega <ArrowRight className="w-3.5 h-3.5 ml-2"/></button>
                </div>
            </div>
        </div>
    );
};
