
import React, { useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ShopPartner, ShopProduct } from '../../types/index';
import { DraggableSlider, DraggableSliderHandle } from '../common/DraggableSlider';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ShopProductsProps {
    shop: ShopPartner;
    onSelectProduct: (product: ShopProduct) => void;
}

export const ShopProducts: React.FC<ShopProductsProps> = ({ shop, onSelectProduct }) => {
    const productsRef = useRef<DraggableSliderHandle>(null);

    // Mappa la categoria dello shop a una delle chiavi placeholder specifiche
    const getPlaceholderCategory = () => {
        if (shop.category === 'gusto') return 'shop_gusto';
        if (shop.category === 'cantina') return 'shop_cantina';
        if (shop.category === 'artigianato') return 'shop_artigianato';
        if (shop.category === 'moda') return 'shop_moda';
        return 'shop'; // Fallback
    };
    
    const placeholderCat = getPlaceholderCategory();

    return (
        <div className="flex flex-col h-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    {/* STILE UNIFORMATO SUB-HEADER */}
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500"/> Marketplace
                    </h4>
                    {/* STILE UNIFORMATO MAIN-HEADER */}
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-amber-500 tracking-tight leading-none">I nostri prodotti</h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => productsRef.current?.scroll('left')} className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronLeft className="w-4 h-4"/></button>
                    <button onClick={() => productsRef.current?.scroll('right')} className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronRight className="w-4 h-4"/></button>
                </div>
            </div>

            <div className="flex-1 min-w-0 relative">
                {shop.products.length > 0 ? (
                    <DraggableSlider ref={productsRef} className="h-full gap-5 pb-4 pt-4">
                        {shop.products.map((product, idx) => (
                            <div key={product.id || `prod-${idx}`} onClick={() => onSelectProduct(product)} className="snap-start shrink-0 w-52 md:w-64 h-64 md:h-80 flex flex-col group cursor-pointer relative transition-all hover:-translate-y-2">
                                <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 relative bg-slate-900 shadow-xl group-hover:shadow-2xl group-hover:border-indigo-500/50 transition-all flex flex-col">
                                    <div className="h-[60%] overflow-hidden relative">
                                        <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" category={placeholderCat}/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                                        <div className="absolute top-3 right-3 bg-white text-black p-2 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                            <Plus className="w-4 h-4 font-bold"/>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-5 flex flex-col justify-between bg-slate-900 relative z-10">
                                        <div>
                                            {/* Font aumentato: text-xl (era text-lg) per richiesta utente */}
                                            <h5 className="text-xl font-bold text-white font-display leading-tight mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">{product.name}</h5>
                                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{product.description}</p>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-slate-800 pt-3 mt-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">PREZZO</span>
                                            <span className="text-xl font-mono font-black text-indigo-400">€{(product.price || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </DraggableSlider>
                ) : (
                    <div className="flex items-center justify-center w-full h-64 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nessun prodotto.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
