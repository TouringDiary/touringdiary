
import React from 'react';
import { ShopPartner, ShopProduct, PointOfInterest } from '../../types/index';
import { ShopHero } from './ShopHero';
import { ShopBioOverlay } from './ShopBioOverlay';
import { ProductDetailOverlay } from './ProductDetailOverlay';
import { ShopProducts } from './ShopProducts';
import { ShopReviews } from './ShopReviews';
import { ShopInfo } from './ShopInfo';

interface ShopDetailViewProps {
    shop: ShopPartner;
    onBack: () => void;
    onOpenLightbox: (url: string) => void;
    showFullBio: boolean;
    onToggleBio: (v: boolean) => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    selectedProduct: ShopProduct | null;
    onSelectProduct: (p: ShopProduct | null) => void;
}

export const ShopDetailView: React.FC<ShopDetailViewProps> = ({ 
    shop, onBack, onOpenLightbox, showFullBio, onToggleBio, onAddToItinerary,
    selectedProduct, onSelectProduct
}) => {
    return (
        <div className="flex flex-col h-full bg-[#020617] relative overflow-hidden">
            {selectedProduct && <ProductDetailOverlay product={selectedProduct} onClose={() => onSelectProduct(null)} shopName={shop.name} />}

            {/* SCROLLABLE CONTENT - Aggiunto scrollbar-hide-mobile */}
            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide-mobile bg-[#020617] relative">
                {showFullBio ? <ShopBioOverlay shop={shop} onClose={() => onToggleBio(false)} /> : (
                    <>
                        {/* HERO SECTION */}
                        <ShopHero 
                            shop={shop} 
                            onOpenLightbox={onOpenLightbox} 
                            onToggleBio={onToggleBio} 
                        />

                        {/* SPLIT SECTION: PRODUCTS (75%) | REVIEWS (25%) */}
                        <div className="flex flex-col md:flex-row bg-[#020617] border-b border-slate-800 min-h-[400px]">
                            {/* LEFT: PRODUCTS */}
                            <div className="w-full md:w-[75%] border-r border-slate-800 bg-[#020617]">
                                <ShopProducts shop={shop} onSelectProduct={onSelectProduct} />
                            </div>
                            
                            {/* RIGHT: REVIEWS */}
                            <div className="w-full md:w-[25%] bg-[#050b1a]">
                                <ShopReviews shop={shop} />
                            </div>
                        </div>
                        
                        {/* BOTTOM: POLICIES */}
                        <div className="bg-[#020617] p-4 md:p-8">
                             <ShopInfo shop={shop} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};