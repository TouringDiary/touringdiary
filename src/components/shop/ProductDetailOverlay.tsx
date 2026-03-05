
import React, { useEffect, useRef } from 'react';
import { X, MapPin, Truck, MessageCircle } from 'lucide-react';
import { ShopProduct } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ProductDetailOverlayProps {
    product: ShopProduct;
    onClose: () => void;
    shopName: string;
}

export const ProductDetailOverlay: React.FC<ProductDetailOverlayProps> = ({ product, onClose, shopName }) => {
    
    // Pattern useRef per stabilizzare il listener
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { 
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onCloseRef.current(); 
            }
        };
        window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, []); // Empty Deps

    return (
        // FIX: 'fixed' invece di 'absolute' per centrare rispetto alla finestra, non al contenitore genitore
        // Z-Index 3000 per stare sopra alla UserDashboard (che è 2000)
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Overlay cliccabile per chiudere */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] z-10">
                {/* STANDARD RED CLOSE BUTTON */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg z-[160]">
                    <X className="w-5 h-5"/>
                </button>
                
                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-black relative shrink-0 h-64 md:h-auto">
                    <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50 md:hidden"></div>
                </div>
                
                {/* Content Section */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto custom-scrollbar bg-slate-900">
                    <div className="space-y-6">
                        <div>
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">{shopName}</span>
                            <h3 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight tracking-tight">{product.name}</h3>
                        </div>

                        <div className="flex items-center gap-4 py-4 border-y border-slate-800">
                            <span className="text-3xl font-mono font-black text-emerald-400">€{(product.price || 0).toFixed(2)}</span>
                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${product.shippingMode === 'pickup' ? 'bg-amber-900/20 border-amber-500/30 text-amber-500' : 'bg-indigo-900/20 border-indigo-500/30 text-indigo-400'}`}>
                                {product.shippingMode === 'pickup' ? <MapPin className="w-3.5 h-3.5"/> : <Truck className="w-3.5 h-3.5"/>}
                                {product.shippingMode === 'pickup' ? 'Solo Ritiro' : 'Spedizione OK'}
                            </div>
                        </div>

                        <div className="prose prose-invert prose-sm">
                             <p className="text-slate-300 leading-relaxed font-serif italic text-base">"{product.description}"</p>
                        </div>
                        
                        <div className="pt-4">
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3">
                                <MessageCircle className="w-5 h-5"/> Contatta Bottega
                            </button>
                            <p className="text-center text-[10px] text-slate-500 mt-3">Non vincolante. Apre una chat diretta col venditore.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
