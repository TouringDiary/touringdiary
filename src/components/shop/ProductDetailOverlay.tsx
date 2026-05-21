import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Truck, MessageCircle } from 'lucide-react';
import { ShopProduct } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface ProductDetailOverlayProps {
    product: ShopProduct;
    onClose: () => void;
    shopName: string;
}

export const ProductDetailOverlay: React.FC<ProductDetailOverlayProps> = ({ product, onClose, shopName }) => {
    
    useGlobalModalEscape(!!product, onClose);

    return createPortal(
        <div 
            className="td-modal-overlay pointer-events-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300"
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div 
                className="relative bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={e => e.stopPropagation()}
            >
                {/* STANDARD RED CLOSE BUTTON */}
                <CloseButton 
                    onClose={onClose} 
                    position="absolute"
                    variant="primary"
                />
                
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
        </div>,
        document.body
    );
};



