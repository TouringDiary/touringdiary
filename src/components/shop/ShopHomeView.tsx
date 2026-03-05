
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Award, MapPin } from 'lucide-react';
import { ShopPartner, ShopCategory } from '../../types/index';
import { openMap } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface ShopHomeViewProps {
    premiumShops: ShopPartner[];
    categories: { id: ShopCategory, label: string, icon: any, color: string, desc: string }[];
    onSelectCategory: (id: ShopCategory) => void;
    onSelectShop: (shop: ShopPartner) => void;
    onOpenShopSponsor: () => void;
    isSidebarOpen?: boolean;
}

export const ShopHomeView: React.FC<ShopHomeViewProps> = ({
    premiumShops,
    categories,
    onSelectCategory,
    onSelectShop,
    onOpenShopSponsor,
    isSidebarOpen
}) => {
    // Gestione Rotazione Vetrina Locale
    const [activeIndex, setActiveIndex] = useState(0);

    // TESTI DINAMICI DAL DB
    const { getText: getGoldPromo } = useSystemMessage('shop_gold_promo');
    const goldPromo = getGoldPromo();

    useEffect(() => {
        if (premiumShops.length <= 1) return;
        const interval = setInterval(() => setActiveIndex(prev => (prev + 1) % premiumShops.length), 5000);
        return () => clearInterval(interval);
    }, [premiumShops.length]);

    return (
        <div className="md:px-10 pb-12 flex-1 flex flex-col min-h-0 gap-4 md:gap-6 animate-in slide-in-from-bottom-6 duration-700 bg-[#020617]">
            {/* HERO CAROUSEL */}
            <div className="h-64 md:h-[55%] flex flex-col min-h-0 min-w-0">
                <div className="flex items-center gap-3 px-2 mb-3 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse"/>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Vetrina Eccellenze Gold</h3>
                </div>

                <div className="flex-1 relative rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl ring-1 ring-white/5 bg-[#020617]">
                        {premiumShops.length > 0 ? (
                            premiumShops.map((shop, idx) => (
                            <div 
                                key={shop.id || `shop-${idx}`} 
                                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'}`}
                            >
                                <ImageWithFallback 
                                    src={shop.imageUrl} 
                                    alt={shop.name} 
                                    className="w-full h-full object-cover"
                                    priority={idx === activeIndex} // FIX: Priority loading per immagine attiva per evitare Intervention Warning
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-10 flex justify-between items-end">
                                    <div className="max-w-2xl min-w-0">
                                        <div className="flex items-center gap-3 mb-2 md:mb-4">
                                            <span className="bg-amber-500 text-black text-[8px] md:text-[10px] font-black px-2 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg uppercase tracking-tighter border border-amber-400">SPONSOR</span>
                                            <span className="bg-white/10 backdrop-blur-xl text-white text-[7px] md:text-[9px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/20 uppercase">{shop.category}</span>
                                        </div>
                                        <h4 className="text-lg md:text-5xl font-display font-bold text-white mb-1 md:mb-4 leading-none tracking-tighter drop-shadow-2xl truncate">{shop.name}</h4>
                                        <button onClick={() => openMap(shop.coords.lat, shop.coords.lng)} className="text-slate-300 text-[10px] md:text-2xl font-medium opacity-90 flex items-center gap-1 md:gap-3 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"><MapPin className="w-3 h-3 md:w-6 md:h-6 text-indigo-400"/> {shop.address}</button>
                                    </div>
                                    <button onClick={() => onSelectShop(shop)} className="hidden md:flex items-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] px-10 py-6 rounded-[2rem] transition-all shadow-2xl transform active:scale-95 shrink-0">Entra in Bottega <ArrowRight className="w-8 h-8"/></button>
                                </div>
                            </div>
                        ))
                        ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" onClick={onOpenShopSponsor}>
                                <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-900/20 hover:bg-slate-900/40 transition-colors group cursor-pointer">
                                <div className="p-5 bg-amber-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform border border-amber-500/20"><Award className="w-16 h-16 text-amber-500" /></div>
                                <h4 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                                    {goldPromo.title}
                                </h4>
                                <span className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all transform active:scale-95 flex items-center gap-2">
                                    {goldPromo.body} <ArrowRight className="w-4 h-4"/>
                                </span>
                                </div>
                        </div>
                        )}
                </div>
            </div>

            {/* CATEGORY GRID */}
            <div className="flex-1 md:h-[27%] min-h-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-6 h-full pb-2">
                    {categories.map((cat, idx) => (
                        <button key={cat.id || `cat-${idx}`} onClick={() => onSelectCategory(cat.id)} className="group relative bg-slate-900 border border-slate-800 rounded-[2rem] flex items-stretch transition-all hover:border-indigo-500/50 hover:bg-slate-800 hover:-translate-y-1 shadow-lg h-full overflow-hidden text-left">
                            <div className={`w-10 md:w-24 bg-[#020617] border-r border-slate-800 flex items-center justify-center p-0 shrink-0 ${cat.color}`}><cat.icon className="w-full h-full p-3 md:p-7 transition-transform group-hover:scale-110" strokeWidth={1.5} /></div>
                            <div className="flex flex-col justify-center px-2 md:px-8 items-start min-w-0"><h5 className={`text-xs ${isSidebarOpen ? 'md:text-xl' : 'md:text-4xl'} font-bold text-white font-display leading-none truncate w-full`}>{cat.label}</h5><p className="text-[7px] md:text-[11px] text-slate-300 uppercase font-black tracking-widest leading-tight mt-1 md:mt-3 opacity-90 line-clamp-1">{cat.desc}</p></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
